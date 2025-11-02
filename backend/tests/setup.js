const mongoose = require('mongoose');

beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/inventory_test';
  
  // Suppress console.log in tests unless explicitly needed
  if (!process.env.VERBOSE_TESTS) {
    console.log = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
  }
});

afterAll(async () => {
  // Clean up database connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  
  // Close all mongoose connections
  await mongoose.disconnect();
});

// Global test utilities
global.generateObjectId = () => new mongoose.Types.ObjectId();

global.createMockRequest = (overrides = {}) => ({
  headers: {},
  body: {},
  params: {},
  query: {},
  ip: '127.0.0.1',
  originalUrl: '/api/v1/test',
  client: {
    code: 'TEST_CLIENT',
    databaseName: 'test_db',
    subscriptionPlan: 'Professional',
    setupId: 'test_setup_id'
  },
  ...overrides
});

global.createMockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    header: jest.fn().mockReturnThis()
  };
  return res;
};

global.createMockNext = () => jest.fn();

// Mock console methods for cleaner test output
if (!process.env.VERBOSE_TESTS) {
  global.console = {
    ...console,
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn() // Keep error for debugging
  };
}

// Set reasonable timeouts for async operations
jest.setTimeout(30000);

// Mock Redis for testing (if not running actual Redis)
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    setex: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    ttl: jest.fn().mockResolvedValue(3600),
    disconnect: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    once: jest.fn()
  }));
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
