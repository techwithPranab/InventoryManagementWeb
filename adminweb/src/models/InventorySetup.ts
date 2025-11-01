import mongoose from 'mongoose';

const InventorySetupSchema = new mongoose.Schema({
  // Client Information
  ownerName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  industry: {
    type: String,
    required: true,
    trim: true
  },

  // Subscription & Billing
  subscriptionPlan: {
    type: String,
    required: true,
    enum: ['Free', 'Starter', 'Professional', 'Enterprise']
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'cancelled'],
    default: 'active'
  },

  // Database Information
  clientCode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  databaseName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  // Setup Status
  setupStatus: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'failed'],
    default: 'pending'
  },
  setupCompletedAt: {
    type: Date
  },

  // Setup Progress
  setupProgress: {
    categoriesCreated: { type: Boolean, default: false },
    warehousesCreated: { type: Boolean, default: false },
    productsAdded: { type: Boolean, default: false },
    initialInventorySet: { type: Boolean, default: false }
  },

  // Admin who performed the setup
  setupBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Additional metadata
  notes: {
    type: String,
    trim: true
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
InventorySetupSchema.index({ clientCode: 1 });
InventorySetupSchema.index({ databaseName: 1 });
InventorySetupSchema.index({ email: 1 });
InventorySetupSchema.index({ setupStatus: 1 });
InventorySetupSchema.index({ subscriptionPlan: 1 });

// Pre-save middleware to update the updatedAt field
InventorySetupSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for setup completion percentage
InventorySetupSchema.virtual('setupCompletionPercentage').get(function() {
  if (!this.setupProgress) return 0;
  const progressFields = ['categoriesCreated', 'warehousesCreated', 'productsAdded', 'initialInventorySet'] as const;
  const completedFields = progressFields.filter(field => this.setupProgress && this.setupProgress[field] === true);
  return Math.round((completedFields.length / progressFields.length) * 100);
});

// Method to mark setup as completed
InventorySetupSchema.methods.completeSetup = function() {
  this.setupStatus = 'completed';
  this.setupCompletedAt = new Date();
  this.setupProgress.categoriesCreated = true;
  this.setupProgress.warehousesCreated = true;
  this.setupProgress.productsAdded = true;
  this.setupProgress.initialInventorySet = true;
  return this.save();
};

// Method to update setup progress
InventorySetupSchema.methods.updateProgress = function(progress: Partial<typeof this.setupProgress>) {
  Object.assign(this.setupProgress, progress);
  if (this.setupProgress.categoriesCreated &&
      this.setupProgress.warehousesCreated &&
      this.setupProgress.productsAdded &&
      this.setupProgress.initialInventorySet) {
    this.setupStatus = 'completed';
    this.setupCompletedAt = new Date();
  }
  return this.save();
};

// Static method to find by client code
InventorySetupSchema.statics.findByClientCode = function(clientCode: string) {
  return this.findOne({ clientCode });
};

// Static method to get active setups
InventorySetupSchema.statics.getActiveSetups = function() {
  return this.find({ setupStatus: { $in: ['pending', 'in_progress'] } });
};

const InventorySetup = mongoose.models.InventorySetup || mongoose.model('InventorySetup', InventorySetupSchema);

export default InventorySetup;
