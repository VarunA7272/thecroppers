import { TestBed } from '@angular/core/testing';
import { AdminService } from './admin.service';

describe('AdminService (Staff vs Superadmin Strict Data Isolation)', () => {
  let service: AdminService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Superadmin Privileges & Overall Data Access', () => {
    beforeEach(async () => {
      await service.login('owner@thecroppers.in', 'password123', 'superadmin');
    });

    it('should authenticate as superadmin with full permissions', () => {
      expect(service.isAuthenticated()).toBe(true);
      expect(service.isSuperadmin()).toBe(true);
      expect(service.isStaff()).toBe(false);
    });

    it('should return all salon appointments (assigned and unassigned) for superadmin', async () => {
      const allAppointments = await service.getAppointments();
      expect(allAppointments.length).toBeGreaterThanOrEqual(6);

      const hasRahul = allAppointments.some(a => a.assignedStaff.some(s => s.id === 'staff-rahul'));
      const hasAmit = allAppointments.some(a => a.assignedStaff.some(s => s.id === 'staff-amit'));
      const hasPriya = allAppointments.some(a => a.assignedStaff.some(s => s.id === 'staff-priya'));
      const hasUnassigned = allAppointments.some(a => a.assignedStaff.length === 0);

      expect(hasRahul).toBe(true);
      expect(hasAmit).toBe(true);
      expect(hasPriya).toBe(true);
      expect(hasUnassigned).toBe(true);
    });

    it('should allow superadmin to filter specifically by unassigned bookings', async () => {
      const unassigned = await service.getAppointments({ unassignedOnly: true });
      expect(unassigned.length).toBeGreaterThan(0);
      expect(unassigned.every(a => a.assignedStaff.length === 0)).toBe(true);
    });

    it('should allow superadmin to assign an unassigned appointment to a staff member', async () => {
      const unassigned = await service.getAppointments({ unassignedOnly: true });
      const targetApt = unassigned[0];
      const staffList = await service.getStaffMembers();
      const rahul = staffList.find(s => s.id === 'staff-rahul')!;

      const res = await service.assignStaff(targetApt.id, rahul);
      expect(res.success).toBe(true);

      const updatedList = await service.getAppointments();
      const updatedApt = updatedList.find(a => a.id === targetApt.id);
      expect(updatedApt?.assignedStaff.some(s => s.id === 'staff-rahul')).toBe(true);
    });

    it('should allow superadmin to create a manual walk-in appointment', async () => {
      const today = new Date().toISOString().split('T')[0];
      const newApt = await service.createManualAppointment({
        customerName: 'Test Walkin',
        customerPhone: '9826001122',
        serviceId: 'srv-haircut',
        date: today,
        startTime: '16:00',
        staffId: 'staff-rahul'
      });

      expect(newApt.id).toBeDefined();
      expect(newApt.customer.name).toBe('Test Walkin');
      expect(newApt.assignedStaff[0]?.id).toBe('staff-rahul');
    });
  });

  describe('Staff Data Isolation (Rahul)', () => {
    beforeEach(async () => {
      await service.login('rahul@thecroppers.in', 'password123', 'staff', 'staff-rahul');
    });

    it('should authenticate as staff with Rahul staffId', () => {
      expect(service.isAuthenticated()).toBe(true);
      expect(service.isSuperadmin()).toBe(false);
      expect(service.isStaff()).toBe(true);
      expect(service.currentStaffId()).toBe('staff-rahul');
    });

    it('should strictly return ONLY appointments assigned to Rahul', async () => {
      const appointments = await service.getAppointments();
      expect(appointments.length).toBeGreaterThan(0);

      // Every single appointment must be assigned to Rahul
      expect(appointments.every(a => a.assignedStaff.some(s => s.id === 'staff-rahul'))).toBe(true);

      // Must NEVER contain appointments that do not include Rahul (e.g. Priya-only or unassigned)
      expect(appointments.some(a => a.assignedStaff.every(s => s.id !== 'staff-rahul'))).toBe(false);
      expect(appointments.some(a => a.assignedStaff.some(s => s.id === 'staff-priya'))).toBe(false);
      expect(appointments.some(a => a.assignedStaff.length === 0)).toBe(false);
    });

    it('should return empty list when staff queries unassignedOnly', async () => {
      const unassigned = await service.getAppointments({ unassignedOnly: true });
      expect(unassigned.length).toBe(0);
    });

    it('should allow staff to update status of their OWN assigned appointment', async () => {
      const rahulAppointments = await service.getAppointments();
      const bookedApt = rahulAppointments.find(a => a.status === 'booked');
      expect(bookedApt).toBeDefined();

      const success = await service.updateAppointmentStatus(bookedApt!.id, 'completed');
      expect(success).toBe(true);

      const refreshed = await service.getAppointments();
      const updated = refreshed.find(a => a.id === bookedApt!.id);
      expect(updated?.status).toBe('completed');
    });

    it('should REJECT status update when staff tries to modify an appointment not assigned to them', async () => {
      // apt-106 is assigned to Amit, or apt-101 is unassigned
      const success = await service.updateAppointmentStatus('apt-106', 'completed');
      expect(success).toBe(false);

      const unassignedSuccess = await service.updateAppointmentStatus('apt-101', 'completed');
      expect(unassignedSuccess).toBe(false);
    });

    it('should reject staff attempts to assign staff or create walk-in bookings', async () => {
      const staffList = await service.getStaffMembers();
      const amit = staffList.find(s => s.id === 'staff-amit')!;

      const assignRes = await service.assignStaff('apt-101', amit);
      expect(assignRes.success).toBe(false);
      expect(assignRes.error).toContain('Unauthorized');

      await expect(
        service.createManualAppointment({
          customerName: 'Illegal Walkin',
          customerPhone: '9826111111',
          serviceId: 'srv-haircut',
          date: '2026-09-30',
          startTime: '10:00'
        })
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('Staff Data Isolation (Amit vs Priya)', () => {
    it('should isolate Amit to only Amit appointments', async () => {
      await service.login('amit@thecroppers.in', 'password123', 'staff', 'staff-amit');
      const amitAppointments = await service.getAppointments();

      expect(amitAppointments.length).toBeGreaterThan(0);
      expect(amitAppointments.every(a => a.assignedStaff.some(s => s.id === 'staff-amit'))).toBe(true);
      expect(amitAppointments.some(a => a.assignedStaff.every(s => s.id !== 'staff-amit'))).toBe(false);
      expect(amitAppointments.some(a => a.assignedStaff.some(s => s.id === 'staff-priya'))).toBe(false);
    });

    it('should isolate Priya to only Priya appointments', async () => {
      await service.login('priya@thecroppers.in', 'password123', 'staff', 'staff-priya');
      const priyaAppointments = await service.getAppointments();

      expect(priyaAppointments.length).toBeGreaterThan(0);
      expect(priyaAppointments.every(a => a.assignedStaff.some(s => s.id === 'staff-priya'))).toBe(true);
      expect(priyaAppointments.some(a => a.assignedStaff.some(s => s.id === 'staff-amit'))).toBe(false);
    });
  });

  describe('Multi-Stylist Assignment on Combo / Multi-Service Bookings', () => {
    it('should allow superadmin to assign multiple stylists to an appointment', async () => {
      await service.login('owner@thecroppers.in', 'password123', 'superadmin');
      const staffList = await service.getStaffMembers();
      const rahul = staffList.find(s => s.id === 'staff-rahul')!;
      const amit = staffList.find(s => s.id === 'staff-amit')!;

      // Assign both Rahul and Amit to apt-101
      const assignRes = await service.assignStaff('apt-101', [rahul, amit]);
      expect(assignRes.success).toBe(true);

      const allApts = await service.getAppointments();
      const targetApt = allApts.find(a => a.id === 'apt-101')!;
      expect(targetApt.assignedStaff.length).toBe(2);
      expect(targetApt.assignedStaff.some(s => s.id === 'staff-rahul')).toBe(true);
      expect(targetApt.assignedStaff.some(s => s.id === 'staff-amit')).toBe(true);
    });

    it('should make multi-stylist booking visible to BOTH assigned stylists, but not to unassigned stylists', async () => {
      // 1. Log in as Rahul: apt-109 (seeded with both Rahul & Amit) should be visible
      await service.login('rahul@thecroppers.in', 'password123', 'staff', 'staff-rahul');
      const rahulApts = await service.getAppointments();
      const rahulHasApt109 = rahulApts.some(a => a.id === 'apt-109');
      expect(rahulHasApt109).toBe(true);

      // 2. Log in as Amit: apt-109 should also be visible to Amit
      await service.login('amit@thecroppers.in', 'password123', 'staff', 'staff-amit');
      const amitApts = await service.getAppointments();
      const amitHasApt109 = amitApts.some(a => a.id === 'apt-109');
      expect(amitHasApt109).toBe(true);

      // 3. Log in as Priya: apt-109 should NOT be visible to Priya
      await service.login('priya@thecroppers.in', 'password123', 'staff', 'staff-priya');
      const priyaApts = await service.getAppointments();
      const priyaHasApt109 = priyaApts.some(a => a.id === 'apt-109');
      expect(priyaHasApt109).toBe(false);

      // 4. Priya should be prevented from altering status of apt-109
      const priyaUpdate = await service.updateAppointmentStatus('apt-109', 'completed');
      expect(priyaUpdate).toBe(false);

      // 5. Rahul CAN alter status of apt-109
      await service.login('rahul@thecroppers.in', 'password123', 'staff', 'staff-rahul');
      const rahulUpdate = await service.updateAppointmentStatus('apt-109', 'completed');
      expect(rahulUpdate).toBe(true);
    });
  });
});
