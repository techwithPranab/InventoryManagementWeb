const request = require('supertest');
const app = require('../server');
const path = require('path');
const fs = require('fs');

// Test configuration
const testConfig = {
  // You'll need to set these with real values for testing
  clientCode: 'test-client',
  authToken: 'your-test-jwt-token',
  categoryId: 'your-test-category-id'
};

// Create a test image file if it doesn't exist
const createTestImage = () => {
  const testImagePath = path.join(__dirname, 'test-image.png');
  
  if (!fs.existsSync(testImagePath)) {
    // Create a simple 1x1 PNG image for testing
    const pngData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
      0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00,
      0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01,
      0xE2, 0x21, 0xBC, 0x33, 0x00, 0x00, 0x00, 0x00,
      0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    fs.writeFileSync(testImagePath, pngData);
  }
  
  return testImagePath;
};

describe('Cloudinary Integration Tests', () => {
  let productId;
  let imageId;
  const testImagePath = createTestImage();

  beforeAll(() => {
    // Ensure test image exists
    if (!fs.existsSync(testImagePath)) {
      throw new Error('Test image could not be created');
    }
  });

  afterAll(() => {
    // Clean up test image
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
  });

  describe('Product Creation with Images', () => {
    it('should create a product with multiple images', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${testConfig.authToken}`)
        .set('x-client-code', testConfig.clientCode)
        .field('name', 'Test Product with Images')
        .field('sku', 'TEST001')
        .field('category', testConfig.categoryId)
        .field('costPrice', '100')
        .field('sellingPrice', '150')
        .field('unit', 'piece')
        .attach('productImages', testImagePath)
        .attach('productImages', testImagePath)
        .expect(201);

      expect(response.body.message).toBe('Product created successfully');
      expect(response.body.product).toBeDefined();
      expect(response.body.product.images).toHaveLength(2);
      expect(response.body.product.images[0]).toHaveProperty('url');
      expect(response.body.product.images[0]).toHaveProperty('publicId');
      expect(response.body.product.images[0]).toHaveProperty('responsiveUrls');
      expect(response.body.product.images[0].responsiveUrls).toHaveProperty('thumbnail');
      expect(response.body.product.images[0].responsiveUrls).toHaveProperty('small');
      expect(response.body.product.images[0].responsiveUrls).toHaveProperty('medium');
      expect(response.body.product.images[0].responsiveUrls).toHaveProperty('large');
      expect(response.body.product.images[0].responsiveUrls).toHaveProperty('original');

      productId = response.body.product._id;
      imageId = response.body.product.images[0]._id;
    });
  });

  describe('Image Management', () => {
    it('should add images to existing product', async () => {
      const response = await request(app)
        .post(`/api/products/${productId}/images`)
        .set('Authorization', `Bearer ${testConfig.authToken}`)
        .set('x-client-code', testConfig.clientCode)
        .attach('productImages', testImagePath)
        .expect(200);

      expect(response.body.message).toBe('Images added successfully');
      expect(response.body.images).toHaveLength(1);
      expect(response.body.totalImages).toBe(3);
    });

    it('should remove specific image from product', async () => {
      const response = await request(app)
        .delete(`/api/products/${productId}/images/${imageId}`)
        .set('Authorization', `Bearer ${testConfig.authToken}`)
        .set('x-client-code', testConfig.clientCode)
        .expect(200);

      expect(response.body.message).toBe('Image removed successfully');
      expect(response.body.remainingImages).toBe(2);
    });

    it('should reorder product images', async () => {
      // First get current product to get image IDs
      const getResponse = await request(app)
        .get(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${testConfig.authToken}`)
        .set('x-client-code', testConfig.clientCode)
        .expect(200);

      const imageIds = getResponse.body.images.map(img => img._id);
      const reversedOrder = [...imageIds].reverse();

      const response = await request(app)
        .put(`/api/products/${productId}/images/reorder`)
        .set('Authorization', `Bearer ${testConfig.authToken}`)
        .set('x-client-code', testConfig.clientCode)
        .send({ imageOrder: reversedOrder })
        .expect(200);

      expect(response.body.message).toBe('Images reordered successfully');
      expect(response.body.images[0]._id).toBe(reversedOrder[0]);
    });
  });

  describe('Standalone Upload', () => {
    it('should upload images without product association', async () => {
      const response = await request(app)
        .post('/api/upload/product-images')
        .set('Authorization', `Bearer ${testConfig.authToken}`)
        .set('x-client-code', testConfig.clientCode)
        .field('productSlug', 'test-standalone-upload')
        .attach('images', testImagePath)
        .attach('images', testImagePath)
        .expect(200);

      expect(response.body.message).toBe('Images uploaded successfully');
      expect(response.body.images).toHaveLength(2);
      expect(response.body.images[0]).toHaveProperty('url');
      expect(response.body.images[0]).toHaveProperty('publicId');
    });
  });

  describe('Error Handling', () => {
    it('should reject non-image files', async () => {
      // Create a text file
      const textFilePath = path.join(__dirname, 'test.txt');
      fs.writeFileSync(textFilePath, 'This is not an image');

      const response = await request(app)
        .post('/api/upload/product-images')
        .set('Authorization', `Bearer ${testConfig.authToken}`)
        .set('x-client-code', testConfig.clientCode)
        .attach('images', textFilePath)
        .expect(500);

      expect(response.body.message).toBe('Error uploading images');

      // Clean up
      fs.unlinkSync(textFilePath);
    });

    it('should handle missing authentication', async () => {
      const response = await request(app)
        .post('/api/upload/product-images')
        .set('x-client-code', testConfig.clientCode)
        .attach('images', testImagePath)
        .expect(401);

      expect(response.body.message).toBe('No token, authorization denied');
    });

    it('should handle missing client code', async () => {
      const response = await request(app)
        .post('/api/upload/product-images')
        .set('Authorization', `Bearer ${testConfig.authToken}`)
        .attach('images', testImagePath)
        .expect(400);

      expect(response.body.message).toBe('Client code is required');
    });
  });

  describe('Product Deletion with Image Cleanup', () => {
    it('should delete product and cleanup images', async () => {
      const response = await request(app)
        .delete(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${testConfig.authToken}`)
        .set('x-client-code', testConfig.clientCode)
        .expect(200);

      expect(response.body.message).toBe('Product deleted successfully');
    });
  });
});

// Manual test functions for development
const manualTests = {
  async testImageUpload() {
    console.log('Testing image upload...');
    
    try {
      const testImagePath = createTestImage();
      
      const FormData = require('form-data');
      const form = new FormData();
      form.append('images', fs.createReadStream(testImagePath));
      form.append('productSlug', 'manual-test-product');
      
      const response = await fetch('http://localhost:5000/api/upload/product-images', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testConfig.authToken}`,
          'x-client-code': testConfig.clientCode,
          ...form.getHeaders()
        },
        body: form
      });
      
      const result = await response.json();
      console.log('Upload result:', result);
      
      // Clean up
      fs.unlinkSync(testImagePath);
    } catch (error) {
      console.error('Manual test failed:', error);
    }
  },

  async testProductCreation() {
    console.log('Testing product creation with images...');
    
    try {
      const testImagePath = createTestImage();
      
      const FormData = require('form-data');
      const form = new FormData();
      form.append('name', 'Manual Test Product');
      form.append('sku', 'MANUAL001');
      form.append('category', testConfig.categoryId);
      form.append('costPrice', '50');
      form.append('sellingPrice', '75');
      form.append('unit', 'piece');
      form.append('productImages', fs.createReadStream(testImagePath));
      
      const response = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testConfig.authToken}`,
          'x-client-code': testConfig.clientCode,
          ...form.getHeaders()
        },
        body: form
      });
      
      const result = await response.json();
      console.log('Product creation result:', result);
      
      // Clean up
      fs.unlinkSync(testImagePath);
    } catch (error) {
      console.error('Manual test failed:', error);
    }
  }
};

module.exports = {
  testConfig,
  manualTests
};
