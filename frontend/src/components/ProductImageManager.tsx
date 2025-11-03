import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CardMedia,
  CircularProgress,
  Grid,
  IconButton,
  Typography,
  Dialog,
  DialogContent,
  Snackbar,
  Alert,
  Chip
} from '@mui/material';
import {
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  ZoomIn as ZoomIcon,
  ArrowUpward as MoveUpIcon,
  ArrowDownward as MoveDownIcon
} from '@mui/icons-material';

interface ProductImage {
  _id: string;
  url: string;
  publicId: string;
  originalName: string;
  size: number;
  responsiveUrls: {
    thumbnail: string;
    small: string;
    medium: string;
    large: string;
    original: string;
  };
  uploadedAt: string;
}

interface ProductImageManagerProps {
  productSlug: string;
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

const ProductImageManager: React.FC<ProductImageManagerProps> = ({
  productSlug,
  images,
  onImagesChange,
  maxImages = 10,
  disabled = false
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Validate file count
    if (images.length + files.length > maxImages) {
      showSnackbar(`Maximum ${maxImages} images allowed`, 'error');
      return;
    }

    // Validate file types and sizes
    const validFiles = Array.from(files).filter(file => {
      if (!file.type.startsWith('image/')) {
        showSnackbar(`${file.name} is not an image file`, 'error');
        return false;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB
        showSnackbar(`${file.name} is larger than 5MB`, 'error');
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);

    try {
      const formData = new FormData();
      validFiles.forEach(file => {
        formData.append('productImages', file);
      });

      const response = await fetch(`${API_BASE_URL}/products/${productSlug}/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'x-client-code': localStorage.getItem('clientCode') || 'default'
        },
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        onImagesChange([...images, ...result.images]);
        showSnackbar('Images uploaded successfully', 'success');
      } else {
        showSnackbar(result.message || 'Upload failed', 'error');
      }
    } catch (error) {
      showSnackbar('Upload failed. Please try again.', 'error');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImageDelete = async (imageId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${productSlug}/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'x-client-code': localStorage.getItem('clientCode') || 'default'
        }
      });

      const result = await response.json();

      if (response.ok) {
        onImagesChange(images.filter(img => img._id !== imageId));
        showSnackbar('Image deleted successfully', 'success');
      } else {
        showSnackbar(result.message || 'Delete failed', 'error');
      }
    } catch (error) {
      showSnackbar('Delete failed. Please try again.', 'error');
    }
  };

  const moveImage = async (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return;

    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);

    // Optimistically update UI
    onImagesChange(newImages);

    try {
      const imageOrder = newImages.map(img => img._id);
      
      const response = await fetch(`${API_BASE_URL}/products/${productSlug}/images/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'x-client-code': localStorage.getItem('clientCode') || 'default'
        },
        body: JSON.stringify({ imageOrder })
      });

      const result = await response.json();

      if (!response.ok) {
        // Revert on error
        onImagesChange(images);
        showSnackbar(result.message || 'Reorder failed', 'error');
      }
    } catch (error) {
      // Revert on error
      onImagesChange(images);
      showSnackbar('Reorder failed. Please try again.', 'error');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box>
      {/* Upload Button */}
      <Box mb={2}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
          disabled={disabled || uploading}
        />
        <Button
          variant="outlined"
          startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading || images.length >= maxImages}
        >
          {uploading ? 'Uploading...' : 'Upload Images'}
        </Button>
        <Typography variant="caption" sx={{ ml: 2, color: 'text.secondary' }}>
          {images.length}/{maxImages} images • Max 5MB per image
        </Typography>
      </Box>

      {/* Image Grid */}
      {images.length > 0 && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(3, 1fr)',
              md: 'repeat(4, 1fr)',
              lg: 'repeat(6, 1fr)'
            },
            gap: 2
          }}
        >
          {images.map((image, index) => (
            <Box key={image._id}>
              <Card sx={{ position: 'relative' }}>
                <CardMedia
                  component="img"
                  height="150"
                  image={image.responsiveUrls.small}
                  alt={image.originalName}
                  sx={{ cursor: 'pointer' }}
                  onClick={() => setPreviewImage(image.responsiveUrls.large)}
                />
                
                {/* Action Buttons */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                  }}
                >
                  <IconButton
                    size="small"
                    sx={{
                      bgcolor: 'background.paper',
                      '&:hover': { bgcolor: 'background.paper' },
                    }}
                    onClick={() => setPreviewImage(image.responsiveUrls.large)}
                  >
                    <ZoomIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    sx={{
                      bgcolor: 'error.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'error.dark' },
                    }}
                    onClick={() => handleImageDelete(image._id)}
                    disabled={disabled}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>

                {/* Move Buttons */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                  }}
                >
                  <IconButton
                    size="small"
                    sx={{
                      bgcolor: 'background.paper',
                      '&:hover': { bgcolor: 'background.paper' },
                    }}
                    onClick={() => moveImage(index, index - 1)}
                    disabled={disabled || index === 0}
                  >
                    <MoveUpIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    sx={{
                      bgcolor: 'background.paper',
                      '&:hover': { bgcolor: 'background.paper' },
                    }}
                    onClick={() => moveImage(index, index + 1)}
                    disabled={disabled || index === images.length - 1}
                  >
                    <MoveDownIcon fontSize="small" />
                  </IconButton>
                </Box>

                {/* Image Info */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    bgcolor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    p: 1,
                  }}
                >
                  <Typography variant="caption" noWrap>
                    {image.originalName}
                  </Typography>
                  <Typography variant="caption" display="block">
                    {formatFileSize(image.size)}
                  </Typography>
                </Box>

                {/* Primary Image Indicator */}
                {index === 0 && (
                  <Chip
                    label="Primary"
                    size="small"
                    color="primary"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: '50%',
                      transform: 'translateX(-50%)',
                    }}
                  />
                )}
              </Card>
            </Box>
          ))}
        </Box>
      )}

      {/* Empty State */}
      {images.length === 0 && (
        <Box
          sx={{
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 1,
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography variant="h6" color="text.secondary">
            No images uploaded
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Click to upload or drag and drop images here
          </Typography>
        </Box>
      )}

      {/* Image Preview Dialog */}
      <Dialog
        open={!!previewImage}
        onClose={() => setPreviewImage(null)}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent sx={{ p: 0 }}>
          {previewImage && (
            <img
              src={previewImage}
              alt="Preview"
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProductImageManager;
