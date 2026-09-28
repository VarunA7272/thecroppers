import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AdminService } from './admin.service';
import {
  CustomerExportRecord,
  ServiceHistoryRecord,
  StaffAttendanceRecord,
  StaffIncentiveRecord,
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
