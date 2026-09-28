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
   * Fallback services matching initial database seed
   */
  private readonly fallbackCategories: ServiceCategory[] = [
    { id: 'cat-hair', name: 'Hair', description: 'Precision styling, contemporary cutting, and conditioning care', display_order: 1 },
    { id: 'cat-beard', name: 'Beard', description: 'Master grooming, hot towel razor shaves, and line detailing', display_order: 2 },
    { id: 'cat-skin', name: 'Skin', description: 'Rejuvenating therapies, deep hydration, and revitalizing treatments', display_order: 3 }
  ];

  private readonly fallbackServices: SalonService[] = [
    {
      id: 'srv-haircut',
      salon_id: environment.salonId,
      category_id: 'cat-hair',
      category_name: 'Hair',
      name: 'Haircut',
      description: 'Signature tailored haircut crafted to your facial architecture with neck shave and hot lather rinse.',
      duration_minutes: 30,
      price: 200,
      image_url: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=600&q=80',
      is_active: true
    },
    {
      id: 'srv-hair-colour',
      salon_id: environment.salonId,
      category_id: 'cat-hair',
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
      category_id: 'cat-hair',
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
      category_id: 'cat-beard',
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
      category_id: 'cat-beard',
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
      category_id: 'cat-skin',
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
      category_id: 'cat-skin',
      category_name: 'Skin',
      name: 'Cleanup',
      description: 'Fast-action pore clarifying cleanse, gentle scrub exfoliation, and cooling botanical mask.',
      duration_minutes: 45,
      price: 400,
      image_url: 'https://images.unsplash.com/photo-1512290900672-1f41e57c6b96?auto=format&fit=crop&w=600&q=80',
      is_active: true
    }
  ];

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
