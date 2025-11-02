const mongoose = require('mongoose');
const dotenv = require('dotenv');
const colors = require('colors');

// Load env vars
dotenv.config();

// Connect to DB
const connectDB = require('./config/database');

// Load models
const SubscriptionPlan = require('./models/SubscriptionPlan');

// Sample subscription plans
const subscriptionPlans = [
  {
    name: 'Free',
    description: 'Perfect for small businesses just getting started with basic inventory management.',
    price: 0,
    currency: 'USD',
    billingCycle: 'monthly',
    features: [
      'Up to 100 products',
      '1 warehouse location',
      '2 user accounts',
      'Basic reporting',
      'Email support',
      'Mobile app access'
    ],
    maxProducts: 100,
    maxWarehouses: 1,
    maxUsers: 2,
    isActive: true,
    sortOrder: 1
  },
  {
    name: 'Starter',
    description: 'Ideal for growing businesses that need more capacity and features.',
    price: 29.99,
    currency: 'USD',
    billingCycle: 'monthly',
    features: [
      'Up to 1,000 products',
      '3 warehouse locations',
      '5 user accounts',
      'Advanced reporting',
      'Priority email support',
      'Mobile app access',
      'Barcode scanning',
      'Low stock alerts'
    ],
    maxProducts: 1000,
    maxWarehouses: 3,
    maxUsers: 5,
    isActive: true,
    sortOrder: 2
  },
  {
    name: 'Professional',
    description: 'For established businesses requiring comprehensive inventory management.',
    price: 79.99,
    currency: 'USD',
    billingCycle: 'monthly',
    features: [
      'Up to 10,000 products',
      '10 warehouse locations',
      '15 user accounts',
      'Advanced analytics & reporting',
      'Phone & email support',
      'Mobile app access',
      'Advanced barcode scanning',
      'Automated reordering',
      'Multi-location transfers',
      'Integration support',
      'Custom fields',
      'Batch operations'
    ],
    maxProducts: 10000,
    maxWarehouses: 10,
    maxUsers: 15,
    isActive: true,
    sortOrder: 3
  },
  {
    name: 'Enterprise',
    description: 'For large organizations with complex inventory management needs.',
    price: 199.99,
    currency: 'USD',
    billingCycle: 'monthly',
    features: [
      'Unlimited products',
      'Unlimited warehouses',
      'Unlimited users',
      'Custom reporting & analytics',
      'Dedicated account manager',
      'Priority phone support',
      'Mobile app access',
      'Advanced automation',
      'API access',
      'Custom integrations',
      'Advanced security features',
      'Data backup & recovery',
      'Training & onboarding',
      'Custom workflows'
    ],
    maxProducts: 999999, // Very large number indicates unlimited
    maxWarehouses: 999999,
    maxUsers: 999999,
    isActive: true,
    sortOrder: 4
  },
  {
    name: 'Starter Annual',
    description: 'Annual billing for the Starter plan with 20% discount.',
    price: 287.90, // 29.99 * 12 * 0.8
    currency: 'USD',
    billingCycle: 'yearly',
    features: [
      'Up to 1,000 products',
      '3 warehouse locations',
      '5 user accounts',
      'Advanced reporting',
      'Priority email support',
      'Mobile app access',
      'Barcode scanning',
      'Low stock alerts',
      '20% annual discount',
      '2 months free'
    ],
    maxProducts: 1000,
    maxWarehouses: 3,
    maxUsers: 5,
    isActive: true,
    sortOrder: 5
  },
  {
    name: 'Professional Annual',
    description: 'Annual billing for the Professional plan with 20% discount.',
    price: 767.90, // 79.99 * 12 * 0.8
    currency: 'USD',
    billingCycle: 'yearly',
    features: [
      'Up to 10,000 products',
      '10 warehouse locations',
      '15 user accounts',
      'Advanced analytics & reporting',
      'Phone & email support',
      'Mobile app access',
      'Advanced barcode scanning',
      'Automated reordering',
      'Multi-location transfers',
      'Integration support',
      'Custom fields',
      'Batch operations',
      '20% annual discount',
      '2 months free'
    ],
    maxProducts: 10000,
    maxWarehouses: 10,
    maxUsers: 15,
    isActive: true,
    sortOrder: 6
  }
];

// Import data
const importData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await SubscriptionPlan.deleteMany();
    console.log('Subscription Plans Destroyed...'.red.inverse);

    // Create subscription plans
    const createdPlans = await SubscriptionPlan.create(subscriptionPlans);
    
    console.log(`${createdPlans.length} Subscription Plans created...`.green.inverse);
    console.log('Subscription Plans Data Imported...'.green.inverse);
    
    // Display created plans
    createdPlans.forEach(plan => {
      console.log(`- ${plan.name}: $${plan.price}/${plan.billingCycle}`.cyan);
    });
    
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
    
    await SubscriptionPlan.deleteMany();
    
    console.log('Subscription Plans Data Destroyed...'.red.inverse);
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
