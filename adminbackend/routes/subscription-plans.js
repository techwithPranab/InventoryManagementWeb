const express = require('express');
const { body, query, validationResult } = require('express-validator');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const { protect, adminOnly, authorize } = require('../middleware/auth');
const { apiLimiter, strictLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// @desc    Get all subscription plans
// @route   GET /api/subscription-plans
// @access  Public
router.get('/', [
  apiLimiter,
  query('active').optional().isBoolean().withMessage('Active must be a boolean')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    let query = {};
    
    // Filter by active status if specified
    if (req.query.active !== undefined) {
      query.isActive = req.query.active === 'true';
    }

    const plans = await SubscriptionPlan.find(query)
      .sort({ sortOrder: 1, price: 1 });

    res.json({
      success: true,
      data: { plans }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get active subscription plans
// @route   GET /api/subscription-plans/active
// @access  Public
router.get('/active', apiLimiter, async (req, res, next) => {
  try {
    const plans = await SubscriptionPlan.getActivePlans();

    res.json({
      success: true,
      data: { plans }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get subscription plan by ID
// @route   GET /api/subscription-plans/:id
// @access  Public
router.get('/:id', apiLimiter, async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    res.json({
      success: true,
      data: { plan }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get subscription plan by name
// @route   GET /api/subscription-plans/name/:name
// @access  Public
router.get('/name/:name', apiLimiter, async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findByName(req.params.name);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    res.json({
      success: true,
      data: { plan }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create subscription plan
// @route   POST /api/subscription-plans
// @access  Private/Admin
router.post('/', [
  protect,
  adminOnly,
  strictLimiter,
  body('name')
    .notEmpty()
    .withMessage('Plan name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Plan name must be between 2 and 50 characters'),
  body('description')
    .notEmpty()
    .withMessage('Plan description is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Plan description must be between 10 and 500 characters'),
  body('price')
    .isNumeric()
    .withMessage('Price must be a number')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'INR'])
    .withMessage('Invalid currency'),
  body('billingCycle')
    .optional()
    .isIn(['monthly', 'yearly'])
    .withMessage('Invalid billing cycle'),
  body('features')
    .isArray()
    .withMessage('Features must be an array'),
  body('maxProducts')
    .isInt({ min: 0 })
    .withMessage('Max products must be a positive integer'),
  body('maxWarehouses')
    .isInt({ min: 0 })
    .withMessage('Max warehouses must be a positive integer'),
  body('maxUsers')
    .isInt({ min: 1 })
    .withMessage('Max users must be at least 1'),
  body('sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a positive integer')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      name,
      description,
      price,
      currency,
      billingCycle,
      features,
      maxProducts,
      maxWarehouses,
      maxUsers,
      stripePriceId,
      sortOrder
    } = req.body;

    // Check if plan name already exists
    const existingPlan = await SubscriptionPlan.findOne({ name });
    if (existingPlan) {
      return res.status(400).json({
        success: false,
        message: 'Plan with this name already exists'
      });
    }

    // Create subscription plan
    const plan = await SubscriptionPlan.create({
      name,
      description,
      price,
      currency: currency || 'USD',
      billingCycle: billingCycle || 'monthly',
      features,
      maxProducts,
      maxWarehouses,
      maxUsers,
      stripePriceId,
      sortOrder: sortOrder || 0
    });

    res.status(201).json({
      success: true,
      message: 'Subscription plan created successfully',
      data: { plan }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update subscription plan
// @route   PUT /api/subscription-plans/:id
// @access  Private/Admin
router.put('/:id', [
  protect,
  adminOnly,
  strictLimiter,
  body('name')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Plan name must be between 2 and 50 characters'),
  body('description')
    .optional()
    .isLength({ min: 10, max: 500 })
    .withMessage('Plan description must be between 10 and 500 characters'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'INR'])
    .withMessage('Invalid currency'),
  body('billingCycle')
    .optional()
    .isIn(['monthly', 'yearly'])
    .withMessage('Invalid billing cycle'),
  body('features')
    .optional()
    .isArray()
    .withMessage('Features must be an array'),
  body('maxProducts')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Max products must be a positive integer'),
  body('maxWarehouses')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Max warehouses must be a positive integer'),
  body('maxUsers')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max users must be at least 1'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a positive integer')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const plan = await SubscriptionPlan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    // Check if new name already exists (if name is being updated)
    if (req.body.name && req.body.name !== plan.name) {
      const existingPlan = await SubscriptionPlan.findOne({ name: req.body.name });
      if (existingPlan) {
        return res.status(400).json({
          success: false,
          message: 'Plan with this name already exists'
        });
      }
    }

    // Update plan
    const updatedPlan = await SubscriptionPlan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Subscription plan updated successfully',
      data: { plan: updatedPlan }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete subscription plan
// @route   DELETE /api/subscription-plans/:id
// @access  Private/Admin
router.delete('/:id', [
  protect,
  adminOnly,
  strictLimiter
], async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    await SubscriptionPlan.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Subscription plan deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Activate/Deactivate subscription plan
// @route   PUT /api/subscription-plans/:id/status
// @access  Private/Admin
router.put('/:id/status', [
  protect,
  adminOnly,
  strictLimiter,
  body('isActive')
    .isBoolean()
    .withMessage('isActive must be a boolean')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { isActive } = req.body;

    const plan = await SubscriptionPlan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    plan.isActive = isActive;
    await plan.save();

    res.json({
      success: true,
      message: `Subscription plan ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { plan }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
