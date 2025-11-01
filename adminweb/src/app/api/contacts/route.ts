import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ContactModel from '@/models/ContactModel';

// GET /api/contacts - Get contact information (Public)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const contact = await ContactModel.findOne().lean();

    if (!contact) {
      // Return default contact information if none exists
      return NextResponse.json({
        email: 'contact@inventorysystem.com',
        phone: '+1 (555) 123-4567',
        address: '123 Business Street, Suite 100, Business City, BC 12345',
        privacyEmail: 'privacy@inventorysystem.com',
        legalEmail: 'legal@inventorysystem.com',
        supportEmail: 'support@inventorysystem.com',
        businessName: 'Inventory Management System'
      });
    }

    return NextResponse.json(contact);
  } catch (error) {
    console.error('Error fetching contact:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}
