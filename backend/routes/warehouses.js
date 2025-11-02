const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const { auth, authorize, requireClientCode } = require('../middleware/auth');

const router = express.Router();


// @route   GET /api/warehouses/transfers
// @desc    Get all inventory transfers
// @access  Private
router.get('/transfers', [auth, requireClientCode], async (req, res) => {
  try {
    const { InventoryTransfer, Warehouse, Product } = req.models;
    const { 
      page = 1, 
      limit = 10, 
      status, 
      warehouse, 
      product,
      startDate,
      endDate 
    } = req.query;

    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (warehouse) {
      query.$or = [
        { fromWarehouse: warehouse },
        { toWarehouse: warehouse }
      ];
    }
    
    if (product) {
      query.product = product;
    }
    
    if (startDate || endDate) {
      query.transferDate = {};
      if (startDate) query.transferDate.$gte = new Date(startDate);
      if (endDate) query.transferDate.$lte = new Date(endDate);
    }

    const transfers = await InventoryTransfer.find(query)
      .populate('product', 'name sku')
      .populate('fromWarehouse', 'name code')
      .populate('toWarehouse', 'name code')
      .populate('initiatedBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('completedBy', 'name email')
      .sort({ transferDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await InventoryTransfer.countDocuments(query);

    res.json({
      transfers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/warehouses
// @desc    Get all warehouses
// @access  Private
router.get('/', [auth, requireClientCode], async (req, res) => {
  try {
    const { Warehouse, Inventory } = req.models;
    const { page = 1, limit = 10, search, isActive } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const warehouses = await Warehouse.find(query)
      .populate('manager', 'name email')
      .populate('createdBy', 'name email')
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Fetch inventory stats for each warehouse
    const warehouseStats = await Promise.all(
      warehouses.map(async (wh) => {
        const statsArr = await Inventory.aggregate([
          { $match: { warehouse: wh._id } },
          {
            $group: {
              _id: null,
              totalProducts: { $sum: 1 },
              totalQuantity: { $sum: '$quantity' },
              totalReserved: { $sum: '$reservedQuantity' }
            }
          }
        ]);
        const stats = statsArr[0] || { totalProducts: 0, totalQuantity: 0, totalReserved: 0 };
        return {
          ...wh.toObject(),
          inventoryStats: stats
        };
      })
    );

    const total = await Warehouse.countDocuments(query);

    res.json({
      warehouses: warehouseStats,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/warehouses/:id
// @desc    Get warehouse by ID
// @access  Private
router.get('/:id', [auth, requireClientCode], async (req, res) => {
  try {
    const { Warehouse, Inventory } = req.models;
    const warehouse = await Warehouse.findById(req.params.id)
      .populate('manager', 'name email phone')
      .populate('createdBy', 'name email');

    if (!warehouse) {
      return res.status(404).json({ message: 'Warehouse not found' });
    }

    // Get inventory statistics
    const inventoryStats = await Inventory.aggregate([
      { $match: { warehouse: warehouse._id } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalReserved: { $sum: '$reservedQuantity' }
        }
      }
    ]);

    const stats = inventoryStats[0] || {
      totalProducts: 0,
      totalQuantity: 0,
      totalReserved: 0
    };

    res.json({
      ...warehouse.toObject(),
      inventoryStats: stats
    });
  } catch (error) {
    console.error(error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid warehouse ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/warehouses
// @desc    Create new warehouse
// @access  Private (Admin/Manager)
router.post('/', [
  auth,
  requireClientCode,
  authorize('admin', 'manager'),
  body('name').trim().notEmpty().withMessage('Warehouse name is required'),
  body('code').trim().notEmpty().withMessage('Warehouse code is required'),
  body('capacity').optional().isNumeric().withMessage('Capacity must be a number')
], async (req, res) => {
  try {
    const { Warehouse } = req.models;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const {
      name, code, address, manager, capacity
    } = req.body;

    // Check if warehouse name already exists
    const existingName = await Warehouse.findOne({ 
      name: { $regex: `^${name}$`, $options: 'i' } 
    });

    if (existingName) {
      return res.status(400).json({ message: 'Warehouse name already exists' });
    }

    // Check if warehouse code already exists
    const existingCode = await Warehouse.findOne({ 
      code: { $regex: `^${code}$`, $options: 'i' } 
    });

    if (existingCode) {
      return res.status(400).json({ message: 'Warehouse code already exists' });
    }

    // Check if manager exists (if provided)
    if (manager) {
      const managerExists = await User.findById(manager);
      if (!managerExists) {
        return res.status(400).json({ message: 'Invalid manager' });
      }
    }

    const warehouse = new Warehouse({
      name,
      code: code.toUpperCase(),
      address,
      manager,
      capacity,
      createdBy: req.user._id
    });

    await warehouse.save();
    await warehouse.populate([
      { path: 'manager', select: 'name email' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.status(201).json({
      message: 'Warehouse created successfully',
      warehouse
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/warehouses/:id
// @desc    Update warehouse
// @access  Private (Admin/Manager)
router.put('/:id', [
  auth,
  requireClientCode,
  authorize('admin', 'manager'),
  body('name').optional().trim().notEmpty().withMessage('Warehouse name cannot be empty'),
  body('code').optional().trim().notEmpty().withMessage('Warehouse code cannot be empty'),
  body('capacity').optional().isNumeric().withMessage('Capacity must be a number')
], async (req, res) => {
  try {
    const { Warehouse } = req.models;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const updateFields = { ...req.body };
    
    if (updateFields.code) {
      updateFields.code = updateFields.code.toUpperCase();
    }

    // Check if new name already exists for another warehouse
    if (updateFields.name) {
      const existingName = await Warehouse.findOne({ 
        name: { $regex: `^${updateFields.name}$`, $options: 'i' },
        _id: { $ne: req.params.id }
      });

      if (existingName) {
        return res.status(400).json({ message: 'Warehouse name already exists' });
      }
    }

    // Check if new code already exists for another warehouse
    if (updateFields.code) {
      const existingCode = await Warehouse.findOne({ 
        code: { $regex: `^${updateFields.code}$`, $options: 'i' },
        _id: { $ne: req.params.id }
      });

      if (existingCode) {
        return res.status(400).json({ message: 'Warehouse code already exists' });
      }
    }

    // Check if manager exists (if updating manager)
    if (updateFields.manager) {
      const managerExists = await User.findById(updateFields.manager);
      if (!managerExists) {
        return res.status(400).json({ message: 'Invalid manager' });
      }
    }

    const warehouse = await Warehouse.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    ).populate([
      { path: 'manager', select: 'name email' },
      { path: 'createdBy', select: 'name email' }
    ]);

    if (!warehouse) {
      return res.status(404).json({ message: 'Warehouse not found' });
    }

    res.json({
      message: 'Warehouse updated successfully',
      warehouse
    });
  } catch (error) {
    console.error(error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid warehouse ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/warehouses/:id
// @desc    Delete warehouse
// @access  Private (Admin)
router.delete('/:id', [auth, requireClientCode, authorize('admin')], async (req, res) => {
  try {
    const { Warehouse, Inventory } = req.models;
    // Check if warehouse has inventory
    const inventoryCount = await Inventory.countDocuments({ 
      warehouse: req.params.id,
      quantity: { $gt: 0 }
    });

    if (inventoryCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete warehouse. It has existing inventory' 
      });
    }

    const warehouse = await Warehouse.findByIdAndDelete(req.params.id);

    if (!warehouse) {
      return res.status(404).json({ message: 'Warehouse not found' });
    }

    // Clean up any zero inventory records
    await Inventory.deleteMany({ warehouse: req.params.id });

    res.json({ message: 'Warehouse deleted successfully' });
  } catch (error) {
    console.error(error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid warehouse ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/warehouses/:id/inventory
// @desc    Get warehouse inventory
// @access  Private
router.get('/:id/inventory', [auth, requireClientCode], async (req, res) => {
  try {
    const { Warehouse, Inventory } = req.models;
    const { page = 1, limit = 10, search } = req.query;
    const warehouse = await Warehouse.findById(req.params.id);

    if (!warehouse) {
      return res.status(404).json({ message: 'Warehouse not found' });
    }

    let matchStage = { warehouse: warehouse._id };

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
      { $unwind: '$categoryInfo' }
    ];

    // Add search functionality
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { 'productInfo.name': { $regex: search, $options: 'i' } },
            { 'productInfo.sku': { $regex: search, $options: 'i' } },
            { 'categoryInfo.name': { $regex: search, $options: 'i' } }
          ]
        }
      });
    }

    // Add pagination
    pipeline.push(
      { $skip: (page - 1) * limit },
      { $limit: parseInt(limit) },
      {
        $project: {
          _id: 1,
          quantity: 1,
          reservedQuantity: 1,
          availableQuantity: { $subtract: ['$quantity', '$reservedQuantity'] },
          location: 1,
          lastRestocked: 1,
          lastSold: 1,
          product: '$productInfo',
          category: '$categoryInfo'
        }
      }
    );

    const inventory = await Inventory.aggregate(pipeline);

    // Get total count for pagination
    const countPipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' }
    ];

    if (search) {
      countPipeline.push({
        $match: {
          $or: [
            { 'productInfo.name': { $regex: search, $options: 'i' } },
            { 'productInfo.sku': { $regex: search, $options: 'i' } }
          ]
        }
      });
    }

    countPipeline.push({ $count: 'total' });
    const totalResult = await Inventory.aggregate(countPipeline);
    const total = totalResult[0]?.total || 0;

    res.json({
      inventory,
      warehouse: {
        id: warehouse._id,
        name: warehouse.name,
        code: warehouse.code
      },
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid warehouse ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/warehouses/:id/inventory/:productId
// @desc    Update product inventory in warehouse
// @access  Private (Admin/Manager)
router.put('/:id/inventory/:productId', [
  auth,
  requireClientCode,
  authorize('admin', 'manager'),
  body('quantity').isNumeric().withMessage('Quantity must be a number'),
  body('reservedQuantity').optional().isNumeric().withMessage('Reserved quantity must be a number')
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

    const { quantity, reservedQuantity, location } = req.body;

    const inventory = await Inventory.findOneAndUpdate(
      { warehouse: req.params.id, product: req.params.productId },
      {
        quantity,
        reservedQuantity: reservedQuantity || 0,
        location,
        lastRestocked: quantity > 0 ? new Date() : undefined
      },
      { new: true, upsert: true, runValidators: true }
    ).populate([
      { path: 'product', select: 'name sku' },
      { path: 'warehouse', select: 'name code' }
    ]);

    res.json({
      message: 'Inventory updated successfully',
      inventory
    });
  } catch (error) {
    console.error(error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid warehouse or product ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/warehouses/transfer
// @desc    Create inventory transfer between warehouses
// @access  Private (Admin/Manager)
router.post('/transfer', [
  auth,
  requireClientCode,
  authorize('admin', 'manager'),
  body('product').notEmpty().withMessage('Product is required'),
  body('fromWarehouse').notEmpty().withMessage('Source warehouse is required'),
  body('toWarehouse').notEmpty().withMessage('Destination warehouse is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('reason').isIn(['restock', 'relocation', 'demand', 'maintenance', 'other']).withMessage('Invalid reason')
], async (req, res) => {
  try {
    const { Warehouse, Inventory, InventoryTransfer, Product } = req.models;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { product, fromWarehouse, toWarehouse, quantity, reason, notes } = req.body;

    // Validate warehouses exist
    const [sourceWarehouse, destWarehouse] = await Promise.all([
      Warehouse.findById(fromWarehouse),
      Warehouse.findById(toWarehouse)
    ]);

    if (!sourceWarehouse || !destWarehouse) {
      return res.status(404).json({ message: 'Warehouse not found' });
    }

    if (fromWarehouse === toWarehouse) {
      return res.status(400).json({ message: 'Source and destination warehouses cannot be the same' });
    }

    // Check if source warehouse has enough inventory
    const sourceInventory = await Inventory.findOne({ 
      product, 
      warehouse: fromWarehouse 
    });

    if (!sourceInventory || sourceInventory.availableQuantity < quantity) {
      return res.status(400).json({ 
        message: 'Insufficient inventory in source warehouse',
        available: sourceInventory?.availableQuantity || 0,
        requested: quantity
      });
    }

    // Validate product exists
    const productInfo = await Product.findById(product);
    if (!productInfo) {
      return res.status(404).json({ message: 'Product not found' });
    }


    // Generate unique transfer number: TRF-YYYYMMDD-XXXX
    const datePart = new Date().toISOString().slice(0,10).replace(/-/g, '');
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    const transferNumber = `TRF-${datePart}-${randomPart}`;

    const transfer = new InventoryTransfer({
      transferNumber,
      product,
      fromWarehouse,
      toWarehouse,
      quantity,
      reason,
      notes,
      initiatedBy: req.user._id
    });

    await transfer.save();

    // Reserve inventory in source warehouse
    await Inventory.findOneAndUpdate(
      { product, warehouse: fromWarehouse },
      { $inc: { reservedQuantity: quantity } }
    );

    await transfer.populate([
      { path: 'product', select: 'name sku' },
      { path: 'fromWarehouse', select: 'name code' },
      { path: 'toWarehouse', select: 'name code' },
      { path: 'initiatedBy', select: 'name email' }
    ]);

    res.status(201).json({
      message: 'Inventory transfer initiated successfully',
      transfer
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/warehouses/transfers/:id/approve
// @desc    Approve inventory transfer
// @access  Private (Admin/Manager)
router.put('/transfers/:id/approve', [auth, requireClientCode, authorize('admin', 'manager')], async (req, res) => {
  try {
    const { InventoryTransfer } = req.models;
    const transfer = await InventoryTransfer.findById(req.params.id);

    if (!transfer) {
      return res.status(404).json({ message: 'Transfer not found' });
    }

    if (transfer.status !== 'pending') {
      return res.status(400).json({ message: 'Transfer is not in pending status' });
    }

    transfer.status = 'in_transit';
    transfer.approvedBy = req.user._id;
    await transfer.save();

    await transfer.populate([
      { path: 'product', select: 'name sku' },
      { path: 'fromWarehouse', select: 'name code' },
      { path: 'toWarehouse', select: 'name code' },
      { path: 'approvedBy', select: 'name email' }
    ]);

    res.json({
      message: 'Transfer approved successfully',
      transfer
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/warehouses/transfers/:id/complete
// @desc    Complete inventory transfer
// @access  Private (Admin/Manager)
router.put('/transfers/:id/complete', [auth, requireClientCode, authorize('admin', 'manager')], async (req, res) => {
  try {
    const { InventoryTransfer, Inventory } = req.models;
    const transfer = await InventoryTransfer.findById(req.params.id);

    if (!transfer) {
      return res.status(404).json({ message: 'Transfer not found' });
    }

    if (transfer.status !== 'in_transit') {
      return res.status(400).json({ message: 'Transfer is not in transit' });
    }


    // Remove from source warehouse
    await Inventory.findOneAndUpdate(
      { product: transfer.product, warehouse: transfer.fromWarehouse },
      { 
        $inc: { 
          quantity: -transfer.quantity,
          reservedQuantity: -transfer.quantity
        }
      }
    );

    // Add to destination warehouse
    await Inventory.findOneAndUpdate(
      { product: transfer.product, warehouse: transfer.toWarehouse },
      { 
        $inc: { quantity: transfer.quantity },
        $set: { lastRestocked: new Date() }
      },
      { upsert: true }
    );

    // Update transfer status
    transfer.status = 'completed';
    transfer.completedBy = req.user._id;
    transfer.completedDate = new Date();
    await transfer.save();

    await transfer.populate([
      { path: 'product', select: 'name sku' },
      { path: 'fromWarehouse', select: 'name code' },
      { path: 'toWarehouse', select: 'name code' },
      { path: 'completedBy', select: 'name email' }
    ]);

    res.json({
      message: 'Transfer completed successfully',
      transfer
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/warehouses/transfers/:id
// @desc    Cancel inventory transfer
// @access  Private (Admin/Manager)
router.delete('/transfers/:id', [auth, requireClientCode, authorize('admin', 'manager')], async (req, res) => {
  try {
    const { InventoryTransfer, Inventory } = req.models;
    const transfer = await InventoryTransfer.findById(req.params.id);

    if (!transfer) {
      return res.status(404).json({ message: 'Transfer not found' });
    }

    if (transfer.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel completed transfer' });
    }

    // If transfer was in progress, unreserve inventory
    if (transfer.status === 'pending' || transfer.status === 'in_transit') {
      await Inventory.findOneAndUpdate(
        { product: transfer.product, warehouse: transfer.fromWarehouse },
        { $inc: { reservedQuantity: -transfer.quantity } }
      );
    }

    transfer.status = 'cancelled';
    await transfer.save();

    res.json({ message: 'Transfer cancelled successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/warehouses/:id/analytics
// @desc    Get warehouse analytics and performance metrics
// @access  Private
router.get('/:id/analytics', [auth, requireClientCode], async (req, res) => {
  try {
    const { Warehouse, Inventory, InventoryTransfer } = req.models;
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) {
      return res.status(404).json({ message: 'Warehouse not found' });
    }

    // Get inventory metrics
    const inventoryMetrics = await Inventory.aggregate([
      { $match: { warehouse: warehouse._id } },
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

    // Get transfer statistics
    const transferStats = await InventoryTransfer.aggregate([
      {
        $match: {
          $or: [
            { fromWarehouse: warehouse._id },
            { toWarehouse: warehouse._id }
          ],
          transferDate: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' }
        }
      }
    ]);

    // Get top products by quantity
    const topProducts = await Inventory.aggregate([
      { $match: { warehouse: warehouse._id } },
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
        $project: {
          product: '$productInfo',
          quantity: 1,
          reservedQuantity: 1,
          availableQuantity: { $subtract: ['$quantity', '$reservedQuantity'] }
        }
      },
      { $sort: { quantity: -1 } },
      { $limit: 10 }
    ]);

    const metrics = inventoryMetrics[0] || {
      totalProducts: 0,
      totalQuantity: 0,
      totalReserved: 0,
      totalValue: 0,
      lowStockItems: 0,
      outOfStockItems: 0
    };

    res.json({
      warehouse: {
        id: warehouse._id,
        name: warehouse.name,
        code: warehouse.code,
        capacity: warehouse.capacity,
        occupancyPercentage: warehouse.occupancyPercentage
      },
      metrics,
      transferStats,
      topProducts,
      period: `${days} days`
    });
  } catch (error) {
    console.error(error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid warehouse ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
