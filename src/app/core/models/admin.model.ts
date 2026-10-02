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
  base_salary?: number; // Monthly base salary in INR ₹ (e.g. 25000)
  incentive_percentage?: number; // Performance incentive rate % (e.g. 15%)
}

export interface CreateStaffPayload {
  name: string;
  role: string;
  specialization: 'hair' | 'beard' | 'skin' | 'all';
  phone?: string;
  is_active?: boolean;
  base_salary?: number;
  incentive_percentage?: number;
}

export interface UpdateStaffPayload {
  name?: string;
  role?: string;
  specialization?: 'hair' | 'beard' | 'skin' | 'all';
  phone?: string;
  is_active?: boolean;
  base_salary?: number;
  incentive_percentage?: number;
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
  totalPrice?: number; // Total charges (sum of services or custom edited charges)
  customPriceNote?: string; // e.g. "Special VIP rate", "Extra conditioning applied"
  bookingSource?: 'online' | 'walk_in' | 'phone_call';
  bookedByStaffId?: string;
  bookedByStaffName?: string;
  ownerApprovalStatus?: 'pending' | 'approved';
  ownerReviewedAt?: string;
  statusChangedBy?: string;
  statusChangedAt?: string;
  assignedStaff: StaffMember[]; // Can contain multiple assigned stylists
  createdAt?: string;
  notes?: string;
}

export interface CreateManualAppointmentPayload {
  customerName: string;
  customerPhone: string;
  serviceId?: string;
  serviceIds?: string[];
  services?: AppointmentServiceItem[];
  customPrice?: number;
  date: string;
  startTime: string;
  staffId?: string; // Optional direct staff assignment
  notes?: string;
  bookingSource?: 'walk_in' | 'phone_call' | 'online';
}

export interface ReviewAndEditAppointmentPayload {
  services: AppointmentServiceItem[];
  finalPrice: number;
  priceAdjustmentNote?: string;
  assignedStaff: StaffMember[];
  notes?: string;
  approveNow?: boolean;
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
