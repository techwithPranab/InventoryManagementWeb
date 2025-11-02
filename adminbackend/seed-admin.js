const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const colors = require('colors');

// Load env vars
dotenv.config();

// Connect to DB
const connectDB = require('./config/database');

// Load models
const User = require('./models/User');

// Sample admin user data
const adminUsers = [
  {
    name: 'Super Admin',
    email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@inventorymanagement.com',
    password: process.env.DEFAULT_ADMIN_PASSWORD || 'Admin123!',
    role: 'admin',
    status: 'approved',
    isActive: true,
    industry: 'other'
  },
  {
    name: 'Demo Admin',
    email: 'admin@demo.com',
    password: 'password123',
    role: 'admin',
    status: 'approved',
    isActive: true,
    industry: 'other'
  },
  {
    name: 'Demo Manager',
    email: 'manager@demo.com',
    password: 'password123',
    role: 'manager',
    status: 'approved',
    isActive: true,
    industry: 'other'
  },
  {
    name: 'Demo Staff',
    email: 'staff@demo.com',
    password: 'password123',
    role: 'staff',
    status: 'approved',
    isActive: true,
    industry: 'other'
  },
  {
    name: 'John Manager',
    email: 'manager@inventorymanagement.com',
    password: 'Manager123!',
    role: 'manager',
    status: 'approved',
    isActive: true,
    industry: 'other'
  },
  {
    name: 'Jane Staff',
    email: 'staff@inventorymanagement.com',
    password: 'Staff123!',
    role: 'staff',
    status: 'approved',
    isActive: true,
    industry: 'other'
  }
];

// Sample client users
const clientUsers = [
  {
    name: 'Client User 1',
    email: 'client1@example.com',
    password: 'Client123!',
    role: 'client',
    status: 'approved',
    isActive: true,
    mobileNo: '+1234567890',
    industry: 'grocery'
  },
  {
    name: 'Client User 2',
    email: 'client2@example.com',
    password: 'Client123!',
    role: 'client',
    status: 'pending',
    isActive: true,
    mobileNo: '+1234567891',
    industry: 'electronics'
  },
  {
    name: 'Client User 3',
    email: 'client3@example.com',
    password: 'Client123!',
    role: 'client',
    status: 'approved',
    isActive: false,
    mobileNo: '+1234567892',
    industry: 'pharmaceutical'
  }
];

// Import data
const importData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany();

    console.log('Data Destroyed...'.red.inverse);

    // Create admin users (password hashing will be handled by the User model pre-save hook)
    const createdAdminUsers = await User.create(adminUsers);
    console.log(`${createdAdminUsers.length} Admin users created...`.green.inverse);

    // Create client users with approval
    const createdClientUsers = await User.create(clientUsers);
    
    // Set approver for approved clients
    for (let clientUser of createdClientUsers) {
      if (clientUser.status === 'approved') {
        clientUser.approvedBy = createdAdminUsers[0]._id; // Approved by super admin
        clientUser.approvedAt = new Date();
        await clientUser.save();
      }
    }

    console.log(`${createdClientUsers.length} Client users created...`.green.inverse);
    console.log('Data Imported...'.green.inverse);
    
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`.red.inverse);
    process.exit(1);
  }
};

// Delete data
const deleteData = async () => {
  try {
    await connectDB();
    
    await User.deleteMany();
    
    console.log('Data Destroyed...'.red.inverse);
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`.red.inverse);
    process.exit(1);
  }
};

// Check command line arguments
if (process.argv[2] === '-d') {
  deleteData();
} else {
  importData();
}

// Export for external use
module.exports = { importData, deleteData };
