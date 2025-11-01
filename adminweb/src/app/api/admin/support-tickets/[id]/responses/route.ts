import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SupportTicketModel from '@/models/SupportTicketModel';

// POST /api/admin/support-tickets/[id]/responses - Add a response to a support ticket
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;
    const body = await request.json();
    const { message, isInternal = false } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { message: 'Message is required' },
        { status: 400 }
      );
    }

    const ticket = await SupportTicketModel.findById(id);

    if (!ticket) {
      return NextResponse.json(
        { message: 'Support ticket not found' },
        { status: 404 }
      );
    }

    // For now, we'll use a mock admin user. In a real app, you'd get this from authentication
    const mockAdminUser = {
      _id: '507f1f77bcf86cd799439011', // Mock ObjectId
      name: 'Admin User',
      email: 'admin@adminweb.com',
      role: 'admin'
    };

    const response = {
      message: message.trim(),
      author: {
        _id: mockAdminUser._id,
        name: mockAdminUser.name,
        email: mockAdminUser.email,
        role: mockAdminUser.role
      },
      isInternal,
      createdAt: new Date()
    };

    ticket.responses.push(response);
    await ticket.save();

    return NextResponse.json({
      message: 'Response added successfully',
      response
    });
  } catch (error) {
    console.error('Error adding response:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}
