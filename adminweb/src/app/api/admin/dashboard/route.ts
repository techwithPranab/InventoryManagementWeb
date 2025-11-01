import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import SubscriptionPlan from '@/models/SubscriptionPlan';
import InventorySetup from '@/models/InventorySetup';
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

// GET /api/admin/dashboard - Get dashboard overview statistics
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

    // Get user statistics by status
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const users = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0
    };

    userStats.forEach(stat => {
      users.total += stat.count;
      if (stat._id === 'pending') users.pending = stat.count;
      if (stat._id === 'approved') users.approved = stat.count;
      if (stat._id === 'rejected') users.rejected = stat.count;
    });

    // Get inventory setup statistics
    const inventoryStats = await InventorySetup.aggregate([
      {
        $group: {
          _id: '$setupStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const inventory = {
      totalSetups: 0,
      completedSetups: 0,
      inProgressSetups: 0,
      failedSetups: 0
    };

    inventoryStats.forEach(stat => {
      inventory.totalSetups += stat.count;
      if (stat._id === 'completed') inventory.completedSetups = stat.count;
      if (stat._id === 'in_progress') inventory.inProgressSetups = stat.count;
      if (stat._id === 'failed') inventory.failedSetups = stat.count;
    });

    // Calculate revenue from subscription plans
    const activePlans = await SubscriptionPlan.find({ isActive: true });
    const monthlyRevenue = activePlans.reduce((total, plan) => {
      return total + (plan.billingCycle === 'monthly' ? plan.price : plan.price / 12);
    }, 0);

    const yearlyRevenue = monthlyRevenue * 12;

    const revenue = {
      monthly: monthlyRevenue,
      yearly: yearlyRevenue
    };

    // Get active users count
    const activeUsers = await User.countDocuments({ isActive: true });

    const system = {
      activeUsers,
      totalRevenue: yearlyRevenue
    };

    const stats = {
      users,
      inventory,
      revenue,
      system
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
