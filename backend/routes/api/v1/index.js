const express = require('express');
const router = express.Router();

// Import rate limiting middleware
const { mainRateLimit, burstRateLimit, addRateLimitHeaders } = require('../../../middleware/rateLimiter');

// Import individual route modules
const inventoryRoutes = require('./inventory');
const productRoutes = require('./products');
const categoryRoutes = require('./categories');
const warehouseRoutes = require('./warehouses');

/**
 * API v1 Router
 * 
 * This router combines all v1 API routes and provides a unified entry point
 * for the REST API endpoints. All routes are protected by PAT authentication
 * middleware which is applied at the individual route level.
 */

// Apply rate limiting to all API routes
router.use(burstRateLimit); // Apply burst limiting first
router.use(mainRateLimit); // Apply main rate limiting
router.use(addRateLimitHeaders); // Add rate limit headers

// Health check endpoint (no authentication required)
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API v1 is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API information endpoint (no authentication required)
router.get('/info', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'Inventory Management REST API',
      version: '1.0.0',
      description: 'REST API for upstream systems to interact with inventory data',
      endpoints: {
        inventory: {
          base: '/api/v1/inventory',
          methods: ['GET', 'POST', 'PUT'],
          description: 'Manage inventory items and quantities'
        },
        products: {
          base: '/api/v1/products',
          methods: ['GET', 'POST', 'PUT', 'DELETE'],
          description: 'Manage product catalog'
        },
        categories: {
          base: '/api/v1/categories',
          methods: ['GET'],
          description: 'Browse product categories'
        },
        warehouses: {
          base: '/api/v1/warehouses',
          methods: ['GET'],
          description: 'Access warehouse information and analytics'
        }
      },
      authentication: {
        type: 'Bearer Token',
        description: 'All endpoints require a valid PAT (Personal Access Token) in the Authorization header'
      },
      rateLimit: {
        requests: 1000,
        period: '1 hour',
        burst: 50
      }
    },
    message: 'API information retrieved successfully'
  });
});

// Mount individual route modules
router.use('/inventory', inventoryRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/warehouses', warehouseRoutes);

// Catch-all route for undefined endpoints
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    error: {
      code: 'ENDPOINT_NOT_FOUND',
      details: `The endpoint ${req.method} ${req.originalUrl} does not exist`
    },
    availableEndpoints: [
      'GET /api/v1/health',
      'GET /api/v1/info',
      'GET /api/v1/inventory',
      'GET /api/v1/products',
      'GET /api/v1/categories',
      'GET /api/v1/warehouses'
    ]
  });
});

module.exports = router;
