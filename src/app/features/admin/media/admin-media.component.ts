import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MediaService } from '../../../core/services/media.service';
import { GalleryImageItem } from '../../../core/models/media.model';

@Component({
  selector: 'app-admin-media',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container media-page-container">
      <!-- Page Header -->
      <div class="page-header-row">
        <div>
          <span class="section-eyebrow">Studio Imagery & Content</span>
          <h1 class="page-title">Media & Gallery Manager</h1>
          <p class="page-subtitle">Configure website showcase images, lookbook portfolio items, and visual assets.</p>
        </div>
        <div class="header-actions">
          <button type="button" class="btn btn-outline" (click)="resetDefaults()">
            ↺ Reset Defaults
          </button>
          <button type="button" class="btn btn-primary" (click)="openAddModal()">
            + Add Gallery Photo
          </button>
        </div>
      </div>

      <!-- Toast Feedback -->
      @if (toastMessage(); as msg) {
        <div class="croppers-alert alert-success">
          <span>✓ {{ msg }}</span>
        </div>
      }

      <!-- Website Banners Configuration Section -->
      <section class="media-section">
        <div class="section-header">
          <h2 class="section-title">Website Showcase Banners</h2>
          <p class="section-desc">Customize the hero visual on the homepage and the craftsman showcase on the about page.</p>
        </div>

        <div class="banners-grid">
          <!-- Hero Banner Card -->
          <div class="croppers-card banner-config-card">
            <div class="banner-preview-box">
              <img [src]="heroBannerForm.get('imageUrl')?.value" [alt]="heroBannerForm.get('altText')?.value" (error)="$any($event.target).style.display='none'" />
              <div class="banner-badge">Home Hero Card</div>
            </div>

            <form [formGroup]="heroBannerForm" (ngSubmit)="saveHeroBanner()" class="banner-form">
              <div class="form-group">
                <label class="form-label" for="heroUrl">Hero Showcase Image URL *</label>
                <input 
                  type="url" 
                  id="heroUrl" 
                  formControlName="imageUrl" 
                  class="form-control" 
                  placeholder="https://images.unsplash.com/...">
              </div>

              <div class="form-group">
                <label class="form-label" for="heroAlt">Alt / Accessibility Description</label>
                <input 
                  type="text" 
                  id="heroAlt" 
                  formControlName="altText" 
                  class="form-control" 
                  placeholder="e.g. Master barber precision scissor cut at The Croppers">
              </div>

              <div class="form-actions">
                <button type="submit" class="btn btn-primary btn-sm" [disabled]="heroBannerForm.invalid">
                  Save Hero Showcase
                </button>
              </div>
            </form>
          </div>

          <!-- About Story Card -->
          <div class="croppers-card banner-config-card">
            <div class="banner-preview-box">
              <img [src]="aboutBannerForm.get('imageUrl')?.value" [alt]="aboutBannerForm.get('altText')?.value" (error)="$any($event.target).style.display='none'" />
              <div class="banner-badge">About Story Visual</div>
            </div>

            <form [formGroup]="aboutBannerForm" (ngSubmit)="saveAboutBanner()" class="banner-form">
              <div class="form-group">
                <label class="form-label" for="aboutUrl">About Story Image URL *</label>
                <input 
                  type="url" 
                  id="aboutUrl" 
                  formControlName="imageUrl" 
                  class="form-control" 
                  placeholder="https://images.unsplash.com/...">
              </div>

              <div class="form-group">
                <label class="form-label" for="aboutAlt">Alt / Accessibility Description</label>
                <input 
                  type="text" 
                  id="aboutAlt" 
                  formControlName="altText" 
                  class="form-control" 
                  placeholder="e.g. Premium salon styling station at The Croppers">
              </div>

              <div class="form-actions">
                <button type="submit" class="btn btn-primary btn-sm" [disabled]="aboutBannerForm.invalid">
                  Save Story Visual
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <!-- Lookbook Gallery Items Management Section -->
      <section class="media-section">
        <div class="section-header">
          <div class="section-header-row">
            <div>
              <h2 class="section-title">Lookbook Gallery ({{ mediaService.galleryItems().length }} Photos)</h2>
              <p class="section-desc">Manage craft photos displayed on the Gallery page and the Home atmosphere preview.</p>
            </div>
            <button type="button" class="btn btn-outline btn-sm" (click)="openAddModal()">
              + New Photo
            </button>
          </div>
        </div>

        <div class="gallery-admin-grid">
          @for (item of mediaService.galleryItems(); track item.id) {
            <div class="croppers-card gallery-item-card">
              <div class="gallery-card-thumb">
                <img [src]="item.imageUrl" [alt]="item.title" loading="lazy" />
                <span class="cat-pill">{{ item.category }}</span>
                @if (item.aspectClass === 'tall') {
                  <span class="aspect-pill">Tall</span>
                }
              </div>

              <div class="gallery-card-body">
                <h3 class="gallery-item-title">{{ item.title }}</h3>
                <p class="gallery-item-sub">{{ item.subtitle }}</p>
                <div class="gallery-item-url" title="{{ item.imageUrl }}">
                  {{ item.imageUrl }}
                </div>
              </div>

              <div class="gallery-card-footer">
                <button type="button" class="btn btn-outline btn-sm" (click)="openEditModal(item)">
                  Edit
                </button>
                <button type="button" class="btn btn-ghost btn-sm delete-btn" (click)="confirmDelete(item)">
                  Delete
                </button>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- Add/Edit Gallery Item Modal -->
      @if (isModalOpen()) {
        <div class="modal-backdrop" (click)="closeModal()">
          <div class="croppers-card modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title">{{ editingItem() ? 'Edit Gallery Photo' : 'Add Lookbook Photo' }}</h3>
              <button type="button" class="close-btn" (click)="closeModal()">✕</button>
            </div>

            <form [formGroup]="galleryForm" (ngSubmit)="saveGalleryItem()" class="modal-form">
              <div class="form-group">
                <label class="form-label" for="gTitle">Title *</label>
                <input 
                  type="text" 
                  id="gTitle" 
                  formControlName="title" 
                  class="form-control" 
                  placeholder="e.g. Textured French Crop">
              </div>

              <div class="form-row">
                <div class="form-group col-half">
                  <label class="form-label" for="gCategory">Category *</label>
                  <select id="gCategory" formControlName="category" class="form-control">
                    <option value="hair">Hair Styling</option>
                    <option value="beard">Beard & Shave</option>
                    <option value="interior">Salon Interior</option>
                    <option value="spa">Scalp & Spa</option>
                  </select>
                </div>

                <div class="form-group col-half">
                  <label class="form-label" for="gAspect">Display Aspect *</label>
                  <select id="gAspect" formControlName="aspectClass" class="form-control">
                    <option value="normal">Standard (4:3)</option>
                    <option value="tall">Featured Tall (3:4)</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="gSub">Subtitle / Caption *</label>
                <input 
                  type="text" 
                  id="gSub" 
                  formControlName="subtitle" 
                  class="form-control" 
                  placeholder="e.g. Modern low-fade with natural matte finish">
              </div>

              <div class="form-group">
                <label class="form-label" for="gUrl">Image URL *</label>
                <input 
                  type="url" 
                  id="gUrl" 
                  formControlName="imageUrl" 
                  class="form-control" 
                  placeholder="https://images.unsplash.com/photo-...">
                
                @if (galleryForm.get('imageUrl')?.value) {
                  <div class="modal-img-preview">
                    <img [src]="galleryForm.get('imageUrl')?.value" alt="Preview" (error)="$any($event.target).style.display='none'" />
                    <span class="preview-badge">Live Image Preview</span>
                  </div>
                }
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-ghost" (click)="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="galleryForm.invalid">
                  {{ editingItem() ? 'Save Changes' : 'Add to Lookbook' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Delete Confirmation Modal -->
      @if (deletingItem(); as itemToDelete) {
        <div class="modal-backdrop" (click)="cancelDelete()">
          <div class="croppers-card modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title">Delete Lookbook Photo</h3>
              <button type="button" class="close-btn" (click)="cancelDelete()">✕</button>
            </div>
            <p class="delete-warning">
              Are you sure you want to permanently remove <strong>{{ itemToDelete.title }}</strong> from the gallery portfolio?
            </p>
            <div class="modal-footer">
              <button type="button" class="btn btn-ghost" (click)="cancelDelete()">Cancel</button>
              <button type="button" class="btn btn-primary delete-confirm-btn" (click)="executeDelete(itemToDelete)">
                Yes, Delete Photo
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './admin-media.component.css'
})
export class AdminMediaComponent implements OnInit {
  readonly mediaService = inject(MediaService);
  private readonly fb = inject(FormBuilder);

  readonly isModalOpen = signal<boolean>(false);
  readonly editingItem = signal<GalleryImageItem | null>(null);
  readonly deletingItem = signal<GalleryImageItem | null>(null);
  readonly toastMessage = signal<string | null>(null);

  heroBannerForm: FormGroup = this.fb.group({
    imageUrl: ['', [Validators.required]],
    altText: ['', [Validators.required]]
  });

  aboutBannerForm: FormGroup = this.fb.group({
    imageUrl: ['', [Validators.required]],
    altText: ['', [Validators.required]]
  });

  galleryForm: FormGroup = this.fb.group({
    title: ['', [Validators.required]],
    category: ['hair', [Validators.required]],
    subtitle: ['', [Validators.required]],
    imageUrl: ['', [Validators.required]],
    aspectClass: ['normal', [Validators.required]]
  });

  ngOnInit(): void {
    this.initBannerForms();
  }

  private initBannerForms(): void {
    const config = this.mediaService.config();
    this.heroBannerForm.patchValue({
      imageUrl: config.heroImageUrl,
      altText: config.heroImageAlt
    });
    this.aboutBannerForm.patchValue({
      imageUrl: config.aboutImageUrl,
      altText: config.aboutImageAlt
    });
  }

  saveHeroBanner(): void {
    if (this.heroBannerForm.invalid) return;
    const { imageUrl, altText } = this.heroBannerForm.value;
    this.mediaService.updateHeroBanner(imageUrl, altText);
    this.showToast('Hero showcase banner updated successfully.');
  }

  saveAboutBanner(): void {
    if (this.aboutBannerForm.invalid) return;
    const { imageUrl, altText } = this.aboutBannerForm.value;
    this.mediaService.updateAboutImage(imageUrl, altText);
    this.showToast('About story visual updated successfully.');
  }

  resetDefaults(): void {
    if (confirm('Revert all website showcase banners and gallery items back to default curated images?')) {
      this.mediaService.resetDefaults();
      this.initBannerForms();
      this.showToast('Reset all media configurations to default curated set.');
    }
  }

  openAddModal(): void {
    this.editingItem.set(null);
    this.galleryForm.reset({
      title: '',
      category: 'hair',
      subtitle: '',
      imageUrl: '',
      aspectClass: 'normal'
    });
    this.isModalOpen.set(true);
  }

  openEditModal(item: GalleryImageItem): void {
    this.editingItem.set(item);
    this.galleryForm.patchValue({
      title: item.title,
      category: item.category,
      subtitle: item.subtitle,
      imageUrl: item.imageUrl,
      aspectClass: item.aspectClass || 'normal'
    });
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.editingItem.set(null);
  }

  saveGalleryItem(): void {
    if (this.galleryForm.invalid) return;
    const val = this.galleryForm.value;
    const editing = this.editingItem();

    if (editing) {
      this.mediaService.updateGalleryItem({
        id: editing.id,
        ...val
      });
      this.showToast(`Updated "${val.title}" in gallery.`);
    } else {
      this.mediaService.addGalleryItem(val);
      this.showToast(`Added "${val.title}" to gallery.`);
    }

    this.closeModal();
  }

  confirmDelete(item: GalleryImageItem): void {
    this.deletingItem.set(item);
  }

  cancelDelete(): void {
    this.deletingItem.set(null);
  }

  executeDelete(item: GalleryImageItem): void {
    this.mediaService.deleteGalleryItem(item.id);
    this.showToast(`Removed "${item.title}" from gallery.`);
    this.deletingItem.set(null);
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(null), 3500);
  }
}
