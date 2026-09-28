import { Routes } from '@angular/router';
import { adminAuthGuard } from './core/guards/admin-auth.guard';
import { superadminGuard } from './core/guards/superadmin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
    title: 'The Croppers | Premier Salon in Jabalpur'
  },
  {
    path: 'about',
    loadComponent: () => import('./features/about/about.component').then(m => m.AboutComponent),
    title: 'About Us | The Croppers Jabalpur'
  },
  {
    path: 'services',
    loadComponent: () => import('./features/services/services.component').then(m => m.ServicesComponent),
    title: 'Services & Pricing | The Croppers Salon'
  },
  {
    path: 'gallery',
    loadComponent: () => import('./features/gallery/gallery.component').then(m => m.GalleryComponent),
    title: 'Lookbook Gallery | The Croppers Salon'
  },
  {
    path: 'contact',
    loadComponent: () => import('./features/contact/contact.component').then(m => m.ContactComponent),
    title: 'Contact & Location | The Croppers Salon'
  },
  {
    path: 'book',
    loadComponent: () => import('./features/booking/booking.component').then(m => m.BookingComponent),
    title: 'Book Appointment | The Croppers Salon'
  },
  // Admin Portal Routes
  {
    path: 'admin/login',
    loadComponent: () => import('./features/admin/login/admin-login.component').then(m => m.AdminLoginComponent),
    title: 'Portal Login | The Croppers Admin'
  },
  {
    path: 'admin',
    canActivate: [adminAuthGuard],
    loadComponent: () => import('./features/admin/layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
        title: 'Dashboard | The Croppers Admin'
      },
      {
        path: 'appointments',
        loadComponent: () => import('./features/admin/appointments/admin-appointments.component').then(m => m.AdminAppointmentsComponent),
        title: 'Manage Appointments | The Croppers Admin'
      },
      // Superadmin Only Routes
      {
        path: 'services',
        canActivate: [superadminGuard],
        loadComponent: () => import('./features/admin/services/admin-services.component').then(m => m.AdminServicesComponent),
        title: 'Services & Pricing | The Croppers Admin'
      },
      {
        path: 'staff',
        canActivate: [superadminGuard],
        loadComponent: () => import('./features/admin/staff/admin-staff.component').then(m => m.AdminStaffComponent),
        title: 'Staff Roster | The Croppers Admin'
      },
      {
        path: 'export',
        canActivate: [superadminGuard],
        loadComponent: () => import('./features/admin/export/admin-export.component').then(m => m.AdminExportComponent),
        title: 'Reports & Exports | The Croppers Admin'
      },
      {
        path: 'media',
        canActivate: [superadminGuard],
        loadComponent: () => import('./features/admin/media/admin-media.component').then(m => m.AdminMediaComponent),
        title: 'Media & Gallery | The Croppers Admin'
      },
      {
        path: 'settings',
        canActivate: [superadminGuard],
        loadComponent: () => import('./features/admin/settings/admin-settings.component').then(m => m.AdminSettingsComponent),
        title: 'Salon Settings | The Croppers Admin'
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
