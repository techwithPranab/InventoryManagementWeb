import mongoose from 'mongoose';

export interface ISubscriptionPlan {
  _id?: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  maxProducts: number;
  maxWarehouses: number;
  maxUsers: number;
  isActive: boolean;
  stripePriceId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

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
  }
}, {
  timestamps: true
});

// Index for better search performance
subscriptionPlanSchema.index({ name: 1 });
subscriptionPlanSchema.index({ isActive: 1 });
subscriptionPlanSchema.index({ price: 1 });

export default mongoose.models.SubscriptionPlan || mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
