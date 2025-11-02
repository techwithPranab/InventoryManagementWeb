const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const dbManager = require('../../../utils/dynamicDb');
const patAuth = require('../../../middleware/patAuth');

// Import schemas (we'll use the existing schemas from the models directory)
const InventorySchema = require('../../../models/Inventory').schema;
const ProductSchema = require('../../../models/Product').schema;
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
 * GET /api/v1/inventory
 * Get all inventory items with pagination and filtering
 */
router.get('/', patAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      warehouse,
      product,
      lowStock,
      search
    } = req.query;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Get client database models
    const Inventory = await dbManager.getModel(req.client.databaseName, 'Inventory', InventorySchema);
    const Product = await dbManager.getModel(req.client.databaseName, 'Product', ProductSchema);
    const Warehouse = await dbManager.getModel(req.client.databaseName, 'Warehouse', WarehouseSchema);

    // Build query filter
    let filter = {};

    if (warehouse) {
      if (!isValidObjectId(warehouse)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid warehouse ID format',
          error: {
            code: 'INVALID_ID',
            details: 'Warehouse ID must be a valid MongoDB ObjectId'
          }
        });
      }
      filter.warehouse = warehouse;
    }

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
        $lookup: {
          from: 'warehouses',
          localField: 'warehouse',
          foreignField: '_id',
          as: 'warehouseDetails'
        }
      },
      {
        $unwind: {
          path: '$productDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $unwind: {
          path: '$warehouseDetails',
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
            { 'warehouseDetails.name': { $regex: search, $options: 'i' } }
          ]
        }
      });
    }

    // Add projection to format the output
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
          category: '$categoryDetails.name'
        },
        warehouse: {
          _id: '$warehouseDetails._id',
          name: '$warehouseDetails.name',
          location: '$warehouseDetails.location'
        }
      }
    });

    // Get total count for pagination
    const countPipeline = [...pipeline];
    countPipeline.push({ $count: 'total' });
    const countResult = await Inventory.aggregate(countPipeline);
    const totalItems = countResult.length > 0 ? countResult[0].total : 0;

    // Add pagination to main pipeline
    pipeline.push(
      { $sort: { 'productDetails.name': 1, 'warehouseDetails.name': 1 } },
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
        inventory,
        pagination
      },
      message: 'Inventory retrieved successfully'
    });

  } catch (error) {
    console.error('Error retrieving inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: {
        code: 'INTERNAL_ERROR',
        details: 'Failed to retrieve inventory data'
      }
    });
  }
});

/**
 * GET /api/v1/inventory/:id
 * Get inventory item by ID with detailed information
 */
router.get('/:id', patAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inventory ID format',
        error: {
          code: 'INVALID_ID',
          details: 'Inventory ID must be a valid MongoDB ObjectId'
        }
      });
    }

    // Get client database models
    const Inventory = await dbManager.getModel(req.client.databaseName, 'Inventory', InventorySchema);

    // Build aggregation pipeline for detailed view
    const pipeline = [
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      {
        $lookup: {
          from: 'warehouses',
          localField: 'warehouse',
          foreignField: '_id',
          as: 'warehouseDetails'
        }
      },
      {
        $unwind: {
          path: '$productDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $unwind: {
          path: '$warehouseDetails',
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
            description: '$productDetails.description',
            category: '$categoryDetails.name',
            price: '$productDetails.price'
          },
          warehouse: {
            _id: '$warehouseDetails._id',
            name: '$warehouseDetails.name',
            location: '$warehouseDetails.location',
            address: '$warehouseDetails.address'
          }
        }
      }
    ];

    const result = await Inventory.aggregate(pipeline);

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
        error: {
          code: 'RESOURCE_NOT_FOUND',
          details: `Inventory item with ID ${id} does not exist`
        }
      });
    }

    const inventoryItem = result[0];

    // Get recent stock movements (this would require a separate collection in a real system)
    // For now, we'll return a placeholder
    inventoryItem.stockMovements = [];

    res.json({
      success: true,
      data: inventoryItem,
      message: 'Inventory item retrieved successfully'
    });

  } catch (error) {
    console.error('Error retrieving inventory item:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: {
        code: 'INTERNAL_ERROR',
        details: 'Failed to retrieve inventory item'
      }
    });
  }
});

/**
 * PUT /api/v1/inventory/:id
 * Update inventory quantity
 */
router.put('/:id', patAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, reason, reference } = req.body;

    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inventory ID format',
        error: {
          code: 'INVALID_ID',
          details: 'Inventory ID must be a valid MongoDB ObjectId'
        }
      });
    }

    // Validate quantity
    if (quantity === undefined || quantity === null) {
      return res.status(400).json({
        success: false,
        message: 'Quantity is required',
        error: {
          code: 'REQUIRED_FIELD_MISSING',
          details: 'Quantity field is required for inventory update'
        }
      });
    }

    if (typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quantity value',
        error: {
          code: 'INVALID_QUANTITY',
          details: 'Quantity must be a non-negative number'
        }
      });
    }

    // Get client database model
    const Inventory = await dbManager.getModel(req.client.databaseName, 'Inventory', InventorySchema);

    // Find current inventory item
    const currentInventory = await Inventory.findById(id);

    if (!currentInventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
        error: {
          code: 'RESOURCE_NOT_FOUND',
          details: `Inventory item with ID ${id} does not exist`
        }
      });
    }

    const previousQuantity = currentInventory.quantity;

    // Update inventory
    const updatedInventory = await Inventory.findByIdAndUpdate(
      id,
      {
        quantity: quantity,
        lastUpdated: new Date()
      },
      { new: true }
    );

    // In a real system, you would also create a stock movement record here
    // const StockMovement = await dbManager.getModel(req.client.databaseName, 'StockMovement', StockMovementSchema);
    // await StockMovement.create({
    //   inventory: id,
    //   type: quantity > previousQuantity ? 'in' : 'out',
    //   quantity: Math.abs(quantity - previousQuantity),
    //   reason: reason || 'API update',
    //   reference: reference || `API-${Date.now()}`,
    //   date: new Date()
    // });

    res.json({
      success: true,
      data: {
        _id: updatedInventory._id,
        quantity: updatedInventory.quantity,
        previousQuantity: previousQuantity,
        lastUpdated: updatedInventory.lastUpdated
      },
      message: 'Inventory updated successfully'
    });

  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: {
        code: 'INTERNAL_ERROR',
        details: 'Failed to update inventory'
      }
    });
  }
});

/**
 * POST /api/v1/inventory
 * Create new inventory entry
 */
router.post('/', patAuth, async (req, res) => {
  try {
    const {
      product,
      warehouse,
      quantity = 0,
      minStockLevel = 0,
      maxStockLevel = 1000
    } = req.body;

    // Validate required fields
    if (!product || !warehouse) {
      return res.status(400).json({
        success: false,
        message: 'Product and warehouse are required',
        error: {
          code: 'REQUIRED_FIELD_MISSING',
          details: 'Both product and warehouse IDs are required'
        }
      });
    }

    // Validate ObjectIds
    if (!isValidObjectId(product) || !isValidObjectId(warehouse)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product or warehouse ID format',
        error: {
          code: 'INVALID_ID',
          details: 'Product and warehouse IDs must be valid MongoDB ObjectIds'
        }
      });
    }

    // Validate quantities
    if (typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quantity value',
        error: {
          code: 'INVALID_QUANTITY',
          details: 'Quantity must be a non-negative number'
        }
      });
    }

    // Get client database models
    const Inventory = await dbManager.getModel(req.client.databaseName, 'Inventory', InventorySchema);
    const Product = await dbManager.getModel(req.client.databaseName, 'Product', ProductSchema);
    const Warehouse = await dbManager.getModel(req.client.databaseName, 'Warehouse', WarehouseSchema);

    // Verify product and warehouse exist
    const [productExists, warehouseExists] = await Promise.all([
      Product.findById(product),
      Warehouse.findById(warehouse)
    ]);

    if (!productExists) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        error: {
          code: 'RESOURCE_NOT_FOUND',
          details: `Product with ID ${product} does not exist`
        }
      });
    }

    if (!warehouseExists) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found',
        error: {
          code: 'RESOURCE_NOT_FOUND',
          details: `Warehouse with ID ${warehouse} does not exist`
        }
      });
    }

    // Check if inventory entry already exists
    const existingInventory = await Inventory.findOne({ product, warehouse });

    if (existingInventory) {
      return res.status(409).json({
        success: false,
        message: 'Inventory entry already exists',
        error: {
          code: 'RESOURCE_ALREADY_EXISTS',
          details: 'Inventory entry for this product and warehouse combination already exists'
        }
      });
    }

    // Create new inventory entry
    const newInventory = await Inventory.create({
      product,
      warehouse,
      quantity,
      minStockLevel,
      maxStockLevel,
      lastUpdated: new Date()
    });

    res.status(201).json({
      success: true,
      data: {
        _id: newInventory._id,
        product: newInventory.product,
        warehouse: newInventory.warehouse,
        quantity: newInventory.quantity,
        minStockLevel: newInventory.minStockLevel,
        maxStockLevel: newInventory.maxStockLevel,
        lastUpdated: newInventory.lastUpdated
      },
      message: 'Inventory entry created successfully'
    });

  } catch (error) {
    console.error('Error creating inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: {
        code: 'INTERNAL_ERROR',
        details: 'Failed to create inventory entry'
      }
    });
  }
});

module.exports = router;
