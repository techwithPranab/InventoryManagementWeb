const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const dbManager = require('../../../utils/dynamicDb');
const patAuth = require('../../../middleware/patAuth');

// Import schemas (we'll use the existing schemas from the models directory)
const ProductSchema = require('../../../models/Product').schema;
const CategorySchema = require('../../../models/Category').schema;

/**
 * Helper function to validate MongoDB ObjectId
 */
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Helper function to build pagination metadata
 */
const buildPagination = (page, limit, totalItems) => {
  const totalPages = Math.ceil(totalItems / limit);
  return {
    currentPage: parseInt(page),
    totalPages,
    totalItems,
    itemsPerPage: parseInt(limit),
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
};

/**
 * GET /api/v1/products
 * Get all products with pagination and filtering
 */
router.get('/', patAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      category,
      active,
      search,
      minPrice,
      maxPrice
    } = req.query;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Get client database models
    const Product = await dbManager.getModel(req.client.databaseName, 'Product', ProductSchema);

    // Build query filter
    let filter = {};

    if (category) {
      if (!isValidObjectId(category)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category ID format',
          error: {
            code: 'INVALID_ID',
            details: 'Category ID must be a valid MongoDB ObjectId'
          }
        });
      }
      filter.category = category;
    }

    if (active !== undefined) {
      filter.isActive = active === 'true';
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Build aggregation pipeline
    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryDetails'
        }
      },
      {
        $unwind: {
          path: '$categoryDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'inventories',
          localField: '_id',
          foreignField: 'product',
          as: 'inventoryData'
        }
      },
      {
        $addFields: {
          totalStock: { $sum: '$inventoryData.quantity' },
          availableStock: {
            $sum: {
              $subtract: [
                '$inventoryData.quantity',
                { $ifNull: ['$inventoryData.reservedQuantity', 0] }
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          sku: 1,
          description: 1,
          price: 1,
          cost: 1,
          isActive: 1,
          totalStock: { $ifNull: ['$totalStock', 0] },
          availableStock: { $ifNull: ['$availableStock', 0] },
          category: {
            _id: '$categoryDetails._id',
            name: '$categoryDetails.name'
          },
          createdAt: 1,
          updatedAt: 1
        }
      }
    ];

    // Get total count for pagination
    const countPipeline = [...pipeline.slice(0, -1)]; // Remove projection for count
    countPipeline.push({ $count: 'total' });
    const countResult = await Product.aggregate(countPipeline);
    const totalItems = countResult.length > 0 ? countResult[0].total : 0;

    // Add pagination to main pipeline
    pipeline.push(
      { $sort: { name: 1 } },
      { $skip: skip },
      { $limit: limitNum }
    );

    // Execute query
    const products = await Product.aggregate(pipeline);

    // Build response
    const pagination = buildPagination(pageNum, limitNum, totalItems);

    res.json({
      success: true,
      data: {
        products,
        pagination
      },
      message: 'Products retrieved successfully'
    });

  } catch (error) {
    console.error('Error retrieving products:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: {
        code: 'INTERNAL_ERROR',
        details: 'Failed to retrieve products'
      }
    });
  }
});

/**
 * GET /api/v1/products/:id
 * Get product by ID with detailed information
 */
router.get('/:id', patAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
        error: {
          code: 'INVALID_ID',
          details: 'Product ID must be a valid MongoDB ObjectId'
        }
      });
    }

    // Get client database model
    const Product = await dbManager.getModel(req.client.databaseName, 'Product', ProductSchema);

    // Build aggregation pipeline for detailed view
    const pipeline = [
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryDetails'
        }
      },
      {
        $unwind: {
          path: '$categoryDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'inventories',
          localField: '_id',
          foreignField: 'product',
          as: 'inventoryData'
        }
      },
      {
        $lookup: {
          from: 'warehouses',
          localField: 'inventoryData.warehouse',
          foreignField: '_id',
          as: 'warehouseDetails'
        }
      },
      {
        $addFields: {
          totalStock: { $sum: '$inventoryData.quantity' },
          availableStock: {
            $sum: {
              $subtract: [
                '$inventoryData.quantity',
                { $ifNull: ['$inventoryData.reservedQuantity', 0] }
              ]
            }
          },
          stockByWarehouse: {
            $map: {
              input: '$inventoryData',
              as: 'inv',
              in: {
                warehouse: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: '$warehouseDetails',
                        cond: { $eq: ['$$this._id', '$$inv.warehouse'] }
                      }
                    },
                    0
                  ]
                },
                quantity: '$$inv.quantity',
                availableQuantity: {
                  $subtract: ['$$inv.quantity', { $ifNull: ['$$inv.reservedQuantity', 0] }]
                },
                minStockLevel: '$$inv.minStockLevel',
                maxStockLevel: '$$inv.maxStockLevel'
              }
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          sku: 1,
          description: 1,
          price: 1,
          cost: 1,
          isActive: 1,
          totalStock: { $ifNull: ['$totalStock', 0] },
          availableStock: { $ifNull: ['$availableStock', 0] },
          category: {
            _id: '$categoryDetails._id',
            name: '$categoryDetails.name',
            description: '$categoryDetails.description'
          },
          stockByWarehouse: 1,
          createdAt: 1,
          updatedAt: 1
        }
      }
    ];

    const result = await Product.aggregate(pipeline);

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        error: {
          code: 'RESOURCE_NOT_FOUND',
          details: `Product with ID ${id} does not exist`
        }
      });
    }

    res.json({
      success: true,
      data: result[0],
      message: 'Product retrieved successfully'
    });

  } catch (error) {
    console.error('Error retrieving product:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: {
        code: 'INTERNAL_ERROR',
        details: 'Failed to retrieve product'
      }
    });
  }
});

/**
 * POST /api/v1/products
 * Create new product
 */
router.post('/', patAuth, async (req, res) => {
  try {
    const {
      name,
      sku,
      description,
      category,
      price,
      cost,
      minStockLevel = 0,
      maxStockLevel = 1000,
      isActive = true
    } = req.body;

    // Validate required fields
    if (!name || !sku || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name, SKU, and category are required',
        error: {
          code: 'REQUIRED_FIELD_MISSING',
          details: 'Name, SKU, and category are required fields'
        }
      });
    }

    // Validate category ObjectId
    if (!isValidObjectId(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID format',
        error: {
          code: 'INVALID_ID',
          details: 'Category ID must be a valid MongoDB ObjectId'
        }
      });
    }

    // Validate price and cost
    if (price !== undefined && (typeof price !== 'number' || price < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid price value',
        error: {
          code: 'VALIDATION_ERROR',
          details: 'Price must be a non-negative number'
        }
      });
    }

    if (cost !== undefined && (typeof cost !== 'number' || cost < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cost value',
        error: {
          code: 'VALIDATION_ERROR',
          details: 'Cost must be a non-negative number'
        }
      });
    }

    // Get client database models
    const Product = await dbManager.getModel(req.client.databaseName, 'Product', ProductSchema);
    const Category = await dbManager.getModel(req.client.databaseName, 'Category', CategorySchema);

    // Verify category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
        error: {
          code: 'RESOURCE_NOT_FOUND',
          details: `Category with ID ${category} does not exist`
        }
      });
    }

    // Check if SKU already exists
    const existingProduct = await Product.findOne({ sku });
    if (existingProduct) {
      return res.status(409).json({
        success: false,
        message: 'Product with this SKU already exists',
        error: {
          code: 'RESOURCE_ALREADY_EXISTS',
          details: `Product with SKU ${sku} already exists`
        }
      });
    }

    // Create new product
    const newProduct = await Product.create({
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      description: description?.trim(),
      category,
      price,
      cost,
      isActive
    });

    res.status(201).json({
      success: true,
      data: {
        _id: newProduct._id,
        name: newProduct.name,
        sku: newProduct.sku,
        description: newProduct.description,
        category: newProduct.category,
        price: newProduct.price,
        cost: newProduct.cost,
        isActive: newProduct.isActive,
        createdAt: newProduct.createdAt
      },
      message: 'Product created successfully'
    });

  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: {
        code: 'INTERNAL_ERROR',
        details: 'Failed to create product'
      }
    });
  }
});

/**
 * PUT /api/v1/products/:id
 * Update product
 */
router.put('/:id', patAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      sku,
      description,
      category,
      price,
      cost,
      isActive
    } = req.body;

    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
        error: {
          code: 'INVALID_ID',
          details: 'Product ID must be a valid MongoDB ObjectId'
        }
      });
    }

    // Validate category ObjectId if provided
    if (category && !isValidObjectId(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID format',
        error: {
          code: 'INVALID_ID',
          details: 'Category ID must be a valid MongoDB ObjectId'
        }
      });
    }

    // Validate price and cost if provided
    if (price !== undefined && (typeof price !== 'number' || price < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid price value',
        error: {
          code: 'VALIDATION_ERROR',
          details: 'Price must be a non-negative number'
        }
      });
    }

    if (cost !== undefined && (typeof cost !== 'number' || cost < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cost value',
        error: {
          code: 'VALIDATION_ERROR',
          details: 'Cost must be a non-negative number'
        }
      });
    }

    // Get client database models
    const Product = await dbManager.getModel(req.client.databaseName, 'Product', ProductSchema);
    const Category = await dbManager.getModel(req.client.databaseName, 'Category', CategorySchema);

    // Check if product exists
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        error: {
          code: 'RESOURCE_NOT_FOUND',
          details: `Product with ID ${id} does not exist`
        }
      });
    }

    // Verify category exists if provided
    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(404).json({
          success: false,
          message: 'Category not found',
          error: {
            code: 'RESOURCE_NOT_FOUND',
            details: `Category with ID ${category} does not exist`
          }
        });
      }
    }

    // Check if SKU already exists (if SKU is being updated)
    if (sku && sku !== existingProduct.sku) {
      const skuExists = await Product.findOne({ sku, _id: { $ne: id } });
      if (skuExists) {
        return res.status(409).json({
          success: false,
          message: 'Product with this SKU already exists',
          error: {
            code: 'RESOURCE_ALREADY_EXISTS',
            details: `Product with SKU ${sku} already exists`
          }
        });
      }
    }

    // Build update object
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (sku !== undefined) updateData.sku = sku.trim().toUpperCase();
    if (description !== undefined) updateData.description = description.trim();
    if (category !== undefined) updateData.category = category;
    if (price !== undefined) updateData.price = price;
    if (cost !== undefined) updateData.cost = cost;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: {
        _id: updatedProduct._id,
        name: updatedProduct.name,
        sku: updatedProduct.sku,
        description: updatedProduct.description,
        category: updatedProduct.category,
        price: updatedProduct.price,
        cost: updatedProduct.cost,
        isActive: updatedProduct.isActive,
        updatedAt: updatedProduct.updatedAt
      },
      message: 'Product updated successfully'
    });

  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: {
        code: 'INTERNAL_ERROR',
        details: 'Failed to update product'
      }
    });
  }
});

/**
 * DELETE /api/v1/products/:id
 * Soft delete product (mark as inactive)
 */
router.delete('/:id', patAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
        error: {
          code: 'INVALID_ID',
          details: 'Product ID must be a valid MongoDB ObjectId'
        }
      });
    }

    // Get client database model
    const Product = await dbManager.getModel(req.client.databaseName, 'Product', ProductSchema);

    // Check if product exists
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        error: {
          code: 'RESOURCE_NOT_FOUND',
          details: `Product with ID ${id} does not exist`
        }
      });
    }

    // Soft delete by marking as inactive
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    res.json({
      success: true,
      data: {
        _id: updatedProduct._id,
        name: updatedProduct.name,
        sku: updatedProduct.sku,
        isActive: updatedProduct.isActive
      },
      message: 'Product deactivated successfully'
    });

  } catch (error) {
    console.error('Error deactivating product:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: {
        code: 'INTERNAL_ERROR',
        details: 'Failed to deactivate product'
      }
    });
  }
});

module.exports = router;
