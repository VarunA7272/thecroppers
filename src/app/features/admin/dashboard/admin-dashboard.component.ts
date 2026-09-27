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
      <!-- Welcome Header -->
      <div class="dashboard-header-row">
        <div>
          <span class="section-eyebrow">Operations & Dispatch</span>
          <h1 class="dashboard-title">Salon Overview</h1>
          <p class="dashboard-subtitle">Real-time bookings, staff assignments, and salon floor status.</p>
        </div>
        <div class="header-actions">
          <a routerLink="/admin/appointments" class="btn btn-primary">
            Manage All Appointments
          </a>
        </div>
      </div>

      <!-- Metric KPI Cards -->
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
          <span class="metric-hint">30-min grid capacity</span>
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
          <span class="metric-hint">Guests served</span>
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

      <!-- Two-column Section: Roster & Priority Appointments -->
      <div class="dashboard-split-grid">
        <!-- Left: Staff Roster -->
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

        <!-- Right: Recent/Pending Action Appointments -->
        <div class="croppers-card queue-card">
          <div class="card-head">
            <h3 class="card-heading">Today's Appointments Queue</h3>
            <a routerLink="/admin/appointments" class="view-link">View All →</a>
          </div>

          <div class="queue-list">
            @if (todayAppointments().length === 0) {
              <p class="empty-hint">No appointments recorded for today yet.</p>
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

                  <div class="queue-staff-col">
                    @if (apt.assignedStaff.length > 0) {
                      <span class="assigned-tag">Stylist: {{ apt.assignedStaff[0].name }}</span>
                    } @else {
                      <span class="unassigned-badge">Needs Stylist</span>
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
  private readonly adminService = inject(AdminService);

  readonly staffList = signal<StaffMember[]>([]);
  readonly todayAppointments = signal<AdminAppointment[]>([]);

  readonly totalTodayCount = computed(() => this.todayAppointments().length);
  readonly unassignedCount = computed(() => 
    this.todayAppointments().filter(a => a.assignedStaff.length === 0 && a.status === 'booked').length
  );
  readonly completedTodayCount = computed(() => 
    this.todayAppointments().filter(a => a.status === 'completed').length
  );

  async ngOnInit(): Promise<void> {
    const todayStr = new Date().toISOString().split('T')[0];
    const [staff, appointments] = await Promise.all([
      this.adminService.getStaffMembers(),
      this.adminService.getAppointments({ date: todayStr })
    ]);

    this.staffList.set(staff);
    this.todayAppointments.set(appointments);
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
