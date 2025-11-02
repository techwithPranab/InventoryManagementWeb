const express = require('express');
const { auth, authorize, requireClientCode } = require('../middleware/auth');

const router = express.Router();

// Get all suppliers
router.get('/', [auth, requireClientCode], async (req, res) => {
  try {
    const { Supplier } = req.models;
    const suppliers = await Supplier.find().sort({ name: 1 });
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get supplier by ID
router.get('/:id', [auth, requireClientCode], async (req, res) => {
  try {
    const { Supplier } = req.models;
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ message: 'Not found' });
    res.json(supplier);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create supplier
router.post('/', [auth, requireClientCode, authorize('admin', 'manager', 'staff')], async (req, res) => {
  try {
    const { Supplier } = req.models;
    const supplier = new Supplier(req.body);
    await supplier.save();
    res.status(201).json(supplier);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update supplier
router.put('/:id', [auth, requireClientCode, authorize('admin', 'manager', 'staff')], async (req, res) => {
  try {
    const { Supplier } = req.models;
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!supplier) return res.status(404).json({ message: 'Not found' });
    res.json(supplier);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete supplier
router.delete('/:id', [auth, requireClientCode, authorize('admin')], async (req, res) => {
  try {
    const { Supplier } = req.models;
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
