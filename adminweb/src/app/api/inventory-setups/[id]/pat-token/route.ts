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
    return decoded;
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

// POST /api/inventory-setups/[id]/pat-token - Generate PAT token
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authUser = await verifyAuth(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { id } = await params;
    const body = await request.json();
    const { expiryDays = 90 } = body;

    // Validate expiry days
    if (expiryDays < 1 || expiryDays > 365) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: [{ msg: 'Expiry days must be between 1 and 365' }]
        },
        { status: 400 }
      );
    }

    // Find inventory setup
    const setup = await InventorySetup.findById(id);
    if (!setup) {
      return NextResponse.json(
        { success: false, message: 'Inventory setup not found' },
        { status: 404 }
      );
    }

    // Generate PAT token
    await setup.generatePATToken(expiryDays);

    return NextResponse.json({
      success: true,
      message: 'PAT token generated successfully',
      data: {
        token: setup.patToken.token,
        expiryDate: setup.patToken.expiryDate,
        createdAt: setup.patToken.createdAt
      }
    });

  } catch (error) {
    console.error('PAT token generation error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/inventory-setups/[id]/pat-token - Get PAT token info
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authUser = await verifyAuth(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { id } = await params;

    // Find inventory setup
    const setup = await InventorySetup.findById(id);
    if (!setup) {
      return NextResponse.json(
        { success: false, message: 'Inventory setup not found' },
        { status: 404 }
      );
    }

    // Check if PAT token exists
    if (!setup.patToken || !setup.patToken.token) {
      return NextResponse.json({
        success: true,
        data: {
          hasToken: false,
          message: 'No PAT token found'
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        hasToken: true,
        token: setup.patToken.token,
        expiryDate: setup.patToken.expiryDate,
        createdAt: setup.patToken.createdAt,
        lastUsedAt: setup.patToken.lastUsedAt,
        isActive: setup.patToken.isActive,
        isValid: setup.isPATTokenValid()
      }
    });

  } catch (error) {
    console.error('PAT token info error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/inventory-setups/[id]/pat-token - Revoke PAT token
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authUser = await verifyAuth(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { id } = await params;

    // Find inventory setup
    const setup = await InventorySetup.findById(id);
    if (!setup) {
      return NextResponse.json(
        { success: false, message: 'Inventory setup not found' },
        { status: 404 }
      );
    }

    // Check if PAT token exists
    if (!setup.patToken || !setup.patToken.token) {
      return NextResponse.json(
        { success: false, message: 'No PAT token found to revoke' },
        { status: 404 }
      );
    }

    // Revoke PAT token
    await setup.revokePATToken();

    return NextResponse.json({
      success: true,
      message: 'PAT token revoked successfully'
    });

  } catch (error) {
    console.error('PAT token revocation error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
