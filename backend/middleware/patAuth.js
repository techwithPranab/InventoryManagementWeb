const jwt = require('jsonwebtoken');
const axios = require('axios');

/**
 * PAT Token Authentication Middleware
 * 
 * This middleware validates Personal Access Tokens (PAT) by calling the adminbackend API
 * and sets up the appropriate client database connection based on the client code 
 * associated with the token.
 * 
 * Flow:
 * 1. Extract PAT token from Authorization header
 * 2. Call adminbackend API to validate token
 * 3. Check if token is active and not expired (handled by API)
 * 4. Extract client code and database name from API response
 * 5. Attach client info to request object
 */

const patAuth = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header missing',
        error: {
          code: 'AUTH_TOKEN_MISSING',
          details: 'Authorization header is required'
        }
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization format',
        error: {
          code: 'AUTH_TOKEN_INVALID',
          details: 'Authorization header must start with "Bearer "'
        }
      });
    }

    const token = authHeader.substring(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'PAT token missing',
        error: {
          code: 'AUTH_TOKEN_MISSING',
          details: 'PAT token is required'
        }
      });
    }

    // Call adminbackend API to validate PAT token
    const adminBackendUrl = process.env.ADMIN_BACKEND_URL || 'http://localhost:5001';
    
    try {
      const response = await axios.post(`${adminBackendUrl}/api/inventory-setup/validate-pat`, {
        token: token
      }, {
        timeout: 5000, // 5 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.data.success) {
        return res.status(401).json({
          success: false,
          message: response.data.message || 'PAT token validation failed',
          error: response.data.error || {
            code: 'AUTH_TOKEN_INVALID',
            details: 'PAT token validation failed'
          }
        });
      }

      const { client, patToken } = response.data.data;

      // Attach client information to request object
      req.client = {
        _id: client._id,
        clientCode: client.clientCode,
        databaseName: client.databaseName,
        ownerName: client.ownerName,
        email: client.email,
        industry: client.industry,
        subscriptionPlan: client.subscriptionPlan,
        subscriptionStatus: client.subscriptionStatus
      };

      // Attach PAT token info for potential rate limiting
      req.patToken = {
        token: patToken.token,
        expiryDate: patToken.expiryDate,
        createdAt: patToken.createdAt,
        lastUsedAt: patToken.lastUsedAt
      };

      next();

    } catch (apiError) {
      console.error('Adminbackend API call error:', apiError.message);
      
      // Handle specific API errors
      if (apiError.response && apiError.response.status) {
        const statusCode = apiError.response.status;
        const errorData = apiError.response.data;
        
        if (statusCode === 401) {
          return res.status(401).json({
            success: false,
            message: errorData.message || 'Invalid PAT token',
            error: errorData.error || {
              code: 'AUTH_TOKEN_INVALID',
              details: 'PAT token validation failed'
            }
          });
        }
        
        if (statusCode === 400) {
          return res.status(400).json({
            success: false,
            message: errorData.message || 'Invalid request',
            error: errorData.error || {
              code: 'VALIDATION_ERROR',
              details: 'Invalid PAT token format'
            }
          });
        }
      }
      
      // Handle network/timeout errors
      if (apiError.code === 'ECONNREFUSED' || apiError.code === 'ENOTFOUND') {
        return res.status(503).json({
          success: false,
          message: 'Authentication service unavailable',
          error: {
            code: 'SERVICE_UNAVAILABLE',
            details: 'Unable to connect to authentication service'
          }
        });
      }
      
      if (apiError.code === 'ECONNABORTED') {
        return res.status(504).json({
          success: false,
          message: 'Authentication service timeout',
          error: {
            code: 'SERVICE_TIMEOUT',
            details: 'Authentication service took too long to respond'
          }
        });
      }
      
      // Generic API error
      return res.status(500).json({
        success: false,
        message: 'Authentication service error',
        error: {
          code: 'AUTH_SERVICE_ERROR',
          details: 'Unable to validate PAT token'
        }
      });
    }

  } catch (error) {
    console.error('PAT authentication error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication',
      error: {
        code: 'INTERNAL_ERROR',
        details: 'Authentication service unavailable'
      }
    });
  }
};

module.exports = patAuth;
