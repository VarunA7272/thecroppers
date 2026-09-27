import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminService } from '../services/admin.service';

export const adminAuthGuard: CanActivateFn = () => {
  const adminService = inject(AdminService);
  const router = inject(Router);

  if (adminService.isAuthenticated()) {
    return true;
  }

  // Redirect to login if unauthenticated
  router.navigate(['/admin/login']);
  return false;
};
