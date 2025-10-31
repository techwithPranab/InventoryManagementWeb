import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export interface AdminAuthenticatedRequest extends NextRequest {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

/**
 * Middleware to verify admin authentication and permissions
 */
export function withAdminAuth<T = any>(handler: (req: AdminAuthenticatedRequest, context?: T) => Promise<Response>) {
  return async (req: AdminAuthenticatedRequest, context?: T): Promise<Response> => {
    try {
      await dbConnect();

      const authHeader = req.headers.get('authorization');
      const token = extractTokenFromHeader(authHeader);

      if (!token) {
        return NextResponse.json(
          { error: 'Access token is missing' },
          { status: 401 }
        );
      }

      const tokenPayload = verifyToken(token);
      if (!tokenPayload) {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        );
      }

      // Verify user exists and is active
      const user = await User.findById(tokenPayload.userId);
      if (!user?.isActive || user.status !== 'approved') {
        return NextResponse.json(
          { error: 'User account is not active or approved' },
          { status: 401 }
        );
      }

      // Check if user has admin role
      if (user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }

      req.user = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role
      };

      return handler(req, context);
    } catch {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }
  };
}

/**
 * Middleware to check if user has admin or manager role
 */
export function withManagerAuth<T = any>(handler: (req: AdminAuthenticatedRequest, context?: T) => Promise<Response>) {
  return async (req: AdminAuthenticatedRequest, context?: T): Promise<Response> => {
    try {
      await dbConnect();

      const authHeader = req.headers.get('authorization');
      const token = extractTokenFromHeader(authHeader);

      if (!token) {
        return NextResponse.json(
          { error: 'Access token is missing' },
          { status: 401 }
        );
      }

      const tokenPayload = verifyToken(token);
      if (!tokenPayload) {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        );
      }

      // Verify user exists and is active
      const user = await User.findById(tokenPayload.userId);
      if (!user?.isActive || user.status !== 'approved') {
        return NextResponse.json(
          { error: 'User account is not active or approved' },
          { status: 401 }
        );
      }

      // Check if user has admin or manager role
      if (!['admin', 'manager'].includes(user.role)) {
        return NextResponse.json(
          { error: 'Manager or admin access required' },
          { status: 403 }
        );
      }

      req.user = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role
      };

      return handler(req, context);
    } catch {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }
  };
}
