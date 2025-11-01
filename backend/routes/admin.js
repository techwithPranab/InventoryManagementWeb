const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const Inventory = require('../models/Inventory');
const InventoryTransfer = require('../models/InventoryTransfer');
const Manufacturer = require('../models/Manufacturer');
const Supplier = require('../models/Supplier');
const PurchaseOrder = require('../models/PurchaseOrder');
const SalesOrder = require('../models/SalesOrder');
const Shipping = require('../models/Shipping');
const { adminAuth } = require('../middleware/adminAuth');

const router = express.Router();

// @route   GET /api/admin/inventory-setup/:userId
// @desc    Get inventory setup status for a user
// @access  Private (Admin)
router.get('/inventory-setup/:userId', adminAuth, async (req, res) => {
  try {
    // For this endpoint, we need to check if there's already a client database setup
    // Since we don't store user data in backend, we'll check if any databases exist for this userId
    
    // We'll look for existing inventory in any client database
    // This is a simplified approach - in production you might want to maintain a registry
    const userId = req.params.userId;
    
    // Try to find if any inventory exists for this user
    // For now, return empty counts since we don't maintain user records in backend
    const counts = {
      categories: 0,
      warehouses: 0,
      products: 0,
      inventory: 0
    };

    res.json({
      counts,
      userId,
      setupCompleted: false // We can't determine this from backend alone
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/inventory-setup
// @desc    Setup initial inventory database schema for a user (no default data)
// @access  Private (Admin)
router.post('/inventory-setup', [
  adminAuth,
  body('userId').notEmpty().withMessage('User ID is required'),
  body('setupData.clientCode').isLength({ min: 8, max: 8 }).withMessage('Client code must be exactly 8 characters'),
  body('setupData.industry').isIn(['grocery', 'electronics', 'pharmaceutical', 'textile', 'automotive', 'construction', 'manufacturing', 'other']).withMessage('Invalid industry')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { setupData } = req.body;
    const { clientCode, industry } = setupData;

    // Create client-specific database name
    const dbName = `inventory_management_${clientCode}`;

    // Check if database already exists
    const adminDb = mongoose.connection.db.admin();
    const dbList = await adminDb.listDatabases();
    const existingDb = dbList.databases.find(db => db.name === dbName);
    
    if (existingDb) {
      return res.status(400).json({
        message: 'Database already exists for this client code',
        database: dbName
      });
    }

    // Create a new connection to the client database
    // Extract base URI and append new database name
    const baseUri = process.env.MONGODB_URI.substring(0, process.env.MONGODB_URI.lastIndexOf('/'));
    const clientDbUri = `${baseUri}/${dbName}`;
    const clientConnection = mongoose.createConnection(clientDbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Wait for connection
    await new Promise((resolve, reject) => {
      clientConnection.once('open', resolve);
      clientConnection.once('error', reject);
    });

    try {
      // Define collection names
      const collectionNames = [
        'categories',
        'products', 
        'warehouses',
        'inventories',
        'inventorytransfers',
        'manufacturers',
        'suppliers',
        'purchaseorders',
        'salesorders',
        'shippings'
      ];

      // Create empty collections
      await Promise.all(
        collectionNames.map(collectionName => 
          clientConnection.db.createCollection(collectionName)
        )
      );

      // Verify collections were created
      const collections = await clientConnection.db.listCollections().toArray();
      const createdCollectionNames = collections.map(col => col.name);

      // Close the client connection
      await clientConnection.close();

      res.json({
        message: 'Inventory database schema setup completed successfully',
        clientCode,
        industry,
        database: dbName,
        collections: createdCollectionNames
      });

    } catch (error) {
      await clientConnection.close();
      throw error;
    }

  } catch (error) {
    console.error('Inventory setup error:', error);
    res.status(500).json({
      message: 'Failed to setup inventory database',
      error: error.message
    });
  }
});

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private (Admin)
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    // Get user statistics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const userStatsMap = userStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    // Get inventory setup statistics (mock for now since we don't track this in backend)
    const inventoryStats = {
      totalSetups: 15,
      completedSetups: 9,
      inProgressSetups: 2,
      failedSetups: 1
    };

    // Get revenue statistics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const revenueResult = await SalesOrder.aggregate([
      {
        $match: {
          orderDate: { $gte: thirtyDaysAgo },
          status: { $in: ['shipped', 'delivered'] }
        }
      },
      {
        $group: {
          _id: null,
          monthly: { $sum: '$totalAmount' }
        }
      }
    ]);

    const revenue = {
      monthly: revenueResult[0]?.monthly || 0,
      yearly: (revenueResult[0]?.monthly || 0) * 12 // Approximation
    };

    // Get system stats
    const activeUsers = await User.countDocuments({ isActive: true });

    res.json({
      users: {
        total: userStatsMap.pending + userStatsMap.approved + userStatsMap.rejected || 0,
        pending: userStatsMap.pending || 0,
        approved: userStatsMap.approved || 0,
        rejected: userStatsMap.rejected || 0
      },
      inventory: inventoryStats,
      revenue,
      system: {
        activeUsers,
        totalRevenue: revenue.yearly
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/users
// @desc    Get users with pagination and filtering
// @access  Private (Admin)
router.get('/users', adminAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      role,
      search
    } = req.query;

    let query = {};

    if (status) {
      query.status = status;
    }

    if (role) {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/admin/users/:userId
// @desc    Approve or reject a user
// @access  Private (Admin)
router.patch('/users/:userId', adminAuth, async (req, res) => {
  try {
    const { action, role } = req.body;
    const userId = req.params.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (action === 'approve') {
      user.status = 'approved';
      user.role = role || 'client';
      user.approvedAt = new Date();
      user.approvedBy = req.user._id;
    } else if (action === 'reject') {
      user.status = 'rejected';
    } else {
      return res.status(400).json({ message: 'Invalid action' });
    }

    await user.save();

    res.json({
      message: `User ${action}d successfully`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobileNo: user.mobileNo,
        industry: user.industry,
        status: user.status,
        role: user.role,
        approvedAt: user.approvedAt,
        approvedBy: user.approvedBy
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/analytics
// @desc    Get analytics data
// @access  Private (Admin)
router.get('/analytics', adminAuth, async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    // Get user statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });

    // Get user growth data (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const userGrowthData = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    const userGrowth = {
      labels: userGrowthData.map(item => {
        const date = new Date(item._id.year, item._id.month - 1);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }),
      data: userGrowthData.map(item => item.count)
    };

    // Get revenue data
    const revenueData = await SalesOrder.aggregate([
      {
        $match: {
          status: { $in: ['shipped', 'delivered'] }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$orderDate' },
            month: { $month: '$orderDate' }
          },
          revenue: { $sum: '$totalAmount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      { $limit: 12 }
    ]);

    const revenue = {
      monthly: revenueData.length > 0 ? revenueData[revenueData.length - 1].revenue : 0,
      yearly: revenueData.reduce((sum, item) => sum + item.revenue, 0)
    };

    // Get inventory stats from approved users
    const approvedUsers = await User.find({ status: 'approved' }).lean();
    const totalSetups = approvedUsers.length;
    const completedSetups = 0; // No longer tracking setup completion in User model

    // Get setup progress based on approved users (simplified)
    const pendingSetups = approvedUsers.length;
    const setupProgress = {
      labels: ['Pending', 'In Progress', 'Completed', 'Failed'],
      data: [pendingSetups, 0, 0, 0] // All approved users are pending setup
    };

    // Get plan distribution (mock data for now since users don't have plans)
    const planDistribution = {
      labels: ['Free', 'Starter', 'Professional', 'Enterprise'],
      data: [approvedUsers.length, 0, 0, 0] // All approved users are Free for now
    };

    res.json({
      totalUsers,
      activeUsers,
      totalSetups,
      completedSetups,
      inProgressSetups: 0,
      failedSetups: 0,
      revenue,
      userGrowth,
      setupProgress,
      planDistribution
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/inventory-setups
// @desc    Get inventory setup data
// @access  Private (Admin)
router.get('/inventory-setups', adminAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      plan
    } = req.query;

    // Get approved users and create inventory setup data from them
    let userQuery = { status: 'approved' };

    if (plan) {
      // Note: Users don't have subscriptionPlan field, so we'll skip this filter for now
      // In a real implementation, users would have a subscription plan
    }

    const users = await User.find(userQuery)
      .populate('approvedBy', 'name email')
      .sort({ approvedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await User.countDocuments(userQuery);

    // Transform users into inventory setup format (simplified without inventorySetup)
    const setups = users.map(user => ({
      _id: user._id,
      ownerName: user.name,
      email: user.email,
      mobileNo: user.mobileNo,
      industry: user.industry,
      subscriptionPlan: 'Free', // Default plan since users don't have subscription info
      clientCode: `CLIENT${user._id.toString().slice(-6).toUpperCase()}`,
      databaseName: `inventory_${user._id.toString()}`,
      setupStatus: 'pending', // All setups are pending since we removed tracking
      setupCompletedAt: null,
      createdAt: user.approvedAt || user.createdAt,
      setupProgress: {
        categoriesCreated: false,
        warehousesCreated: false,
        productsAdded: false,
        initialInventorySet: false
      }
    }));

    // Filter by status if provided
    let filteredSetups = setups;
    if (status) {
      filteredSetups = setups.filter(setup => setup.setupStatus === status);
    }

    res.json({
      setups: filteredSetups,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredSetups.length,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/categories
// @desc    Create a category for a client
// @access  Private (Admin)
router.post('/categories', [
  adminAuth,
  body('name').notEmpty().withMessage('Category name is required'),
  body('description').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const clientId = req.headers['x-client-id'];
    if (!clientId) {
      return res.status(400).json({ message: 'Client ID is required' });
    }

    // Find user by client ID
    const user = await User.findById(clientId);
    if (!user) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Create client-specific database connection
    const dbName = `inventory_${user._id.toString()}`;
    const baseUri = process.env.MONGODB_URI.substring(0, process.env.MONGODB_URI.lastIndexOf('/'));
    const clientDbUri = `${baseUri}/${dbName}`;
    const clientConnection = mongoose.createConnection(clientDbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    await new Promise((resolve, reject) => {
      clientConnection.once('open', resolve);
      clientConnection.once('error', reject);
    });

    try {
      // Create category in client database
      const CategoryModel = clientConnection.model('Category', Category.schema);
      const category = new CategoryModel(req.body);
      await category.save();

      await clientConnection.close();

      res.json({
        message: 'Category created successfully',
        category
      });
    } catch (error) {
      await clientConnection.close();
      throw error;
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/warehouses
// @desc    Create a warehouse for a client
// @access  Private (Admin)
router.post('/warehouses', [
  adminAuth,
  body('name').notEmpty().withMessage('Warehouse name is required'),
  body('code').notEmpty().withMessage('Warehouse code is required'),
  body('address').isObject().withMessage('Address is required'),
  body('capacity').isNumeric().withMessage('Capacity must be a number'),
  body('type').isIn(['primary', 'secondary', 'distribution']).withMessage('Invalid warehouse type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const clientId = req.headers['x-client-id'];
    if (!clientId) {
      return res.status(400).json({ message: 'Client ID is required' });
    }

    // Find user by client ID
    const user = await User.findById(clientId);
    if (!user) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Create client-specific database connection
    const dbName = `inventory_${user._id.toString()}`;
    const baseUri = process.env.MONGODB_URI.substring(0, process.env.MONGODB_URI.lastIndexOf('/'));
    const clientDbUri = `${baseUri}/${dbName}`;
    const clientConnection = mongoose.createConnection(clientDbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    await new Promise((resolve, reject) => {
      clientConnection.once('open', resolve);
      clientConnection.once('error', reject);
    });

    try {
      // Create warehouse in client database
      const WarehouseModel = clientConnection.model('Warehouse', Warehouse.schema);
      const warehouse = new WarehouseModel(req.body);
      await warehouse.save();

      await clientConnection.close();

      res.json({
        message: 'Warehouse created successfully',
        warehouse
      });
    } catch (error) {
      await clientConnection.close();
      throw error;
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/products
// @desc    Create a product for a client
// @access  Private (Admin)
router.post('/products', [
  adminAuth,
  body('name').notEmpty().withMessage('Product name is required'),
  body('sku').notEmpty().withMessage('SKU is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('costPrice').isNumeric().withMessage('Cost price must be a number'),
  body('sellingPrice').isNumeric().withMessage('Selling price must be a number'),
  body('reorderLevel').isNumeric().withMessage('Reorder level must be a number'),
  body('minStockLevel').isNumeric().withMessage('Minimum stock level must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const clientId = req.headers['x-client-id'];
    if (!clientId) {
      return res.status(400).json({ message: 'Client ID is required' });
    }

    // Find user by client ID
    const user = await User.findById(clientId);
    if (!user) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Create client-specific database connection
    const dbName = `inventory_${user._id.toString()}`;
    const baseUri = process.env.MONGODB_URI.substring(0, process.env.MONGODB_URI.lastIndexOf('/'));
    const clientDbUri = `${baseUri}/${dbName}`;
    const clientConnection = mongoose.createConnection(clientDbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    await new Promise((resolve, reject) => {
      clientConnection.once('open', resolve);
      clientConnection.once('error', reject);
    });

    try {
      // Create product in client database
      const ProductModel = clientConnection.model('Product', Product.schema);
      const product = new ProductModel(req.body);
      await product.save();

      await clientConnection.close();

      res.json({
        message: 'Product created successfully',
        product
      });
    } catch (error) {
      await clientConnection.close();
      throw error;
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/inventory-setups/:clientId/complete
// @desc    Mark inventory setup as completed for a client
// @access  Private (Admin)
router.post('/inventory-setups/:clientId/complete', adminAuth, async (req, res) => {
  try {
    const { clientId } = req.params;

    // Find user by ID
    const user = await User.findById(clientId);
    if (!user) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Update inventory setup status
    
    
    await user.save();

    res.json({
      message: 'Inventory setup marked as completed',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobileNo: user.mobileNo
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
