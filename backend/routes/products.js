const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth, authorize, requireClientCode } = require('../middleware/auth');
const { upload, deleteImage, extractPublicId, generateResponsiveUrls } = require('../config/cloudinary');
const { generateProductSlug } = require('../utils/imageUtils');

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products
// @access  Private
router.get('/', [auth, requireClientCode], async (req, res) => {
  try {
    const { Product, Category, Inventory } = req.models;
    
    const { 
      page = 1, 
      limit = 10, 
      search, 
      category, 
      isActive,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const query = {};
    const sort = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const products = await Product.find(query)
      .populate('category', 'name')
      .populate('createdBy', 'name email')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/products/:id
// @desc    Get product by ID
// @access  Private
router.get('/:id', [auth, requireClientCode], async (req, res) => {
  try {
    const { Product, Inventory } = req.models;
    
    const product = await Product.findById(req.params.id)
      .populate('category', 'name description')
      .populate('createdBy', 'name email');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Get inventory information for all warehouses
    const inventory = await Inventory.find({ product: product._id })
      .populate('warehouse', 'name code');

    res.json({
      ...product.toObject(),
      inventory
    });
  } catch (error) {
    console.error(error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid product ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/products
// @desc    Create new product
// @access  Private (Admin/Manager/Staff)
router.post('/', [
  auth,
  requireClientCode,
  authorize('admin', 'manager', 'staff'),
  (req, res, next) => {
    // Set product slug before multer processes files
    if (req.body.name || req.body.sku) {
      req.body.productSlug = generateProductSlug(req.body.name, req.body.sku);
    }
    next();
  },
  upload.array('productImages', 10), // Handle up to 10 images
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('sku').trim().notEmpty().withMessage('SKU is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('costPrice').isNumeric().withMessage('Cost price must be a number'),
  body('sellingPrice').isNumeric().withMessage('Selling price must be a number'),
  body('unit').isIn(['piece', 'kg', 'liter', 'meter', 'box', 'dozen']).withMessage('Invalid unit')
], async (req, res) => {
  try {
    const { Product, Category } = req.models;
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const {
      name, sku, description, category, brand, unit,
      costPrice, sellingPrice, minStockLevel, maxStockLevel,
      reorderLevel, barcode, weight, dimensions
    } = req.body;

    // Handle images from multer upload
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => ({
        url: file.path,
        publicId: file.filename,
        originalName: file.originalname,
        size: file.size,
        responsiveUrls: generateResponsiveUrls(file.filename)
      }));
    }

    // Handle additional images from request body (if any)
    if (req.body.additionalImages) {
      try {
        const additionalImages = JSON.parse(req.body.additionalImages);
        if (Array.isArray(additionalImages)) {
          images = [...images, ...additionalImages];
        }
      } catch (error) {
        console.error('Error parsing additional images:', error);
      }
    }

    // Check if category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    // Check if SKU already exists
    const existingProduct = await Product.findOne({ 
      sku: { $regex: `^${sku}$`, $options: 'i' } 
    });

    if (existingProduct) {
      return res.status(400).json({ message: 'SKU already exists' });
    }

    // Check if barcode already exists (if provided)
    if (barcode) {
      const existingBarcode = await Product.findOne({ barcode });
      if (existingBarcode) {
        return res.status(400).json({ message: 'Barcode already exists' });
      }
    }

    const product = new Product({
      name,
      sku: sku.toUpperCase(),
      slug: req.body.productSlug || generateProductSlug(name, sku),
      description,
      category,
      brand,
      unit,
      costPrice,
      sellingPrice,
      minStockLevel,
      maxStockLevel,
      reorderLevel,
      images,
      barcode,
      weight,
      dimensions,
      createdBy: req.user.id
    });

    await product.save();
    await product.populate([
      { path: 'category', select: 'name' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private (Admin/Manager/Staff)
router.put('/:id', [
  auth,
  requireClientCode,
  authorize('admin', 'manager', 'staff'),
  upload.array('productImages', 10), // Handle up to 10 new images
  body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty'),
  body('sku').optional().trim().notEmpty().withMessage('SKU cannot be empty'),
  body('costPrice').optional().isNumeric().withMessage('Cost price must be a number'),
  body('sellingPrice').optional().isNumeric().withMessage('Selling price must be a number'),
  body('unit').optional().isIn(['piece', 'kg', 'liter', 'meter', 'box', 'dozen']).withMessage('Invalid unit')
], async (req, res) => {
  try {
    const { Product, Category } = req.models;
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const updateFields = { ...req.body };
    
    // Handle new images from multer upload
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => ({
        url: file.path,
        publicId: file.filename,
        originalName: file.originalname,
        size: file.size,
        responsiveUrls: generateResponsiveUrls(file.filename)
      }));

      // Get existing product to merge images
      const existingProduct = await Product.findById(req.params.id);
      if (existingProduct) {
        updateFields.images = [...(existingProduct.images || []), ...newImages];
      } else {
        updateFields.images = newImages;
      }
    }

    // Handle image removal (if specified in request)
    if (req.body.removeImages) {
      try {
        const removeImages = JSON.parse(req.body.removeImages);
        if (Array.isArray(removeImages) && removeImages.length > 0) {
          const existingProduct = await Product.findById(req.params.id);
          if (existingProduct && existingProduct.images) {
            // Remove images from Cloudinary
            const deletePromises = removeImages.map(async (imageId) => {
              const imageToRemove = existingProduct.images.find(img => 
                img._id.toString() === imageId || img.publicId === imageId
              );
              if (imageToRemove && imageToRemove.publicId) {
                try {
                  await deleteImage(imageToRemove.publicId);
                } catch (error) {
                  console.error('Error deleting image from Cloudinary:', error);
                }
              }
            });
            
            await Promise.allSettled(deletePromises);
            
            // Filter out removed images
            updateFields.images = existingProduct.images.filter(img => 
              !removeImages.includes(img._id.toString()) && 
              !removeImages.includes(img.publicId)
            );
          }
        }
      } catch (error) {
        console.error('Error parsing removeImages:', error);
      }
    }
    
    if (updateFields.sku) {
      updateFields.sku = updateFields.sku.toUpperCase();
    }

    // Check if new SKU already exists for another product
    if (updateFields.sku) {
      const existingProduct = await Product.findOne({ 
        sku: { $regex: `^${updateFields.sku}$`, $options: 'i' },
        _id: { $ne: req.params.id }
      });

      if (existingProduct) {
        return res.status(400).json({ message: 'SKU already exists' });
      }
    }

    // Check if new barcode already exists for another product
    if (updateFields.barcode) {
      const existingBarcode = await Product.findOne({ 
        barcode: updateFields.barcode,
        _id: { $ne: req.params.id }
      });

      if (existingBarcode) {
        return res.status(400).json({ message: 'Barcode already exists' });
      }
    }

    // Check if category exists (if updating category)
    if (updateFields.category) {
      const categoryExists = await Category.findById(updateFields.category);
      if (!categoryExists) {
        return res.status(400).json({ message: 'Invalid category' });
      }
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    ).populate([
      { path: 'category', select: 'name' },
      { path: 'createdBy', select: 'name email' }
    ]);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error(error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid product ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private (Admin)
router.delete('/:id', [auth, requireClientCode, authorize('admin')], async (req, res) => {
  try {
    const { Product, Inventory } = req.models;
    
    // Check if product has inventory
    const inventoryCount = await Inventory.countDocuments({ 
      product: req.params.id,
      quantity: { $gt: 0 }
    });

    if (inventoryCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete product. It has existing inventory in warehouses' 
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Delete images from Cloudinary
    if (product.images && product.images.length > 0) {
      const deleteImagePromises = product.images.map(async (image) => {
        if (image.publicId) {
          try {
            await deleteImage(image.publicId);
          } catch (error) {
            console.error('Error deleting image from Cloudinary:', error);
          }
        }
      });
      
      await Promise.allSettled(deleteImagePromises);
    }

    await Product.findByIdAndDelete(req.params.id);

    // Clean up any zero inventory records
    await Inventory.deleteMany({ product: req.params.id });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid product ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/products/low-stock
// @desc    Get products with low stock
// @access  Private
router.get('/reports/low-stock', [auth, requireClientCode], async (req, res) => {
  try {
    const { Inventory } = req.models;
    
    const { warehouse } = req.query;
    const inventoryQuery = {};

    if (warehouse) {
      inventoryQuery.warehouse = warehouse;
    }

    const lowStockProducts = await Inventory.aggregate([
      { $match: inventoryQuery },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      {
        $match: {
          $expr: { $lte: ['$quantity', '$productInfo.reorderLevel'] },
          'productInfo.isActive': true
        }
      },
      {
        $lookup: {
          from: 'warehouses',
          localField: 'warehouse',
          foreignField: '_id',
          as: 'warehouseInfo'
        }
      },
      { $unwind: '$warehouseInfo' },
      {
        $project: {
          product: '$productInfo',
          warehouse: '$warehouseInfo',
          currentQuantity: '$quantity',
          reorderLevel: '$productInfo.reorderLevel',
          minStockLevel: '$productInfo.minStockLevel'
        }
      }
    ]);

    res.json({
      lowStockProducts,
      count: lowStockProducts.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/products/search
// @desc    Search products by text
// @access  Private
router.get('/search/text', [auth, requireClientCode], async (req, res) => {
  try {
    const { Product } = req.models;
    
    const { q, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const products = await Product.find(
      { $text: { $search: q }, isActive: true },
      { score: { $meta: 'textScore' } }
    )
      .populate('category', 'name')
      .sort({ score: { $meta: 'textScore' } })
      .limit(parseInt(limit));

    res.json({ products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Test route to debug middleware
router.post('/:id/test-upload', [
  auth,
  requireClientCode,
  authorize('admin', 'manager', 'staff')
], async (req, res) => {
  console.log('=== Test Upload Route ===');
  console.log('Product ID:', req.params.id);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('Models available:', !!req.models);
  
  try {
    const { Product } = req.models;
    const product = await Product.findById(req.params.id);
    
    res.json({
      message: 'Test successful',
      productFound: !!product,
      productName: product?.name || 'N/A'
    });
  } catch (error) {
    console.error('Test route error:', error);
    res.status(500).json({ message: 'Test failed', error: error.message });
  }
});

// @route   POST /api/products/:slug/images
// @desc    Add images to existing product
// @access  Private (Admin/Manager/Staff)
router.post('/:slug/images', [
  auth,
  requireClientCode,
  authorize('admin', 'manager', 'staff'),
  (req, res, next) => {
    console.log('=== Before Multer Middleware ===');
    console.log('Request received for product slug:', req.params.slug);
    next();
  },
  upload.array('productImages', 10),
  (err, req, res, next) => {
    console.log('=== Multer Error Handler ===');
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ 
        message: 'File upload error', 
        error: err.message 
      });
    }
    next();
  }
], async (req, res) => {
  console.log('=== Image Upload Handler Started ===');
  console.log('Product Slug:', req.params.slug);
  console.log('Files received:', req.files ? req.files.length : 'none');
  console.log('Body:', req.body);
  
  try {
    const { Product } = req.models;
    console.log('Product model available:', !!Product);
    
    if (!req.files || req.files.length === 0) {
      console.log('No files uploaded, sending 400 response');
      return res.status(400).json({ message: 'No images uploaded' });
    }

    console.log('Looking up product by slug:', req.params.slug);
    let product = await Product.findOne({ slug: req.params.slug });
    
    // If no product found by slug, try to find by ID (for backward compatibility)
    if (!product) {
      console.log('Product not found by slug, trying by ID...');
      product = await Product.findById(req.params.slug);
      if (product && !product.slug) {
        // Generate and save slug for existing product
        const slug = generateProductSlug(product.name, product.sku);
        product.slug = slug;
        await product.save();
        console.log('Generated slug for existing product:', slug);
      }
    }
    
    if (!product) {
      console.log('Product not found, sending 404 response');
      return res.status(404).json({ message: 'Product not found' });
    }

    console.log('Product found:', product.name);
    console.log('Processing files...');
    
    const newImages = req.files.map((file, index) => {
      console.log(`Processing file ${index + 1}:`, file.originalname);
      let responsiveUrls;
      try {
        responsiveUrls = generateResponsiveUrls(file.filename);
        console.log('Generated responsive URLs successfully');
      } catch (error) {
        console.error('Error generating responsive URLs:', error);
        // Fallback to basic URL
        const baseUrl = file.path;
        responsiveUrls = {
          thumbnail: baseUrl,
          small: baseUrl,
          medium: baseUrl,
          large: baseUrl,
          original: baseUrl
        };
        console.log('Using fallback URLs');
      }
      
      return {
        url: file.path,
        publicId: file.filename,
        originalName: file.originalname,
        size: file.size,
        responsiveUrls: responsiveUrls
      };
    });

    console.log('Saving product with new images...');
    product.images = [...(product.images || []), ...newImages];
    await product.save();
    console.log('Product saved successfully');

    const response = {
      message: 'Images added successfully',
      images: newImages,
      totalImages: product.images.length
    };
    
    console.log('Sending success response:', JSON.stringify(response, null, 2));
    return res.json(response);
  } catch (error) {
    console.error('=== Image upload error ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.name === 'CastError') {
      console.log('Sending 400 response for CastError');
      return res.status(400).json({ message: 'Invalid product ID' });
    }
    
    console.log('Sending 500 response for general error');
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/products/:slug/images/:imageId
// @desc    Remove specific image from product
// @access  Private (Admin/Manager/Staff)
router.delete('/:slug/images/:imageId', [
  auth,
  requireClientCode,
  authorize('admin', 'manager', 'staff')
], async (req, res) => {
  try {
    const { Product } = req.models;
    
    let product = await Product.findOne({ slug: req.params.slug });
    
    // If no product found by slug, try to find by ID (for backward compatibility)
    if (!product) {
      product = await Product.findById(req.params.slug);
      if (product && !product.slug) {
        // Generate and save slug for existing product
        const slug = generateProductSlug(product.name, product.sku);
        product.slug = slug;
        await product.save();
      }
    }
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const imageToRemove = product.images.find(img => 
      img._id.toString() === req.params.imageId
    );

    if (!imageToRemove) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Delete from Cloudinary
    if (imageToRemove.publicId) {
      try {
        await deleteImage(imageToRemove.publicId);
      } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
      }
    }

    // Remove from product
    product.images = product.images.filter(img => 
      img._id.toString() !== req.params.imageId
    );

    await product.save();

    res.json({
      message: 'Image removed successfully',
      remainingImages: product.images.length
    });
  } catch (error) {
    console.error(error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid product or image ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/products/:slug/images/reorder
// @desc    Reorder product images
// @access  Private (Admin/Manager/Staff)
router.put('/:slug/images/reorder', [
  auth,
  requireClientCode,
  authorize('admin', 'manager', 'staff'),
  body('imageOrder').isArray().withMessage('Image order must be an array')
], async (req, res) => {
  try {
    const { Product } = req.models;
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    let product = await Product.findOne({ slug: req.params.slug });
    
    // If no product found by slug, try to find by ID (for backward compatibility)
    if (!product) {
      product = await Product.findById(req.params.slug);
      if (product && !product.slug) {
        // Generate and save slug for existing product
        const slug = generateProductSlug(product.name, product.sku);
        product.slug = slug;
        await product.save();
      }
    }
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const { imageOrder } = req.body;
    
    // Validate that all image IDs in the order exist
    const imageIds = product.images.map(img => img._id.toString());
    const validOrder = imageOrder.every(id => imageIds.includes(id));
    
    if (!validOrder || imageOrder.length !== product.images.length) {
      return res.status(400).json({ message: 'Invalid image order' });
    }

    // Reorder images
    const reorderedImages = imageOrder.map(id => 
      product.images.find(img => img._id.toString() === id)
    );

    product.images = reorderedImages;
    await product.save();

    res.json({
      message: 'Images reordered successfully',
      images: product.images
    });
  } catch (error) {
    console.error(error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid product ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
