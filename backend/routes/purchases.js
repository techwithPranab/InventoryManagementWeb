// --- Purchase Order Workflow Transitions ---

// Place these routes after router is defined

const express = require('express');
const { body, validationResult } = require('express-validator');
const PurchaseOrder = require('../models/PurchaseOrder');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const Inventory = require('../models/Inventory');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/purchases
// @desc    Get all purchase orders
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      warehouse,
      startDate,
      endDate,
      search
    } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (warehouse) {
      query.warehouse = warehouse;
    }

    if (startDate || endDate) {
      query.orderDate = {};
      if (startDate) query.orderDate.$gte = new Date(startDate);
      if (endDate) query.orderDate.$lte = new Date(endDate);
    }

    if (search) {
      const suppliers = await require('../models/Supplier').find({
        name: { $regex: search, $options: 'i' }
      }).select('_id');
      
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { supplier: { $in: suppliers.map(s => s._id) } }
      ];
    }

    const purchaseOrders = await PurchaseOrder.find(query)
      .populate('supplier', 'name email phone')
      .populate('warehouse', 'name code')
      .populate('items.product', 'name sku')
      .populate('createdBy', 'name email')
      .sort({ orderDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await PurchaseOrder.countDocuments(query);

    res.json({
      purchaseOrders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/purchases/metrics
// @desc    Get purchase order metrics and analytics
// @access  Private
router.get('/metrics', auth, async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get total counts by status
    const statusCounts = await PurchaseOrder.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Get approval metrics
    const approvalMetrics = await PurchaseOrder.aggregate([
      {
        $group: {
          _id: '$approvalStatus',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Get period-specific metrics
    const periodMetrics = await PurchaseOrder.aggregate([
      { $match: { orderDate: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          avgOrderValue: { $avg: '$totalAmount' },
          pendingApproval: {
            $sum: { $cond: [{ $eq: ['$status', 'pending_approval'] }, 1, 0] }
          },
          approved: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          },
          received: {
            $sum: { $cond: [{ $eq: ['$status', 'received'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get top suppliers by order count
    const topSuppliers = await PurchaseOrder.aggregate([
      { $match: { orderDate: { $gte: startDate } } },
      {
        $group: {
          _id: '$supplier',
          orderCount: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      },
      {
        $lookup: {
          from: 'suppliers',
          localField: '_id',
          foreignField: '_id',
          as: 'supplierInfo'
        }
      },
      { $unwind: '$supplierInfo' },
      {
        $project: {
          supplier: '$supplierInfo.name',
          orderCount: 1,
          totalAmount: 1
        }
      },
      { $sort: { orderCount: -1 } },
      { $limit: 5 }
    ]);

    // Get priority breakdown
    const priorityBreakdown = await PurchaseOrder.aggregate([
      { $match: { orderDate: { $gte: startDate } } },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    const totalOrders = await PurchaseOrder.countDocuments();
    const result = periodMetrics[0] || {
      totalOrders: 0,
      totalAmount: 0,
      avgOrderValue: 0,
      pendingApproval: 0,
      approved: 0,
      received: 0
    };

    res.json({
      overview: {
        ...result,
        totalOrders
      },
      statusCounts,
      approvalMetrics,
      topSuppliers,
      priorityBreakdown,
      period: `${days} days`
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/purchases/:id
// @desc    Get purchase order by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id)
      .populate('supplier', 'name email phone address')
      .populate('warehouse', 'name code address')
      .populate('items.product', 'name sku unit')
      .populate('createdBy', 'name email');

    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    res.json(purchaseOrder);
  } catch (error) {
    console.error(error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid purchase order ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/purchases
// @desc    Create new purchase order
// @access  Private (Admin/Manager)
router.post('/', [
  auth,
  authorize('admin', 'manager'),
  body('supplier').notEmpty().withMessage('Supplier is required'),
  body('warehouse').notEmpty().withMessage('Warehouse is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.product').notEmpty().withMessage('Product is required for each item'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be positive')
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
      supplier,
      warehouse,
      items,
      expectedDeliveryDate,
      notes,
      tax = 0,
      discount = 0
    } = req.body;

    // Verify warehouse exists
    const warehouseExists = await Warehouse.findById(warehouse);
    if (!warehouseExists) {
      return res.status(400).json({ message: 'Invalid warehouse' });
    }

    // Verify supplier exists
    const Supplier = require('../models/Supplier');
    const supplierExists = await Supplier.findById(supplier);
    if (!supplierExists) {
      return res.status(400).json({ message: 'Invalid supplier' });
    }

    // Verify all products exist and calculate totals
    let subtotal = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({ 
          message: `Product with ID ${item.product} not found` 
        });
      }

      const totalPrice = item.quantity * item.unitPrice;
      subtotal += totalPrice;

      processedItems.push({
        product: item.product,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice
      });
    }

    const totalAmount = subtotal + tax - discount;


    // Generate a unique order number (e.g., PO20250802-XXXX)
    const today = new Date();
    const dateStr = today.toISOString().slice(0,10).replace(/-/g, '');
    const count = await PurchaseOrder.countDocuments({
      orderDate: {
        $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
      }
    });
    const orderNumber = `PO${dateStr}-${(count+1).toString().padStart(4, '0')}`;

    const purchaseOrder = new PurchaseOrder({
      orderNumber,
      supplier,
      warehouse,
      items: processedItems,
      expectedDeliveryDate,
      notes,
      subtotal,
      tax,
      discount,
      totalAmount,
      createdBy: req.user._id
    });

    await purchaseOrder.save();
    await purchaseOrder.populate([
      { path: 'supplier', select: 'name email phone' },
      { path: 'warehouse', select: 'name code' },
      { path: 'items.product', select: 'name sku unit' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.status(201).json({
      message: 'Purchase order created successfully',
      purchaseOrder
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/purchases/:id
// @desc    Update purchase order
// @access  Private (Admin/Manager)
router.put('/:id', [
  auth,
  authorize('admin', 'manager'),
  body('supplier').optional().notEmpty().withMessage('Supplier cannot be empty'),
  body('status').optional().isIn(['draft', 'sent', 'confirmed', 'partial', 'received', 'cancelled']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const purchaseOrder = await PurchaseOrder.findById(req.params.id);
    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }


    // Only allow updates to non-received orders
    if (purchaseOrder.status === 'received' && req.body.status !== 'received') {
      return res.status(400).json({ 
        message: 'Cannot modify a received purchase order' 
      });
    }

    // Only allow status change from 'approved' to 'sent'
    if (req.body.status === 'sent' && purchaseOrder.status !== 'approved') {
      return res.status(400).json({
        message: "Only approved orders can be marked as 'sent'"
      });
    }

    const updateFields = { ...req.body };

    // If updating status to received, set actual delivery date
    if (updateFields.status === 'received' && purchaseOrder.status !== 'received') {
      updateFields.actualDeliveryDate = new Date();
    }

    const updatedPO = await PurchaseOrder.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    ).populate([
      { path: 'supplier', select: 'name email phone' },
      { path: 'warehouse', select: 'name code' },
      { path: 'items.product', select: 'name sku unit' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.json({
      message: 'Purchase order updated successfully',
      purchaseOrder: updatedPO
    });
  } catch (error) {
    console.error(error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid purchase order ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/purchases/:id/receive
// @desc    Receive purchase order items
// @access  Private (Admin/Manager)
router.post('/:id/receive', [
  auth,
  authorize('admin', 'manager'),
  body('items').isArray({ min: 1 }).withMessage('Items are required'),
  body('items.*.product').notEmpty().withMessage('Product ID is required'),
  body('items.*.receivedQuantity').isInt({ min: 0 }).withMessage('Received quantity must be non-negative')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { items: receivedItems } = req.body;

    const purchaseOrder = await PurchaseOrder.findById(req.params.id);
    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    if (purchaseOrder.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot receive cancelled purchase order' });
    }

    // Update received quantities and inventory
    for (const receivedItem of receivedItems) {
      const orderItem = purchaseOrder.items.find(
        item => item.product.toString() === receivedItem.product
      );

      if (!orderItem) {
        return res.status(400).json({ 
          message: `Product ${receivedItem.product} not found in purchase order` 
        });
      }

      if (receivedItem.receivedQuantity > orderItem.quantity) {
        return res.status(400).json({ 
          message: `Received quantity cannot exceed ordered quantity for product ${receivedItem.product}` 
        });
      }

      // Update received quantity in purchase order
      orderItem.receivedQuantity = receivedItem.receivedQuantity;

      // Update inventory if quantity received
      if (receivedItem.receivedQuantity > 0) {
        await Inventory.findOneAndUpdate(
          { 
            product: receivedItem.product, 
            warehouse: purchaseOrder.warehouse 
          },
          {
            $inc: { quantity: receivedItem.receivedQuantity },
            lastRestocked: new Date()
          },
          { upsert: true }
        );
      }
    }

    // Determine new status
    const allItemsReceived = purchaseOrder.items.every(
      item => item.receivedQuantity >= item.quantity
    );
    const someItemsReceived = purchaseOrder.items.some(
      item => item.receivedQuantity > 0
    );

    if (allItemsReceived) {
      purchaseOrder.status = 'received';
      purchaseOrder.actualDeliveryDate = new Date();
    } else if (someItemsReceived) {
      purchaseOrder.status = 'partial';
    }

    await purchaseOrder.save();
    await purchaseOrder.populate([
      { path: 'supplier', select: 'name email phone' },
      { path: 'warehouse', select: 'name code' },
      { path: 'items.product', select: 'name sku unit' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.json({
      message: 'Items received successfully',
      purchaseOrder
    });
  } catch (error) {
    console.error(error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid purchase order ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/purchases/:id
// @desc    Delete purchase order
// @access  Private (Admin)
router.delete('/:id', [auth, authorize('admin')], async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);

    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    // Only allow deletion of draft orders
    if (purchaseOrder.status !== 'draft') {
      return res.status(400).json({ 
        message: 'Only draft purchase orders can be deleted' 
      });
    }

    await PurchaseOrder.findByIdAndDelete(req.params.id);

    res.json({ message: 'Purchase order deleted successfully' });
  } catch (error) {
    console.error(error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid purchase order ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/purchases/reports/summary
// @desc    Get purchase summary report
// @access  Private
router.get('/reports/summary', auth, async (req, res) => {
  try {
    const { startDate, endDate, warehouse } = req.query;
    const matchStage = {};

    if (startDate || endDate) {
      matchStage.orderDate = {};
      if (startDate) matchStage.orderDate.$gte = new Date(startDate);
      if (endDate) matchStage.orderDate.$lte = new Date(endDate);
    }

    if (warehouse) {
      matchStage.warehouse = warehouse;
    }

    const summary = await PurchaseOrder.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          averageOrderValue: { $avg: '$totalAmount' },
          statusBreakdown: {
            $push: '$status'
          }
        }
      }
    ]);

    const statusCounts = {};
    if (summary[0]?.statusBreakdown) {
      summary[0].statusBreakdown.forEach(status => {
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
    }

    const result = summary[0] || {
      totalOrders: 0,
      totalAmount: 0,
      averageOrderValue: 0
    };

    result.statusBreakdown = statusCounts;

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/purchases/:id/submit-for-approval
// @desc    Submit purchase order for approval
// @access  Private (Admin/Manager)
router.post('/:id/submit-for-approval', [auth, authorize('admin', 'manager')], async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);
    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    if (purchaseOrder.status !== 'draft') {
      return res.status(400).json({ message: 'Only draft orders can be submitted for approval' });
    }

    // Orders above certain amount require approval
    const approvalThreshold = 10000; // Can be made configurable
    if (purchaseOrder.totalAmount >= approvalThreshold) {
      purchaseOrder.status = 'pending_approval';
      purchaseOrder.approvalStatus = 'pending';
    } else {
      purchaseOrder.status = 'approved';
      purchaseOrder.approvalStatus = 'not_required';
    }

    await purchaseOrder.save();
    await purchaseOrder.populate([
      { path: 'supplier', select: 'name email phone' },
      { path: 'warehouse', select: 'name code' },
      { path: 'items.product', select: 'name sku unit' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.json({
      message: 'Purchase order submitted successfully',
      purchaseOrder
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/purchases/:id/approve
// @desc    Approve purchase order
// @access  Private (Admin only)
router.post('/:id/approve', [auth, authorize('admin')], async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);
    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    if (purchaseOrder.status !== 'pending_approval') {
      return res.status(400).json({ message: 'Only pending orders can be approved' });
    }

    purchaseOrder.status = 'approved';
    purchaseOrder.approvalStatus = 'approved';
    purchaseOrder.approvedBy = req.user._id;
    purchaseOrder.approvedAt = new Date();

    await purchaseOrder.save();
    await purchaseOrder.populate([
      { path: 'supplier', select: 'name email phone' },
      { path: 'warehouse', select: 'name code' },
      { path: 'items.product', select: 'name sku unit' },
      { path: 'createdBy', select: 'name email' },
      { path: 'approvedBy', select: 'name email' }
    ]);

    res.json({
      message: 'Purchase order approved successfully',
      purchaseOrder
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/purchases/:id/reject
// @desc    Reject purchase order
// @access  Private (Admin only)
router.post('/:id/reject', [
  auth,
  authorize('admin'),
  body('reason').trim().notEmpty().withMessage('Rejection reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { reason } = req.body;
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);
    
    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    if (purchaseOrder.status !== 'pending_approval') {
      return res.status(400).json({ message: 'Only pending orders can be rejected' });
    }

    purchaseOrder.status = 'rejected';
    purchaseOrder.approvalStatus = 'rejected';
    purchaseOrder.rejectedBy = req.user._id;
    purchaseOrder.rejectedAt = new Date();
    purchaseOrder.rejectionReason = reason;

    await purchaseOrder.save();
    await purchaseOrder.populate([
      { path: 'supplier', select: 'name email phone' },
      { path: 'warehouse', select: 'name code' },
      { path: 'items.product', select: 'name sku unit' },
      { path: 'createdBy', select: 'name email' },
      { path: 'rejectedBy', select: 'name email' }
    ]);

    res.json({
      message: 'Purchase order rejected',
      purchaseOrder
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/purchases/metrics
// @desc    Get purchase order metrics and analytics
// @access  Private
router.get('/metrics', auth, async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get total counts by status
    const statusCounts = await PurchaseOrder.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Get approval metrics
    const approvalMetrics = await PurchaseOrder.aggregate([
      {
        $group: {
          _id: '$approvalStatus',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Get period-specific metrics
    const periodMetrics = await PurchaseOrder.aggregate([
      { $match: { orderDate: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          avgOrderValue: { $avg: '$totalAmount' },
          pendingApproval: {
            $sum: { $cond: [{ $eq: ['$status', 'pending_approval'] }, 1, 0] }
          },
          approved: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          },
          received: {
            $sum: { $cond: [{ $eq: ['$status', 'received'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get top suppliers by order count
    const topSuppliers = await PurchaseOrder.aggregate([
      { $match: { orderDate: { $gte: startDate } } },
      {
        $group: {
          _id: '$supplier',
          orderCount: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      },
      {
        $lookup: {
          from: 'suppliers',
          localField: '_id',
          foreignField: '_id',
          as: 'supplierInfo'
        }
      },
      { $unwind: '$supplierInfo' },
      {
        $project: {
          supplier: '$supplierInfo.name',
          orderCount: 1,
          totalAmount: 1
        }
      },
      { $sort: { orderCount: -1 } },
      { $limit: 5 }
    ]);

    // Get priority breakdown
    const priorityBreakdown = await PurchaseOrder.aggregate([
      { $match: { orderDate: { $gte: startDate } } },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    const totalOrders = await PurchaseOrder.countDocuments();
    const result = periodMetrics[0] || {
      totalOrders: 0,
      totalAmount: 0,
      avgOrderValue: 0,
      pendingApproval: 0,
      approved: 0,
      received: 0
    };

    res.json({
      overview: {
        ...result,
        totalOrders
      },
      statusCounts,
      approvalMetrics,
      topSuppliers,
      priorityBreakdown,
      period: `${days} days`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
