// backend/seed-manufacturers-suppliers.js
// Seed script for Manufacturer and Supplier collections
// Usage: node seed-manufacturers-suppliers.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Manufacturer = require('./models/Manufacturer');
const Supplier = require('./models/Supplier');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory_management';

const manufacturers = [
  {
    name: 'Kolkata Steel Works',
    address: {
      street: '123 Industrial Area',
      city: 'Kolkata',
      state: 'West Bengal',
      zipCode: '700001',
      country: 'India',
    },
    contactPerson: 'Arjun Sen',
    phone: '+91-9876543210',
    email: 'info@kolkatasteel.com',
    website: '',
    notes: '',
  },
  {
    name: 'Bengal Plastics',
    address: {
      street: '45 Park Street',
      city: 'Kolkata',
      state: 'West Bengal',
      zipCode: '700016',
      country: 'India',
    },
    contactPerson: 'Priya Das',
    phone: '+91-9830011223',
    email: 'contact@bengalplastics.com',
    website: '',
    notes: '',
  },
];

const suppliers = [
  {
    name: 'Eastern Supplies',
    address: {
      street: '78 College Street',
      city: 'Kolkata',
      state: 'West Bengal',
      zipCode: '700073',
      country: 'India',
    },
    contactPerson: 'Ravi Ghosh',
    phone: '+91-9001234567',
    email: 'sales@easternsupplies.com',
    website: '',
    notes: '',
  },
  {
    name: 'Sunrise Traders',
    address: {
      street: '12 BBD Bagh',
      city: 'Kolkata',
      state: 'West Bengal',
      zipCode: '700001',
      country: 'India',
    },
    contactPerson: 'Meera Banerjee',
    phone: '+91-9123456780',
    email: 'info@sunrisetraders.com',
    website: '',
    notes: '',
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    await Manufacturer.deleteMany();
    await Supplier.deleteMany();
    console.log('Cleared Manufacturer and Supplier collections');

    await Manufacturer.insertMany(manufacturers);
    await Supplier.insertMany(suppliers);
    console.log('Seeded Manufacturer and Supplier data');
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seed();
