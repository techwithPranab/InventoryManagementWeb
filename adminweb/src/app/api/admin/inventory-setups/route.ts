import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import InventorySetup from '@/models/InventorySetup';
import User from '@/models/User';
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

// GET /api/admin/inventory-setups - Get all inventory setups
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

    await dbConnect();

    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const subscriptionPlan = searchParams.get('subscriptionPlan');
    const page = Number.parseInt(searchParams.get('page') || '1');
    const limit = Number.parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build filter query
    const filter: any = {};
    if (status) filter.setupStatus = status;
    if (subscriptionPlan) filter.subscriptionPlan = subscriptionPlan;

    // Get inventory setups with pagination
    const inventorySetups = await InventorySetup.find(filter)
      .populate('setupBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await InventorySetup.countDocuments(filter);

    // Get summary statistics
    const stats = await InventorySetup.aggregate([
      {
        $group: {
          _id: '$setupStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const summary = {
      total: 0,
      pending: 0,
      in_progress: 0,
      completed: 0,
      failed: 0
    };

    stats.forEach(stat => {
      summary.total += stat.count;
      if (stat._id in summary) {
        (summary as any)[stat._id] = stat.count;
      }
    });

    return NextResponse.json({
      setups: inventorySetups,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      summary
    });

  } catch (error) {
    console.error('Admin inventory setups API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
