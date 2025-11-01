import mongoose from 'mongoose';
import InventorySetup from '@/models/InventorySetup';

/**
 * Generate a unique client code (8 characters: 4 alphabets + 4 digits)
 */
export function generateClientCode(userName: string, email: string): string {
  // Generate 4 random alphabets (A-Z)
  const alphabets = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let randomAlphabets = '';
  for (let i = 0; i < 4; i++) {
    randomAlphabets += alphabets.charAt(Math.floor(Math.random() * alphabets.length));
  }
  
  // Generate 4 random digits (0-9)
  let randomDigits = '';
  for (let i = 0; i < 4; i++) {
    randomDigits += Math.floor(Math.random() * 10).toString();
  }
  
  return randomAlphabets + randomDigits;
}

/**
 * Generate a unique database name
 */
export function generateDatabaseName(clientCode: string): string {
  return `inventory_${clientCode.toLowerCase()}_${Date.now()}`;
}

/**
 * Call backend API to setup inventory database schema
 */
export async function setupBackendInventoryDatabase(clientCode: string, industry: string): Promise<boolean> {
  try {
    const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000';
    
    // Import jwt dynamically to avoid client-side issues
    const jwt = (await import('jsonwebtoken')).default;
    
    // Generate proper JWT token for backend API call
    const adminToken = jwt.sign(
      {
        userId: 'admin',
        role: 'admin',
        email: 'admin@system.local'
      },
      process.env.JWT_SECRET || 'inventory_management_secret_key_2025_secure_token_generator',
      { expiresIn: '1h' }
    );
    
    const response = await fetch(`${backendApiUrl}/api/admin/inventory-setup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        userId: 'admin',
        setupData: {
          clientCode,
          industry
        }
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Backend inventory database setup successful:', result);
      return true;
    } else {
      const error = await response.json();
      console.error('Backend inventory setup failed:', error);
      return false;
    }
  } catch (error) {
    console.error('Error calling backend inventory setup API:', error);
    return false;
  }
}

/**
 * Create client database (MongoDB) - Local AdminWeb database
 */
export async function createClientDatabase(databaseName: string): Promise<boolean> {
  try {
    // Create a new connection to the client database
    const clientDbConnection = mongoose.createConnection(
      `${process.env.MONGODB_URI?.replace(/\/[^\/]*$/, '')}/${databaseName}`,
      {
        bufferCommands: false,
      }
    );

    // Wait for connection to be established
    await new Promise((resolve, reject) => {
      clientDbConnection.once('open', resolve);
      clientDbConnection.once('error', reject);
      setTimeout(() => reject(new Error('Database connection timeout')), 10000);
    });

    // Create initial collections structure
    await Promise.all([
      // Create categories collection with default data
      clientDbConnection.collection('categories').insertMany([
        { 
          name: 'Electronics', 
          description: 'Electronic devices and components',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        { 
          name: 'Office Supplies', 
          description: 'General office supplies and stationery',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]),

      // Create warehouses collection with default warehouse
      clientDbConnection.collection('warehouses').insertOne({
        name: 'Main Warehouse',
        code: 'MAIN-WH',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        },
        capacity: 1000,
        currentOccupancy: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }),

      // Create users collection with client user
      clientDbConnection.collection('users').insertOne({
        name: 'System Admin',
        email: 'admin@system.local',
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    ]);

    // Close the connection
    await clientDbConnection.close();
    
    console.log(`Client database ${databaseName} created successfully`);
    return true;
  } catch (error) {
    console.error('Error creating client database:', error);
    return false;
  }
}

/**
 * Create inventory setup entry after user approval
 */
export async function createInventorySetup(user: any, adminUserId: string): Promise<any> {
  try {
    // Generate unique client code and database name
    const clientCode = generateClientCode(user.name, user.email);
    const databaseName = "inventory_management_" + clientCode;

    // Create the AdminWeb client database first
    //const dbCreated = await createClientDatabase(databaseName);
    
    // if (!dbCreated) {
    //   throw new Error('Failed to create AdminWeb client database');
    // }

    // Call backend API to setup inventory database schema
    const backendSetupSuccess = await setupBackendInventoryDatabase(
      clientCode, 
      user.industry || 'other'
    );

    if (!backendSetupSuccess) {
      console.warn('Backend inventory setup failed, but continuing with AdminWeb setup');
    }

    // Determine subscription plan based on user industry or default
    let subscriptionPlan = 'Starter';
    if (user.industry === 'enterprise' || user.industry === 'manufacturing') {
      subscriptionPlan = 'Professional';
    } else if (user.industry === 'pharmaceutical' || user.industry === 'automotive') {
      subscriptionPlan = 'Enterprise';
    }

    // Create inventory setup entry
    const inventorySetup = new InventorySetup({
      ownerName: user.name,
      email: user.email,
      industry: user.industry || 'other',
      subscriptionPlan,
      subscriptionStatus: 'active',
      clientCode,
      databaseName,
      setupStatus: backendSetupSuccess ? 'completed' : 'in_progress',
      setupCompletedAt: backendSetupSuccess ? new Date() : undefined,
      setupProgress: {
        categoriesCreated: true,
        warehousesCreated: true,
        productsAdded: false, // Products can be added later by the client
        initialInventorySet: false
      },
      setupBy: adminUserId,
      notes: `Automatically created after user approval on ${new Date().toISOString()}. Backend setup: ${backendSetupSuccess ? 'Success' : 'Failed'}`
    });

    await inventorySetup.save();
    
    console.log(`Inventory setup created for user ${user.email} with client code ${clientCode}`);
    return inventorySetup;
    
  } catch (error) {
    console.error('Error creating inventory setup:', error);
    throw error;
  }
}
