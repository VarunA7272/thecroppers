import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { SalonService } from '../../../core/models/service.model';

@Component({
  selector: 'app-admin-services',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container services-page-container">
      <!-- Header -->
      <div class="page-header-row">
        <div>
          <span class="section-eyebrow">Service Catalog</span>
          <h1 class="page-title">Manage Services & Pricing</h1>
          <p class="page-subtitle">Add, edit pricing, or retire treatments in real-time. (Superadmin Only)</p>
        </div>
        <button type="button" class="btn btn-primary" (click)="openAddModal()">
          + Add New Service
        </button>
      </div>

      <!-- Toast Feedback -->
      @if (toastMessage(); as msg) {
        <div class="croppers-alert alert-success">
          <span>✓ {{ msg }}</span>
        </div>
      }

      <!-- Services Grid -->
      <div class="services-grid">
        @for (srv of servicesList(); track srv.id) {
          <div class="croppers-card srv-card" [class.inactive-card]="!srv.is_active">
            <div class="srv-top">
              <span class="category-tag">{{ srv.category_name || 'Treatment' }}</span>
              <span class="price-tag">₹{{ srv.price }}</span>
            </div>

            <div class="srv-content">
              @if (srv.image_url) {
                <div class="srv-thumb">
                  <img [src]="srv.image_url" [alt]="srv.name" loading="lazy" />
                </div>
              }
              <h3 class="srv-name">{{ srv.name }}</h3>
              <p class="srv-desc">{{ srv.description || 'No detailed description.' }}</p>
              
              <div class="srv-meta">
                <span class="meta-pill">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  {{ srv.duration_minutes }} Minutes
                </span>
                <span class="badge" [class.badge-gold]="srv.is_active" [class.badge-inactive]="!srv.is_active">
                  {{ srv.is_active ? 'Available' : 'Archived' }}
                </span>
              </div>
            </div>

            <div class="card-actions">
              <button type="button" class="btn btn-outline btn-sm" (click)="openEditModal(srv)">
                Edit Service
              </button>
              <button type="button" class="btn btn-ghost btn-sm delete-btn" (click)="confirmDelete(srv)">
                Delete
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Add/Edit Service Modal -->
      @if (isModalOpen()) {
        <div class="modal-backdrop" (click)="closeModal()">
          <div class="croppers-card modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title">{{ editingService() ? 'Edit Service' : 'Add New Service' }}</h3>
              <button type="button" class="close-btn" (click)="closeModal()">✕</button>
            </div>

            <form [formGroup]="serviceForm" (ngSubmit)="saveService()" class="service-form">
              <div class="form-group">
                <label class="form-label" for="serviceName">Service Name *</label>
                <input 
                  type="text" 
                  id="serviceName" 
                  formControlName="name" 
                  class="form-control" 
                  placeholder="e.g. Signature Beard Styling">
              </div>

              <div class="form-row">
                <div class="form-group col-half">
                  <label class="form-label" for="serviceCat">Category *</label>
                  <select id="serviceCat" formControlName="category_name" class="form-control">
                    <option value="Hair">Hair</option>
                    <option value="Beard">Beard</option>
                    <option value="Skin">Skin</option>
                  </select>
                </div>

                <div class="form-group col-half">
                  <label class="form-label" for="serviceDur">Duration (Minutes) *</label>
                  <select id="serviceDur" formControlName="duration_minutes" class="form-control">
                    <option [value]="15">15 Minutes</option>
                    <option [value]="20">20 Minutes</option>
                    <option [value]="30">30 Minutes</option>
                    <option [value]="45">45 Minutes</option>
                    <option [value]="60">60 Minutes</option>
                    <option [value]="90">90 Minutes</option>
                    <option [value]="120">120 Minutes</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="servicePrice">Price (₹ INR) *</label>
                <input 
                  type="number" 
                  id="servicePrice" 
                  formControlName="price" 
                  class="form-control" 
                  placeholder="e.g. 350">
              </div>

              <div class="form-group">
                <label class="form-label" for="serviceDesc">Service Description</label>
                <textarea 
                  id="serviceDesc" 
                  formControlName="description" 
                  class="form-control text-area" 
                  rows="3" 
                  placeholder="Explain what the guest experiences during this treatment..."></textarea>
              </div>

              <div class="form-group">
                <label class="form-label" for="serviceImage">Service Photo / Thumbnail URL</label>
                <input 
                  type="url" 
                  id="serviceImage" 
                  formControlName="image_url" 
                  class="form-control" 
                  placeholder="https://images.unsplash.com/photo-...">
                @if (serviceForm.get('image_url')?.value) {
                  <div class="srv-form-preview">
                    <img [src]="serviceForm.get('image_url')?.value" alt="Preview" (error)="$any($event.target).style.display='none'" />
                    <span class="preview-caption">Live Preview</span>
                  </div>
                }
              </div>

              <div class="form-group checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" formControlName="is_active">
                  <span>Available on Customer Booking Page</span>
                </label>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-ghost" (click)="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="serviceForm.invalid">
                  {{ editingService() ? 'Save Changes' : 'Create Service' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Delete Confirmation Modal -->
      @if (deletingService(); as srvToDelete) {
        <div class="modal-backdrop" (click)="cancelDelete()">
          <div class="croppers-card modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title">Delete Service</h3>
              <button type="button" class="close-btn" (click)="cancelDelete()">✕</button>
            </div>
            <p class="delete-warning">
              Are you sure you want to permanently remove <strong>{{ srvToDelete.name }}</strong> (₹{{ srvToDelete.price }}) from the salon services?
            </p>
            <div class="modal-footer">
              <button type="button" class="btn btn-ghost" (click)="cancelDelete()">Cancel</button>
              <button type="button" class="btn btn-primary delete-confirm-btn" (click)="executeDelete(srvToDelete)">
                Yes, Delete Service
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './admin-services.component.css'
})
export class AdminServicesComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly fb = inject(FormBuilder);

  readonly servicesList = signal<SalonService[]>([]);
  readonly isModalOpen = signal<boolean>(false);
  readonly editingService = signal<SalonService | null>(null);
  readonly deletingService = signal<SalonService | null>(null);
  readonly toastMessage = signal<string | null>(null);

  serviceForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    category_name: ['Hair', [Validators.required]],
    duration_minutes: [30, [Validators.required]],
    price: [200, [Validators.required, Validators.min(0)]],
    description: [''],
    image_url: [''],
    is_active: [true]
  });

  async ngOnInit(): Promise<void> {
    await this.loadServices();
  }

  async loadServices(): Promise<void> {
    const list = await this.adminService.getServices();
    this.servicesList.set(list);
  }

  openAddModal(): void {
    this.editingService.set(null);
    this.serviceForm.reset({
      name: '',
      category_name: 'Hair',
      duration_minutes: 30,
      price: 200,
      description: '',
      image_url: '',
      is_active: true
    });
    this.isModalOpen.set(true);
  }

  openEditModal(srv: SalonService): void {
    this.editingService.set(srv);
    this.serviceForm.patchValue({
      name: srv.name,
      category_name: srv.category_name || 'Hair',
      duration_minutes: srv.duration_minutes,
      price: srv.price,
      description: srv.description || '',
      image_url: srv.image_url || '',
      is_active: srv.is_active ?? true
    });
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.editingService.set(null);
  }

  async saveService(): Promise<void> {
    if (this.serviceForm.invalid) return;

    const val = this.serviceForm.value;
    const editing = this.editingService();

    if (editing) {
      await this.adminService.updateService(editing.id, val);
      this.showToast(`Updated service ${val.name}.`);
    } else {
      await this.adminService.addService(val);
      this.showToast(`Added new service ${val.name}.`);
    }

    await this.loadServices();
    this.closeModal();
  }

  confirmDelete(srv: SalonService): void {
    this.deletingService.set(srv);
  }

  cancelDelete(): void {
    this.deletingService.set(null);
  }

  async executeDelete(srv: SalonService): Promise<void> {
    await this.adminService.deleteService(srv.id);
    this.showToast(`Deleted service ${srv.name}.`);
    this.deletingService.set(null);
    await this.loadServices();
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(null), 3500);
  }
}
