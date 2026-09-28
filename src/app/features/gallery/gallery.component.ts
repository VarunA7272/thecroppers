import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UpperCasePipe } from '@angular/common';
import { MediaService } from '../../core/services/media.service';
import { GalleryImageItem } from '../../core/models/media.model';
import { ScrollRevealDirective } from '../../core/directives/scroll-reveal.directive';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [RouterLink, UpperCasePipe, ScrollRevealDirective],
  template: `
    <div class="page-container">
      <section class="page-header">
        <div class="container text-center" appScrollReveal revealAnimation="fade-up">
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
          <div class="filter-pills" appScrollReveal revealAnimation="fade-in">
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
            @for (item of filteredItems(); track item.id; let idx = $index) {
              <div 
                class="gallery-card" 
                [class]="item.aspectClass"
                appScrollReveal 
                revealAnimation="fade-up" 
                [revealDelay]="(idx % 6) * 80">
                <div class="card-visual">
                  <img [src]="item.imageUrl" [alt]="item.title" class="gallery-img" loading="lazy" />
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
  private readonly mediaService = inject(MediaService);
  readonly selectedCategory = signal<string>('all');

  readonly filteredItems = computed(() => {
    const cat = this.selectedCategory();
    const all = this.mediaService.galleryItems();
    if (cat === 'all') return all;
    return all.filter(item => item.category === cat);
  });

  setCategory(cat: string): void {
    this.selectedCategory.set(cat);
  }
}
