const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const { auth, authorize, requireClientCode } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/inventory
// @desc    Get consolidated inventory across all warehouses
// @access  Private
router.get('/', [auth, requireClientCode], async (req, res) => {
  try {
    const { Inventory } = req.models;
    const { 
      page = 1, 
      limit = 10, 
      search, 
      warehouse, 
      category,
      lowStock = false,
      outOfStock = false,
      sortBy = 'product.name',
      sortOrder = 'asc'
    } = req.query;

    let matchStage = {};
    
    if (warehouse) {
      matchStage.warehouse = new mongoose.Types.ObjectId(warehouse);
    }

    if (lowStock === 'true') {
      matchStage.$expr = { $lte: ['$quantity', '$productInfo.reorderLevel'] };
    }

    if (outOfStock === 'true') {
      matchStage.quantity = 0;
    }

    const pipeline = [
      { $match: matchStage },
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
        $lookup: {
          from: 'categories',
          localField: 'productInfo.category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      { $unwind: '$categoryInfo' },
      {
        $lookup: {
          from: 'warehouses',
          localField: 'warehouse',
          foreignField: '_id',
          as: 'warehouseInfo'
        }
      },
      { $unwind: '$warehouseInfo' }
    ];

    // Add search functionality
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { 'productInfo.name': { $regex: search, $options: 'i' } },
            { 'productInfo.sku': { $regex: search, $options: 'i' } },
            { 'warehouseInfo.name': { $regex: search, $options: 'i' } },
            { 'categoryInfo.name': { $regex: search, $options: 'i' } }
          ]
        }
      });
    }

    // Add category filter
    if (category) {
      pipeline.push({
        $match: { 'productInfo.category': new mongoose.Types.ObjectId(category) }
      });
    }

    // Add sorting
    const sortStage = {};
    const sortPath = sortBy.replace('.', 'Info.').replace('product', 'productInfo').replace('warehouse', 'warehouseInfo');
    sortStage[sortPath] = sortOrder === 'desc' ? -1 : 1;
    pipeline.push({ $sort: sortStage });

    // Add pagination
    pipeline.push(
      { $skip: (page - 1) * limit },
      { $limit: parseInt(limit) }
    );

    // Project final structure
    pipeline.push({
      $project: {
        _id: 1,
        quantity: 1,
        reservedQuantity: 1,
        availableQuantity: { $subtract: ['$quantity', '$reservedQuantity'] },
        location: 1,
        lastRestocked: 1,
        lastSold: 1,
        product: {
          _id: '$productInfo._id',
          name: '$productInfo.name',
          sku: '$productInfo.sku',
          unit: '$productInfo.unit',
          costPrice: '$productInfo.costPrice',
          sellingPrice: '$productInfo.sellingPrice',
          reorderLevel: '$productInfo.reorderLevel',
          minStockLevel: '$productInfo.minStockLevel'
        },
        category: {
          _id: '$categoryInfo._id',
          name: '$categoryInfo.name'
        },
        warehouse: {
          _id: '$warehouseInfo._id',
          name: '$warehouseInfo.name',
          code: '$warehouseInfo.code'
        },
        totalValue: { $multiply: ['$quantity', '$productInfo.costPrice'] },
        isLowStock: { $lte: ['$quantity', '$productInfo.reorderLevel'] },
        isOutOfStock: { $eq: ['$quantity', 0] }
      }
    });

    const inventory = await Inventory.aggregate(pipeline);

    // Get total count for pagination
    const countPipeline = [...pipeline.slice(0, -3)]; // Remove sort, skip, limit, and project
    countPipeline.push({ $count: 'total' });
    const totalResult = await Inventory.aggregate(countPipeline);
    const total = totalResult[0]?.total || 0;

    res.json({
      inventory,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/inventory/summary
// @desc    Get inventory summary statistics
// @access  Private
router.get('/summary', [auth, requireClientCode], async (req, res) => {
  try {
    const { Inventory } = req.models;
    const { warehouse } = req.query;
    let matchStage = {};
    
    if (warehouse) {
      matchStage.warehouse = new mongoose.Types.ObjectId(warehouse);
    }

    const summary = await Inventory.aggregate([
      { $match: matchStage },
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
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalReserved: { $sum: '$reservedQuantity' },
          totalAvailable: { $sum: { $subtract: ['$quantity', '$reservedQuantity'] } },
          totalValue: { $sum: { $multiply: ['$quantity', '$productInfo.costPrice'] } },
          lowStockItems: {
            $sum: {
              $cond: [
                { $lte: ['$quantity', '$productInfo.reorderLevel'] },
                1,
                0
              ]
            }
          },
          outOfStockItems: {
            $sum: {
              $cond: [
                { $eq: ['$quantity', 0] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const warehouseStats = await Inventory.aggregate([
      { $match: matchStage },
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
        $group: {
          _id: '$warehouse',
          warehouse: { $first: '$warehouseInfo' },
          totalProducts: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalReserved: { $sum: '$reservedQuantity' }
        }
      },
      { $sort: { 'warehouse.name': 1 } }
    ]);

    const categoryStats = await Inventory.aggregate([
      { $match: matchStage },
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
        $lookup: {
          from: 'categories',
          localField: 'productInfo.category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      { $unwind: '$categoryInfo' },
      {
        $group: {
          _id: '$productInfo.category',
          category: { $first: '$categoryInfo' },
          totalProducts: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: { $multiply: ['$quantity', '$productInfo.costPrice'] } }
        }
      },
      { $sort: { 'category.name': 1 } }
    ]);

    res.json({
      summary: summary[0] || {
        totalProducts: 0,
        totalQuantity: 0,
        totalReserved: 0,
        totalAvailable: 0,
        totalValue: 0,
        lowStockItems: 0,
        outOfStockItems: 0
      },
      warehouseStats,
      categoryStats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/inventory/alerts
// @desc    Get inventory alerts (low stock, out of stock, overstock)
// @access  Private
router.get('/alerts', [auth, requireClientCode], async (req, res) => {
  try {
    const { Inventory } = req.models;
    const { warehouse, severity = 'all' } = req.query;
    let matchStage = {};
    
    if (warehouse) {
      matchStage.warehouse = new mongoose.Types.ObjectId(warehouse);
    }

    const alerts = await Inventory.aggregate([
      { $match: matchStage },
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
        $lookup: {
          from: 'warehouses',
          localField: 'warehouse',
          foreignField: '_id',
          as: 'warehouseInfo'
        }
      },
      { $unwind: '$warehouseInfo' },
      {
        $addFields: {
          alertType: {
            $cond: {
              if: { $eq: ['$quantity', 0] },
              then: 'out_of_stock',
              else: {
                $cond: {
                  if: { $lte: ['$quantity', '$productInfo.reorderLevel'] },
                  then: 'low_stock',
                  else: {
                    $cond: {
                      if: { $gte: ['$quantity', { $multiply: ['$productInfo.reorderLevel', 3] }] },
                      then: 'overstock',
                      else: null
                    }
                  }
                }
              }
            }
          },
          severity: {
            $cond: {
              if: { $eq: ['$quantity', 0] },
              then: 'critical',
              else: {
                $cond: {
                  if: { $lt: ['$quantity', '$productInfo.minStockLevel'] },
                  then: 'high',
                  else: 'medium'
                }
              }
            }
          }
        }
      },
      {
        $match: {
          alertType: { $ne: null }
        }
      }
    ]);

    // Filter by severity if specified
    let filteredAlerts = alerts;
    if (severity !== 'all') {
      filteredAlerts = alerts.filter(alert => alert.severity === severity);
    }

    // Sort by severity (critical, high, medium)
    const severityOrder = { critical: 0, high: 1, medium: 2 };
    filteredAlerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    res.json({
      alerts: filteredAlerts,
      count: filteredAlerts.length,
      breakdown: {
        critical: alerts.filter(a => a.severity === 'critical').length,
        high: alerts.filter(a => a.severity === 'high').length,
        medium: alerts.filter(a => a.severity === 'medium').length
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/inventory/adjustment
// @desc    Create inventory adjustment
// @access  Private (Admin/Manager)
router.post('/adjustment', [
  auth,
  requireClientCode,
  authorize('admin', 'manager'),
  body('warehouse').notEmpty().withMessage('Warehouse is required'),
  body('product').notEmpty().withMessage('Product is required'),
  body('adjustmentType').isIn(['increase', 'decrease', 'set']).withMessage('Invalid adjustment type'),
  body('quantity').isNumeric().withMessage('Quantity must be a number'),
  body('reason').isIn(['recount', 'damage', 'theft', 'expiry', 'found', 'correction', 'other']).withMessage('Invalid reason')
], async (req, res) => {
  try {
    const { Inventory, Product, Warehouse } = req.models;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { warehouse, product, adjustmentType, quantity, reason, notes, location } = req.body;

    // Validate warehouse and product exist
    const [warehouseExists, productExists] = await Promise.all([
      Warehouse.findById(warehouse),
      Product.findById(product)
    ]);

    if (!warehouseExists) {
      return res.status(404).json({ message: 'Warehouse not found' });
    }

    if (!productExists) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Find or create inventory record
    let inventory = await Inventory.findOne({ warehouse, product });
    
    if (!inventory) {
      inventory = new Inventory({
        warehouse,
        product,
        quantity: 0,
        reservedQuantity: 0,
        location: location || {}
      });
    }

    const previousQuantity = inventory.quantity;
    let newQuantity = previousQuantity;

    // Apply adjustment
    switch (adjustmentType) {
      case 'increase':
        newQuantity = previousQuantity + Number(quantity);
        break;
      case 'decrease':
        newQuantity = Math.max(0, previousQuantity - Number(quantity));
        break;
      case 'set':
        newQuantity = Number(quantity);
        break;
    }

    const adjustmentQuantity = newQuantity - previousQuantity;

    // Update inventory
    inventory.quantity = newQuantity;
    inventory.lastRestocked = adjustmentQuantity > 0 ? new Date() : inventory.lastRestocked;
    
    // Update location if provided
    if (location && typeof location === 'object') {
      inventory.location = {
        aisle: location.aisle || inventory.location?.aisle || '',
        shelf: location.shelf || inventory.location?.shelf || '',
        bin: location.bin || inventory.location?.bin || ''
      };
    }
    
    await inventory.save();

    // Create adjustment record (you might want to create a separate AdjustmentHistory model)
    const adjustmentRecord = {
      warehouse,
      product,
      adjustmentType,
      previousQuantity,
      adjustmentQuantity,
      newQuantity,
      reason,
      notes,
      adjustedBy: req.user._id,
      adjustedAt: new Date()
    };

    await inventory.populate([
      { path: 'product', select: 'name sku unit' },
      { path: 'warehouse', select: 'name code' }
    ]);

    res.json({
      message: 'Inventory adjustment completed successfully',
      inventory,
      adjustment: adjustmentRecord
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/inventory/movements
// @desc    Get inventory movement history
// @access  Private
router.get('/movements', [auth, requireClientCode], async (req, res) => {
  try {
    const { InventoryTransfer } = req.models;
    const { 
      page = 1, 
      limit = 10, 
      warehouse, 
      product,
      startDate,
      endDate,
      movementType = 'all' // 'all', 'in', 'out', 'transfer'
    } = req.query;

    // This would typically come from a separate InventoryMovement model
    // For now, we'll use transfer data and purchase/sales data
    let movements = [];

    // Get transfers
    const transferQuery = {};
    if (warehouse) {
      transferQuery.$or = [
        { fromWarehouse: warehouse },
        { toWarehouse: warehouse }
      ];
    }
    if (product) {
      transferQuery.product = product;
    }
    if (startDate || endDate) {
      transferQuery.transferDate = {};
      if (startDate) transferQuery.transferDate.$gte = new Date(startDate);
      if (endDate) transferQuery.transferDate.$lte = new Date(endDate);
    }

    const transfers = await InventoryTransfer.find(transferQuery)
      .populate('product', 'name sku')
      .populate('fromWarehouse', 'name code')
      .populate('toWarehouse', 'name code')
      .populate('initiatedBy', 'name')
      .sort({ transferDate: -1 })
      .limit(50);

    transfers.forEach(transfer => {
      if (!warehouse || transfer.fromWarehouse._id.toString() === warehouse) {
        movements.push({
          type: 'transfer_out',
          date: transfer.transferDate,
          product: transfer.product,
          warehouse: transfer.fromWarehouse,
          relatedWarehouse: transfer.toWarehouse,
          quantity: -transfer.quantity,
          reference: transfer.transferNumber,
          status: transfer.status,
          user: transfer.initiatedBy
        });
      }
      
      if ((!warehouse || transfer.toWarehouse._id.toString() === warehouse) && transfer.status === 'completed') {
        movements.push({
          type: 'transfer_in',
          date: transfer.completedDate || transfer.transferDate,
          product: transfer.product,
          warehouse: transfer.toWarehouse,
          relatedWarehouse: transfer.fromWarehouse,
          quantity: transfer.quantity,
          reference: transfer.transferNumber,
          status: transfer.status,
          user: transfer.initiatedBy
        });
      }
    });

    // Sort by date
    movements.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Filter by movement type
    if (movementType !== 'all') {
      if (movementType === 'in') {
        movements = movements.filter(m => m.quantity > 0);
      } else if (movementType === 'out') {
        movements = movements.filter(m => m.quantity < 0);
      } else if (movementType === 'transfer') {
        movements = movements.filter(m => m.type.includes('transfer'));
      }
    }

    // Paginate
    const total = movements.length;
    const startIndex = (page - 1) * limit;
    const paginatedMovements = movements.slice(startIndex, startIndex + parseInt(limit));

    res.json({
      movements: paginatedMovements,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/inventory/valuation
// @desc    Get inventory valuation report
// @access  Private
router.get('/valuation', [auth, requireClientCode], async (req, res) => {
  try {
    const { Inventory } = req.models;
    const { warehouse, category, method = 'cost' } = req.query; // method: 'cost' or 'selling'
    
    let matchStage = {};
    if (warehouse) {
      matchStage.warehouse = new mongoose.Types.ObjectId(warehouse);
    }

    const valuationPipeline = [
      { $match: matchStage },
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
        $lookup: {
          from: 'categories',
          localField: 'productInfo.category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      { $unwind: '$categoryInfo' },
      {
        $lookup: {
          from: 'warehouses',
          localField: 'warehouse',
          foreignField: '_id',
          as: 'warehouseInfo'
        }
      },
      { $unwind: '$warehouseInfo' }
    ];

    // Add category filter
    if (category) {
      valuationPipeline.push({
        $match: { 'productInfo.category': new mongoose.Types.ObjectId(category) }
      });
    }

    // Calculate values
    const priceField = method === 'selling' ? '$productInfo.sellingPrice' : '$productInfo.costPrice';
    
    valuationPipeline.push({
      $addFields: {
        totalValue: { $multiply: ['$quantity', priceField] },
        availableValue: { 
          $multiply: [
            { $subtract: ['$quantity', '$reservedQuantity'] }, 
            priceField
          ] 
        },
        reservedValue: { $multiply: ['$reservedQuantity', priceField] }
      }
    });

    const valuation = await Inventory.aggregate(valuationPipeline);

    // Group by warehouse
    const warehouseValuation = valuation.reduce((acc, item) => {
      const warehouseId = item.warehouseInfo._id.toString();
      if (!acc[warehouseId]) {
        acc[warehouseId] = {
          warehouse: item.warehouseInfo,
          totalValue: 0,
          availableValue: 0,
          reservedValue: 0,
          productCount: 0,
          categories: {}
        };
      }
      
      acc[warehouseId].totalValue += item.totalValue;
      acc[warehouseId].availableValue += item.availableValue;
      acc[warehouseId].reservedValue += item.reservedValue;
      acc[warehouseId].productCount += 1;

      // Group by category
      const categoryId = item.categoryInfo._id.toString();
      if (!acc[warehouseId].categories[categoryId]) {
        acc[warehouseId].categories[categoryId] = {
          category: item.categoryInfo,
          totalValue: 0,
          productCount: 0
        };
      }
      acc[warehouseId].categories[categoryId].totalValue += item.totalValue;
      acc[warehouseId].categories[categoryId].productCount += 1;

      return acc;
    }, {});

    // Convert to array
    const warehouseArray = Object.values(warehouseValuation).map(wh => ({
      ...wh,
      categories: Object.values(wh.categories)
    }));

    // Calculate totals
    const totals = valuation.reduce((acc, item) => {
      acc.totalValue += item.totalValue;
      acc.availableValue += item.availableValue;
      acc.reservedValue += item.reservedValue;
      return acc;
    }, { totalValue: 0, availableValue: 0, reservedValue: 0 });

    res.json({
      totals,
      warehouses: warehouseArray,
      method,
      itemCount: valuation.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/inventory/bulk-update
// @desc    Bulk update inventory quantities
// @access  Private (Admin/Manager)
router.post('/bulk-update', [
  auth,
  requireClientCode,
  authorize('admin', 'manager'),
  body('updates').isArray({ min: 1 }).withMessage('Updates array is required'),
  body('updates.*.warehouse').notEmpty().withMessage('Warehouse is required for each update'),
  body('updates.*.product').notEmpty().withMessage('Product is required for each update'),
  body('updates.*.quantity').isNumeric().withMessage('Quantity must be a number for each update')
], async (req, res) => {
  try {
    const { Inventory } = req.models;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { updates } = req.body;
    const session = await mongoose.startSession();
    
    try {
      const results = await session.withTransaction(async () => {
        const updateResults = [];
        
        for (const update of updates) {
          const { warehouse, product, quantity, location } = update;
          
          // Find or create inventory record
          let inventory = await Inventory.findOne({ warehouse, product }).session(session);
          
          if (!inventory) {
            inventory = new Inventory({
              warehouse,
              product,
              quantity: 0,
              reservedQuantity: 0
            });
          }

          const previousQuantity = inventory.quantity;
          inventory.quantity = Number(quantity);
          inventory.location = location || inventory.location;
          inventory.lastRestocked = quantity > previousQuantity ? new Date() : inventory.lastRestocked;
          
          await inventory.save({ session });
          
          updateResults.push({
            warehouse,
            product,
            previousQuantity,
            newQuantity: Number(quantity),
            adjustmentQuantity: Number(quantity) - previousQuantity
          });
        }
        
        return updateResults;
      });

      res.json({
        message: 'Bulk inventory update completed successfully',
        results,
        updatedCount: results.length
      });
    } finally {
      await session.endSession();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
