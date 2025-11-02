const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth, authorize, requireClientCode } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/sales
// @desc    Get all sales orders
// @access  Private
router.get('/', [auth, requireClientCode], async (req, res) => {
  try {
    const { SalesOrder } = req.models;
    const { 
      page = 1, 
      limit = 10, 
      status, 
      warehouse,
      paymentStatus,
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

    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    if (startDate || endDate) {
      query.orderDate = {};
      if (startDate) query.orderDate.$gte = new Date(startDate);
      if (endDate) query.orderDate.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } }
      ];
    }

    const salesOrders = await SalesOrder.find(query)
      .populate('warehouse', 'name code')
      .populate('items.product', 'name sku')
      .populate('createdBy', 'name email')
      .sort({ orderDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await SalesOrder.countDocuments(query);

    res.json({
      salesOrders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/sales/:id
// @desc    Get sales order by ID
// @access  Private
router.get('/:id', [auth, requireClientCode], async (req, res) => {
  try {
    const { SalesOrder } = req.models;
    const salesOrder = await SalesOrder.findById(req.params.id)
      .populate('warehouse', 'name code address')
      .populate('items.product', 'name sku unit sellingPrice')
      .populate('createdBy', 'name email');

    if (!salesOrder) {
      return res.status(404).json({ message: 'Sales order not found' });
    }

    res.json(salesOrder);
  } catch (error) {
    console.error(error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid sales order ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/sales
// @desc    Create new sales order
// @access  Private (Admin/Manager/Staff)
router.post('/', [
  auth,
  requireClientCode,
  body('customer.name').trim().notEmpty().withMessage('Customer name is required'),
  body('warehouse').notEmpty().withMessage('Warehouse is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.product').notEmpty().withMessage('Product is required for each item'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be positive')
], async (req, res) => {
  try {
    const { SalesOrder, Product, Inventory } = req.models;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const {
      customer,
      warehouse,
      items,
      shippingDate,
      notes,
      tax = 0,
      discount = 0,
      shippingCost = 0,
      paymentMethod = 'cash'
    } = req.body;

    // Verify warehouse exists
    const warehouseExists = await Warehouse.findById(warehouse);
    if (!warehouseExists) {
      return res.status(400).json({ message: 'Invalid warehouse' });
    }

    // Verify all products exist, check inventory, and calculate totals
    let subtotal = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({ 
          message: `Product with ID ${item.product} not found` 
        });
      }

      // Check inventory availability
      const inventory = await Inventory.findOne({
        product: item.product,
        warehouse: warehouse
      });

      const availableQuantity = inventory ? inventory.quantity - inventory.reservedQuantity : 0;
      
      if (availableQuantity < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient inventory for product ${product.name}. Available: ${availableQuantity}, Requested: ${item.quantity}` 
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

    const totalAmount = subtotal + tax + shippingCost - discount;

    const salesOrder = new SalesOrder({
      customer,
      warehouse,
      items: processedItems,
      shippingDate,
      notes,
      subtotal,
      tax,
      discount,
      shippingCost,
      totalAmount,
      paymentMethod,
      createdBy: req.user._id
    });

    await salesOrder.save();

    // Reserve inventory
    for (const item of processedItems) {
      await Inventory.findOneAndUpdate(
        { product: item.product, warehouse: warehouse },
        { $inc: { reservedQuantity: item.quantity } }
      );
    }

    await salesOrder.populate([
      { path: 'warehouse', select: 'name code' },
      { path: 'items.product', select: 'name sku unit' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.status(201).json({
      message: 'Sales order created successfully',
      salesOrder
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/sales/:id
// @desc    Update sales order
// @access  Private (Admin/Manager)
router.put('/:id', [
  auth,
  requireClientCode,
  authorize('admin', 'manager'),
  body('customer.name').optional().trim().notEmpty().withMessage('Customer name cannot be empty'),
  body('status').optional().isIn(['draft', 'confirmed', 'processing', 'partial', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status'),
  body('paymentStatus').optional().isIn(['pending', 'partial', 'paid', 'refunded']).withMessage('Invalid payment status')
], async (req, res) => {
  try {
    const { SalesOrder } = req.models;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const salesOrder = await SalesOrder.findById(req.params.id);
    if (!salesOrder) {
      return res.status(404).json({ message: 'Sales order not found' });
    }

    // Only allow updates to non-delivered orders (except payment status)
    if (salesOrder.status === 'delivered' && req.body.status && req.body.status !== 'delivered') {
      return res.status(400).json({ 
        message: 'Cannot modify status of a delivered sales order' 
      });
    }

    const updateFields = { ...req.body };

    // If updating status to shipped, set shipping date
    if (updateFields.status === 'shipped' && salesOrder.status !== 'shipped') {
      updateFields.shippingDate = new Date();
    }

    // If updating status to delivered, set delivery date
    if (updateFields.status === 'delivered' && salesOrder.status !== 'delivered') {
      updateFields.deliveryDate = new Date();
    }

    const updatedSO = await SalesOrder.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    ).populate([
      { path: 'warehouse', select: 'name code' },
      { path: 'items.product', select: 'name sku unit' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.json({
      message: 'Sales order updated successfully',
      salesOrder: updatedSO
    });
  } catch (error) {
    console.error(error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid sales order ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/sales/:id/ship
// @desc    Ship sales order items
// @access  Private (Admin/Manager)
router.post('/:id/ship', [
  auth,
  requireClientCode,
  authorize('admin', 'manager'),
  body('items').isArray({ min: 1 }).withMessage('Items are required'),
  body('items.*.product').notEmpty().withMessage('Product ID is required'),
  body('items.*.shippedQuantity').isInt({ min: 0 }).withMessage('Shipped quantity must be non-negative')
], async (req, res) => {
  try {
    const { SalesOrder, Inventory } = req.models;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { items: shippedItems } = req.body;

    const salesOrder = await SalesOrder.findById(req.params.id);
    if (!salesOrder) {
      return res.status(404).json({ message: 'Sales order not found' });
    }

    if (salesOrder.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot ship cancelled sales order' });
    }

    // Update shipped quantities and inventory
    for (const shippedItem of shippedItems) {
      const orderItem = salesOrder.items.find(
        item => item.product.toString() === shippedItem.product
      );

      if (!orderItem) {
        return res.status(400).json({ 
          message: `Product ${shippedItem.product} not found in sales order` 
        });
      }

      if (shippedItem.shippedQuantity > orderItem.quantity) {
        return res.status(400).json({ 
          message: `Shipped quantity cannot exceed ordered quantity for product ${shippedItem.product}` 
        });
      }

      // Update shipped quantity in sales order
      const previousShipped = orderItem.shippedQuantity || 0;
      orderItem.shippedQuantity = shippedItem.shippedQuantity;
      const actualShipped = shippedItem.shippedQuantity - previousShipped;

      // Update inventory if quantity shipped
      if (actualShipped > 0) {
        const inventory = await Inventory.findOne({
          product: shippedItem.product,
          warehouse: salesOrder.warehouse
        });

        if (!inventory) {
          return res.status(400).json({ 
            message: `No inventory found for product ${shippedItem.product}` 
          });
        }

        // Reduce actual inventory and reserved quantity
        await Inventory.findOneAndUpdate(
          { 
            product: shippedItem.product, 
            warehouse: salesOrder.warehouse 
          },
          {
            $inc: { 
              quantity: -actualShipped,
              reservedQuantity: -actualShipped
            },
            lastSold: new Date()
          }
        );
      }
    }

    // Determine new status
    const allItemsShipped = salesOrder.items.every(
      item => (item.shippedQuantity || 0) >= item.quantity
    );
    const someItemsShipped = salesOrder.items.some(
      item => (item.shippedQuantity || 0) > 0
    );

    if (allItemsShipped) {
      salesOrder.status = 'shipped';
      salesOrder.shippingDate = new Date();
    } else if (someItemsShipped) {
      salesOrder.status = 'partial';
    }

    await salesOrder.save();
    await salesOrder.populate([
      { path: 'warehouse', select: 'name code' },
      { path: 'items.product', select: 'name sku unit' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.json({
      message: 'Items shipped successfully',
      salesOrder
    });
  } catch (error) {
    console.error(error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid sales order ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/sales/:id/cancel
// @desc    Cancel sales order
// @access  Private (Admin/Manager)
router.post('/:id/cancel', [auth, requireClientCode, authorize('admin', 'manager')], async (req, res) => {
  try {
    const { SalesOrder, Inventory } = req.models;
    const salesOrder = await SalesOrder.findById(req.params.id);
    if (!salesOrder) {
      return res.status(404).json({ message: 'Sales order not found' });
    }

    if (['shipped', 'delivered'].includes(salesOrder.status)) {
      return res.status(400).json({ 
        message: 'Cannot cancel shipped or delivered orders' 
      });
    }

    // Release reserved inventory
    for (const item of salesOrder.items) {
      const shippedQuantity = item.shippedQuantity || 0;
      const reservedQuantity = item.quantity - shippedQuantity;

      if (reservedQuantity > 0) {
        await Inventory.findOneAndUpdate(
          { product: item.product, warehouse: salesOrder.warehouse },
          { $inc: { reservedQuantity: -reservedQuantity } }
        );
      }
    }

    salesOrder.status = 'cancelled';
    await salesOrder.save();

    await salesOrder.populate([
      { path: 'warehouse', select: 'name code' },
      { path: 'items.product', select: 'name sku unit' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.json({
      message: 'Sales order cancelled successfully',
      salesOrder
    });
  } catch (error) {
    console.error(error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid sales order ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/sales/:id
// @desc    Delete sales order
// @access  Private (Admin)
router.delete('/:id', [auth, requireClientCode, authorize('admin')], async (req, res) => {
  try {
    const { SalesOrder, Inventory } = req.models;
    const salesOrder = await SalesOrder.findById(req.params.id);

    if (!salesOrder) {
      return res.status(404).json({ message: 'Sales order not found' });
    }

    // Only allow deletion of draft or cancelled orders
    if (!['draft', 'cancelled'].includes(salesOrder.status)) {
      return res.status(400).json({ 
        message: 'Only draft or cancelled sales orders can be deleted' 
      });
    }

    // Release any reserved inventory for draft orders
    if (salesOrder.status === 'draft') {
      for (const item of salesOrder.items) {
        await Inventory.findOneAndUpdate(
          { product: item.product, warehouse: salesOrder.warehouse },
          { $inc: { reservedQuantity: -item.quantity } }
        );
      }
    }

    await SalesOrder.findByIdAndDelete(req.params.id);

    res.json({ message: 'Sales order deleted successfully' });
  } catch (error) {
    console.error(error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid sales order ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/sales/reports/summary
// @desc    Get sales summary report
// @access  Private
router.get('/reports/summary', [auth, requireClientCode], async (req, res) => {
  try {
    const { SalesOrder } = req.models;
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

    const summary = await SalesOrder.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          averageOrderValue: { $avg: '$totalAmount' },
          statusBreakdown: {
            $push: '$status'
          },
          paymentStatusBreakdown: {
            $push: '$paymentStatus'
          }
        }
      }
    ]);

    const statusCounts = {};
    const paymentStatusCounts = {};

    if (summary[0]?.statusBreakdown) {
      summary[0].statusBreakdown.forEach(status => {
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
    }

    if (summary[0]?.paymentStatusBreakdown) {
      summary[0].paymentStatusBreakdown.forEach(status => {
        paymentStatusCounts[status] = (paymentStatusCounts[status] || 0) + 1;
      });
    }

    const result = summary[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0
    };

    result.statusBreakdown = statusCounts;
    result.paymentStatusBreakdown = paymentStatusCounts;

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
