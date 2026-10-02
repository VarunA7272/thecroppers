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
  ReviewAndEditAppointmentPayload,
  UpdateAppointmentPayload,
  AppointmentFilter,
  CreateServicePayload,
  UpdateServicePayload,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  AppointmentServiceItem
} from '../models/admin.model';
import { SalonService, ServiceCategory } from '../models/service.model';
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

  // In-memory Staff store (starts empty; populated from Supabase or via UI)
  private readonly staffStore = signal<StaffMember[]>([]);

  // In-memory Categories store (starts empty; populated from Supabase or via UI)
  private readonly categoriesStore = signal<ServiceCategory[]>([]);

  // In-memory Services store (starts empty; populated from Supabase or via UI)
  private readonly servicesStore = signal<SalonService[]>([]);

  // In-memory Appointments store (starts empty; populated from Supabase or via UI)
  private readonly appointmentsStore = signal<AdminAppointment[]>([]);

  // Helper for unit tests to populate test fixtures in memory
  seedTestDataForTesting(
    staff: StaffMember[],
    services: SalonService[],
    appointments: AdminAppointment[],
    categories?: ServiceCategory[]
  ): void {
    this.staffStore.set(staff);
    this.servicesStore.set(services);
    this.appointmentsStore.set(appointments);
    if (categories) {
      this.categoriesStore.set(categories);
    }
  }

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

        if (!error && data?.user) {
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
        // Fall back to demo authentication
      }
    }

    // Demo Mode Sign-in
    if (email && password) {
      const emailLower = email.toLowerCase();
      const role = forceRole || (emailLower.includes('superadmin') || emailLower.includes('owner') || emailLower.includes('manager') ? 'superadmin' : 'staff');
      const staffMembers = this.staffStore();
      let assignedStaff: StaffMember | undefined;

      if (staffId) {
        assignedStaff = staffMembers.find(s => s.id === staffId);
      } else if (role === 'staff') {
        assignedStaff = staffMembers.find(s => emailLower.includes(s.name.toLowerCase())) || staffMembers[0];
      }

      const name = role === 'superadmin' 
        ? 'Owner / Superadmin' 
        : (assignedStaff ? `${assignedStaff.name} (${assignedStaff.role})` : 'Staff Member');

      const demoUser: AdminUser = {
        id: role === 'superadmin' ? 'admin-super-1' : (assignedStaff ? `user-${assignedStaff.id}` : 'staff-user-1'),
        email: email,
        role: role,
        name: name,
        staffId: role === 'staff' ? (assignedStaff?.id || staffId || 'staff-default') : undefined
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
            is_active: s.is_active ?? true,
            base_salary: s.base_salary ? Number(s.base_salary) : 22000,
            incentive_percentage: s.incentive_percentage ? Number(s.incentive_percentage) : 15
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
    if (!this.isSuperadmin()) {
      throw new Error('Unauthorized: Only Superadmin can add new staff members.');
    }

    const newStaff: StaffMember = {
      id: 'staff-' + Math.random().toString(36).substring(2, 9),
      salon_id: this.salonId,
      name: payload.name.trim(),
      role: payload.role.trim(),
      specialization: payload.specialization,
      phone: payload.phone?.trim() || '',
      is_active: payload.is_active ?? true,
      base_salary: payload.base_salary !== undefined ? Number(payload.base_salary) : 22000,
      incentive_percentage: payload.incentive_percentage !== undefined ? Number(payload.incentive_percentage) : 15
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
            is_active: newStaff.is_active,
            base_salary: newStaff.base_salary,
            incentive_percentage: newStaff.incentive_percentage
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
    if (!this.isSuperadmin()) {
      throw new Error('Unauthorized: Only Superadmin can modify staff profiles and salaries.');
    }

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
            ...(payload.is_active !== undefined ? { is_active: payload.is_active } : {}),
            ...(payload.base_salary !== undefined ? { base_salary: Number(payload.base_salary) } : {}),
            ...(payload.incentive_percentage !== undefined ? { incentive_percentage: Number(payload.incentive_percentage) } : {})
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
            ...(payload.is_active !== undefined ? { is_active: payload.is_active } : {}),
            ...(payload.base_salary !== undefined ? { base_salary: Number(payload.base_salary) } : {}),
            ...(payload.incentive_percentage !== undefined ? { incentive_percentage: Number(payload.incentive_percentage) } : {})
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

  // --- CATEGORIES CRUD (SUPERADMIN ONLY) ---

  async getCategories(): Promise<ServiceCategory[]> {
    if (this.supabase.isReady && this.supabase.clientInstance) {
      try {
        const { data, error } = await this.supabase.clientInstance
          .from('service_categories')
          .select('*')
          .eq('salon_id', this.salonId)
          .order('display_order', { ascending: true });

        if (!error && data && data.length > 0) {
          const mapped: ServiceCategory[] = data.map((c: any) => ({
            id: c.id,
            salon_id: c.salon_id,
            name: c.name,
            description: c.description,
            display_order: c.display_order ?? 0
          }));
          this.categoriesStore.set(mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('[AdminService] Supabase getCategories fallback:', err);
      }
    }
    return this.categoriesStore();
  }

  async addCategory(payload: CreateCategoryPayload): Promise<ServiceCategory> {
    if (!this.isSuperadmin()) {
      throw new Error('Unauthorized: Only Superadmin can add categories.');
    }

    const newCategory: ServiceCategory = {
      id: 'cat-' + Math.random().toString(36).substring(2, 9),
      salon_id: this.salonId,
      name: payload.name.trim(),
      description: payload.description?.trim() || null,
      display_order: payload.display_order !== undefined ? Number(payload.display_order) : (this.categoriesStore().length + 1)
    };

    if (this.supabase.isReady && this.supabase.clientInstance) {
      try {
        const { data, error } = await this.supabase.clientInstance
          .from('service_categories')
          .insert({
            salon_id: this.salonId,
            name: newCategory.name,
            description: newCategory.description,
            display_order: newCategory.display_order
          })
          .select()
          .single();

        if (!error && data) {
          newCategory.id = data.id;
        }
      } catch (err) {
        console.warn('[AdminService] Supabase addCategory error:', err);
      }
    }

    this.categoriesStore.update(list => [...list, newCategory]);
    return newCategory;
  }

  async updateCategory(id: string, payload: UpdateCategoryPayload): Promise<ServiceCategory | null> {
    if (!this.isSuperadmin()) {
      throw new Error('Unauthorized: Only Superadmin can edit categories.');
    }

    let updated: ServiceCategory | null = null;

    if (this.supabase.isReady && this.supabase.clientInstance) {
      try {
        await this.supabase.clientInstance
          .from('service_categories')
          .update({
            ...(payload.name ? { name: payload.name.trim() } : {}),
            ...(payload.description !== undefined ? { description: payload.description?.trim() || null } : {}),
            ...(payload.display_order !== undefined ? { display_order: Number(payload.display_order) } : {})
          })
          .eq('id', id);
      } catch (err) {
        console.warn('[AdminService] Supabase updateCategory error:', err);
      }
    }

    this.categoriesStore.update(list =>
      list.map(c => {
        if (c.id === id) {
          updated = {
            ...c,
            ...(payload.name ? { name: payload.name.trim() } : {}),
            ...(payload.description !== undefined ? { description: payload.description?.trim() || null } : {}),
            ...(payload.display_order !== undefined ? { display_order: Number(payload.display_order) } : {})
          };
          return updated;
        }
        return c;
      })
    );

    return updated;
  }

  async deleteCategory(id: string): Promise<boolean> {
    if (!this.isSuperadmin()) {
      throw new Error('Unauthorized: Only Superadmin can delete categories.');
    }

    if (this.supabase.isReady && this.supabase.clientInstance) {
      try {
        // First, unlink or reassign services attached to this category
        await this.supabase.clientInstance
          .from('services')
          .update({ category_id: null })
          .eq('category_id', id);

        await this.supabase.clientInstance
          .from('service_categories')
          .delete()
          .eq('id', id);
      } catch (err) {
        console.warn('[AdminService] Supabase deleteCategory error:', err);
      }
    }

    this.categoriesStore.update(list => list.filter(c => c.id !== id));
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
            image_url: item.image_url,
            is_active: item.is_active ?? true
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
    const categories = this.categoriesStore();
    const matchedCategory = categories.find(c => c.name.toLowerCase() === (payload.category_name || '').toLowerCase());
    const category_id = matchedCategory?.id || null;

    const newService: SalonService = {
      id: 'srv-' + Math.random().toString(36).substring(2, 9),
      salon_id: this.salonId,
      category_id: category_id,
      category_name: payload.category_name || matchedCategory?.name || 'General',
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
            category_id: category_id,
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
    let category_id: string | null | undefined = payload.category_id;

    if (!category_id && payload.category_name) {
      const categories = this.categoriesStore();
      const matched = categories.find(c => c.name.toLowerCase() === payload.category_name?.toLowerCase());
      if (matched) {
        category_id = matched.id;
      }
    }

    if (this.supabase.isReady && this.supabase.clientInstance) {
      try {
        await this.supabase.clientInstance
          .from('services')
          .update({
            ...(payload.name ? { name: payload.name.trim() } : {}),
            ...(category_id !== undefined ? { category_id } : {}),
            ...(payload.description !== undefined ? { description: payload.description } : {}),
            ...(payload.duration_minutes ? { duration_minutes: payload.duration_minutes } : {}),
            ...(payload.price !== undefined ? { price: payload.price } : {}),
            ...(payload.image_url !== undefined ? { image_url: payload.image_url } : {}),
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
            ...(category_id !== undefined ? { category_id } : {}),
            ...(payload.category_name ? { category_name: payload.category_name } : {}),
            ...(payload.description !== undefined ? { description: payload.description } : {}),
            ...(payload.duration_minutes ? { duration_minutes: payload.duration_minutes } : {}),
            ...(payload.price !== undefined ? { price: payload.price } : {}),
            ...(payload.image_url !== undefined ? { image_url: payload.image_url } : {}),
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
    if (this.supabase.isReady && this.supabase.clientInstance) {
      try {
        let query = this.supabase.clientInstance
          .from('appointments')
          .select(`
            *,
            customers (name, phone),
            appointment_services (
              price,
              services (id, name, duration_minutes, price, service_categories(name)),
              appointment_service_staff (staff (*))
            )
          `)
          .eq('salon_id', this.salonId)
          .order('date', { ascending: false });

        if (filter?.date) {
          query = query.eq('date', filter.date);
        }
        if (filter?.status && filter.status !== 'all') {
          query = query.eq('status', filter.status);
        }

        const { data, error } = await query;

        if (!error && data && data.length > 0) {
          const mapped: AdminAppointment[] = data.map((apt: any) => {
            const aptServices = apt.appointment_services || [];
            const serviceItems: AppointmentServiceItem[] = aptServices.map((as: any) => ({
              id: as.services?.id || 'srv-unknown',
              name: as.services?.name || 'Service',
              durationMinutes: as.services?.duration_minutes || 30,
              price: Number(as.price || as.services?.price || 0),
              categoryName: as.services?.service_categories?.name || 'General'
            }));

            const assignedStaff: StaffMember[] = [];
            aptServices.forEach((as: any) => {
              (as.appointment_service_staff || []).forEach((ass: any) => {
                if (ass.staff && !assignedStaff.some(s => s.id === ass.staff.id)) {
                  assignedStaff.push({
                    id: ass.staff.id,
                    salon_id: ass.staff.salon_id,
                    name: ass.staff.name || ass.staff.full_name || 'Staff',
                    role: ass.staff.role || ass.staff.designation || 'Stylist',
                    specialization: ass.staff.specialization || 'all',
                    phone: ass.staff.phone || '',
                    is_active: ass.staff.is_active ?? true,
                    base_salary: Number(ass.staff.base_salary || 22000),
                    incentive_percentage: Number(ass.staff.incentive_percentage || 15)
                  });
                }
              });
            });

            const primaryService = serviceItems[0] || {
              id: 'srv-haircut',
              name: 'Haircut',
              durationMinutes: 30,
              price: Number(apt.total_price || 0),
              categoryName: 'General'
            };

            const totalDuration = serviceItems.reduce((acc, s) => acc + s.durationMinutes, 0);

            return {
              id: apt.id,
              referenceNumber: apt.reference_number || 'TCP-000000',
              salonId: apt.salon_id,
              date: apt.date || apt.appointment_date,
              startTime: apt.start_time || '10:00:00',
              endTime: apt.end_time || '10:30:00',
              status: apt.status || 'booked',
              customer: {
                name: apt.customers?.name || apt.customers?.full_name || 'Walk-in Client',
                phone: apt.customers?.phone || ''
              },
              service: {
                id: primaryService.id,
                name: serviceItems.length > 1 ? serviceItems.map(s => s.name).join(' + ') : primaryService.name,
                durationMinutes: totalDuration,
                price: Number(apt.total_price || primaryService.price),
                categoryName: primaryService.categoryName
              },
              services: serviceItems,
              totalPrice: Number(apt.total_price || 0),
              paymentMethod: apt.payment_method || 'cash',
              bookingSource: apt.booking_source || 'walk_in',
              bookedByStaffName: apt.booked_by_staff_name,
              ownerApprovalStatus: apt.owner_approval_status || 'approved',
              customPriceNote: apt.custom_price_note,
              statusChangedBy: apt.status_changed_by,
              assignedStaff,
              notes: apt.notes,
              createdAt: apt.created_at
            };
          });

          this.appointmentsStore.set(mapped);
        }
      } catch (err) {
        console.warn('[AdminService] Supabase getAppointments fallback:', err);
      }
    }

    let list = this.appointmentsStore();

    // STRICT ROLE-BASED ACCESS CONTROL:
    // If the authenticated user is staff, enforce strict scoping to their own assigned appointments.
    if (this.isStaff()) {
      const myStaffId = this.currentStaffId();
      if (!myStaffId) {
        return [];
      }
      // Staff members cannot view unassigned queue
      if (filter?.unassignedOnly) {
        return [];
      }
      list = list.filter(a => a.assignedStaff.some(s => s.id === myStaffId));
    } else {
      // Superadmin access: can filter by staffId or unassigned
      if (filter?.unassignedOnly) {
        list = list.filter(a => a.assignedStaff.length === 0 && a.status === 'booked');
      }
      if (filter?.staffId) {
        list = list.filter(a => a.assignedStaff.some(s => s.id === filter.staffId));
      }
    }

    if (filter?.date) {
      list = list.filter(a => a.date === filter.date);
    }
    if (filter?.status && filter.status !== 'all') {
      list = list.filter(a => a.status === filter.status);
    }
    if (filter?.exceptionsOnly) {
      list = list.filter(a => 
        a.ownerApprovalStatus === 'pending' || 
        a.bookingSource === 'walk_in' || 
        a.bookingSource === 'phone_call' || 
        !!a.customPriceNote || 
        (a.status !== 'booked')
      );
    }
    if (filter?.searchTerm && filter.searchTerm.trim()) {
      const term = filter.searchTerm.trim().toLowerCase();
      list = list.filter(a => 
        a.customer.name.toLowerCase().includes(term) ||
        a.customer.phone.includes(term) ||
        a.referenceNumber.toLowerCase().includes(term)
      );
    }

    return list;
  }

  async createManualAppointment(payload: CreateManualAppointmentPayload): Promise<AdminAppointment> {
    // Both Superadmin and Staff can create Walk-in / Phone Client bookings!
    let assignedStaffList: StaffMember[] = [];
    let bookedByStaffId: string | undefined = undefined;
    let bookedByStaffName = 'Owner (Superadmin)';
    let ownerApprovalStatus: 'pending' | 'approved' = 'approved';

    if (this.isStaff()) {
      const staffId = this.currentStaffId();
      const staffMember = this.staffStore().find(s => s.id === staffId);
      if (staffMember) {
        assignedStaffList.push(staffMember);
      }
      bookedByStaffId = staffId;
      bookedByStaffName = (this.currentUser()?.name || 'Staff') + ' (Staff)';
      // Staff bookings require End-of-Day review by Owner
      ownerApprovalStatus = 'pending';
    } else {
      // Superadmin can assign staff or leave unassigned
      if (payload.staffId) {
        const staffMember = this.staffStore().find(s => s.id === payload.staffId);
        if (staffMember) {
          assignedStaffList.push(staffMember);
        }
      }
    }

    // Resolve service(s)
    let serviceItems: AppointmentServiceItem[] = [];
    if (payload.services && payload.services.length > 0) {
      serviceItems = [...payload.services];
    } else if (payload.serviceIds && payload.serviceIds.length > 0) {
      serviceItems = payload.serviceIds.map(id => {
        const s = this.servicesStore().find(srv => srv.id === id) || this.servicesStore()[0];
        return {
          id: s.id,
          name: s.name,
          durationMinutes: s.duration_minutes,
          price: s.price,
          categoryName: s.category_name
        };
      });
    } else {
      const s = this.servicesStore().find(srv => srv.id === payload.serviceId) || this.servicesStore()[0];
      serviceItems = [{
        id: s.id,
        name: s.name,
        durationMinutes: s.duration_minutes,
        price: s.price,
        categoryName: s.category_name
      }];
    }

    const primaryService = serviceItems[0];
    const totalDuration = serviceItems.reduce((acc, s) => acc + s.durationMinutes, 0);
    const catalogPrice = serviceItems.reduce((acc, s) => acc + s.price, 0);
    const totalPrice = payload.customPrice !== undefined ? payload.customPrice : catalogPrice;

    // Calculate end time
    const startParts = payload.startTime.split(':');
    const startHour = parseInt(startParts[0], 10);
    const startMin = parseInt(startParts[1] || '0', 10);
    const totalMinutes = startHour * 60 + startMin + totalDuration;
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
        id: primaryService.id,
        name: serviceItems.length > 1 ? serviceItems.map(s => s.name).join(' + ') : primaryService.name,
        durationMinutes: totalDuration,
        price: totalPrice,
        categoryName: primaryService.categoryName
      },
      services: serviceItems,
      totalPrice: totalPrice,
      paymentMethod: payload.paymentMethod || (payload.bookingSource === 'walk_in' ? 'cash' : 'upi'),
      bookingSource: payload.bookingSource || 'walk_in',
      bookedByStaffId,
      bookedByStaffName,
      ownerApprovalStatus,
      assignedStaff: assignedStaffList,
      notes: payload.notes?.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    this.appointmentsStore.update(list => [newAppointment, ...list]);
    return newAppointment;
  }

  async updateAppointment(id: string, payload: UpdateAppointmentPayload): Promise<AdminAppointment | null> {
    if (!this.isSuperadmin()) {
      throw new Error('Unauthorized: Only Superadmin can edit appointment details.');
    }

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
    if (!this.isSuperadmin()) {
      throw new Error('Unauthorized: Only Superadmin can delete appointments.');
    }
    this.appointmentsStore.update(list => list.filter(a => a.id !== id));
    return true;
  }

  // Assign staff is STRICTLY SUPERADMIN ONLY (Supports single or multiple stylists)
  async assignStaff(
    appointmentId: string, 
    staffOrList: StaffMember | StaffMember[]
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.isSuperadmin()) {
      return { success: false, error: 'Unauthorized: Only Superadmin can assign or reassign staff to appointments.' };
    }

    const staffList = Array.isArray(staffOrList) ? staffOrList : [staffOrList];

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

          if (staffList.length > 0) {
            const inserts = staffList.map(s => ({
              appointment_service_id: aptServiceId,
              staff_id: s.id
            }));
            await this.supabase.clientInstance
              .from('appointment_service_staff')
              .insert(inserts);
          }
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
            assignedStaff: [...staffList]
          };
        }
        return apt;
      })
    );

    return { success: true };
  }

  // Update status is allowed for superadmin, and for staff STRICTLY on their own assigned appointments
  async updateAppointmentStatus(
    appointmentId: string,
    status: 'booked' | 'completed' | 'cancelled' | 'no_show'
  ): Promise<boolean> {
    const targetApt = this.appointmentsStore().find(a => a.id === appointmentId);
    if (!targetApt) {
      return false;
    }

    // Role check: If staff, ensure the appointment is assigned to them
    let statusChangedBy = 'Superadmin (Owner)';
    let ownerApprovalStatus: 'pending' | 'approved' = 'approved';

    if (this.isStaff()) {
      const myStaffId = this.currentStaffId();
      const isAssignedToMe = targetApt.assignedStaff.some(s => s.id === myStaffId);
      if (!isAssignedToMe) {
        console.warn(`[AdminService] Unauthorized status update attempt by staff ${myStaffId} on appointment ${appointmentId}`);
        return false;
      }
      statusChangedBy = (this.currentUser()?.name || 'Staff') + ' (Staff)';
      // Staff status change triggers pending Owner review at end of day!
      ownerApprovalStatus = 'pending';
    }

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
            status,
            statusChangedBy,
            statusChangedAt: new Date().toISOString(),
            ownerApprovalStatus
          };
        }
        return apt;
      })
    );
    return true;
  }

  // Owner End-of-Day Review: Approve an individual booking
  async approveAppointment(appointmentId: string): Promise<boolean> {
    if (!this.isSuperadmin()) {
      throw new Error('Unauthorized: Only Superadmin can approve appointments.');
    }
    this.appointmentsStore.update(items =>
      items.map(apt => {
        if (apt.id === appointmentId) {
          return {
            ...apt,
            ownerApprovalStatus: 'approved',
            ownerReviewedAt: new Date().toISOString()
          };
        }
        return apt;
      })
    );
    return true;
  }

  // Owner End-of-Day Review: "Approve All" for a particular date
  async approveAllAppointmentsForDate(date?: string): Promise<{ count: number }> {
    if (!this.isSuperadmin()) {
      throw new Error('Unauthorized: Only Superadmin can approve appointments.');
    }
    let approvedCount = 0;
    this.appointmentsStore.update(items =>
      items.map(apt => {
        const matchesDate = !date || apt.date === date;
        if (matchesDate && apt.ownerApprovalStatus !== 'approved') {
          approvedCount++;
          return {
            ...apt,
            ownerApprovalStatus: 'approved',
            ownerReviewedAt: new Date().toISOString()
          };
        }
        return apt;
      })
    );
    return { count: approvedCount };
  }

  // Review & Edit a Booking: Change charges, add/delete services, assign stylists
  async reviewAndEditAppointment(
    appointmentId: string,
    payload: ReviewAndEditAppointmentPayload
  ): Promise<AdminAppointment | null> {
    if (!this.isSuperadmin()) {
      throw new Error('Unauthorized: Only Superadmin can review and edit booking charges/services.');
    }

    if (!payload.services || payload.services.length === 0) {
      throw new Error('An appointment must have at least one service.');
    }

    let updated: AdminAppointment | null = null;
    const services = [...payload.services];
    const primaryService = services[0];
    const totalDuration = services.reduce((acc, s) => acc + s.durationMinutes, 0);
    const combinedName = services.length > 1 ? services.map(s => s.name).join(' + ') : primaryService.name;

    this.appointmentsStore.update(items =>
      items.map(apt => {
        if (apt.id === appointmentId) {
          // Recalculate end time based on combined duration
          const startParts = apt.startTime.split(':');
          const startHour = parseInt(startParts[0], 10);
          const startMin = parseInt(startParts[1] || '0', 10);
          const totalMinutes = startHour * 60 + startMin + totalDuration;
          const endHour = Math.floor(totalMinutes / 60);
          const endMin = totalMinutes % 60;
          const endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}:00`;

          updated = {
            ...apt,
            endTime,
            service: {
              id: primaryService.id,
              name: combinedName,
              durationMinutes: totalDuration,
              price: payload.finalPrice,
              categoryName: primaryService.categoryName
            },
            services: [...services],
            totalPrice: payload.finalPrice,
            customPriceNote: payload.priceAdjustmentNote?.trim() || undefined,
            paymentMethod: payload.paymentMethod || apt.paymentMethod || 'cash',
            assignedStaff: [...payload.assignedStaff],
            notes: payload.notes !== undefined ? payload.notes : apt.notes,
            ownerApprovalStatus: payload.approveNow ? 'approved' : (apt.ownerApprovalStatus || 'approved'),
            ownerReviewedAt: payload.approveNow ? new Date().toISOString() : apt.ownerReviewedAt
          };
          return updated;
        }
        return apt;
      })
    );

    return updated;
  }

  // 1-Tap Quick Add-on Service on Appointment Card
  async addQuickAddonService(appointmentId: string, serviceId: string): Promise<AdminAppointment | null> {
    const srv = this.servicesStore().find(s => s.id === serviceId);
    if (!srv) {
      throw new Error('Service not found.');
    }

    let updated: AdminAppointment | null = null;
    this.appointmentsStore.update(items =>
      items.map(apt => {
        if (apt.id === appointmentId) {
          const currentServices: AppointmentServiceItem[] = apt.services && apt.services.length > 0
            ? [...apt.services]
            : [{
                id: apt.service.id,
                name: apt.service.name,
                durationMinutes: apt.service.durationMinutes,
                price: apt.service.price,
                categoryName: apt.service.categoryName
              }];

          const newItem: AppointmentServiceItem = {
            id: srv.id,
            name: srv.name,
            durationMinutes: srv.duration_minutes,
            price: srv.price,
            categoryName: srv.category_name
          };

          const newServices = [...currentServices, newItem];
          const totalDuration = newServices.reduce((acc, s) => acc + s.durationMinutes, 0);
          const combinedName = newServices.map(s => s.name).join(' + ');
          const currentPrice = apt.totalPrice !== undefined ? apt.totalPrice : apt.service.price;
          const newTotalPrice = currentPrice + srv.price;

          // Recalculate end time
          const startParts = apt.startTime.split(':');
          const startHour = parseInt(startParts[0], 10);
          const startMin = parseInt(startParts[1] || '0', 10);
          const totalMinutes = startHour * 60 + startMin + totalDuration;
          const endHour = Math.floor(totalMinutes / 60);
          const endMin = totalMinutes % 60;
          const endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}:00`;

          updated = {
            ...apt,
            endTime,
            service: {
              ...apt.service,
              name: combinedName,
              durationMinutes: totalDuration,
              price: newTotalPrice
            },
            services: newServices,
            totalPrice: newTotalPrice,
            ownerApprovalStatus: 'pending' // Adding service mid-day flags for owner EOD review
          };
          return updated;
        }
        return apt;
      })
    );
    return updated;
  }

  // --- SALON SETTINGS, PROFILE & HOURS (SUPERADMIN ONLY) ---

  async getSalonProfile(): Promise<Salon> {
    if (this.supabase.isReady && this.supabase.clientInstance) {
      try {
        const { data, error } = await this.supabase.clientInstance
          .from('salons')
          .select('*')
          .eq('id', this.salonId)
          .single();

        if (!error && data) {
          return {
            id: data.id,
            name: data.name || environment.salonName,
            slug: data.slug || 'the-croppers',
            city: data.city || environment.salonCity,
            phone: data.phone || environment.salonPhone,
            timezone: data.timezone || environment.timezone,
            currency: data.currency || environment.currency
          };
        }
      } catch (err) {
        console.warn('[AdminService] Supabase getSalonProfile fallback:', err);
      }
    }
    return {
      id: this.salonId,
      name: environment.salonName,
      slug: 'the-croppers',
      city: environment.salonCity,
      phone: environment.salonPhone,
      timezone: environment.timezone,
      currency: environment.currency
    };
  }

  async updateSalonProfile(profile: Partial<Salon>): Promise<boolean> {
    if (!this.isSuperadmin()) {
      throw new Error('Unauthorized: Only Superadmin can update salon profile.');
    }

    if (this.supabase.isReady && this.supabase.clientInstance) {
      try {
        await this.supabase.clientInstance
          .from('salons')
          .update({
            ...(profile.name ? { name: profile.name } : {}),
            ...(profile.city ? { city: profile.city } : {}),
            ...(profile.phone ? { phone: profile.phone } : {}),
            ...(profile.timezone ? { timezone: profile.timezone } : {}),
            ...(profile.currency ? { currency: profile.currency } : {})
          })
          .eq('id', this.salonId);
      } catch (err) {
        console.warn('[AdminService] Supabase updateSalonProfile error:', err);
      }
    }

    return true;
  }

  async getOpeningHours(): Promise<SalonOpeningHour[]> {
    if (this.supabase.isReady && this.supabase.clientInstance) {
      try {
        const { data, error } = await this.supabase.clientInstance
          .from('salon_hours')
          .select('*')
          .eq('salon_id', this.salonId)
          .order('day_of_week', { ascending: true });

        if (!error && data && data.length > 0) {
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const mapped: SalonOpeningHour[] = data.map((h: any) => {
            const dayStr = typeof h.day_of_week === 'number' ? (dayNames[h.day_of_week] || 'Monday') : (h.day_of_week || 'Monday');
            return {
              dayOfWeek: dayStr,
              openTime: (h.open_time || h.opens_at || '10:00:00').substring(0, 5),
              closeTime: (h.close_time || h.closes_at || '20:00:00').substring(0, 5),
              isClosed: h.is_closed ?? false
            };
          });
          this.openingHoursStore.set(mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('[AdminService] Supabase getOpeningHours fallback:', err);
      }
    }
    return this.openingHoursStore();
  }

  async updateOpeningHours(hours: SalonOpeningHour[]): Promise<boolean> {
    if (!this.isSuperadmin()) {
      throw new Error('Unauthorized: Only Superadmin can update salon hours.');
    }

    if (this.supabase.isReady && this.supabase.clientInstance) {
      const dayMap: Record<string, number> = {
        'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
        'thursday': 4, 'friday': 5, 'saturday': 6
      };

      for (const h of hours) {
        const dayInt = dayMap[h.dayOfWeek.toLowerCase()] ?? 1;
        try {
          await this.supabase.clientInstance
            .from('salon_hours')
            .upsert({
              salon_id: this.salonId,
              day_of_week: dayInt,
              open_time: `${h.openTime}:00`,
              close_time: `${h.closeTime}:00`,
              is_closed: h.isClosed
            }, { onConflict: 'salon_id,day_of_week' });
        } catch (err) {
          console.warn('[AdminService] Supabase updateOpeningHours day error:', err);
        }
      }
    }

    this.openingHoursStore.set([...hours]);
    return true;
  }
}
