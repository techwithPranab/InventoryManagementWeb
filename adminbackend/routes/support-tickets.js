const express = require('express');
const { body, query, validationResult } = require('express-validator');
const SupportTicket = require('../models/SupportTicket');
const { protect, authorize } = require('../middleware/auth');
const { apiLimiter, strictLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// @desc    Get all support tickets
// @route   GET /api/support-tickets
// @access  Private/Admin
router.get('/', [
  protect,
  authorize('admin', 'manager', 'staff'),
  apiLimiter,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['open', 'in-progress', 'waiting-for-customer', 'resolved', 'closed']).withMessage('Invalid status'),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  query('category').optional().isIn(['general-inquiry', 'technical-support', 'billing-account', 'feature-request', 'bug-report', 'training-onboarding', 'integration-help', 'security-concern']).withMessage('Invalid category'),
  query('assignedTo').optional().isMongoId().withMessage('Invalid assigned user ID'),
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
    
    if (req.query.priority) {
      query.priority = req.query.priority;
    }

    if (req.query.category) {
      query.category = req.query.category;
    }

    if (req.query.assignedTo) {
      query.assignedTo = req.query.assignedTo;
    }

    if (req.query.search) {
      query.$or = [
        { ticketNumber: { $regex: req.query.search, $options: 'i' } },
        { customerName: { $regex: req.query.search, $options: 'i' } },
        { customerEmail: { $regex: req.query.search, $options: 'i' } },
        { subject: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Get tickets
    const tickets = await SupportTicket.find(query)
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(startIndex);

    // Get total count
    const total = await SupportTicket.countDocuments(query);

    res.json({
      success: true,
      data: {
        tickets,
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

// @desc    Get support ticket by ID
// @route   GET /api/support-tickets/:id
// @access  Private/Admin
router.get('/:id', [
  protect,
  authorize('admin', 'manager', 'staff'),
  apiLimiter
], async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('responses.author._id', 'name email');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    res.json({
      success: true,
      data: { ticket }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create support ticket
// @route   POST /api/support-tickets
// @access  Public
router.post('/', [
  apiLimiter,
  body('customerName')
    .notEmpty()
    .withMessage('Customer name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Customer name must be between 2 and 100 characters'),
  body('customerEmail')
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
  body('category')
    .isIn(['general-inquiry', 'technical-support', 'billing-account', 'feature-request', 'bug-report', 'training-onboarding', 'integration-help', 'security-concern'])
    .withMessage('Invalid category'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority')
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
      customerName,
      customerEmail,
      subject,
      message,
      category,
      priority,
      source
    } = req.body;

    // Create support ticket
    const ticket = await SupportTicket.create({
      customerName,
      customerEmail,
      subject,
      message,
      category,
      priority: priority || 'medium',
      source: source || 'web-form'
    });

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      data: { ticket }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update support ticket
// @route   PUT /api/support-tickets/:id
// @access  Private/Admin
router.put('/:id', [
  protect,
  authorize('admin', 'manager', 'staff'),
  strictLimiter,
  body('status')
    .optional()
    .isIn(['open', 'in-progress', 'waiting-for-customer', 'resolved', 'closed'])
    .withMessage('Invalid status'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority'),
  body('category')
    .optional()
    .isIn(['general-inquiry', 'technical-support', 'billing-account', 'feature-request', 'bug-report', 'training-onboarding', 'integration-help', 'security-concern'])
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

    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    const { status, priority, category, tags, satisfactionRating } = req.body;

    // Update ticket
    const updatedTicket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      {
        status,
        priority,
        category,
        tags,
        satisfactionRating
      },
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name email');

    res.json({
      success: true,
      message: 'Support ticket updated successfully',
      data: { ticket: updatedTicket }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Assign ticket to user
// @route   PUT /api/support-tickets/:id/assign
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

    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    const { assignedTo } = req.body;

    // Assign ticket
    await ticket.assignTo(assignedTo);
    await ticket.populate('assignedTo', 'name email');

    res.json({
      success: true,
      message: 'Ticket assigned successfully',
      data: { ticket }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Add response to ticket
// @route   POST /api/support-tickets/:id/responses
// @access  Private/Admin
router.post('/:id/responses', [
  protect,
  authorize('admin', 'manager', 'staff'),
  strictLimiter,
  body('message')
    .notEmpty()
    .withMessage('Response message is required')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Response message must be between 1 and 2000 characters'),
  body('isInternal')
    .optional()
    .isBoolean()
    .withMessage('isInternal must be a boolean')
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

    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    const { message, isInternal } = req.body;

    // Add response
    await ticket.addResponse(message, req.user, isInternal || false);

    res.json({
      success: true,
      message: 'Response added successfully',
      data: { ticket }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Resolve ticket
// @route   PUT /api/support-tickets/:id/resolve
// @access  Private/Admin
router.put('/:id/resolve', [
  protect,
  authorize('admin', 'manager', 'staff'),
  strictLimiter
], async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    if (ticket.status === 'resolved' || ticket.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: 'Ticket is already resolved or closed'
      });
    }

    // Resolve ticket
    await ticket.resolve();

    res.json({
      success: true,
      message: 'Ticket resolved successfully',
      data: { ticket }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete support ticket
// @route   DELETE /api/support-tickets/:id
// @access  Private/Admin
router.delete('/:id', [
  protect,
  authorize('admin'),
  strictLimiter
], async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    await SupportTicket.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Support ticket deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get ticket statistics
// @route   GET /api/support-tickets/stats/overview
// @access  Private/Admin
router.get('/stats/overview', [
  protect,
  authorize('admin', 'manager'),
  apiLimiter
], async (req, res, next) => {
  try {
    const stats = await SupportTicket.getTicketStats();
    const totalTickets = await SupportTicket.countDocuments();
    const openTickets = await SupportTicket.countDocuments({ status: 'open' });
    const urgentTickets = await SupportTicket.countDocuments({ priority: 'urgent' });

    res.json({
      success: true,
      data: {
        totalTickets,
        openTickets,
        urgentTickets,
        statusBreakdown: stats
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
