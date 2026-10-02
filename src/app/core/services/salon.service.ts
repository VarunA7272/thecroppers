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
        const { data, error } = await this.supabase.clientInstance
          .from('services')
          .select('*, service_categories(name)')
          .eq('salon_id', this.salonId)
          .eq('is_active', true);

        if (!error && data && data.length > 0) {
          return data.map((item: any) => ({
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
        }
      } catch (err) {
        console.warn('[SalonInfoService] Error querying Supabase services, using local catalogue:', err);
      }
    }
    return this.fallbackServices;
  }

  /**
   * Fetches service categories and their associated services
   */
  async getCategoriesWithServices(): Promise<CategoryWithServices[]> {
    const services = await this.getServices();

    let categories = this.fallbackCategories;

    if (this.supabase.isReady && this.supabase.clientInstance) {
      try {
        const { data, error } = await this.supabase.clientInstance
          .from('service_categories')
          .select('*')
          .order('display_order', { ascending: true });

        if (!error && data && data.length > 0) {
          categories = data;
        }
      } catch (err) {
        console.warn('[SalonInfoService] Error querying Supabase categories:', err);
      }
    }

    return categories.map(cat => ({
      category: cat,
      services: services.filter(s => s.category_id === cat.id || s.category_name?.toLowerCase() === cat.name.toLowerCase())
    })).filter(group => group.services.length > 0);
  }
}
