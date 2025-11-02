const patAuth = require('../../middleware/patAuth');
const axios = require('axios');

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

describe('PAT Authentication Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      body: {},
      params: {},
      query: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    
    // Clear all mocks
    jest.clearAllMocks();
    
    // Set environment variable for tests
    process.env.ADMIN_BACKEND_URL = 'http://localhost:5001';
  });

  describe('Missing Authorization Header', () => {
    test('should return 401 when authorization header is missing', async () => {
      await patAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authorization header missing',
        error: {
          code: 'AUTH_TOKEN_MISSING',
          details: 'Authorization header is required'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 401 when authorization header is empty', async () => {
      req.headers.authorization = '';
      
      await patAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authorization header missing',
        error: {
          code: 'AUTH_TOKEN_MISSING',
          details: 'Authorization header is required'
        }
      });
    });
  });

  describe('Invalid Authorization Format', () => {
    test('should return 401 when authorization format is invalid', async () => {
      req.headers.authorization = 'InvalidFormat token123';
      
      await patAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid authorization format',
        error: {
          code: 'AUTH_TOKEN_INVALID',
          details: 'Authorization header must start with "Bearer "'
        }
      });
    });

    test('should return 401 when Bearer keyword is missing', async () => {
      req.headers.authorization = 'token123';
      
      await patAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid authorization format',
        error: {
          code: 'AUTH_TOKEN_INVALID',
          details: 'Authorization header must start with "Bearer "'
        }
      });
    });

    test('should return 401 when token is missing after Bearer', async () => {
      req.headers.authorization = 'Bearer ';
      
      await patAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'PAT token missing',
        error: {
          code: 'AUTH_TOKEN_MISSING',
          details: 'PAT token is required'
        }
      });
    });
  });

  describe('Admin Backend API Calls', () => {
    test('should return 401 when adminbackend returns invalid token error', async () => {
      req.headers.authorization = 'Bearer invalid_token_123';
      
      const apiError = {
        response: {
          status: 401,
          data: {
            success: false,
            message: 'Invalid PAT token',
            error: {
              code: 'AUTH_TOKEN_INVALID',
              details: 'PAT token not found'
            }
          }
        }
      };
      
      mockedAxios.post.mockRejectedValue(apiError);
      
      await patAuth(req, res, next);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:5001/api/inventory-setup/validate-pat',
        { token: 'invalid_token_123' },
        {
          timeout: 5000,
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid PAT token',
        error: {
          code: 'AUTH_TOKEN_INVALID',
          details: 'PAT token not found'
        }
      });
    });

    test('should return 401 when adminbackend returns revoked token error', async () => {
      req.headers.authorization = 'Bearer revoked_token_123';
      
      const apiError = {
        response: {
          status: 401,
          data: {
            success: false,
            message: 'PAT token has been revoked',
            error: {
              code: 'AUTH_TOKEN_REVOKED',
              details: 'This PAT token has been deactivated'
            }
          }
        }
      };
      
      mockedAxios.post.mockRejectedValue(apiError);
      
      await patAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'PAT token has been revoked',
        error: {
          code: 'AUTH_TOKEN_REVOKED',
          details: 'This PAT token has been deactivated'
        }
      });
    });

    test('should return 401 when adminbackend returns expired token error', async () => {
      req.headers.authorization = 'Bearer expired_token_123';
      
      const apiError = {
        response: {
          status: 401,
          data: {
            success: false,
            message: 'PAT token has expired',
            error: {
              code: 'AUTH_TOKEN_EXPIRED',
              details: 'Token expired on 2024-01-01T00:00:00.000Z'
            }
          }
        }
      };
      
      mockedAxios.post.mockRejectedValue(apiError);
      
      await patAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'PAT token has expired',
        error: {
          code: 'AUTH_TOKEN_EXPIRED',
          details: 'Token expired on 2024-01-01T00:00:00.000Z'
        }
      });
    });

    test('should return 400 when adminbackend returns validation error', async () => {
      req.headers.authorization = 'Bearer some_token';
      
      const apiError = {
        response: {
          status: 400,
          data: {
            success: false,
            message: 'Validation failed',
            error: {
              code: 'VALIDATION_ERROR',
              details: 'PAT token is required'
            }
          }
        }
      };
      
      mockedAxios.post.mockRejectedValue(apiError);
      
      await patAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        error: {
          code: 'VALIDATION_ERROR',
          details: 'PAT token is required'
        }
      });
    });
  });

  describe('Network Error Handling', () => {
    test('should return 503 when adminbackend service is unavailable (ECONNREFUSED)', async () => {
      req.headers.authorization = 'Bearer valid_token_123';
      
      const networkError = new Error('connect ECONNREFUSED 127.0.0.1:5001');
      networkError.code = 'ECONNREFUSED';
      
      mockedAxios.post.mockRejectedValue(networkError);
      
      await patAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication service unavailable',
        error: {
          code: 'SERVICE_UNAVAILABLE',
          details: 'Unable to connect to authentication service'
        }
      });
    });

    test('should return 503 when adminbackend service is not found (ENOTFOUND)', async () => {
      req.headers.authorization = 'Bearer valid_token_123';
      
      const networkError = new Error('getaddrinfo ENOTFOUND localhost');
      networkError.code = 'ENOTFOUND';
      
      mockedAxios.post.mockRejectedValue(networkError);
      
      await patAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication service unavailable',
        error: {
          code: 'SERVICE_UNAVAILABLE',
          details: 'Unable to connect to authentication service'
        }
      });
    });

    test('should return 504 when adminbackend service times out', async () => {
      req.headers.authorization = 'Bearer valid_token_123';
      
      const timeoutError = new Error('timeout of 5000ms exceeded');
      timeoutError.code = 'ECONNABORTED';
      
      mockedAxios.post.mockRejectedValue(timeoutError);
      
      await patAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(504);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication service timeout',
        error: {
          code: 'SERVICE_TIMEOUT',
          details: 'Authentication service took too long to respond'
        }
      });
    });

    test('should return 500 for unexpected API errors', async () => {
      req.headers.authorization = 'Bearer valid_token_123';
      
      const unexpectedError = new Error('Unexpected API error');
      
      mockedAxios.post.mockRejectedValue(unexpectedError);
      
      await patAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication service error',
        error: {
          code: 'AUTH_SERVICE_ERROR',
          details: 'Unable to validate PAT token'
        }
      });
    });
  });

  describe('Successful Authentication', () => {
    test('should authenticate successfully and call next()', async () => {
      req.headers.authorization = 'Bearer valid_token_123';
      
      const apiResponse = {
        data: {
          success: true,
          message: 'PAT token validated successfully',
          data: {
            client: {
              _id: 'setup_id',
              clientCode: 'CLIENT_001',
              databaseName: 'test_db',
              ownerName: 'Test Owner',
              email: 'test@example.com',
              industry: 'Technology',
              subscriptionPlan: 'Professional',
              subscriptionStatus: 'active'
            },
            patToken: {
              token: 'valid_token_123',
              expiryDate: '2024-12-31T23:59:59.999Z',
              createdAt: '2024-01-01T00:00:00.000Z',
              lastUsedAt: '2024-01-01T12:00:00.000Z'
            }
          }
        }
      };
      
      mockedAxios.post.mockResolvedValue(apiResponse);
      
      await patAuth(req, res, next);

      expect(req.client).toEqual({
        _id: 'setup_id',
        clientCode: 'CLIENT_001',
        databaseName: 'test_db',
        ownerName: 'Test Owner',
        email: 'test@example.com',
        industry: 'Technology',
        subscriptionPlan: 'Professional',
        subscriptionStatus: 'active'
      });
      
      expect(req.patToken).toEqual({
        token: 'valid_token_123',
        expiryDate: '2024-12-31T23:59:59.999Z',
        createdAt: '2024-01-01T00:00:00.000Z',
        lastUsedAt: '2024-01-01T12:00:00.000Z'
      });
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should handle adminbackend API response that returns unsuccessful status', async () => {
      req.headers.authorization = 'Bearer invalid_response_token';
      
      const apiResponse = {
        data: {
          success: false,
          message: 'Custom error message',
          error: {
            code: 'CUSTOM_ERROR',
            details: 'Custom error details'
          }
        }
      };
      
      mockedAxios.post.mockResolvedValue(apiResponse);
      
      await patAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Custom error message',
        error: {
          code: 'CUSTOM_ERROR',
          details: 'Custom error details'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    test('should handle token with extra whitespace', async () => {
      req.headers.authorization = 'Bearer   valid_token_123   ';
      
      const apiResponse = {
        data: {
          success: true,
          message: 'PAT token validated successfully',
          data: {
            client: {
              _id: 'setup_id',
              clientCode: 'CLIENT_001',
              databaseName: 'test_db',
              ownerName: 'Test Owner',
              email: 'test@example.com',
              industry: 'Technology',
              subscriptionPlan: 'Professional',
              subscriptionStatus: 'active'
            },
            patToken: {
              token: 'valid_token_123',
              expiryDate: '2024-12-31T23:59:59.999Z',
              createdAt: '2024-01-01T00:00:00.000Z',
              lastUsedAt: '2024-01-01T12:00:00.000Z'
            }
          }
        }
      };
      
      mockedAxios.post.mockResolvedValue(apiResponse);
      
      await patAuth(req, res, next);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:5001/api/inventory-setup/validate-pat',
        { token: 'valid_token_123' },
        {
          timeout: 5000,
          headers: { 'Content-Type': 'application/json' }
        }
      );
      expect(next).toHaveBeenCalled();
    });

    test('should handle custom ADMIN_BACKEND_URL environment variable', async () => {
      process.env.ADMIN_BACKEND_URL = 'http://custom-admin:8080';
      req.headers.authorization = 'Bearer valid_token_123';
      
      const apiResponse = {
        data: {
          success: true,
          data: {
            client: { _id: 'test' },
            patToken: { token: 'valid_token_123' }
          }
        }
      };
      
      mockedAxios.post.mockResolvedValue(apiResponse);
      
      await patAuth(req, res, next);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://custom-admin:8080/api/inventory-setup/validate-pat',
        { token: 'valid_token_123' },
        {
          timeout: 5000,
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      // Reset for other tests
      process.env.ADMIN_BACKEND_URL = 'http://localhost:5001';
    });

    test('should handle unexpected errors gracefully', async () => {
      req.headers.authorization = 'Bearer valid_token_123';
      
      // Simulate an error that doesn't match our specific error handling cases
      const weirdError = new Error('Something went wrong');
      weirdError.someProperty = 'unexpected';
      
      mockedAxios.post.mockRejectedValue(weirdError);
      
      await patAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication service error',
        error: {
          code: 'AUTH_SERVICE_ERROR',
          details: 'Unable to validate PAT token'
        }
      });
    });
  });

  describe('Error Response Fallbacks', () => {
    test('should handle adminbackend response without success property', async () => {
      req.headers.authorization = 'Bearer malformed_response_token';
      
      const apiResponse = {
        data: {
          // Missing success property
          message: 'Some response without success flag'
        }
      };
      
      mockedAxios.post.mockResolvedValue(apiResponse);
      
      await patAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Some response without success flag',
        error: {
          code: 'AUTH_TOKEN_INVALID',
          details: 'PAT token validation failed'
        }
      });
    });
  });
});
