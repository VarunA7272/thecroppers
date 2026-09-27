import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="site-footer">
      <div class="container footer-grid">
        <!-- Col 1: Brand & Philosophy -->
        <div class="footer-col brand-col">
          <div class="footer-logo">
            <span class="logo-mark">TC</span>
            <div class="logo-text">
              <span class="title">THE CROPPERS</span>
              <span class="subtitle">Jabalpur's Premier Salon</span>
            </div>
          </div>
          <p class="brand-desc">
            Modern grooming and bespoke hair styling tailored to individual distinction. Experiential luxury, precision craft, and thoughtful care in Jabalpur.
          </p>
          <div class="salon-contact-pills">
            <a href="tel:+917848827245" class="contact-pill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              <span>+91 78488 27245</span>
            </a>
          </div>
        </div>

        <!-- Col 2: Navigation Links -->
        <div class="footer-col links-col">
          <h4 class="col-title">Explore</h4>
          <ul class="footer-links">
            <li><a routerLink="/">Home</a></li>
            <li><a routerLink="/about">About Us</a></li>
            <li><a routerLink="/services">Services & Pricing</a></li>
            <li><a routerLink="/gallery">Lookbook Gallery</a></li>
            <li><a routerLink="/contact">Location & Contact</a></li>
            <li><a routerLink="/book" class="highlight-link">Book Appointment</a></li>
          </ul>
        </div>

        <!-- Col 3: Salon Hours -->
        <div class="footer-col hours-col">
          <h4 class="col-title">Opening Hours</h4>
          <div class="hours-list">
            <div class="hours-row">
              <span class="day">Sunday</span>
              <span class="time">10:00 AM – 6:00 PM</span>
            </div>
            <div class="hours-row">
              <span class="day">Monday – Friday</span>
              <span class="time">10:00 AM – 8:00 PM</span>
            </div>
            <div class="hours-row highlight-row">
              <span class="day">Saturday</span>
              <span class="time">10:00 AM – 9:00 PM</span>
            </div>
          </div>
          <p class="hours-note">
            Walk-ins welcome based on slot capacity. Advance booking recommended.
          </p>
        </div>

        <!-- Col 4: Location -->
        <div class="footer-col location-col">
          <h4 class="col-title">Location</h4>
          <address class="salon-address">
            <strong>The Croppers Salon</strong><br>
            Jabalpur, Madhya Pradesh<br>
            India
          </address>
          <div class="footer-cta">
            <a routerLink="/book" class="btn btn-outline btn-sm">
              Schedule Your Visit
            </a>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <div class="container bottom-content">
          <p>© 2026 The Croppers. All rights reserved. Jabalpur, MP, India.</p>
          <div class="bottom-links">
            <span class="privacy-note">Dedicated to premium customer hair, beard & skin care.</span>
            <span class="dot-separator">•</span>
            <a routerLink="/admin/login" class="staff-portal-link">Staff Portal</a>
          </div>
        </div>
      </div>
    </footer>
  `,
  styleUrl: './footer.component.css'
})
export class FooterComponent {}
