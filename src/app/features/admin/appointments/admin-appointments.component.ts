import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { AdminAppointment, StaffMember } from '../../../core/models/admin.model';
import { SalonService } from '../../../core/models/service.model';

@Component({
  selector: 'app-admin-appointments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container appointments-container">
      <!-- Title & Action Bar -->
      <div class="page-title-row">
        <div>
          <span class="section-eyebrow">
            {{ adminService.isSuperadmin() ? 'Appointment Dispatch' : 'Station Schedule' }}
          </span>
          <h1 class="page-title">
            {{ adminService.isSuperadmin() ? 'Manage Appointments' : 'My Assigned Appointments' }}
          </h1>
          <p class="page-subtitle">
            {{ adminService.isSuperadmin() 
              ? 'Superadmin View: Full assignment, walk-in creation, editing, and status management.' 
              : 'Staff View: Floor queue & status updating for your personal clients (Logged in: ' + currentStaffName() + ').' }}
          </p>
        </div>

        <!-- Superadmin Action: Book Walk-in Client -->
        @if (adminService.isSuperadmin()) {
          <button type="button" class="btn btn-primary" (click)="openWalkinModal()">
            + Book Walk-in / Phone Client
          </button>
        }
      </div>

      <!-- Toast Feedback Message -->
      @if (actionFeedback(); as feedback) {
        <div class="croppers-alert alert-success">
          <span>✓ {{ feedback }}</span>
        </div>
      }

      <!-- Filter Controls Toolbar -->
      <div class="croppers-card toolbar-card">
        <div class="toolbar-grid">
          <!-- Date Filter -->
          <div class="filter-group">
            <span class="filter-label">Filter Date:</span>
            <div class="date-quick-btns">
              <button 
                type="button" 
                class="quick-filter-btn" 
                [class.active]="selectedDateMode() === 'today'" 
                (click)="setDateMode('today')">
                Today
              </button>
              <button 
                type="button" 
                class="quick-filter-btn" 
                [class.active]="selectedDateMode() === 'tomorrow'" 
                (click)="setDateMode('tomorrow')">
                Tomorrow
              </button>
              <button 
                type="button" 
                class="quick-filter-btn" 
                [class.active]="selectedDateMode() === 'all'" 
                (click)="setDateMode('all')">
                All Dates
              </button>
            </div>
            <input 
              type="date" 
              class="form-control date-picker-input" 
              [value]="selectedCustomDate()" 
              (change)="onCustomDateChange($event)">
          </div>

          <!-- Status Filter -->
          <div class="filter-group">
            <span class="filter-label">Status:</span>
            <div class="status-filter-pills">
              <button 
                type="button" 
                class="status-pill-btn" 
                [class.active]="selectedStatus() === 'all'" 
                (click)="setStatusFilter('all')">
                All
              </button>
              <button 
                type="button" 
                class="status-pill-btn" 
                [class.active]="selectedStatus() === 'booked'" 
                (click)="setStatusFilter('booked')">
                Booked
              </button>
              <button 
                type="button" 
                class="status-pill-btn" 
                [class.active]="selectedStatus() === 'completed'" 
                (click)="setStatusFilter('completed')">
                Completed
              </button>
              <button 
                type="button" 
                class="status-pill-btn" 
                [class.active]="selectedStatus() === 'cancelled'" 
                (click)="setStatusFilter('cancelled')">
                Cancelled
              </button>
              <button 
                type="button" 
                class="status-pill-btn" 
                [class.active]="selectedStatus() === 'no_show'" 
                (click)="setStatusFilter('no_show')">
                No-Show
              </button>
            </div>
          </div>

          <!-- Staff Specific / Unassigned Toggle -->
          <div class="filter-group toggle-group">
            @if (adminService.isSuperadmin()) {
              <div class="superadmin-filters">
                <label class="toggle-label">
                  <input 
                    type="checkbox" 
                    [checked]="unassignedOnly()" 
                    (change)="toggleUnassigned($event)">
                  <span class="toggle-text">Needs Stylist</span>
                </label>
                <select class="form-control staff-filter-select" (change)="onStaffFilterChange($event)" [value]="selectedStaffId()">
                  <option value="">All Stylists</option>
                  @for (s of staffList(); track s.id) {
                    <option [value]="s.id">{{ s.name }} ({{ s.role }})</option>
                  }
                </select>
              </div>
            } @else {
              <div class="staff-scope-pill">
                <span class="lock-icon">🔒</span>
                <span>Personal Station: <strong>{{ currentStaffName() }}</strong></span>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Results Count -->
      <div class="results-header">
        <span class="results-count">
          Showing <strong>{{ filteredAppointments().length }}</strong> appointment{{ filteredAppointments().length === 1 ? '' : 's' }}
        </span>
        @if (unassignedCount() > 0 && adminService.isSuperadmin()) {
          <span class="badge badge-gold">
            {{ unassignedCount() }} Unassigned Booking{{ unassignedCount() === 1 ? '' : 's' }}
          </span>
        }
      </div>

      <!-- Appointments List Grid -->
      @if (filteredAppointments().length === 0) {
        <div class="croppers-card empty-state-card">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="48" height="48" class="empty-icon">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <h3>No Appointments Found</h3>
          <p>There are no appointments matching your selected filters.</p>
          <button type="button" class="btn btn-outline btn-sm" (click)="resetFilters()">
            Clear Filters
          </button>
        </div>
      } @else {
        <div class="appointments-grid">
          @for (apt of filteredAppointments(); track apt.id) {
            <div class="croppers-card appointment-card" [class.unassigned-card]="apt.assignedStaff.length === 0 && apt.status === 'booked'">
              <!-- Card Header -->
              <div class="apt-card-top">
                <div class="apt-ref-group">
                  <span class="ref-num">{{ apt.referenceNumber }}</span>
                  <span class="apt-date">{{ apt.date }}</span>
                </div>
                <div class="apt-status-tag" [class]="'status-' + apt.status">
                  {{ apt.status | uppercase }}
                </div>
              </div>

              <!-- Main Content -->
              <div class="apt-body">
                <div class="time-block">
                  <span class="time-range">{{ formatTime12(apt.startTime) }} – {{ formatTime12(apt.endTime) }}</span>
                  <span class="time-duration">{{ apt.service.durationMinutes }} Minutes</span>
                </div>

                <div class="client-block">
                  <h3 class="client-name">{{ apt.customer.name }}</h3>
                  <a [href]="'tel:' + apt.customer.phone" class="client-phone">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    +91 {{ apt.customer.phone }}
                  </a>
                </div>

                <div class="service-block">
                  <span class="srv-label">Service:</span>
                  <span class="srv-name">{{ apt.service.name }}</span>
                  <span class="srv-price">₹{{ apt.service.price }}</span>
                </div>

                <!-- Staff Assignment Box (SUPERADMIN CAN ASSIGN, STAFF CAN ONLY VIEW) -->
                <div class="staff-assignment-box">
                  <span class="assignment-label">Assigned Stylist:</span>
                  @if (apt.assignedStaff.length > 0) {
                    <div class="assigned-staff-info">
                      <div class="staff-badge">
                        <span class="stylist-icon">✂</span>
                        <strong>
                          {{ adminService.isStaff() ? 'Assigned to You (' + apt.assignedStaff[0].name + ')' : apt.assignedStaff[0].name }}
                        </strong>
                        <span class="staff-role-sub">({{ apt.assignedStaff[0].role }})</span>
                      </div>
                      
                      @if (adminService.isSuperadmin()) {
                        <button 
                          type="button" 
                          class="btn btn-ghost btn-sm reassign-btn" 
                          (click)="openAssignModal(apt)">
                          Reassign
                        </button>
                      }
                    </div>
                  } @else {
                    <div class="unassigned-prompt">
                      <span class="unassigned-warning-tag">⚠️ Unassigned</span>
                      
                      @if (adminService.isSuperadmin()) {
                        <button 
                          type="button" 
                          class="btn btn-primary btn-sm assign-cta-btn" 
                          (click)="openAssignModal(apt)">
                          Assign Stylist Now
                        </button>
                      } @else {
                        <span class="staff-pending-note">Pending Superadmin Assignment</span>
                      }
                    </div>
                  }
                </div>
              </div>

              <!-- Action Bar for Status Transitions & Superadmin Edit/Delete -->
              <div class="apt-actions-row">
                <div class="action-buttons-group">
                  @if (apt.status === 'booked') {
                    <button 
                      type="button" 
                      class="btn btn-ghost btn-sm complete-btn" 
                      title="Mark as Completed"
                      (click)="updateStatus(apt, 'completed')">
                      ✓ Complete
                    </button>
                    @if (adminService.isSuperadmin()) {
                      <button 
                        type="button" 
                        class="btn btn-ghost btn-sm cancel-btn" 
                        title="Cancel Appointment"
                        (click)="updateStatus(apt, 'cancelled')">
                        Cancel
                      </button>
                    }
                    <button 
                      type="button" 
                      class="btn btn-ghost btn-sm noshow-btn" 
                      title="Mark as No Show"
                      (click)="updateStatus(apt, 'no_show')">
                      No-Show
                    </button>
                  } @else if (apt.status === 'completed') {
                    <span class="status-note completed-note">✓ Service Completed</span>
                  } @else if (apt.status === 'cancelled') {
                    <span class="status-note cancelled-note">Cancelled</span>
                  } @else if (apt.status === 'no_show') {
                    <span class="status-note noshow-note">Client No-Show</span>
                  }
                </div>

                <!-- Superadmin Edit & Delete Actions -->
                @if (adminService.isSuperadmin()) {
                  <div class="superadmin-card-actions">
                    <button type="button" class="action-icon-btn edit-icon" title="Edit Appointment" (click)="openEditModal(apt)">
                      ✎
                    </button>
                    <button type="button" class="action-icon-btn delete-icon" title="Delete Booking" (click)="confirmDelete(apt)">
                      🗑
                    </button>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- 1. STYLIST ASSIGNMENT MODAL (SUPERADMIN ONLY) -->
      @if (activeModalAppointment(); as modalApt) {
        <div class="modal-backdrop" (click)="closeAssignModal()">
          <div class="croppers-card modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title">Assign Stylist (Superadmin)</h3>
              <button type="button" class="close-modal-btn" (click)="closeAssignModal()">✕</button>
            </div>

            <div class="modal-apt-summary">
              <div class="summary-line">
                <span class="lbl">Guest:</span> <strong>{{ modalApt.customer.name }}</strong>
              </div>
              <div class="summary-line">
                <span class="lbl">Service:</span> {{ modalApt.service.name }} ({{ modalApt.service.durationMinutes }}m)
              </div>
              <div class="summary-line">
                <span class="lbl">Slot:</span> {{ formatTime12(modalApt.startTime) }} – {{ formatTime12(modalApt.endTime) }}
              </div>
            </div>

            <p class="modal-instruction">Select an internal stylist for this service:</p>

            <div class="staff-options-list">
              @for (staff of staffList(); track staff.id) {
                <div 
                  class="staff-option-card" 
                  [class.current]="modalApt.assignedStaff.length > 0 && modalApt.assignedStaff[0].id === staff.id"
                  (click)="confirmAssignment(modalApt, staff)">
                  <div class="staff-option-avatar">{{ staff.name.charAt(0) }}</div>
                  <div class="staff-option-info">
                    <span class="name">{{ staff.name }}</span>
                    <span class="role">{{ staff.role }} • {{ staff.specialization | uppercase }}</span>
                  </div>
                  <button type="button" class="btn btn-outline btn-sm">
                    Select {{ staff.name }}
                  </button>
                </div>
              }
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-ghost" (click)="closeAssignModal()">
                Close
              </button>
            </div>
          </div>
        </div>
      }

      <!-- 2. BOOK WALK-IN / PHONE CLIENT MODAL (SUPERADMIN ONLY) -->
      @if (isWalkinModalOpen()) {
        <div class="modal-backdrop" (click)="closeWalkinModal()">
          <div class="croppers-card modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title">Book Walk-in / Phone Client</h3>
              <button type="button" class="close-modal-btn" (click)="closeWalkinModal()">✕</button>
            </div>

            <form [formGroup]="walkinForm" (ngSubmit)="saveWalkinBooking()" class="walkin-form">
              <div class="form-group">
                <label class="form-label">Guest Full Name *</label>
                <input type="text" formControlName="customerName" class="form-control" placeholder="e.g. Ramesh Patel">
              </div>

              <div class="form-group">
                <label class="form-label">Phone Number (10 Digits) *</label>
                <input type="tel" formControlName="customerPhone" class="form-control" placeholder="9826123456" maxlength="10">
              </div>

              <div class="form-group">
                <label class="form-label">Select Treatment *</label>
                <select formControlName="serviceId" class="form-control">
                  @for (srv of servicesList(); track srv.id) {
                    <option [value]="srv.id">{{ srv.name }} ({{ srv.duration_minutes }}m — ₹{{ srv.price }})</option>
                  }
                </select>
              </div>

              <div class="form-row">
                <div class="form-group col-half">
                  <label class="form-label">Date *</label>
                  <input type="date" formControlName="date" class="form-control">
                </div>
                <div class="form-group col-half">
                  <label class="form-label">Time Slot *</label>
                  <select formControlName="startTime" class="form-control">
                    <option value="10:00">10:00 AM</option>
                    <option value="10:30">10:30 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="11:30">11:30 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="12:30">12:30 PM</option>
                    <option value="13:00">01:00 PM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="15:00">03:00 PM</option>
                    <option value="16:00">04:00 PM</option>
                    <option value="17:00">05:00 PM</option>
                    <option value="18:00">06:00 PM</option>
                    <option value="19:00">07:00 PM</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Assign Stylist (Optional)</label>
                <select formControlName="staffId" class="form-control">
                  <option value="">Leave Unassigned (Assign Later)</option>
                  @for (st of staffList(); track st.id) {
                    <option [value]="st.id">{{ st.name }} ({{ st.role }})</option>
                  }
                </select>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-ghost" (click)="closeWalkinModal()">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="walkinForm.invalid">
                  Create Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- 3. EDIT APPOINTMENT MODAL (SUPERADMIN ONLY) -->
      @if (editingAppointment(); as apt) {
        <div class="modal-backdrop" (click)="closeEditModal()">
          <div class="croppers-card modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title">Edit Appointment ({{ apt.referenceNumber }})</h3>
              <button type="button" class="close-modal-btn" (click)="closeEditModal()">✕</button>
            </div>

            <form [formGroup]="editForm" (ngSubmit)="saveEditedAppointment(apt)" class="edit-form">
              <div class="form-group">
                <label class="form-label">Guest Name</label>
                <input type="text" formControlName="customerName" class="form-control">
              </div>

              <div class="form-group">
                <label class="form-label">Phone</label>
                <input type="tel" formControlName="customerPhone" class="form-control">
              </div>

              <div class="form-group">
                <label class="form-label">Service</label>
                <select formControlName="serviceId" class="form-control">
                  @for (srv of servicesList(); track srv.id) {
                    <option [value]="srv.id">{{ srv.name }} (₹{{ srv.price }})</option>
                  }
                </select>
              </div>

              <div class="form-row">
                <div class="form-group col-half">
                  <label class="form-label">Date</label>
                  <input type="date" formControlName="date" class="form-control">
                </div>
                <div class="form-group col-half">
                  <label class="form-label">Start Time</label>
                  <input type="time" formControlName="startTime" class="form-control">
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-ghost" (click)="closeEditModal()">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="editForm.invalid">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- 4. DELETE CONFIRMATION MODAL (SUPERADMIN ONLY) -->
      @if (deletingAppointment(); as aptToDelete) {
        <div class="modal-backdrop" (click)="cancelDelete()">
          <div class="croppers-card modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title">Delete Booking</h3>
              <button type="button" class="close-modal-btn" (click)="cancelDelete()">✕</button>
            </div>
            <p class="delete-warning">
              Are you sure you want to permanently delete appointment <strong>{{ aptToDelete.referenceNumber }}</strong> for <strong>{{ aptToDelete.customer.name }}</strong>?
            </p>
            <div class="modal-footer">
              <button type="button" class="btn btn-ghost" (click)="cancelDelete()">Cancel</button>
              <button type="button" class="btn btn-primary delete-confirm-btn" (click)="executeDelete(aptToDelete)">
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './admin-appointments.component.css'
})
export class AdminAppointmentsComponent implements OnInit {
  readonly adminService = inject(AdminService);
  private readonly fb = inject(FormBuilder);

  readonly appointments = signal<AdminAppointment[]>([]);
  readonly staffList = signal<StaffMember[]>([]);
  readonly servicesList = signal<SalonService[]>([]);

  readonly selectedDateMode = signal<'today' | 'tomorrow' | 'all' | 'custom'>('today');
  readonly selectedCustomDate = signal<string>(new Date().toISOString().split('T')[0]);
  readonly selectedStatus = signal<'all' | 'booked' | 'completed' | 'cancelled' | 'no_show'>('all');
  readonly unassignedOnly = signal<boolean>(false);
  readonly selectedStaffId = signal<string>('');

  readonly currentStaffMember = computed(() => {
    const staffId = this.adminService.currentStaffId();
    return this.staffList().find(s => s.id === staffId);
  });

  readonly currentStaffName = computed(() => {
    return this.currentStaffMember()?.name || this.adminService.currentUser()?.name || 'Stylist';
  });

  readonly activeModalAppointment = signal<AdminAppointment | null>(null);
  readonly isWalkinModalOpen = signal<boolean>(false);
  readonly editingAppointment = signal<AdminAppointment | null>(null);
  readonly deletingAppointment = signal<AdminAppointment | null>(null);
  readonly actionFeedback = signal<string | null>(null);

  walkinForm: FormGroup = this.fb.group({
    customerName: ['', [Validators.required, Validators.minLength(2)]],
    customerPhone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
    serviceId: ['', [Validators.required]],
    date: [new Date().toISOString().split('T')[0], [Validators.required]],
    startTime: ['11:00', [Validators.required]],
    staffId: ['']
  });

  editForm: FormGroup = this.fb.group({
    customerName: ['', [Validators.required, Validators.minLength(2)]],
    customerPhone: ['', [Validators.required]],
    serviceId: ['', [Validators.required]],
    date: ['', [Validators.required]],
    startTime: ['', [Validators.required]]
  });

  async ngOnInit(): Promise<void> {
    await this.refreshData();
  }

  async refreshData(): Promise<void> {
    const [staff, apts, services] = await Promise.all([
      this.adminService.getStaffMembers(),
      this.adminService.getAppointments(),
      this.adminService.getServices()
    ]);
    this.staffList.set(staff);
    this.appointments.set(apts);
    this.servicesList.set(services);

    if (services.length > 0 && !this.walkinForm.get('serviceId')?.value) {
      this.walkinForm.patchValue({ serviceId: services[0].id });
    }
  }

  readonly unassignedCount = computed(() =>
    this.appointments().filter(a => a.assignedStaff.length === 0 && a.status === 'booked').length
  );

  readonly filteredAppointments = computed(() => {
    let list = this.appointments();

    const mode = this.selectedDateMode();
    const todayStr = this.getTodayIso();
    const tomorrowStr = this.getTomorrowIso();

    if (mode === 'today') {
      list = list.filter(a => a.date === todayStr);
    } else if (mode === 'tomorrow') {
      list = list.filter(a => a.date === tomorrowStr);
    } else if (mode === 'custom' && this.selectedCustomDate()) {
      list = list.filter(a => a.date === this.selectedCustomDate());
    }

    const status = this.selectedStatus();
    if (status !== 'all') {
      list = list.filter(a => a.status === status);
    }

    if (this.adminService.isSuperadmin()) {
      if (this.unassignedOnly()) {
        list = list.filter(a => a.assignedStaff.length === 0 && a.status === 'booked');
      }
      if (this.selectedStaffId()) {
        list = list.filter(a => a.assignedStaff.some(s => s.id === this.selectedStaffId()));
      }
    }

    return list;
  });

  setDateMode(mode: 'today' | 'tomorrow' | 'all'): void {
    this.selectedDateMode.set(mode);
  }

  onCustomDateChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    if (val) {
      this.selectedCustomDate.set(val);
      this.selectedDateMode.set('custom');
    }
  }

  setStatusFilter(status: 'all' | 'booked' | 'completed' | 'cancelled' | 'no_show'): void {
    this.selectedStatus.set(status);
  }

  toggleUnassigned(event: Event): void {
    this.unassignedOnly.set((event.target as HTMLInputElement).checked);
  }

  onStaffFilterChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedStaffId.set(val);
  }

  resetFilters(): void {
    this.selectedDateMode.set('today');
    this.selectedStatus.set('all');
    this.unassignedOnly.set(false);
    this.selectedStaffId.set('');
  }

  // Stylist Assignment (Superadmin Only)
  openAssignModal(apt: AdminAppointment): void {
    if (!this.adminService.isSuperadmin()) return;
    this.activeModalAppointment.set(apt);
  }

  closeAssignModal(): void {
    this.activeModalAppointment.set(null);
  }

  async confirmAssignment(apt: AdminAppointment, staff: StaffMember): Promise<void> {
    const res = await this.adminService.assignStaff(apt.id, staff);
    if (res.success) {
      await this.refreshData();
      this.showToast(`Assigned ${staff.name} to ${apt.customer.name}'s appointment.`);
      this.closeAssignModal();
    } else {
      alert(res.error || 'Failed to assign staff.');
    }
  }

  // Walk-in Booking (Superadmin Only)
  openWalkinModal(): void {
    if (!this.adminService.isSuperadmin()) return;
    this.isWalkinModalOpen.set(true);
  }

  closeWalkinModal(): void {
    this.isWalkinModalOpen.set(false);
  }

  async saveWalkinBooking(): Promise<void> {
    if (!this.adminService.isSuperadmin()) return;
    if (this.walkinForm.invalid) return;

    const val = this.walkinForm.value;
    const newApt = await this.adminService.createManualAppointment(val);
    await this.refreshData();
    this.showToast(`Created booking ${newApt.referenceNumber} for ${val.customerName}.`);
    this.closeWalkinModal();
  }

  // Edit Appointment (Superadmin Only)
  openEditModal(apt: AdminAppointment): void {
    if (!this.adminService.isSuperadmin()) return;
    this.editingAppointment.set(apt);
    this.editForm.patchValue({
      customerName: apt.customer.name,
      customerPhone: apt.customer.phone,
      serviceId: apt.service.id,
      date: apt.date,
      startTime: apt.startTime.substring(0, 5)
    });
  }

  closeEditModal(): void {
    this.editingAppointment.set(null);
  }

  async saveEditedAppointment(apt: AdminAppointment): Promise<void> {
    if (!this.adminService.isSuperadmin()) return;
    if (this.editForm.invalid) return;

    const val = this.editForm.value;
    await this.adminService.updateAppointment(apt.id, val);
    await this.refreshData();
    this.showToast(`Updated appointment ${apt.referenceNumber}.`);
    this.closeEditModal();
  }

  // Delete Appointment (Superadmin Only)
  confirmDelete(apt: AdminAppointment): void {
    if (!this.adminService.isSuperadmin()) return;
    this.deletingAppointment.set(apt);
  }

  cancelDelete(): void {
    this.deletingAppointment.set(null);
  }

  async executeDelete(apt: AdminAppointment): Promise<void> {
    await this.adminService.deleteAppointment(apt.id);
    this.showToast(`Deleted booking ${apt.referenceNumber}.`);
    this.deletingAppointment.set(null);
    await this.refreshData();
  }

  // Status Update (Allowed for both roles)
  async updateStatus(
    apt: AdminAppointment,
    status: 'booked' | 'completed' | 'cancelled' | 'no_show'
  ): Promise<void> {
    const success = await this.adminService.updateAppointmentStatus(apt.id, status);
    if (success) {
      await this.refreshData();
      this.showToast(`Appointment ${apt.referenceNumber} marked as ${status}.`);
    }
  }

  private showToast(msg: string): void {
    this.actionFeedback.set(msg);
    setTimeout(() => {
      this.actionFeedback.set(null);
    }, 3500);
  }

  formatTime12(timeStr: string): string {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    let hour = parseInt(parts[0], 10);
    const minute = parts[1] || '00';
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${hour}:${minute} ${ampm}`;
  }

  private getTodayIso(): string {
    return new Date().toISOString().split('T')[0];
  }

  private getTomorrowIso(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }
}
