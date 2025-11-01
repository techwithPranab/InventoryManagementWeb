import mongoose, { Schema, Model } from 'mongoose';
import { Contact } from './Contact';

interface IContactDocument extends Omit<Contact, '_id'>, mongoose.Document {}

const contactSchema = new Schema<IContactDocument>({
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
  },
  legalEmail: {
    type: String,
    trim: true,
    lowercase: true,
  },
  supportEmail: {
    type: String,
    trim: true,
    lowercase: true,
  },
  businessName: {
    type: String,
    required: true,
    trim: true,
    default: 'Inventory Management System'
  },
  updatedBy: {
    type: Schema.Types.Mixed,
  },
  lastUpdated: {
    type: String,
  }
}, {
  timestamps: true
});

// Ensure only one contact document exists
contactSchema.pre('save', async function(next) {
  if (this.isNew) {
    const ContactModel = this.constructor as Model<IContactDocument>;
    const existingContact = await ContactModel.findOne();
    if (existingContact) {
      throw new Error('Contact information already exists. Use update instead.');
    }
  }
  next();
});

// Update lastUpdated on save
contactSchema.pre('save', function(next) {
  this.lastUpdated = new Date().toISOString();
  next();
});

const ContactModel = mongoose.models.Contact || mongoose.model<IContactDocument>('Contact', contactSchema);

export default ContactModel;
