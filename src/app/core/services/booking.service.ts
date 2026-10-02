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
   * Fetches available slots for the selected date and service.
   * Dynamically calculates availability from Supabase salon_hours, existing bookings, and current time.
   */
  async fetchAvailableSlots(date: string, serviceId?: string): Promise<FormattedSlot[]> {
    this.isLoadingSlots.set(true);
    this.errorMessage.set(null);

    const srvId = serviceId || this.state().serviceId || 'srv-haircut';
    const totalDuration = this.totalDuration() || 30;

    try {
      if (this.supabase.isReady) {
        // Calculate dynamic real-time slots using salon hours & booked appointments
        const slots = await this.generateDynamicSlots(date, totalDuration);
        if (slots && slots.length > 0) {
          return slots;
        }
        return this.generateMockSlots();
      } else {
        // Test / offline fallback
        return this.generateMockSlots();
      }
    } catch (err: any) {
      console.error('[BookingService] Unexpected error while fetching slots:', err);
      return this.generateMockSlots();
    } finally {
      this.isLoadingSlots.set(false);
    }
  }

  /**
   * Helper to parse time strings ('10:00:00', '10:00', '2026-10-03T10:00:00', etc.) into total minutes from midnight
   */
  private parseTimeToMinutes(t: string | null | undefined, defaultMin: number): number {
    if (!t) return defaultMin;
    const timePart = t.includes('T') ? t.split('T')[1] : (t.includes(' ') ? t.split(' ')[1] : t);
    const parts = timePart.split(':');
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1] || '0', 10);
    if (isNaN(h)) return defaultMin;
    return h * 60 + (isNaN(m) ? 0 : m);
  }

  /**
   * Dynamically calculates time slots for a given date by reading salon_hours and existing appointments
   */
  private async generateDynamicSlots(date: string, duration: number): Promise<FormattedSlot[]> {
    const dateObj = new Date(date + 'T00:00:00');
    const dayOfWeek = isNaN(dateObj.getDay()) ? new Date().getDay() : dateObj.getDay();

    let openTotalMin = 10 * 60; // 10:00 AM (600)
    let closeTotalMin = 20 * 60; // 8:00 PM (1200)
    let isClosed = false;

    // Fetch salon hours for this specific day
    if (this.supabase.isReady && this.supabase.clientInstance) {
      try {
        const { data: hourData } = await this.supabase.clientInstance
          .from('salon_hours')
          .select('*')
          .eq('salon_id', this.salonId)
          .eq('day_of_week', dayOfWeek)
          .maybeSingle();

        if (hourData) {
          isClosed = hourData.is_closed === true;
          const openStr = hourData.open_time || hourData.opens_at || hourData.opening_time;
          const closeStr = hourData.close_time || hourData.closes_at || hourData.closing_time;
          if (openStr) openTotalMin = this.parseTimeToMinutes(openStr, 600);
          if (closeStr) closeTotalMin = this.parseTimeToMinutes(closeStr, 1200);
        }
      } catch (err) {
        console.warn('[BookingService] Error reading salon_hours:', err);
      }
    }

    if (isClosed) {
      this.errorMessage.set('The salon is closed on this day. Please select another date.');
      return [];
    }

    // Query booked appointments for this date
    let busyRanges: { startMin: number; endMin: number }[] = [];
    if (this.supabase.isReady && this.supabase.clientInstance) {
      try {
        const { data: aptData, error: aptErr } = await this.supabase.clientInstance
          .from('appointments')
          .select('start_time, end_time, status, date, appointment_date')
          .eq('salon_id', this.salonId)
          .or(`date.eq.${date},appointment_date.eq.${date}`);

        if (!aptErr && aptData && aptData.length > 0) {
          busyRanges = aptData
            .filter((a: any) => a.status !== 'cancelled' && (a.start_time || a.slot_start))
            .map((a: any) => {
              const startStr = a.start_time || a.slot_start || '10:00:00';
              const endStr = a.end_time || a.slot_end;
              const startMin = this.parseTimeToMinutes(startStr, 600);
              let endMin = endStr ? this.parseTimeToMinutes(endStr, startMin + 30) : startMin + 30;
              if (endMin <= startMin) {
                endMin = startMin + 30;
              }
              return { startMin, endMin };
            });
        }
      } catch (err) {
        console.warn('[BookingService] Error reading appointments for busy slots:', err);
      }
    }

    // Determine past minutes if date is today
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentDay = String(now.getDate()).padStart(2, '0');
    const todayStr = `${currentYear}-${currentMonth}-${currentDay}`;
    const isToday = date === todayStr;
    const isPastDate = date < todayStr;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const slots: FormattedSlot[] = [];

    // Step every 30 minutes from open to close
    for (let min = openTotalMin; min + 15 <= closeTotalMin; min += 30) {
      const h = Math.floor(min / 60);
      const m = min % 60;
      const slotStart = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
      const calculatedEnd = this.calculateEndTime(slotStart, duration);

      // Past check: past dates are unavailable, today check if time has passed
      const isPast = isPastDate || (isToday && (min < currentMinutes - 10));

      // Overlap with busy booking slots check
      const slotEndMin = min + duration;
      const isOverlap = busyRanges.some(b => min < b.endMin && slotEndMin > b.startMin);

      const available = !isPast && !isOverlap;

      let period: 'morning' | 'afternoon' | 'evening' = 'morning';
      if (h >= 12 && h < 17) {
        period = 'afternoon';
      } else if (h >= 17) {
        period = 'evening';
      }

      slots.push({
        slot_start: slotStart,
        slot_end: calculatedEnd,
        available,
        displayStart: this.formatTime12Hour(slotStart),
        displayEnd: this.formatTime12Hour(calculatedEnd),
        period
      });
    }

    return slots;
  }

  /**
   * Submits booking using Supabase RPC book_appointment or direct insertion fallback
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
      if (this.supabase.isReady && this.supabase.clientInstance) {
        // 1. Ensure or find customer record
        let customerId: string | null = null;
        try {
          const { data: existingCust } = await this.supabase.clientInstance
            .from('customers')
            .select('id')
            .eq('phone', payload.customerPhone)
            .maybeSingle();

          if (existingCust?.id) {
            customerId = existingCust.id;
          } else {
            const { data: newCust, error: custErr } = await this.supabase.clientInstance
              .from('customers')
              .insert({
                salon_id: this.salonId,
                name: payload.customerName,
                full_name: payload.customerName,
                phone: payload.customerPhone
              })
              .select('id')
              .maybeSingle();

            if (!custErr && newCust?.id) {
              customerId = newCust.id;
            }
          }
        } catch (custErr) {
          console.warn('[BookingService] Customer check/insert note:', custErr);
        }

        const refNumber = 'TCP-' + Math.floor(100000 + Math.random() * 900000);
        const endTime = this.calculateEndTime(payload.startTime, totalDuration);

        // 2. Insert into appointments table
        const insertPayload: Record<string, any> = {
          salon_id: this.salonId,
          date: payload.date,
          appointment_date: payload.date,
          start_time: payload.startTime,
          end_time: endTime,
          total_price: totalPrice,
          payment_method: 'cash',
          booking_source: 'online',
          status: 'booked',
          reference_number: refNumber,
          owner_approval_status: 'approved',
          notes: `Services: ${combinedName}`
        };

        if (customerId) {
          insertPayload['customer_id'] = customerId;
        }

        const { data: aptData, error: aptErr } = await this.supabase.clientInstance
          .from('appointments')
          .insert(insertPayload)
          .select('id, reference_number')
          .single();

        // STRICT CHECK: Stop immediately if database insert failed
        if (aptErr || !aptData?.id) {
          console.error('[BookingService] Failed to insert appointment into Supabase:', aptErr);
          const userErrMsg = this.normalizeBookingError(aptErr || 'Could not save appointment in database.');
          this.errorMessage.set(userErrMsg);
          this.confirmedBooking.set(null);
          return {
            success: false,
            message: userErrMsg
          };
        }

        const savedAppointmentId = aptData.id;
        const savedRefNumber = aptData.reference_number || refNumber;

        // 3. Link appointment services if junction table exists
        if (payload.serviceIds && payload.serviceIds.length > 0) {
          try {
            const isUuid = (id?: string) => !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
            const validServiceIds = payload.serviceIds.filter(isUuid);
            if (validServiceIds.length > 0) {
              const srvRows = validServiceIds.map(sid => ({
                appointment_id: savedAppointmentId,
                service_id: sid
              }));
              await this.supabase.clientInstance.from('appointment_services').insert(srvRows);
            }
          } catch (junctionErr) {
            console.warn('[BookingService] appointment_services insert note:', junctionErr);
          }
        }

        // 4. Confirmed booking ONLY after Supabase successfully returned the new record
        const bookingResult: BookingResponse = {
          success: true,
          appointmentId: savedAppointmentId,
          referenceNumber: savedRefNumber,
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
        // Offline / demo fallback
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
      const userMessage = this.normalizeBookingError(err);
      this.errorMessage.set(userMessage);
      this.confirmedBooking.set(null);
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
    const msg = error?.message || error?.details || (typeof error === 'string' ? error : '');
    if (!msg) {
      return 'Unable to complete your reservation. Please try again or call +91 78488 27245.';
    }
    if (msg.toLowerCase().includes('no longer available') || msg.toLowerCase().includes('already booked')) {
      return 'Sorry, this time slot was just booked by someone else. Please choose another time.';
    }
    if (msg.toLowerCase().includes('closed')) {
      return 'The salon is closed on this date.';
    }
    return `Unable to complete booking: ${msg}`;
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
        available: true,
        displayStart: this.formatTime12Hour(t.start),
        displayEnd: this.formatTime12Hour(calculatedEnd),
        period: t.period
      };
    });
  }
}
