import { NextRequest } from 'next/server';
import { verifyToken, extractTokenFromHeader, JWTPayload } from '@/lib/auth';

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

/**
 * Middleware to verify JWT token and attach user info to request
 */
export function withAuth(handler: (req: AuthenticatedRequest) => Promise<Response>) {
  return async (req: AuthenticatedRequest): Promise<Response> => {
    try {
      const authHeader = req.headers.get('authorization');
      const token = extractTokenFromHeader(authHeader);

      if (!token) {
        return new Response(
          JSON.stringify({ error: 'Access token is missing' }),
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      const user = verifyToken(token);
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Invalid or expired token' }),
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      req.user = user;
      return handler(req);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  };
}

/**
 * Middleware to check if user has required role
 */
export function withRole(roles: string[]) {
  return function(handler: (req: AuthenticatedRequest) => Promise<Response>) {
    return withAuth(async (req: AuthenticatedRequest): Promise<Response> => {
      if (!req.user || !roles.includes(req.user.role)) {
        return new Response(
          JSON.stringify({ error: 'Insufficient permissions' }),
          { 
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      return handler(req);
    });
  };
}
