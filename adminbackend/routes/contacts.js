const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Contact = require('../models/Contact');
const { protect, authorize } = require('../middleware/auth');
const { apiLimiter, strictLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// @desc    Get all contacts
// @route   GET /api/contacts
// @access  Private/Admin
router.get('/', [
  protect,
  authorize('admin', 'manager', 'staff'),
  apiLimiter,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['new', 'contacted', 'in-progress', 'resolved', 'closed']).withMessage('Invalid status'),
  query('category').optional().isIn(['general', 'sales', 'support', 'partnership', 'feedback']).withMessage('Invalid category'),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  query('assignedTo').optional().isMongoId().withMessage('Invalid assigned user ID'),
  query('isRead').optional().isBoolean().withMessage('isRead must be a boolean'),
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
    
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    if (req.query.category) {
      query.category = req.query.category;
    }

    if (req.query.priority) {
      query.priority = req.query.priority;
    }

    if (req.query.assignedTo) {
      query.assignedTo = req.query.assignedTo;
    }

    if (req.query.isRead !== undefined) {
      query.isRead = req.query.isRead === 'true';
    }

    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { company: { $regex: req.query.search, $options: 'i' } },
        { subject: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Get contacts
    const contacts = await Contact.find(query)
      .populate('assignedTo', 'name email')
      .populate('notes.addedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(startIndex);

    // Get total count
    const total = await Contact.countDocuments(query);

    res.json({
      success: true,
      data: {
        contacts,
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

// @desc    Get contact by ID
// @route   GET /api/contacts/:id
// @access  Private/Admin
router.get('/:id', [
  protect,
  authorize('admin', 'manager', 'staff'),
  apiLimiter
], async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('notes.addedBy', 'name email');

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // Mark as read if not already read
    if (!contact.isRead) {
      await contact.markAsRead();
    }

    res.json({
      success: true,
      data: { contact }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create contact
// @route   POST /api/contacts
// @access  Public
router.post('/', [
  apiLimiter,
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('subject')
    .notEmpty()
    .withMessage('Subject is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Subject must be between 5 and 200 characters'),
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be between 10 and 2000 characters'),
  body('phone')
    .optional()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Please provide a valid phone number'),
  body('company')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Company name cannot be more than 100 characters'),
  body('category')
    .optional()
    .isIn(['general', 'sales', 'support', 'partnership', 'feedback'])
    .withMessage('Invalid category')
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
      email,
      phone,
      company,
      subject,
      message,
      category,
      source
    } = req.body;

    // Create contact
    const contact = await Contact.create({
      name,
      email,
      phone,
      company,
      subject,
      message,
      category: category || 'general',
      source: source || 'website'
    });

    res.status(201).json({
      success: true,
      message: 'Contact created successfully',
      data: { contact }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update contact
// @route   PUT /api/contacts/:id
// @access  Private/Admin
router.put('/:id', [
  protect,
  authorize('admin', 'manager', 'staff'),
  strictLimiter,
  body('status')
    .optional()
    .isIn(['new', 'contacted', 'in-progress', 'resolved', 'closed'])
    .withMessage('Invalid status'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority'),
  body('category')
    .optional()
    .isIn(['general', 'sales', 'support', 'partnership', 'feedback'])
    .withMessage('Invalid category'),
  body('followUpDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid follow up date')
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

    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    const { status, priority, category, tags, followUpDate } = req.body;

    // Update contact
    const updatedContact = await Contact.findByIdAndUpdate(
      req.params.id,
      {
        status,
        priority,
        category,
        tags,
        followUpDate
      },
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name email')
     .populate('notes.addedBy', 'name email');

    res.json({
      success: true,
      message: 'Contact updated successfully',
      data: { contact: updatedContact }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Assign contact to user
// @route   PUT /api/contacts/:id/assign
// @access  Private/Admin
router.put('/:id/assign', [
  protect,
  authorize('admin', 'manager'),
  strictLimiter,
  body('assignedTo')
    .isMongoId()
    .withMessage('Invalid user ID')
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

    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    const { assignedTo } = req.body;

    // Assign contact
    await contact.assignTo(assignedTo);
    await contact.populate('assignedTo', 'name email');

    res.json({
      success: true,
      message: 'Contact assigned successfully',
      data: { contact }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Add note to contact
// @route   POST /api/contacts/:id/notes
// @access  Private/Admin
router.post('/:id/notes', [
  protect,
  authorize('admin', 'manager', 'staff'),
  strictLimiter,
  body('note')
    .notEmpty()
    .withMessage('Note is required')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Note must be between 1 and 1000 characters')
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

    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    const { note } = req.body;

    // Add note
    await contact.addNote(note, req.user.id);
    await contact.populate('notes.addedBy', 'name email');

    res.json({
      success: true,
      message: 'Note added successfully',
      data: { contact }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Mark contact as read/unread
// @route   PUT /api/contacts/:id/read
// @access  Private/Admin
router.put('/:id/read', [
  protect,
  authorize('admin', 'manager', 'staff'),
  strictLimiter,
  body('isRead')
    .isBoolean()
    .withMessage('isRead must be a boolean')
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

    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    const { isRead } = req.body;

    contact.isRead = isRead;
    await contact.save();

    res.json({
      success: true,
      message: `Contact marked as ${isRead ? 'read' : 'unread'}`,
      data: { contact }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete contact
// @route   DELETE /api/contacts/:id
// @access  Private/Admin
router.delete('/:id', [
  protect,
  authorize('admin'),
  strictLimiter
], async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    await Contact.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get contact statistics
// @route   GET /api/contacts/stats/overview
// @access  Private/Admin
router.get('/stats/overview', [
  protect,
  authorize('admin', 'manager'),
  apiLimiter
], async (req, res, next) => {
  try {
    const stats = await Contact.getContactStats();
    const totalContacts = await Contact.countDocuments();
    const unreadContacts = await Contact.getUnreadCount();
    const recentContacts = await Contact.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      success: true,
      data: {
        totalContacts,
        unreadContacts,
        recentContacts,
        statusBreakdown: stats
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
