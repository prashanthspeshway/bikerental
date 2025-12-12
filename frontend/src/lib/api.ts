const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Helper function to get auth token
function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

// Helper function to set auth token
export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
}

// Helper function to get current user from localStorage
export function getCurrentUser() {
  const userStr = localStorage.getItem('currentUser');
  return userStr ? JSON.parse(userStr) : null;
}

// Helper function to set current user
export function setCurrentUser(user: any) {
  if (user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
  } else {
    localStorage.removeItem('currentUser');
  }
}

// Generic API request function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Auth API
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

// Bikes API
export const bikesAPI = {
  getAll: () => apiRequest<any[]>('/bikes'),
  getById: (id: string) => apiRequest<any>(`/bikes/${id}`),
  create: (bike: any) => apiRequest<any>('/bikes', {
    method: 'POST',
    body: JSON.stringify(bike),
  }),
  update: (id: string, bike: any) => apiRequest<any>(`/bikes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(bike),
  }),
  delete: (id: string) => apiRequest<void>(`/bikes/${id}`, {
    method: 'DELETE',
  }),
};

// Rentals API
export const rentalsAPI = {
  getAll: () => apiRequest<any[]>('/rentals'),
  getById: (id: string) => apiRequest<any>(`/rentals/${id}`),
  create: (bikeId: string, startTime?: string) => apiRequest<any>('/rentals', {
    method: 'POST',
    body: JSON.stringify({ bikeId, startTime }),
  }),
  end: (id: string) => apiRequest<any>(`/rentals/${id}/end`, {
    method: 'POST',
  }),
  cancel: (id: string) => apiRequest<any>(`/rentals/${id}/cancel`, {
    method: 'POST',
  }),
};

// Users API
export const usersAPI = {
  getAll: () => apiRequest<any[]>('/users'),
  getById: (id: string) => apiRequest<any>(`/users/${id}`),
  update: (id: string, updates: any) => apiRequest<any>(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  }),
  topUpWallet: (id: string, amount: number) => apiRequest<any>(`/users/${id}/wallet/topup`, {
    method: 'POST',
    body: JSON.stringify({ amount }),
  }),
};

// Documents API
export const documentsAPI = {
  getAll: () => apiRequest<any[]>('/documents'),
  upload: (name: string, type: string, url?: string) => apiRequest<any>('/documents', {
    method: 'POST',
    body: JSON.stringify({ name, type, url }),
  }),
  updateStatus: (id: string, status: 'pending' | 'approved' | 'rejected') => 
    apiRequest<any>(`/documents/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  delete: (id: string) => apiRequest<void>(`/documents/${id}`, {
    method: 'DELETE',
  }),
};

// Locations API
export const locationsAPI = {
  getAll: () => apiRequest<any[]>('/locations'),
  getById: (id: string) => apiRequest<any>(`/locations/${id}`),
  create: (location: any) => apiRequest<any>('/locations', {
    method: 'POST',
    body: JSON.stringify(location),
  }),
  update: (id: string, location: any) => apiRequest<any>(`/locations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(location),
  }),
  delete: (id: string) => apiRequest<void>(`/locations/${id}`, {
    method: 'DELETE',
  }),
};

