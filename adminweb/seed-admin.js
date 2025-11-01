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

// Subscription Plan Schema
const SubscriptionPlanSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  billingCycle: { type: String, enum: ['monthly', 'yearly'], required: true },
  features: [{ type: String }],
  maxProducts: { type: Number, required: true },
  maxWarehouses: { type: Number, required: true },
  maxUsers: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  stripePriceId: { type: String }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const SubscriptionPlan = mongoose.models.SubscriptionPlan || mongoose.model('SubscriptionPlan', SubscriptionPlanSchema);

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

const subscriptionPlans = [
  {
    name: 'Free',
    description: 'Get started with basic inventory management features at no cost',
    price: 0,
    currency: 'USD',
    billingCycle: 'monthly',
    features: [
      'Up to 100 products',
      '1 warehouse location',
      '2 user accounts',
      'Basic inventory tracking',
      'Simple reporting'
    ],
    maxProducts: 100,
    maxWarehouses: 1,
    maxUsers: 2,
    isActive: true
  },
  {
    name: 'Starter',
    description: 'Perfect for small businesses just getting started with inventory management',
    price: 29,
    currency: 'USD',
    billingCycle: 'monthly',
    features: [
      'Basic inventory tracking',
      'Product catalog management',
      'Simple reporting',
      'Email support'
    ],
    maxProducts: 1000,
    maxWarehouses: 1,
    maxUsers: 3,
    isActive: true
  },
  {
    name: 'Professional',
    description: 'Ideal for growing businesses needing advanced inventory features',
    price: 79,
    currency: 'USD',
    billingCycle: 'monthly',
    features: [
      'Advanced inventory tracking',
      'Multi-warehouse support',
      'Purchase order management',
      'Sales order management',
      'Advanced reporting & analytics',
      'Priority email support',
      'API access'
    ],
    maxProducts: 10000,
    maxWarehouses: 5,
    maxUsers: 10,
    isActive: true
  },
  {
    name: 'Enterprise',
    description: 'Complete solution for large businesses with complex inventory needs',
    price: 199,
    currency: 'USD',
    billingCycle: 'monthly',
    features: [
      'Unlimited products',
      'Unlimited warehouses',
      'Advanced purchase & sales management',
      'Real-time analytics dashboard',
      'Custom integrations',
      'Dedicated account manager',
      'Phone & email support',
      'Custom training',
      'SLA guarantee'
    ],
    maxProducts: -1, // -1 means unlimited
    maxWarehouses: -1, // -1 means unlimited
    maxUsers: -1, // -1 means unlimited
    isActive: true
  }
];

async function seedSubscriptionPlans() {
  try {
    console.log('\n🌱 Seeding subscription plans...');

    const createdPlans = [];
    const updatedPlans = [];

    // Check each plan individually and create/update as needed
    for (const planData of subscriptionPlans) {
      const existingPlan = await SubscriptionPlan.findOne({ name: planData.name });

      if (existingPlan) {
        // Update existing plan if it has changed
        const hasChanges = 
          existingPlan.price !== planData.price ||
          existingPlan.maxProducts !== planData.maxProducts ||
          existingPlan.maxWarehouses !== planData.maxWarehouses ||
          existingPlan.maxUsers !== planData.maxUsers ||
          JSON.stringify(existingPlan.features.sort()) !== JSON.stringify(planData.features.sort());

        if (hasChanges) {
          await SubscriptionPlan.updateOne(
            { name: planData.name },
            { 
              ...planData,
              updatedAt: new Date()
            }
          );
          updatedPlans.push(planData.name);
          console.log(`📝 Updated existing plan: ${planData.name}`);
        }
      } else {
        // Create new plan
        const newPlan = await SubscriptionPlan.create(planData);
        createdPlans.push(newPlan.name);
        console.log(`✨ Created new plan: ${planData.name}`);
      }
    }

    if (createdPlans.length > 0) {
      console.log(`\n✅ Created ${createdPlans.length} new subscription plans: ${createdPlans.join(', ')}`);
    }

    if (updatedPlans.length > 0) {
      console.log(`📝 Updated ${updatedPlans.length} existing subscription plans: ${updatedPlans.join(', ')}`);
    }

    if (createdPlans.length === 0 && updatedPlans.length === 0) {
      console.log('ℹ️  All subscription plans are up to date');
    }

    // Show current plans
    const allPlans = await SubscriptionPlan.find({}).sort({ price: 1 });
    console.log('\n📋 Current subscription plans:');
    for (const plan of allPlans) {
      console.log(`- ${plan.name}: $${plan.price}/${plan.billingCycle} (${plan.maxProducts === -1 ? 'Unlimited' : plan.maxProducts} products, ${plan.maxWarehouses === -1 ? 'Unlimited' : plan.maxWarehouses} warehouses, ${plan.maxUsers === -1 ? 'Unlimited' : plan.maxUsers} users)`);
    }

    return allPlans;
  } catch (error) {
    console.error('❌ Error seeding subscription plans:', error);
    throw error;
  }
}

async function seedAdminUsers() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB (AdminWeb)');

    // Seed subscription plans first
    await seedSubscriptionPlans();

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
    console.log('Admin Login URL: http://localhost:4001/admin/login');
    console.log('Admin Dashboard: http://localhost:4001/admin (after login)');
    console.log('Regular Login: http://localhost:4001/login');
    console.log('Dashboard: http://localhost:4001/dashboard (after login)');
    console.log('Pricing Page: http://localhost:4002/pricing');

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

module.exports = { seedAdminUsers, seedSubscriptionPlans, adminUsers, subscriptionPlans };
