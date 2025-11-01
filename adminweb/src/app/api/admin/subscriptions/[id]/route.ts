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

// GET /api/admin/subscriptions/[id] - Get single subscription plan
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const plan = await SubscriptionPlan.findById(id);

    if (!plan) {
      return NextResponse.json(
        { message: 'Subscription plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ plan });
  } catch (error) {
    console.error('Error fetching subscription plan:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/subscriptions/[id] - Update subscription plan
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const updateFields = { ...body };

    // Remove fields that shouldn't be updated directly
    delete updateFields._id;
    delete updateFields.createdAt;

    // Check if new name conflicts with existing plan
    if (updateFields.name) {
      const existingPlan = await SubscriptionPlan.findOne({
        name: { $regex: `^${updateFields.name}$`, $options: 'i' },
        _id: { $ne: id }
      });

      if (existingPlan) {
        return NextResponse.json(
          { message: 'Subscription plan with this name already exists' },
          { status: 400 }
        );
      }
    }

    const plan = await SubscriptionPlan.findByIdAndUpdate(
      id,
      updateFields,
      { new: true, runValidators: true }
    );

    if (!plan) {
      return NextResponse.json(
        { message: 'Subscription plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Subscription plan updated successfully',
      plan
    });
  } catch (error) {
    console.error('Error updating subscription plan:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/subscriptions/[id] - Delete subscription plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const plan = await SubscriptionPlan.findByIdAndDelete(id);

    if (!plan) {
      return NextResponse.json(
        { message: 'Subscription plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Subscription plan deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting subscription plan:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
