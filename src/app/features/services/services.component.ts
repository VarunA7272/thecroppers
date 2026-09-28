import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SalonInfoService } from '../../core/services/salon.service';
import { BookingService } from '../../core/services/booking.service';
import { CategoryWithServices, SalonService } from '../../core/models/service.model';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [],
  template: `
    <div class="page-container">
      <!-- Header -->
      <section class="page-header">
        <div class="container text-center">
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
          <div class="category-tabs">
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
          } @else {
            @for (catGroup of categoriesWithServices(); track catGroup.category.id) {
              <div [id]="catGroup.category.name.toLowerCase()" class="category-group-block">
                <div class="cat-header">
                  <span class="section-eyebrow">{{ catGroup.category.name }} Care</span>
                  <h2 class="cat-title">{{ catGroup.category.name }}</h2>
                  @if (catGroup.category.description) {
                    <p class="cat-desc">{{ catGroup.category.description }}</p>
                  }
                </div>

                <div class="services-list-grid">
                  @for (service of catGroup.services; track service.id) {
                    <div class="croppers-card service-item-card">
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
    this.bookingService.selectService(service);
    this.router.navigate(['/book']);
  }
}
