import { SalonService } from './service.model';

export interface BookingState {
  selectedServices: SalonService[];
  serviceId: string | null;
  serviceName: string | null;
  serviceDuration: number | null;
  servicePrice: number | null;

  date: string | null;

  slotStart: string | null;
  slotEnd: string | null;

  customerName: string;
  customerPhone: string;
}

export interface BookingPayload {
  salonId: string;
  serviceId: string;
  serviceIds?: string[];
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm:ss
  customerName: string;
  customerPhone: string;
  totalPrice?: number;
  totalDuration?: number;
}

export interface BookingResponse {
  success: boolean;
  appointmentId?: string;
  referenceNumber?: string;
  status?: 'booked' | 'completed' | 'cancelled' | 'no_show';
  message?: string;
  serviceName?: string;
  services?: { id: string; name: string; price: number; duration_minutes: number }[];
  totalPrice?: number;
  totalDuration?: number;
  date?: string;
  slotStart?: string;
  slotEnd?: string;
  customerName?: string;
  customerPhone?: string;
}
