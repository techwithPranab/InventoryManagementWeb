const mongoose = require('mongoose');

const inventoryTransferSchema = new mongoose.Schema({
  transferNumber: {
    type: String,
    required: true,
    unique: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  fromWarehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  toWarehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  reason: {
    type: String,
    enum: ['restock', 'relocation', 'demand', 'maintenance', 'other'],
    required: true
  },
  notes: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_transit', 'completed', 'cancelled'],
    default: 'pending'
  },
  initiatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  transferDate: {
    type: Date,
    default: Date.now
  },
  completedDate: {
    type: Date
  },
  trackingInfo: {
    carrier: String,
    trackingNumber: String,
    estimatedDelivery: Date
  }
}, {
  timestamps: true
});


// Indexes for better performance
inventoryTransferSchema.index({ transferNumber: 1 });
inventoryTransferSchema.index({ product: 1 });
inventoryTransferSchema.index({ fromWarehouse: 1 });
inventoryTransferSchema.index({ toWarehouse: 1 });
inventoryTransferSchema.index({ status: 1 });
inventoryTransferSchema.index({ transferDate: -1 });

const InventoryTransfer = mongoose.model('InventoryTransfer', inventoryTransferSchema);

module.exports = InventoryTransfer;
module.exports.schema = inventoryTransferSchema;
