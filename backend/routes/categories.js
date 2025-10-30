const express = require('express');
const { body, validationResult } = require('express-validator');
const Category = require('../models/Category');
const Product = require('../models/Product');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/categories
// @desc    Get all categories
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit, search, isActive } = req.query;
    const query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    let categoriesQuery = Category.find(query)
      .populate('createdBy', 'name email')
      .sort({ name: 1 });

    // Apply pagination only if limit is specified
    if (limit) {
      categoriesQuery = categoriesQuery
        .limit(limit * 1)
        .skip((page - 1) * limit);
    }

    const categories = await categoriesQuery;

    // Add product count for each category
    const categoriesWithProductCount = await Promise.all(
      categories.map(async (category) => {
        const productCount = await Product.countDocuments({ 
          category: category._id,
          isActive: true 
        });
        return {
          ...category.toObject(),
          productCount
        };
      })
    );

    const total = await Category.countDocuments(query);

    // Return different response structure based on whether pagination was requested
    if (limit) {
      res.json({
        categories: categoriesWithProductCount,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });
    } else {
      // For non-paginated requests (like dropdown in Products), return simpler structure
      res.json({
        categories: categoriesWithProductCount,
        total
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/categories/:id
// @desc    Get category by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Get product count for this category
    const productCount = await Product.countDocuments({ 
      category: category._id, 
      isActive: true 
    });

    res.json({
      ...category.toObject(),
      productCount
    });
  } catch (error) {
    console.error(error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid category ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/categories
// @desc    Create new category
// @access  Private (Admin/Manager)
router.post('/', [
  auth,
  authorize('admin', 'manager'),
  body('name').trim().notEmpty().withMessage('Category name is required'),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { name, description, image } = req.body;

    // Check if category already exists
    const existingCategory = await Category.findOne({ 
      name: { $regex: `^${name}$`, $options: 'i' } 
    });

    if (existingCategory) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = new Category({
      name,
      description,
      image,
      createdBy: req.user._id
    });

    await category.save();
    await category.populate('createdBy', 'name email');

    res.status(201).json({
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/categories/:id
// @desc    Update category
// @access  Private (Admin/Manager)
router.put('/:id', [
  auth,
  authorize('admin', 'manager'),
  body('name').optional().trim().notEmpty().withMessage('Category name cannot be empty'),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { name, description, image, isActive } = req.body;
    const updateFields = {};

    if (name) updateFields.name = name;
    if (description !== undefined) updateFields.description = description;
    if (image !== undefined) updateFields.image = image;
    if (isActive !== undefined) updateFields.isActive = isActive;

    // Check if new name already exists for another category
    if (name) {
      const existingCategory = await Category.findOne({ 
        name: { $regex: `^${name}$`, $options: 'i' },
        _id: { $ne: req.params.id }
      });

      if (existingCategory) {
        return res.status(400).json({ message: 'Category name already exists' });
      }
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({
      message: 'Category updated successfully',
      category
    });
  } catch (error) {
    console.error(error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid category ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete category
// @access  Private (Admin)
router.delete('/:id', [auth, authorize('admin')], async (req, res) => {
  try {
    // Check if category has associated products
    const productCount = await Product.countDocuments({ 
      category: req.params.id 
    });

    if (productCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete category. It has ${productCount} associated product(s)` 
      });
    }

    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error(error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid category ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/categories/:id/products
// @desc    Get products by category
// @access  Private
router.get('/:id/products', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const products = await Product.find({ 
      category: req.params.id,
      isActive: true 
    })
      .populate('category', 'name')
      .populate('createdBy', 'name email')
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments({ 
      category: req.params.id,
      isActive: true 
    });

    res.json({
      products,
      category: category.name,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid category ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
