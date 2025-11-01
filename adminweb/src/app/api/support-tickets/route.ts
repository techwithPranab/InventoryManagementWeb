import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SupportTicketModel from '@/models/SupportTicketModel';

// POST /api/support-tickets - Create a new support ticket
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { customerName, customerEmail, subject, category, priority = 'medium', message } = body;

    // Basic validation
    if (!customerName || !customerEmail || !subject || !category || !message) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const ticket = new SupportTicketModel({
      ticketNumber: `TICKET-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
      customerName,
      customerEmail,
      subject,
      category,
      priority,
      message,
      source: 'web-form'
    });

    await ticket.save();

    return NextResponse.json({
      message: 'Support ticket created successfully',
      ticket: {
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
        priority: ticket.priority,
        createdAt: ticket.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}
