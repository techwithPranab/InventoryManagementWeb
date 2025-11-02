const express = require('express');
const { body, query, validationResult } = require('express-validator');
const InventorySetup = require('../models/InventorySetup');
const { protect, adminOnly, authorize } = require('../middleware/auth');
const { apiLimiter, strictLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// @desc    Get all inventory setups
// @route   GET /api/inventory-setup
// @access  Private/Admin
router.get('/', [
  protect,
  authorize('admin', 'manager'),
  apiLimiter,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('setupStatus').optional().isIn(['pending', 'in_progress', 'completed', 'failed']).withMessage('Invalid setup status'),
  query('subscriptionPlan').optional().isIn(['Free', 'Starter', 'Professional', 'Enterprise']).withMessage('Invalid subscription plan'),
  query('search').optional().isLength({ min: 1 }).withMessage('Search term cannot be empty')
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

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    // Build query
    let query = {};
    
    if (req.query.setupStatus) {
      query.setupStatus = req.query.setupStatus;
    }
    
    if (req.query.subscriptionPlan) {
      query.subscriptionPlan = req.query.subscriptionPlan;
    }

    if (req.query.search) {
      query.$or = [
        { ownerName: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { clientCode: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Get setups
    const setups = await InventorySetup.find(query)
      .populate('setupBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(startIndex);

    // Get total count
    const total = await InventorySetup.countDocuments(query);

    res.json({
      success: true,
      data: {
        setups,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get inventory setup by ID
// @route   GET /api/inventory-setup/:id
// @access  Private/Admin
router.get('/:id', [
  protect,
  authorize('admin', 'manager'),
  apiLimiter
], async (req, res, next) => {
  try {
    const setup = await InventorySetup.findById(req.params.id)
      .populate('setupBy', 'name email');

    if (!setup) {
      return res.status(404).json({
        success: false,
        message: 'Inventory setup not found'
      });
    }

    res.json({
      success: true,
      data: { setup }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get inventory setup by client code
// @route   GET /api/inventory-setup/client/:clientCode
// @access  Private
router.get('/client/:clientCode', [
  protect,
  apiLimiter
], async (req, res, next) => {
  try {
    const setup = await InventorySetup.findByClientCode(req.params.clientCode)
      .populate('setupBy', 'name email');

    if (!setup) {
      return res.status(404).json({
        success: false,
        message: 'Inventory setup not found'
      });
    }

    res.json({
      success: true,
      data: { setup }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get inventory setups by email
// @route   GET /api/inventory-setup/email/:email
// @access  Private
router.get('/email/:email', [
  protect,
  apiLimiter
], async (req, res, next) => {
  try {
    const setups = await InventorySetup.find({ email: req.params.email })
      .populate('setupBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { setups }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new inventory setup
// @route   POST /api/inventory-setup
// @access  Private/Admin
router.post('/', [
  protect,
  adminOnly,
  strictLimiter,
  body('ownerName')
    .notEmpty()
    .withMessage('Owner name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Owner name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('industry')
    .notEmpty()
    .withMessage('Industry is required'),
  body('subscriptionPlan')
    .isIn(['Free', 'Starter', 'Professional', 'Enterprise'])
    .withMessage('Invalid subscription plan'),
  body('clientCode')
    .notEmpty()
    .withMessage('Client code is required')
    .isLength({ min: 3, max: 20 })
    .withMessage('Client code must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9-_]+$/)
    .withMessage('Client code can only contain letters, numbers, hyphens, and underscores'),
  body('databaseName')
    .notEmpty()
    .withMessage('Database name is required')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Database name can only contain letters, numbers, and underscores')
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
      ownerName,
      email,
      industry,
      subscriptionPlan,
      clientCode,
      databaseName,
      notes
    } = req.body;

    // Check if client code already exists
    const existingSetup = await InventorySetup.findOne({
      $or: [
        { clientCode },
        { databaseName }
      ]
    });

    if (existingSetup) {
      return res.status(400).json({
        success: false,
        message: 'Client code or database name already exists'
      });
    }

    // Create inventory setup
    const setup = await InventorySetup.create({
      ownerName,
      email,
      industry,
      subscriptionPlan,
      clientCode,
      databaseName,
      setupBy: req.user.id,
      notes
    });

    await setup.populate('setupBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Inventory setup created successfully',
      data: { setup }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update inventory setup
// @route   PUT /api/inventory-setup/:id
// @access  Private/Admin
router.put('/:id', [
  protect,
  authorize('admin', 'manager'),
  strictLimiter,
  body('ownerName')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Owner name must be between 2 and 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('subscriptionPlan')
    .optional()
    .isIn(['Free', 'Starter', 'Professional', 'Enterprise'])
    .withMessage('Invalid subscription plan'),
  body('setupStatus')
    .optional()
    .isIn(['pending', 'in_progress', 'completed', 'failed'])
    .withMessage('Invalid setup status')
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

    const setup = await InventorySetup.findById(req.params.id);

    if (!setup) {
      return res.status(404).json({
        success: false,
        message: 'Inventory setup not found'
      });
    }

    const {
      ownerName,
      email,
      industry,
      subscriptionPlan,
      setupStatus,
      notes
    } = req.body;

    // Update setup
    const updatedSetup = await InventorySetup.findByIdAndUpdate(
      req.params.id,
      {
        ownerName,
        email,
        industry,
        subscriptionPlan,
        setupStatus,
        notes
      },
      { new: true, runValidators: true }
    ).populate('setupBy', 'name email');

    res.json({
      success: true,
      message: 'Inventory setup updated successfully',
      data: { setup: updatedSetup }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update setup progress
// @route   PUT /api/inventory-setup/:id/progress
// @access  Private/Admin
router.put('/:id/progress', [
  protect,
  authorize('admin', 'manager'),
  strictLimiter,
  body('setupProgress')
    .isObject()
    .withMessage('Setup progress must be an object'),
  body('setupProgress.categoriesCreated')
    .optional()
    .isBoolean()
    .withMessage('categoriesCreated must be a boolean'),
  body('setupProgress.warehousesCreated')
    .optional()
    .isBoolean()
    .withMessage('warehousesCreated must be a boolean'),
  body('setupProgress.productsAdded')
    .optional()
    .isBoolean()
    .withMessage('productsAdded must be a boolean'),
  body('setupProgress.initialInventorySet')
    .optional()
    .isBoolean()
    .withMessage('initialInventorySet must be a boolean')
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

    const setup = await InventorySetup.findById(req.params.id);

    if (!setup) {
      return res.status(404).json({
        success: false,
        message: 'Inventory setup not found'
      });
    }

    const { setupProgress } = req.body;

    // Update progress
    await setup.updateProgress(setupProgress);
    await setup.populate('setupBy', 'name email');

    res.json({
      success: true,
      message: 'Setup progress updated successfully',
      data: { setup }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Complete setup
// @route   PUT /api/inventory-setup/:id/complete
// @access  Private/Admin
router.put('/:id/complete', [
  protect,
  authorize('admin', 'manager'),
  strictLimiter
], async (req, res, next) => {
  try {
    const setup = await InventorySetup.findById(req.params.id);

    if (!setup) {
      return res.status(404).json({
        success: false,
        message: 'Inventory setup not found'
      });
    }

    if (setup.setupStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Setup is already completed'
      });
    }

    // Complete setup
    await setup.completeSetup();
    await setup.populate('setupBy', 'name email');

    res.json({
      success: true,
      message: 'Setup completed successfully',
      data: { setup }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete inventory setup
// @route   DELETE /api/inventory-setup/:id
// @access  Private/Admin
router.delete('/:id', [
  protect,
  adminOnly,
  strictLimiter
], async (req, res, next) => {
  try {
    const setup = await InventorySetup.findById(req.params.id);

    if (!setup) {
      return res.status(404).json({
        success: false,
        message: 'Inventory setup not found'
      });
    }

    await InventorySetup.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Inventory setup deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get setup statistics
// @route   GET /api/inventory-setup/stats/overview
// @access  Private/Admin
router.get('/stats/overview', [
  protect,
  authorize('admin', 'manager'),
  apiLimiter
], async (req, res, next) => {
  try {
    const stats = await InventorySetup.getSetupStats();
    const totalSetups = await InventorySetup.countDocuments();
    const activeSetups = await InventorySetup.countDocuments({
      setupStatus: { $in: ['pending', 'in_progress'] }
    });
    const completedSetups = await InventorySetup.countDocuments({
      setupStatus: 'completed'
    });

    res.json({
      success: true,
      data: {
        totalSetups,
        activeSetups,
        completedSetups,
        statusBreakdown: stats
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Generate PAT token for inventory setup
// @route   POST /api/inventory-setup/:id/pat-token
// @access  Private
router.post('/:id/pat-token', [
  protect,
  strictLimiter,
  body('expiryDays')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Expiry days must be between 1 and 365')
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

    const setup = await InventorySetup.findById(req.params.id);

    if (!setup) {
      return res.status(404).json({
        success: false,
        message: 'Inventory setup not found'
      });
    }

    const expiryDays = req.body.expiryDays || 90;

    // Generate PAT token
    await setup.generatePATToken(expiryDays);

    res.json({
      success: true,
      message: 'PAT token generated successfully',
      data: {
        token: setup.patToken.token,
        expiryDate: setup.patToken.expiryDate,
        createdAt: setup.patToken.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get PAT token info for inventory setup
// @route   GET /api/inventory-setup/:id/pat-token
// @access  Private
router.get('/:id/pat-token', [
  protect,
  apiLimiter
], async (req, res, next) => {
  try {
    const setup = await InventorySetup.findById(req.params.id);

    if (!setup) {
      return res.status(404).json({
        success: false,
        message: 'Inventory setup not found'
      });
    }

    if (!setup.patToken || !setup.patToken.token) {
      return res.json({
        success: true,
        data: {
          hasToken: false,
          message: 'No PAT token found'
        }
      });
    }

    res.json({
      success: true,
      data: {
        hasToken: true,
        token: setup.patToken.token,
        expiryDate: setup.patToken.expiryDate,
        createdAt: setup.patToken.createdAt,
        lastUsedAt: setup.patToken.lastUsedAt,
        isActive: setup.patToken.isActive,
        isValid: setup.isPATTokenValid()
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Revoke PAT token for inventory setup
// @route   DELETE /api/inventory-setup/:id/pat-token
// @access  Private
router.delete('/:id/pat-token', [
  protect,
  strictLimiter
], async (req, res, next) => {
  try {
    const setup = await InventorySetup.findById(req.params.id);

    if (!setup) {
      return res.status(404).json({
        success: false,
        message: 'Inventory setup not found'
      });
    }

    if (!setup.patToken || !setup.patToken.token) {
      return res.status(404).json({
        success: false,
        message: 'No PAT token found to revoke'
      });
    }

    // Revoke PAT token
    await setup.revokePATToken();

    res.json({
      success: true,
      message: 'PAT token revoked successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
