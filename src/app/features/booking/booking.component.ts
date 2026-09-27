import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SalonInfoService } from '../../core/services/salon.service';
import { BookingService } from '../../core/services/booking.service';
import { SalonService } from '../../core/models/service.model';
import { FormattedSlot } from '../../core/models/slot.model';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="booking-page">
      <!-- Booking Header -->
      <section class="booking-header">
        <div class="container text-center">
          <span class="section-eyebrow">Online Reservation</span>
          <h1 class="page-title">Book Your Appointment</h1>
          <p class="page-subtitle">
            Direct real-time 30-minute booking. Reserved exclusively for your chair at The Croppers.
          </p>
        </div>
      </section>

      <!-- Main Booking Wizard Area -->
      <section class="section booking-wizard-section">
        <div class="container wizard-container">

          <!-- Success View -->
          @if (bookingService.confirmedBooking(); as confirmed) {
            <div class="croppers-card success-card">
              <div class="success-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="check-icon">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>

              <span class="badge badge-gold success-badge">Booking Confirmed</span>
              <h2 class="success-title">Your Chair is Reserved</h2>
              <p class="success-subtitle">
                We look forward to welcoming you at The Croppers in Jabalpur.
              </p>

              <div class="confirmation-details-box">
                <div class="detail-row highlight-ref">
                  <span class="detail-label">Booking Reference</span>
                  <span class="detail-value ref-badge">{{ confirmed.referenceNumber }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Service</span>
                  <span class="detail-value">{{ confirmed.serviceName }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Date</span>
                  <span class="detail-value">{{ confirmed.date }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Reserved Window</span>
                  <span class="detail-value">{{ confirmed.slotStart }} – {{ confirmed.slotEnd }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Guest Name</span>
                  <span class="detail-value">{{ confirmed.customerName }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Phone</span>
                  <span class="detail-value">+91 {{ confirmed.customerPhone }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Status</span>
                  <span class="detail-value status-booked">Booked</span>
                </div>
              </div>

              <div class="salon-arrival-tip">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>Please arrive 5 minutes prior to your reserved time. Need assistance? Call <strong>+91 78488 27245</strong>.</span>
              </div>

              <div class="success-actions">
                <button type="button" class="btn btn-outline" (click)="bookAnother()">
                  Book Another Appointment
                </button>
                <a routerLink="/" class="btn btn-ghost">
                  Return to Home
                </a>
              </div>
            </div>
          } @else {
            <!-- Guided Step Progress Bar -->
            <div class="wizard-stepper">
              <div 
                class="step-node" 
                [class.active]="currentStep() === 1" 
                [class.completed]="currentStep() > 1"
                (click)="goToStep(1)">
                <span class="step-num">1</span>
                <span class="step-text">Service</span>
              </div>
              <div class="step-connector" [class.filled]="currentStep() > 1"></div>

              <div 
                class="step-node" 
                [class.active]="currentStep() === 2" 
                [class.completed]="currentStep() > 2"
                (click)="goToStep(2)">
                <span class="step-num">2</span>
                <span class="step-text">Date</span>
              </div>
              <div class="step-connector" [class.filled]="currentStep() > 2"></div>

              <div 
                class="step-node" 
                [class.active]="currentStep() === 3" 
                [class.completed]="currentStep() > 3"
                (click)="goToStep(3)">
                <span class="step-num">3</span>
                <span class="step-text">Slot</span>
              </div>
              <div class="step-connector" [class.filled]="currentStep() > 3"></div>

              <div 
                class="step-node" 
                [class.active]="currentStep() === 4" 
                [class.completed]="currentStep() > 4"
                (click)="goToStep(4)">
                <span class="step-num">4</span>
                <span class="step-text">Details</span>
              </div>
              <div class="step-connector" [class.filled]="currentStep() > 4"></div>

              <div 
                class="step-node" 
                [class.active]="currentStep() === 5"
                (click)="goToStep(5)">
                <span class="step-num">5</span>
                <span class="step-text">Confirm</span>
              </div>
            </div>

            <!-- Error Banner -->
            @if (bookingService.errorMessage(); as err) {
              <div class="croppers-alert alert-danger" role="alert">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>{{ err }}</span>
              </div>
            }

            <!-- STEP 1: SERVICE SELECTION -->
            @if (currentStep() === 1) {
              <div class="step-panel">
                <div class="step-header">
                  <span class="step-badge">Step 1 of 5</span>
                  <h2 class="step-title">Select A Service</h2>
                  <p class="step-desc">Choose from our signature hair, beard, and skin care rituals.</p>
                </div>

                @if (isLoadingServices()) {
                  <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Loading available salon treatments...</p>
                  </div>
                } @else {
                  <div class="services-selection-grid">
                    @for (service of availableServices(); track service.id) {
                      <div 
                        class="croppers-card service-pick-card" 
                        [class.selected]="bookingService.state().serviceId === service.id"
                        (click)="selectService(service)">
                        <div class="card-radio-indicator">
                          <span class="radio-dot"></span>
                        </div>
                        <div class="card-content">
                          <span class="service-category">{{ service.category_name || 'Treatment' }}</span>
                          <h3 class="service-name">{{ service.name }}</h3>
                          <p class="service-desc">{{ service.description }}</p>
                          <div class="service-chips">
                            <span class="spec-chip">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                              </svg>
                              {{ service.duration_minutes }} min
                            </span>
                            <span class="price-chip">₹{{ service.price }}</span>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                }

                <div class="step-actions">
                  <button 
                    type="button" 
                    class="btn btn-primary btn-lg" 
                    [disabled]="!bookingService.isServiceSelected()"
                    (click)="nextStep()">
                    Continue to Date
                  </button>
                </div>
              </div>
            }

            <!-- STEP 2: DATE SELECTION -->
            @if (currentStep() === 2) {
              <div class="step-panel">
                <div class="step-header">
                  <span class="step-badge">Step 2 of 5</span>
                  <h2 class="step-title">Select Preferred Date</h2>
                  <p class="step-desc">The salon operates 7 days a week in Jabalpur. Same-day bookings accepted based on availability.</p>
                </div>

                <div class="date-selector-wrapper">
                  <!-- Quick Date Selector Buttons for Next 7 Days -->
                  <div class="quick-days-carousel">
                    @for (day of upcomingDays(); track day.dateStr) {
                      <button 
                        type="button" 
                        class="quick-day-btn" 
                        [class.selected]="bookingService.state().date === day.dateStr"
                        (click)="onDateSelected(day.dateStr)">
                        <span class="day-name">{{ day.dayLabel }}</span>
                        <span class="day-num">{{ day.dayNumber }}</span>
                        <span class="day-month">{{ day.monthLabel }}</span>
                      </button>
                    }
                  </div>

                  <!-- Standard HTML5 Date Picker for arbitrary future dates -->
                  <div class="form-group custom-date-input-group">
                    <label class="form-label" for="datePicker">Or Choose Specific Date:</label>
                    <input 
                      type="date" 
                      id="datePicker" 
                      class="form-control" 
                      [min]="minDateString" 
                      [value]="bookingService.state().date || ''" 
                      (change)="onDateInputChange($event)">
                  </div>
                </div>

                <div class="step-actions dual-actions">
                  <button type="button" class="btn btn-ghost" (click)="prevStep()">
                    Back to Service
                  </button>
                  <button 
                    type="button" 
                    class="btn btn-primary btn-lg" 
                    [disabled]="!bookingService.isDateSelected()"
                    (click)="onProceedToSlots()">
                    View Available Slots
                  </button>
                </div>
              </div>
            }

            <!-- STEP 3: TIME SLOT SELECTION -->
            @if (currentStep() === 3) {
              <div class="step-panel">
                <div class="step-header">
                  <span class="step-badge">Step 3 of 5</span>
                  <h2 class="step-title">Choose Time Slot</h2>
                  <p class="step-desc">
                    30-minute booking capacity for <strong>{{ bookingService.state().serviceName }}</strong> on <strong>{{ bookingService.state().date }}</strong>.
                  </p>
                </div>

                @if (bookingService.isLoadingSlots()) {
                  <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Querying Supabase available slots...</p>
                  </div>
                } @else if (availableSlots().length === 0) {
                  <div class="empty-slots-box">
                    <p>No available slots found for this date. The salon may be fully booked or closed on this day.</p>
                    <button type="button" class="btn btn-outline" (click)="goToStep(2)">
                      Choose Another Date
                    </button>
                  </div>
                } @else {
                  <!-- Slots by Period -->
                  <div class="slots-period-group">
                    <h4 class="period-title">Available Times</h4>
                    <div class="slots-grid">
                      @for (slot of availableSlots(); track slot.slot_start) {
                        <button 
                          type="button" 
                          class="slot-btn" 
                          [class.available]="slot.available"
                          [class.unavailable]="!slot.available"
                          [class.selected]="bookingService.state().slotStart === slot.slot_start"
                          [disabled]="!slot.available"
                          (click)="selectSlot(slot)">
                          <span class="slot-time">{{ slot.displayStart }}</span>
                          <span class="slot-status-tag">
                            {{ slot.available ? 'Available' : 'Booked' }}
                          </span>
                        </button>
                      }
                    </div>
                  </div>
                }

                <div class="step-actions dual-actions">
                  <button type="button" class="btn btn-ghost" (click)="prevStep()">
                    Back to Date
                  </button>
                  <button 
                    type="button" 
                    class="btn btn-primary btn-lg" 
                    [disabled]="!bookingService.isSlotSelected()"
                    (click)="nextStep()">
                    Continue to Details
                  </button>
                </div>
              </div>
            }

            <!-- STEP 4: CUSTOMER DETAILS -->
            @if (currentStep() === 4) {
              <div class="step-panel">
                <div class="step-header">
                  <span class="step-badge">Step 4 of 5</span>
                  <h2 class="step-title">Customer Details</h2>
                  <p class="step-desc">Enter your contact info so we can confirm and welcome you at The Croppers.</p>
                </div>

                <form [formGroup]="customerForm" class="customer-details-form" (ngSubmit)="onCustomerDetailsSubmit()">
                  <div class="form-group">
                    <label class="form-label" for="customerName">Your Full Name *</label>
                    <input 
                      type="text" 
                      id="customerName" 
                      formControlName="name" 
                      class="form-control" 
                      placeholder="e.g. John Doe">
                    @if (customerForm.get('name')?.invalid && customerForm.get('name')?.touched) {
                      <span class="form-error">Please enter your name (at least 2 characters).</span>
                    }
                  </div>

                  <div class="form-group">
                    <label class="form-label" for="customerPhone">Mobile Number (India) *</label>
                    <div class="phone-input-group">
                      <span class="phone-prefix">+91</span>
                      <input 
                        type="tel" 
                        id="customerPhone" 
                        formControlName="phone" 
                        class="form-control" 
                        placeholder="9876543210"
                        maxlength="10">
                    </div>
                    @if (customerForm.get('phone')?.invalid && customerForm.get('phone')?.touched) {
                      <span class="form-error">Please enter a valid 10-digit Indian phone number.</span>
                    }
                    <span class="form-hint">No password or account creation required.</span>
                  </div>

                  <div class="step-actions dual-actions">
                    <button type="button" class="btn btn-ghost" (click)="prevStep()">
                      Back to Slot
                    </button>
                    <button 
                      type="submit" 
                      class="btn btn-primary btn-lg" 
                      [disabled]="customerForm.invalid">
                      Review & Confirm
                    </button>
                  </div>
                </form>
              </div>
            }

            <!-- STEP 5: REVIEW & CONFIRM -->
            @if (currentStep() === 5) {
              <div class="step-panel">
                <div class="step-header">
                  <span class="step-badge">Step 5 of 5</span>
                  <h2 class="step-title">Review & Confirm</h2>
                  <p class="step-desc">Please verify your booking details before reserving your chair.</p>
                </div>

                <div class="croppers-card summary-card">
                  <div class="summary-header">
                    <span class="summary-salon-title">The Croppers</span>
                    <span class="summary-salon-sub">Jabalpur, Madhya Pradesh</span>
                  </div>

                  <div class="summary-body">
                    <div class="summary-item">
                      <span class="item-label">Selected Ritual</span>
                      <span class="item-value highlight">{{ bookingService.state().serviceName }}</span>
                    </div>

                    <div class="summary-item">
                      <span class="item-label">Duration & Price</span>
                      <span class="item-value">{{ bookingService.state().serviceDuration }} min — ₹{{ bookingService.state().servicePrice }}</span>
                    </div>

                    <div class="summary-item">
                      <span class="item-label">Date</span>
                      <span class="item-value">{{ bookingService.state().date }}</span>
                    </div>

                    <div class="summary-item">
                      <span class="item-label">Scheduled Time Window</span>
                      <span class="item-value text-gold">{{ formatTime12Hour(bookingService.state().slotStart) }} – {{ formatTime12Hour(bookingService.state().slotEnd) }}</span>
                    </div>

                    <div class="summary-divider"></div>

                    <div class="summary-item">
                      <span class="item-label">Guest Name</span>
                      <span class="item-value">{{ bookingService.state().customerName }}</span>
                    </div>

                    <div class="summary-item">
                      <span class="item-label">Contact Phone</span>
                      <span class="item-value">+91 {{ bookingService.state().customerPhone }}</span>
                    </div>
                  </div>

                  <div class="summary-notice">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                    <span>Instant confirmation. Pay at the salon after service.</span>
                  </div>
                </div>

                <div class="step-actions dual-actions">
                  <button type="button" class="btn btn-ghost" (click)="prevStep()" [disabled]="bookingService.isSubmitting()">
                    Back to Details
                  </button>
                  <button 
                    type="button" 
                    class="btn btn-primary btn-lg" 
                    [disabled]="bookingService.isSubmitting()"
                    (click)="confirmBooking()">
                    @if (bookingService.isSubmitting()) {
                      <span>Reserving via Supabase...</span>
                    } @else {
                      <span>Confirm Booking</span>
                    }
                  </button>
                </div>
              </div>
            }
          }
        </div>
      </section>
    </div>
  `,
  styleUrl: './booking.component.css'
})
export class BookingComponent implements OnInit {
  readonly salonService = inject(SalonInfoService);
  readonly bookingService = inject(BookingService);
  private readonly fb = inject(FormBuilder);

  readonly currentStep = signal<number>(1);
  readonly availableServices = signal<SalonService[]>([]);
  readonly isLoadingServices = signal<boolean>(true);
  readonly availableSlots = signal<FormattedSlot[]>([]);

  customerForm: FormGroup;
  minDateString: string = '';

  constructor() {
    this.customerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]]
    });
  }

  async ngOnInit(): Promise<void> {
    const today = new Date();
    this.minDateString = this.formatDateIso(today);

    // If service was already selected from another page, advance to step 2 or sync
    if (this.bookingService.isServiceSelected() && !this.bookingService.isDateSelected()) {
      this.currentStep.set(2);
    } else if (this.bookingService.isReadyToConfirm()) {
      this.currentStep.set(5);
    }

    try {
      const services = await this.salonService.getServices();
      this.availableServices.set(services);
    } finally {
      this.isLoadingServices.set(false);
    }

    // Populate form if returning
    if (this.bookingService.state().customerName) {
      this.customerForm.patchValue({
        name: this.bookingService.state().customerName,
        phone: this.bookingService.state().customerPhone
      });
    }
  }

  // Next 7 days helper
  readonly upcomingDays = computed(() => {
    const days: { dateStr: string; dayLabel: string; dayNumber: number; monthLabel: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const dateStr = this.formatDateIso(d);
      const dayLabel = i === 0 ? 'Today' : d.toLocaleDateString('en-IN', { weekday: 'short' });
      const dayNumber = d.getDate();
      const monthLabel = d.toLocaleDateString('en-IN', { month: 'short' });
      days.push({ dateStr, dayLabel, dayNumber, monthLabel });
    }
    return days;
  });

  selectService(service: SalonService): void {
    this.bookingService.selectService(service);
  }

  onDateSelected(dateStr: string): void {
    this.bookingService.selectDate(dateStr);
  }

  onDateInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.value) {
      this.bookingService.selectDate(input.value);
    }
  }

  async onProceedToSlots(): Promise<void> {
    const state = this.bookingService.state();
    if (!state.date || !state.serviceId) return;

    this.currentStep.set(3);
    const slots = await this.bookingService.fetchAvailableSlots(state.date, state.serviceId);
    this.availableSlots.set(slots);
  }

  selectSlot(slot: FormattedSlot): void {
    if (!slot.available) return;
    this.bookingService.selectSlot(slot);
  }

  onCustomerDetailsSubmit(): void {
    if (this.customerForm.valid) {
      const { name, phone } = this.customerForm.value;
      this.bookingService.updateCustomerDetails(name.trim(), phone.trim());
      this.currentStep.set(5);
    }
  }

  async confirmBooking(): Promise<void> {
    const res = await this.bookingService.submitBooking();
    if (!res.success && res.message?.includes('just booked')) {
      // Re-fetch slots if contention occurred
      const state = this.bookingService.state();
      if (state.date && state.serviceId) {
        const slots = await this.bookingService.fetchAvailableSlots(state.date, state.serviceId);
        this.availableSlots.set(slots);
        this.currentStep.set(3);
      }
    }
  }

  bookAnother(): void {
    this.bookingService.resetBooking();
    this.customerForm.reset();
    this.currentStep.set(1);
  }

  goToStep(step: number): void {
    // Only allow going back or jumping to completed steps
    if (step < this.currentStep()) {
      this.currentStep.set(step);
    }
  }

  nextStep(): void {
    this.currentStep.update(s => s + 1);
  }

  prevStep(): void {
    this.currentStep.update(s => Math.max(1, s - 1));
  }

  formatTime12Hour(timeStr: string | null): string {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    let hour = parseInt(parts[0], 10);
    const minute = parts[1] || '00';
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${hour}:${minute} ${ampm}`;
  }

  private formatDateIso(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
