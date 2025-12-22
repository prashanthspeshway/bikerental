const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000/api';

let authToken: string | null = localStorage.getItem('authToken');

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) localStorage.setItem('authToken', token);
  else localStorage.removeItem('authToken');
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers: { ...headers, ...(init?.headers as any) } });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `Request failed ${res.status}`);
  }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  return (await res.text()) as unknown as T;
}

export function getCurrentUser() {
  const userStr = localStorage.getItem('currentUser');
  return userStr ? JSON.parse(userStr) : null;
}

export function setCurrentUser(user: any) {
  if (user) localStorage.setItem('currentUser', JSON.stringify(user));
  else localStorage.removeItem('currentUser');
}

export const authAPI = {
  register: async (email: string, password: string, name: string) => {
    const data = await apiRequest<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    setAuthToken(data.token);
    setCurrentUser(data.user);
    return data;
  },
  login: async (email: string, password: string) => {
    const data = await apiRequest<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(data.token);
    setCurrentUser(data.user);
    return data;
  },
  logout: () => {
    setAuthToken(null);
    setCurrentUser(null);
  },
  getCurrentUser: async () => {
    const data = await apiRequest<any>('/auth/me');
    setCurrentUser(data);
    return data;
  },
};

export const bikesAPI = {
  getAll: (locationId?: string) => {
    const qs = locationId ? `?locationId=${encodeURIComponent(locationId)}` : '';
    return apiRequest<any[]>(`/bikes${qs}`);
  },
  getById: (id: string) => apiRequest<any>(`/bikes/${id}`),
  getAvailable: (startISO: string, endISO: string, locationId?: string) => {
    const params = new URLSearchParams({ start: startISO, end: endISO });
    if (locationId) params.append('locationId', locationId);
    return apiRequest<any[]>(`/bikes/available?${params.toString()}`);
  },
  create: (bike: any) => apiRequest<any>('/bikes', { method: 'POST', body: JSON.stringify(bike) }),
  update: (id: string, bike: any) => apiRequest<any>(`/bikes/${id}`, { method: 'PUT', body: JSON.stringify(bike) }),
  delete: (id: string) => apiRequest<void>(`/bikes/${id}`, { method: 'DELETE' }),
};

export const rentalsAPI = {
  getAll: () => apiRequest<any[]>('/rentals'),
  getById: (id: string) => apiRequest<any>(`/rentals/${id}`),
  create: (bikeId: string, startTime?: string) =>
    apiRequest<any>('/rentals', { method: 'POST', body: JSON.stringify({ bikeId, startTime }) }),
  end: (id: string) => apiRequest<any>(`/rentals/${id}/complete`, { method: 'POST' }),
  cancel: (id: string) => apiRequest<any>(`/rentals/${id}/cancel`, { method: 'POST' }),
  startRide: (id: string) => apiRequest<any>(`/rentals/${id}/start`, { method: 'POST' }),
  completeRide: (id: string) => apiRequest<any>(`/rentals/${id}/complete`, { method: 'POST' }),
  submitReview: (id: string, data: { rating: number; comment: string }) =>
    apiRequest<any>(`/rentals/${id}/review`, { method: 'POST', body: JSON.stringify(data) }),
};

export const usersAPI = {
  getAll: () => apiRequest<any[]>('/users'),
  getById: (id: string) => apiRequest<any>(`/users/${id}`),
  update: (id: string, updates: any) => apiRequest<any>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  topUpWallet: (id: string, amount: number) =>
    apiRequest<any>(`/users/${id}/wallet/topup`, { method: 'POST', body: JSON.stringify({ amount }) }),
};

export const documentsAPI = {
  getAll: () => apiRequest<any[]>('/documents'),
  upload: (name: string, type: string, fileUrl: string | undefined) =>
    apiRequest<any>('/documents', { method: 'POST', body: JSON.stringify({ name, type, url: fileUrl }) }),
  getUploadUrl: (name: string, type: string, contentType: string) =>
    apiRequest<any>('/documents/upload-url', { method: 'POST', body: JSON.stringify({ name, type, contentType }) }),
  uploadFile: (file: File, name: string, type: string) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('name', name);
    fd.append('type', type);
    return fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
      body: fd,
    }).then((r) => r.json());
  },
  updateStatus: (id: string, status: 'pending' | 'approved' | 'rejected') =>
    apiRequest<any>(`/documents/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
};

export const paymentsAPI = {
  getKey: () => apiRequest<{ keyId: string }>('/payments/key'),
  createOrder: (amount: number) => apiRequest<any>('/payments/order', { method: 'POST', body: JSON.stringify({ amount }) }),
  verifyPayment: (payload: any) => apiRequest<any>('/payments/verify', { method: 'POST', body: JSON.stringify(payload) }),
};

export const locationsAPI = {
  getAll: () => apiRequest<any[]>('/locations'),
  getById: (id: string) => apiRequest<any>(`/locations/${id}`),
  create: (location: any) => apiRequest<any>('/locations', { method: 'POST', body: JSON.stringify(location) }),
  update: (id: string, location: any) => apiRequest<any>(`/locations/${id}`, { method: 'PUT', body: JSON.stringify(location) }),
  delete: (id: string) => apiRequest<any>(`/locations/${id}`, { method: 'DELETE' }),
};
