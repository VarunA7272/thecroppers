import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { SalonOpeningHour } from '../../../core/models/salon.model';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container settings-page-container">
      <!-- Header -->
      <div class="page-header-row">
        <div>
          <span class="section-eyebrow">Operating Hours & Salon Profile</span>
          <h1 class="page-title">Salon Settings</h1>
          <p class="page-subtitle">Configure weekly business hours and customer contact details. (Superadmin Only)</p>
        </div>
      </div>

      <!-- Toast Feedback -->
      @if (toastMessage(); as msg) {
        <div class="croppers-alert alert-success">
          <span>✓ {{ msg }}</span>
        </div>
      }

      <div class="settings-grid">
        <!-- Weekly Hours Form -->
        <div class="croppers-card settings-card">
          <div class="card-head">
            <h2 class="card-heading">Weekly Operating Schedule</h2>
            <span class="badge badge-gold">Timezone: Asia/Kolkata</span>
          </div>
          <p class="card-desc">Customer appointment availability is governed by these hours.</p>

          <form [formGroup]="hoursForm" (ngSubmit)="saveHours()">
            <div formArrayName="hours" class="hours-form-array">
              @for (hourCtrl of hoursArray.controls; track $index) {
                <div [formGroupName]="$index" class="hour-row" [class.closed-row]="hourCtrl.get('isClosed')?.value">
                  <div class="day-col">
                    <strong>{{ hourCtrl.get('dayOfWeek')?.value }}</strong>
                  </div>

                  <div class="times-col">
                    <div class="time-input-group">
                      <label class="sub-label">Open</label>
                      <input 
                        type="time" 
                        formControlName="openTime" 
                        class="form-control time-input">
                    </div>
                    <span class="to-separator">to</span>
                    <div class="time-input-group">
                      <label class="sub-label">Close</label>
                      <input 
                        type="time" 
                        formControlName="closeTime" 
                        class="form-control time-input">
                    </div>
                  </div>

                  <div class="closed-col">
                    <label class="closed-checkbox-label">
                      <input type="checkbox" formControlName="isClosed">
                      <span>Closed</span>
                    </label>
                  </div>
                </div>
              }
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary" [disabled]="hoursForm.invalid || isSaving()">
                {{ isSaving() ? 'Saving...' : 'Save Operating Hours' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Salon Info & Security Overview -->
        <div class="croppers-card info-card">
          <h2 class="card-heading">Salon Metadata</h2>
          <div class="metadata-list">
            <div class="metadata-item">
              <span class="lbl">Salon ID</span>
              <span class="val mono-val">{{ adminService.salonId }}</span>
            </div>
            <div class="metadata-item">
              <span class="lbl">Primary Phone</span>
              <span class="val">+91 78488 27245</span>
            </div>
            <div class="metadata-item">
              <span class="lbl">City / Region</span>
              <span class="val">Jabalpur, Madhya Pradesh, India</span>
            </div>
            <div class="metadata-item">
              <span class="lbl">Booking Grid</span>
              <span class="val">30-Minute Capacity Slots</span>
            </div>
          </div>

          <div class="security-box">
            <h4>Superadmin Privilege</h4>
            <p>
              As a Superadmin, any updates to services, staff roster, or operating hours take effect in real-time across both the admin dashboard and customer booking engine.
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './admin-settings.component.css'
})
export class AdminSettingsComponent implements OnInit {
  readonly adminService = inject(AdminService);
  private readonly fb = inject(FormBuilder);

  readonly isSaving = signal<boolean>(false);
  readonly toastMessage = signal<string | null>(null);

  hoursForm: FormGroup = this.fb.group({
    hours: this.fb.array([])
  });

  get hoursArray(): FormArray {
    return this.hoursForm.get('hours') as FormArray;
  }

  async ngOnInit(): Promise<void> {
    const hours = await this.adminService.getOpeningHours();
    hours.forEach(h => {
      this.hoursArray.push(
        this.fb.group({
          dayOfWeek: [h.dayOfWeek],
          openTime: [h.openTime, Validators.required],
          closeTime: [h.closeTime, Validators.required],
          isClosed: [h.isClosed ?? false]
        })
      );
    });
  }

  async saveHours(): Promise<void> {
    if (this.hoursForm.invalid) return;

    this.isSaving.set(true);
    const updated: SalonOpeningHour[] = this.hoursArray.value;
    await this.adminService.updateOpeningHours(updated);
    this.isSaving.set(false);

    this.showToast('Salon operating schedule saved successfully.');
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(null), 3500);
  }
}
