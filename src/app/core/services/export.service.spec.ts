import { TestBed } from '@angular/core/testing';
import { ExportService } from './export.service';
import { AdminService } from './admin.service';

describe('ExportService (Salon Payroll & Incentive System)', () => {
  let exportService: ExportService;
  let adminService: AdminService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    exportService = TestBed.inject(ExportService);
    adminService = TestBed.inject(AdminService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Superadmin Payroll Access & Formula Verification', () => {
    beforeEach(async () => {
      await adminService.login('owner@thecroppers.in', 'password123', 'superadmin');
    });

    it('should return all staff payroll records for superadmin', async () => {
      const records = await exportService.getStaffPayroll();
      expect(records.length).toBeGreaterThanOrEqual(6);

      const hasRahul = records.some(r => r.staffId === 'staff-rahul');
      const hasAmit = records.some(r => r.staffId === 'staff-amit');
      const hasPriya = records.some(r => r.staffId === 'staff-priya');

      expect(hasRahul).toBe(true);
      expect(hasAmit).toBe(true);
      expect(hasPriya).toBe(true);
    });

    it('should verify mathematical integrity of net salary calculation', async () => {
      const records = await exportService.getStaffPayroll('September 2026');
      expect(records.length).toBe(3);

      for (const record of records) {
        // Net = Base + Incentive + Bonus - Deductions
        const expectedNet =
          record.baseSalary +
          record.incentiveAmount +
          record.bonusAmount -
          record.attendanceDeductions;

        expect(record.netSalaryPayable).toBe(expectedNet);

        // Incentive amount matches percentage of service revenue
        const expectedIncentive = Math.round(
          record.totalServiceRevenue * (record.incentiveRatePercentage / 100)
        );
        expect(record.incentiveAmount).toBe(expectedIncentive);
      }
    });

    it('should allow superadmin to update payout status to Approved and Paid', async () => {
      const records = await exportService.getStaffPayroll('September 2026');
      const rahulRecord = records.find(r => r.staffId === 'staff-rahul')!;

      // Update to Paid
      const res = await exportService.updatePayrollStatus(rahulRecord.id, 'Paid', 'Bank Transfer (NEFT)');
      expect(res).toBe(true);

      const updatedRecords = await exportService.getStaffPayroll('September 2026');
      const updatedRahul = updatedRecords.find(r => r.id === rahulRecord.id)!;
      expect(updatedRahul.payoutStatus).toBe('Paid');
      expect(updatedRahul.paymentDate).toBeTruthy();
    });

    it('should generate CSV without error for superadmin', () => {
      // Mock document.createElement and body.appendChild
      const fakeLink = {
        setAttribute: vi.fn(),
        style: {},
        click: vi.fn()
      };
      vi.spyOn(document, 'createElement').mockReturnValue(fakeLink as any);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => fakeLink as any);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => fakeLink as any);
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

      expect(() => exportService.exportPayrollCsv()).not.toThrow();
      expect(fakeLink.click).toHaveBeenCalled();
    });
  });

  describe('Staff Role-Based Payroll Isolation', () => {
    it('should strictly return ONLY Rahul payroll records when logged in as Rahul', async () => {
      await adminService.login('rahul@thecroppers.in', 'password123', 'staff', 'staff-rahul');
      const records = await exportService.getStaffPayroll();

      expect(records.length).toBeGreaterThan(0);
      expect(records.every(r => r.staffId === 'staff-rahul')).toBe(true);

      // Verify Rahul cannot see Amit or Priya records
      const hasAmit = records.some(r => r.staffId === 'staff-amit');
      const hasPriya = records.some(r => r.staffId === 'staff-priya');
      expect(hasAmit).toBe(false);
      expect(hasPriya).toBe(false);
    });

    it('should return personal compensation summary for staff station view', async () => {
      await adminService.login('priya@thecroppers.in', 'password123', 'staff', 'staff-priya');
      const summary = await exportService.getStaffPersonalSummary();

      expect(summary).toBeTruthy();
      expect(summary?.staffId).toBe('staff-priya');
      expect(summary?.staffName).toBe('Priya');
      expect(summary?.baseSalary).toBe(24000);
      expect(summary?.incentiveRatePercentage).toBe(18);
      expect(summary?.netSalaryPayable).toBe(30348);
    });

    it('should reject staff attempt to update payroll payout status', async () => {
      await adminService.login('amit@thecroppers.in', 'password123', 'staff', 'staff-amit');
      await expect(
        exportService.updatePayrollStatus('pay-2026-09-amit', 'Paid')
      ).rejects.toThrow(/Unauthorized/);
    });

    it('should reject staff attempt to export salon payroll CSV', async () => {
      await adminService.login('amit@thecroppers.in', 'password123', 'staff', 'staff-amit');
      expect(() => exportService.exportPayrollCsv()).toThrow(/Unauthorized/);
    });
  });
});
