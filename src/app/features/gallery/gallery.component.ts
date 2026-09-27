import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UpperCasePipe } from '@angular/common';

interface GalleryItem {
  id: string;
  title: string;
  category: 'hair' | 'beard' | 'interior' | 'spa';
  subtitle: string;
  aspectClass: string;
  bgGradient: string;
}

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [RouterLink, UpperCasePipe],
  template: `
    <div class="page-container">
      <section class="page-header">
        <div class="container text-center">
          <span class="section-eyebrow">Visual Lookbook</span>
          <h1 class="page-title">The Gallery</h1>
          <p class="page-subtitle">
            An inside look into precision grooming craft, peaceful treatment suites, and salon artistry at The Croppers.
          </p>
        </div>
      </section>

      <!-- Category Filter -->
      <section class="gallery-filter-section">
        <div class="container">
          <div class="filter-pills">
            <button 
              type="button" 
              class="filter-pill" 
              [class.active]="selectedCategory() === 'all'" 
              (click)="setCategory('all')">
              All Works
            </button>
            <button 
              type="button" 
              class="filter-pill" 
              [class.active]="selectedCategory() === 'hair'" 
              (click)="setCategory('hair')">
              Hair Styling
            </button>
            <button 
              type="button" 
              class="filter-pill" 
              [class.active]="selectedCategory() === 'beard'" 
              (click)="setCategory('beard')">
              Beard Craft
            </button>
            <button 
              type="button" 
              class="filter-pill" 
              [class.active]="selectedCategory() === 'interior'" 
              (click)="setCategory('interior')">
              Salon Space
            </button>
            <button 
              type="button" 
              class="filter-pill" 
              [class.active]="selectedCategory() === 'spa'" 
              (click)="setCategory('spa')">
              Scalp & Spa
            </button>
          </div>
        </div>
      </section>

      <!-- Gallery Grid -->
      <section class="section gallery-grid-section">
        <div class="container">
          <div class="masonry-grid">
            @for (item of filteredItems(); track item.id) {
              <div class="gallery-card" [class]="item.aspectClass">
                <div class="card-visual" [style.background]="item.bgGradient">
                  <div class="artistic-motif">
                    <span class="motif-tag">{{ item.category | uppercase }}</span>
                  </div>
                  <div class="card-overlay">
                    <span class="item-subtitle">{{ item.subtitle }}</span>
                    <h3 class="item-title">{{ item.title }}</h3>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="section text-center">
        <div class="container">
          <p class="section-eyebrow">Experience It Yourself</p>
          <h2 class="section-title">Step Into The Chair</h2>
          <div style="margin-top: 24px;">
            <a routerLink="/book" class="btn btn-primary btn-lg">Reserve An Appointment</a>
          </div>
        </div>
      </section>
    </div>
  `,
  styleUrl: './gallery.component.css'
})
export class GalleryComponent {
  readonly selectedCategory = signal<string>('all');

  readonly items: GalleryItem[] = [
    {
      id: 'g1',
      title: 'Architectural Fade & Textured Top',
      category: 'hair',
      subtitle: 'Precision Scissor Work',
      aspectClass: 'tall',
      bgGradient: 'linear-gradient(145deg, #1f1d24 0%, #111014 100%)'
    },
    {
      id: 'g2',
      title: 'Signature Leather Barbershop Chairs',
      category: 'interior',
      subtitle: 'Jabalpur Studio Suite',
      aspectClass: 'normal',
      bgGradient: 'linear-gradient(145deg, #24201d 0%, #141210 100%)'
    },
    {
      id: 'g3',
      title: 'Sculpted Beard Line & Fade',
      category: 'beard',
      subtitle: 'Hot Towel Detailing',
      aspectClass: 'normal',
      bgGradient: 'linear-gradient(145deg, #1d2124 0%, #101214 100%)'
    },
    {
      id: 'g4',
      title: 'Chromatic Dimensional Tones',
      category: 'hair',
      subtitle: 'Ammonia-free Formulation',
      aspectClass: 'normal',
      bgGradient: 'linear-gradient(145deg, #251d20 0%, #151012 100%)'
    },
    {
      id: 'g5',
      title: 'Scalp Massage & Steam Suite',
      category: 'spa',
      subtitle: 'Restorative Care',
      aspectClass: 'tall',
      bgGradient: 'linear-gradient(145deg, #1a221f 0%, #0e1412 100%)'
    },
    {
      id: 'g6',
      title: 'Minimalist Consultation Lounge',
      category: 'interior',
      subtitle: 'Warm Hospitality',
      aspectClass: 'normal',
      bgGradient: 'linear-gradient(145deg, #201e1a 0%, #13120f 100%)'
    }
  ];

  readonly filteredItems = computed(() => {
    const cat = this.selectedCategory();
    if (cat === 'all') return this.items;
    return this.items.filter(item => item.category === cat);
  });

  setCategory(cat: string): void {
    this.selectedCategory.set(cat);
  }
}
