const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const dbManager = require('../../../utils/dynamicDb');
const patAuth = require('../../../middleware/patAuth');

// Import schema
const WarehouseSchema = require('../../../models/Warehouse').schema;

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
 * GET /api/v1/warehouses
 * Get all warehouses with pagination and filtering
 */
router.get('/', patAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      active,
      search,
      location
    } = req.query;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Get client database model
    const Warehouse = await dbManager.getModel(req.client.databaseName, 'Warehouse', WarehouseSchema);

    // Build query filter
    let filter = {};

    if (active !== undefined) {
      filter.isActive = active === 'true';
    }

    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }

    // Build aggregation pipeline to include inventory statistics
    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'inventories',
          localField: '_id',
          foreignField: 'warehouse',
          as: 'inventoryData'
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'inventoryData.product',
          foreignField: '_id',
          as: 'productData'
        }
      },
      {
        $addFields: {
          totalProducts: { $size: '$inventoryData' },
          totalQuantity: { $sum: '$inventoryData.quantity' },
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
                                  input: '$productData',
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
          lowStockItems: {
            $size: {
              $filter: {
                input: '$inventoryData',
                cond: { $lt: ['$$this.quantity', '$$this.minStockLevel'] }
              }
            }
          },
          availableQuantity: {
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
          location: 1,
          address: 1,
          isActive: 1,
          totalProducts: 1,
          totalQuantity: { $ifNull: ['$totalQuantity', 0] },
          availableQuantity: { $ifNull: ['$availableQuantity', 0] },
          totalValue: { $round: [{ $ifNull: ['$totalValue', 0] }, 2] },
          lowStockItems: 1,
          capacity: 1,
          utilizationPercentage: {
            $cond: {
              if: { $gt: ['$capacity', 0] },
              then: {
                $round: [
                  { $multiply: [{ $divide: [{ $ifNull: ['$totalQuantity', 0] }, '$capacity'] }, 100] },
                  2
                ]
              },
              else: 0
            }
          },
          createdAt: 1,
          updatedAt: 1
        }
      }
    ];

    // Get total count for pagination
    const countPipeline = [...pipeline.slice(0, -1)]; // Remove projection for count
    countPipeline.push({ $count: 'total' });
    const countResult = await Warehouse.aggregate(countPipeline);
    const totalItems = countResult.length > 0 ? countResult[0].total : 0;

    // Add pagination to main pipeline
    pipeline.push(
      { $sort: { name: 1 } },
      { $skip: skip },
      { $limit: limitNum }
    );

    // Execute query
    const warehouses = await Warehouse.aggregate(pipeline);

    // Build response
    const pagination = buildPagination(pageNum, limitNum, totalItems);

    res.json({
      success: true,
      data: {
        warehouses,
        pagination
      },
      message: 'Warehouses retrieved successfully'
    });

  } catch (error) {
    console.error('Error retrieving warehouses:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: {
        code: 'INTERNAL_ERROR',
        details: 'Failed to retrieve warehouses'
      }
    });
  }
});

/**
 * GET /api/v1/warehouses/:id
 * Get warehouse by ID with detailed information including inventory
 */
router.get('/:id', patAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid warehouse ID format',
        error: {
          code: 'INVALID_ID',
          details: 'Warehouse ID must be a valid MongoDB ObjectId'
        }
      });
    }

    // Get client database model
    const Warehouse = await dbManager.getModel(req.client.databaseName, 'Warehouse', WarehouseSchema);

    // Build aggregation pipeline for detailed view
    const pipeline = [
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: 'inventories',
          localField: '_id',
          foreignField: 'warehouse',
          as: 'inventoryData'
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'inventoryData.product',
          foreignField: '_id',
          as: 'productData'
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'productData.category',
          foreignField: '_id',
          as: 'categoryData'
        }
      },
      {
        $addFields: {
          totalProducts: { $size: '$inventoryData' },
          totalQuantity: { $sum: '$inventoryData.quantity' },
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
                                  input: '$productData',
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
          lowStockItems: {
            $size: {
              $filter: {
                input: '$inventoryData',
                cond: { $lt: ['$$this.quantity', '$$this.minStockLevel'] }
              }
            }
          },
          availableQuantity: {
            $sum: {
              $subtract: [
                '$inventoryData.quantity',
                { $ifNull: ['$inventoryData.reservedQuantity', 0] }
              ]
            }
          },
          categoryBreakdown: {
            $map: {
              input: {
                $setUnion: ['$productData.category']
              },
              as: 'categoryId',
              in: {
                $let: {
                  vars: {
                    category: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$categoryData',
                            cond: { $eq: ['$$this._id', '$$categoryId'] }
                          }
                        },
                        0
                      ]
                    },
                    categoryProducts: {
                      $filter: {
                        input: '$inventoryData',
                        cond: {
                          $in: [
                            {
                              $arrayElemAt: [
                                {
                                  $filter: {
                                    input: '$productData',
                                    cond: { $eq: ['$$this._id', '$$this.product'] }
                                  }
                                },
                                0
                              ]
                            }.category,
                            ['$$categoryId']
                          ]
                        }
                      }
                    }
                  },
                  in: {
                    category: {
                      _id: '$$category._id',
                      name: '$$category.name'
                    },
                    productCount: { $size: '$$categoryProducts' },
                    totalQuantity: { $sum: '$$categoryProducts.quantity' }
                  }
                }
              }
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          location: 1,
          address: 1,
          isActive: 1,
          capacity: 1,
          totalProducts: 1,
          totalQuantity: { $ifNull: ['$totalQuantity', 0] },
          availableQuantity: { $ifNull: ['$availableQuantity', 0] },
          totalValue: { $round: [{ $ifNull: ['$totalValue', 0] }, 2] },
          lowStockItems: 1,
          utilizationPercentage: {
            $cond: {
              if: { $gt: ['$capacity', 0] },
              then: {
                $round: [
                  { $multiply: [{ $divide: [{ $ifNull: ['$totalQuantity', 0] }, '$capacity'] }, 100] },
                  2
                ]
              },
              else: 0
            }
          },
          categoryBreakdown: 1,
          recentInventoryUpdates: {
            $slice: [
              {
                $map: {
                  input: {
                    $sortArray: {
                      input: '$inventoryData',
                      sortBy: { lastUpdated: -1 }
                    }
                  },
                  as: 'inv',
                  in: {
                    $let: {
                      vars: {
                        product: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: '$productData',
                                cond: { $eq: ['$$this._id', '$$inv.product'] }
                              }
                            },
                            0
                          ]
                        }
                      },
                      in: {
                        _id: '$$inv._id',
                        product: {
                          _id: '$$product._id',
                          name: '$$product.name',
                          sku: '$$product.sku'
                        },
                        quantity: '$$inv.quantity',
                        lastUpdated: '$$inv.lastUpdated'
                      }
                    }
                  }
                }
              },
              10
            ]
          },
          createdAt: 1,
          updatedAt: 1
        }
      }
    ];

    const result = await Warehouse.aggregate(pipeline);

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found',
        error: {
          code: 'RESOURCE_NOT_FOUND',
          details: `Warehouse with ID ${id} does not exist`
        }
      });
    }

    res.json({
      success: true,
      data: result[0],
      message: 'Warehouse retrieved successfully'
    });

  } catch (error) {
    console.error('Error retrieving warehouse:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: {
        code: 'INTERNAL_ERROR',
        details: 'Failed to retrieve warehouse'
      }
    });
  }
});

/**
 * GET /api/v1/warehouses/:id/inventory
 * Get all inventory items in a specific warehouse
 */
router.get('/:id/inventory', patAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      page = 1,
      limit = 50,
      product,
      lowStock,
      search
    } = req.query;

    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid warehouse ID format',
        error: {
          code: 'INVALID_ID',
          details: 'Warehouse ID must be a valid MongoDB ObjectId'
        }
      });
    }

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Get client database models
    const Warehouse = await dbManager.getModel(req.client.databaseName, 'Warehouse', WarehouseSchema);
    const Inventory = await dbManager.getModel(req.client.databaseName, 'Inventory', require('../../../models/Inventory').schema);

    // Verify warehouse exists
    const warehouseExists = await Warehouse.findById(id);
    if (!warehouseExists) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found',
        error: {
          code: 'RESOURCE_NOT_FOUND',
          details: `Warehouse with ID ${id} does not exist`
        }
      });
    }

    // Build query filter
    let filter = { warehouse: new mongoose.Types.ObjectId(id) };

    if (product) {
      if (!isValidObjectId(product)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product ID format',
          error: {
            code: 'INVALID_ID',
            details: 'Product ID must be a valid MongoDB ObjectId'
          }
        });
      }
      filter.product = product;
    }

    if (lowStock === 'true') {
      filter.$expr = { $lt: ['$quantity', '$minStockLevel'] };
    }

    // Build aggregation pipeline
    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      {
        $unwind: {
          path: '$productDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'productDetails.category',
          foreignField: '_id',
          as: 'categoryDetails'
        }
      },
      {
        $unwind: {
          path: '$categoryDetails',
          preserveNullAndEmptyArrays: true
        }
      }
    ];

    // Add search filter if provided
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { 'productDetails.name': { $regex: search, $options: 'i' } },
            { 'productDetails.sku': { $regex: search, $options: 'i' } },
            { 'categoryDetails.name': { $regex: search, $options: 'i' } }
          ]
        }
      });
    }

    // Add projection
    pipeline.push({
      $project: {
        _id: 1,
        quantity: 1,
        minStockLevel: 1,
        maxStockLevel: 1,
        reservedQuantity: { $ifNull: ['$reservedQuantity', 0] },
        availableQuantity: { $subtract: ['$quantity', { $ifNull: ['$reservedQuantity', 0] }] },
        lastUpdated: 1,
        product: {
          _id: '$productDetails._id',
          name: '$productDetails.name',
          sku: '$productDetails.sku',
          price: '$productDetails.price',
          category: '$categoryDetails.name'
        },
        stockStatus: {
          $cond: {
            if: { $lt: ['$quantity', '$minStockLevel'] },
            then: 'low',
            else: {
              $cond: {
                if: { $gt: ['$quantity', '$maxStockLevel'] },
                then: 'high',
                else: 'normal'
              }
            }
          }
        }
      }
    });

    // Get total count for pagination
    const countPipeline = [...pipeline.slice(0, -1)]; // Remove projection for count
    countPipeline.push({ $count: 'total' });
    const countResult = await Inventory.aggregate(countPipeline);
    const totalItems = countResult.length > 0 ? countResult[0].total : 0;

    // Add pagination to main pipeline
    pipeline.push(
      { $sort: { 'productDetails.name': 1 } },
      { $skip: skip },
      { $limit: limitNum }
    );

    // Execute query
    const inventory = await Inventory.aggregate(pipeline);

    // Build response
    const pagination = buildPagination(pageNum, limitNum, totalItems);

    res.json({
      success: true,
      data: {
        warehouse: {
          _id: warehouseExists._id,
          name: warehouseExists.name,
          location: warehouseExists.location,
          address: warehouseExists.address
        },
        inventory,
        pagination
      },
      message: 'Warehouse inventory retrieved successfully'
    });

  } catch (error) {
    console.error('Error retrieving warehouse inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: {
        code: 'INTERNAL_ERROR',
        details: 'Failed to retrieve warehouse inventory'
      }
    });
  }
});

/**
 * GET /api/v1/warehouses/:id/analytics
 * Get analytics data for a specific warehouse
 */
router.get('/:id/analytics', patAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { period = '30d' } = req.query;

    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid warehouse ID format',
        error: {
          code: 'INVALID_ID',
          details: 'Warehouse ID must be a valid MongoDB ObjectId'
        }
      });
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate;
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get client database models
    const Warehouse = await dbManager.getModel(req.client.databaseName, 'Warehouse', WarehouseSchema);
    const Inventory = await dbManager.getModel(req.client.databaseName, 'Inventory', require('../../../models/Inventory').schema);

    // Verify warehouse exists
    const warehouse = await Warehouse.findById(id);
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found',
        error: {
          code: 'RESOURCE_NOT_FOUND',
          details: `Warehouse with ID ${id} does not exist`
        }
      });
    }

    // Get current inventory analytics
    const analyticsData = await Inventory.aggregate([
      { $match: { warehouse: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      {
        $unwind: {
          path: '$productDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'productDetails.category',
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
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: { $multiply: ['$quantity', { $ifNull: ['$productDetails.cost', 0] }] } },
          lowStockItems: {
            $sum: {
              $cond: [{ $lt: ['$quantity', '$minStockLevel'] }, 1, 0]
            }
          },
          highStockItems: {
            $sum: {
              $cond: [{ $gt: ['$quantity', '$maxStockLevel'] }, 1, 0]
            }
          },
          categoryBreakdown: {
            $push: {
              category: '$categoryDetails.name',
              quantity: '$quantity',
              value: { $multiply: ['$quantity', { $ifNull: ['$productDetails.cost', 0] }] }
            }
          }
        }
      }
    ]);

    const analytics = analyticsData.length > 0 ? analyticsData[0] : {
      totalProducts: 0,
      totalQuantity: 0,
      totalValue: 0,
      lowStockItems: 0,
      highStockItems: 0,
      categoryBreakdown: []
    };

    // Process category breakdown
    const categoryMap = new Map();
    analytics.categoryBreakdown.forEach(item => {
      if (item.category) {
        const existing = categoryMap.get(item.category) || { quantity: 0, value: 0, count: 0 };
        existing.quantity += item.quantity;
        existing.value += item.value;
        existing.count += 1;
        categoryMap.set(item.category, existing);
      }
    });

    const processedCategoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      productCount: data.count,
      totalQuantity: data.quantity,
      totalValue: Math.round(data.value * 100) / 100,
      percentage: analytics.totalQuantity > 0 ? Math.round((data.quantity / analytics.totalQuantity) * 100) : 0
    }));

    res.json({
      success: true,
      data: {
        warehouse: {
          _id: warehouse._id,
          name: warehouse.name,
          location: warehouse.location,
          capacity: warehouse.capacity
        },
        period: period,
        dateRange: {
          start: startDate,
          end: now
        },
        summary: {
          totalProducts: analytics.totalProducts,
          totalQuantity: analytics.totalQuantity,
          totalValue: Math.round(analytics.totalValue * 100) / 100,
          lowStockItems: analytics.lowStockItems,
          highStockItems: analytics.highStockItems,
          utilizationPercentage: warehouse.capacity > 0 ? 
            Math.round((analytics.totalQuantity / warehouse.capacity) * 100) : 0
        },
        categoryBreakdown: processedCategoryBreakdown.sort((a, b) => b.totalQuantity - a.totalQuantity)
      },
      message: 'Warehouse analytics retrieved successfully'
    });

  } catch (error) {
    console.error('Error retrieving warehouse analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: {
        code: 'INTERNAL_ERROR',
        details: 'Failed to retrieve warehouse analytics'
      }
    });
  }
});

module.exports = router;
