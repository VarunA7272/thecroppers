import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SalonInfoService } from '../../core/services/salon.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page-container">
      <section class="page-header">
        <div class="container text-center">
          <span class="section-eyebrow">Connect & Visit</span>
          <h1 class="page-title">Location & Contact</h1>
          <p class="page-subtitle">
            Visit our studio in Jabalpur, Madhya Pradesh or reach out directly for inquiries and appointments.
          </p>
        </div>
      </section>

      <section class="section contact-section">
        <div class="container">
          <div class="contact-grid">
            <!-- Left Info Card -->
            <div class="contact-info-col">
              <div class="croppers-card info-card">
                <span class="section-eyebrow">Our Details</span>
                <h2 class="salon-name-heading">The Croppers</h2>
                <p class="salon-city-tag">Jabalpur, Madhya Pradesh, India</p>

                <div class="contact-method-group">
                  <div class="contact-item">
                    <div class="item-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                      </svg>
                    </div>
                    <div class="item-content">
                      <span class="item-label">Telephone</span>
                      <a href="tel:+917848827245" class="item-link phone-highlight">+91 78488 27245</a>
                      <span class="item-sub">Direct Salon Desk & WhatsApp</span>
                    </div>
                  </div>

                  <div class="contact-item">
                    <div class="item-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                    </div>
                    <div class="item-content">
                      <span class="item-label">Address</span>
                      <p class="address-text">
                        The Croppers Salon<br>
                        Jabalpur, Madhya Pradesh, India
                      </p>
                    </div>
                  </div>

                  <div class="contact-item">
                    <div class="item-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                    </div>
                    <div class="item-content">
                      <span class="item-label">Timezone</span>
                      <p class="address-text">Asia/Kolkata (IST)</p>
                    </div>
                  </div>
                </div>

                <div class="quick-cta-box">
                  <a routerLink="/book" class="btn btn-primary btn-block">
                    Book An Appointment Online
                  </a>
                  <a href="tel:+917848827245" class="btn btn-outline btn-block">
                    Call Concierge Now
                  </a>
                </div>
              </div>
            </div>

            <!-- Right: Hours & Map -->
            <div class="contact-hours-col">
              <div class="croppers-card hours-card">
                <span class="section-eyebrow">Operating Schedule</span>
                <h3 class="card-title">Salon Opening Hours</h3>
                <p class="hours-sub">Configured in local Indian Standard Time (IST).</p>

                <div class="schedule-table">
                  @for (hour of salonService.openingHours; track hour.dayOfWeek) {
                    <div class="schedule-row" [class.saturday]="hour.dayOfWeek === 'Saturday'" [class.sunday]="hour.dayOfWeek === 'Sunday'">
                      <span class="day-name">{{ hour.dayOfWeek }}</span>
                      <span class="time-window">{{ hour.openTime }} – {{ hour.closeTime }}</span>
                    </div>
                  }
                </div>

                <div class="walkin-notice">
                  <span class="badge badge-gold">Tip</span>
                  <span>Appointments take booking priority. Walk-ins are served based on open 30-min grid slots.</span>
                </div>
              </div>

              <!-- Map Placeholder -->
              <div class="croppers-card map-card">
                <div class="map-placeholder">
                  <div class="map-inner">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="40" height="40" class="map-pin-icon">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <h4>The Croppers Jabalpur</h4>
                    <p>Jabalpur, Madhya Pradesh, India</p>
                    <a 
                      href="https://maps.google.com/?q=The+Croppers+Jabalpur+Madhya+Pradesh" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      class="btn btn-outline btn-sm">
                      Open in Google Maps
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styleUrl: './contact.component.css'
})
export class ContactComponent {
  readonly salonService = inject(SalonInfoService);
}
