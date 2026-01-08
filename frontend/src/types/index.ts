export interface PricingSlab {
  price: number;
  duration_min: number; // in hours
  duration_max: number; // in hours
  included_km: number;
  extra_km_price: number;
  minimum_booking_rule: 'none' | 'min_duration' | 'min_price';
  minimum_value: number;
}

export interface Bike {
  id: string;
  name: string;
  type: 'fuel' | 'electric' | 'scooter';
  category?: 'budget' | 'midrange' | 'topend';
  brand?: string;
  image: string;
  // Legacy fields for backward compatibility
  pricePerHour?: number;
  // New simple pricing fields
  price12Hours?: number;
  // Individual hourly rates for hours 13-24
  pricePerHour13?: number;
  pricePerHour14?: number;
  pricePerHour15?: number;
  pricePerHour16?: number;
  pricePerHour17?: number;
  pricePerHour18?: number;
  pricePerHour19?: number;
  pricePerHour20?: number;
  pricePerHour21?: number;
  pricePerHour22?: number;
  pricePerHour23?: number;
  pricePerHour24?: number;
  pricePerWeek?: number;
  kmLimit?: number;
  // New pricing model
  pricingSlabs?: {
    hourly?: PricingSlab;
    daily?: PricingSlab;
    weekly?: PricingSlab;
  };
  weekendSurgeMultiplier?: number;
  gstPercentage?: number;
  available: boolean;
  description: string;
  features: string[];
  locationId: string | null;
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
