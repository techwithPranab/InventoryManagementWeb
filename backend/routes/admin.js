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
    // Since user management is in Admin Web, we'll return basic backend stats
    // This could include database stats, system health, etc.
    
    res.json({
      message: 'Backend admin dashboard',
      timestamp: new Date().toISOString(),
      status: 'operational'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
