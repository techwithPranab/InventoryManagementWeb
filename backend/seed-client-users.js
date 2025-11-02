const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

// You need to provide the client code
const CLIENT_CODE = process.argv[2];

if (!CLIENT_CODE) {
  console.error('❌ Error: Please provide a client code as argument');
  console.log('Usage: node seed-client-users.js <CLIENT_CODE>');
  console.log('Example: node seed-client-users.js QHHD5990');
  process.exit(1);
}

const clientUsers = [
  {
    name: 'Client Admin',
    email: `admin@${CLIENT_CODE.toLowerCase()}.com`,
    password: 'admin123',
    role: 'admin',
    isActive: true
  },
  {
    name: 'Client Manager',
    email: `manager@${CLIENT_CODE.toLowerCase()}.com`,
    password: 'manager123',
    role: 'manager',
    isActive: true
  },
  {
    name: 'Client Staff',
    email: `staff@${CLIENT_CODE.toLowerCase()}.com`,
    password: 'staff123',
    role: 'staff',
    isActive: true
  }
];

async function seedClientUsers() {
  try {
    // Connect to client-specific database
    const dbName = `inventory_management_${CLIENT_CODE}`;
    const baseUri = process.env.MONGODB_URI.replace(/\/[^\/]*$/, '');
    const clientDbUri = `${baseUri}/${dbName}`;

    await mongoose.connect(clientDbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`Connected to client database: ${dbName}`);

    // Clear existing users (optional - comment out if you want to keep existing users)
    // await User.deleteMany({});
    // console.log('Cleared existing users');

    // Check if users already exist
    const existingUsers = await User.find({ role: { $in: ['admin', 'manager', 'staff'] } });
    if (existingUsers.length > 0) {
      console.log('\n⚠️  Users already exist in this database:');
      for (const user of existingUsers) {
        console.log(`- ${user.name} (${user.email}) - Role: ${user.role}`);
      }
      console.log('\nSkipping user creation to avoid duplicates.');
      console.log('If you need to reset users, please clear the User collection first.');
    } else {
      // Create client users
      const createdUsers = await User.insertMany(clientUsers);
      console.log('✅ Client users created successfully!');
      console.log(`\n=== Client Login Credentials (Client Code: ${CLIENT_CODE}) ===`);
      for (const [index, user] of createdUsers.entries()) {
        console.log(`${index + 1}. ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Password: ${clientUsers[index].password}`);
        console.log(`   Role: ${user.role}`);
        console.log('');
      }
    }

    console.log('\n=== Important ===');
    console.log(`Client Code: ${CLIENT_CODE}`);
    console.log('Make sure to use this client code when logging in to the frontend application.');

  } catch (error) {
    console.error('❌ Error seeding client users:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedClientUsers();
