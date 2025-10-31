import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

async function verifyAdminAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.substring(7);
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
  
  await dbConnect();
  const user = await User.findById(decoded.userId);
  
  if (!user || user.role !== 'admin') {
    throw new Error('Admin access required');
  }
  
  return user;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdminAuth(request);
    
    const { id } = await params;
    const body = await request.json();
    const { clientCode, industry, databaseName } = body;

    await dbConnect();

    // Update user's inventory setup information
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        $set: {
          'inventorySetup.isCompleted': true,
          'inventorySetup.clientCode': clientCode,
          'inventorySetup.industry': industry,
          'inventorySetup.databaseName': databaseName,
          'inventorySetup.setupCompletedAt': new Date()
        }
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'User inventory setup updated successfully',
      user: updatedUser
    });

  } catch (error: any) {
    console.error('Update inventory setup error:', error);
    
    if (error.message === 'No token provided' || error.message === 'Admin access required') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
