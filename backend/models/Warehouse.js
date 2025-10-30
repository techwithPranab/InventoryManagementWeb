const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Warehouse name is required'],
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Warehouse code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    country: { type: String, trim: true }
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  capacity: {
    type: Number,
    default: 0
  },
  currentOccupancy: {
    type: Number,
    default: 0
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

// Calculate occupancy percentage
warehouseSchema.virtual('occupancyPercentage').get(function() {
  if (this.capacity === 0) return 0;
  return Math.round((this.currentOccupancy / this.capacity) * 100);
});

// Index for better search performance
warehouseSchema.index({ name: 1 });
warehouseSchema.index({ code: 1 });
warehouseSchema.index({ isActive: 1 });

module.exports = mongoose.model('Warehouse', warehouseSchema);
