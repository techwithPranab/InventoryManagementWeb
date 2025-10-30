const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Import models
const User = require('./models/User');
const Category = require('./models/Category');
const Warehouse = require('./models/Warehouse');
const Product = require('./models/Product');
const Inventory = require('./models/Inventory');
const Manufacturer = require('./models/Manufacturer');
const Supplier = require('./models/Supplier');
const PurchaseOrder = require('./models/PurchaseOrder');
const SalesOrder = require('./models/SalesOrder');
const Shipping = require('./models/Shipping');
const sampleShipping = require('./sampleShipping');

dotenv.config();

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory_management');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Warehouse.deleteMany({});
    await Product.deleteMany({});
    await Inventory.deleteMany({});
    await Manufacturer.deleteMany({});
    await Supplier.deleteMany({});
    
    // Clear purchase orders, sales orders, and shipping as well
    await PurchaseOrder.deleteMany({});
    await SalesOrder.deleteMany({});
    await Shipping.deleteMany({});
    
    console.log('Cleared existing data');

    // Create demo users
    const users = await User.create([
      {
        name: 'Admin User',
        email: 'admin@demo.com',
        password: 'password123',
        role: 'admin'
      },
      {
        name: 'Manager User',
        email: 'manager@demo.com',
        password: 'password123',
        role: 'manager'
      },
      {
        name: 'Staff User',
        email: 'staff@demo.com',
        password: 'password123',
        role: 'staff'
      }
    ]);

    console.log('Created demo users');

    // Create manufacturers
    await Manufacturer.create([
      {
        name: 'Samsung Electronics',
        contactPerson: 'John Kim',
        email: 'contact@samsung.com',
        phone: '+82-2-2255-0114',
        address: {
          street: '129 Samsung-ro',
          city: 'Seoul',
          state: 'Seoul',
          zipCode: '06765',
          country: 'South Korea'
        },
        website: 'https://www.samsung.com',
        description: 'Global electronics manufacturer'
      },
      {
        name: 'Nike Inc.',
        contactPerson: 'Sarah Johnson',
        email: 'info@nike.com',
        phone: '+1-503-671-6453',
        address: {
          street: 'One Bowerman Drive',
          city: 'Beaverton',
          state: 'Oregon',
          zipCode: '97005',
          country: 'USA'
        },
        website: 'https://www.nike.com',
        description: 'Athletic footwear and apparel'
      }
    ]);

    console.log('Created manufacturers');

    // Create suppliers
    const suppliers = await Supplier.create([
      {
        name: 'Eastern Supplies',
        contactPerson: 'Raj Kumar',
        email: 'sales@easternsupplies.com',
        phone: '+91-9001234567',
        address: {
          street: '78 College Street',
          city: 'Kolkata',
          state: 'West Bengal',
          zipCode: '700073',
          country: 'India'
        },
        website: 'https://www.easternsupplies.com',
        description: 'Electronics and gadgets supplier'
      },
      {
        name: 'Sunrise Traders',
        contactPerson: 'Priya Sharma',
        email: 'info@sunrisetraders.com',
        phone: '+91-9123456780',
        address: {
          street: '12 BBD Bagh',
          city: 'Kolkata',
          state: 'West Bengal',
          zipCode: '700001',
          country: 'India'
        },
        website: 'https://www.sunrisetraders.com',
        description: 'General goods and supplies'
      }
    ]);

    console.log('Created suppliers');

    // Create categories
    const categories = await Category.create([
      {
        name: 'Electronics',
        description: 'Electronic devices and accessories',
        createdBy: users[0]._id
      },
      {
        name: 'Clothing',
        description: 'Apparel and fashion items',
        createdBy: users[0]._id
      },
      {
        name: 'Home & Garden',
        description: 'Home improvement and garden supplies',
        createdBy: users[0]._id
      },
      {
        name: 'Sports & Outdoors',
        description: 'Sports equipment and outdoor gear',
        createdBy: users[0]._id
      }
    ]);

    console.log('Created categories');

    // Create warehouses
    const warehouses = await Warehouse.create([
      {
        name: 'Main Warehouse',
        code: 'MW001',
        address: {
          street: '123 Industrial Blvd',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        manager: users[1]._id,
        capacity: 10000,
        currentOccupancy: 2500,
        createdBy: users[0]._id
      },
      {
        name: 'East Coast Distribution',
        code: 'ECD001',
        address: {
          street: '456 Distribution Ave',
          city: 'Boston',
          state: 'MA',
          zipCode: '02101',
          country: 'USA'
        },
        manager: users[1]._id,
        capacity: 5000,
        currentOccupancy: 1200,
        createdBy: users[0]._id
      }
    ]);

    console.log('Created warehouses');

    // Create products
    const products = await Product.create([
      {
        name: 'Laptop Computer',
        sku: 'LAP001',
        description: 'High-performance laptop for business use',
        category: categories[0]._id,
        brand: 'TechBrand',
        unit: 'piece',
        costPrice: 800,
        sellingPrice: 1200,
        minStockLevel: 5,
        maxStockLevel: 50,
        reorderLevel: 10,
        createdBy: users[0]._id
      },
      {
        name: 'Wireless Mouse',
        sku: 'MSE001',
        description: 'Ergonomic wireless mouse',
        category: categories[0]._id,
        brand: 'TechBrand',
        unit: 'piece',
        costPrice: 15,
        sellingPrice: 25,
        minStockLevel: 20,
        maxStockLevel: 200,
        reorderLevel: 30,
        createdBy: users[0]._id
      },
      {
        name: 'Cotton T-Shirt',
        sku: 'TSH001',
        description: '100% cotton comfortable t-shirt',
        category: categories[1]._id,
        brand: 'FashionBrand',
        unit: 'piece',
        costPrice: 8,
        sellingPrice: 20,
        minStockLevel: 50,
        maxStockLevel: 500,
        reorderLevel: 75,
        createdBy: users[0]._id
      },
      {
        name: 'Garden Hose',
        sku: 'GH001',
        description: '50ft expandable garden hose',
        category: categories[2]._id,
        brand: 'GardenPro',
        unit: 'piece',
        costPrice: 25,
        sellingPrice: 45,
        minStockLevel: 10,
        maxStockLevel: 100,
        reorderLevel: 15,
        createdBy: users[0]._id
      },
      {
        name: 'Basketball',
        sku: 'BB001',
        description: 'Official size basketball',
        category: categories[3]._id,
        brand: 'SportsBrand',
        unit: 'piece',
        costPrice: 12,
        sellingPrice: 25,
        minStockLevel: 15,
        maxStockLevel: 150,
        reorderLevel: 25,
        createdBy: users[0]._id
      }
    ]);

    console.log('Created products');

    // Create inventory records
    const inventoryRecords = [];
    
    // Add inventory for each product in each warehouse
    for (const product of products) {
      for (const warehouse of warehouses) {
        const quantity = Math.floor(Math.random() * 100) + 20; // Random quantity between 20-120
        inventoryRecords.push({
          product: product._id,
          warehouse: warehouse._id,
          quantity: quantity,
          reservedQuantity: Math.floor(quantity * 0.1), // 10% reserved
          location: {
            aisle: `A${Math.floor(Math.random() * 10) + 1}`,
            shelf: `S${Math.floor(Math.random() * 5) + 1}`,
            bin: `B${Math.floor(Math.random() * 20) + 1}`
          },
          lastRestocked: new Date()
        });
      }
    }


    await Inventory.create(inventoryRecords);
    console.log('Created inventory records');

    // Create sample purchase orders
    const samplePurchaseOrders = [
      {
        orderNumber: 'PO-1001',
        supplier: suppliers[0]._id, // Reference to Eastern Supplies
        warehouse: warehouses[0]._id,
        items: [
          {
            product: products[0]._id,
            quantity: 10,
            unitPrice: 800,
            totalPrice: 8000,
            receivedQuantity: 10
          },
          {
            product: products[1]._id,
            quantity: 20,
            unitPrice: 15,
            totalPrice: 300,
            receivedQuantity: 20
          }
        ],
        status: 'received',
        orderDate: new Date(),
        expectedDeliveryDate: new Date(),
        actualDeliveryDate: new Date(),
        subtotal: 8300,
        tax: 830,
        discount: 100,
        totalAmount: 9030,
        notes: 'Initial stock purchase',
        createdBy: users[0]._id
      },
      {
        orderNumber: 'PO-1002',
        supplier: suppliers[1]._id, // Reference to Sunrise Traders
        warehouse: warehouses[1]._id,
        items: [
          {
            product: products[2]._id,
            quantity: 50,
            unitPrice: 8,
            totalPrice: 400,
            receivedQuantity: 50
          },
          {
            product: products[3]._id,
            quantity: 15,
            unitPrice: 25,
            totalPrice: 375,
            receivedQuantity: 15
          }
        ],
        status: 'received',
        orderDate: new Date(),
        expectedDeliveryDate: new Date(),
        actualDeliveryDate: new Date(),
        subtotal: 775,
        tax: 77.5,
        discount: 0,
        totalAmount: 852.5,
        notes: 'Restock for summer season',
        createdBy: users[0]._id
      }
    ];

    await PurchaseOrder.create(samplePurchaseOrders);
    console.log('Created sample purchase orders');

    // Create sample sales orders (for shipping linkage)
    const sampleSalesOrders = [
      {
        orderNumber: 'SO-2001',
        customer: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: {
            street: '123 Main St', city: 'New York', state: 'NY', zipCode: '10001', country: 'USA'
          }
        },
        warehouse: warehouses[0]._id,
        items: [
          { product: products[0]._id, quantity: 2, unitPrice: 1200, totalPrice: 2400, shippedQuantity: 2 },
          { product: products[1]._id, quantity: 5, unitPrice: 25, totalPrice: 125, shippedQuantity: 5 }
        ],
        status: 'shipped',
        orderDate: new Date(),
        expectedDeliveryDate: new Date(),
        actualDeliveryDate: null,
        subtotal: 2525,
        tax: 252.5,
        discount: 0,
        totalAmount: 2777.5,
        notes: 'First sales order',
        createdBy: users[0]._id
      },
      {
        orderNumber: 'SO-2002',
        customer: {
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '555-5678',
          address: {
            street: '456 Park Ave', city: 'Boston', state: 'MA', zipCode: '02101', country: 'USA'
          }
        },
        warehouse: warehouses[1]._id,
        items: [
          { product: products[2]._id, quantity: 3, unitPrice: 20, totalPrice: 60, shippedQuantity: 3 }
        ],
        status: 'shipped',
        orderDate: new Date(),
        expectedDeliveryDate: new Date(),
        actualDeliveryDate: null,
        subtotal: 60,
        tax: 6,
        discount: 0,
        totalAmount: 66,
        notes: 'Second sales order',
        createdBy: users[0]._id
      },
      {
        orderNumber: 'SO-2003',
        customer: {
          name: 'Alice Brown',
          email: 'alice@example.com',
          phone: '555-9999',
          address: {
            street: '789 Broadway', city: 'San Francisco', state: 'CA', zipCode: '94133', country: 'USA'
          }
        },
        warehouse: warehouses[0]._id,
        items: [
          { product: products[3]._id, quantity: 1, unitPrice: 45, totalPrice: 45, shippedQuantity: 1 }
        ],
        status: 'draft',
        orderDate: new Date(),
        expectedDeliveryDate: new Date(),
        actualDeliveryDate: null,
        subtotal: 45,
        tax: 4.5,
        discount: 0,
        totalAmount: 49.5,
        notes: 'Third sales order',
        createdBy: users[0]._id
      }
    ];
    const salesOrders = await SalesOrder.create(sampleSalesOrders);
    console.log('Created sample sales orders');

    // Link shipping records to sales orders
    const shippingToInsert = sampleShipping.map((ship, idx) => ({
      ...ship,
      order: salesOrders[idx % salesOrders.length]._id
    }));
    await Shipping.create(shippingToInsert);
    console.log('Created sample shipping records');

    console.log('\n=== Seed Data Summary ===');
    console.log(`Users created: ${users.length}`);
    console.log(`Manufacturers created: ${suppliers.length}`); // Using suppliers length since manufacturers is unused
    console.log(`Suppliers created: ${suppliers.length}`);
    console.log(`Categories created: ${categories.length}`);
    console.log(`Warehouses created: ${warehouses.length}`);
    console.log(`Products created: ${products.length}`);
    console.log(`Inventory records created: ${inventoryRecords.length}`);
    
    console.log('\n=== Demo Login Credentials ===');
    console.log('Admin: admin@demo.com / password123');
    console.log('Manager: manager@demo.com / password123');
    console.log('Staff: staff@demo.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
