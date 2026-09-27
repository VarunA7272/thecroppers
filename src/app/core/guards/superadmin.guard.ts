import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminService } from '../services/admin.service';

export const superadminGuard: CanActivateFn = () => {
  const adminService = inject(AdminService);
  const router = inject(Router);

  if (adminService.isAuthenticated() && adminService.isSuperadmin()) {
    return true;
  }

  // If authenticated as staff, redirect to appointments view
  if (adminService.isAuthenticated()) {
    router.navigate(['/admin/appointments']);
    return false;
  }

  // If unauthenticated, redirect to login
  router.navigate(['/admin/login']);
  return false;
};
