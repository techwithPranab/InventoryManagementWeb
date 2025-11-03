const express = require('express');
const { auth, authorize, requireClientCode } = require('../middleware/auth');

const router = express.Router();

// Get all suppliers
router.get('/', [auth, requireClientCode], async (req, res) => {
  try {
    const { Supplier } = req.models;

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

    const suppliers = await Supplier.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Supplier.countDocuments(query);

    res.json({
      suppliers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
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
