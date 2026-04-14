export interface UserProfile {
  uid: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  email: string;
  photoURL: string;
  phoneNumber?: string;
  role: 'admin' | 'client';
  notes?: string;
  favoriteServices?: string[];
  createdAt: string;
}

export interface WorkingHours {
  start: string; // "09:00"
  end: string;   // "18:00"
  isOpen: boolean;
}

export interface Staff {
  id: string;
  name: string;
  specialties: string[];
  weeklySchedule: Record<string, WorkingHours>; // e.g., { "Monday": { start: "09:00", end: "18:00", isOpen: true } }
  imageUrl: string;
  isActive: boolean;
  color?: string; // For calendar visualization
}

export interface Room {
  id: string;
  name: string;
  type: 'nails' | 'skin' | 'massage';
  isActive: boolean;
  weeklySchedule: Record<string, WorkingHours>;
}

export interface Service {
  id: string;
  name: string;
  category: 'nails' | 'skin' | 'massage';
  price: number;
  duration: number;
  description: string;
  imageUrl: string;
}

export interface Appointment {
  id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  serviceId: string;
  serviceName: string;
  staffId?: string;
  staffName?: string;
  roomId?: string;
  roomName?: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  paymentMethod: 'cash' | 'transfer' | 'stripe';
  paymentStatus: 'unpaid' | 'paid';
  createdAt: string;
  notes?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'success' | 'warning';
  isActive: boolean;
  createdAt: string;
}
