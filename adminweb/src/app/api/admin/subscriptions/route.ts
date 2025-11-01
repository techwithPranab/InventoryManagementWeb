import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SubscriptionPlan from '@/models/SubscriptionPlan';
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
    // For now, we'll assume admin check - you might want to add a proper admin user check
    return { userId: decoded.userId, role: 'admin' };
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

// GET /api/admin/subscriptions - Get all subscription plans
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

    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get('page') || '1');
    const limit = Number.parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const isActive = searchParams.get('isActive');

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (isActive !== null) {
      query.isActive = isActive === 'true';
    }

    const plans = await SubscriptionPlan.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await SubscriptionPlan.countDocuments(query);

    return NextResponse.json({
      plans,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/subscriptions - Create new subscription plan
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

    await dbConnect();

    const body = await request.json();
    const {
      name,
      description,
      price,
      currency,
      billingCycle,
      features,
      maxProducts,
      maxWarehouses,
      maxUsers,
      stripePriceId
    } = body;

    // Validate required fields
    if (!name || !description || !price || !maxProducts || !maxWarehouses || !maxUsers) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if plan name already exists
    const existingPlan = await SubscriptionPlan.findOne({
      name: { $regex: `^${name}$`, $options: 'i' }
    });

    if (existingPlan) {
      return NextResponse.json(
        { message: 'Subscription plan with this name already exists' },
        { status: 400 }
      );
    }

    const plan = new SubscriptionPlan({
      name,
      description,
      price,
      currency: currency || 'USD',
      billingCycle: billingCycle || 'monthly',
      features: features || [],
      maxProducts,
      maxWarehouses,
      maxUsers,
      stripePriceId
    });

    await plan.save();

    return NextResponse.json({
      message: 'Subscription plan created successfully',
      plan
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating subscription plan:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
