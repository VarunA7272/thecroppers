import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { AdminAppointment, StaffMember } from '../../../core/models/admin.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container dashboard-container">
      <!-- Toast Feedback Message -->
      @if (actionFeedback(); as feedback) {
        <div class="croppers-alert alert-success">
          <span>✓ {{ feedback }}</span>
        </div>
      }

      <!-- Welcome Header -->
      <div class="dashboard-header-row">
        <div>
          <span class="section-eyebrow">
            {{ adminService.isSuperadmin() ? 'Operations & Dispatch' : 'Personal Chair & Station' }}
          </span>
          <h1 class="dashboard-title">
            {{ adminService.isSuperadmin() ? 'Salon Overview' : 'Welcome, ' + currentStaffName() }}
          </h1>
          <p class="dashboard-subtitle">
            {{ adminService.isSuperadmin() 
              ? 'Real-time bookings, staff assignments, and salon floor status.' 
              : 'Your personalized floor schedule, assigned clients, and chair completion status.' }}
          </p>
        </div>
        <div class="header-actions">
          <a routerLink="/admin/appointments" class="btn btn-primary">
            {{ adminService.isSuperadmin() ? 'Manage All Appointments' : 'View My Appointments' }}
          </a>
        </div>
      </div>

      <!-- SUPERADMIN METRIC CARDS -->
      @if (adminService.isSuperadmin()) {
        <div class="metrics-grid">
          <div class="croppers-card metric-card">
            <div class="metric-top">
              <span class="metric-label">Today's Bookings</span>
              <div class="metric-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
            </div>
            <div class="metric-value">{{ totalTodayCount() }}</div>
            <span class="metric-hint">Total salon volume today</span>
          </div>

          <div class="croppers-card metric-card alert-metric" [class.needs-action]="unassignedCount() > 0">
            <div class="metric-top">
              <span class="metric-label">Staff Unassigned</span>
              <div class="metric-icon alert-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="8.5" cy="7" r="4"></circle>
                  <line x1="20" y1="8" x2="20" y2="14"></line>
                  <line x1="23" y1="11" x2="17" y2="11"></line>
                </svg>
              </div>
            </div>
            <div class="metric-value text-gold">{{ unassignedCount() }}</div>
            <span class="metric-hint">{{ unassignedCount() > 0 ? 'Requires manager stylist assignment' : 'All assigned' }}</span>
          </div>

          <div class="croppers-card metric-card">
            <div class="metric-top">
              <span class="metric-label">Completed Today</span>
              <div class="metric-icon success-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            </div>
            <div class="metric-value text-success">{{ completedTodayCount() }}</div>
            <span class="metric-hint">Guests served across all chairs</span>
          </div>

          <div class="croppers-card metric-card">
            <div class="metric-top">
              <span class="metric-label">Active Staff</span>
              <div class="metric-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
            </div>
            <div class="metric-value">{{ staffList().length }}</div>
            <span class="metric-hint">Rahul, Amit, Priya</span>
          </div>
        </div>
      } @else {
        <!-- STAFF STATION METRIC CARDS -->
        <div class="metrics-grid">
          <div class="croppers-card metric-card">
            <div class="metric-top">
              <span class="metric-label">My Scheduled Today</span>
              <div class="metric-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
            </div>
            <div class="metric-value">{{ staffTodayTotal() }}</div>
            <span class="metric-hint">Clients assigned to your chair</span>
          </div>

          <div class="croppers-card metric-card">
            <div class="metric-top">
              <span class="metric-label">My Completed Today</span>
              <div class="metric-icon success-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            </div>
            <div class="metric-value text-success">{{ staffCompletedTotal() }}</div>
            <span class="metric-hint">Clients successfully serviced</span>
          </div>

          <div class="croppers-card metric-card">
            <div class="metric-top">
              <span class="metric-label">Next Client Slot</span>
              <div class="metric-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
            </div>
            <div class="metric-value next-slot-value">{{ nextClientTime() }}</div>
            <span class="metric-hint">{{ nextClientHint() }}</span>
          </div>

          <div class="croppers-card metric-card">
            <div class="metric-top">
              <span class="metric-label">My Service Value</span>
              <div class="metric-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
            </div>
            <div class="metric-value text-gold">₹{{ staffServiceRevenue() }}</div>
            <span class="metric-hint">Today's assigned service total</span>
          </div>
        </div>
      }

      <!-- Split Grid Section -->
      <div class="dashboard-split-grid">
        <!-- SUPERADMIN LEFT: Roster -->
        @if (adminService.isSuperadmin()) {
          <div class="croppers-card roster-card">
            <div class="card-head">
              <h3 class="card-heading">Internal Staff Roster</h3>
              <span class="badge badge-gold">Active Roster</span>
            </div>
            <p class="roster-desc">Stylists are managed internally and never displayed on the customer website.</p>

            <div class="staff-list">
              @for (staff of staffList(); track staff.id) {
                <div class="staff-item">
                  <div class="staff-avatar">{{ staff.name.charAt(0) }}</div>
                  <div class="staff-details">
                    <span class="staff-name">{{ staff.name }}</span>
                    <span class="staff-role">{{ staff.role }} ({{ staff.specialization | uppercase }})</span>
                  </div>
                  <span class="status-pill active-pill">Available</span>
                </div>
              }
            </div>
          </div>
        } @else {
          <!-- STAFF LEFT: Station & Profile Card -->
          <div class="croppers-card station-card">
            <div class="card-head">
              <h3 class="card-heading">My Station Profile</h3>
              <span class="status-pill active-pill">Active On Floor</span>
            </div>
            <p class="roster-desc">Your station details and floor assignments for today.</p>

            <div class="station-profile-box">
              <div class="station-avatar-lg">{{ currentStaffName().charAt(0) }}</div>
              <div class="station-meta">
                <strong class="station-staff-name">{{ currentStaffName() }}</strong>
                <span class="station-specialization">{{ currentStaffRole() }}</span>
                <span class="station-phone">{{ currentStaffPhone() }}</span>
              </div>
            </div>

            <div class="station-guidance-box">
              <div class="guidance-title">Floor Workflow:</div>
              <ul class="guidance-list">
                <li>Greet client when arrival time matches scheduled slot.</li>
                <li>Verify requested services at your chair before beginning.</li>
                <li>Click <strong>"✓ Mark Completed"</strong> on your queue when finished to record completion.</li>
              </ul>
            </div>
          </div>
        }

        <!-- RIGHT: Queue Card -->
        <div class="croppers-card queue-card">
          <div class="card-head">
            <h3 class="card-heading">
              {{ adminService.isSuperadmin() ? "Today's Appointments Queue" : "My Assigned Clients Today" }}
            </h3>
            <a routerLink="/admin/appointments" class="view-link">View All →</a>
          </div>

          <div class="queue-list">
            @if (todayAppointments().length === 0) {
              <p class="empty-hint">
                {{ adminService.isSuperadmin() 
                  ? 'No appointments recorded for today yet.' 
                  : 'No appointments assigned to your station today.' }}
              </p>
            } @else {
              @for (apt of todayAppointments(); track apt.id) {
                <div class="queue-item" [class.unassigned-border]="apt.assignedStaff.length === 0">
                  <div class="queue-time">
                    <span class="time-main">{{ formatTime12(apt.startTime) }}</span>
                    <span class="time-dur">{{ apt.service.durationMinutes }}m</span>
                  </div>

                  <div class="queue-info">
                    <div class="queue-client-row">
                      <strong>{{ apt.customer.name }}</strong>
                      <span class="service-pill">{{ apt.service.name }}</span>
                    </div>
                    <span class="queue-phone">+91 {{ apt.customer.phone }}</span>
                  </div>

                  <!-- Column for Superadmin (Stylist tag / unassigned) vs Staff (Status pill / Complete button) -->
                  <div class="queue-action-col">
                    @if (adminService.isSuperadmin()) {
                      @if (apt.assignedStaff.length > 0) {
                        <span class="assigned-tag">Stylist: {{ apt.assignedStaff[0].name }}</span>
                      } @else {
                        <span class="unassigned-badge">Needs Stylist</span>
                      }
                    } @else {
                      @if (apt.status === 'booked') {
                        <button 
                          type="button" 
                          class="btn btn-sm btn-primary complete-action-btn"
                          (click)="onCompleteAppointment(apt.id, apt.customer.name)">
                          ✓ Mark Completed
                        </button>
                      } @else {
                        <span class="status-pill active-pill">Completed ✓</span>
                      }
                    }
                  </div>
                </div>
              }
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  readonly adminService = inject(AdminService);

  readonly staffList = signal<StaffMember[]>([]);
  readonly todayAppointments = signal<AdminAppointment[]>([]);
  readonly actionFeedback = signal<string | null>(null);

  // Superadmin Metrics
  readonly totalTodayCount = computed(() => this.todayAppointments().length);
  readonly unassignedCount = computed(() => 
    this.todayAppointments().filter(a => a.assignedStaff.length === 0 && a.status === 'booked').length
  );
  readonly completedTodayCount = computed(() => 
    this.todayAppointments().filter(a => a.status === 'completed').length
  );

  // Staff Personal Station Metrics
  readonly currentStaffMember = computed(() => {
    const staffId = this.adminService.currentStaffId();
    return this.staffList().find(s => s.id === staffId);
  });

  readonly currentStaffName = computed(() => {
    return this.currentStaffMember()?.name || this.adminService.currentUser()?.name || 'Stylist';
  });

  readonly currentStaffRole = computed(() => {
    const s = this.currentStaffMember();
    return s ? `${s.role} (${s.specialization.toUpperCase()} SPECIALIST)` : 'Hair Stylist';
  });

  readonly currentStaffPhone = computed(() => {
    return this.currentStaffMember()?.phone || '+91 98765 43211';
  });

  readonly staffTodayTotal = computed(() => this.todayAppointments().length);

  readonly staffCompletedTotal = computed(() => 
    this.todayAppointments().filter(a => a.status === 'completed').length
  );

  readonly staffServiceRevenue = computed(() => {
    return this.todayAppointments().reduce((sum, apt) => sum + (apt.service.price || 0), 0);
  });

  readonly nextClientAppointment = computed(() => {
    const booked = this.todayAppointments().filter(a => a.status === 'booked');
    if (booked.length === 0) return null;
    return booked.sort((a, b) => a.startTime.localeCompare(b.startTime))[0];
  });

  readonly nextClientTime = computed(() => {
    const next = this.nextClientAppointment();
    return next ? this.formatTime12(next.startTime) : 'All Done';
  });

  readonly nextClientHint = computed(() => {
    const next = this.nextClientAppointment();
    return next ? `${next.customer.name} (${next.service.name})` : 'No upcoming bookings today';
  });

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  async loadData(): Promise<void> {
    const todayStr = new Date().toISOString().split('T')[0];
    const [staff, appointments] = await Promise.all([
      this.adminService.getStaffMembers(),
      this.adminService.getAppointments({ date: todayStr })
    ]);

    this.staffList.set(staff);
    this.todayAppointments.set(appointments);
  }

  async onCompleteAppointment(appointmentId: string, customerName: string): Promise<void> {
    const success = await this.adminService.updateAppointmentStatus(appointmentId, 'completed');
    if (success) {
      this.actionFeedback.set(`Appointment for ${customerName} marked as Completed.`);
      setTimeout(() => this.actionFeedback.set(null), 3500);
      await this.loadData();
    }
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
}
