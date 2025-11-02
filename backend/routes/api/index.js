const express = require('express');
const router = express.Router();

// Import API version routers
const v1Routes = require('./v1');

/**
 * Main API Router
 * 
 * This router serves as the entry point for all API versions.
 * Currently supports v1 of the REST API.
 */

// Mount API version routes
router.use('/v1', v1Routes);

// API root endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'Inventory Management REST API',
      description: 'REST API for upstream systems to interact with inventory data',
      versions: {
        v1: {
          status: 'active',
          baseUrl: '/api/v1',
          description: 'Current stable version with full feature support'
        }
      },
      documentation: '/api/v1/info',
      healthCheck: '/api/v1/health'
    },
    message: 'Welcome to the Inventory Management REST API'
  });
});

// Handle undefined API versions
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API version not found',
    error: {
      code: 'VERSION_NOT_FOUND',
      details: `The API version ${req.originalUrl} does not exist`
    },
    availableVersions: [
      'v1'
    ]
  });
});

module.exports = router;
