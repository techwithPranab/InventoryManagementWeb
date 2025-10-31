import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Category from '@/models/Category';
import Warehouse from '@/models/Warehouse';
import Product from '@/models/Product';
import Inventory from '@/models/Inventory';
import jwt from 'jsonwebtoken';

// Helper function to verify admin authentication
async function verifyAdminAuth(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    await dbConnect();
    const user = await User.findById(decoded.userId);
    
    if (!user || user.role !== 'admin') {
      return null;
    }

    return { userId: user._id, role: user.role };
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

// Helper function to create categories
async function createCategories(categories: any[], userId: string) {
  const createdCategories = [];
  if (categories && categories.length > 0) {
    for (const categoryData of categories) {
      const category = new Category({
        ...categoryData,
        createdBy: userId
      });
      await category.save();
      createdCategories.push(category);
    }
  }
  return createdCategories;
}

// Helper function to create warehouses
async function createWarehouses(warehouses: any[], userId: string) {
  const createdWarehouses = [];
  if (warehouses && warehouses.length > 0) {
    for (const warehouseData of warehouses) {
      const warehouse = new Warehouse({
        ...warehouseData,
        createdBy: userId
      });
      await warehouse.save();
      createdWarehouses.push(warehouse);
    }
  }
  return createdWarehouses;
}

// Helper function to create products and inventory
async function createProductsAndInventory(products: any[], warehouses: any[], userId: string) {
  const createdProducts = [];
  if (products && products.length > 0) {
    for (const productData of products) {
      // Create product
      const product = new Product({
        ...productData,
        createdBy: userId
      });
      await product.save();
      createdProducts.push(product);

      // Create initial inventory for each warehouse
      if (warehouses.length > 0) {
        for (const warehouse of warehouses) {
          const inventory = new Inventory({
            productId: product._id,
            warehouseId: warehouse._id,
            quantity: productData.initialQuantity || 0,
            reorderLevel: productData.reorderLevel || product.minStockLevel,
            maxStockLevel: productData.maxStockLevel || 1000,
            createdBy: userId
          });
          await inventory.save();
        }
      }
    }
  }
  return createdProducts;
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authUser = await verifyAdminAuth(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId, setupData } = await request.json();

    if (!userId || !setupData) {
      return NextResponse.json(
        { error: 'User ID and setup data are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find the user to setup inventory for
    const user = await User.findById(userId);
    if (!user || user.status !== 'approved') {
      return NextResponse.json(
        { error: 'User not found or not approved' },
        { status: 404 }
      );
    }

    // Start the setup process
    const { categories, warehouses, products } = setupData;

    // Create all components
    const createdCategories = await createCategories(categories, userId);
    const createdWarehouses = await createWarehouses(warehouses, userId);
    const createdProducts = await createProductsAndInventory(products, createdWarehouses, userId);

    // Update user's inventory setup status
    await User.findByIdAndUpdate(userId, {
      'inventorySetup.isCompleted': true,
      'inventorySetup.warehouseCreated': createdWarehouses.length > 0,
      'inventorySetup.initialProductsAdded': createdProducts.length > 0,
      'inventorySetup.setupCompletedAt': new Date()
    });

    return NextResponse.json({
      message: 'Inventory setup completed successfully',
      setup: {
        categories: createdCategories.length,
        warehouses: createdWarehouses.length,
        products: createdProducts.length
      }
    });

  } catch (error) {
    console.error('Inventory setup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get inventory setup status for a user
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authUser = await verifyAdminAuth(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Get user and inventory counts
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const [categoriesCount, warehousesCount, productsCount, inventoryCount] = await Promise.all([
      Category.countDocuments({ createdBy: userId }),
      Warehouse.countDocuments({ createdBy: userId }),
      Product.countDocuments({ createdBy: userId }),
      Inventory.countDocuments({ createdBy: userId })
    ]);

    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
        inventorySetup: user.inventorySetup
      },
      counts: {
        categories: categoriesCount,
        warehouses: warehousesCount,
        products: productsCount,
        inventory: inventoryCount
      }
    });

  } catch (error) {
    console.error('Get inventory setup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
