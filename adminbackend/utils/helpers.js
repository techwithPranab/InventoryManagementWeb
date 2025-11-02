// Common utility functions for the admin backend

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

/**
 * Generate a random string of specified length
 * @param {number} length - Length of the random string
 * @returns {string} Random string
 */
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate a client code based on industry and random string
 * @param {string} industry - Industry type
 * @param {string} ownerName - Owner name
 * @returns {string} Generated client code
 */
const generateClientCode = (industry, ownerName) => {
  const industryCode = industry.substring(0, 3).toUpperCase();
  const nameCode = ownerName.replace(/\s+/g, '').substring(0, 3).toUpperCase();
  const randomNum = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `${industryCode}${nameCode}${randomNum}`;
};

/**
 * Generate a database name based on client code
 * @param {string} clientCode - Client code
 * @returns {string} Database name
 */
const generateDatabaseName = (clientCode) => {
  return `inventory_${clientCode.toLowerCase()}`;
};

/**
 * Format phone number to a standard format
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone number
 */
const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  return cleaned;
};

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} True if valid email
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Generate JWT token
 * @param {string} userId - User ID
 * @param {string} role - User role
 * @returns {string} JWT token
 */
const generateToken = (userId, role = 'client') => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

/**
 * Calculate pagination info
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {object} Pagination info
 */
const calculatePagination = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;
  
  return {
    current: page,
    total: totalPages,
    count: total,
    limit,
    hasNext: hasNextPage,
    hasPrev: hasPrevPage,
    next: hasNextPage ? page + 1 : null,
    prev: hasPrevPage ? page - 1 : null
  };
};

/**
 * Sanitize object for safe database operations
 * @param {object} obj - Object to sanitize
 * @returns {object} Sanitized object
 */
const sanitizeObject = (obj) => {
  const sanitized = {};
  Object.keys(obj).forEach(key => {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
      sanitized[key] = obj[key];
    }
  });
  return sanitized;
};

/**
 * Format success response
 * @param {string} message - Success message
 * @param {object} data - Response data
 * @returns {object} Formatted response
 */
const successResponse = (message, data = {}) => {
  return {
    success: true,
    message,
    data
  };
};

/**
 * Format error response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {object} errors - Validation errors
 * @returns {object} Formatted error response
 */
const errorResponse = (message, statusCode = 500, errors = []) => {
  return {
    success: false,
    message,
    statusCode,
    ...(errors.length > 0 && { errors })
  };
};

/**
 * Get time difference in human readable format
 * @param {Date} date - Date to compare
 * @returns {string} Human readable time difference
 */
const getTimeDifference = (date) => {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return diffMinutes > 0 ? `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago` : 'Just now';
  }
};

/**
 * Generate a secure password
 * @param {number} length - Password length
 * @returns {string} Generated password
 */
const generateSecurePassword = (length = 12) => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = lowercase + uppercase + numbers + symbols;
  let password = '';
  
  // Ensure at least one character from each set
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest with random characters
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result
 */
const validatePasswordStrength = (password) => {
  const minLength = 8;
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  const isValid = password.length >= minLength && hasLowercase && hasUppercase && hasNumbers;
  
  return {
    isValid,
    strength: isValid && hasSpecialChar ? 'strong' : isValid ? 'medium' : 'weak',
    requirements: {
      minLength: password.length >= minLength,
      hasLowercase,
      hasUppercase,
      hasNumbers,
      hasSpecialChar
    }
  };
};

module.exports = {
  generateRandomString,
  generateClientCode,
  generateDatabaseName,
  formatPhoneNumber,
  isValidEmail,
  generateToken,
  calculatePagination,
  sanitizeObject,
  successResponse,
  errorResponse,
  getTimeDifference,
  generateSecurePassword,
  validatePasswordStrength
};
