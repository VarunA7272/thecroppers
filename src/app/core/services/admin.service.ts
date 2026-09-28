import { Injectable, signal, computed, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { SalonInfoService } from './salon.service';
import {
  AdminUser,
  StaffMember,
  CreateStaffPayload,
  UpdateStaffPayload,
  AdminAppointment,
  CreateManualAppointmentPayload,
  UpdateAppointmentPayload,
  AppointmentFilter,
  CreateServicePayload,
  UpdateServicePayload
} from '../models/admin.model';
import { SalonService } from '../models/service.model';
import { SalonOpeningHour, Salon } from '../models/salon.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly supabase = inject(SupabaseService);
  private readonly salonService = inject(SalonInfoService);

  readonly salonId = environment.salonId;

  // Session & Roles
  readonly currentUser = signal<AdminUser | null>(this.getStoredUser());
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isSuperadmin = computed(() => this.currentUser()?.role === 'superadmin');
  readonly isStaff = computed(() => this.currentUser()?.role === 'staff');
  readonly currentStaffId = computed(() => this.currentUser()?.staffId);

  // In-memory Staff store initialized with Rahul, Amit, Priya
  private readonly staffStore = signal<StaffMember[]>([
    {
      id: 'staff-rahul',
      salon_id: environment.salonId,
      name: 'Rahul',
      role: 'Hair Stylist',
      specialization: 'hair',
      phone: '+91 98765 43211',
      is_active: true
    },
    {
      id: 'staff-amit',
      salon_id: environment.salonId,
      name: 'Amit',
      role: 'Barber',
      specialization: 'beard',
      phone: '+91 98765 43212',
      is_active: true
    },
    {
      id: 'staff-priya',
      salon_id: environment.salonId,
      name: 'Priya',
      role: 'Skin Specialist',
      specialization: 'skin',
      phone: '+91 98765 43213',
      is_active: true
    }
  ]);

  // In-memory Services store initialized with standard catalog
  private readonly servicesStore = signal<SalonService[]>([
    {
      id: 'srv-haircut',
      salon_id: environment.salonId,
      category_name: 'Hair',
      name: 'Haircut',
      description: 'Signature tailored haircut crafted to facial architecture with neck shave and hot lather rinse.',
      duration_minutes: 30,
      price: 200,
      image_url: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=600&q=80',
      is_active: true
    },
    {
      id: 'srv-hair-colour',
      salon_id: environment.salonId,
      category_name: 'Hair',
      name: 'Hair Colour',
      description: 'Custom chromatic formulation with premium ammonia-free tones for seamless dimensional depth.',
      duration_minutes: 90,
      price: 800,
      image_url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80',
      is_active: true
    },
    {
      id: 'srv-hair-spa',
      salon_id: environment.salonId,
      category_name: 'Hair',
      name: 'Hair Spa',
      description: 'Deep restorative keratin & botanical scalp ritual with warm steam and pressure-point massage.',
      duration_minutes: 60,
      price: 600,
      image_url: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=600&q=80',
      is_active: true
    },
    {
      id: 'srv-beard-trim',
      salon_id: environment.salonId,
      category_name: 'Beard',
      name: 'Beard Trim',
      description: 'Sculpted line definition, scissor fade, edge detailing, and organic beard oil treatment.',
      duration_minutes: 15,
      price: 100,
      image_url: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=600&q=80',
      is_active: true
    },
    {
      id: 'srv-shave',
      salon_id: environment.salonId,
      category_name: 'Beard',
      name: 'Shave',
      description: 'Traditional straight razor shave with essential pre-shave oils, hot towel infusion, and soothing balm.',
      duration_minutes: 20,
      price: 100,
      image_url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=600&q=80',
      is_active: true
    },
    {
      id: 'srv-facial',
      salon_id: environment.salonId,
      category_name: 'Skin',
      name: 'Facial',
      description: 'Complete dermal detox with enzymatic exfoliation, lymphatic drainage, and vitamin infusion.',
      duration_minutes: 60,
      price: 700,
      image_url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80',
      is_active: true
    },
    {
      id: 'srv-cleanup',
      salon_id: environment.salonId,
      category_name: 'Skin',
      name: 'Cleanup',
      description: 'Fast-action pore clarifying cleanse, gentle scrub exfoliation, and cooling botanical mask.',
      duration_minutes: 45,
      price: 400,
      image_url: 'https://images.unsplash.com/photo-1512290900672-1f41e57c6b96?auto=format&fit=crop&w=600&q=80',
      is_active: true
    }
  ]);

  // In-memory Appointments store
  private readonly appointmentsStore = signal<AdminAppointment[]>([
    {
      id: 'apt-101',
      referenceNumber: 'TCP-829101',
      salonId: environment.salonId,
      date: new Date().toISOString().split('T')[0],
      startTime: '10:00:00',
      endTime: '10:30:00',
      status: 'booked',
      customer: {
        name: 'Vikram Sharma',
        phone: '9826112233'
      },
      service: {
        id: 'srv-haircut',
        name: 'Haircut',
        durationMinutes: 30,
        price: 200,
        categoryName: 'Hair'
      },
      assignedStaff: [], // NULL - needs superadmin assignment
      createdAt: new Date().toISOString()
    },
    {
      id: 'apt-102',
      referenceNumber: 'TCP-829102',
      salonId: environment.salonId,
      date: new Date().toISOString().split('T')[0],
      startTime: '11:00:00',
      endTime: '12:30:00',
      status: 'booked',
      customer: {
        name: 'Rohan Mehra',
        phone: '9826445566'
      },
      service: {
        id: 'srv-hair-colour',
        name: 'Hair Colour',
        durationMinutes: 90,
        price: 800,
        categoryName: 'Hair'
      },
      assignedStaff: [this.staffStore()[0]], // Assigned to Rahul
      createdAt: new Date().toISOString()
    },
    {
      id: 'apt-103',
      referenceNumber: 'TCP-829103',
      salonId: environment.salonId,
      date: new Date().toISOString().split('T')[0],
      startTime: '12:00:00',
      endTime: '12:20:00',
      status: 'booked',
      customer: {
        name: 'Deepak Verma',
        phone: '9826778899'
      },
      service: {
        id: 'srv-shave',
        name: 'Shave',
        durationMinutes: 20,
        price: 100,
        categoryName: 'Beard'
      },
      assignedStaff: [], // NULL - needs superadmin assignment
      createdAt: new Date().toISOString()
    },
    {
      id: 'apt-104',
      referenceNumber: 'TCP-829104',
      salonId: environment.salonId,
      date: new Date().toISOString().split('T')[0],
      startTime: '14:00:00',
      endTime: '15:00:00',
      status: 'completed',
      customer: {
        name: 'Ananya Gupta',
        phone: '9826990011'
      },
      service: {
        id: 'srv-facial',
        name: 'Facial',
        durationMinutes: 60,
        price: 700,
        categoryName: 'Skin'
      },
      assignedStaff: [this.staffStore()[2]], // Assigned to Priya
      createdAt: new Date().toISOString()
    }
  ]);

  // In-memory Salon Hours store
  private readonly openingHoursStore = signal<SalonOpeningHour[]>([
    { dayOfWeek: 'Sunday', openTime: '10:00', closeTime: '18:00', isClosed: false },
    { dayOfWeek: 'Monday', openTime: '10:00', closeTime: '20:00', isClosed: false },
    { dayOfWeek: 'Tuesday', openTime: '10:00', closeTime: '20:00', isClosed: false },
    { dayOfWeek: 'Wednesday', openTime: '10:00', closeTime: '20:00', isClosed: false },
    { dayOfWeek: 'Thursday', openTime: '10:00', closeTime: '20:00', isClosed: false },
    { dayOfWeek: 'Friday', openTime: '10:00', closeTime: '20:00', isClosed: false },
    { dayOfWeek: 'Saturday', openTime: '10:00', closeTime: '21:00', isClosed: false }
  ]);

  constructor() {
    this.checkInitialSession();
  }

  private checkInitialSession(): void {
    if (this.supabase.isReady && this.supabase.clientInstance) {
      this.supabase.clientInstance.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const role = (session.user.user_metadata?.['role'] as 'superadmin' | 'staff') || 'superadmin';
          const user: AdminUser = {
            id: session.user.id,
            email: session.user.email || 'manager@thecroppers.in',
            role,
            name: session.user.user_metadata?.['name'] || (role === 'superadmin' ? 'Salon Owner' : 'Staff Member'),
            staffId: session.user.user_metadata?.['staff_id']
          };
          this.currentUser.set(user);
          localStorage.setItem('croppers_admin_user', JSON.stringify(user));
        }
      });
    }
  }

  private getStoredUser(): AdminUser | null {
    try {
      const data = localStorage.getItem('croppers_admin_user');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  // --- AUTHENTICATION ---

  async login(email: string, password: string, forceRole?: 'superadmin' | 'staff', staffId?: string): Promise<{ success: boolean; error?: string }> {
    if (this.supabase.isReady && this.supabase.clientInstance) {
      try {
        const { data, error } = await this.supabase.clientInstance.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (data.user) {
          const role = forceRole || (data.user.user_metadata?.['role'] as 'superadmin' | 'staff') || 'superadmin';
          const user: AdminUser = {
            id: data.user.id,
            email: data.user.email || email,
            role,
            name: data.user.user_metadata?.['name'] || (role === 'superadmin' ? 'Superadmin' : 'Staff Stylist'),
            staffId: staffId || data.user.user_metadata?.['staff_id']
          };
          this.currentUser.set(user);
          localStorage.setItem('croppers_admin_user', JSON.stringify(user));
          return { success: true };
        }
      } catch (err: any) {
        return { success: false, error: err.message || 'Authentication failed' };
      }
    }

    // Demo Mode Sign-in
    if (email && password) {
      const role = forceRole || (email.includes('superadmin') || email.includes('owner') || email.includes('manager') ? 'superadmin' : 'staff');
      const assignedStaff = staffId ? this.staffStore().find(s => s.id === staffId) : (role === 'staff' ? this.staffStore()[0] : undefined);
      const name = role === 'superadmin' ? 'Owner / Superadmin' : (assignedStaff?.name || 'Rahul (Staff)');

      const demoUser: AdminUser = {
        id: role === 'superadmin' ? 'admin-super-1' : 'staff-user-1',
        email: email,
        role: role,
        name: name,
        staffId: assignedStaff?.id || (role === 'staff' ? 'staff-rahul' : undefined)
      };
      this.currentUser.set(demoUser);
      localStorage.setItem('croppers_admin_user', JSON.stringify(demoUser));
      return { success: true };
    }

    return { success: false, error: 'Invalid credentials' };
  }

  async logout(): Promise<void> {
    if (this.supabase.isReady && this.supabase.clientInstance) {
      await this.supabase.clientInstance.auth.signOut();
    }
    this.currentUser.set(null);
    localStorage.removeItem('croppers_admin_user');
  }

  // --- STAFF CRUD (SUPERADMIN ONLY) ---

  async getStaffMembers(): Promise<StaffMember[]> {
    if (this.supabase.isReady && this.supabase.clientInstance) {
      try {
        const { data, error } = await this.supabase.clientInstance
          .from('staff')
          .select('*')
          .eq('salon_id', this.salonId);

        if (!error && data && data.length > 0) {
          const mapped: StaffMember[] = data.map((s: any) => ({
            id: s.id,
            salon_id: s.salon_id,
            name: s.name,
            role: s.role || 'Stylist',
            specialization: s.specialization || 'all',
            phone: s.phone,
            is_active: s.is_active ?? true
          }));
          this.staffStore.set(mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('[AdminService] Supabase staff query fallback:', err);
      }
    }
    return this.staffStore();
  }

  async addStaff(payload: CreateStaffPayload): Promise<StaffMember> {
    const newStaff: StaffMember = {
      id: 'staff-' + Math.random().toString(36).substring(2, 9),
      salon_id: this.salonId,
      name: payload.name.trim(),
      role: payload.role.trim(),
      specialization: payload.specialization,
      phone: payload.phone?.trim() || '',
      is_active: payload.is_active ?? true
    };

    if (this.supabase.isReady && this.supabase.clientInstance) {
      try {
        const { data, error } = await this.supabase.clientInstance
          .from('staff')
          .insert({
            salon_id: this.salonId,
            name: newStaff.name,
            role: newStaff.role,
            specialization: newStaff.specialization,
            phone: newStaff.phone,
            is_active: newStaff.is_active
          })
          .select()
          .single();

        if (!error && data) {
          newStaff.id = data.id;
        }
      } catch (err) {
        console.warn('[AdminService] Supabase addStaff error:', err);
      }
    }

    this.staffStore.update(list => [newStaff, ...list]);
    return newStaff;
  }

  async updateStaff(id: string, payload: UpdateStaffPayload): Promise<StaffMember | null> {
    let updatedStaff: StaffMember | null = null;

    if (this.supabase.isReady && this.supabase.clientInstance) {
      try {
        await this.supabase.clientInstance
          .from('staff')
          .update({
            ...(payload.name ? { name: payload.name.trim() } : {}),
            ...(payload.role ? { role: payload.role.trim() } : {}),
            ...(payload.specialization ? { specialization: payload.specialization } : {}),
            ...(payload.phone !== undefined ? { phone: payload.phone.trim() } : {}),
            ...(payload.is_active !== undefined ? { is_active: payload.is_active } : {})
          })
          .eq('id', id);
      } catch (err) {
        console.warn('[AdminService] Supabase updateStaff error:', err);
      }
    }

    this.staffStore.update(list =>
      list.map(s => {
        if (s.id === id) {
          updatedStaff = {
            ...s,
            ...(payload.name ? { name: payload.name.trim() } : {}),
            ...(payload.role ? { role: payload.role.trim() } : {}),
            ...(payload.specialization ? { specialization: payload.specialization } : {}),
            ...(payload.phone !== undefined ? { phone: payload.phone.trim() } : {}),
            ...(payload.is_active !== undefined ? { is_active: payload.is_active } : {})
          };
          return updatedStaff;
        }
        return s;
      })
    );

    return updatedStaff;
  }

  async deleteStaff(id: string): Promise<boolean> {
    if (this.supabase.isReady && this.supabase.clientInstance) {
      try {
        await this.supabase.clientInstance
          .from('staff')
          .delete()
          .eq('id', id);
      } catch (err) {
        console.warn('[AdminService] Supabase deleteStaff error:', err);
      }
    }

    this.staffStore.update(list => list.filter(s => s.id !== id));
    return true;
  }

  // --- SERVICES CRUD (SUPERADMIN ONLY) ---

  async getServices(): Promise<SalonService[]> {
    if (this.supabase.isReady && this.supabase.clientInstance) {
      try {
        const { data, error } = await this.supabase.clientInstance
          .from('services')
          .select('*, service_categories(name)')
          .eq('salon_id', this.salonId);

        if (!error && data && data.length > 0) {
          const mapped: SalonService[] = data.map((item: any) => ({
            id: item.id,
            salon_id: item.salon_id,
            category_id: item.category_id,
            category_name: item.service_categories?.name || 'General',
            name: item.name,
            description: item.description,
            duration_minutes: item.duration_minutes,
            price: Number(item.price),
            is_active: item.is_active
          }));
          this.servicesStore.set(mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('[AdminService] Supabase getServices fallback:', err);
      }
    }
    return this.servicesStore();
  }

  async addService(payload: CreateServicePayload): Promise<SalonService> {
    const newService: SalonService = {
      id: 'srv-' + Math.random().toString(36).substring(2, 9),
      salon_id: this.salonId,
      category_name: payload.category_name,
      name: payload.name.trim(),
      description: payload.description?.trim() || null,
      duration_minutes: payload.duration_minutes,
      price: payload.price,
      is_active: payload.is_active ?? true
    };

    if (this.supabase.isReady && this.supabase.clientInstance) {
      try {
        const { data, error } = await this.supabase.clientInstance
          .from('services')
          .insert({
            salon_id: this.salonId,
            name: newService.name,
            description: newService.description,
            duration_minutes: newService.duration_minutes,
            price: newService.price,
            is_active: newService.is_active
          })
          .select()
          .single();

        if (!error && data) {
          newService.id = data.id;
        }
      } catch (err) {
        console.warn('[AdminService] Supabase addService error:', err);
      }
    }

    this.servicesStore.update(list => [...list, newService]);
    return newService;
  }

  async updateService(id: string, payload: UpdateServicePayload): Promise<SalonService | null> {
    let updated: SalonService | null = null;

    if (this.supabase.isReady && this.supabase.clientInstance) {
      try {
        await this.supabase.clientInstance
          .from('services')
          .update({
            ...(payload.name ? { name: payload.name.trim() } : {}),
            ...(payload.description !== undefined ? { description: payload.description } : {}),
            ...(payload.duration_minutes ? { duration_minutes: payload.duration_minutes } : {}),
            ...(payload.price !== undefined ? { price: payload.price } : {}),
            ...(payload.is_active !== undefined ? { is_active: payload.is_active } : {})
          })
          .eq('id', id);
      } catch (err) {
        console.warn('[AdminService] Supabase updateService error:', err);
      }
    }

    this.servicesStore.update(list =>
      list.map(s => {
        if (s.id === id) {
          updated = {
            ...s,
            ...(payload.name ? { name: payload.name.trim() } : {}),
            ...(payload.category_name ? { category_name: payload.category_name } : {}),
            ...(payload.description !== undefined ? { description: payload.description } : {}),
            ...(payload.duration_minutes ? { duration_minutes: payload.duration_minutes } : {}),
            ...(payload.price !== undefined ? { price: payload.price } : {}),
            ...(payload.is_active !== undefined ? { is_active: payload.is_active } : {})
          };
          return updated;
        }
        return s;
      })
    );

    return updated;
  }

  async deleteService(id: string): Promise<boolean> {
    if (this.supabase.isReady && this.supabase.clientInstance) {
      try {
        await this.supabase.clientInstance
          .from('services')
          .delete()
          .eq('id', id);
      } catch (err) {
        console.warn('[AdminService] Supabase deleteService error:', err);
      }
    }

    this.servicesStore.update(list => list.filter(s => s.id !== id));
    return true;
  }

  // --- APPOINTMENTS CRUD & STATUSES ---

  async getAppointments(filter?: AppointmentFilter): Promise<AdminAppointment[]> {
    let list = this.appointmentsStore();

    if (filter?.date) {
      list = list.filter(a => a.date === filter.date);
    }
    if (filter?.status && filter.status !== 'all') {
      list = list.filter(a => a.status === filter.status);
    }
    if (filter?.unassignedOnly) {
      list = list.filter(a => a.assignedStaff.length === 0 && a.status === 'booked');
    }
    if (filter?.staffId) {
      list = list.filter(a => a.assignedStaff.some(s => s.id === filter.staffId));
    }

    return list;
  }

  async createManualAppointment(payload: CreateManualAppointmentPayload): Promise<AdminAppointment> {
    const service = this.servicesStore().find(s => s.id === payload.serviceId) || this.servicesStore()[0];
    const assignedStaffList: StaffMember[] = [];

    if (payload.staffId) {
      const staffMember = this.staffStore().find(s => s.id === payload.staffId);
      if (staffMember) {
        assignedStaffList.push(staffMember);
      }
    }

    // Calculate end time
    const startParts = payload.startTime.split(':');
    const startHour = parseInt(startParts[0], 10);
    const startMin = parseInt(startParts[1] || '0', 10);
    const totalMinutes = startHour * 60 + startMin + service.duration_minutes;
    const endHour = Math.floor(totalMinutes / 60);
    const endMin = totalMinutes % 60;
    const endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}:00`;

    const newAppointment: AdminAppointment = {
      id: 'apt-man-' + Math.random().toString(36).substring(2, 8),
      referenceNumber: 'TCP-' + Math.floor(100000 + Math.random() * 900000),
      salonId: this.salonId,
      date: payload.date,
      startTime: payload.startTime.length === 5 ? `${payload.startTime}:00` : payload.startTime,
      endTime: endTime,
      status: 'booked',
      customer: {
        name: payload.customerName.trim(),
        phone: payload.customerPhone.trim()
      },
      service: {
        id: service.id,
        name: service.name,
        durationMinutes: service.duration_minutes,
        price: service.price,
        categoryName: service.category_name
      },
      assignedStaff: assignedStaffList,
      notes: payload.notes?.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    this.appointmentsStore.update(list => [newAppointment, ...list]);
    return newAppointment;
  }

  async updateAppointment(id: string, payload: UpdateAppointmentPayload): Promise<AdminAppointment | null> {
    let updated: AdminAppointment | null = null;

    this.appointmentsStore.update(list =>
      list.map(apt => {
        if (apt.id === id) {
          const service = payload.serviceId
            ? this.servicesStore().find(s => s.id === payload.serviceId) || apt.service
            : apt.service;

          updated = {
            ...apt,
            date: payload.date || apt.date,
            startTime: payload.startTime || apt.startTime,
            endTime: payload.endTime || apt.endTime,
            customer: {
              name: payload.customerName?.trim() || apt.customer.name,
              phone: payload.customerPhone?.trim() || apt.customer.phone
            },
            service: {
              id: service.id,
              name: service.name,
              durationMinutes: (service as any).duration_minutes || (service as any).durationMinutes || 30,
              price: service.price,
              categoryName: (service as any).category_name || (service as any).categoryName || 'General'
            },
            notes: payload.notes !== undefined ? payload.notes : apt.notes
          };
          return updated;
        }
        return apt;
      })
    );

    return updated;
  }

  async deleteAppointment(id: string): Promise<boolean> {
    this.appointmentsStore.update(list => list.filter(a => a.id !== id));
    return true;
  }

  // Assign staff is STRICTLY SUPERADMIN ONLY
  async assignStaff(appointmentId: string, staff: StaffMember): Promise<{ success: boolean; error?: string }> {
    if (!this.isSuperadmin()) {
      return { success: false, error: 'Unauthorized: Only Superadmin can assign or reassign staff to appointments.' };
    }

    if (this.supabase.isReady && this.supabase.clientInstance) {
      try {
        const { data: aptServices } = await this.supabase.clientInstance
          .from('appointment_services')
          .select('id')
          .eq('appointment_id', appointmentId)
          .limit(1);

        if (aptServices && aptServices.length > 0) {
          const aptServiceId = aptServices[0].id;
          await this.supabase.clientInstance
            .from('appointment_service_staff')
            .delete()
            .eq('appointment_service_id', aptServiceId);

          await this.supabase.clientInstance
            .from('appointment_service_staff')
            .insert({
              appointment_service_id: aptServiceId,
              staff_id: staff.id
            });
        }
      } catch (err) {
        console.warn('[AdminService] Supabase assignStaff error:', err);
      }
    }

    this.appointmentsStore.update(items =>
      items.map(apt => {
        if (apt.id === appointmentId) {
          return {
            ...apt,
            assignedStaff: [staff]
          };
        }
        return apt;
      })
    );

    return { success: true };
  }

  // Update status is allowed for both superadmin and staff
  async updateAppointmentStatus(
    appointmentId: string,
    status: 'booked' | 'completed' | 'cancelled' | 'no_show'
  ): Promise<boolean> {
    if (this.supabase.isReady && this.supabase.clientInstance) {
      try {
        await this.supabase.clientInstance
          .from('appointments')
          .update({ status })
          .eq('id', appointmentId);
      } catch (err) {
        console.warn('[AdminService] Supabase updateStatus error:', err);
      }
    }

    this.appointmentsStore.update(items =>
      items.map(apt => {
        if (apt.id === appointmentId) {
          return {
            ...apt,
            status
          };
        }
        return apt;
      })
    );
    return true;
  }

  // --- SALON SETTINGS & HOURS (SUPERADMIN ONLY) ---

  async getOpeningHours(): Promise<SalonOpeningHour[]> {
    return this.openingHoursStore();
  }

  async updateOpeningHours(hours: SalonOpeningHour[]): Promise<boolean> {
    this.openingHoursStore.set([...hours]);
    return true;
  }
}
