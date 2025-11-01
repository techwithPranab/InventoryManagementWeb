const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  privacyEmail: {
    type: String,
    trim: true,
    lowercase: true,
    default: function() { return this.email; }
  },
  legalEmail: {
    type: String,
    trim: true,
    lowercase: true,
    default: function() { return this.email; }
  },
  supportEmail: {
    type: String,
    trim: true,
    lowercase: true,
    default: function() { return this.email; }
  },
  businessName: {
    type: String,
    required: true,
    trim: true,
    default: 'Inventory Management System'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure only one contact document exists
contactSchema.pre('save', async function(next) {
  if (this.isNew) {
    const existingContact = await this.constructor.findOne();
    if (existingContact) {
      throw new Error('Contact information already exists. Use update instead.');
    }
  }
  next();
});

// Update lastUpdated on save
contactSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('Contact', contactSchema);
