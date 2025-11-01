import jwt from 'jsonwebtoken';

/**
 * Generate a JWT token for backend API calls (server-side only)
 */
export function generateBackendAdminToken(): string {
  try {
    const token = jwt.sign(
      {
        userId: 'admin',
        role: 'admin',
        email: 'admin@system.local'
      },
      process.env.JWT_SECRET || 'inventory_management_secret_key_2025_secure_token_generator',
      { expiresIn: '1h' }
    );
    
    return token;
  } catch (error) {
    console.error('Error generating backend admin token:', error);
    throw new Error('Failed to generate backend admin token');
  }
}
