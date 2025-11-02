const mongoose = require('mongoose');
const dotenv = require('dotenv');
const colors = require('colors');

// Load env vars
dotenv.config();

// Connect to DB
const connectDB = require('./config/database');

// Load models
const User = require('./models/User');
const SubscriptionPlan = require('./models/SubscriptionPlan');
const InventorySetup = require('./models/InventorySetup');
const Contact = require('./models/Contact');
const SupportTicket = require('./models/SupportTicket');

// Import individual seed functions
const { importData: importAdminData } = require('./seed-admin');
const { importData: importPlanData } = require('./seed-subscription-plans');

// Sample inventory setups
const inventorySetups = [
  {
    ownerName: 'Client User 1',
    email: 'client1@example.com',
    industry: 'grocery',
    subscriptionPlan: 'Professional',
    subscriptionStatus: 'active',
    clientCode: 'GROCERY001',
    databaseName: 'inventory_grocery001',
    setupStatus: 'completed',
    setupCompletedAt: new Date(),
    setupProgress: {
      categoriesCreated: true,
      warehousesCreated: true,
      productsAdded: true,
      initialInventorySet: true
    },
    notes: 'Initial setup completed successfully for grocery store.'
  },
  {
    ownerName: 'Client User 2',
    email: 'client2@example.com',
    industry: 'electronics',
    subscriptionPlan: 'Starter',
    subscriptionStatus: 'active',
    clientCode: 'ELECT002',
    databaseName: 'inventory_elect002',
    setupStatus: 'in_progress',
    setupProgress: {
      categoriesCreated: true,
      warehousesCreated: true,
      productsAdded: false,
      initialInventorySet: false
    },
    notes: 'Setup in progress for electronics store.'
  },
  {
    ownerName: 'Test Pharmacy',
    email: 'pharmacy@example.com',
    industry: 'pharmaceutical',
    subscriptionPlan: 'Enterprise',
    subscriptionStatus: 'active',
    clientCode: 'PHARMA003',
    databaseName: 'inventory_pharma003',
    setupStatus: 'pending',
    setupProgress: {
      categoriesCreated: false,
      warehousesCreated: false,
      productsAdded: false,
      initialInventorySet: false
    },
    notes: 'Pending setup for pharmaceutical business.'
  }
];

// Sample contacts
const contacts = [
  {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    company: 'Tech Solutions Inc',
    subject: 'Interested in Enterprise plan',
    message: 'Hi, I am interested in learning more about your Enterprise plan for our growing business. We have about 500 products and 3 warehouses.',
    category: 'sales',
    status: 'new',
    priority: 'medium',
    source: 'website'
  },
  {
    name: 'Sarah Wilson',
    email: 'sarah.wilson@retailstore.com',
    phone: '+1234567891',
    company: 'Retail Store Chain',
    subject: 'Technical support needed',
    message: 'We are having issues with inventory sync between our locations. Can someone help us with this?',
    category: 'support',
    status: 'contacted',
    priority: 'high',
    source: 'email'
  },
  {
    name: 'Mike Johnson',
    email: 'mike@smallbusiness.com',
    subject: 'General inquiry about features',
    message: 'What features are included in the Starter plan? We are a small business with about 200 products.',
    category: 'general',
    status: 'new',
    priority: 'low',
    source: 'website'
  }
];

// Sample support tickets
const supportTickets = [
  {
    customerName: 'Alice Brown',
    customerEmail: 'alice.brown@company.com',
    subject: 'Cannot access inventory dashboard',
    message: 'I am unable to access my inventory dashboard. I get an error message saying "Access denied". Please help.',
    category: 'technical-support',
    priority: 'high',
    status: 'open',
    source: 'web-form'
  },
  {
    customerName: 'Bob Smith',
    customerEmail: 'bob.smith@retailer.com',
    subject: 'Billing question about subscription',
    message: 'I was charged twice this month for my Professional subscription. Can you please check my billing?',
    category: 'billing-account',
    priority: 'medium',
    status: 'in-progress',
    source: 'email'
  },
  {
    customerName: 'Carol Davis',
    customerEmail: 'carol@warehouse.com',
    subject: 'Feature request: Bulk product import',
    message: 'It would be great to have a feature to import products in bulk via CSV file. This would save us a lot of time.',
    category: 'feature-request',
    priority: 'low',
    status: 'open',
    source: 'web-form'
  }
];

// Import all data
const importAllData = async () => {
  try {
    await connectDB();

    console.log('Starting complete data import...'.yellow.bold);

    // Clear all existing data
    await User.deleteMany();
    await SubscriptionPlan.deleteMany();
    await InventorySetup.deleteMany();
    await Contact.deleteMany();
    await SupportTicket.deleteMany();
    
    console.log('All existing data cleared...'.red.inverse);

    // 1. Import subscription plans first
    console.log('1. Importing subscription plans...'.cyan);
    const createdPlans = await SubscriptionPlan.create(require('./seed-subscription-plans').subscriptionPlans || [
      { name: 'Free', description: 'Free plan', price: 0, currency: 'USD', billingCycle: 'monthly', features: [], maxProducts: 100, maxWarehouses: 1, maxUsers: 2, isActive: true },
      { name: 'Starter', description: 'Starter plan', price: 29.99, currency: 'USD', billingCycle: 'monthly', features: [], maxProducts: 1000, maxWarehouses: 3, maxUsers: 5, isActive: true },
      { name: 'Professional', description: 'Professional plan', price: 79.99, currency: 'USD', billingCycle: 'monthly', features: [], maxProducts: 10000, maxWarehouses: 10, maxUsers: 15, isActive: true },
      { name: 'Enterprise', description: 'Enterprise plan', price: 199.99, currency: 'USD', billingCycle: 'monthly', features: [], maxProducts: -1, maxWarehouses: -1, maxUsers: -1, isActive: true }
    ]);
    console.log(`${createdPlans.length} subscription plans created`.green);

    // 2. Import admin and client users
    console.log('2. Importing users...'.cyan);
    const bcrypt = require('bcryptjs');
    
    const adminUsers = [
      {
        name: 'Super Admin',
        email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@inventorymanagement.com',
        password: await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD || 'Admin123!', 12),
        role: 'admin',
        status: 'approved',
        isActive: true,
        industry: 'technology'
      },
      {
        name: 'John Manager',
        email: 'manager@inventorymanagement.com',
        password: await bcrypt.hash('Manager123!', 12),
        role: 'manager',
        status: 'approved',
        isActive: true,
        industry: 'technology'
      }
    ];

    const clientUsers = [
      {
        name: 'Client User 1',
        email: 'client1@example.com',
        password: await bcrypt.hash('Client123!', 12),
        role: 'client',
        status: 'approved',
        isActive: true,
        mobileNo: '+1234567890',
        industry: 'grocery'
      },
      {
        name: 'Client User 2',
        email: 'client2@example.com',
        password: await bcrypt.hash('Client123!', 12),
        role: 'client',
        status: 'pending',
        isActive: true,
        mobileNo: '+1234567891',
        industry: 'electronics'
      }
    ];

    const createdAdminUsers = await User.create(adminUsers);
    const createdClientUsers = await User.create(clientUsers);
    console.log(`${createdAdminUsers.length + createdClientUsers.length} users created`.green);

    // 3. Import inventory setups
    console.log('3. Importing inventory setups...'.cyan);
    const setupsWithAdmin = inventorySetups.map(setup => ({
      ...setup,
      setupBy: createdAdminUsers[0]._id
    }));
    const createdSetups = await InventorySetup.create(setupsWithAdmin);
    console.log(`${createdSetups.length} inventory setups created`.green);

    // 4. Import contacts
    console.log('4. Importing contacts...'.cyan);
    const createdContacts = await Contact.create(contacts);
    console.log(`${createdContacts.length} contacts created`.green);

    // 5. Import support tickets
    console.log('5. Importing support tickets...'.cyan);
    const createdTickets = await SupportTicket.create(supportTickets);
    console.log(`${createdTickets.length} support tickets created`.green);

    console.log('\n✅ Complete data import finished successfully!'.green.bold);
    console.log('\nSample Login Credentials:'.yellow.bold);
    console.log(`Admin: ${adminUsers[0].email} / ${process.env.DEFAULT_ADMIN_PASSWORD || 'Admin123!'}`);
    console.log(`Manager: ${adminUsers[1].email} / Manager123!`);
    console.log(`Client: ${clientUsers[0].email} / Client123!`);
    
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`.red.bold);
    console.error(error.stack);
    process.exit(1);
  }
};

// Delete all data
const deleteAllData = async () => {
  try {
    await connectDB();
    
    await User.deleteMany();
    await SubscriptionPlan.deleteMany();
    await InventorySetup.deleteMany();
    await Contact.deleteMany();
    await SupportTicket.deleteMany();
    
    console.log('All Data Destroyed...'.red.inverse);
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`.red.inverse);
    process.exit(1);
  }
};

// Check command line arguments
if (process.argv[2] === '-d') {
  deleteAllData();
} else {
  importAllData();
}

// Export for external use
module.exports = { importAllData, deleteAllData };
