const jwt = require('jsonwebtoken');

// Authentication middleware specifically for admin operations from Admin Web
// This middleware trusts that the Admin Web has already validated the admin user
const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify the JWT token (should be signed with the same secret as Admin Web)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // For admin operations, we trust the Admin Web token validation
    // Admin Web uses 'userId' field, not 'id'
    if (!decoded.userId || !decoded.role) {
      return res.status(401).json({ message: 'Invalid token format' });
    }

    // Check if the role is admin (redundant check for security)
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required' });
    }

    // Set user info from token for use in routes
    req.user = {
      id: decoded.userId,  // Map userId to id for consistency
      role: decoded.role,
      email: decoded.email
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    console.error('Admin auth error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { adminAuth };
