import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { SalonOpeningHour, Salon } from '../../../core/models/salon.model';

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
          <p class="page-subtitle">Configure weekly business hours, studio contact details, and booking parameters. (Superadmin Only)</p>
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
            <span class="badge badge-gold">Timezone: {{ profileForm.get('timezone')?.value || 'Asia/Kolkata' }}</span>
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
              <button type="submit" class="btn btn-primary" [disabled]="hoursForm.invalid || isSavingHours()">
                {{ isSavingHours() ? 'Saving Schedule...' : 'Save Operating Hours' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Salon Profile Form & Metadata -->
        <div class="croppers-card info-card">
          <div class="card-head">
            <h2 class="card-heading">Salon Profile & Contact</h2>
          </div>
          <p class="card-desc">Update public contact information displayed on receipts and notifications.</p>

          <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="profile-form">
            <div class="form-group">
              <label class="form-label" for="salonName">Salon Business Name *</label>
              <input 
                type="text" 
                id="salonName" 
                formControlName="name" 
                class="form-control" 
                placeholder="The Croppers">
            </div>

            <div class="form-group">
              <label class="form-label" for="salonPhone">Primary Telephone / WhatsApp *</label>
              <input 
                type="text" 
                id="salonPhone" 
                formControlName="phone" 
                class="form-control" 
                placeholder="+91 78488 27245">
            </div>

            <div class="form-group">
              <label class="form-label" for="salonCity">Studio City & Address *</label>
              <input 
                type="text" 
                id="salonCity" 
                formControlName="city" 
                class="form-control" 
                placeholder="Jabalpur, Madhya Pradesh, India">
            </div>

            <div class="form-row">
              <div class="form-group col-half">
                <label class="form-label" for="salonTz">Timezone</label>
                <input 
                  type="text" 
                  id="salonTz" 
                  formControlName="timezone" 
                  class="form-control" 
                  placeholder="Asia/Kolkata">
              </div>

              <div class="form-group col-half">
                <label class="form-label" for="salonCurr">Currency Code</label>
                <input 
                  type="text" 
                  id="salonCurr" 
                  formControlName="currency" 
                  class="form-control" 
                  placeholder="INR">
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary" [disabled]="profileForm.invalid || isSavingProfile()">
                {{ isSavingProfile() ? 'Saving Profile...' : 'Save Salon Profile' }}
              </button>
            </div>
          </form>

          <div class="metadata-divider"></div>

          <div class="metadata-list">
            <div class="metadata-item">
              <span class="lbl">Salon ID</span>
              <span class="val mono-val">{{ adminService.salonId }}</span>
            </div>
            <div class="metadata-item">
              <span class="lbl">Booking Grid</span>
              <span class="val">30-Minute Dynamic Slots</span>
            </div>
          </div>

          <div class="security-box">
            <h4>Superadmin Privilege</h4>
            <p>
              Changes to services, staff roster, operating hours, and profile take effect immediately across all admin sessions and the customer booking page.
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

  readonly isSavingHours = signal<boolean>(false);
  readonly isSavingProfile = signal<boolean>(false);
  readonly toastMessage = signal<string | null>(null);

  hoursForm: FormGroup = this.fb.group({
    hours: this.fb.array([])
  });

  profileForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.required]],
    city: ['', [Validators.required]],
    timezone: ['Asia/Kolkata', [Validators.required]],
    currency: ['INR', [Validators.required]]
  });

  get hoursArray(): FormArray {
    return this.hoursForm.get('hours') as FormArray;
  }

  async ngOnInit(): Promise<void> {
    const [hours, profile] = await Promise.all([
      this.adminService.getOpeningHours(),
      this.adminService.getSalonProfile()
    ]);

    this.profileForm.patchValue({
      name: profile.name,
      phone: profile.phone,
      city: profile.city,
      timezone: profile.timezone || 'Asia/Kolkata',
      currency: profile.currency || 'INR'
    });

    this.hoursArray.clear();
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

    this.isSavingHours.set(true);
    const updated: SalonOpeningHour[] = this.hoursArray.value;
    await this.adminService.updateOpeningHours(updated);
    this.isSavingHours.set(false);

    this.showToast('Salon operating schedule saved successfully.');
  }

  async saveProfile(): Promise<void> {
    if (this.profileForm.invalid) return;

    this.isSavingProfile.set(true);
    await this.adminService.updateSalonProfile(this.profileForm.value);
    this.isSavingProfile.set(false);

    this.showToast('Salon profile updated successfully.');
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(null), 3500);
  }
}
