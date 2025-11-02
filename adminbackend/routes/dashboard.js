const express = require('express');
const User = require('../models/User');
const InventorySetup = require('../models/InventorySetup');
const SupportTicket = require('../models/SupportTicket');
const Contact = require('../models/Contact');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const { protect, authorize } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// @desc    Get dashboard overview statistics
// @route   GET /api/dashboard/overview
// @access  Private/Admin
router.get('/overview', [
  protect,
  authorize('admin', 'manager'),
  apiLimiter
], async (req, res, next) => {
  try {
    // Get counts
    const totalUsers = await User.countDocuments();
    const pendingUsers = await User.countDocuments({ status: 'pending' });
    const approvedUsers = await User.countDocuments({ status: 'approved' });
    const activeUsers = await User.countDocuments({ isActive: true });

    const totalSetups = await InventorySetup.countDocuments();
    const pendingSetups = await InventorySetup.countDocuments({ setupStatus: 'pending' });
    const completedSetups = await InventorySetup.countDocuments({ setupStatus: 'completed' });
    const inProgressSetups = await InventorySetup.countDocuments({ setupStatus: 'in_progress' });

    const totalTickets = await SupportTicket.countDocuments();
    const openTickets = await SupportTicket.countDocuments({ status: 'open' });
    const resolvedTickets = await SupportTicket.countDocuments({ status: 'resolved' });

    const totalContacts = await Contact.countDocuments();
    const unreadContacts = await Contact.getUnreadCount();

    const totalPlans = await SubscriptionPlan.countDocuments();
    const activePlans = await SubscriptionPlan.countDocuments({ isActive: true });

    // Get recent data (last 7 days)
    const recentDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentUsers = await User.countDocuments({ createdAt: { $gte: recentDate } });
    const recentSetups = await InventorySetup.countDocuments({ createdAt: { $gte: recentDate } });
    const recentTickets = await SupportTicket.countDocuments({ createdAt: { $gte: recentDate } });
    const recentContacts = await Contact.countDocuments({ createdAt: { $gte: recentDate } });

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          pending: pendingUsers,
          approved: approvedUsers,
          active: activeUsers,
          recent: recentUsers
        },
        inventorySetups: {
          total: totalSetups,
          pending: pendingSetups,
          inProgress: inProgressSetups,
          completed: completedSetups,
          recent: recentSetups
        },
        supportTickets: {
          total: totalTickets,
          open: openTickets,
          resolved: resolvedTickets,
          recent: recentTickets
        },
        contacts: {
          total: totalContacts,
          unread: unreadContacts,
          recent: recentContacts
        },
        subscriptionPlans: {
          total: totalPlans,
          active: activePlans
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get user statistics with breakdown
// @route   GET /api/dashboard/users/stats
// @access  Private/Admin
router.get('/users/stats', [
  protect,
  authorize('admin', 'manager'),
  apiLimiter
], async (req, res, next) => {
  try {
    // Get user statistics by status
    const usersByStatus = await User.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get user statistics by role
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get user registrations over time (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const userRegistrations = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        byStatus: usersByStatus,
        byRole: usersByRole,
        registrations: userRegistrations
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get inventory setup statistics
// @route   GET /api/dashboard/setups/stats
// @access  Private/Admin
router.get('/setups/stats', [
  protect,
  authorize('admin', 'manager'),
  apiLimiter
], async (req, res, next) => {
  try {
    // Get setups by status
    const setupsByStatus = await InventorySetup.aggregate([
      {
        $group: {
          _id: '$setupStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get setups by subscription plan
    const setupsByPlan = await InventorySetup.aggregate([
      {
        $group: {
          _id: '$subscriptionPlan',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get setup completions over time (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const setupCompletions = await InventorySetup.aggregate([
      {
        $match: {
          setupCompletedAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$setupCompletedAt' },
            month: { $month: '$setupCompletedAt' },
            day: { $dayOfMonth: '$setupCompletedAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        byStatus: setupsByStatus,
        byPlan: setupsByPlan,
        completions: setupCompletions
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get support ticket statistics
// @route   GET /api/dashboard/tickets/stats
// @access  Private/Admin
router.get('/tickets/stats', [
  protect,
  authorize('admin', 'manager'),
  apiLimiter
], async (req, res, next) => {
  try {
    // Get tickets by status
    const ticketsByStatus = await SupportTicket.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get tickets by priority
    const ticketsByPriority = await SupportTicket.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get tickets by category
    const ticketsByCategory = await SupportTicket.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get average resolution time
    const avgResolutionTime = await SupportTicket.aggregate([
      {
        $match: {
          resolutionTime: { $exists: true }
        }
      },
      {
        $group: {
          _id: null,
          avgTime: { $avg: '$resolutionTime' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        byStatus: ticketsByStatus,
        byPriority: ticketsByPriority,
        byCategory: ticketsByCategory,
        avgResolutionTime: avgResolutionTime.length > 0 ? avgResolutionTime[0].avgTime : 0
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get recent activities
// @route   GET /api/dashboard/activities
// @access  Private/Admin
router.get('/activities', [
  protect,
  authorize('admin', 'manager'),
  apiLimiter
], async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Get recent users
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('name email status createdAt');

    // Get recent setups
    const recentSetups = await InventorySetup.find()
      .populate('setupBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('ownerName email setupStatus createdAt setupBy');

    // Get recent tickets
    const recentTickets = await SupportTicket.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('ticketNumber customerName status priority createdAt');

    // Get recent contacts
    const recentContacts = await Contact.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('name email subject status createdAt');

    res.json({
      success: true,
      data: {
        recentUsers,
        recentSetups,
        recentTickets,
        recentContacts
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
