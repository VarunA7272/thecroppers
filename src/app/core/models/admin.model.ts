export type AdminRole = 'superadmin' | 'staff';

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  name?: string;
  staffId?: string; // If role is staff, maps to a StaffMember.id
}

export interface StaffMember {
  id: string;
  salon_id: string;
  name: string;
  role: string;
  specialization: 'hair' | 'beard' | 'skin' | 'all';
  phone?: string;
  is_active: boolean;
}

export interface CreateStaffPayload {
  name: string;
  role: string;
  specialization: 'hair' | 'beard' | 'skin' | 'all';
  phone?: string;
  is_active?: boolean;
}

export interface UpdateStaffPayload {
  name?: string;
  role?: string;
  specialization?: 'hair' | 'beard' | 'skin' | 'all';
  phone?: string;
  is_active?: boolean;
}

export interface AppointmentServiceItem {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  categoryName?: string;
}

export interface AdminAppointment {
  id: string;
  referenceNumber: string;
  salonId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm:ss
  endTime: string; // HH:mm:ss
  status: 'booked' | 'completed' | 'cancelled' | 'no_show';
  customer: {
    id?: string;
    name: string;
    phone: string;
  };
  service: {
    id: string;
    name: string;
    durationMinutes: number;
    price: number;
    categoryName?: string;
  };
  services?: AppointmentServiceItem[]; // Multi-service item breakdown
  assignedStaff: StaffMember[]; // Can contain multiple assigned stylists
  createdAt?: string;
  notes?: string;
}

export interface CreateManualAppointmentPayload {
  customerName: string;
  customerPhone: string;
  serviceId: string;
  date: string;
  startTime: string;
  staffId?: string; // Optional direct staff assignment (superadmin only)
  notes?: string;
}

export interface UpdateAppointmentPayload {
  date?: string;
  startTime?: string;
  endTime?: string;
  serviceId?: string;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
}

export interface AppointmentFilter {
  date?: string;
  status?: 'all' | 'booked' | 'completed' | 'cancelled' | 'no_show';
  unassignedOnly?: boolean;
  staffId?: string; // Filter by assigned staff member
}

export interface CreateServicePayload {
  name: string;
  category_name: string;
  duration_minutes: number;
  price: number;
  description?: string;
  is_active?: boolean;
}

export interface UpdateServicePayload {
  name?: string;
  category_name?: string;
  duration_minutes?: number;
  price?: number;
  description?: string;
  is_active?: boolean;
}
