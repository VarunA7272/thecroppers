import { Component, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HeaderComponent } from './shared/components/header/header.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { AdminService } from './core/services/admin.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly router = inject(Router);
  readonly adminService = inject(AdminService);
  private readonly destroyRef = inject(DestroyRef);

  readonly currentUrl = signal<string>(this.getInitialUrl());

  readonly isAdminRoute = computed(() => {
    const url = this.currentUrl();
    return url.startsWith('/admin');
  });

  readonly isStaffOrAdminLoggedIn = computed(() => {
    return this.adminService.isAuthenticated();
  });

  /**
   * Header and footer are hidden when logged in as admin/staff
   * or when navigating inside the /admin portal sections.
   */
  readonly showHeaderFooterSignal = computed(() => {
    return !this.isAdminRoute() && !this.isStaffOrAdminLoggedIn();
  });

  get showAppHeaderFooter(): boolean {
    return this.showHeaderFooterSignal();
  }

  get showHeaderFooter(): boolean {
    return this.showHeaderFooterSignal();
  }

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((e: NavigationEnd) => {
        this.currentUrl.set(e.urlAfterRedirects || e.url);
      });
  }

  private getInitialUrl(): string {
    return this.router.url || '';
  }
}


