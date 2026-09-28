export interface CustomerExportRecord {
  id: string;
  name: string;
  phone: string;
  totalVisits: number;
  totalSpend: number; // in INR ₹
  firstVisit: string; // YYYY-MM-DD
  lastVisit: string; // YYYY-MM-DD
}

export interface ServiceHistoryRecord {
  referenceNumber: string;
  date: string;
  timeWindow: string;
  serviceName: string;
  category: string;
  durationMinutes: number;
  price: number;
  customerName: string;
  customerPhone: string;
  assignedStaff: string;
  status: 'booked' | 'completed' | 'cancelled' | 'no_show';
}

export interface StaffAttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  role: string;
  date: string;
  checkIn: string; // HH:mm:ss
  checkOut: string; // HH:mm:ss
  hoursWorked: number;
  status: 'Present' | 'Half-day' | 'Leave' | 'Absent';
  notes?: string;
}

export interface StaffIncentiveRecord {
  staffId: string;
  staffName: string;
  role: string;
  period: string; // e.g. "September 2026"
  servicesCompleted: number;
  totalServiceRevenue: number; // in INR ₹
  incentiveRatePercentage: number;
  incentiveAmount: number; // in INR ₹
  status: 'Pending' | 'Approved' | 'Paid';
}

export interface StaffPayrollRecord {
  id: string;
  staffId: string;
  staffName: string;
  role: string;
  period: string; // e.g. "September 2026"
  baseSalary: number; // in INR ₹
  servicesCompleted: number;
  totalServiceRevenue: number; // in INR ₹
  incentiveRatePercentage: number;
  incentiveAmount: number; // in INR ₹ (revenue * rate)
  attendanceDays: number; // e.g. 26
  absentDays: number; // e.g. 0
  attendanceDeductions: number; // in INR ₹
  bonusAmount: number; // in INR ₹
  netSalaryPayable: number; // Base + Incentives + Bonus - Deductions
  payoutStatus: 'Pending' | 'Approved' | 'Paid';
  paymentDate?: string;
  paymentMethod?: string; // e.g. "Bank Transfer (NEFT)", "UPI", "Cheque"
}

export type ExportDateRange = 'all' | 'this_month' | 'last_30_days' | 'custom';
