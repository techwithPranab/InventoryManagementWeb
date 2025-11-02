import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import InventorySetup from '@/models/InventorySetup';
import jwt from 'jsonwebtoken';

// Helper function to verify authentication
async function verifyAuth(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    await dbConnect();
    // For now, just verify the token is valid - we can add user verification later if needed
    return decoded;
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

// GET /api/inventory-setups - Get inventory setups (optionally filtered by email)
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authUser = await verifyAuth(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const page = Number.parseInt(searchParams.get('page') || '1');
    const limit = Number.parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build filter query
    const filter: any = {};
    if (email) {
      filter.email = email;
    }

    // Get inventory setups
    const inventorySetups = await InventorySetup.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await InventorySetup.countDocuments(filter);

    return NextResponse.json({
      setups: inventorySetups,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Inventory setups API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
