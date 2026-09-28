export interface ServiceCategory {
  id: string;
  salon_id?: string;
  name: string;
  description?: string | null;
  display_order?: number;
}

export interface SalonService {
  id: string;
  salon_id: string;
  category_id?: string | null;
  category_name?: string;
  name: string;
  description?: string | null;
  duration_minutes: number;
  price: number;
  image_url?: string | null;
  is_active?: boolean;
}

export interface CategoryWithServices {
  category: ServiceCategory;
  services: SalonService[];
}
