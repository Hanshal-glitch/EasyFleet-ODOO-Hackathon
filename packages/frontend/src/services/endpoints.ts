import api from './api';

export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  register: (data: { email: string; password: string; firstName: string; lastName: string; role: string }) =>
    api.post('/auth/register', data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
};

export const vehicleApi = {
  list: (params?: any) => api.get('/vehicles', { params }),
  get: (id: string) => api.get(`/vehicles/${id}`),
  create: (data: any) => api.post('/vehicles', data),
  update: (id: string, data: any) => api.patch(`/vehicles/${id}`, data),
  retire: (id: string) => api.delete(`/vehicles/${id}`),
  availableForDispatch: (params?: { cargoWeightKg?: number }) =>
    api.get('/vehicles/available-for-dispatch', { params }),
};

export const driverApi = {
  list: (params?: any) => api.get('/drivers', { params }),
  get: (id: string) => api.get(`/drivers/${id}`),
  create: (data: any) => api.post('/drivers', data),
  update: (id: string, data: any) => api.patch(`/drivers/${id}`, data),
  delete: (id: string) => api.delete(`/drivers/${id}`),
  availableForDispatch: () => api.get('/drivers/available-for-dispatch'),
  expiringLicenses: (params?: { days?: number }) => api.get('/drivers/expiring-licenses', { params }),
};

export const tripApi = {
  list: (params?: any) => api.get('/trips', { params }),
  get: (id: string) => api.get(`/trips/${id}`),
  create: (data: any) => api.post('/trips', data),
  dispatch: (id: string) => api.post(`/trips/${id}/dispatch`),
  complete: (id: string, data: any) => api.post(`/trips/${id}/complete`, data),
  cancel: (id: string, reason: string) => api.post(`/trips/${id}/cancel`, { reason }),
  stats: (params?: any) => api.get('/trips/stats', { params }),
  availableVehicles: (params?: { cargoWeightKg?: number }) =>
    api.get('/trips/available-vehicles', { params }),
  availableDrivers: () => api.get('/trips/available-drivers'),
};

export const maintenanceApi = {
  list: (params?: any) => api.get('/maintenance', { params }),
  get: (id: string) => api.get(`/maintenance/${id}`),
  create: (data: any) => api.post('/maintenance', data),
  close: (id: string, data: any) => api.post(`/maintenance/${id}/close`, data),
  vehicleHistory: (vehicleId: string) => api.get(`/maintenance/vehicle/${vehicleId}/history`),
};

export const fuelApi = {
  list: (params?: any) => api.get('/fuel', { params }),
  get: (id: string) => api.get(`/fuel/${id}`),
  create: (data: any) => api.post('/fuel', data),
};

export const expenseApi = {
  list: (params?: any) => api.get('/expenses', { params }),
  create: (data: any) => api.post('/expenses', data),
  vehicleOperationalCost: (vehicleId: string, params?: any) =>
    api.get(`/expenses/vehicle/${vehicleId}/operational-cost`, { params }),
};

export const dashboardApi = {
  kpis: (params?: any) => api.get('/dashboard/kpis', { params }),
  charts: (params?: any) => api.get('/dashboard/charts', { params }),
};

export const reportApi = {
  fuelEfficiency: (params?: any) => api.get('/reports/fuel-efficiency', { params }),
  fleetUtilization: (params?: any) => api.get('/reports/fleet-utilization', { params }),
  operationalCost: (params?: any) => api.get('/reports/operational-cost', { params }),
  vehicleROI: (params?: any) => api.get('/reports/vehicle-roi', { params }),
  export: (params: { reportType: string; format: 'csv' | 'pdf' } & any) =>
    api.get('/reports/export', { params, responseType: 'blob' }),
};

export const documentApi = {
  list: (params?: any) => api.get('/documents', { params }),
  create: (data: FormData) => api.post('/documents', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: string) => api.delete(`/documents/${id}`),
  expiring: (params?: { days?: number }) => api.get('/documents/expiring', { params }),
};

export const userApi = {
  list: (params?: any) => api.get('/users', { params }),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.patch(`/users/${id}`, data),
};