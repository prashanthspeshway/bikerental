export interface Bike {
  id: string;
  name: string;
  type: 'fuel' | 'electric' | 'scooter';
  brand?: string;
  image: string;
  pricePerHour: number;
  kmLimit: number;
  available: boolean;
  description: string;
  features: string[];
  locationId: string;
  location?: {
    id: string;
    name: string;
    city: string;
    state: string;
  };
}

export interface Location {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'superadmin';
  walletBalance: number;
  documents: Document[];
  createdAt: string;
}

export interface Document {
  id: string;
  userId: string;
  name: string;
  type: 'license' | 'id' | 'other';
  url: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: string;
}

export interface Rental {
  id: string;
  bikeId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  totalCost?: number;
  status: 'active' | 'completed' | 'cancelled';
}
