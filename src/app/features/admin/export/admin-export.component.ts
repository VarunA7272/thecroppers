import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExportService } from '../../../core/services/export.service';
import {
  CustomerExportRecord,
  ServiceHistoryRecord,
  StaffAttendanceRecord,
  StaffIncentiveRecord,
  StaffPayrollRecord,
  ExportDateRange
} from '../../../core/models/export.model';

@Component({
  selector: 'app-admin-export',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container export-page-container">
      <!-- Page Header -->
      <div class="page-header-row">
        <div>
          <span class="section-eyebrow">Data Intelligence & Reports</span>
          <h1 class="page-title">Reports & Data Export</h1>
          <p class="page-subtitle">Export salon customers, service history, staff attendance, incentives, and monthly payroll. (Superadmin Only)</p>
        </div>
      </div>

      <!-- Quick Metrics Strip -->
      <div class="metrics-strip">
        <div class="croppers-card mini-metric">
          <span class="mini-label">Total Clients</span>
          <span class="mini-val">{{ customers().length }}</span>
          <span class="mini-sub">Registered Guests</span>
        </div>
        <div class="croppers-card mini-metric">
          <span class="mini-label">Logged Bookings</span>
          <span class="mini-val">{{ serviceHistory().length }}</span>
          <span class="mini-sub">All-time appointments</span>
        </div>
        <div class="croppers-card mini-metric">
          <span class="mini-label">Attendance Logs</span>
          <span class="mini-val">{{ attendanceList().length }}</span>
          <span class="mini-sub">Clock in/out entries</span>
        </div>
        <div class="croppers-card mini-metric">
          <span class="mini-label">Total Incentives</span>
          <span class="mini-val text-gold">₹{{ totalIncentivesAmount() | number }}</span>
          <span class="mini-sub">Accrued commissions</span>
        </div>
        <div class="croppers-card mini-metric highlight-metric">
          <span class="mini-label">Net Payroll (Sep)</span>
          <span class="mini-val text-success">₹{{ totalPayrollNet() | number }}</span>
          <span class="mini-sub">Base + Comm - Ded</span>
        </div>
      </div>

      <!-- 5 Primary Export Cards Grid -->
      <div class="exports-grid">
        <!-- 1. Customers Export -->
        <div class="croppers-card export-card">
          <div class="export-icon-row">
            <div class="export-icon">👥</div>
            <span class="badge badge-gold">Client Database</span>
          </div>
          <h3 class="export-title">Customers Directory</h3>
          <p class="export-desc">
            Full directory of salon guests with phone numbers, lifetime visit counts, total revenue spend (₹), and visit timestamps.
          </p>
          <div class="card-meta">
            <span>{{ customers().length }} customer records ready</span>
          </div>
          <button type="button" class="btn btn-primary btn-block" (click)="downloadCustomersCsv()">
            Download Customers CSV
          </button>
        </div>

        <!-- 2. Services History Export -->
        <div class="croppers-card export-card">
          <div class="export-icon-row">
            <div class="export-icon">📜</div>
            <span class="badge badge-gold">Audit Trail</span>
          </div>
          <h3 class="export-title">Services & Booking History</h3>
          <p class="export-desc">
            Complete appointment log with reference codes, treatment categories, pricing, customer details, assigned stylists, and statuses.
          </p>
          <div class="card-meta">
            <span>{{ serviceHistory().length }} booking records ready</span>
          </div>
          <button type="button" class="btn btn-primary btn-block" (click)="downloadServicesHistoryCsv()">
            Download Services History CSV
          </button>
        </div>

        <!-- 3. Staff Attendance Export -->
        <div class="croppers-card export-card">
          <div class="export-icon-row">
            <div class="export-icon">⏱</div>
            <span class="badge badge-gold">Timesheet Logs</span>
          </div>
          <h3 class="export-title">Staff Attendance Logs</h3>
          <p class="export-desc">
            Daily clock-in and clock-out logs for Rahul, Amit, Priya, and staff team with total shift hours worked and attendance status.
          </p>
          <div class="card-meta">
            <span>{{ attendanceList().length }} attendance logs ready</span>
          </div>
          <button type="button" class="btn btn-primary btn-block" (click)="downloadAttendanceCsv()">
            Download Attendance CSV
          </button>
        </div>

        <!-- 4. Staff Incentives Export -->
        <div class="croppers-card export-card">
          <div class="export-icon-row">
            <div class="export-icon">💰</div>
            <span class="badge badge-gold">Commissions</span>
          </div>
          <h3 class="export-title">Staff Incentives</h3>
          <p class="export-desc">
            Monthly service volume breakdown, commission rates, and calculated incentive amounts (₹) by individual stylist.
          </p>
          <div class="card-meta">
            <span>{{ incentivesList().length }} incentive period logs ready</span>
          </div>
          <button type="button" class="btn btn-primary btn-block" (click)="downloadIncentivesCsv()">
            Download Incentives CSV
          </button>
        </div>

        <!-- 5. Salary & Payroll Sheet Export -->
        <div class="croppers-card export-card highlight-card">
          <div class="export-icon-row">
            <div class="export-icon">💼</div>
            <span class="badge badge-gold">Full Compensation</span>
          </div>
          <h3 class="export-title">Salary & Payroll Sheet</h3>
          <p class="export-desc">
            End-to-end payroll sheets combining monthly base salary, earned performance incentives, attendance deductions, and net payout.
          </p>
          <div class="card-meta">
            <span>{{ payrollList().length }} payroll period records ready</span>
          </div>
          <button type="button" class="btn btn-primary btn-block" (click)="downloadPayrollCsv()">
            Download Payroll Sheet CSV
          </button>
        </div>
      </div>

      <!-- Live Data Preview Section -->
      <div class="croppers-card preview-section-card">
        <div class="preview-header">
          <div>
            <h2 class="preview-title">Live Data Preview</h2>
            <p class="preview-subtitle">Inspect the latest salon records before triggering download.</p>
          </div>

          <!-- Preview Selection Tabs -->
          <div class="preview-tabs">
            <button 
              type="button" 
              class="preview-tab-btn" 
              [class.active]="selectedTab() === 'customers'" 
              (click)="selectTab('customers')">
              Customers ({{ customers().length }})
            </button>
            <button 
              type="button" 
              class="preview-tab-btn" 
              [class.active]="selectedTab() === 'history'" 
              (click)="selectTab('history')">
              Services History ({{ serviceHistory().length }})
            </button>
            <button 
              type="button" 
              class="preview-tab-btn" 
              [class.active]="selectedTab() === 'attendance'" 
              (click)="selectTab('attendance')">
              Attendance ({{ attendanceList().length }})
            </button>
            <button 
              type="button" 
              class="preview-tab-btn" 
              [class.active]="selectedTab() === 'incentives'" 
              (click)="selectTab('incentives')">
              Incentives ({{ incentivesList().length }})
            </button>
            <button 
              type="button" 
              class="preview-tab-btn" 
              [class.active]="selectedTab() === 'payroll'" 
              (click)="selectTab('payroll')">
              Salary & Payroll ({{ payrollList().length }})
            </button>
          </div>
        </div>

        <!-- Tab 1: Customers Table Preview -->
        @if (selectedTab() === 'customers') {
          <div class="table-responsive">
            <table class="croppers-table">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Mobile Phone</th>
                  <th>Total Visits</th>
                  <th>Lifetime Spend</th>
                  <th>First Visit</th>
                  <th>Last Visit</th>
                </tr>
              </thead>
              <tbody>
                @for (c of customers(); track c.id) {
                  <tr>
                    <td><strong>{{ c.name }}</strong></td>
                    <td class="phone-cell">{{ c.phone }}</td>
                    <td>{{ c.totalVisits }} visits</td>
                    <td class="spend-cell">₹{{ c.totalSpend }}</td>
                    <td class="date-cell">{{ c.firstVisit }}</td>
                    <td class="date-cell">{{ c.lastVisit }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        <!-- Tab 2: Service History Table Preview -->
        @if (selectedTab() === 'history') {
          <div class="table-responsive">
            <table class="croppers-table">
              <thead>
                <tr>
                  <th>Ref #</th>
                  <th>Date & Time</th>
                  <th>Treatment</th>
                  <th>Price</th>
                  <th>Guest</th>
                  <th>Stylist</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                @for (h of serviceHistory(); track h.referenceNumber) {
                  <tr>
                    <td class="ref-cell">{{ h.referenceNumber }}</td>
                    <td>
                      <div>{{ h.date }}</div>
                      <small class="time-sub">{{ h.timeWindow }}</small>
                    </td>
                    <td>
                      <div>{{ h.serviceName }}</div>
                      <small class="cat-sub">{{ h.category }} ({{ h.durationMinutes }}m)</small>
                    </td>
                    <td class="spend-cell">₹{{ h.price }}</td>
                    <td>
                      <div>{{ h.customerName }}</div>
                      <small class="phone-sub">{{ h.customerPhone }}</small>
                    </td>
                    <td>
                      <span class="stylist-badge">{{ h.assignedStaff }}</span>
                    </td>
                    <td>
                      <span class="status-pill" [class]="'pill-' + h.status">{{ h.status | uppercase }}</span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        <!-- Tab 3: Attendance Table Preview -->
        @if (selectedTab() === 'attendance') {
          <div class="table-responsive">
            <table class="croppers-table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Role</th>
                  <th>Date</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Hours</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                @for (att of attendanceList(); track att.id) {
                  <tr>
                    <td><strong>{{ att.staffName }}</strong></td>
                    <td class="role-cell">{{ att.role }}</td>
                    <td class="date-cell">{{ att.date }}</td>
                    <td>{{ att.checkIn }}</td>
                    <td>{{ att.checkOut }}</td>
                    <td>{{ att.hoursWorked }} hrs</td>
                    <td>
                      <span class="status-pill" [class.pill-completed]="att.status === 'Present'" [class.pill-cancelled]="att.status === 'Leave'">
                        {{ att.status }}
                      </span>
                    </td>
                    <td class="notes-cell">{{ att.notes || '—' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        <!-- Tab 4: Incentives Table Preview -->
        @if (selectedTab() === 'incentives') {
          <div class="table-responsive">
            <table class="croppers-table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Role</th>
                  <th>Period</th>
                  <th>Services Count</th>
                  <th>Revenue Generated</th>
                  <th>Rate</th>
                  <th>Incentive Earned</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                @for (inc of incentivesList(); track inc.staffId + inc.period) {
                  <tr>
                    <td><strong>{{ inc.staffName }}</strong></td>
                    <td class="role-cell">{{ inc.role }}</td>
                    <td>{{ inc.period }}</td>
                    <td>{{ inc.servicesCompleted }} services</td>
                    <td class="spend-cell">₹{{ inc.totalServiceRevenue }}</td>
                    <td>{{ inc.incentiveRatePercentage }}%</td>
                    <td class="incentive-highlight">₹{{ inc.incentiveAmount }}</td>
                    <td>
                      <span class="status-pill" [class.pill-completed]="inc.status === 'Paid' || inc.status === 'Approved'">
                        {{ inc.status }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        <!-- Tab 5: Salary & Payroll Table Preview -->
        @if (selectedTab() === 'payroll') {
          <div class="table-responsive">
            <table class="croppers-table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Role</th>
                  <th>Month</th>
                  <th>Base Salary</th>
                  <th>Services & Revenue</th>
                  <th>Rate</th>
                  <th>Incentives Earned</th>
                  <th>Attendance / Ded.</th>
                  <th>Bonus</th>
                  <th>Net Payable</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                @for (p of payrollList(); track p.id) {
                  <tr>
                    <td><strong>{{ p.staffName }}</strong></td>
                    <td class="role-cell">{{ p.role }}</td>
                    <td>{{ p.period }}</td>
                    <td class="spend-cell">₹{{ p.baseSalary | number }}</td>
                    <td>
                      <div>{{ p.servicesCompleted }} services</div>
                      <small class="time-sub">₹{{ p.totalServiceRevenue | number }} rev</small>
                    </td>
                    <td>{{ p.incentiveRatePercentage }}%</td>
                    <td class="incentive-highlight">+₹{{ p.incentiveAmount | number }}</td>
                    <td>
                      <div>{{ p.attendanceDays }}d present</div>
                      @if (p.attendanceDeductions > 0) {
                        <small class="deduction-sub">-₹{{ p.attendanceDeductions | number }}</small>
                      } @else {
                        <small class="no-ded-sub">₹0 ded.</small>
                      }
                    </td>
                    <td class="bonus-cell">+₹{{ p.bonusAmount | number }}</td>
                    <td class="net-payable-cell">
                      <strong>₹{{ p.netSalaryPayable | number }}</strong>
                    </td>
                    <td>
                      <span class="status-pill" 
                            [class.pill-completed]="p.payoutStatus === 'Paid'"
                            [class.pill-approved]="p.payoutStatus === 'Approved'"
                            [class.pill-booked]="p.payoutStatus === 'Pending'">
                        {{ p.payoutStatus | uppercase }}
                      </span>
                    </td>
                    <td>
                      @if (p.payoutStatus === 'Pending') {
                        <button type="button" class="btn btn-outline btn-xs" (click)="updateStatus(p.id, 'Approved')">
                          Approve
                        </button>
                      } @else if (p.payoutStatus === 'Approved') {
                        <button type="button" class="btn btn-primary btn-xs" (click)="updateStatus(p.id, 'Paid')">
                          Mark Paid
                        </button>
                      } @else {
                        <span class="paid-check">✓ Paid</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: './admin-export.component.css'
})
export class AdminExportComponent implements OnInit {
  private readonly exportService = inject(ExportService);

  readonly customers = signal<CustomerExportRecord[]>([]);
  readonly serviceHistory = signal<ServiceHistoryRecord[]>([]);
  readonly attendanceList = signal<StaffAttendanceRecord[]>([]);
  readonly incentivesList = signal<StaffIncentiveRecord[]>([]);
  readonly payrollList = signal<StaffPayrollRecord[]>([]);

  readonly selectedTab = signal<'customers' | 'history' | 'attendance' | 'incentives' | 'payroll'>('payroll');

  readonly totalIncentivesAmount = computed(() =>
    this.incentivesList().reduce((acc, curr) => acc + curr.incentiveAmount, 0)
  );

  readonly totalPayrollNet = computed(() => {
    const current = this.payrollList().filter(p => p.period === 'September 2026');
    return current.reduce((acc, curr) => acc + curr.netSalaryPayable, 0);
  });

  async ngOnInit(): Promise<void> {
    await this.loadAllData();
  }

  async loadAllData(): Promise<void> {
    const [c, h, a, inc, pay] = await Promise.all([
      this.exportService.getCustomersData(),
      this.exportService.getServicesHistory(),
      this.exportService.getStaffAttendance(),
      this.exportService.getStaffIncentives(),
      this.exportService.getStaffPayroll()
    ]);

    this.customers.set(c);
    this.serviceHistory.set(h);
    this.attendanceList.set(a);
    this.incentivesList.set(inc);
    this.payrollList.set(pay);
  }

  selectTab(tab: 'customers' | 'history' | 'attendance' | 'incentives' | 'payroll'): void {
    this.selectedTab.set(tab);
  }

  async updateStatus(recordId: string, status: 'Pending' | 'Approved' | 'Paid'): Promise<void> {
    await this.exportService.updatePayrollStatus(recordId, status);
    const updated = await this.exportService.getStaffPayroll();
    this.payrollList.set(updated);
  }

  // --- DOWNLOAD ACTIONS ---

  downloadCustomersCsv(): void {
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `the_croppers_customers_${dateStr}.csv`;
    const headers = [
      'Customer ID',
      'Full Name',
      'Phone Number',
      'Total Visits',
      'Lifetime Spend (INR)',
      'First Visit Date',
      'Last Visit Date'
    ];
    const rows = this.customers().map(c => [
      c.id,
      c.name,
      c.phone,
      c.totalVisits,
      c.totalSpend,
      c.firstVisit,
      c.lastVisit
    ]);

    this.exportService.exportToCsv(filename, headers, rows);
  }

  downloadServicesHistoryCsv(): void {
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `the_croppers_service_history_${dateStr}.csv`;
    const headers = [
      'Reference Number',
      'Date',
      'Time Window',
      'Service Name',
      'Category',
      'Duration (Mins)',
      'Price (INR)',
      'Customer Name',
      'Customer Phone',
      'Assigned Stylist',
      'Status'
    ];
    const rows = this.serviceHistory().map(h => [
      h.referenceNumber,
      h.date,
      h.timeWindow,
      h.serviceName,
      h.category,
      h.durationMinutes,
      h.price,
      h.customerName,
      h.customerPhone,
      h.assignedStaff,
      h.status
    ]);

    this.exportService.exportToCsv(filename, headers, rows);
  }

  downloadAttendanceCsv(): void {
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `the_croppers_staff_attendance_${dateStr}.csv`;
    const headers = [
      'Log ID',
      'Staff ID',
      'Staff Name',
      'Role',
      'Date',
      'Clock In',
      'Clock Out',
      'Hours Worked',
      'Status',
      'Notes'
    ];
    const rows = this.attendanceList().map(a => [
      a.id,
      a.staffId,
      a.staffName,
      a.role,
      a.date,
      a.checkIn,
      a.checkOut,
      a.hoursWorked,
      a.status,
      a.notes || ''
    ]);

    this.exportService.exportToCsv(filename, headers, rows);
  }

  downloadIncentivesCsv(): void {
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `the_croppers_staff_incentives_${dateStr}.csv`;
    const headers = [
      'Staff ID',
      'Staff Name',
      'Role',
      'Payroll Period',
      'Services Completed',
      'Total Service Revenue (INR)',
      'Incentive Rate (%)',
      'Incentive Amount (INR)',
      'Status'
    ];
    const rows = this.incentivesList().map(inc => [
      inc.staffId,
      inc.staffName,
      inc.role,
      inc.period,
      inc.servicesCompleted,
      inc.totalServiceRevenue,
      inc.incentiveRatePercentage,
      inc.incentiveAmount,
      inc.status
    ]);

    this.exportService.exportToCsv(filename, headers, rows);
  }

  downloadPayrollCsv(): void {
    this.exportService.exportPayrollCsv(this.payrollList());
  }
}

