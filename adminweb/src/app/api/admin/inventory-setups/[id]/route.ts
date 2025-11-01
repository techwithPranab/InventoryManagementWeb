import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import InventorySetup from '@/models/InventorySetup';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

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

// GET /api/admin/inventory-setups/[id] - Get specific inventory setup
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    // Verify admin authentication
    const authUser = await verifyAdminAuth(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const { id } = params;

    await dbConnect();

    // Get specific inventory setup
    const inventorySetup = await InventorySetup.findById(id)
      .populate('setupBy', 'name email');

    if (!inventorySetup) {
      return NextResponse.json(
        { error: 'Inventory setup not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ inventorySetup });

  } catch (error) {
    console.error('Admin inventory setup fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/inventory-setups/[id] - Update inventory setup
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    // Verify admin authentication
    const authUser = await verifyAdminAuth(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const { id } = params;
    const updateData = await request.json();

    await dbConnect();

    // Find and update the inventory setup
    const inventorySetup = await InventorySetup.findByIdAndUpdate(
      id,
      { 
        ...updateData, 
        updatedAt: new Date() 
      },
      { new: true }
    ).populate('setupBy', 'name email');

    if (!inventorySetup) {
      return NextResponse.json(
        { error: 'Inventory setup not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Inventory setup updated successfully',
      inventorySetup
    });

  } catch (error) {
    console.error('Admin inventory setup update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/inventory-setups/[id] - Delete inventory setup
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    // Verify admin authentication
    const authUser = await verifyAdminAuth(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const { id } = params;

    await dbConnect();

    // Find and delete the inventory setup
    const inventorySetup = await InventorySetup.findByIdAndDelete(id);

    if (!inventorySetup) {
      return NextResponse.json(
        { error: 'Inventory setup not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Inventory setup deleted successfully'
    });

  } catch (error) {
    console.error('Admin inventory setup delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
