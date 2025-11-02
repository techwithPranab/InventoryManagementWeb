const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    unique: true,
    required: true
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['general-inquiry', 'technical-support', 'billing-account', 'feature-request', 'bug-report', 'training-onboarding', 'integration-help', 'security-concern']
  },
  priority: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'waiting-for-customer', 'resolved', 'closed'],
    default: 'open'
  },
  message: {
    type: String,
    required: true
  },
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    url: String
  }],
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  responses: [{
    message: {
      type: String,
      required: true
    },
    author: {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      name: {
        type: String,
        required: true
      },
      email: {
        type: String,
        required: true
      },
      role: {
        type: String,
        required: true
      }
    },
    isInternal: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  satisfactionRating: {
    type: Number,
    min: 1,
    max: 5
  },
  resolutionTime: {
    type: Number // in hours
  },
  source: {
    type: String,
    enum: ['web-form', 'email', 'phone', 'chat', 'api'],
    default: 'web-form'
  }
}, {
  timestamps: true
});

// Generate ticket number before saving
supportTicketSchema.pre('save', async function(next) {
  if (this.isNew && !this.ticketNumber) {
    // Generate ticket number: TICKET-YYYY-NNNNNN
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    this.ticketNumber = `TICKET-${year}-${randomNum}`;
  }
  next();
});

// Index for better query performance
supportTicketSchema.index({ status: 1, priority: 1, createdAt: -1 });
supportTicketSchema.index({ customerEmail: 1 });
supportTicketSchema.index({ assignedTo: 1 });
supportTicketSchema.index({ ticketNumber: 1 });
supportTicketSchema.index({ category: 1 });

// Method to add response
supportTicketSchema.methods.addResponse = function(message, author, isInternal = false) {
  this.responses.push({
    message,
    author: {
      _id: author._id,
      name: author.name,
      email: author.email,
      role: author.role
    },
    isInternal,
    createdAt: new Date()
  });
  return this.save();
};

// Method to assign ticket
supportTicketSchema.methods.assignTo = function(userId) {
  this.assignedTo = userId;
  this.status = 'in-progress';
  return this.save();
};

// Method to resolve ticket
supportTicketSchema.methods.resolve = function() {
  this.status = 'resolved';
  if (!this.resolutionTime) {
    const hoursToResolve = (new Date() - this.createdAt) / (1000 * 60 * 60);
    this.resolutionTime = Math.round(hoursToResolve * 100) / 100;
  }
  return this.save();
};

// Static method to get ticket statistics
supportTicketSchema.statics.getTicketStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
