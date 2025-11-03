const express = require('express');
const { auth, authorize, requireClientCode } = require('../middleware/auth');

const router = express.Router();

// Get all manufacturers
router.get('/', [auth, requireClientCode], async (req, res) => {
  try {
    const { Manufacturer } = req.models;

    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const query = {};
    const sort = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const manufacturers = await Manufacturer.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Manufacturer.countDocuments(query);

    res.json({
      manufacturers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get manufacturer by ID
router.get('/:id', [auth, requireClientCode], async (req, res) => {
  try {
    const { Manufacturer } = req.models;
    const manufacturer = await Manufacturer.findById(req.params.id);
    if (!manufacturer) return res.status(404).json({ message: 'Not found' });
    res.json(manufacturer);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create manufacturer
router.post('/', [auth, requireClientCode, authorize('admin', 'manager', 'staff')], async (req, res) => {
  try {
    const { Manufacturer } = req.models;
    const manufacturer = new Manufacturer(req.body);
    await manufacturer.save();
    res.status(201).json(manufacturer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update manufacturer
router.put('/:id', [auth, requireClientCode, authorize('admin', 'manager', 'staff')], async (req, res) => {
  try {
    const { Manufacturer } = req.models;
    const manufacturer = await Manufacturer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!manufacturer) return res.status(404).json({ message: 'Not found' });
    res.json(manufacturer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete manufacturer
router.delete('/:id', [auth, requireClientCode, authorize('admin')], async (req, res) => {
  try {
    const { Manufacturer } = req.models;
    const manufacturer = await Manufacturer.findByIdAndDelete(req.params.id);
    if (!manufacturer) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
