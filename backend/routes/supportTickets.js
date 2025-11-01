const express = require('express');
const router = express.Router();
const SupportTicket = require('../models/SupportTicket');
const { body, validationResult } = require('express-validator');
const { auth, adminAuth } = require('../middleware/auth');

// @route   POST /api/support-tickets
// @desc    Create a new support ticket
// @access  Public
router.post('/', [
  body('customerName').notEmpty().trim().isLength({ min: 2, max: 100 }),
  body('customerEmail').isEmail().normalizeEmail(),
  body('subject').notEmpty().trim().isLength({ min: 5, max: 200 }),
  body('category').isIn(['general-inquiry', 'technical-support', 'billing-account', 'feature-request', 'bug-report', 'training-onboarding', 'integration-help', 'security-concern']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('message').notEmpty().isLength({ min: 10, max: 5000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { customerName, customerEmail, subject, category, priority = 'medium', message } = req.body;

    const ticket = new SupportTicket({
      customerName,
      customerEmail,
      subject,
      category,
      priority,
      message,
      source: 'web-form'
    });

    await ticket.save();

    res.status(201).json({
      message: 'Support ticket created successfully',
      ticket: {
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
        priority: ticket.priority,
        createdAt: ticket.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/support-tickets
// @desc    Get all support tickets (Admin only)
// @access  Private (Admin)
router.get('/', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const priority = req.query.priority;
    const category = req.query.category;
    const search = req.query.search;

    let query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { ticketNumber: new RegExp(search, 'i') },
        { customerName: new RegExp(search, 'i') },
        { customerEmail: new RegExp(search, 'i') },
        { subject: new RegExp(search, 'i') }
      ];
    }

    const tickets = await SupportTicket.find(query)
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    const total = await SupportTicket.countDocuments(query);

    res.json({
      tickets,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalTickets: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/support-tickets/:id
// @desc    Get a specific support ticket
// @access  Private (Admin)
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('responses.author._id', 'name email');

    if (!ticket) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Error fetching support ticket:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/support-tickets/:id
// @desc    Update a support ticket
// @access  Private (Admin)
router.put('/:id', [
  adminAuth,
  body('status').optional().isIn(['open', 'in-progress', 'waiting-for-customer', 'resolved', 'closed']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('assignedTo').optional().isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { status, priority, assignedTo, tags } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (tags) updateData.tags = tags;

    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name email');

    if (!ticket) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }

    res.json({
      message: 'Support ticket updated successfully',
      ticket
    });
  } catch (error) {
    console.error('Error updating support ticket:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/support-tickets/:id/responses
// @desc    Add a response to a support ticket
// @access  Private (Admin)
router.post('/:id/responses', [
  adminAuth,
  body('message').notEmpty().isLength({ min: 1, max: 5000 }),
  body('isInternal').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { message, isInternal = false } = req.body;

    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }

    const response = {
      message,
      author: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      },
      isInternal
    };

    ticket.responses.push(response);
    await ticket.save();

    res.json({
      message: 'Response added successfully',
      response
    });
  } catch (error) {
    console.error('Error adding response:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/support-tickets/stats
// @desc    Get support ticket statistics
// @access  Private (Admin)
router.get('/stats/overview', adminAuth, async (req, res) => {
  try {
    const stats = await SupportTicket.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          open: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          closed: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } },
          urgent: { $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] } },
          high: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } }
        }
      }
    ]);

    const result = stats[0] || {
      total: 0,
      open: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
      urgent: 0,
      high: 0
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching ticket stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
