import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';

async function handler(req: AuthenticatedRequest) {
  try {
    await dbConnect();

    // Get user from database using ID from JWT token
    const user = await User.findById(req.user!.userId).select('-password');

    if (!user?.isActive) {
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mobileNo: user.mobileNo,
        createdAt: user.createdAt
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Get user profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler);
