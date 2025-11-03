/**
 * Generate a URL-friendly slug from a string
 * @param {string} text - The text to convert to slug
 * @returns {string} - The generated slug
 */
const generateSlug = (text) => {
  if (!text) return '';
  
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')           // Replace spaces and underscores with hyphens
    .replace(/[^\w\-]+/g, '')          // Remove all non-word chars except hyphens
    .replace(/\-\-+/g, '-')            // Replace multiple hyphens with single hyphen
    .replace(/^-+/, '')                // Trim hyphens from start of text
    .replace(/-+$/, '');               // Trim hyphens from end of text
};

/**
 * Generate a unique product slug
 * @param {string} productName - The product name
 * @param {string} sku - The product SKU (optional)
 * @returns {string} - The generated unique slug
 */
const generateProductSlug = (productName, sku = '') => {
  const nameSlug = generateSlug(productName);
  const skuSlug = sku ? generateSlug(sku) : '';
  
  if (nameSlug && skuSlug) {
    return `${nameSlug}-${skuSlug}`;
  }
  
  return nameSlug || skuSlug || `product-${Date.now()}`;
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} cloudinaryUrl - The Cloudinary URL
 * @returns {string|null} - The extracted public ID or null
 */
const extractPublicIdFromUrl = (cloudinaryUrl) => {
  try {
    if (!cloudinaryUrl) return null;
    
    // Handle different Cloudinary URL formats
    const patterns = [
      /\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/,  // Standard format
      /\/image\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/,  // Image upload format
      /\/upload\/(?:[^/]+\/)*(.+?)(?:\.[^.]+)?$/   // With transformations
    ];
    
    for (const pattern of patterns) {
      const match = cloudinaryUrl.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting public ID from URL:', error);
    return null;
  }
};

/**
 * Validate image file type
 * @param {string} mimetype - The file mimetype
 * @returns {boolean} - Whether the file type is valid
 */
const isValidImageType = (mimetype) => {
  const validTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif'
  ];
  
  return validTypes.includes(mimetype.toLowerCase());
};

/**
 * Format file size to human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Generate image transformation options for different use cases
 * @param {string} type - The type of transformation (thumbnail, medium, large, etc.)
 * @returns {object} - Cloudinary transformation options
 */
const getImageTransformationOptions = (type = 'medium') => {
  const transformations = {
    thumbnail: {
      width: 150,
      height: 150,
      crop: 'fill',
      quality: 'auto',
      fetch_format: 'auto'
    },
    small: {
      width: 300,
      height: 300,
      crop: 'limit',
      quality: 'auto',
      fetch_format: 'auto'
    },
    medium: {
      width: 600,
      height: 600,
      crop: 'limit',
      quality: 'auto',
      fetch_format: 'auto'
    },
    large: {
      width: 1200,
      height: 1200,
      crop: 'limit',
      quality: 'auto',
      fetch_format: 'auto'
    },
    original: {
      quality: 'auto',
      fetch_format: 'auto'
    }
  };
  
  return transformations[type] || transformations.medium;
};

module.exports = {
  generateSlug,
  generateProductSlug,
  extractPublicIdFromUrl,
  isValidImageType,
  formatFileSize,
  getImageTransformationOptions
};
