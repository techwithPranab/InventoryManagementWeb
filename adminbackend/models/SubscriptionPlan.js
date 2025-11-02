const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Plan name is required'],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    required: [true, 'Plan description is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'INR']
  },
  billingCycle: {
    type: String,
    required: [true, 'Billing cycle is required'],
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },
  features: [{
    type: String,
    trim: true
  }],
  maxProducts: {
    type: Number,
    required: [true, 'Max products limit is required'],
    min: 0
  },
  maxWarehouses: {
    type: Number,
    required: [true, 'Max warehouses limit is required'],
    min: 0
  },
  maxUsers: {
    type: Number,
    required: [true, 'Max users limit is required'],
    min: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
  stripePriceId: {
    type: String,
    sparse: true
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for better search performance
subscriptionPlanSchema.index({ name: 1 });
subscriptionPlanSchema.index({ isActive: 1 });
subscriptionPlanSchema.index({ price: 1 });
subscriptionPlanSchema.index({ sortOrder: 1 });

// Static method to get active plans
subscriptionPlanSchema.statics.getActivePlans = function() {
  return this.find({ isActive: true }).sort({ sortOrder: 1, price: 1 });
};

// Static method to get plan by name
subscriptionPlanSchema.statics.findByName = function(name) {
  return this.findOne({ name, isActive: true });
};

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
