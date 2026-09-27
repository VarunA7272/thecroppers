export interface BookingState {
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
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm:ss
  customerName: string;
  customerPhone: string;
}

export interface BookingResponse {
  success: boolean;
  appointmentId?: string;
  referenceNumber?: string;
  status?: 'booked' | 'completed' | 'cancelled' | 'no_show';
  message?: string;
  serviceName?: string;
  date?: string;
  slotStart?: string;
  slotEnd?: string;
  customerName?: string;
  customerPhone?: string;
}
