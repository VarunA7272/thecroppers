import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="site-header">
      <div class="container header-container">
        <a routerLink="/" class="brand-logo" (click)="closeMobileMenu()">
          <span class="logo-mark">TC</span>
          <div class="logo-text-group">
            <span class="logo-title">THE CROPPERS</span>
            <span class="logo-subtitle">Jabalpur Salon</span>
          </div>
        </a>

        <!-- Desktop Navigation -->
        <nav class="desktop-nav" aria-label="Main Navigation">
          <ul class="nav-links">
            <li><a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Home</a></li>
            <li><a routerLink="/about" routerLinkActive="active">About</a></li>
            <li><a routerLink="/services" routerLinkActive="active">Services</a></li>
            <li><a routerLink="/gallery" routerLinkActive="active">Gallery</a></li>
            <li><a routerLink="/contact" routerLinkActive="active">Contact</a></li>
          </ul>
        </nav>

        <div class="header-actions">
          <a routerLink="/book" class="btn btn-primary nav-book-btn">
            <svg class="calendar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>Book Now</span>
          </a>

          <!-- Mobile Hamburger Toggle -->
          <button 
            type="button" 
            class="hamburger-btn" 
            [class.open]="isMobileMenuOpen()" 
            (click)="toggleMobileMenu()" 
            aria-label="Toggle navigation menu"
            [attr.aria-expanded]="isMobileMenuOpen()">
            <span class="bar"></span>
            <span class="bar"></span>
            <span class="bar"></span>
          </button>
        </div>
      </div>

      <!-- Mobile Navigation Drawer -->
      <div class="mobile-drawer" [class.open]="isMobileMenuOpen()">
        <nav class="mobile-nav" aria-label="Mobile Navigation">
          <ul class="mobile-links">
            <li><a routerLink="/" (click)="closeMobileMenu()" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Home</a></li>
            <li><a routerLink="/about" (click)="closeMobileMenu()" routerLinkActive="active">About</a></li>
            <li><a routerLink="/services" (click)="closeMobileMenu()" routerLinkActive="active">Services</a></li>
            <li><a routerLink="/gallery" (click)="closeMobileMenu()" routerLinkActive="active">Gallery</a></li>
            <li><a routerLink="/contact" (click)="closeMobileMenu()" routerLinkActive="active">Contact</a></li>
          </ul>
          <div class="mobile-drawer-cta">
            <a routerLink="/book" (click)="closeMobileMenu()" class="btn btn-primary btn-block">
              Book Appointment
            </a>
            <a href="tel:+917848827245" class="mobile-phone-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              +91 78488 27245
            </a>
          </div>
        </nav>
      </div>
    </header>
  `,
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  readonly isMobileMenuOpen = signal<boolean>(false);

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }
}
