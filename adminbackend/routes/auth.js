const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const InventorySetup = require('../models/InventorySetup');
const { protect, adminOnly } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign({ 
    id: user._id,
    userId: user._id,
    role: user.role,
    email: user.email
  }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', [
  authLimiter,
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('industry')
    .optional()
    .isIn(['grocery', 'electronics', 'pharmaceutical', 'textile', 'automotive', 'construction', 'manufacturing', 'other'])
    .withMessage('Invalid industry type')
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

    const { name, email, password, mobileNo, industry } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      mobileNo,
      industry,
      role: 'client' // Default role for registration
    });

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please wait for admin approval.',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          mobileNo: user.mobileNo,
          industry: user.industry
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', [
  authLimiter,
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
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

    const { email, password } = req.body;

    // Check for user (include password for comparison)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Update last login
    await user.updateLastLogin();

    // Try to get client code from inventory setup
    let clientCode = null;
    let inventorySetup = null;
    
    try {
      inventorySetup = await InventorySetup.findOne({ email: user.email });
      if (inventorySetup) {
        clientCode = inventorySetup.clientCode;
      }
    } catch (setupError) {
      console.log('No inventory setup found for user:', user.email);
    }
    console.log('Login attempt - Client Code:', clientCode);
    // Generate token
    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          mobileNo: user.mobileNo,
          industry: user.industry,
          avatar: user.avatar
        },
        clientCode: clientCode,
        inventorySetup: inventorySetup ? {
          _id: inventorySetup._id,
          clientCode: inventorySetup.clientCode,
          databaseName: inventorySetup.databaseName,
          setupStatus: inventorySetup.setupStatus,
          subscriptionPlan: inventorySetup.subscriptionPlan,
          subscriptionStatus: inventorySetup.subscriptionStatus
        } : null
      }
    });
    console.log('User logged in:', clientCode);
  } catch (error) {
    next(error);
  }
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          mobileNo: user.mobileNo,
          industry: user.industry,
          avatar: user.avatar,
          lastLoginAt: user.lastLoginAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', [
  protect,
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('mobileNo')
    .optional()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Please provide a valid mobile number'),
  body('industry')
    .optional()
    .isIn(['grocery', 'electronics', 'pharmaceutical', 'textile', 'automotive', 'construction', 'manufacturing', 'other'])
    .withMessage('Invalid industry type')
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

    const { name, mobileNo, industry } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, mobileNo, industry },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          mobileNo: user.mobileNo,
          industry: user.industry,
          avatar: user.avatar
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', [
  protect,
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
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

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Logout user (client-side token invalidation)
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', protect, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;
