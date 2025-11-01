const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Contact = require('./models/Contact');

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

// Default contact information from backend model
const defaultContactData = {
  email: 'contact@inventorysystem.com',
  phone: '+1 (555) 123-4567',
  address: '123 Business Street, Suite 100, Business City, BC 12345',
  privacyEmail: 'privacy@inventorysystem.com',
  legalEmail: 'legal@inventorysystem.com',
  supportEmail: 'support@inventorysystem.com',
  businessName: 'Inventory Management System',
  updatedBy: null // System created
};

async function seedContactData() {
  try {
    // Check if contact information already exists
    const existingContact = await Contact.findOne();
    if (existingContact) {
      console.log('Contact information already exists:');
      console.log(`- Business: ${existingContact.businessName}`);
      console.log(`- Email: ${existingContact.email}`);
      console.log(`- Phone: ${existingContact.phone}`);
      console.log('\nSkipping contact data creation to avoid duplicates.');
      console.log('If you need to reset contact information, please do so manually or clear the Contact collection first.');
      return;
    }

    // Create default contact information using backend Contact model
    const contact = new Contact(defaultContactData);
    await contact.save();

    console.log('✅ Contact information created successfully!');
    console.log('\n=== Default Contact Information ===');
    console.log(`Business Name: ${contact.businessName}`);
    console.log(`Primary Email: ${contact.email}`);
    console.log(`Phone: ${contact.phone}`);
    console.log(`Address: ${contact.address}`);
    console.log(`Privacy Email: ${contact.privacyEmail}`);
    console.log(`Legal Email: ${contact.legalEmail}`);
    console.log(`Support Email: ${contact.supportEmail}`);

  } catch (error) {
    console.error('❌ Error seeding contact data:', error);
    throw error; // Re-throw to be handled by caller
  }
}

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

    // Seed contact information
    await seedContactData();

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

module.exports = { seedAdminUsers, seedContactData, adminUsers, defaultContactData };
