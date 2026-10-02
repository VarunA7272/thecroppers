import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { SalonService, ServiceCategory } from '../../../core/models/service.model';

@Component({
  selector: 'app-admin-services',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container services-page-container">
      <!-- Header -->
      <div class="page-header-row">
        <div>
          <span class="section-eyebrow">Service Catalog & Categories</span>
          <h1 class="page-title">Manage Services & Pricing</h1>
          <p class="page-subtitle">Add custom categories, configure treatments, edit pricing, or retire services in real-time.</p>
        </div>
        <div class="header-actions-group">
          <button type="button" class="btn btn-outline" (click)="openManageCategoriesModal()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path d="M4 6h16M4 12h16M4 18h7"></path>
            </svg>
            Manage Categories ({{ categoriesList().length }})
          </button>
          <button type="button" class="btn btn-secondary" (click)="openAddCategoryModal()">
            + Add Category
          </button>
          <button type="button" class="btn btn-primary" (click)="openAddModal()">
            + Add New Service
          </button>
        </div>
      </div>

      <!-- Toast Feedback -->
      @if (toastMessage(); as msg) {
        <div class="croppers-alert alert-success">
          <span>✓ {{ msg }}</span>
        </div>
      }

      <!-- Category Filter Tabs Bar -->
      <div class="category-tabs-bar">
        <button 
          type="button" 
          class="cat-tab-btn" 
          [class.active]="selectedCategoryFilter() === 'all'"
          (click)="setCategoryFilter('all')">
          All Services ({{ servicesList().length }})
        </button>
        @for (cat of categoriesList(); track cat.id) {
          <button 
            type="button" 
            class="cat-tab-btn" 
            [class.active]="selectedCategoryFilter() === cat.name"
            (click)="setCategoryFilter(cat.name)">
            {{ cat.name }} ({{ countServicesInCategory(cat.name) }})
          </button>
        }
      </div>

      <!-- Services Grid -->
      @if (filteredServices().length === 0) {
        <div class="empty-state-box">
          <div class="empty-icon">✂️</div>
          <h3>No services found</h3>
          <p>
            @if (selectedCategoryFilter() !== 'all') {
              No services registered under "{{ selectedCategoryFilter() }}".
            } @else {
              No services added yet. Click "+ Add New Service" to create your first salon treatment.
            }
          </p>
          <div class="empty-actions">
            @if (categoriesList().length === 0) {
              <button type="button" class="btn btn-secondary" (click)="openAddCategoryModal()">
                + Create Category First
              </button>
            }
            <button type="button" class="btn btn-primary" (click)="openAddModal()">
              + Add Service
            </button>
          </div>
        </div>
      } @else {
        <div class="services-grid">
          @for (srv of filteredServices(); track srv.id) {
            <div class="croppers-card srv-card" [class.inactive-card]="!srv.is_active">
              <div class="srv-top">
                <span class="category-tag">{{ srv.category_name || 'General' }}</span>
                <span class="price-tag">₹{{ srv.price }}</span>
              </div>

              <div class="srv-content">
                @if (srv.image_url) {
                  <div class="srv-thumb">
                    <img [src]="srv.image_url" [alt]="srv.name" loading="lazy" (error)="$any($event.target).style.display='none'" />
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
      }

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
                  <div class="label-row-between">
                    <label class="form-label" for="serviceCat">Category *</label>
                    <button type="button" class="quick-add-link" (click)="openAddCategoryModal()">+ New Category</button>
                  </div>
                  @if (categoriesList().length > 0) {
                    <select id="serviceCat" formControlName="category_name" class="form-control">
                      @for (cat of categoriesList(); track cat.id) {
                        <option [value]="cat.name">{{ cat.name }}</option>
                      }
                      <option value="General">General</option>
                    </select>
                  } @else {
                    <input 
                      type="text" 
                      id="serviceCat" 
                      formControlName="category_name" 
                      class="form-control" 
                      placeholder="e.g. Hair, Beard, Skin">
                  }
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

      <!-- Add/Edit Category Modal -->
      @if (isCategoryModalOpen()) {
        <div class="modal-backdrop" (click)="closeCategoryModal()">
          <div class="croppers-card modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title">{{ editingCategory() ? 'Edit Category' : 'Add New Category' }}</h3>
              <button type="button" class="close-btn" (click)="closeCategoryModal()">✕</button>
            </div>

            <form [formGroup]="categoryForm" (ngSubmit)="saveCategory()" class="category-form">
              <div class="form-group">
                <label class="form-label" for="catName">Category Name *</label>
                <input 
                  type="text" 
                  id="catName" 
                  formControlName="name" 
                  class="form-control" 
                  placeholder="e.g. Hair Styling, Beard Grooming, Skin Rituals">
              </div>

              <div class="form-group">
                <label class="form-label" for="catDesc">Description</label>
                <textarea 
                  id="catDesc" 
                  formControlName="description" 
                  class="form-control text-area" 
                  rows="2" 
                  placeholder="Brief tagline or description shown to guests..."></textarea>
              </div>

              <div class="form-group">
                <label class="form-label" for="catOrder">Display Order (Sorting)</label>
                <input 
                  type="number" 
                  id="catOrder" 
                  formControlName="display_order" 
                  class="form-control" 
                  placeholder="e.g. 1">
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-ghost" (click)="closeCategoryModal()">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="categoryForm.invalid">
                  {{ editingCategory() ? 'Update Category' : 'Create Category' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Manage Categories List Drawer / Modal -->
      @if (isManageCategoriesOpen()) {
        <div class="modal-backdrop" (click)="closeManageCategoriesModal()">
          <div class="croppers-card modal-card manage-categories-modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <h3 class="modal-title">Service Categories</h3>
                <p class="modal-subtitle">Organize and sort your salon service menu categories.</p>
              </div>
              <button type="button" class="close-btn" (click)="closeManageCategoriesModal()">✕</button>
            </div>

            <div class="categories-management-body">
              <div class="cat-action-header">
                <span class="cat-count">{{ categoriesList().length }} Categories configured</span>
                <button type="button" class="btn btn-secondary btn-sm" (click)="openAddCategoryModal()">
                  + Add New Category
                </button>
              </div>

              @if (categoriesList().length === 0) {
                <div class="no-cats-msg">
                  <p>No categories added yet. Click "+ Add New Category" above.</p>
                </div>
              } @else {
                <div class="categories-table-wrap">
                  <table class="categories-table">
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Category Name</th>
                        <th>Description</th>
                        <th>Services</th>
                        <th class="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (cat of categoriesList(); track cat.id) {
                        <tr>
                          <td><span class="order-badge">#{{ cat.display_order || 1 }}</span></td>
                          <td><strong>{{ cat.name }}</strong></td>
                          <td><span class="cat-desc-cell">{{ cat.description || '—' }}</span></td>
                          <td><span class="services-count-pill">{{ countServicesInCategory(cat.name) }} treatments</span></td>
                          <td class="text-right">
                            <button type="button" class="btn btn-outline btn-xs" (click)="openEditCategoryModal(cat)">
                              Edit
                            </button>
                            <button type="button" class="btn btn-ghost btn-xs delete-btn" (click)="confirmDeleteCategory(cat)">
                              Delete
                            </button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-primary" (click)="closeManageCategoriesModal()">Done</button>
            </div>
          </div>
        </div>
      }

      <!-- Delete Service Confirmation Modal -->
      @if (deletingService(); as srvToDelete) {
        <div class="modal-backdrop" (click)="cancelDelete()">
          <div class="croppers-card modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title">Delete Service</h3>
              <button type="button" class="close-btn" (click)="cancelDelete()">✕</button>
            </div>
            <p class="delete-warning">
              Are you sure you want to permanently remove <strong>{{ srvToDelete.name }}</strong> (₹{{ srvToDelete.price }}) from the salon catalog?
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

      <!-- Delete Category Confirmation Modal -->
      @if (deletingCategory(); as catToDelete) {
        <div class="modal-backdrop" (click)="cancelDeleteCategory()">
          <div class="croppers-card modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title">Delete Category</h3>
              <button type="button" class="close-btn" (click)="cancelDeleteCategory()">✕</button>
            </div>
            <p class="delete-warning">
              Are you sure you want to permanently delete category <strong>{{ catToDelete.name }}</strong>?
              @if (countServicesInCategory(catToDelete.name) > 0) {
                <br /><br />
                <span class="warning-text">⚠️ Note: {{ countServicesInCategory(catToDelete.name) }} services linked to this category will be unassigned to General category.</span>
              }
            </p>
            <div class="modal-footer">
              <button type="button" class="btn btn-ghost" (click)="cancelDeleteCategory()">Cancel</button>
              <button type="button" class="btn btn-primary delete-confirm-btn" (click)="executeDeleteCategory(catToDelete)">
                Yes, Delete Category
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
  readonly categoriesList = signal<ServiceCategory[]>([]);
  readonly selectedCategoryFilter = signal<string>('all');

  readonly isModalOpen = signal<boolean>(false);
  readonly editingService = signal<SalonService | null>(null);
  readonly deletingService = signal<SalonService | null>(null);

  readonly isCategoryModalOpen = signal<boolean>(false);
  readonly editingCategory = signal<ServiceCategory | null>(null);
  readonly deletingCategory = signal<ServiceCategory | null>(null);
  readonly isManageCategoriesOpen = signal<boolean>(false);

  readonly toastMessage = signal<string | null>(null);

  readonly filteredServices = computed(() => {
    const list = this.servicesList();
    const filter = this.selectedCategoryFilter();
    if (filter === 'all') return list;
    return list.filter(s => (s.category_name || '').toLowerCase() === filter.toLowerCase());
  });

  serviceForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    category_name: ['General', [Validators.required]],
    duration_minutes: [30, [Validators.required]],
    price: [200, [Validators.required, Validators.min(0)]],
    description: [''],
    image_url: [''],
    is_active: [true]
  });

  categoryForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    display_order: [1, [Validators.required, Validators.min(1)]]
  });

  async ngOnInit(): Promise<void> {
    await this.loadAll();
  }

  async loadAll(): Promise<void> {
    const [cats, srvs] = await Promise.all([
      this.adminService.getCategories(),
      this.adminService.getServices()
    ]);
    this.categoriesList.set(cats);
    this.servicesList.set(srvs);
  }

  setCategoryFilter(categoryName: string): void {
    this.selectedCategoryFilter.set(categoryName);
  }

  countServicesInCategory(categoryName: string): number {
    return this.servicesList().filter(s => (s.category_name || '').toLowerCase() === categoryName.toLowerCase()).length;
  }

  // --- SERVICE CRUD ---

  openAddModal(): void {
    this.editingService.set(null);
    const defaultCat = this.categoriesList().length > 0 ? this.categoriesList()[0].name : 'General';
    this.serviceForm.reset({
      name: '',
      category_name: defaultCat,
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
      category_name: srv.category_name || 'General',
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
      this.showToast(`Updated service "${val.name}".`);
    } else {
      await this.adminService.addService(val);
      this.showToast(`Added new service "${val.name}".`);
    }

    await this.loadAll();
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
    this.showToast(`Deleted service "${srv.name}".`);
    this.deletingService.set(null);
    await this.loadAll();
  }

  // --- CATEGORY CRUD ---

  openAddCategoryModal(): void {
    this.editingCategory.set(null);
    this.categoryForm.reset({
      name: '',
      description: '',
      display_order: this.categoriesList().length + 1
    });
    this.isCategoryModalOpen.set(true);
  }

  openEditCategoryModal(cat: ServiceCategory): void {
    this.editingCategory.set(cat);
    this.categoryForm.patchValue({
      name: cat.name,
      description: cat.description || '',
      display_order: cat.display_order || 1
    });
    this.isCategoryModalOpen.set(true);
  }

  closeCategoryModal(): void {
    this.isCategoryModalOpen.set(false);
    this.editingCategory.set(null);
  }

  async saveCategory(): Promise<void> {
    if (this.categoryForm.invalid) return;

    const val = this.categoryForm.value;
    const editing = this.editingCategory();

    if (editing) {
      await this.adminService.updateCategory(editing.id, val);
      this.showToast(`Updated category "${val.name}".`);
    } else {
      await this.adminService.addCategory(val);
      this.showToast(`Created new category "${val.name}".`);
    }

    await this.loadAll();
    this.closeCategoryModal();
  }

  openManageCategoriesModal(): void {
    this.isManageCategoriesOpen.set(true);
  }

  closeManageCategoriesModal(): void {
    this.isManageCategoriesOpen.set(false);
  }

  confirmDeleteCategory(cat: ServiceCategory): void {
    this.deletingCategory.set(cat);
  }

  cancelDeleteCategory(): void {
    this.deletingCategory.set(null);
  }

  async executeDeleteCategory(cat: ServiceCategory): Promise<void> {
    await this.adminService.deleteCategory(cat.id);
    this.showToast(`Deleted category "${cat.name}".`);
    this.deletingCategory.set(null);
    if (this.selectedCategoryFilter() === cat.name) {
      this.selectedCategoryFilter.set('all');
    }
    await this.loadAll();
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(null), 3500);
  }
}
