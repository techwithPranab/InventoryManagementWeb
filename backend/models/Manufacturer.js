const mongoose = require('mongoose');

const manufacturerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  contactPerson: String,
  phone: String,
  email: String,
  website: String,
  notes: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

manufacturerSchema.index({ name: 1 });

const Manufacturer = mongoose.model('Manufacturer', manufacturerSchema);

module.exports = Manufacturer;
module.exports.schema = manufacturerSchema;
