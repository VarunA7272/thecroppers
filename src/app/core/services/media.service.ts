import { Injectable, signal, computed } from '@angular/core';
import { GalleryImageItem, WebsiteMediaConfig } from '../models/media.model';

const STORAGE_KEY = 'the_croppers_media_config';

const DEFAULT_MEDIA_CONFIG: WebsiteMediaConfig = {
  heroImageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80',
  heroImageAlt: 'The Croppers Luxury Barbershop & Salon Interior in Jabalpur',
  aboutImageUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1000&q=80',
  aboutImageAlt: 'Master Stylist Craftsmanship at The Croppers Salon',
  galleryItems: [
    {
      id: 'g1',
      title: 'Architectural Fade & Textured Top',
      category: 'hair',
      subtitle: 'Precision Scissor Work',
      imageUrl: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=800&q=80',
      aspectClass: 'tall'
    },
    {
      id: 'g2',
      title: 'Signature Leather Barbershop Chairs',
      category: 'interior',
      subtitle: 'Jabalpur Studio Suite',
      imageUrl: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=800&q=80',
      aspectClass: 'normal'
    },
    {
      id: 'g3',
      title: 'Sculpted Beard Line & Fade',
      category: 'beard',
      subtitle: 'Hot Towel Detailing',
      imageUrl: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=800&q=80',
      aspectClass: 'normal'
    },
    {
      id: 'g4',
      title: 'Chromatic Dimensional Tones',
      category: 'hair',
      subtitle: 'Ammonia-free Formulation',
      imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
      aspectClass: 'normal'
    },
    {
      id: 'g5',
      title: 'Botanical Hair & Scalp Therapy',
      category: 'spa',
      subtitle: 'Ayurvedic & Essential Oils',
      imageUrl: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=800&q=80',
      aspectClass: 'tall'
    },
    {
      id: 'g6',
      title: 'Classic Razor Finish & Detailing',
      category: 'beard',
      subtitle: 'Artisan Grooming Craft',
      imageUrl: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=800&q=80',
      aspectClass: 'normal'
    }
  ]
};

@Injectable({
  providedIn: 'root'
})
export class MediaService {
  private readonly configState = signal<WebsiteMediaConfig>(this.loadInitialConfig());

  // Public readonly signals
  readonly config = this.configState.asReadonly();
  readonly heroImageUrl = computed(() => this.configState().heroImageUrl);
  readonly heroImageAlt = computed(() => this.configState().heroImageAlt);
  readonly aboutImageUrl = computed(() => this.configState().aboutImageUrl);
  readonly aboutImageAlt = computed(() => this.configState().aboutImageAlt);
  readonly galleryItems = computed(() => this.configState().galleryItems);

  private loadInitialConfig(): WebsiteMediaConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.heroImageUrl && Array.isArray(parsed.galleryItems)) {
          return parsed;
        }
      }
    } catch {
      // LocalStorage unavailable/disabled
    }
    return DEFAULT_MEDIA_CONFIG;
  }

  private saveConfig(config: WebsiteMediaConfig): void {
    this.configState.set(config);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      // Storage full or quota exceeded
    }
  }

  updateHeroBanner(url: string, alt: string): void {
    const current = this.configState();
    this.saveConfig({
      ...current,
      heroImageUrl: url.trim() || DEFAULT_MEDIA_CONFIG.heroImageUrl,
      heroImageAlt: alt.trim() || DEFAULT_MEDIA_CONFIG.heroImageAlt
    });
  }

  updateAboutImage(url: string, alt: string): void {
    const current = this.configState();
    this.saveConfig({
      ...current,
      aboutImageUrl: url.trim() || DEFAULT_MEDIA_CONFIG.aboutImageUrl,
      aboutImageAlt: alt.trim() || DEFAULT_MEDIA_CONFIG.aboutImageAlt
    });
  }

  addGalleryItem(item: Omit<GalleryImageItem, 'id'>): GalleryImageItem {
    const current = this.configState();
    const newItem: GalleryImageItem = {
      ...item,
      id: 'g_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5)
    };
    this.saveConfig({
      ...current,
      galleryItems: [newItem, ...current.galleryItems]
    });
    return newItem;
  }

  updateGalleryItem(updatedItem: GalleryImageItem): void {
    const current = this.configState();
    const items = current.galleryItems.map(item => 
      item.id === updatedItem.id ? { ...updatedItem } : item
    );
    this.saveConfig({
      ...current,
      galleryItems: items
    });
  }

  deleteGalleryItem(id: string): void {
    const current = this.configState();
    this.saveConfig({
      ...current,
      galleryItems: current.galleryItems.filter(item => item.id !== id)
    });
  }

  resetDefaults(): void {
    this.saveConfig(DEFAULT_MEDIA_CONFIG);
  }
}
