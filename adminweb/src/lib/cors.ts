import { NextRequest, NextResponse } from 'next/server';

// CORS configuration
const corsOptions = {
  'Access-Control-Allow-Origin': 'http://localhost:4002',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

export function corsMiddleware(response: NextResponse) {
  // Add CORS headers to the response
  Object.entries(corsOptions).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export function handleCorsPreflightRequest(request: NextRequest) {
  // Handle OPTIONS (preflight) requests
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 });
    return corsMiddleware(response);
  }
  return null;
}
