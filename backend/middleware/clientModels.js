const { getClientModels } = require('../utils/clientModels');

// Middleware to automatically set up client models in req object
const setupClientModels = (req, res, next) => {
  try {
    if (req.clientConnection) {
      req.models = getClientModels(req.clientConnection);
    }
    next();
  } catch (error) {
    console.error('Error setting up client models:', error);
    res.status(500).json({ message: 'Database connection error' });
  }
};

module.exports = { setupClientModels };
