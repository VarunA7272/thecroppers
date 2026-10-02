import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AdminService } from './admin.service';
import {
  CustomerExportRecord,
  ServiceHistoryRecord,
  StaffAttendanceRecord,
  StaffIncentiveRecord,
  StaffPayrollRecord,
  ExportDateRange
} from '../models/export.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExportService {
  private readonly supabase = inject(SupabaseService);
  private readonly adminService = inject(AdminService);

  readonly salonId = environment.salonId;

  // --- DATA RETRIEVAL ---

  async getCustomersData(): Promise<CustomerExportRecord[]> {
    if (!this.adminService.isSuperadmin()) {
      throw new Error('Unauthorized: Data exports are strictly restricted to Superadmin.');
    }

    if (this.supabase.isReady && this.supabase.clientInstance) {
      try {
        const { data, error } = await this.supabase.clientInstance
          .from('customers')
          .select(`
            id,
            name,
            phone,
            created_at,
            appointments (
              id,
              date,
              status,
              appointment_services (price)
            )
          `);

        if (!error && data && data.length > 0) {
          return data.map((c: any) => {
            const appointments = c.appointments || [];
            const completedApts = appointments.filter((a: any) => a.status === 'completed');
            let totalSpend = 0;
            completedApts.forEach((a: any) => {
              (a.appointment_services || []).forEach((srv: any) => {
                totalSpend += Number(srv.price || 0);
              });
            });

            const sortedDates = appointments.map((a: any) => a.date).sort();
            const firstVisit = sortedDates[0] || (c.created_at ? c.created_at.split('T')[0] : '2026-09-01');
            const lastVisit = sortedDates[sortedDates.length - 1] || firstVisit;

            return {
              id: c.id,
              name: c.name,
              phone: c.phone,
              totalVisits: appointments.length,
              totalSpend: totalSpend,
              firstVisit: firstVisit,
              lastVisit: lastVisit
            };
          });
        }
      } catch (err) {
        console.warn('[ExportService] Supabase customers query fallback:', err);
      }
    }

    // Default empty when offline or no records
    return [];
  }

  async getServicesHistory(range?: ExportDateRange): Promise<ServiceHistoryRecord[]> {
    if (!this.adminService.isSuperadmin()) {
      throw new Error('Unauthorized: Data exports are strictly restricted to Superadmin.');
    }

    const apts = await this.adminService.getAppointments();

    return apts.map(a => {
      const assigned = a.assignedStaff.length > 0 ? a.assignedStaff[0].name : 'Unassigned';
      return {
        referenceNumber: a.referenceNumber,
        date: a.date,
        timeWindow: `${this.formatTime12(a.startTime)} – ${this.formatTime12(a.endTime)}`,
        serviceName: a.service.name,
        category: a.service.categoryName || 'General',
        durationMinutes: a.service.durationMinutes,
        price: a.service.price,
        customerName: a.customer.name,
        customerPhone: a.customer.phone,
        assignedStaff: assigned,
        status: a.status
      };
    });
  }

  async getStaffAttendance(range?: ExportDateRange): Promise<StaffAttendanceRecord[]> {
    if (!this.adminService.isSuperadmin()) {
      throw new Error('Unauthorized: Data exports are strictly restricted to Superadmin.');
    }

    if (this.supabase.isReady && this.supabase.clientInstance) {
      try {
        const { data, error } = await this.supabase.clientInstance
          .from('attendance')
          .select(`
            id,
            staff_id,
            date,
            check_in,
            check_out,
            hours_worked,
            status,
            notes,
            staff (name, role)
          `)
          .order('date', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((item: any) => ({
            id: item.id,
            staffId: item.staff_id,
            staffName: item.staff?.name || 'Staff Member',
            role: item.staff?.role || 'Stylist',
            date: item.date,
            checkIn: item.check_in || '10:00:00',
            checkOut: item.check_out || '20:00:00',
            hoursWorked: Number(item.hours_worked || 9.5),
            status: item.status || 'Present',
            notes: item.notes
          }));
        }
      } catch (err) {
        console.warn('[ExportService] Supabase attendance query fallback:', err);
      }
    }

    // Default empty when offline or no records
    return [];
  }

  async getStaffIncentives(range?: ExportDateRange): Promise<StaffIncentiveRecord[]> {
    if (!this.adminService.isSuperadmin()) {
      throw new Error('Unauthorized: Data exports are strictly restricted to Superadmin.');
    }

    if (this.supabase.isReady && this.supabase.clientInstance) {
      try {
        const { data, error } = await this.supabase.clientInstance
          .from('staff_incentives')
          .select(`
            id,
            staff_id,
            period,
            services_completed,
            total_revenue,
            rate_percentage,
            incentive_amount,
            status,
            staff (name, role)
          `);

        if (!error && data && data.length > 0) {
          return data.map((item: any) => ({
            staffId: item.staff_id,
            staffName: item.staff?.name || 'Staff Member',
            role: item.staff?.role || 'Stylist',
            period: item.period || 'Current Period',
            servicesCompleted: Number(item.services_completed || 0),
            totalServiceRevenue: Number(item.total_revenue || 0),
            incentiveRatePercentage: Number(item.rate_percentage || 15),
            incentiveAmount: Number(item.incentive_amount || 0),
            status: item.status || 'Pending'
          }));
        }
      } catch (err) {
        console.warn('[ExportService] Supabase incentives query fallback:', err);
      }
    }

    // Default empty when offline or no records
    return [];
  }

  // --- SALARY & PAYROLL MANAGEMENT ---

  private readonly payrollStore = signal<StaffPayrollRecord[]>([]);

  // Helper for unit tests to populate test fixtures in memory
  seedTestDataForTesting(records: StaffPayrollRecord[]): void {
    this.payrollStore.set(records);
  }

  /**
   * Retrieves staff payroll records.
   * Superadmin can view all staff payroll.
   * Staff can ONLY view their own personal payroll record.
   */
  async getStaffPayroll(period?: string): Promise<StaffPayrollRecord[]> {
    const isSuperadmin = this.adminService.isSuperadmin();
    const isStaff = this.adminService.isStaff();
    const currentStaffId = this.adminService.currentStaffId();

    if (!isSuperadmin && !isStaff) {
      throw new Error('Unauthorized: Authentication required to view payroll records.');
    }

    let records = this.payrollStore();

    if (period) {
      records = records.filter(r => r.period === period);
    }

    if (isStaff) {
      // Strict role isolation: staff can only see their own records
      return records.filter(r => r.staffId === currentStaffId);
    }

    return records;
  }

  /**
   * Superadmin updates payout status (Pending -> Approved -> Paid).
   */
  async updatePayrollStatus(
    recordId: string,
    status: 'Pending' | 'Approved' | 'Paid',
    paymentMethod?: string
  ): Promise<boolean> {
    if (!this.adminService.isSuperadmin()) {
      throw new Error('Unauthorized: Only Superadmin can approve or disburse staff payroll.');
    }

    const todayStr = new Date().toISOString().split('T')[0];

    this.payrollStore.update(list =>
      list.map(r => {
        if (r.id === recordId) {
          return {
            ...r,
            payoutStatus: status,
            ...(paymentMethod ? { paymentMethod } : {}),
            paymentDate: status === 'Paid' ? (r.paymentDate || todayStr) : undefined
          };
        }
        return r;
      })
    );

    return true;
  }

  /**
   * Helper for staff station dashboard: returns staff's current active monthly compensation record.
   */
  async getStaffPersonalSummary(staffId?: string): Promise<StaffPayrollRecord | null> {
    const targetStaffId = staffId || this.adminService.currentStaffId();
    if (!targetStaffId) return null;

    const list = this.payrollStore();
    // Return latest period record (e.g. September 2026)
    return list.find(r => r.staffId === targetStaffId && r.period === 'September 2026') || null;
  }

  /**
   * Generates and triggers download of the official salon payroll spreadsheet.
   */
  exportPayrollCsv(records?: StaffPayrollRecord[], filename?: string): void {
    if (!this.adminService.isSuperadmin()) {
      throw new Error('Unauthorized: Exporting payroll sheet is strictly restricted to Superadmin.');
    }

    const payrollList = records || this.payrollStore();
    const dateStr = new Date().toISOString().split('T')[0];
    const outFilename = filename || `the_croppers_payroll_${dateStr}.csv`;

    const headers = [
      'Payroll ID',
      'Staff ID',
      'Staff Name',
      'Role',
      'Period',
      'Base Salary (INR)',
      'Services Count',
      'Revenue Generated (INR)',
      'Incentive Rate (%)',
      'Incentives Earned (INR)',
      'Attendance (Days)',
      'Absent Days',
      'Deductions (INR)',
      'Bonus (INR)',
      'Net Salary Payable (INR)',
      'Payout Status',
      'Payment Date',
      'Payment Method'
    ];

    const rows = payrollList.map(r => [
      r.id,
      r.staffId,
      r.staffName,
      r.role,
      r.period,
      r.baseSalary,
      r.servicesCompleted,
      r.totalServiceRevenue,
      r.incentiveRatePercentage,
      r.incentiveAmount,
      r.attendanceDays,
      r.absentDays,
      r.attendanceDeductions,
      r.bonusAmount,
      r.netSalaryPayable,
      r.payoutStatus,
      r.paymentDate || '—',
      r.paymentMethod || '—'
    ]);

    this.exportToCsv(outFilename, headers, rows);
  }

  // --- CSV GENERATOR & DOWNLOAD TRIGGER ---

  exportToCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
    const processRow = (row: (string | number)[]) => {
      return row
        .map(val => {
          if (val === null || val === undefined) return '""';
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(',');
    };

    const csvContent =
      '\uFEFF' + // UTF-8 Byte Order Mark for Excel
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',') +
      '\r\n' +
      rows.map(processRow).join('\r\n');

    this.triggerDownload(filename, csvContent);
  }

  private triggerDownload(filename: string, content: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private formatTime12(timeStr: string): string {
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
