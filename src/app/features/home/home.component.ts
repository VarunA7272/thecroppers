import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { SalonInfoService } from '../../core/services/salon.service';
import { BookingService } from '../../core/services/booking.service';
import { MediaService } from '../../core/services/media.service';
import { SalonService } from '../../core/models/service.model';
import { ScrollRevealDirective } from '../../core/directives/scroll-reveal.directive';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, ScrollRevealDirective],
  template: `
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="ambient-glow-orb hero-glow-1"></div>
      <div class="ambient-glow-orb hero-glow-2"></div>
      <div class="hero-bg-overlay"></div>
      <div class="container hero-container">
        <div class="hero-grid">
          <div class="hero-content">
            <div class="hero-badge" appScrollReveal revealAnimation="fade-up" [revealDelay]="50">
              <span class="badge badge-gold">Jabalpur's Signature Salon</span>
            </div>
            <h1 class="hero-title" appScrollReveal revealAnimation="fade-up" [revealDelay]="120">
              Tailored Elegance.<br>
              <span class="text-gold-gradient">Master Craft.</span>
            </h1>
            <p class="hero-desc" appScrollReveal revealAnimation="fade-up" [revealDelay]="180">
              Welcome to The Croppers in Jabalpur. Experience precision cuts, bespoke beard sculpting, and restorative skin treatments in a refined, tranquil atmosphere.
            </p>
            <div class="hero-actions" appScrollReveal revealAnimation="fade-up" [revealDelay]="240">
              <a routerLink="/book" class="btn btn-primary btn-lg">
                Book Appointment
              </a>
              <a routerLink="/services" class="btn btn-outline btn-lg">
                Explore Services
              </a>
            </div>

            <div class="hero-highlights" appScrollReveal revealAnimation="fade-up" [revealDelay]="300">
              <div class="highlight-item">
                <span class="highlight-val">30-Min</span>
                <span class="highlight-label">Precision Slots</span>
              </div>
              <div class="highlight-divider"></div>
              <div class="highlight-item">
                <span class="highlight-val">100%</span>
                <span class="highlight-label">Hygiene Assured</span>
              </div>
              <div class="highlight-divider"></div>
              <div class="highlight-item">
                <span class="highlight-val">7 Days</span>
                <span class="highlight-label">Open Weekly</span>
              </div>
            </div>
          </div>

          <!-- Hero Image Showcase -->
          <div class="hero-visual-showcase" appScrollReveal revealAnimation="zoom-in" [revealDelay]="200">
            <div class="hero-img-frame">
              <img 
                [src]="mediaService.heroImageUrl()" 
                [alt]="mediaService.heroImageAlt()" 
                class="hero-main-img" 
                loading="eager" />
              <div class="hero-img-badge">
                <span class="badge-dot"></span>
                <span>The Croppers Studio Suite</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Luxury Divider -->
    <div class="luxury-divider" appScrollReveal revealAnimation="fade-in">
      <div class="luxury-divider-icon"></div>
    </div>

    <!-- Why The Croppers -->
    <section class="section why-section">
      <div class="container">
        <div class="section-header" appScrollReveal revealAnimation="fade-up">
          <span class="section-eyebrow">The Standard</span>
          <h2 class="section-title">Why The Croppers</h2>
          <p class="section-subtitle">
            Every session is designed around your personal aesthetic, elevated by pristine hygiene and focused attention.
          </p>
        </div>

        <div class="features-grid">
          <div class="croppers-card feature-card" appScrollReveal revealAnimation="fade-up" [revealDelay]="80">
            <div class="card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="32" height="32">
                <circle cx="6" cy="6" r="3"></circle>
                <circle cx="6" cy="18" r="3"></circle>
                <line x1="20" y1="4" x2="8.12" y2="15.88"></line>
                <line x1="14.47" y1="14.48" x2="20" y2="20"></line>
                <line x1="8.12" y1="8.12" x2="12" y2="12"></line>
              </svg>
            </div>
            <h3 class="feature-title">Artisanal Precision</h3>
            <p class="feature-text">
              From textured tapers to bespoke color chemistry, our stylists work with mathematical proportion and artistic intuition.
            </p>
          </div>

          <div class="croppers-card feature-card" appScrollReveal revealAnimation="fade-up" [revealDelay]="160">
            <div class="card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="32" height="32">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <h3 class="feature-title">Pristine Hygiene</h3>
            <p class="feature-text">
              Hospital-grade sterilization for all tools, single-use linens, and thoroughly sanitized stations for absolute peace of mind.
            </p>
          </div>

          <div class="croppers-card feature-card" appScrollReveal revealAnimation="fade-up" [revealDelay]="240">
            <div class="card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="32" height="32">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <h3 class="feature-title">Seamless Scheduling</h3>
            <p class="feature-text">
              Real-time 30-minute booking capacity. No waiting in crowded waiting areas; your scheduled slot is strictly reserved for you.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Luxury Divider -->
    <div class="luxury-divider" appScrollReveal revealAnimation="fade-in">
      <div class="luxury-divider-icon"></div>
    </div>

    <!-- Featured Services Preview -->
    <section class="section services-preview-section">
      <div class="container">
        <div class="services-header-row" appScrollReveal revealAnimation="fade-up">
          <div>
            <span class="section-eyebrow">Our Treatments</span>
            <h2 class="section-title">Signature Services</h2>
          </div>
          <a routerLink="/services" class="btn btn-outline btn-sm">View All Services</a>
        </div>

        <div class="services-grid">
          @for (service of featuredServices(); track service.id; let idx = $index) {
            <div class="croppers-card service-card" appScrollReveal revealAnimation="fade-up" [revealDelay]="(idx + 1) * 90">
              <div class="service-category-tag">{{ service.category_name || 'Service' }}</div>
              <div class="service-main">
                <h3 class="service-name">{{ service.name }}</h3>
                <p class="service-desc">{{ service.description }}</p>
              </div>
              <div class="service-footer">
                <div class="service-meta">
                  <span class="service-duration">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    {{ service.duration_minutes }} min
                  </span>
                  <span class="service-price">₹{{ service.price }}</span>
                </div>
                <button type="button" class="btn btn-primary btn-sm" (click)="bookThisService(service)">
                  Book Now
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- Gallery Preview with Real Images -->
    <section class="section gallery-preview-section">
      <div class="container">
        <div class="section-header" appScrollReveal revealAnimation="fade-up">
          <span class="section-eyebrow">Aesthetic & Vibe</span>
          <h2 class="section-title">The Atmosphere</h2>
          <p class="section-subtitle">
            A sanctuary designed for comfort, contemporary aesthetics, and revitalizing care.
          </p>
        </div>

        <div class="gallery-preview-grid">
          @for (item of previewGalleryItems(); track item.id; let idx = $index) {
            <div 
              class="gallery-preview-item" 
              [class.item-large]="idx === 0"
              appScrollReveal 
              revealAnimation="fade-up" 
              [revealDelay]="(idx + 1) * 100">
              <div class="gallery-preview-card">
                <img [src]="item.imageUrl" [alt]="item.title" class="gallery-card-img" loading="lazy" />
                <div class="gallery-overlay">
                  <span class="gallery-caption">{{ item.title }}</span>
                  <span class="gallery-subcaption">{{ item.subtitle }}</span>
                </div>
              </div>
            </div>
          }
        </div>

        <div class="gallery-preview-footer" appScrollReveal revealAnimation="fade-up" [revealDelay]="150">
          <a routerLink="/gallery" class="btn btn-outline">Explore Full Gallery</a>
        </div>
      </div>
    </section>

    <!-- About Snippet -->
    <section class="section about-snippet-section">
      <div class="container about-snippet-grid">
        <div class="about-snippet-content">
          <span class="section-eyebrow">Our Story</span>
          <h2 class="section-title">Crafted for Jabalpur</h2>
          <p>
            The Croppers was established with a singular vision: to bring world-class salon expertise, uncompromising cleanliness, and personalized styling to Jabalpur.
          </p>
          <p>
            Whether you are preparing for a milestone occasion or maintaining your everyday sharpness, our craftspeople ensure you leave looking and feeling your finest.
          </p>
          <div class="about-actions">
            <a routerLink="/about" class="btn btn-outline">Read Our Story</a>
          </div>
        </div>

        <div class="about-snippet-visual">
          <div class="about-img-frame">
            <img 
              [src]="mediaService.aboutImageUrl()" 
              [alt]="mediaService.aboutImageAlt()" 
              class="about-snippet-img" 
              loading="lazy" />
          </div>
          <div class="about-snippet-stats">
            <div class="stat-card">
              <span class="stat-num">Asia/Kolkata</span>
              <span class="stat-label">Local Timezone</span>
            </div>
            <div class="stat-card">
              <span class="stat-num">7 Days</span>
              <span class="stat-label">Convenient Weekday & Weekend Hours</span>
            </div>
            <div class="stat-card">
              <span class="stat-num">+91 78488 27245</span>
              <span class="stat-label">Direct Concierge Line</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Final CTA Banner -->
    <section class="final-cta-section">
      <div class="container final-cta-container">
        <div class="final-cta-content">
          <span class="section-eyebrow">Reserve Your Chair</span>
          <h2 class="final-cta-title">Ready for Your Next Look?</h2>
          <p class="final-cta-desc">
            Choose your service, select a preferred date, and secure an instant 30-minute time slot.
          </p>
          <div class="final-cta-btn-wrap">
            <a routerLink="/book" class="btn btn-primary btn-lg">
              Book Appointment Now
            </a>
          </div>
        </div>
      </div>
    </section>
  `,
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  private readonly salonService = inject(SalonInfoService);
  private readonly bookingService = inject(BookingService);
  readonly mediaService = inject(MediaService);
  private readonly router = inject(Router);

  readonly featuredServices = signal<SalonService[]>([]);

  readonly previewGalleryItems = () => this.mediaService.galleryItems().slice(0, 3);

  async ngOnInit(): Promise<void> {
    const all = await this.salonService.getServices();
    // Pick first 4 services as featured
    this.featuredServices.set(all.slice(0, 4));
  }

  bookThisService(service: SalonService): void {
    this.bookingService.selectService(service);
    this.router.navigate(['/book']);
  }
}
