const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const { generateProductSlug, isValidImageType } = require('../utils/imageUtils');

// Load environment variables
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Verify Cloudinary configuration
console.log('Cloudinary Config Check:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Missing',
  api_key: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Missing',
  api_secret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Missing'
});

// Test Cloudinary connection and verify instance
const initializeCloudinary = async () => {
  try {
    await cloudinary.api.ping();
    console.log('Cloudinary connection successful');
    console.log('Cloudinary instance check:', {
      hasUploader: !!cloudinary.uploader,
      hasUploadStream: !!cloudinary.uploader.upload_stream,
      hasApi: !!cloudinary.api,
      configCloudName: cloudinary.config().cloud_name
    });
  } catch (err) {
    console.error('Cloudinary connection failed:', err.message);
  }
};

initializeCloudinary();

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    console.log('=== Multer Storage Params ===');
    console.log('File info:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    // Verify cloudinary instance
    console.log('Cloudinary instance check:', {
      hasUploader: !!cloudinary.uploader,
      hasApi: !!cloudinary.api,
      config: cloudinary.config()
    });
    
    // Get client code from request headers or middleware
    const clientCode = req.clientCode || req.headers['x-client-code'] || 'default';
    
    // For image uploads, use a structured folder hierarchy
    // inventory_management/clientCode/products/productSlug
    const productSlug = req.params?.slug || req.body?.productSlug || req.params?.id || 'unknown';
    const folder = `inventory_management/${clientCode}/products/${productSlug}`;
    
    console.log('Cloudinary upload params:', {
      clientCode,
      productSlug,
      folder,
      endpoint: req.originalUrl
    });
    
    // Ensure the folder exists or will be created
    try {
      await ensureFolderExists(folder);
    } catch (error) {
      console.warn('Could not verify folder existence, but upload will proceed:', error.message);
    }
    
    const params = {
      folder: folder,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      public_id: `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1E9)}`,
    };
    
    console.log('Returning storage params:', params);
    return params;
  },
});

// Configure multer with Cloudinary storage
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10 // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    console.log('=== Multer File Filter ===');
    console.log('File:', file.originalname, 'Type:', file.mimetype);
    
    // Check file type
    if (isValidImageType(file.mimetype)) {
      console.log('File type valid, accepting file');
      cb(null, true);
    } else {
      console.log('File type invalid, rejecting file');
      cb(new Error('Only image files (JPEG, PNG, WebP, GIF) are allowed!'), false);
    }
  }
});

// Helper function to ensure folder exists in Cloudinary
const ensureFolderExists = async (folderPath) => {
  try {
    console.log(`Checking if folder exists: ${folderPath}`);
    
    // Try to list resources in the folder to check if it exists
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: folderPath,
      max_results: 1
    });
    
    console.log(`Folder ${folderPath} exists or is accessible`);
    return true;
  } catch (error) {
    if (error.http_code === 404) {
      console.log(`Folder ${folderPath} does not exist, will be created on first upload`);
      return false;
    } else {
      console.warn(`Could not verify folder ${folderPath}:`, error.message);
      return false;
    }
  }
};

// Helper functions
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};

const deleteFolder = async (folderPath) => {
  try {
    // Delete all resources in the folder
    const result = await cloudinary.api.delete_resources_by_prefix(folderPath);
    
    // Delete the folder itself
    await cloudinary.api.delete_folder(folderPath);
    
    return result;
  } catch (error) {
    console.error('Error deleting folder from Cloudinary:', error);
    throw error;
  }
};

// Extract public ID from Cloudinary URL
const extractPublicId = (cloudinaryUrl) => {
  try {
    const matches = cloudinaryUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
    return matches ? matches[1] : null;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
};

// Generate optimized URL with transformations
const getOptimizedUrl = (publicId, options = {}) => {
  const {
    width = 400,
    height = 400,
    crop = 'fill',
    quality = 'auto',
    format = 'auto'
  } = options;

  return cloudinary.url(publicId, {
    width,
    height,
    crop,
    quality,
    fetch_format: format
  });
};

// Generate multiple sizes for responsive images
const generateResponsiveUrls = (publicId) => {
  try {
    // Check if Cloudinary is configured
    if (!cloudinary.config().cloud_name) {
      console.warn('Cloudinary not configured, returning basic URLs');
      const baseUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${publicId}`;
      return {
        thumbnail: baseUrl,
        small: baseUrl,
        medium: baseUrl,
        large: baseUrl,
        original: baseUrl
      };
    }
    
    return {
      thumbnail: cloudinary.url(publicId, { width: 150, height: 150, crop: 'limit', quality: 'auto' }),
      small: cloudinary.url(publicId, { width: 300, height: 300, crop: 'limit', quality: 'auto' }),
      medium: cloudinary.url(publicId, { width: 600, height: 600, crop: 'limit', quality: 'auto' }),
      large: cloudinary.url(publicId, { width: 1200, height: 1200, crop: 'limit', quality: 'auto' }),
      original: cloudinary.url(publicId, { quality: 'auto', fetch_format: 'auto' })
    };
  } catch (error) {
    console.error('Error generating responsive URLs:', error);
    // Fallback to basic URLs
    const baseUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${publicId}`;
    return {
      thumbnail: baseUrl,
      small: baseUrl,
      medium: baseUrl,
      large: baseUrl,
      original: baseUrl
    };
  }
};

module.exports = {
  cloudinary,
  upload,
  deleteImage,
  deleteFolder,
  extractPublicId,
  getOptimizedUrl,
  generateResponsiveUrls
};
