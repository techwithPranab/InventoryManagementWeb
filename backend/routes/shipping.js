const express = require('express');
const Shipping = require('../models/Shipping');
const SalesOrder = require('../models/SalesOrder');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

// Create shipping record
router.post('/', [auth, authorize('admin', 'manager')], async (req, res) => {
  try {
    const shipping = new Shipping(req.body);
    await shipping.save();
    res.status(201).json(shipping);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all shipping records
router.get('/', auth, async (req, res) => {
  try {
    const shippings = await Shipping.find().populate('order', 'orderNumber');
    res.json(shippings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get shipping by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const shipping = await Shipping.findById(req.params.id).populate('order', 'orderNumber');
    if (!shipping) return res.status(404).json({ message: 'Shipping record not found' });
    res.json(shipping);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update shipping record
router.put('/:id', [auth, authorize('admin', 'manager')], async (req, res) => {
  try {
    const shipping = await Shipping.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!shipping) return res.status(404).json({ message: 'Shipping record not found' });
    res.json(shipping);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete shipping record
router.delete('/:id', [auth, authorize('admin')], async (req, res) => {
  try {
    const shipping = await Shipping.findByIdAndDelete(req.params.id);
    if (!shipping) return res.status(404).json({ message: 'Shipping record not found' });
    res.json({ message: 'Shipping record deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update shipping status (shipped, in_transit, delivered, cancelled)
router.post('/:id/status', [auth, authorize('admin', 'manager')], async (req, res) => {
  try {
    const { status, shippedDate, deliveredDate, estimatedDelivery } = req.body;
    const shipping = await Shipping.findById(req.params.id);
    if (!shipping) return res.status(404).json({ message: 'Shipping record not found' });
    if (status) shipping.status = status;
    if (shippedDate) shipping.shippedDate = shippedDate;
    if (deliveredDate) shipping.deliveredDate = deliveredDate;
    if (estimatedDelivery) shipping.estimatedDelivery = estimatedDelivery;
    await shipping.save();
    res.json(shipping);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
