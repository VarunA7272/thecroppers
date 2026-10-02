import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SalonInfoService } from '../../core/services/salon.service';
import { BookingService } from '../../core/services/booking.service';
import { CategoryWithServices, SalonService } from '../../core/models/service.model';
import { ScrollRevealDirective } from '../../core/directives/scroll-reveal.directive';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [ScrollRevealDirective],
  template: `
    <div class="page-container">
      <!-- Header -->
      <section class="page-header">
        <div class="container text-center" appScrollReveal revealAnimation="fade-up">
          <span class="section-eyebrow">Menu & Pricing</span>
          <h1 class="page-title">Curated Salon Services</h1>
          <p class="page-subtitle">
            All services are provided using premium products, dedicated time allocations, and strict sanitization.
          </p>
        </div>
      </section>

      <!-- Category Filter Tabs / Jump Links -->
      <section class="tabs-section">
        <div class="container">
          <div class="category-tabs" appScrollReveal revealAnimation="fade-in">
            @for (catGroup of categoriesWithServices(); track catGroup.category.id) {
              <a [href]="'#' + catGroup.category.name.toLowerCase()" class="cat-tab-btn">
                {{ catGroup.category.name }}
              </a>
            }
          </div>
        </div>
      </section>

      <!-- Services List Grouped By Category -->
      <section class="section services-content-section">
        <div class="container">
          @if (isLoading()) {
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Loading treatments from Supabase...</p>
            </div>
          } @else if (categoriesWithServices().length === 0) {
            <div class="empty-services-state text-center" style="padding: 48px 24px; background: #faf8f5; border-radius: 8px; border: 1px dashed rgba(181, 136, 64, 0.3); margin: 32px 0;">
              <h3 style="font-size: 1.25rem; color: #1c1917; margin-bottom: 8px;">No Services Listed Yet</h3>
              <p style="color: #78716c; font-size: 0.95rem; margin-bottom: 20px;">Treatments will appear here once added in the Admin Panel.</p>
              <a routerLink="/admin/login" class="btn btn-outline" style="display: inline-block;">Go to Admin Panel</a>
            </div>
          } @else {
            @for (catGroup of categoriesWithServices(); track catGroup.category.id) {
              <div [id]="catGroup.category.name.toLowerCase()" class="category-group-block">
                <div class="cat-header" appScrollReveal revealAnimation="fade-up">
                  <span class="section-eyebrow">{{ catGroup.category.name }} Care</span>
                  <h2 class="cat-title">{{ catGroup.category.name }}</h2>
                  @if (catGroup.category.description) {
                    <p class="cat-desc">{{ catGroup.category.description }}</p>
                  }
                </div>

                @if (catGroup.services.length === 0) {
                  <div style="padding: 24px; background: #faf8f5; border-radius: 8px; border: 1px dashed rgba(181,136,64,0.3); text-align: center; color: #78716c; margin-bottom: 32px;">
                    <p>No treatments added under <strong>{{ catGroup.category.name }}</strong> yet.</p>
                  </div>
                } @else {
                  <div class="services-list-grid">
                    @for (service of catGroup.services; track service.id; let idx = $index) {
                      <div class="croppers-card service-item-card" appScrollReveal revealAnimation="fade-up" [revealDelay]="(idx % 4) * 80">
                        @if (service.image_url) {
                          <div class="service-media-thumb">
                            <img [src]="service.image_url" [alt]="service.name" loading="lazy" />
                          </div>
                        }
                        <div class="service-info-col">
                          <div class="service-title-row">
                            <h3 class="service-title">{{ service.name }}</h3>
                            <div class="service-price-pill">
                              <span class="price-val">₹{{ service.price }}</span>
                            </div>
                          </div>

                          @if (service.description) {
                            <p class="service-description">{{ service.description }}</p>
                          }

                          <div class="service-specs">
                            <span class="spec-pill">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                              </svg>
                              {{ service.duration_minutes }} Minutes
                            </span>
                            <span class="spec-pill spec-dot">Capacity Protected</span>
                          </div>
                        </div>

                        <div class="service-action-col">
                          <button type="button" class="btn btn-primary" (click)="onSelectService(service)">
                            Book Service
                          </button>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          }
        </div>
      </section>

      <!-- Custom Consultation Note -->
      <section class="section custom-note-section">
        <div class="container">
          <div class="croppers-card note-card">
            <div class="note-content">
              <h3>Custom Requests & Group Bookings</h3>
              <p>
                Need specialized colour correction or a group grooming session for weddings? Speak directly with our reception team in Jabalpur.
              </p>
            </div>
            <div class="note-action">
              <a href="tel:+917848827245" class="btn btn-outline">
                Call +91 78488 27245
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styleUrl: './services.component.css'
})
export class ServicesComponent implements OnInit {
  private readonly salonService = inject(SalonInfoService);
  private readonly bookingService = inject(BookingService);
  private readonly router = inject(Router);

  readonly categoriesWithServices = signal<CategoryWithServices[]>([]);
  readonly isLoading = signal<boolean>(true);

  async ngOnInit(): Promise<void> {
    try {
      const data = await this.salonService.getCategoriesWithServices();
      this.categoriesWithServices.set(data);
    } finally {
      this.isLoading.set(false);
    }
  }

  onSelectService(service: SalonService): void {
    this.bookingService.addService(service);
    this.router.navigate(['/book']);
  }
}
