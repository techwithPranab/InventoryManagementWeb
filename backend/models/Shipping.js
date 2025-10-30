const mongoose = require('mongoose');

const shippingSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesOrder',
    required: true
  },
  carrier: {
    type: String,
    required: true
  },
  trackingNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  shippedDate: {
    type: Date
  },
  estimatedDelivery: {
    type: Date
  },
  deliveredDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'shipped', 'in_transit', 'delivered', 'cancelled'],
    default: 'pending'
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  notes: String,
  cost: {
    type: Number,
    min: 0,
    default: 0
  }
}, {
  timestamps: true
});

shippingSchema.index({ trackingNumber: 1 });

module.exports = mongoose.model('Shipping', shippingSchema);
