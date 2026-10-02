import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Salon, SalonOpeningHour } from '../models/salon.model';
import { SalonService, ServiceCategory, CategoryWithServices } from '../models/service.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SalonInfoService {
  private readonly supabase = inject(SupabaseService);

  readonly salonId = environment.salonId;

  readonly openingHours: SalonOpeningHour[] = [
    { dayOfWeek: 'Sunday', openTime: '10:00', closeTime: '18:00', isClosed: false },
    { dayOfWeek: 'Monday', openTime: '10:00', closeTime: '20:00', isClosed: false },
    { dayOfWeek: 'Tuesday', openTime: '10:00', closeTime: '20:00', isClosed: false },
    { dayOfWeek: 'Wednesday', openTime: '10:00', closeTime: '20:00', isClosed: false },
    { dayOfWeek: 'Thursday', openTime: '10:00', closeTime: '20:00', isClosed: false },
    { dayOfWeek: 'Friday', openTime: '10:00', closeTime: '20:00', isClosed: false },
    { dayOfWeek: 'Saturday', openTime: '10:00', closeTime: '21:00', isClosed: false }
  ];

  readonly salonInfo: Salon = {
    id: environment.salonId,
    name: environment.salonName,
    phone: environment.salonPhone,
    city: 'Jabalpur',
    state: 'Madhya Pradesh',
    country: 'India',
    timezone: environment.timezone,
    currency: environment.currency,
    openingHours: this.openingHours
  };

  /**
   * Fallback empty structures when offline
   */
  private readonly fallbackCategories: ServiceCategory[] = [];
  private readonly fallbackServices: SalonService[] = [];

  /**
   * Fetches active services from Supabase.
   * If live credentials are valid, queries public.services.
   * Gracefully falls back if Supabase is offline or not configured yet.
   */
  async getServices(): Promise<SalonService[]> {
    if (this.supabase.isReady && this.supabase.clientInstance) {
      try {
        const [servicesRes, categoriesRes] = await Promise.all([
          this.supabase.clientInstance
            .from('services')
            .select('*')
            .eq('salon_id', this.salonId)
            .neq('is_active', false),
          this.supabase.clientInstance
            .from('service_categories')
            .select('id, name')
            .eq('salon_id', this.salonId)
        ]);

        const catMap = new Map<string, string>();
        if (!categoriesRes.error && categoriesRes.data) {
          categoriesRes.data.forEach((c: any) => catMap.set(c.id, c.name));
        }

        if (!servicesRes.error && servicesRes.data && servicesRes.data.length > 0) {
          return servicesRes.data.map((item: any) => ({
            id: item.id,
            salon_id: item.salon_id,
            category_id: item.category_id,
            category_name: (item.category_id ? catMap.get(item.category_id) : null) || item.category_name || 'General',
            name: item.name,
            description: item.description,
            duration_minutes: item.duration_minutes,
            price: Number(item.price),
            image_url: item.image_url,
            is_active: item.is_active ?? true
          }));
        }
      } catch (err) {
        console.warn('[SalonInfoService] Error querying Supabase services:', err);
      }
    }
    return this.fallbackServices;
  }

  /**
   * Fetches service categories and their associated services
   */
  async getCategoriesWithServices(): Promise<CategoryWithServices[]> {
    const services = await this.getServices();

    let categories: ServiceCategory[] = [];

    if (this.supabase.isReady && this.supabase.clientInstance) {
      try {
        const { data, error } = await this.supabase.clientInstance
          .from('service_categories')
          .select('*')
          .eq('salon_id', this.salonId)
          .order('display_order', { ascending: true });

        if (!error && data && data.length > 0) {
          categories = data;
        }
      } catch (err) {
        console.warn('[SalonInfoService] Error querying Supabase categories:', err);
      }
    }

    // If no categories in DB but services exist, group dynamically
    if (categories.length === 0 && services.length > 0) {
      const uniqueCats = Array.from(new Set(services.map(s => s.category_name || 'General')));
      categories = uniqueCats.map((catName, idx) => ({
        id: `cat-${idx + 1}`,
        salon_id: this.salonId,
        name: catName,
        display_order: idx + 1,
        is_active: true
      }));
    }

    return categories.map(cat => ({
      category: cat,
      services: services.filter(s => s.category_id === cat.id || (s.category_name && cat.name && s.category_name.toLowerCase() === cat.name.toLowerCase()))
    }));
  }
}
