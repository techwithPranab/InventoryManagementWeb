import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SubscriptionPlan from '@/models/SubscriptionPlan';

// GET /api/subscriptions - Get active subscription plans for public pricing page
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Only fetch active plans for public display
    const plans = await SubscriptionPlan.find({ isActive: true })
      .sort({ price: 1 }) // Sort by price ascending
      .select('name description price currency billingCycle features maxProducts maxWarehouses maxUsers');

    return NextResponse.json({
      plans
    });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
