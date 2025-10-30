const express = require('express');
const Manufacturer = require('../models/Manufacturer');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all manufacturers
router.get('/', auth, async (req, res) => {
  try {
    const manufacturers = await Manufacturer.find().sort({ name: 1 });
    res.json(manufacturers);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get manufacturer by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const manufacturer = await Manufacturer.findById(req.params.id);
    if (!manufacturer) return res.status(404).json({ message: 'Not found' });
    res.json(manufacturer);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create manufacturer
router.post('/', [auth, authorize('admin', 'manager')], async (req, res) => {
  try {
    const manufacturer = new Manufacturer(req.body);
    await manufacturer.save();
    res.status(201).json(manufacturer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update manufacturer
router.put('/:id', [auth, authorize('admin', 'manager')], async (req, res) => {
  try {
    const manufacturer = await Manufacturer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!manufacturer) return res.status(404).json({ message: 'Not found' });
    res.json(manufacturer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete manufacturer
router.delete('/:id', [auth, authorize('admin')], async (req, res) => {
  try {
    const manufacturer = await Manufacturer.findByIdAndDelete(req.params.id);
    if (!manufacturer) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
