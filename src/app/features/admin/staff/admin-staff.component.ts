import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { StaffMember } from '../../../core/models/admin.model';

@Component({
  selector: 'app-admin-staff',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container staff-page-container">
      <!-- Header -->
      <div class="page-header-row">
        <div>
          <span class="section-eyebrow">Personnel Roster</span>
          <h1 class="page-title">Manage Salon Staff</h1>
          <p class="page-subtitle">Add, edit, or remove internal stylists and specialists. (Superadmin Only)</p>
        </div>
        <button type="button" class="btn btn-primary" (click)="openAddModal()">
          + Add New Staff Member
        </button>
      </div>

      <!-- Toast Feedback -->
      @if (toastMessage(); as msg) {
        <div class="croppers-alert alert-success">
          <span>✓ {{ msg }}</span>
        </div>
      }

      <!-- Staff Grid -->
      <div class="staff-grid">
        @for (staff of staffList(); track staff.id) {
          <div class="croppers-card staff-card" [class.inactive-card]="!staff.is_active">
            <div class="card-top">
              <div class="avatar-wrap">
                <span class="avatar-letter">{{ staff.name.charAt(0) }}</span>
              </div>
              <div class="status-badge-wrap">
                <span class="badge" [class.badge-gold]="staff.is_active" [class.badge-inactive]="!staff.is_active">
                  {{ staff.is_active ? 'Active' : 'Inactive' }}
                </span>
              </div>
            </div>

            <div class="staff-info">
              <h3 class="staff-name">{{ staff.name }}</h3>
              <span class="staff-role">{{ staff.role }}</span>
              <div class="spec-pill-group">
                <span class="spec-pill">{{ staff.specialization | uppercase }} SPECIALIST</span>
              </div>
              <div class="staff-salary-badge">
                <span class="salary-tag">₹{{ (staff.base_salary || 22000) | number }}/mo</span>
                <span class="incentive-tag">{{ staff.incentive_percentage || 15 }}% Commission</span>
              </div>
              <div class="staff-phone">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                <span>{{ staff.phone || 'No phone recorded' }}</span>
              </div>
            </div>

            <div class="card-actions">
              <button type="button" class="btn btn-outline btn-sm" (click)="openEditModal(staff)">
                Edit Details
              </button>
              <button type="button" class="btn btn-ghost btn-sm delete-btn" (click)="confirmDelete(staff)">
                Delete
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Add/Edit Staff Modal -->
      @if (isModalOpen()) {
        <div class="modal-backdrop" (click)="closeModal()">
          <div class="croppers-card modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title">{{ editingStaff() ? 'Edit Staff Member' : 'Add New Staff Member' }}</h3>
              <button type="button" class="close-btn" (click)="closeModal()">✕</button>
            </div>

            <form [formGroup]="staffForm" (ngSubmit)="saveStaff()" class="staff-form">
              <div class="form-group">
                <label class="form-label" for="staffName">Full Name *</label>
                <input 
                  type="text" 
                  id="staffName" 
                  formControlName="name" 
                  class="form-control" 
                  placeholder="e.g. Rahul Sharma">
              </div>

              <div class="form-group">
                <label class="form-label" for="staffRole">Salon Role / Title *</label>
                <input 
                  type="text" 
                  id="staffRole" 
                  formControlName="role" 
                  class="form-control" 
                  placeholder="e.g. Master Stylist, Senior Barber">
              </div>

              <div class="form-row">
                <div class="form-group col-half">
                  <label class="form-label" for="staffBaseSalary">Monthly Base Salary (₹) *</label>
                  <input 
                    type="number" 
                    id="staffBaseSalary" 
                    formControlName="base_salary" 
                    class="form-control" 
                    min="0" 
                    step="500" 
                    placeholder="25000">
                </div>
                <div class="form-group col-half">
                  <label class="form-label" for="staffIncentive">Incentive Commission (%) *</label>
                  <input 
                    type="number" 
                    id="staffIncentive" 
                    formControlName="incentive_percentage" 
                    class="form-control" 
                    min="0" 
                    max="100" 
                    step="1" 
                    placeholder="15">
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="staffSpec">Service Specialization</label>
                <select id="staffSpec" formControlName="specialization" class="form-control">
                  <option value="hair">Hair (Haircut, Color, Spa)</option>
                  <option value="beard">Beard (Trim, Shave)</option>
                  <option value="skin">Skin (Facials, Cleanup)</option>
                  <option value="all">All Services (Generalist)</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="staffPhone">Contact Phone</label>
                <input 
                  type="tel" 
                  id="staffPhone" 
                  formControlName="phone" 
                  class="form-control" 
                  placeholder="+91 98765 43210">
              </div>

              <div class="form-group checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" formControlName="is_active">
                  <span>Active Roster (Eligible for assignment)</span>
                </label>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-ghost" (click)="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="staffForm.invalid">
                  {{ editingStaff() ? 'Save Changes' : 'Add Staff' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Delete Confirmation Modal -->
      @if (deletingStaff(); as staffToDelete) {
        <div class="modal-backdrop" (click)="cancelDelete()">
          <div class="croppers-card modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title">Delete Staff Member</h3>
              <button type="button" class="close-btn" (click)="cancelDelete()">✕</button>
            </div>
            <p class="delete-warning">
              Are you sure you want to remove <strong>{{ staffToDelete.name }}</strong> ({{ staffToDelete.role }}) from the salon staff?
            </p>
            <div class="modal-footer">
              <button type="button" class="btn btn-ghost" (click)="cancelDelete()">Cancel</button>
              <button type="button" class="btn btn-primary delete-confirm-btn" (click)="executeDelete(staffToDelete)">
                Yes, Delete Staff
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './admin-staff.component.css'
})
export class AdminStaffComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly fb = inject(FormBuilder);

  readonly staffList = signal<StaffMember[]>([]);
  readonly isModalOpen = signal<boolean>(false);
  readonly editingStaff = signal<StaffMember | null>(null);
  readonly deletingStaff = signal<StaffMember | null>(null);
  readonly toastMessage = signal<string | null>(null);

  staffForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    role: ['', [Validators.required]],
    specialization: ['hair', [Validators.required]],
    phone: [''],
    is_active: [true],
    base_salary: [22000, [Validators.required, Validators.min(0)]],
    incentive_percentage: [15, [Validators.required, Validators.min(0), Validators.max(100)]]
  });

  async ngOnInit(): Promise<void> {
    await this.loadStaff();
  }

  async loadStaff(): Promise<void> {
    const list = await this.adminService.getStaffMembers();
    this.staffList.set(list);
  }

  openAddModal(): void {
    this.editingStaff.set(null);
    this.staffForm.reset({
      name: '',
      role: '',
      specialization: 'hair',
      phone: '',
      is_active: true,
      base_salary: 22000,
      incentive_percentage: 15
    });
    this.isModalOpen.set(true);
  }

  openEditModal(staff: StaffMember): void {
    this.editingStaff.set(staff);
    this.staffForm.patchValue({
      name: staff.name,
      role: staff.role,
      specialization: staff.specialization,
      phone: staff.phone || '',
      is_active: staff.is_active,
      base_salary: staff.base_salary ?? 22000,
      incentive_percentage: staff.incentive_percentage ?? 15
    });
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.editingStaff.set(null);
  }

  async saveStaff(): Promise<void> {
    if (this.staffForm.invalid) return;

    const val = this.staffForm.value;
    const editing = this.editingStaff();

    if (editing) {
      await this.adminService.updateStaff(editing.id, val);
      this.showToast(`Updated staff profile for ${val.name}.`);
    } else {
      await this.adminService.addStaff(val);
      this.showToast(`Added new staff member ${val.name}.`);
    }

    await this.loadStaff();
    this.closeModal();
  }

  confirmDelete(staff: StaffMember): void {
    this.deletingStaff.set(staff);
  }

  cancelDelete(): void {
    this.deletingStaff.set(null);
  }

  async executeDelete(staff: StaffMember): Promise<void> {
    await this.adminService.deleteStaff(staff.id);
    this.showToast(`Removed ${staff.name} from roster.`);
    this.deletingStaff.set(null);
    await this.loadStaff();
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(null), 3500);
  }
}
