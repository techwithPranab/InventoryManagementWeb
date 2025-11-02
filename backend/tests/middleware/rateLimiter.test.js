// Mock Redis and express-rate-limit before importing the module
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    call: jest.fn().mockResolvedValue('OK'),
    disconnect: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    once: jest.fn()
  }));
});

jest.mock('express-rate-limit', () => {
  return jest.fn(() => jest.fn((req, res, next) => next()));
});

jest.mock('rate-limit-redis', () => {
  return jest.fn().mockImplementation(() => ({}));
});

const rateLimiter = require('../../middleware/rateLimiter');

describe('Rate Limiter Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      client: {
        subscriptionPlan: 'Professional'
      },
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'test-agent'
      },
      originalUrl: '/api/v1/inventory',
      path: '/api/v1/inventory'
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      set: jest.fn(),
      setHeader: jest.fn()
    };
    next = jest.fn();
    
    jest.clearAllMocks();
  });

  describe('Rate Limiter Components', () => {
    test('should export main rate limiter', () => {
      expect(rateLimiter.mainRateLimit).toBeDefined();
      expect(typeof rateLimiter.mainRateLimit).toBe('function');
    });

    test('should export burst rate limiter', () => {
      expect(rateLimiter.burstRateLimit).toBeDefined();
      expect(typeof rateLimiter.burstRateLimit).toBe('function');
    });

    test('should export read rate limiter', () => {
      expect(rateLimiter.readRateLimit).toBeDefined();
      expect(typeof rateLimiter.readRateLimit).toBe('function');
    });

    test('should export write rate limiter', () => {
      expect(rateLimiter.writeRateLimit).toBeDefined();
      expect(typeof rateLimiter.writeRateLimit).toBe('function');
    });

    test('should export analytics rate limiter', () => {
      expect(rateLimiter.analyticsRateLimit).toBeDefined();
      expect(typeof rateLimiter.analyticsRateLimit).toBe('function');
    });

    test('should export header middleware', () => {
      expect(rateLimiter.addRateLimitHeaders).toBeDefined();
      expect(typeof rateLimiter.addRateLimitHeaders).toBe('function');
    });
  });

  describe('Rate Limit Headers Middleware', () => {
    test('should add rate limit headers for authenticated requests', () => {
      req.client = { subscriptionPlan: 'Professional' };
      req.patToken = { token: 'test_token' };
      
      rateLimiter.addRateLimitHeaders(req, res, next);
      
      expect(res.set).toHaveBeenCalledWith({
        'X-RateLimit-Limit': 2000,
        'X-RateLimit-Window': 3600,
        'X-RateLimit-Plan': 'Professional'
      });
      expect(next).toHaveBeenCalled();
    });

    test('should handle missing client info gracefully', () => {
      req.client = null;
      req.patToken = null;
      
      rateLimiter.addRateLimitHeaders(req, res, next);
      
      expect(res.set).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    test('should set correct headers for Free plan', () => {
      req.client = { subscriptionPlan: 'Free' };
      req.patToken = { token: 'test_token' };
      
      rateLimiter.addRateLimitHeaders(req, res, next);
      
      expect(res.set).toHaveBeenCalledWith({
        'X-RateLimit-Limit': 100,
        'X-RateLimit-Window': 3600,
        'X-RateLimit-Plan': 'Free'
      });
    });

    test('should set correct headers for Enterprise plan', () => {
      req.client = { subscriptionPlan: 'Enterprise' };
      req.patToken = { token: 'test_token' };
      
      rateLimiter.addRateLimitHeaders(req, res, next);
      
      expect(res.set).toHaveBeenCalledWith({
        'X-RateLimit-Limit': 10000,
        'X-RateLimit-Window': 3600,
        'X-RateLimit-Plan': 'Enterprise'
      });
    });

    test('should default to Free plan when subscription is missing', () => {
      req.client = {};
      req.patToken = { token: 'test_token' };
      
      rateLimiter.addRateLimitHeaders(req, res, next);
      
      expect(res.set).toHaveBeenCalledWith({
        'X-RateLimit-Limit': 100,
        'X-RateLimit-Window': 3600,
        'X-RateLimit-Plan': 'Free'
      });
    });
  });

  describe('Middleware Integration', () => {
    test('should handle request without throwing errors', () => {
      expect(() => {
        rateLimiter.addRateLimitHeaders(req, res, next);
      }).not.toThrow();
    });

    test('should work with undefined request properties', () => {
      const invalidReq = {};
      const mockRes = { set: jest.fn() };
      const mockNext = jest.fn();
      
      expect(() => {
        rateLimiter.addRateLimitHeaders(invalidReq, mockRes, mockNext);
      }).not.toThrow();
      
      expect(mockNext).toHaveBeenCalled();
    });

    test('should maintain middleware chain', () => {
      rateLimiter.addRateLimitHeaders(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('Rate Limiter Creation', () => {
    test('should create rate limiters without throwing', () => {
      expect(() => {
        require('../../middleware/rateLimiter');
      }).not.toThrow();
    });

    test('should handle Redis connection gracefully', () => {
      // Rate limiters should work even without Redis
      expect(rateLimiter.mainRateLimit).toBeDefined();
      expect(rateLimiter.burstRateLimit).toBeDefined();
    });
  });

  describe('Environment Handling', () => {
    test('should work in test environment', () => {
      process.env.NODE_ENV = 'test';
      
      expect(() => {
        rateLimiter.addRateLimitHeaders(req, res, next);
      }).not.toThrow();
    });

    test('should work without Redis URL', () => {
      delete process.env.REDIS_URL;
      
      expect(() => {
        require('../../middleware/rateLimiter');
      }).not.toThrow();
    });
  });
});
