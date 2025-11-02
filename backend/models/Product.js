const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  brand: {
    type: String,
    trim: true
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    enum: ['piece', 'kg', 'liter', 'meter', 'box', 'dozen'],
    default: 'piece'
  },
  costPrice: {
    type: Number,
    required: [true, 'Cost price is required'],
    min: 0
  },
  sellingPrice: {
    type: Number,
    required: [true, 'Selling price is required'],
    min: 0
  },
  minStockLevel: {
    type: Number,
    default: 10,
    min: 0
  },
  maxStockLevel: {
    type: Number,
    default: 1000,
    min: 0
  },
  reorderLevel: {
    type: Number,
    default: 20,
    min: 0
  },
  images: [{
    type: String
  }],
  barcode: {
    type: String,
    unique: true,
    sparse: true
  },
  weight: {
    type: Number,
    min: 0
  },
  dimensions: {
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Virtual for profit margin
productSchema.virtual('profitMargin').get(function() {
  if (this.costPrice === 0) return 0;
  return Math.round(((this.sellingPrice - this.costPrice) / this.costPrice) * 100);
});

// Index for better search performance
productSchema.index({ name: 1 });
productSchema.index({ sku: 1 });
productSchema.index({ category: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ name: 'text', description: 'text', brand: 'text' });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
module.exports.schema = productSchema;
