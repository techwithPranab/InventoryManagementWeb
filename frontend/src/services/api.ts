import axios, { AxiosResponse } from 'axios';
// Users API
export const userAPI = {
  getAll: (params?: any) => api.get('/users', { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  changePassword: (id: string, password: string) => api.put(`/users/${id}/password`, { password }),
};

// Manufacturers API
export const manufacturersAPI = {
  getAll: (params?: any) => api.get('/manufacturers', { params }),
  getById: (id: string) => api.get(`/manufacturers/${id}`),
  create: (data: any) => api.post('/manufacturers', data),
  update: (id: string, data: any) => api.put(`/manufacturers/${id}`, data),
  delete: (id: string) => api.delete(`/manufacturers/${id}`),
};

// Suppliers API
export const suppliersAPI = {
  getAll: (params?: any) => api.get('/suppliers', { params }),
  getById: (id: string) => api.get(`/suppliers/${id}`),
  create: (data: any) => api.post('/suppliers', data),
  update: (id: string, data: any) => api.put(`/suppliers/${id}`, data),
  delete: (id: string) => api.delete(`/suppliers/${id}`),
};



const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const ADMINWEB_API_URL = process.env.REACT_APP_ADMINWEB_API_URL || 'http://localhost:5001/api';

// Create axios instance for backend
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create axios instance for AdminBackend
const adminWebAPI = axios.create({
  baseURL: ADMINWEB_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and client code
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const clientCode = localStorage.getItem('clientCode');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (clientCode) {
      config.headers['X-Client-Code'] = clientCode;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// AdminBackend request interceptor
adminWebAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('clientCode');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// AdminBackend response interceptor
adminWebAPI.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('clientCode');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API - Use AdminBackend for authentication
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    adminWebAPI.post('/auth/login', credentials),
  getProfile: () => adminWebAPI.get('/auth/me'),
  updateProfile: (data: any) => adminWebAPI.put('/auth/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    adminWebAPI.put('/auth/change-password', data),
  // Get client inventory setup data
  getInventorySetup: (email: string) =>
    adminWebAPI.get(`/inventory-setup/email/${encodeURIComponent(email)}`),
};

// Categories API
export const categoriesAPI = {
  getAll: (params?: any) => api.get('/categories', { params }),
  getById: (id: string) => api.get(`/categories/${id}`),
  create: (data: any) => api.post('/categories', data),
  update: (id: string, data: any) => api.put(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
  getProducts: (id: string, params?: any) => api.get(`/categories/${id}/products`, { params }),
};

// Products API
export const productsAPI = {
  getAll: (params?: any) => api.get('/products', { params }),
  getById: (id: string) => api.get(`/products/${id}`),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
  getLowStock: (params?: any) => api.get('/products/reports/low-stock', { params }),
  search: (query: string, limit?: number) => 
    api.get('/products/search/text', { params: { q: query, limit } }),
};

// Warehouses API
export const warehousesAPI = {
  getAll: (params?: any) => api.get('/warehouses', { params }),
  getById: (id: string) => api.get(`/warehouses/${id}`),
  create: (data: any) => api.post('/warehouses', data),
  update: (id: string, data: any) => api.put(`/warehouses/${id}`, data),
  delete: (id: string) => api.delete(`/warehouses/${id}`),
  getInventory: (id: string, params?: any) => api.get(`/warehouses/${id}/inventory`, { params }),
  updateInventory: (warehouseId: string, productId: string, data: any) =>
    api.put(`/warehouses/${warehouseId}/inventory/${productId}`, data),
  getAnalytics: (id: string, period?: string) => 
    api.get(`/warehouses/${id}/analytics`, { params: { period } }),
  
  // Inventory Transfer APIs
  createTransfer: (data: any) => api.post('/warehouses/transfer', data),
  getTransfers: (params?: any) => api.get('/warehouses/transfers', { params }),
  approveTransfer: (id: string) => api.put(`/warehouses/transfers/${id}/approve`),
  completeTransfer: (id: string) => api.put(`/warehouses/transfers/${id}/complete`),
  cancelTransfer: (id: string) => api.delete(`/warehouses/transfers/${id}`),
};

// Purchase Orders API
export const purchasesAPI = {
  getAll: (params?: any) => api.get('/purchases', { params }),
  getById: (id: string) => api.get(`/purchases/${id}`),
  create: (data: any) => api.post('/purchases', data),
  update: (id: string, data: any) => api.put(`/purchases/${id}`, data),
  delete: (id: string) => api.delete(`/purchases/${id}`),
  receive: (id: string, data: any) => api.post(`/purchases/${id}/receive`, data),
  getSummary: (params?: any) => api.get('/purchases/reports/summary', { params }),
  getMetrics: (period?: string) => api.get('/purchases/metrics', { params: { period } }),
  submitForApproval: (id: string) => api.post(`/purchases/${id}/submit-for-approval`),
  approve: (id: string) => api.post(`/purchases/${id}/approve`),
  reject: (id: string, data: { reason: string }) => api.post(`/purchases/${id}/reject`, data),
  // Workflow transitions
  markSent: (id: string) => api.post(`/purchases/${id}/mark-sent`),
  markConfirmed: (id: string) => api.post(`/purchases/${id}/mark-confirmed`),
  markPartial: (id: string) => api.post(`/purchases/${id}/mark-partial`),
  markReceived: (id: string) => api.post(`/purchases/${id}/mark-received`),
  markCancelled: (id: string) => api.post(`/purchases/${id}/mark-cancelled`),
};

// Shipping API
export const shippingAPI = {
  getAll: (params?: any) => api.get('/shipping', { params }),
  getById: (id: string) => api.get(`/shipping/${id}`),
  create: (data: any) => api.post('/shipping', data),
  update: (id: string, data: any) => api.put(`/shipping/${id}`, data),
  delete: (id: string) => api.delete(`/shipping/${id}`),
  updateStatus: (id: string, data: { status: string, shippedDate?: string, deliveredDate?: string, estimatedDelivery?: string }) =>
    api.post(`/shipping/${id}/status`, data),
};
  
// Sales Orders API
export const salesAPI = {
  getAll: (params?: any) => api.get('/sales', { params }),
  getById: (id: string) => api.get(`/sales/${id}`),
  create: (data: any) => api.post('/sales', data),
  update: (id: string, data: any) => api.put(`/sales/${id}`, data),
  delete: (id: string) => api.delete(`/sales/${id}`),
  ship: (id: string, data: any) => api.post(`/sales/${id}/ship`, data),
  cancel: (id: string) => api.post(`/sales/${id}/cancel`),
  getSummary: (params?: any) => api.get('/sales/reports/summary', { params }),
};

// Dashboard API
export const dashboardAPI = {
  getOverview: () => api.get('/dashboard/overview'),
  getRecentActivities: (limit?: number) => 
    api.get('/dashboard/recent-activities', { params: { limit } }),
  getInventoryAlerts: () => api.get('/dashboard/inventory-alerts'),
  getTopProducts: (period?: string) => 
    api.get('/dashboard/top-products', { params: { period } }),
  getSalesChart: (period?: string) => 
    api.get('/dashboard/sales-chart', { params: { period } }),
  getWarehouseSummary: () => api.get('/dashboard/warehouse-summary'),
};

// Inventory API
export const inventoryAPI = {
  getAll: (params?: any) => api.get('/inventory', { params }),
  getSummary: (params?: any) => api.get('/inventory/summary', { params }),
  getAlerts: (params?: any) => api.get('/inventory/alerts', { params }),
  getMovements: (params?: any) => api.get('/inventory/movements', { params }),
  getValuation: (params?: any) => api.get('/inventory/valuation', { params }),
  createAdjustment: (data: any) => api.post('/inventory/adjustment', data),
  bulkUpdate: (data: any) => api.post('/inventory/bulk-update', data),
};

export default api;
