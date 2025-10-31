const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory-management-admin';
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// User Schema (simplified for seeding)
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'manager', 'staff'], default: 'staff' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  isActive: { type: Boolean, default: true },
  approvedAt: { type: Date },
  inventorySetup: {
    isCompleted: { type: Boolean, default: false },
    warehouseCreated: { type: Boolean, default: false },
    initialProductsAdded: { type: Boolean, default: false },
    setupCompletedAt: { type: Date }
  }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

// Hash password function
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

const adminUsers = [
  {
    name: 'System Administrator',
    email: 'admin@adminweb.com',
    password: 'admin123!@#',
    role: 'admin',
    status: 'approved',
    isActive: true,
    approvedAt: new Date(),
    inventorySetup: {
      isCompleted: true,
      warehouseCreated: true,
      initialProductsAdded: true,
      setupCompletedAt: new Date()
    }
  },
  {
    name: 'Super Admin',
    email: 'superadmin@adminweb.com',
    password: 'super123!@#',
    role: 'admin',
    status: 'approved',
    isActive: true,
    approvedAt: new Date(),
    inventorySetup: {
      isCompleted: true,
      warehouseCreated: true,
      initialProductsAdded: true,
      setupCompletedAt: new Date()
    }
  },
  {
    name: 'Demo Manager',
    email: 'manager@adminweb.com',
    password: 'manager123!@#',
    role: 'manager',
    status: 'approved',
    isActive: true,
    approvedAt: new Date(),
    inventorySetup: {
      isCompleted: false,
      warehouseCreated: false,
      initialProductsAdded: false
    }
  },
  {
    name: 'Demo Staff',
    email: 'staff@adminweb.com',
    password: 'staff123!@#',
    role: 'staff',
    status: 'approved',
    isActive: true,
    approvedAt: new Date(),
    inventorySetup: {
      isCompleted: false,
      warehouseCreated: false,
      initialProductsAdded: false
    }
  }
];

async function seedAdminUsers() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB (AdminWeb)');

    // Check if admin users already exist
    const existingAdmins = await User.find({ role: 'admin' });
    if (existingAdmins.length > 0) {
      console.log('Admin users already exist in AdminWeb:');
      for (const admin of existingAdmins) {
        console.log(`- ${admin.name} (${admin.email})`);
      }
      console.log('\nSkipping admin user creation to avoid duplicates.');
      console.log('If you need to reset admin passwords, please do so manually or clear the User collection first.');
    } else {
      // Hash passwords and create admin users
      const usersToCreate = [];
      for (const userData of adminUsers) {
        const hashedPassword = await hashPassword(userData.password);
        usersToCreate.push({
          ...userData,
          password: hashedPassword
        });
      }

      const createdUsers = await User.insertMany(usersToCreate);
      console.log('✅ Admin users created successfully in AdminWeb!');
      console.log('\n=== AdminWeb Login Credentials ===');

      for (const [index, user] of createdUsers.entries()) {
        const originalUser = adminUsers[index];
        console.log(`${index + 1}. ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Password: ${originalUser.password}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Status: ${user.status}`);
        console.log('');
      }
    }

    console.log('\n=== AdminWeb Access Information ===');
    console.log('Admin Login URL: http://localhost:3000/admin/login');
    console.log('Admin Dashboard: http://localhost:3000/admin (after login)');
    console.log('Regular Login: http://localhost:3000/login');
    console.log('Dashboard: http://localhost:3000/dashboard (after login)');

    console.log('\n=== User Roles ===');
    console.log('• Admin: Full system access, user management, inventory setup');
    console.log('• Manager: Warehouse and inventory management');
    console.log('• Staff: Basic inventory operations');

  } catch (error) {
    console.error('❌ Error seeding admin users for AdminWeb:', error);
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
