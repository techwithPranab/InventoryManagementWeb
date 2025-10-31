// API configuration for centralized endpoint management
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export const api = {
  buildUrl: (endpoint: string): string => {
    if (API_BASE_URL) {
      // Remove leading slash from endpoint if present
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
      return `${API_BASE_URL}/${cleanEndpoint}`;
    }
    // Fallback to relative URLs for same-origin requests
    return endpoint;
  },

  // Admin Web internal APIs (same-origin)
  auth: {
    login: () => '/api/auth/login',
    signup: () => '/api/auth/signup',
    me: () => '/api/auth/me',
  },

  admin: {
    users: (params?: string) => params ? `/api/admin/users?${params}` : '/api/admin/users',
    userById: (userId: string) => `/api/admin/users/${userId}`,
  },

  // Backend APIs (external, use buildUrl)
  backend: {
    inventorySetup: () => '/api/admin/inventory-setup',
    inventoryStatus: (userId: string) => `/api/admin/inventory-setup/${userId}`,
  },
};
