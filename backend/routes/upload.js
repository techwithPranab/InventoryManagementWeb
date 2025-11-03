const express = require('express');
const { auth, authorize, requireClientCode } = require('../middleware/auth');
const { upload, deleteImage, extractPublicId } = require('../config/cloudinary');

const router = express.Router();

// @route   POST /api/upload/product-images
// @desc    Upload multiple product images to Cloudinary
// @access  Private (Admin/Manager/Staff)
router.post('/product-images', [
  auth,
  requireClientCode,
  authorize('admin', 'manager', 'staff'),
  upload.array('images', 10) // Allow up to 10 images
], async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No images uploaded' });
    }

    const uploadedImages = req.files.map(file => ({
      url: file.path,
      publicId: file.filename,
      originalName: file.originalname,
      size: file.size
    }));

    res.json({
      message: 'Images uploaded successfully',
      images: uploadedImages
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ 
      message: 'Error uploading images',
      error: error.message 
    });
  }
});

// @route   DELETE /api/upload/product-images/:publicId
// @desc    Delete a product image from Cloudinary
// @access  Private (Admin/Manager/Staff)
router.delete('/product-images/:publicId(*)', [
  auth,
  requireClientCode,
  authorize('admin', 'manager', 'staff')
], async (req, res) => {
  try {
    const publicId = req.params.publicId;
    
    if (!publicId) {
      return res.status(400).json({ message: 'Public ID is required' });
    }

    const result = await deleteImage(publicId);
    
    if (result.result === 'ok') {
      res.json({ message: 'Image deleted successfully' });
    } else {
      res.status(404).json({ message: 'Image not found' });
    }
  } catch (error) {
    console.error('Image deletion error:', error);
    res.status(500).json({ 
      message: 'Error deleting image',
      error: error.message 
    });
  }
});

// @route   POST /api/upload/product-images/bulk-delete
// @desc    Delete multiple product images from Cloudinary
// @access  Private (Admin/Manager/Staff)
router.post('/product-images/bulk-delete', [
  auth,
  requireClientCode,
  authorize('admin', 'manager', 'staff')
], async (req, res) => {
  try {
    const { publicIds } = req.body;
    
    if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
      return res.status(400).json({ message: 'Public IDs array is required' });
    }

    const deletePromises = publicIds.map(publicId => deleteImage(publicId));
    const results = await Promise.allSettled(deletePromises);
    
    const successful = results.filter(result => result.status === 'fulfilled' && result.value.result === 'ok').length;
    const failed = results.length - successful;

    res.json({ 
      message: `Deleted ${successful} images successfully`,
      successful,
      failed,
      total: results.length
    });
  } catch (error) {
    console.error('Bulk image deletion error:', error);
    res.status(500).json({ 
      message: 'Error deleting images',
      error: error.message 
    });
  }
});

module.exports = router;
