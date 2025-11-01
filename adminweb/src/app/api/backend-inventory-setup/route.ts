import { NextRequest, NextResponse } from 'next/server';
import { generateBackendAdminToken } from '@/lib/generateBackendToken';

export async function POST(request: NextRequest) {
  try {
    const { clientCode, industry } = await request.json();
    
    if (!clientCode || !industry) {
      return NextResponse.json(
        { message: 'Client code and industry are required' },
        { status: 400 }
      );
    }

    const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000';
    
    // Generate proper JWT token for backend API call
    const adminToken = generateBackendAdminToken();
    
    const response = await fetch(`${backendApiUrl}/api/admin/inventory-setup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        userId: 'admin',
        setupData: {
          clientCode,
          industry
        }
      })
    });

    if (response.ok) {
      const result = await response.json();
      return NextResponse.json({
        success: true,
        message: 'Backend inventory database setup successful',
        data: result
      });
    } else {
      const error = await response.json();
      return NextResponse.json({
        success: false,
        message: 'Backend inventory setup failed',
        error
      }, { status: response.status });
    }
  } catch (error) {
    console.error('Error in backend inventory setup API:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
