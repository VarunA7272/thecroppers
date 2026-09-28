import { Injectable, signal, computed, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { BookingState, BookingPayload, BookingResponse } from '../models/booking.model';
import { AvailableSlot, FormattedSlot } from '../models/slot.model';
import { SalonService } from '../models/service.model';
import { environment } from '../../../environments/environment';

const INITIAL_BOOKING_STATE: BookingState = {
  selectedServices: [],
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
  readonly selectedServices = computed(() => this.state().selectedServices);
  
  readonly totalDuration = computed(() => 
    this.state().selectedServices.reduce((sum, s) => sum + s.duration_minutes, 0)
  );

  readonly totalPrice = computed(() => 
    this.state().selectedServices.reduce((sum, s) => sum + s.price, 0)
  );

  readonly selectedServiceNames = computed(() => 
    this.state().selectedServices.map(s => s.name).join(' + ')
  );

  readonly selectedService = computed(() => ({
    id: this.state().serviceId,
    name: this.selectedServiceNames() || this.state().serviceName,
    duration: this.totalDuration() || this.state().serviceDuration,
    price: this.totalPrice() || this.state().servicePrice
  }));

  readonly selectedDate = computed(() => this.state().date);
  readonly selectedSlot = computed(() => ({
    start: this.state().slotStart,
    end: this.state().slotEnd
  }));

  readonly isServiceSelected = computed(() => this.state().selectedServices.length > 0);
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

  /**
   * Check if a specific service is currently selected
   */
  isServiceInCart(serviceId: string): boolean {
    return this.state().selectedServices.some(s => s.id === serviceId);
  }

  /**
   * Toggle a service (select if not present, unselect if present)
   */
  toggleService(service: SalonService): void {
    const current = this.state().selectedServices;
    const exists = current.some(s => s.id === service.id);
    let updated: SalonService[];

    if (exists) {
      updated = current.filter(s => s.id !== service.id);
    } else {
      updated = [...current, service];
    }

    this.applySelectedServices(updated);
  }

  /**
   * Add a service to selection if not already present
   */
  addService(service: SalonService): void {
    const current = this.state().selectedServices;
    if (!current.some(s => s.id === service.id)) {
      this.applySelectedServices([...current, service]);
    }
  }

  /**
   * Remove a service from selection
   */
  removeService(serviceId: string): void {
    const current = this.state().selectedServices;
    this.applySelectedServices(current.filter(s => s.id !== serviceId));
  }

  /**
   * Set single service selection (for backwards compatibility)
   */
  selectService(service: SalonService): void {
    this.applySelectedServices([service]);
  }

  /**
   * Clear all selected services
   */
  clearServices(): void {
    this.applySelectedServices([]);
  }

  private applySelectedServices(services: SalonService[]): void {
    const primaryId = services.length > 0 ? services[0].id : null;
    const names = services.map(s => s.name).join(' + ');
    const totalDur = services.reduce((sum, s) => sum + s.duration_minutes, 0);
    const totalPr = services.reduce((sum, s) => sum + s.price, 0);

    this.state.update(prev => ({
      ...prev,
      selectedServices: services,
      serviceId: primaryId,
      serviceName: names || null,
      serviceDuration: totalDur || null,
      servicePrice: totalPr || null,
      // reset downstream slot if services changed
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
    // If multiple services are selected, recalculate slot_end based on total duration
    const dur = this.totalDuration() || 30;
    const calculatedEnd = this.calculateEndTime(slot.slot_start, dur);

    this.state.update(prev => ({
      ...prev,
      slotStart: slot.slot_start,
      slotEnd: calculatedEnd
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
  async fetchAvailableSlots(date: string, serviceId?: string): Promise<FormattedSlot[]> {
    this.isLoadingSlots.set(true);
    this.errorMessage.set(null);

    const srvId = serviceId || this.state().serviceId || 'srv-haircut';

    try {
      if (this.supabase.isReady) {
        const { data, error } = await this.supabase.callRpc<AvailableSlot[]>('get_available_slots', {
          p_salon_id: this.salonId,
          p_service_id: srvId,
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

    const combinedName = this.selectedServiceNames();
    const totalPrice = this.totalPrice();
    const totalDuration = this.totalDuration();

    const payload: BookingPayload = {
      salonId: this.salonId,
      serviceId: currentState.serviceId!,
      serviceIds: currentState.selectedServices.map(s => s.id),
      date: currentState.date!,
      startTime: currentState.slotStart!,
      customerName: currentState.customerName.trim(),
      customerPhone: currentState.customerPhone.trim(),
      totalPrice,
      totalDuration
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
          serviceName: combinedName,
          services: currentState.selectedServices.map(s => ({
            id: s.id,
            name: s.name,
            price: s.price,
            duration_minutes: s.duration_minutes
          })),
          totalPrice,
          totalDuration,
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
          serviceName: combinedName,
          services: currentState.selectedServices.map(s => ({
            id: s.id,
            name: s.name,
            price: s.price,
            duration_minutes: s.duration_minutes
          })),
          totalPrice,
          totalDuration,
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

  calculateEndTime(startTime: string, durationMinutes: number): string {
    if (!startTime) return '';
    const parts = startTime.split(':');
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1] || '00', 10);
    const totalM = h * 60 + m + durationMinutes;
    const endH = Math.floor(totalM / 60);
    const endM = totalM % 60;
    return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}:00`;
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
    const duration = this.totalDuration() || 30;

    return rawSlots.map(slot => {
      const calculatedEnd = this.calculateEndTime(slot.slot_start, duration);
      const displayStart = this.formatTime12Hour(slot.slot_start);
      const displayEnd = this.formatTime12Hour(calculatedEnd);
      const hour = parseInt(slot.slot_start.split(':')[0], 10);
      let period: 'morning' | 'afternoon' | 'evening' = 'morning';
      if (hour >= 12 && hour < 17) {
        period = 'afternoon';
      } else if (hour >= 17) {
        period = 'evening';
      }

      return {
        ...slot,
        slot_end: calculatedEnd,
        displayStart,
        displayEnd,
        period
      };
    });
  }

  formatTime12Hour(timeStr: string): string {
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
    const duration = this.totalDuration() || 30;
    const timeRanges = [
      { start: '10:00:00', period: 'morning' as const },
      { start: '10:30:00', period: 'morning' as const },
      { start: '11:00:00', period: 'morning' as const },
      { start: '11:30:00', period: 'morning' as const },
      { start: '12:00:00', period: 'afternoon' as const },
      { start: '12:30:00', period: 'afternoon' as const },
      { start: '14:00:00', period: 'afternoon' as const },
      { start: '15:00:00', period: 'afternoon' as const },
      { start: '16:00:00', period: 'afternoon' as const },
      { start: '17:00:00', period: 'evening' as const },
      { start: '17:30:00', period: 'evening' as const },
      { start: '18:00:00', period: 'evening' as const },
      { start: '19:00:00', period: 'evening' as const }
    ];

    return timeRanges.map((t, idx) => {
      const calculatedEnd = this.calculateEndTime(t.start, duration);
      return {
        slot_start: t.start,
        slot_end: calculatedEnd,
        available: idx !== 2 && idx !== 7, // mock a couple of unavailable slots
        displayStart: this.formatTime12Hour(t.start),
        displayEnd: this.formatTime12Hour(calculatedEnd),
        period: t.period
      };
    });
  }
}
