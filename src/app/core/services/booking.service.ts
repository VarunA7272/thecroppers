import { Injectable, signal, computed, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { BookingState, BookingPayload, BookingResponse } from '../models/booking.model';
import { AvailableSlot, FormattedSlot } from '../models/slot.model';
import { SalonService } from '../models/service.model';
import { environment } from '../../../environments/environment';

const INITIAL_BOOKING_STATE: BookingState = {
  serviceId: null,
  serviceName: null,
  serviceDuration: null,
  servicePrice: null,
  date: null,
  slotStart: null,
  slotEnd: null,
  customerName: '',
  customerPhone: ''
};

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private readonly supabase = inject(SupabaseService);

  readonly salonId = environment.salonId;

  // Reactive state using Angular Signals
  readonly state = signal<BookingState>({ ...INITIAL_BOOKING_STATE });
  readonly confirmedBooking = signal<BookingResponse | null>(null);
  readonly isLoadingSlots = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  // Computeds
  readonly selectedService = computed(() => ({
    id: this.state().serviceId,
    name: this.state().serviceName,
    duration: this.state().serviceDuration,
    price: this.state().servicePrice
  }));

  readonly selectedDate = computed(() => this.state().date);
  readonly selectedSlot = computed(() => ({
    start: this.state().slotStart,
    end: this.state().slotEnd
  }));

  readonly isServiceSelected = computed(() => !!this.state().serviceId);
  readonly isDateSelected = computed(() => !!this.state().date);
  readonly isSlotSelected = computed(() => !!this.state().slotStart);
  readonly isCustomerDetailsValid = computed(() => {
    const name = this.state().customerName.trim();
    const phone = this.state().customerPhone.trim().replace(/\D/g, '');
    return name.length >= 2 && phone.length === 10;
  });

  readonly isReadyToConfirm = computed(() => 
    this.isServiceSelected() &&
    this.isDateSelected() &&
    this.isSlotSelected() &&
    this.isCustomerDetailsValid()
  );

  selectService(service: SalonService): void {
    this.state.update(prev => ({
      ...prev,
      serviceId: service.id,
      serviceName: service.name,
      serviceDuration: service.duration_minutes,
      servicePrice: service.price,
      // reset downstream selections if service changed
      slotStart: null,
      slotEnd: null
    }));
    this.errorMessage.set(null);
  }

  selectDate(dateStr: string): void {
    this.state.update(prev => ({
      ...prev,
      date: dateStr,
      // reset slot when date changes
      slotStart: null,
      slotEnd: null
    }));
    this.errorMessage.set(null);
  }

  selectSlot(slot: AvailableSlot): void {
    this.state.update(prev => ({
      ...prev,
      slotStart: slot.slot_start,
      slotEnd: slot.slot_end
    }));
    this.errorMessage.set(null);
  }

  updateCustomerDetails(name: string, phone: string): void {
    this.state.update(prev => ({
      ...prev,
      customerName: name,
      customerPhone: phone
    }));
  }

  resetBooking(): void {
    this.state.set({ ...INITIAL_BOOKING_STATE });
    this.confirmedBooking.set(null);
    this.errorMessage.set(null);
  }

  /**
   * Fetches available slots for the selected date and service from Supabase RPC get_available_slots
   */
  async fetchAvailableSlots(date: string, serviceId: string): Promise<FormattedSlot[]> {
    this.isLoadingSlots.set(true);
    this.errorMessage.set(null);

    try {
      if (this.supabase.isReady) {
        const { data, error } = await this.supabase.callRpc<AvailableSlot[]>('get_available_slots', {
          p_salon_id: this.salonId,
          p_service_id: serviceId,
          p_date: date
        });

        if (error) {
          console.error('[BookingService] RPC get_available_slots error:', error);
          const friendlyMessage = this.normalizeErrorMessage(error);
          this.errorMessage.set(friendlyMessage);
          return [];
        }

        if (Array.isArray(data)) {
          return this.formatSlots(data);
        }
      } else {
        // Mock fallback slots for UI testing when Supabase credentials are placeholder
        console.info('[BookingService] Supabase not connected yet. Generating standard salon slots for testing.');
        return this.generateMockSlots();
      }
    } catch (err: any) {
      console.error('[BookingService] Unexpected error while fetching slots:', err);
      this.errorMessage.set('Unable to retrieve available times. Please check your connection and try again.');
    } finally {
      this.isLoadingSlots.set(false);
    }

    return [];
  }

  /**
   * Submits booking using Supabase RPC book_appointment
   */
  async submitBooking(): Promise<BookingResponse> {
    const currentState = this.state();
    if (!this.isReadyToConfirm()) {
      const errRes: BookingResponse = {
        success: false,
        message: 'Please complete all required fields before confirming.'
      };
      this.errorMessage.set(errRes.message || null);
      return errRes;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const payload: BookingPayload = {
      salonId: this.salonId,
      serviceId: currentState.serviceId!,
      date: currentState.date!,
      startTime: currentState.slotStart!,
      customerName: currentState.customerName.trim(),
      customerPhone: currentState.customerPhone.trim()
    };

    try {
      if (this.supabase.isReady) {
        const { data, error } = await this.supabase.callRpc<any>('book_appointment', {
          p_salon_id: payload.salonId,
          p_service_id: payload.serviceId,
          p_date: payload.date,
          p_start_time: payload.startTime,
          p_customer_name: payload.customerName,
          p_customer_phone: payload.customerPhone
        });

        if (error) {
          console.error('[BookingService] book_appointment error:', error);
          const userMessage = this.normalizeBookingError(error);
          this.errorMessage.set(userMessage);
          return {
            success: false,
            message: userMessage
          };
        }

        const bookingResult: BookingResponse = {
          success: true,
          appointmentId: data?.id || data?.appointment_id || (typeof data === 'string' ? data : 'CROPPERS-' + Math.random().toString(36).substring(2, 8).toUpperCase()),
          referenceNumber: data?.reference_number || 'TCP-' + Math.floor(100000 + Math.random() * 900000),
          status: 'booked',
          serviceName: currentState.serviceName || undefined,
          date: currentState.date || undefined,
          slotStart: currentState.slotStart || undefined,
          slotEnd: currentState.slotEnd || undefined,
          customerName: currentState.customerName,
          customerPhone: currentState.customerPhone,
          message: 'Your appointment has been booked successfully.'
        };

        this.confirmedBooking.set(bookingResult);
        return bookingResult;
      } else {
        // Placeholder test fallback
        const bookingResult: BookingResponse = {
          success: true,
          appointmentId: 'CROPPERS-DEMO-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
          referenceNumber: 'TCP-' + Math.floor(100000 + Math.random() * 900000),
          status: 'booked',
          serviceName: currentState.serviceName || undefined,
          date: currentState.date || undefined,
          slotStart: currentState.slotStart || undefined,
          slotEnd: currentState.slotEnd || undefined,
          customerName: currentState.customerName,
          customerPhone: currentState.customerPhone,
          message: 'Your appointment has been booked successfully (Demo Mode).'
        };

        this.confirmedBooking.set(bookingResult);
        return bookingResult;
      }
    } catch (err: any) {
      console.error('[BookingService] Unexpected error booking appointment:', err);
      const userMessage = 'We could not complete your booking at this time. Please try again or call us at +917848827245.';
      this.errorMessage.set(userMessage);
      return {
        success: false,
        message: userMessage
      };
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private normalizeErrorMessage(error: any): string {
    const msg = error?.message || error?.details || '';
    if (msg.includes('closed') || msg.includes('The salon is closed')) {
      return 'The salon is closed on this date. Please pick another day.';
    }
    if (msg.includes('unavailable') || msg.includes('service')) {
      return 'This service is currently unavailable.';
    }
    return 'Could not retrieve slots. Please try selecting a different date.';
  }

  private normalizeBookingError(error: any): string {
    const msg = error?.message || error?.details || '';
    if (msg.toLowerCase().includes('no longer available') || msg.toLowerCase().includes('already booked')) {
      return 'Sorry, this slot was just booked by someone else. Please choose another time.';
    }
    if (msg.includes('closed') || msg.toLowerCase().includes('salon is closed')) {
      return 'The salon is closed on this date.';
    }
    if (msg.includes('service') && msg.includes('unavailable')) {
      return 'This service is currently unavailable.';
    }
    return 'Unable to secure booking at this time. Please select another time or call +917848827245.';
  }

  private formatSlots(rawSlots: AvailableSlot[]): FormattedSlot[] {
    return rawSlots.map(slot => {
      const displayStart = this.formatTime12Hour(slot.slot_start);
      const displayEnd = this.formatTime12Hour(slot.slot_end);
      const hour = parseInt(slot.slot_start.split(':')[0], 10);
      let period: 'morning' | 'afternoon' | 'evening' = 'morning';
      if (hour >= 12 && hour < 17) {
        period = 'afternoon';
      } else if (hour >= 17) {
        period = 'evening';
      }

      return {
        ...slot,
        displayStart,
        displayEnd,
        period
      };
    });
  }

  private formatTime12Hour(timeStr: string): string {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    let hour = parseInt(parts[0], 10);
    const minute = parts[1] || '00';
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${hour}:${minute} ${ampm}`;
  }

  private generateMockSlots(): FormattedSlot[] {
    const timeRanges = [
      { start: '10:00:00', end: '10:30:00', period: 'morning' as const },
      { start: '10:30:00', end: '11:00:00', period: 'morning' as const },
      { start: '11:00:00', end: '11:30:00', period: 'morning' as const },
      { start: '11:30:00', end: '12:00:00', period: 'morning' as const },
      { start: '12:00:00', end: '12:30:00', period: 'afternoon' as const },
      { start: '12:30:00', end: '13:00:00', period: 'afternoon' as const },
      { start: '14:00:00', end: '14:30:00', period: 'afternoon' as const },
      { start: '15:00:00', end: '15:30:00', period: 'afternoon' as const },
      { start: '16:00:00', end: '16:30:00', period: 'afternoon' as const },
      { start: '17:00:00', end: '17:30:00', period: 'evening' as const },
      { start: '17:30:00', end: '18:00:00', period: 'evening' as const },
      { start: '18:00:00', end: '18:30:00', period: 'evening' as const },
      { start: '19:00:00', end: '19:30:00', period: 'evening' as const }
    ];

    return timeRanges.map((t, idx) => ({
      slot_start: t.start,
      slot_end: t.end,
      available: idx !== 2 && idx !== 7, // mock a couple of unavailable slots
      displayStart: this.formatTime12Hour(t.start),
      displayEnd: this.formatTime12Hour(t.end),
      period: t.period
    }));
  }
}
