const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export const api = {
  baseURL: API_BASE_URL,

  // Helper function to build full API URLs
  buildUrl: (endpoint: string): string => {
    // If endpoint starts with http, it's already a full URL
    if (endpoint.startsWith('http')) {
      return endpoint;
    }

    // If API_BASE_URL is set, use it, otherwise use relative URLs
    if (API_BASE_URL) {
      return `${API_BASE_URL}${endpoint}`;
    }

    // Default to relative URLs (same origin)
    return endpoint;
  },

  // Admin Web internal APIs (same-origin)
  auth: {
    login: '/api/auth/login',
    signup: '/api/auth/signup',
    me: '/api/auth/me',
  },

  admin: {
    users: (params?: string) => params ? `/api/admin/users?${params}` : '/api/admin/users',
    userById: (userId: string) => `/api/admin/users/${userId}`,
    dashboard: '/api/admin/dashboard',
    analytics: (params?: string) => params ? `/api/admin/analytics?${params}` : '/api/admin/analytics',
    inventorySetups: (params?: string) => params ? `/api/admin/inventory-setups?${params}` : '/api/admin/inventory-setups'
  },

  // Backend APIs (external, use buildUrl)
  backend: {
    inventorySetup: '/api/inventory-setup',
  },

  // Subscription endpoints
  subscriptions: '/api/subscriptions'
};

export default api;
