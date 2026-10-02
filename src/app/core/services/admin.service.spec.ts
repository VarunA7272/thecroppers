import { TestBed } from '@angular/core/testing';
import { AdminService } from './admin.service';
import { SupabaseService } from './supabase.service';

describe('AdminService (Staff vs Superadmin Strict Data Isolation)', () => {
  let service: AdminService;

  const mockStaffList = [
    {
      id: 'staff-rahul',
      salon_id: 'f8d3c307-37a2-465c-902f-e023974aa562',
      name: 'Rahul',
      role: 'Hair Stylist',
      specialization: 'hair',
      phone: '+91 98765 43211',
      is_active: true,
      base_salary: 25000,
      incentive_percentage: 15
    },
    {
      id: 'staff-amit',
      salon_id: 'f8d3c307-37a2-465c-902f-e023974aa562',
      name: 'Amit',
      role: 'Barber',
      specialization: 'beard',
      phone: '+91 98765 43212',
      is_active: true,
      base_salary: 22000,
      incentive_percentage: 12
    },
    {
      id: 'staff-priya',
      salon_id: 'f8d3c307-37a2-465c-902f-e023974aa562',
      name: 'Priya',
      role: 'Skin Specialist',
      specialization: 'skin',
      phone: '+91 98765 43213',
      is_active: true,
      base_salary: 24000,
      incentive_percentage: 18
    }
  ];

  const mockServicesList = [
    {
      id: 'srv-haircut',
      salon_id: 'f8d3c307-37a2-465c-902f-e023974aa562',
      category_name: 'Hair',
      name: 'Haircut',
      description: 'Signature tailored haircut',
      duration_minutes: 30,
      price: 200,
      image_url: '',
      is_active: true
    },
    {
      id: 'srv-hair-colour',
      salon_id: 'f8d3c307-37a2-465c-902f-e023974aa562',
      category_name: 'Hair',
      name: 'Hair Colour',
      description: 'Custom chromatic formulation',
      duration_minutes: 90,
      price: 800,
      image_url: '',
      is_active: true
    },
    {
      id: 'srv-facial',
      salon_id: 'f8d3c307-37a2-465c-902f-e023974aa562',
      category_name: 'Skin',
      name: 'Facial',
      description: 'Complete dermal detox',
      duration_minutes: 60,
      price: 700,
      image_url: '',
      is_active: true
    },
    {
      id: 'srv-shave',
      salon_id: 'f8d3c307-37a2-465c-902f-e023974aa562',
      category_name: 'Beard',
      name: 'Shave',
      description: 'Traditional straight razor shave',
      duration_minutes: 20,
      price: 100,
      image_url: '',
      is_active: true
    },
    {
      id: 'srv-beard-trim',
      salon_id: 'f8d3c307-37a2-465c-902f-e023974aa562',
      category_name: 'Beard',
      name: 'Beard Trim',
      description: 'Sculpted line definition',
      duration_minutes: 15,
      price: 100,
      image_url: '',
      is_active: true
    }
  ];

  const mockAppointmentsList = [
    {
      id: 'apt-101',
      referenceNumber: 'TCP-829101',
      salonId: 'f8d3c307-37a2-465c-902f-e023974aa562',
      date: new Date().toISOString().split('T')[0],
      startTime: '10:00:00',
      endTime: '10:30:00',
      status: 'booked' as const,
      customer: { name: 'Vikram Sharma', phone: '9826112233' },
      service: { id: 'srv-haircut', name: 'Haircut', durationMinutes: 30, price: 200, categoryName: 'Hair' },
      services: [{ id: 'srv-haircut', name: 'Haircut', durationMinutes: 30, price: 200, categoryName: 'Hair' }],
      totalPrice: 200,
      paymentMethod: 'cash' as const,
      bookingSource: 'walk_in' as const,
      bookedByStaffName: 'Rahul (Staff)',
      ownerApprovalStatus: 'pending' as const,
      assignedStaff: [],
      createdAt: new Date().toISOString()
    },
    {
      id: 'apt-102',
      referenceNumber: 'TCP-829102',
      salonId: 'f8d3c307-37a2-465c-902f-e023974aa562',
      date: new Date().toISOString().split('T')[0],
      startTime: '11:00:00',
      endTime: '12:30:00',
      status: 'booked' as const,
      customer: { name: 'Rohan Mehra', phone: '9826445566' },
      service: { id: 'srv-hair-colour', name: 'Hair Colour', durationMinutes: 90, price: 800, categoryName: 'Hair' },
      services: [{ id: 'srv-hair-colour', name: 'Hair Colour', durationMinutes: 90, price: 800, categoryName: 'Hair' }],
      totalPrice: 800,
      paymentMethod: 'upi' as const,
      bookingSource: 'phone_call' as const,
      bookedByStaffName: 'Rahul (Staff)',
      ownerApprovalStatus: 'approved' as const,
      ownerReviewedAt: new Date().toISOString(),
      assignedStaff: [mockStaffList[0]],
      createdAt: new Date().toISOString()
    },
    {
      id: 'apt-103',
      referenceNumber: 'TCP-829103',
      salonId: 'f8d3c307-37a2-465c-902f-e023974aa562',
      date: new Date().toISOString().split('T')[0],
      startTime: '12:00:00',
      endTime: '12:20:00',
      status: 'booked' as const,
      customer: { name: 'Deepak Verma', phone: '9826778899' },
      service: { id: 'srv-shave', name: 'Shave', durationMinutes: 20, price: 100, categoryName: 'Beard' },
      services: [{ id: 'srv-shave', name: 'Shave', durationMinutes: 20, price: 100, categoryName: 'Beard' }],
      totalPrice: 100,
      paymentMethod: 'cash' as const,
      bookingSource: 'walk_in' as const,
      bookedByStaffName: 'Amit (Staff)',
      ownerApprovalStatus: 'pending' as const,
      assignedStaff: [],
      createdAt: new Date().toISOString()
    },
    {
      id: 'apt-104',
      referenceNumber: 'TCP-829104',
      salonId: 'f8d3c307-37a2-465c-902f-e023974aa562',
      date: new Date().toISOString().split('T')[0],
      startTime: '14:00:00',
      endTime: '15:00:00',
      status: 'completed' as const,
      customer: { name: 'Ananya Gupta', phone: '9826990011' },
      service: { id: 'srv-facial', name: 'Facial', durationMinutes: 60, price: 700, categoryName: 'Skin' },
      services: [{ id: 'srv-facial', name: 'Facial', durationMinutes: 60, price: 700, categoryName: 'Skin' }],
      totalPrice: 700,
      paymentMethod: 'upi' as const,
      bookingSource: 'online' as const,
      ownerApprovalStatus: 'approved' as const,
      statusChangedBy: 'Priya (Staff)',
      ownerReviewedAt: new Date().toISOString(),
      assignedStaff: [mockStaffList[2]],
      createdAt: new Date().toISOString()
    },
    {
      id: 'apt-106',
      referenceNumber: 'TCP-829106',
      salonId: 'f8d3c307-37a2-465c-902f-e023974aa562',
      date: new Date().toISOString().split('T')[0],
      startTime: '12:30:00',
      endTime: '13:00:00',
      status: 'booked' as const,
      customer: { name: 'Harsh Vardhan', phone: '9826227788' },
      service: { id: 'srv-beard-trim', name: 'Beard Trim', durationMinutes: 15, price: 100, categoryName: 'Beard' },
      services: [{ id: 'srv-beard-trim', name: 'Beard Trim', durationMinutes: 15, price: 100, categoryName: 'Beard' }],
      totalPrice: 100,
      paymentMethod: 'cash' as const,
      bookingSource: 'phone_call' as const,
      bookedByStaffName: 'Amit (Staff)',
      ownerApprovalStatus: 'pending' as const,
      assignedStaff: [mockStaffList[1]],
      createdAt: new Date().toISOString()
    },
    {
      id: 'apt-109',
      referenceNumber: 'TCP-829109',
      salonId: 'f8d3c307-37a2-465c-902f-e023974aa562',
      date: new Date().toISOString().split('T')[0],
      startTime: '17:00:00',
      endTime: '17:45:00',
      status: 'booked' as const,
      customer: { name: 'Aditya Singhania', phone: '9826771122' },
      service: { id: 'srv-haircut', name: 'Haircut + Beard Trim', durationMinutes: 45, price: 300, categoryName: 'Hair & Beard' },
      services: [
        { id: 'srv-haircut', name: 'Haircut', durationMinutes: 30, price: 200, categoryName: 'Hair' },
        { id: 'srv-beard-trim', name: 'Beard Trim', durationMinutes: 15, price: 100, categoryName: 'Beard' }
      ],
      totalPrice: 300,
      paymentMethod: 'upi' as const,
      bookingSource: 'walk_in' as const,
      bookedByStaffName: 'Rahul (Staff)',
      ownerApprovalStatus: 'pending' as const,
      assignedStaff: [mockStaffList[0], mockStaffList[1]],
      notes: 'Multi-service: Haircut by Rahul, Beard Trim by Amit',
      createdAt: new Date().toISOString()
    }
  ];

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SupabaseService,
          useValue: { isReady: false, clientInstance: null }
        }
      ]
    });
    service = TestBed.inject(AdminService);
    service.seedTestDataForTesting(
      JSON.parse(JSON.stringify(mockStaffList)),
      JSON.parse(JSON.stringify(mockServicesList)),
      JSON.parse(JSON.stringify(mockAppointmentsList))
    );
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

    it('should allow superadmin to review, edit charges, and add/delete services on a booking', async () => {
      const appointments = await service.getAppointments();
      const target = appointments[0];
      expect(target).toBeDefined();

      const staffList = await service.getStaffMembers();
      const updated = await service.reviewAndEditAppointment(target.id, {
        services: [
          {
            id: 'srv-haircut',
            name: 'Haircut',
            durationMinutes: 30,
            price: 200,
            categoryName: 'Hair'
          },
          {
            id: 'srv-beard-trim',
            name: 'Beard Trim',
            durationMinutes: 15,
            price: 100,
            categoryName: 'Beard'
          }
        ],
        finalPrice: 250, // Custom discounted charge
        priceAdjustmentNote: 'Special Combo Discount -₹50',
        assignedStaff: [staffList[0]],
        approveNow: true
      });

      expect(updated).toBeDefined();
      expect(updated?.services?.length).toBe(2);
      expect(updated?.totalPrice).toBe(250);
      expect(updated?.customPriceNote).toBe('Special Combo Discount -₹50');
      expect(updated?.ownerApprovalStatus).toBe('approved');
    });

    it('should allow superadmin to approve an individual booking or use Approve All for the day', async () => {
      const today = new Date().toISOString().split('T')[0];
      // Create a pending booking
      await service.login('rahul@thecroppers.in', 'password123', 'staff', 'staff-rahul');
      const pendingBooking = await service.createManualAppointment({
        customerName: 'Pending Client',
        customerPhone: '9826333444',
        serviceId: 'srv-haircut',
        date: today,
        startTime: '11:00'
      });
      expect(pendingBooking.ownerApprovalStatus).toBe('pending');

      // Superadmin reviews and approves
      await service.login('admin@thecroppers.in', 'password123', 'superadmin');
      const approveRes = await service.approveAppointment(pendingBooking.id);
      expect(approveRes).toBe(true);

      const refreshed = await service.getAppointments();
      const checked = refreshed.find(a => a.id === pendingBooking.id);
      expect(checked?.ownerApprovalStatus).toBe('approved');

      // Test Approve All
      const approveAllResult = await service.approveAllAppointmentsForDate(today);
      expect(approveAllResult).toBeDefined();
      expect(typeof approveAllResult.count).toBe('number');
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

    it('should reject staff attempts to assign staff, but allow staff to book walk-in/phone clients marked for owner review', async () => {
      const staffList = await service.getStaffMembers();
      const amit = staffList.find(s => s.id === 'staff-amit')!;

      // Assigning staff must still be strictly rejected for staff
      const assignRes = await service.assignStaff('apt-101', amit);
      expect(assignRes.success).toBe(false);
      expect(assignRes.error).toContain('Unauthorized');

      // Staff CAN create phone call or walk-in booking, tagged as pending owner review
      const staffBooking = await service.createManualAppointment({
        customerName: 'Kavita Joshi',
        customerPhone: '9826111111',
        serviceId: 'srv-haircut',
        date: '2026-09-30',
        startTime: '10:00',
        bookingSource: 'phone_call'
      });

      expect(staffBooking).toBeDefined();
      expect(staffBooking.customer.name).toBe('Kavita Joshi');
      expect(staffBooking.bookingSource).toBe('phone_call');
      expect(staffBooking.ownerApprovalStatus).toBe('pending');
      expect(staffBooking.bookedByStaffId).toBe('staff-rahul');
      expect(staffBooking.assignedStaff.some(s => s.id === 'staff-rahul')).toBe(true);
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

  describe('Salary and Incentive Configuration', () => {
    beforeEach(async () => {
      await service.login('owner@thecroppers.in', 'password123', 'superadmin');
    });

    it('should initialize staff members with base salary and incentive percentages', async () => {
      const staffList = await service.getStaffMembers();
      const rahul = staffList.find(s => s.id === 'staff-rahul')!;
      const amit = staffList.find(s => s.id === 'staff-amit')!;
      const priya = staffList.find(s => s.id === 'staff-priya')!;

      expect(rahul.base_salary).toBe(25000);
      expect(rahul.incentive_percentage).toBe(15);

      expect(amit.base_salary).toBe(22000);
      expect(amit.incentive_percentage).toBe(12);

      expect(priya.base_salary).toBe(24000);
      expect(priya.incentive_percentage).toBe(18);
    });

    it('should allow superadmin to add a new staff member with custom salary and incentive rate', async () => {
      const newStaff = await service.addStaff({
        name: 'Vikas',
        role: 'Junior Stylist',
        specialization: 'hair',
        phone: '+91 98765 00000',
        base_salary: 18000,
        incentive_percentage: 10
      });

      expect(newStaff.id).toBeTruthy();
      expect(newStaff.name).toBe('Vikas');
      expect(newStaff.base_salary).toBe(18000);
      expect(newStaff.incentive_percentage).toBe(10);
    });

    it('should allow superadmin to update an existing staff member salary and commission', async () => {
      const updated = await service.updateStaff('staff-amit', {
        base_salary: 24000,
        incentive_percentage: 14
      });

      expect(updated?.base_salary).toBe(24000);
      expect(updated?.incentive_percentage).toBe(14);
    });

    it('should reject non-superadmin attempts to modify staff profiles or salaries', async () => {
      await service.login('rahul@thecroppers.in', 'password123', 'staff', 'staff-rahul');
      await expect(
        service.updateStaff('staff-rahul', { base_salary: 50000 })
      ).rejects.toThrow(/Unauthorized/);
    });
  });

  describe('UX Simplifications and Fast Actions', () => {
    beforeEach(async () => {
      await service.login('owner@thecroppers.in', 'password123', 'superadmin');
    });

    it('should support adding a quick add-on service and recalculate total duration and price', async () => {
      const apt = (await service.getAppointments()).find(a => a.id === 'apt-101')!;
      const initialPrice = apt.totalPrice || apt.service.price;
      const initialDuration = apt.service.durationMinutes;

      const updated = await service.addQuickAddonService('apt-101', 'srv-shave');
      expect(updated).toBeTruthy();
      expect(updated?.services?.length).toBe(2);
      expect(updated?.service.durationMinutes).toBe(initialDuration + 20); // 30m + 20m shave
      expect(updated?.totalPrice).toBe(initialPrice + 100); // 200 + 100
      expect(updated?.ownerApprovalStatus).toBe('pending');
    });

    it('should filter appointments by exceptionsOnly (pending review or walkin/phone)', async () => {
      const exceptions = await service.getAppointments({ exceptionsOnly: true });
      expect(exceptions.length).toBeGreaterThan(0);
      for (const apt of exceptions) {
        const isException = 
          apt.ownerApprovalStatus === 'pending' || 
          apt.bookingSource === 'walk_in' || 
          apt.bookingSource === 'phone_call' || 
          !!apt.customPriceNote || 
          apt.status !== 'booked';
        expect(isException).toBe(true);
      }
    });

    it('should filter appointments by universal searchTerm across name, phone, or reference', async () => {
      const byName = await service.getAppointments({ searchTerm: 'Rohan' });
      expect(byName.length).toBeGreaterThanOrEqual(1);
      expect(byName[0].customer.name).toContain('Rohan');

      const byPhone = await service.getAppointments({ searchTerm: '9826445566' });
      expect(byPhone.length).toBeGreaterThanOrEqual(1);

      const byRef = await service.getAppointments({ searchTerm: 'TCP-829102' });
      expect(byRef.length).toBe(1);
      expect(byRef[0].id).toBe('apt-102');
    });

    it('should auto-assign staff chair and default paymentMethod on staff walk-in creation', async () => {
      await service.login('rahul@thecroppers.in', 'password123', 'staff', 'staff-rahul');

      const newApt = await service.createManualAppointment({
        customerName: 'Gaurav Sen',
        customerPhone: '9826001122',
        serviceId: 'srv-haircut',
        date: new Date().toISOString().split('T')[0],
        startTime: '16:00',
        bookingSource: 'walk_in'
      });

      expect(newApt.assignedStaff.length).toBe(1);
      expect(newApt.assignedStaff[0].id).toBe('staff-rahul');
      expect(newApt.paymentMethod).toBe('cash');
      expect(newApt.ownerApprovalStatus).toBe('pending');
      expect(newApt.bookedByStaffName).toContain('Rahul');
    });
  });
});

