const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Inventory = require('../models/Inventory');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
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
router.get('/:id', auth, async (req, res) => {
  try {
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
// @access  Private (Admin/Manager)
router.post('/', [
  auth,
  authorize('admin', 'manager'),
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('sku').trim().notEmpty().withMessage('SKU is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('costPrice').isNumeric().withMessage('Cost price must be a number'),
  body('sellingPrice').isNumeric().withMessage('Selling price must be a number'),
  body('unit').isIn(['piece', 'kg', 'liter', 'meter', 'box', 'dozen']).withMessage('Invalid unit')
], async (req, res) => {
  try {
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
      reorderLevel, images, barcode, weight, dimensions
    } = req.body;

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
      createdBy: req.user._id
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
// @access  Private (Admin/Manager)
router.put('/:id', [
  auth,
  authorize('admin', 'manager'),
  body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty'),
  body('sku').optional().trim().notEmpty().withMessage('SKU cannot be empty'),
  body('costPrice').optional().isNumeric().withMessage('Cost price must be a number'),
  body('sellingPrice').optional().isNumeric().withMessage('Selling price must be a number'),
  body('unit').optional().isIn(['piece', 'kg', 'liter', 'meter', 'box', 'dozen']).withMessage('Invalid unit')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const updateFields = { ...req.body };
    
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
router.delete('/:id', [auth, authorize('admin')], async (req, res) => {
  try {
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

    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

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
router.get('/reports/low-stock', auth, async (req, res) => {
  try {
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
router.get('/search/text', auth, async (req, res) => {
  try {
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

module.exports = router;
