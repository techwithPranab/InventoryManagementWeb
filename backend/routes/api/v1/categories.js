const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const dbManager = require('../../../utils/dynamicDb');
const patAuth = require('../../../middleware/patAuth');

// Import schema
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
 * GET /api/v1/categories
 * Get all categories with pagination and filtering
 */
router.get('/', patAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      active,
      search
    } = req.query;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Get client database model
    const Category = await dbManager.getModel(req.client.databaseName, 'Category', CategorySchema);

    // Build query filter
    let filter = {};

    if (active !== undefined) {
      filter.isActive = active === 'true';
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Build aggregation pipeline to include product count
    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'category',
          as: 'products'
        }
      },
      {
        $addFields: {
          productCount: { $size: '$products' },
          activeProductCount: {
            $size: {
              $filter: {
                input: '$products',
                cond: { $eq: ['$$this.isActive', true] }
              }
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          isActive: 1,
          productCount: 1,
          activeProductCount: 1,
          createdAt: 1,
          updatedAt: 1
        }
      }
    ];

    // Get total count for pagination
    const countPipeline = [...pipeline.slice(0, -1)]; // Remove projection for count
    countPipeline.push({ $count: 'total' });
    const countResult = await Category.aggregate(countPipeline);
    const totalItems = countResult.length > 0 ? countResult[0].total : 0;

    // Add pagination to main pipeline
    pipeline.push(
      { $sort: { name: 1 } },
      { $skip: skip },
      { $limit: limitNum }
    );

    // Execute query
    const categories = await Category.aggregate(pipeline);

    // Build response
    const pagination = buildPagination(pageNum, limitNum, totalItems);

    res.json({
      success: true,
      data: {
        categories,
        pagination
      },
      message: 'Categories retrieved successfully'
    });

  } catch (error) {
    console.error('Error retrieving categories:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: {
        code: 'INTERNAL_ERROR',
        details: 'Failed to retrieve categories'
      }
    });
  }
});

/**
 * GET /api/v1/categories/:id
 * Get category by ID with detailed information including products
 */
router.get('/:id', patAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID format',
        error: {
          code: 'INVALID_ID',
          details: 'Category ID must be a valid MongoDB ObjectId'
        }
      });
    }

    // Get client database model
    const Category = await dbManager.getModel(req.client.databaseName, 'Category', CategorySchema);

    // Build aggregation pipeline for detailed view
    const pipeline = [
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'category',
          as: 'products'
        }
      },
      {
        $lookup: {
          from: 'inventories',
          localField: 'products._id',
          foreignField: 'product',
          as: 'inventoryData'
        }
      },
      {
        $addFields: {
          productCount: { $size: '$products' },
          activeProductCount: {
            $size: {
              $filter: {
                input: '$products',
                cond: { $eq: ['$$this.isActive', true] }
              }
            }
          },
          totalStock: { $sum: '$inventoryData.quantity' },
          totalValue: {
            $sum: {
              $map: {
                input: '$inventoryData',
                as: 'inv',
                in: {
                  $multiply: [
                    '$$inv.quantity',
                    {
                      $let: {
                        vars: {
                          product: {
                            $arrayElemAt: [
                              {
                                $filter: {
                                  input: '$products',
                                  cond: { $eq: ['$$this._id', '$$inv.product'] }
                                }
                              },
                              0
                            ]
                          }
                        },
                        in: { $ifNull: ['$$product.cost', 0] }
                      }
                    }
                  ]
                }
              }
            }
          },
          lowStockProducts: {
            $size: {
              $filter: {
                input: '$inventoryData',
                cond: { $lt: ['$$this.quantity', '$$this.minStockLevel'] }
              }
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          isActive: 1,
          productCount: 1,
          activeProductCount: 1,
          totalStock: { $ifNull: ['$totalStock', 0] },
          totalValue: { $ifNull: ['$totalValue', 0] },
          lowStockProducts: 1,
          createdAt: 1,
          updatedAt: 1,
          recentProducts: {
            $slice: [
              {
                $map: {
                  input: {
                    $filter: {
                      input: '$products',
                      cond: { $eq: ['$$this.isActive', true] }
                    }
                  },
                  as: 'product',
                  in: {
                    _id: '$$product._id',
                    name: '$$product.name',
                    sku: '$$product.sku',
                    price: '$$product.price',
                    createdAt: '$$product.createdAt'
                  }
                }
              },
              5
            ]
          }
        }
      }
    ];

    const result = await Category.aggregate(pipeline);

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
        error: {
          code: 'RESOURCE_NOT_FOUND',
          details: `Category with ID ${id} does not exist`
        }
      });
    }

    res.json({
      success: true,
      data: result[0],
      message: 'Category retrieved successfully'
    });

  } catch (error) {
    console.error('Error retrieving category:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: {
        code: 'INTERNAL_ERROR',
        details: 'Failed to retrieve category'
      }
    });
  }
});

/**
 * GET /api/v1/categories/:id/products
 * Get all products in a specific category
 */
router.get('/:id/products', patAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      page = 1,
      limit = 50,
      active,
      search
    } = req.query;

    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID format',
        error: {
          code: 'INVALID_ID',
          details: 'Category ID must be a valid MongoDB ObjectId'
        }
      });
    }

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Get client database models
    const Category = await dbManager.getModel(req.client.databaseName, 'Category', CategorySchema);
    const Product = await dbManager.getModel(req.client.databaseName, 'Product', require('../../../models/Product').schema);

    // Verify category exists
    const categoryExists = await Category.findById(id);
    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
        error: {
          code: 'RESOURCE_NOT_FOUND',
          details: `Category with ID ${id} does not exist`
        }
      });
    }

    // Build query filter
    let filter = { category: new mongoose.Types.ObjectId(id) };

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

    // Build aggregation pipeline
    const pipeline = [
      { $match: filter },
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
        category: {
          _id: categoryExists._id,
          name: categoryExists.name,
          description: categoryExists.description
        },
        products,
        pagination
      },
      message: 'Category products retrieved successfully'
    });

  } catch (error) {
    console.error('Error retrieving category products:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: {
        code: 'INTERNAL_ERROR',
        details: 'Failed to retrieve category products'
      }
    });
  }
});

module.exports = router;
