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

    // Default seeded salon customers
    return [
      {
        id: 'cust-1',
        name: 'Vikram Sharma',
        phone: '+91 9826112233',
        totalVisits: 4,
        totalSpend: 1400,
        firstVisit: '2026-06-12',
        lastVisit: '2026-09-27'
      },
      {
        id: 'cust-2',
        name: 'Rohan Mehra',
        phone: '+91 9826445566',
        totalVisits: 3,
        totalSpend: 2400,
        firstVisit: '2026-07-04',
        lastVisit: '2026-09-27'
      },
      {
        id: 'cust-3',
        name: 'Deepak Verma',
        phone: '+91 9826778899',
        totalVisits: 6,
        totalSpend: 1200,
        firstVisit: '2026-05-18',
        lastVisit: '2026-09-27'
      },
      {
        id: 'cust-4',
        name: 'Ananya Gupta',
        phone: '+91 9826990011',
        totalVisits: 2,
        totalSpend: 1400,
        firstVisit: '2026-08-20',
        lastVisit: '2026-09-27'
      },
      {
        id: 'cust-5',
        name: 'Suresh Nambiar',
        phone: '+91 9826334455',
        totalVisits: 5,
        totalSpend: 1900,
        firstVisit: '2026-04-10',
        lastVisit: '2026-09-25'
      },
      {
        id: 'cust-6',
        name: 'Amitabh Tiwari',
        phone: '+91 9826887766',
        totalVisits: 1,
        totalSpend: 600,
        firstVisit: '2026-09-22',
        lastVisit: '2026-09-22'
      }
    ];
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

    // Default seeded staff attendance records
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().split('T')[0];

    return [
      {
        id: 'att-101',
        staffId: 'staff-rahul',
        staffName: 'Rahul',
        role: 'Hair Stylist',
        date: today,
        checkIn: '09:50 AM',
        checkOut: '08:05 PM',
        hoursWorked: 10.25,
        status: 'Present',
        notes: 'Full shift completed'
      },
      {
        id: 'att-102',
        staffId: 'staff-amit',
        staffName: 'Amit',
        role: 'Barber',
        date: today,
        checkIn: '09:55 AM',
        checkOut: '08:00 PM',
        hoursWorked: 10.0,
        status: 'Present',
        notes: 'Punctual'
      },
      {
        id: 'att-103',
        staffId: 'staff-priya',
        staffName: 'Priya',
        role: 'Skin Specialist',
        date: today,
        checkIn: '10:05 AM',
        checkOut: '08:15 PM',
        hoursWorked: 10.15,
        status: 'Present',
        notes: 'Completed all facial consultations'
      },
      {
        id: 'att-104',
        staffId: 'staff-rahul',
        staffName: 'Rahul',
        role: 'Hair Stylist',
        date: yesterday,
        checkIn: '09:52 AM',
        checkOut: '08:00 PM',
        hoursWorked: 10.1,
        status: 'Present',
        notes: 'Full shift'
      },
      {
        id: 'att-105',
        staffId: 'staff-amit',
        staffName: 'Amit',
        role: 'Barber',
        date: yesterday,
        checkIn: '10:00 AM',
        checkOut: '03:00 PM',
        hoursWorked: 5.0,
        status: 'Half-day',
        notes: 'Approved half day'
      },
      {
        id: 'att-106',
        staffId: 'staff-priya',
        staffName: 'Priya',
        role: 'Skin Specialist',
        date: yesterday,
        checkIn: '09:58 AM',
        checkOut: '08:02 PM',
        hoursWorked: 10.05,
        status: 'Present',
        notes: 'Punctual'
      },
      {
        id: 'att-107',
        staffId: 'staff-rahul',
        staffName: 'Rahul',
        role: 'Hair Stylist',
        date: twoDaysAgo,
        checkIn: '09:48 AM',
        checkOut: '08:10 PM',
        hoursWorked: 10.35,
        status: 'Present',
        notes: 'Full shift'
      },
      {
        id: 'att-108',
        staffId: 'staff-amit',
        staffName: 'Amit',
        role: 'Barber',
        date: twoDaysAgo,
        checkIn: '09:55 AM',
        checkOut: '08:00 PM',
        hoursWorked: 10.0,
        status: 'Present',
        notes: 'Full shift'
      },
      {
        id: 'att-109',
        staffId: 'staff-priya',
        staffName: 'Priya',
        role: 'Skin Specialist',
        date: twoDaysAgo,
        checkIn: '-',
        checkOut: '-',
        hoursWorked: 0.0,
        status: 'Leave',
        notes: 'Scheduled weekly off'
      }
    ];
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
            period: item.period || 'September 2026',
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

    // Default seeded staff incentive records
    return [
      {
        staffId: 'staff-rahul',
        staffName: 'Rahul',
        role: 'Hair Stylist',
        period: 'September 2026',
        servicesCompleted: 68,
        totalServiceRevenue: 34200,
        incentiveRatePercentage: 15,
        incentiveAmount: 5130,
        status: 'Approved'
      },
      {
        staffId: 'staff-amit',
        staffName: 'Amit',
        role: 'Barber',
        period: 'September 2026',
        servicesCompleted: 92,
        totalServiceRevenue: 13800,
        incentiveRatePercentage: 12,
        incentiveAmount: 1656,
        status: 'Approved'
      },
      {
        staffId: 'staff-priya',
        staffName: 'Priya',
        role: 'Skin Specialist',
        period: 'September 2026',
        servicesCompleted: 44,
        totalServiceRevenue: 28600,
        incentiveRatePercentage: 18,
        incentiveAmount: 5148,
        status: 'Approved'
      },
      {
        staffId: 'staff-rahul',
        staffName: 'Rahul',
        role: 'Hair Stylist',
        period: 'August 2026',
        servicesCompleted: 74,
        totalServiceRevenue: 37000,
        incentiveRatePercentage: 15,
        incentiveAmount: 5550,
        status: 'Paid'
      },
      {
        staffId: 'staff-amit',
        staffName: 'Amit',
        role: 'Barber',
        period: 'August 2026',
        servicesCompleted: 104,
        totalServiceRevenue: 15600,
        incentiveRatePercentage: 12,
        incentiveAmount: 1872,
        status: 'Paid'
      },
      {
        staffId: 'staff-priya',
        staffName: 'Priya',
        role: 'Skin Specialist',
        period: 'August 2026',
        servicesCompleted: 51,
        totalServiceRevenue: 33150,
        incentiveRatePercentage: 18,
        incentiveAmount: 5967,
        status: 'Paid'
      }
    ];
  }

  // --- SALARY & PAYROLL MANAGEMENT ---

  private readonly payrollStore = signal<StaffPayrollRecord[]>([
    {
      id: 'pay-2026-09-rahul',
      staffId: 'staff-rahul',
      staffName: 'Rahul',
      role: 'Hair Stylist',
      period: 'September 2026',
      baseSalary: 25000,
      servicesCompleted: 68,
      totalServiceRevenue: 34200,
      incentiveRatePercentage: 15,
      incentiveAmount: 5130, // 34200 * 0.15
      attendanceDays: 26,
      absentDays: 0,
      attendanceDeductions: 0,
      bonusAmount: 1000,
      netSalaryPayable: 31130, // 25000 + 5130 + 1000 - 0
      payoutStatus: 'Approved',
      paymentMethod: 'Bank Transfer (NEFT)'
    },
    {
      id: 'pay-2026-09-amit',
      staffId: 'staff-amit',
      staffName: 'Amit',
      role: 'Barber',
      period: 'September 2026',
      baseSalary: 22000,
      servicesCompleted: 92,
      totalServiceRevenue: 13800,
      incentiveRatePercentage: 12,
      incentiveAmount: 1656, // 13800 * 0.12
      attendanceDays: 25,
      absentDays: 1,
      attendanceDeductions: 846, // 1 day deduction (22000/26)
      bonusAmount: 500,
      netSalaryPayable: 23310, // 22000 + 1656 + 500 - 846
      payoutStatus: 'Approved',
      paymentMethod: 'Bank Transfer (NEFT)'
    },
    {
      id: 'pay-2026-09-priya',
      staffId: 'staff-priya',
      staffName: 'Priya',
      role: 'Skin Specialist',
      period: 'September 2026',
      baseSalary: 24000,
      servicesCompleted: 44,
      totalServiceRevenue: 28600,
      incentiveRatePercentage: 18,
      incentiveAmount: 5148, // 28600 * 0.18
      attendanceDays: 26,
      absentDays: 0,
      attendanceDeductions: 0,
      bonusAmount: 1200,
      netSalaryPayable: 30348, // 24000 + 5148 + 1200 - 0
      payoutStatus: 'Approved',
      paymentMethod: 'UPI'
    },
    {
      id: 'pay-2026-08-rahul',
      staffId: 'staff-rahul',
      staffName: 'Rahul',
      role: 'Hair Stylist',
      period: 'August 2026',
      baseSalary: 25000,
      servicesCompleted: 74,
      totalServiceRevenue: 37000,
      incentiveRatePercentage: 15,
      incentiveAmount: 5550,
      attendanceDays: 26,
      absentDays: 0,
      attendanceDeductions: 0,
      bonusAmount: 1000,
      netSalaryPayable: 31550,
      payoutStatus: 'Paid',
      paymentDate: '2026-09-01',
      paymentMethod: 'Bank Transfer (NEFT)'
    },
    {
      id: 'pay-2026-08-amit',
      staffId: 'staff-amit',
      staffName: 'Amit',
      role: 'Barber',
      period: 'August 2026',
      baseSalary: 22000,
      servicesCompleted: 104,
      totalServiceRevenue: 15600,
      incentiveRatePercentage: 12,
      incentiveAmount: 1872,
      attendanceDays: 26,
      absentDays: 0,
      attendanceDeductions: 0,
      bonusAmount: 500,
      netSalaryPayable: 24372,
      payoutStatus: 'Paid',
      paymentDate: '2026-09-01',
      paymentMethod: 'Bank Transfer (NEFT)'
    },
    {
      id: 'pay-2026-08-priya',
      staffId: 'staff-priya',
      staffName: 'Priya',
      role: 'Skin Specialist',
      period: 'August 2026',
      baseSalary: 24000,
      servicesCompleted: 51,
      totalServiceRevenue: 33150,
      incentiveRatePercentage: 18,
      incentiveAmount: 5967,
      attendanceDays: 26,
      absentDays: 0,
      attendanceDeductions: 0,
      bonusAmount: 1000,
      netSalaryPayable: 30967,
      payoutStatus: 'Paid',
      paymentDate: '2026-09-01',
      paymentMethod: 'UPI'
    }
  ]);

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
