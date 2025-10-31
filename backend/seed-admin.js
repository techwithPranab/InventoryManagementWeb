const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory_management';

const adminUsers = [
  {
    name: 'System Administrator',
    email: 'admin@inventory.com',
    password: 'admin123!@#',
    role: 'admin',
    isApproved: true,
    approvedAt: new Date(),
    approvedBy: null // System created
  },
  {
    name: 'Super Admin',
    email: 'superadmin@inventory.com',
    password: 'super123!@#',
    role: 'admin',
    isApproved: true,
    approvedAt: new Date(),
    approvedBy: null // System created
  }
];

async function seedAdminUsers() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Check if admin users already exist
    const existingAdmins = await User.find({ role: 'admin' });
    if (existingAdmins.length > 0) {
      console.log('Admin users already exist:');
      for (const admin of existingAdmins) {
        console.log(`- ${admin.name} (${admin.email})`);
      }
      console.log('\nSkipping admin user creation to avoid duplicates.');
      console.log('If you need to reset admin passwords, please do so manually or clear the User collection first.');
    } else {
      // Create admin users
      const createdAdmins = await User.insertMany(adminUsers);
      console.log('✅ Admin users created successfully!');
      console.log('\n=== Admin Login Credentials ===');
      for (const [index, admin] of createdAdmins.entries()) {
        console.log(`${index + 1}. ${admin.name}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Password: ${adminUsers[index].password}`);
        console.log(`   Role: ${admin.role}`);
        console.log('');
      }
    }

    console.log('\n=== Admin Portal Access ===');
    console.log('Admin Login URL: http://localhost:3000/admin/login');
    console.log('Admin Dashboard: http://localhost:3000/admin (after login)');

  } catch (error) {
    console.error('❌ Error seeding admin users:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedAdminUsers().catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
}

module.exports = { seedAdminUsers, adminUsers };
