const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  reservedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  location: {
    aisle: { type: String, trim: true },
    shelf: { type: String, trim: true },
    bin: { type: String, trim: true }
  },
  lastRestocked: {
    type: Date
  },
  lastSold: {
    type: Date
  }
}, {
  timestamps: true
});

// Virtual for available quantity
inventorySchema.virtual('availableQuantity').get(function() {
  return this.quantity - this.reservedQuantity;
});

// Compound index to ensure unique product-warehouse combination
inventorySchema.index({ product: 1, warehouse: 1 }, { unique: true });
inventorySchema.index({ warehouse: 1 });
inventorySchema.index({ quantity: 1 });

module.exports = mongoose.model('Inventory', inventorySchema);
