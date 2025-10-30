import api from './api';

export const shippingAPI = {
  getAll: (params?: any) => api.get('/shipping', { params }),
  getById: (id: string) => api.get(`/shipping/${id}`),
  create: (data: any) => api.post('/shipping', data),
  update: (id: string, data: any) => api.put(`/shipping/${id}`, data),
  delete: (id: string) => api.delete(`/shipping/${id}`),
  updateStatus: (id: string, data: { status: string, shippedDate?: string, deliveredDate?: string, estimatedDelivery?: string }) =>
    api.post(`/shipping/${id}/status`, data),
};

export default shippingAPI;
