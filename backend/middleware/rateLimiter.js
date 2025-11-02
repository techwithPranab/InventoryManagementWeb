const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');

/**
 * Rate Limiting Middleware for REST API
 * 
 * This middleware implements rate limiting to prevent API abuse and ensure
 * fair usage across different clients. Rate limits are applied per PAT token
 * with different limits based on subscription plans.
 */

// Create Redis client for rate limiting storage (optional)
let redisClient;
try {
  if (process.env.REDIS_URL) {
    redisClient = new Redis(process.env.REDIS_URL);
    console.log('Connected to Redis for rate limiting');
  }
} catch (error) {
  console.warn('Redis not available, using memory store for rate limiting:', error.message);
}

/**
 * Custom key generator that uses PAT token with IPv6 support
 */
const keyGenerator = (req, res) => {
  // Use PAT token as the key if available, otherwise fall back to IP with IPv6 support
  if (req.patToken?.token) {
    return `rate_limit:${req.patToken.token}`;
  }
  
  // Use the built-in IPv6-safe key generator for IP-based rate limiting
  const { ipKeyGenerator } = rateLimit;
  return `rate_limit:ip:${ipKeyGenerator(req)}`;
};

/**
 * Custom handler for rate limit exceeded
 */
const rateLimitHandler = (req, res) => {
  res.status(429).json({
    success: false,
    message: 'Too many requests',
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      details: 'API rate limit exceeded. Please wait before making more requests.'
    },
    retryAfter: Math.round(req.rateLimit.resetTime / 1000) || 3600
  });
};

/**
 * Skip rate limiting for certain conditions
 */
const skipFunction = (req) => {
  // Skip rate limiting for health checks and info endpoints
  if (req.path === '/api/v1/health' || req.path === '/api/v1/info') {
    return true;
  }
  
  // Skip for local development if needed
  if (process.env.NODE_ENV === 'development' && req.ip === '127.0.0.1') {
    return false; // Set to true to skip in development
  }
  
  return false;
};

/**
 * Dynamic rate limit based on subscription plan
 */
const dynamicRateLimit = (req) => {
  const subscriptionPlan = req.client?.subscriptionPlan || 'Free';
  
  // Rate limits per hour based on subscription plan
  const limits = {
    'Free': { requests: 100, windowMs: 60 * 60 * 1000 }, // 100 requests per hour
    'Starter': { requests: 500, windowMs: 60 * 60 * 1000 }, // 500 requests per hour
    'Professional': { requests: 2000, windowMs: 60 * 60 * 1000 }, // 2000 requests per hour
    'Enterprise': { requests: 10000, windowMs: 60 * 60 * 1000 } // 10000 requests per hour
  };
  
  return limits[subscriptionPlan] || limits['Free'];
};

/**
 * Main rate limiting middleware
 */
const createRateLimiter = () => {
  const store = redisClient ? new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }) : undefined;

  return rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: (req) => {
      const limit = dynamicRateLimit(req);
      return limit.requests;
    },
    message: rateLimitHandler,
    keyGenerator,
    skip: skipFunction,
    store,
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    
    // Custom handler for when limit is reached
    handler: (req, res) => {
      console.warn(`Rate limit reached for client: ${req.client?.clientCode || 'unknown'}, token: ${req.patToken?.token?.substr(0, 8)}...`);
      rateLimitHandler(req, res);
    }
  });
};

/**
 * Burst rate limiting middleware (shorter window, higher frequency)
 * Protects against burst attacks
 */
const createBurstLimiter = () => {
  const store = redisClient ? new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
    prefix: 'burst_limit:'
  }) : undefined;

  return rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    limit: (req) => {
      const subscriptionPlan = req.client?.subscriptionPlan || 'Free';
      
      // Burst limits per minute
      const burstLimits = {
        'Free': 20,
        'Starter': 50,
        'Professional': 100,
        'Enterprise': 200
      };
      
      return burstLimits[subscriptionPlan] || burstLimits['Free'];
    },
    message: (req, res) => {
      res.status(429).json({
        success: false,
        message: 'Too many requests in burst',
        error: {
          code: 'BURST_LIMIT_EXCEEDED',
          details: 'Too many requests in a short period. Please slow down your request rate.'
        },
        retryAfter: 60
      });
    },
    keyGenerator: (req) => `burst:${keyGenerator(req)}`,
    skip: skipFunction,
    store,
    standardHeaders: false, // Don't override main rate limiter headers
    legacyHeaders: false
  });
};

/**
 * Create different rate limiters for different endpoint types
 */
const createEndpointSpecificLimiter = (endpointType) => {
  const configs = {
    // More restrictive for write operations
    write: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxMultiplier: 0.2 // 20% of main limit
    },
    // Standard for read operations
    read: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxMultiplier: 1.0 // 100% of main limit
    },
    // Most restrictive for analytics/heavy operations
    analytics: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxMultiplier: 0.1 // 10% of main limit
    }
  };

  const config = configs[endpointType] || configs.read;
  
  const store = redisClient ? new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
    prefix: `${endpointType}_limit:`
  }) : undefined;

  return rateLimit({
    windowMs: config.windowMs,
    limit: (req) => {
      const baseLimit = dynamicRateLimit(req);
      return Math.floor(baseLimit.requests * config.maxMultiplier);
    },
    message: (req, res) => {
      res.status(429).json({
        success: false,
        message: `Too many ${endpointType} requests`,
        error: {
          code: 'ENDPOINT_RATE_LIMIT_EXCEEDED',
          details: `Rate limit exceeded for ${endpointType} operations. Please reduce request frequency.`
        },
        retryAfter: Math.round(config.windowMs / 1000)
      });
    },
    keyGenerator: (req) => `${endpointType}:${keyGenerator(req)}`,
    skip: skipFunction,
    store,
    standardHeaders: false,
    legacyHeaders: false
  });
};

/**
 * Middleware to add rate limit info to response headers
 */
const addRateLimitHeaders = (req, res, next) => {
  if (req.client && req.patToken) {
    const limit = dynamicRateLimit(req);
    res.set({
      'X-RateLimit-Limit': limit.requests,
      'X-RateLimit-Window': Math.round(limit.windowMs / 1000),
      'X-RateLimit-Plan': req.client.subscriptionPlan || 'Free'
    });
  }
  next();
};

module.exports = {
  mainRateLimit: createRateLimiter(),
  burstRateLimit: createBurstLimiter(),
  readRateLimit: createEndpointSpecificLimiter('read'),
  writeRateLimit: createEndpointSpecificLimiter('write'),
  analyticsRateLimit: createEndpointSpecificLimiter('analytics'),
  addRateLimitHeaders
};
