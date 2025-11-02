const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { getClientModels } = require('../utils/clientModels');

// Track client connections
const clientConnections = new Map();

// Create a dynamic connection to client database
const getClientConnection = (clientCode) => {
  if (clientConnections.has(clientCode)) {
    return clientConnections.get(clientCode);
  }

  const dbName = `inventory_management_${clientCode}`;
  const connectionString = process.env.MONGODB_URI.replace(/\/[^\/]*$/, `/${dbName}`);
  
  const connection = mongoose.createConnection(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Store the connection
  clientConnections.set(clientCode, connection);

  // Clean up when connection closes
  connection.on('close', () => {
    clientConnections.delete(clientCode);
  });

  return connection;
};

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const clientCode = req.header('X-Client-Code');
    console.log('Auth middleware - Client Code:', clientCode);
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify JWT token (from AdminWeb)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Set user info from token
    req.user = {
      id: decoded.userId || decoded.id,
      email: decoded.email,
      role: decoded.role
    };

    // If client code is provided, set up client database connection
    if (clientCode) {
      try {
        const clientConnection = getClientConnection(clientCode);
        req.clientConnection = clientConnection;
        req.clientCode = clientCode;
        
        // Wait for connection to be ready
        await new Promise((resolve, reject) => {
          if (clientConnection.readyState === 1) {
            resolve();
          } else {
            clientConnection.once('open', resolve);
            clientConnection.once('error', reject);
            setTimeout(() => reject(new Error('Database connection timeout')), 5000);
          }
        });

        // Automatically setup client models
        req.models = getClientModels(clientConnection);
      } catch (dbError) {
        return res.status(400).json({ 
          message: 'Invalid client code or database connection failed' 
        });
      }
    }

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Access denied' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions' 
      });
    }

    next();
  };
};

// Middleware to require client code
const requireClientCode = (req, res, next) => {
  if (!req.clientCode) {
    return res.status(400).json({ 
      message: 'Client code is required for this operation' 
    });
  }
  next();
};

module.exports = { auth, authorize, requireClientCode, getClientConnection };
