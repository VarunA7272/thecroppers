import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { AdminRole } from '../../../core/models/admin.model';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="admin-login-wrapper">
      <div class="login-card croppers-card">
        <div class="login-header">
          <div class="admin-mark">TC</div>
          <h1 class="login-title">The Croppers</h1>
          <span class="login-subtitle">Internal Portal Authentication</span>
          <p class="login-desc">Sign in with your salon role credentials to manage operations.</p>
        </div>

        <!-- Role Select Tabs -->
        <div class="role-selector-tabs">
          <button 
            type="button" 
            class="role-tab" 
            [class.active]="selectedRole() === 'superadmin'" 
            (click)="setRole('superadmin')">
            <span class="role-title">Superadmin</span>
            <span class="role-sub">Owner / Full CRUD</span>
          </button>
          <button 
            type="button" 
            class="role-tab" 
            [class.active]="selectedRole() === 'staff'" 
            (click)="setRole('staff')">
            <span class="role-title">Staff Stylist</span>
            <span class="role-sub">Floor Operations</span>
          </button>
        </div>

        @if (errorMessage()) {
          <div class="croppers-alert alert-danger">
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-group">
            <label class="form-label" for="adminEmail">
              {{ selectedRole() === 'superadmin' ? 'Superadmin Email' : 'Staff Email' }}
            </label>
            <input 
              type="email" 
              id="adminEmail" 
              formControlName="email" 
              class="form-control" 
              placeholder="e.g. manager@thecroppers.in">
          </div>

          <div class="form-group">
            <label class="form-label" for="adminPassword">Password</label>
            <input 
              type="password" 
              id="adminPassword" 
              formControlName="password" 
              class="form-control" 
              placeholder="••••••••">
          </div>

            <div class="login-actions">
            <button 
              type="submit" 
              class="btn btn-primary btn-block" 
              [disabled]="loginForm.invalid || isLoading()">
              @if (isLoading()) {
                <span>Verifying...</span>
              } @else {
                <span>Sign In as {{ selectedRole() === 'superadmin' ? 'Superadmin' : 'Staff' }}</span>
              }
            </button>
          </div>
        </form>

        <div class="login-footer">
          <a routerLink="/" class="back-link">
            ← Return to Customer Website
          </a>
        </div>
      </div>
    </div>
  `,
  styleUrl: './admin-login.component.css'
})
export class AdminLoginComponent {
  private readonly adminService = inject(AdminService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly selectedRole = signal<AdminRole>('superadmin');
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  setRole(role: AdminRole): void {
    this.selectedRole.set(role);
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.value;
    const res = await this.adminService.login(email, password, this.selectedRole());

    this.isLoading.set(false);
    if (res.success) {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.errorMessage.set(res.error || 'Failed to authenticate. Please check your credentials.');
    }
  }
}

