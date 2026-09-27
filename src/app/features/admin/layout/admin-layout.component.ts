import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="admin-wrapper">
      <!-- Admin Top Bar -->
      <header class="admin-nav-bar">
        <div class="container admin-nav-container">
          <div class="admin-brand-group">
            <span class="admin-badge" [class.staff-badge]="adminService.isStaff()">
              {{ adminService.isSuperadmin() ? 'SUPERADMIN' : 'STAFF' }}
            </span>
            <div class="admin-title">
              <strong>The Croppers</strong> Jabalpur
            </div>
          </div>

          <!-- Dynamic Role-Based Navigation Links -->
          <nav class="admin-links">
            <a routerLink="/admin/dashboard" routerLinkActive="active">Dashboard</a>
            <a routerLink="/admin/appointments" routerLinkActive="active">Appointments</a>
            
            <!-- Superadmin Only Tabs -->
            @if (adminService.isSuperadmin()) {
              <a routerLink="/admin/services" routerLinkActive="active">Services & Pricing</a>
              <a routerLink="/admin/staff" routerLinkActive="active">Staff Roster</a>
              <a routerLink="/admin/export" routerLinkActive="active">Reports & Exports</a>
              <a routerLink="/admin/settings" routerLinkActive="active">Salon Settings</a>
            }
          </nav>

          <div class="admin-user-group">
            <div class="admin-user-info">
              <span class="user-name">{{ adminService.currentUser()?.name || 'Administrator' }}</span>
              <span class="user-role">{{ adminService.isSuperadmin() ? 'Superadmin (Full Access)' : 'Stylist / Staff' }}</span>
            </div>
            <button type="button" class="btn btn-outline btn-sm logout-btn" (click)="onLogout()">
              Sign Out
            </button>
            <a routerLink="/" class="btn btn-ghost btn-sm site-link" title="View Public Salon Website">
              Public Site ↗
            </a>
          </div>
        </div>
      </header>

      <!-- Admin View Container -->
      <main class="admin-content-area">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent {
  readonly adminService = inject(AdminService);
  private readonly router = inject(Router);

  async onLogout(): Promise<void> {
    await this.adminService.logout();
    this.router.navigate(['/admin/login']);
  }
}
