import { Component, OnInit, inject, signal, computed, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { AdminAppointment, StaffMember, AppointmentServiceItem } from '../../../core/models/admin.model';
import { SalonService } from '../../../core/models/service.model';

@Component({
  selector: 'app-admin-appointments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container appointments-container">
      <!-- Title & Action Bar -->
      <div class="page-title-row">
        <div>
          <span class="section-eyebrow">
            {{ adminService.isSuperadmin() ? 'Appointment Dispatch & Owner Audit' : 'Station Schedule' }}
          </span>
          <h1 class="page-title">
            {{ adminService.isSuperadmin() ? 'Manage Appointments' : 'My Assigned Appointments' }}
          </h1>
          <p class="page-subtitle">
            {{ adminService.isSuperadmin() 
              ? 'Superadmin View: Review day bookings & transactions, edit charges & services, assign stylists, and approve.' 
              : 'Staff View: Floor queue & status updating for your personal clients (Logged in: ' + currentStaffName() + ').' }}
          </p>
        </div>

        <!-- Action: Book Walk-in / Phone Client (Both Superadmin & Staff) -->
        <button type="button" class="btn btn-primary" (click)="openWalkinModal()">
          + Book Walk-in / Phone Client
        </button>
      </div>

      <!-- Toast Feedback Message -->
      @if (actionFeedback(); as feedback) {
        <div class="croppers-alert alert-success">
          <span>✓ {{ feedback }}</span>
        </div>
      }

      <!-- Owner End-of-Day Review & Reconciliation Banner (Superadmin Only) -->
      @if (adminService.isSuperadmin()) {
        <div class="croppers-card eod-review-card">
          <div class="eod-review-info">
            <div class="eod-title-row">
              <span class="eod-icon">📋</span>
              <h2 class="eod-title">End-of-Day Review & Audit</h2>
              <span class="eod-pending-pill" [class.zero]="dayReviewStats().pendingReview === 0">
                {{ dayReviewStats().pendingReview }} Pending Review
              </span>
            </div>
            <div class="eod-stats-chips">
              <span class="eod-stat-chip">Bookings: <strong>{{ dayReviewStats().totalBookings }}</strong></span>
              <span>•</span>
              <span class="eod-stat-chip">Walk-in/Phone: <strong>{{ dayReviewStats().walkinOrPhone }}</strong></span>
              <span>•</span>
              <span class="eod-stat-chip">Completed: <strong>{{ dayReviewStats().completed }}</strong></span>
              <span>•</span>
              <span class="eod-stat-chip">Total Revenue: <strong class="text-gold">₹{{ dayReviewStats().totalRevenue | number }}</strong></span>
              <span>•</span>
              <span class="eod-stat-chip">Approved: <strong class="text-success">{{ dayReviewStats().approvedCount }}</strong></span>
            </div>

            <!-- Cash vs Digital Settlement Summary (Feature 2.3) -->
            <div class="eod-settlement-bar">
              <span class="settle-chip"><span class="settle-label">💵 Cash Drawer:</span> <strong>₹{{ dayReviewStats().cashTotal | number }}</strong></span>
              <span class="settle-divider">•</span>
              <span class="settle-chip"><span class="settle-label">📱 UPI / Card:</span> <strong>₹{{ dayReviewStats().digitalTotal | number }}</strong></span>
              <span class="settle-divider">•</span>
              <span class="settle-chip"><span class="settle-label">🏷️ Total Settlement:</span> <strong class="text-gold">₹{{ dayReviewStats().totalRevenue | number }}</strong></span>
            </div>
          </div>

          <div class="eod-actions">
            <!-- Feature 2.1: Exceptions & Pending Only Quick Filter -->
            <button 
              type="button" 
              class="btn btn-outline eod-exceptions-btn" 
              [class.active]="exceptionsOnly()"
              (click)="toggleExceptionsFilter()">
              ⚡ {{ exceptionsOnly() ? 'Showing Exceptions (' + dayReviewStats().pendingReview + ')' : 'Filter Exceptions Only (' + dayReviewStats().pendingReview + ')' }}
            </button>

            <button 
              type="button" 
              class="btn btn-primary eod-approve-all-btn" 
              [disabled]="dayReviewStats().pendingReview === 0"
              (click)="approveAllForDay()">
              ✓ Approve All ({{ dayReviewStats().pendingReview }} Pending)
            </button>
          </div>
        </div>
      }

      <!-- Universal Search Bar (Feature 6.1) -->
      <div class="search-bar-wrap">
        <div class="search-input-inner">
          <span class="search-icon">🔍</span>
          <input 
            #universalSearchInput
            type="text" 
            class="form-control universal-search-input" 
            placeholder="Search by client name, phone number, or booking ID... (Press ⌘K or Ctrl+K)"
            [value]="searchQuery()"
            (input)="onSearchInput($event)">
          @if (searchQuery()) {
            <button type="button" class="clear-search-btn" (click)="clearSearch()" title="Clear Search">✕</button>
          }
          <kbd class="search-kbd" (click)="focusSearch()" title="Keyboard shortcut: ⌘K or Ctrl+K">⌘K</kbd>
        </div>
      </div>

      <!-- Filter Controls Toolbar -->
      <div class="croppers-card toolbar-card">
        <div class="toolbar-grid">
          <!-- Date Filter -->
          <div class="filter-group">
            <span class="filter-label">Filter Date:</span>
            <div class="date-quick-btns">
              <button 
                type="button" 
                class="quick-filter-btn" 
                [class.active]="selectedDateMode() === 'today'" 
                (click)="setDateMode('today')">
                Today
              </button>
              <button 
                type="button" 
                class="quick-filter-btn" 
                [class.active]="selectedDateMode() === 'tomorrow'" 
                (click)="setDateMode('tomorrow')">
                Tomorrow
              </button>
              <button 
                type="button" 
                class="quick-filter-btn" 
                [class.active]="selectedDateMode() === 'all'" 
                (click)="setDateMode('all')">
                All Dates
              </button>
            </div>
            <input 
              type="date" 
              class="form-control date-picker-input" 
              [value]="selectedCustomDate()" 
              (change)="onCustomDateChange($event)">
          </div>

          <!-- Status Filter -->
          <div class="filter-group">
            <span class="filter-label">Status:</span>
            <div class="status-filter-pills">
              <button 
                type="button" 
                class="status-pill-btn" 
                [class.active]="selectedStatus() === 'all'" 
                (click)="setStatusFilter('all')">
                All
              </button>
              <button 
                type="button" 
                class="status-pill-btn" 
                [class.active]="selectedStatus() === 'booked'" 
                (click)="setStatusFilter('booked')">
                Booked
              </button>
              <button 
                type="button" 
                class="status-pill-btn" 
                [class.active]="selectedStatus() === 'completed'" 
                (click)="setStatusFilter('completed')">
                Completed
              </button>
              <button 
                type="button" 
                class="status-pill-btn" 
                [class.active]="selectedStatus() === 'cancelled'" 
                (click)="setStatusFilter('cancelled')">
                Cancelled
              </button>
              <button 
                type="button" 
                class="status-pill-btn" 
                [class.active]="selectedStatus() === 'no_show'" 
                (click)="setStatusFilter('no_show')">
                No-Show
              </button>
            </div>
          </div>

          <!-- Staff Specific / Unassigned Toggle -->
          <div class="filter-group toggle-group">
            @if (adminService.isSuperadmin()) {
              <div class="superadmin-filters">
                <label class="toggle-label">
                  <input 
                    type="checkbox" 
                    [checked]="unassignedOnly()" 
                    (change)="toggleUnassigned($event)">
                  <span class="toggle-text">Needs Stylist</span>
                </label>
                <select class="form-control staff-filter-select" (change)="onStaffFilterChange($event)" [value]="selectedStaffId()">
                  <option value="">All Stylists</option>
                  @for (s of staffList(); track s.id) {
                    <option [value]="s.id">{{ s.name }} ({{ s.role }})</option>
                  }
                </select>
              </div>
            } @else {
              <div class="staff-scope-pill">
                <span class="lock-icon">🔒</span>
                <span>Personal Station: <strong>{{ currentStaffName() }}</strong></span>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Results Count -->
      <div class="results-header">
        <span class="results-count">
          Showing <strong>{{ filteredAppointments().length }}</strong> appointment{{ filteredAppointments().length === 1 ? '' : 's' }}
        </span>
        @if (unassignedCount() > 0 && adminService.isSuperadmin()) {
          <span class="badge badge-gold">
            {{ unassignedCount() }} Unassigned Booking{{ unassignedCount() === 1 ? '' : 's' }}
          </span>
        }
      </div>

      <!-- Appointments List Grid -->
      @if (filteredAppointments().length === 0) {
        <div class="croppers-card empty-state-card">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="48" height="48" class="empty-icon">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <h3>No Appointments Found</h3>
          <p>There are no appointments matching your selected filters.</p>
          <button type="button" class="btn btn-outline btn-sm" (click)="resetFilters()">
            Clear Filters
          </button>
        </div>
      } @else {
        <div class="appointments-grid">
          @for (apt of filteredAppointments(); track apt.id) {
            <div class="croppers-card appointment-card" 
                 [class.status-strip-completed]="apt.status === 'completed'"
                 [class.status-strip-pending]="apt.ownerApprovalStatus === 'pending' && apt.status === 'booked'"
                 [class.status-strip-booked]="apt.ownerApprovalStatus === 'approved' && apt.status === 'booked'"
                 [class.status-strip-cancelled]="apt.status === 'cancelled' || apt.status === 'no_show'"
                 [class.unassigned-card]="apt.assignedStaff.length === 0 && apt.status === 'booked'">
              <!-- LINE 1: CLIENT NAME EMPHASIZED IN BOLD + STATUS & APPROVAL BADGES -->
              <div class="apt-card-top-line">
                <div class="client-name-box">
                  <h2 class="client-name-bold">
                    <strong>{{ apt.customer.name }}</strong>
                  </h2>
                  <div class="client-sub-meta">
                    <a [href]="'tel:' + apt.customer.phone" class="client-phone">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                      </svg>
                      +91 {{ apt.customer.phone }}
                    </a>
                    <span class="source-pill" [class.walkin]="apt.bookingSource === 'walk_in'" [class.phone]="apt.bookingSource === 'phone_call'" [class.online]="apt.bookingSource === 'online' || !apt.bookingSource">
                      {{ apt.bookingSource === 'phone_call' ? '📞 Phone' : (apt.bookingSource === 'walk_in' ? '🚶 Walk-in' : '🌐 Online') }}
                    </span>
                    <span class="payment-method-pill">{{ apt.paymentMethod === 'cash' ? '💵 Cash' : '📱 UPI' }}</span>
                  </div>
                </div>

                <div class="apt-top-badges">
                  <span class="apt-status-tag" [class]="'status-' + apt.status">
                    {{ apt.status | uppercase }}
                  </span>
                  @if (apt.ownerApprovalStatus === 'approved') {
                    <span class="owner-badge approved" title="Approved by Owner">✓ Approved</span>
                  } @else {
                    <span class="owner-badge pending" title="Pending Owner Review">⏳ Review Pending</span>
                  }
                </div>
              </div>

              <!-- LINE 2: TIME RANGE & DATE -->
              <div class="apt-time-row">
                <div class="time-block">
                  <span class="time-range">{{ formatTime12(apt.startTime) }} – {{ formatTime12(apt.endTime) }}</span>
                  <span class="apt-date">{{ apt.date }}</span>
                </div>
                <span class="time-duration">{{ apt.service.durationMinutes }}m duration</span>
              </div>

              <!-- LINE 3: SERVICES LIST & CHARGES BREAKDOWN WITH INLINE ADD-ON & PRICE DIFF -->
              <div class="apt-services-charges-section">
                <div class="services-list-strip">
                  @for (srv of (apt.services && apt.services.length > 0 ? apt.services : [apt.service]); track srv.id) {
                    <span class="service-pill-item">
                      <span class="srv-pill-name">{{ srv.name }}</span>
                      <span class="srv-pill-price">₹{{ srv.price }}</span>
                    </span>
                  }

                  <!-- Inline Quick Add-on Service (Feature 4.2) -->
                  @if (apt.status === 'booked') {
                    <div class="inline-addon-wrapper">
                      <button 
                        type="button" 
                        class="btn-inline-addon" 
                        (click)="toggleInlineAddon(apt.id)">
                        + Quick Add-on
                      </button>
                      @if (inlineAddonOpenAptId() === apt.id) {
                        <div class="inline-addon-popover">
                          <select #inlineSrvSelect class="form-control select-xs">
                            @for (s of servicesList(); track s.id) {
                              <option [value]="s.id">{{ s.name }} (₹{{ s.price }})</option>
                            }
                          </select>
                          <button 
                            type="button" 
                            class="btn btn-primary btn-xs" 
                            (click)="addQuickAddon(apt.id, inlineSrvSelect.value)">
                            Add
                          </button>
                          <button 
                            type="button" 
                            class="btn btn-ghost btn-xs" 
                            (click)="toggleInlineAddon(apt.id)">
                            ✕
                          </button>
                        </div>
                      }
                    </div>
                  }
                </div>

                <div class="charges-summary-row">
                  <div class="charges-price-group">
                    <span class="charges-label">Total Charges:</span>
                    <span class="charges-amount">₹{{ apt.totalPrice || apt.service.price }}</span>

                    <!-- Feature 2.2: Visual Price Adjustment Diff -->
                    @if (hasPriceAdjustment(apt)) {
                      <div class="price-diff-badge" [class.discount]="apt.totalPrice! < getCatalogTotal(apt)" [class.extra]="apt.totalPrice! > getCatalogTotal(apt)">
                        <span class="diff-original">Catalog: ₹{{ getCatalogTotal(apt) }}</span>
                        <span class="diff-arrow">→</span>
                        <strong class="diff-final">₹{{ apt.totalPrice }}</strong>
                        <span class="diff-tag">
                          {{ apt.totalPrice! < getCatalogTotal(apt) ? '(-₹' + (getCatalogTotal(apt) - apt.totalPrice!) + ' Discount)' : '(+₹' + (apt.totalPrice! - getCatalogTotal(apt)) + ' Extra)' }}
                        </span>
                      </div>
                    }
                  </div>
                  @if (apt.customPriceNote) {
                    <span class="charges-note">• {{ apt.customPriceNote }}</span>
                  }
                </div>
              </div>

              <!-- LINE 4: STYLIST ASSIGNMENT & AUDIT LOG -->
              <div class="staff-assignment-box">
                <div class="staff-assignment-header">
                  <span class="assignment-label">Stylist{{ apt.assignedStaff.length > 1 ? 's' : '' }}:</span>
                  @if (apt.bookedByStaffName) {
                    <span class="audit-sub">Booked by: {{ apt.bookedByStaffName }}</span>
                  }
                </div>

                @if (apt.assignedStaff.length > 0) {
                  <div class="assigned-staff-info">
                    <div class="staff-badge">
                      <span class="stylist-icon">✂</span>
                      <strong>
                        @if (adminService.isStaff()) {
                          @if (apt.assignedStaff.length === 1) {
                            Assigned to You
                          } @else {
                            Assigned to You & {{ getOtherStylists(apt.assignedStaff) }}
                          }
                        } @else {
                          {{ getStylistNames(apt.assignedStaff) }}
                        }
                      </strong>
                    </div>

                    @if (adminService.isSuperadmin()) {
                      <button 
                        type="button" 
                        class="btn btn-ghost btn-sm reassign-btn" 
                        (click)="openReviewModal(apt)">
                        Manage Stylists & Charges ({{ apt.assignedStaff.length }})
                      </button>
                    }
                  </div>
                } @else {
                  <div class="unassigned-prompt">
                    <span class="unassigned-warning-tag">⚠️ Unassigned</span>
                    @if (adminService.isSuperadmin()) {
                      <button 
                        type="button" 
                        class="btn btn-primary btn-sm assign-cta-btn" 
                        (click)="openReviewModal(apt)">
                        Assign Stylist Now
                      </button>
                    } @else {
                      <span class="staff-pending-note">Pending Superadmin Assignment</span>
                    }
                  </div>
                }
              </div>

              <!-- LINE 5: ACTION BAR (STATUS BUTTONS + OWNER REVIEW CONTROLS) -->
              <div class="apt-actions-row">
                <div class="action-buttons-group">
                  @if (apt.status === 'booked') {
                    <button 
                      type="button" 
                      class="btn btn-ghost btn-sm complete-btn" 
                      title="Mark as Completed"
                      (click)="updateStatus(apt, 'completed')">
                      ✓ Complete
                    </button>
                    @if (adminService.isSuperadmin()) {
                      <button 
                        type="button" 
                        class="btn btn-ghost btn-sm cancel-btn" 
                        title="Cancel Appointment"
                        (click)="updateStatus(apt, 'cancelled')">
                        Cancel
                      </button>
                    }
                    <button 
                      type="button" 
                      class="btn btn-ghost btn-sm noshow-btn" 
                      title="Mark as No Show"
                      (click)="updateStatus(apt, 'no_show')">
                      No-Show
                    </button>
                  } @else if (apt.status === 'completed') {
                    <span class="status-note completed-note">✓ Service Completed</span>
                  } @else if (apt.status === 'cancelled') {
                    <span class="status-note cancelled-note">Cancelled</span>
                  } @else if (apt.status === 'no_show') {
                    <span class="status-note noshow-note">Client No-Show</span>
                  }
                </div>

                <!-- Superadmin Edit & Owner Approval Actions -->
                @if (adminService.isSuperadmin()) {
                  <div class="superadmin-card-actions">
                    @if (apt.ownerApprovalStatus === 'pending') {
                      <button 
                        type="button" 
                        class="btn btn-sm btn-outline approve-quick-btn" 
                        title="Approve this booking" 
                        (click)="approveBooking(apt)">
                        ✓ Approve
                      </button>
                    }
                    <button 
                      type="button" 
                      class="action-icon-btn edit-icon" 
                      title="Review & Edit Charges / Services" 
                      (click)="openReviewModal(apt)">
                      ✎
                    </button>
                    <button 
                      type="button" 
                      class="action-icon-btn delete-icon" 
                      title="Delete Booking" 
                      (click)="confirmDelete(apt)">
                      🗑
                    </button>
                  </div>
                }
              </div>

              <!-- Feature 3.1: Progressive Disclosure / Expandable Details -->
              <div class="card-details-toggle-row">
                <button type="button" class="btn-toggle-details" (click)="toggleCardDetails(apt.id)">
                  {{ isCardExpanded(apt.id) ? '▲ Hide Full Audit Details' : '▼ View Audit & Details' }}
                </button>
              </div>

              @if (isCardExpanded(apt.id)) {
                <div class="apt-expanded-details">
                  <div class="detail-row">
                    <span class="detail-lbl">Booking Reference:</span>
                    <span class="detail-val font-mono">{{ apt.referenceNumber }}</span>
                  </div>
                  @if (apt.createdAt) {
                    <div class="detail-row">
                      <span class="detail-lbl">Created At:</span>
                      <span class="detail-val">{{ formatDateTime(apt.createdAt) }}</span>
                    </div>
                  }
                  @if (apt.statusChangedBy) {
                    <div class="detail-row">
                      <span class="detail-lbl">Status Changed By:</span>
                      <span class="detail-val">{{ apt.statusChangedBy }}</span>
                    </div>
                  }
                  @if (apt.ownerReviewedAt) {
                    <div class="detail-row">
                      <span class="detail-lbl">Owner Approved At:</span>
                      <span class="detail-val">{{ formatDateTime(apt.ownerReviewedAt) }}</span>
                    </div>
                  }
                  @if (apt.notes) {
                    <div class="detail-row">
                      <span class="detail-lbl">Booking Notes:</span>
                      <span class="detail-val">{{ apt.notes }}</span>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- 1. REVIEW, CHARGES & SERVICES MODAL (SUPERADMIN ONLY) -->
      @if (reviewingAppointment(); as apt) {
        <div class="modal-backdrop" (click)="closeReviewModal()">
          <div class="croppers-card modal-card review-modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <h3 class="modal-title">Review & Edit Booking</h3>
                <span class="modal-sub-ref">{{ apt.referenceNumber }} • Guest: <strong>{{ apt.customer.name }}</strong></span>
              </div>
              <button type="button" class="close-modal-btn" (click)="closeReviewModal()">✕</button>
            </div>

            <div class="review-modal-body">
              <!-- Customer Summary -->
              <div class="review-section-box">
                <span class="review-section-heading">Customer Information</span>
                <div class="review-cust-row">
                  <span><strong>{{ apt.customer.name }}</strong></span>
                  <span>+91 {{ apt.customer.phone }}</span>
                  <span class="source-pill" [class.walkin]="apt.bookingSource === 'walk_in'" [class.phone]="apt.bookingSource === 'phone_call'">
                    {{ apt.bookingSource === 'phone_call' ? '📞 Phone Booking' : (apt.bookingSource === 'walk_in' ? '🚶 Walk-in' : '🌐 Online') }}
                  </span>
                </div>
              </div>

              <!-- Services Breakdown: Add & Delete Services -->
              <div class="review-section-box">
                <div class="review-section-header-flex">
                  <span class="review-section-heading">Services in this Booking</span>
                  <span class="review-duration-tag">{{ reviewTotalDuration() }}m duration</span>
                </div>

                <div class="review-services-list">
                  @for (srv of reviewServices(); track $index) {
                    <div class="review-srv-row">
                      <div class="srv-row-info">
                        <strong class="srv-row-name">{{ srv.name }}</strong>
                        <span class="srv-meta">{{ srv.durationMinutes }}m • Standard: ₹{{ srv.price }}</span>
                      </div>
                      <button 
                        type="button" 
                        class="btn-remove-srv" 
                        title="Remove service"
                        [disabled]="reviewServices().length <= 1"
                        (click)="removeServiceFromReview($index)">
                        ✕ Remove
                      </button>
                    </div>
                  }
                </div>

                <!-- Add Service Row -->
                <div class="add-service-input-row">
                  <select #serviceToAddSelect class="form-control select-add-srv">
                    @for (catSrv of servicesList(); track catSrv.id) {
                      <option [value]="catSrv.id">{{ catSrv.name }} ({{ catSrv.duration_minutes }}m — ₹{{ catSrv.price }})</option>
                    }
                  </select>
                  <button 
                    type="button" 
                    class="btn btn-outline btn-sm add-srv-btn" 
                    (click)="addServiceToReview(serviceToAddSelect.value)">
                    + Add Service
                  </button>
                </div>
              </div>

              <!-- Charges & Pricing Override -->
              <div class="review-section-box charges-edit-box">
                <span class="review-section-heading">Pricing & Charges</span>
                
                <!-- Quick Modifiers (Feature 4.1) -->
                <div class="quick-discount-row">
                  <span class="quick-disc-label">Quick Modifiers:</span>
                  <button type="button" class="btn-disc-chip" (click)="applyQuickDiscount(10)">-10%</button>
                  <button type="button" class="btn-disc-chip" (click)="applyQuickDiscount(15)">-15%</button>
                  <button type="button" class="btn-disc-chip" (click)="applyQuickDiscount(20)">-20%</button>
                  <button type="button" class="btn-disc-chip" (click)="applyRoundTo50()">Round ₹50</button>
                  <button type="button" class="btn-disc-chip reset" (click)="resetToCatalogPrice()">Reset to Catalog</button>
                </div>

                <div class="charges-edit-grid">
                  <div class="form-group">
                    <label class="form-label">Final Amount / Charges (₹) *</label>
                    <input 
                      type="number" 
                      class="form-control price-edit-input" 
                      [value]="reviewFinalPrice()" 
                      (input)="onFinalPriceChange($event)"
                      min="0">

                    <!-- Live Price Diff Chip (Feature 2.2) -->
                    @if (reviewFinalPrice() !== reviewCatalogPrice()) {
                      <div class="review-price-diff-chip" [class.discount]="reviewFinalPrice() < reviewCatalogPrice()" [class.extra]="reviewFinalPrice() > reviewCatalogPrice()">
                        Catalog: ₹{{ reviewCatalogPrice() }} → Final: ₹{{ reviewFinalPrice() }}
                        ({{ reviewFinalPrice() < reviewCatalogPrice() ? '-₹' + (reviewCatalogPrice() - reviewFinalPrice()) + ' Discount' : '+₹' + (reviewFinalPrice() - reviewCatalogPrice()) + ' Extra' }})
                      </div>
                    } @else {
                      <span class="field-hint">Matches standard catalog total (₹{{ reviewCatalogPrice() }}).</span>
                    }
                  </div>
                  <div class="form-group">
                    <label class="form-label">Price Adjustment Reason / Note (Optional)</label>
                    <input 
                      type="text" 
                      class="form-control" 
                      placeholder="e.g. 10% Courtesy Discount, VIP Courtesy, Extra Styling"
                      [value]="reviewPriceNote()" 
                      (input)="onPriceNoteChange($event)">
                  </div>
                </div>
              </div>

              <!-- Assign / Manage Stylists -->
              <div class="review-section-box">
                <span class="review-section-heading">Assigned Stylists</span>
                <div class="staff-options-list">
                  @for (staff of staffList(); track staff.id) {
                    <div 
                      class="staff-option-card" 
                      [class.current]="isStaffSelectedInReview(staff.id)"
                      (click)="toggleStaffInReview(staff)">
                      <div class="staff-option-avatar">{{ staff.name.charAt(0) }}</div>
                      <div class="staff-option-info">
                        <span class="name">{{ staff.name }}</span>
                        <span class="role">{{ staff.role }}</span>
                      </div>
                      <button 
                        type="button" 
                        class="btn btn-sm"
                        [class.btn-primary]="isStaffSelectedInReview(staff.id)"
                        [class.btn-outline]="!isStaffSelectedInReview(staff.id)">
                        {{ isStaffSelectedInReview(staff.id) ? '✓ Assigned' : '+ Add' }}
                      </button>
                    </div>
                  }
                </div>
              </div>

              <!-- Owner Approval Checkbox -->
              <div class="approval-toggle-box">
                <label class="approval-toggle-label">
                  <input 
                    type="checkbox" 
                    [checked]="reviewApproveNow()" 
                    (change)="toggleApproveNow($event)">
                  <span><strong>Mark Approved by Owner</strong> (Sets End-of-Day status to Approved)</span>
                </label>
              </div>
            </div>

            <div class="modal-footer modal-actions-row">
              <button type="button" class="btn btn-ghost" (click)="closeReviewModal()">Cancel</button>
              <button 
                type="button" 
                class="btn btn-primary" 
                (click)="saveReviewedAppointment(apt)">
                Save Changes & Updates
              </button>
            </div>
          </div>
        </div>
      }

      <!-- 2. BOOK WALK-IN / PHONE CLIENT MODAL (SUPERADMIN & STAFF) -->
      @if (isWalkinModalOpen()) {
        <div class="modal-backdrop" (click)="closeWalkinModal()">
          <div class="croppers-card modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title">Book Walk-in / Phone Client</h3>
              <button type="button" class="close-modal-btn" (click)="closeWalkinModal()">✕</button>
            </div>

            <form [formGroup]="walkinForm" (ngSubmit)="saveWalkinBooking()" class="walkin-form">
              <!-- Booking Type Toggle -->
              <div class="booking-type-toggle">
                <label class="radio-label">
                  <input type="radio" formControlName="bookingSource" value="walk_in">
                  <span>🚶 Walk-in Guest</span>
                </label>
                <label class="radio-label">
                  <input type="radio" formControlName="bookingSource" value="phone_call">
                  <span>📞 Phone Call Booking</span>
                </label>
              </div>

              <div class="form-group">
                <label class="form-label">Guest Full Name *</label>
                <input type="text" formControlName="customerName" class="form-control" placeholder="e.g. Ramesh Patel">
              </div>

              <div class="form-group">
                <label class="form-label">Phone Number (10 Digits) *</label>
                <input type="tel" formControlName="customerPhone" class="form-control" placeholder="9826123456" maxlength="10">
              </div>

              <div class="form-group">
                <label class="form-label">Select Treatment *</label>
                <select formControlName="serviceId" class="form-control">
                  @for (srv of servicesList(); track srv.id) {
                    <option [value]="srv.id">{{ srv.name }} ({{ srv.duration_minutes }}m — ₹{{ srv.price }})</option>
                  }
                </select>
              </div>

              <div class="form-row">
                <div class="form-group col-half">
                  <label class="form-label">Date *</label>
                  <input type="date" formControlName="date" class="form-control">
                </div>
                <div class="form-group col-half">
                  <label class="form-label">Time Slot *</label>
                  <select formControlName="startTime" class="form-control">
                    <option value="10:00">10:00 AM</option>
                    <option value="10:30">10:30 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="11:30">11:30 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="12:30">12:30 PM</option>
                    <option value="13:00">01:00 PM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="15:00">03:00 PM</option>
                    <option value="16:00">04:00 PM</option>
                    <option value="17:00">05:00 PM</option>
                    <option value="18:00">06:00 PM</option>
                    <option value="19:00">07:00 PM</option>
                  </select>
                </div>
              </div>

              <!-- Stylist Assignment -->
              @if (adminService.isSuperadmin()) {
                <div class="form-group">
                  <label class="form-label">Assign Stylist (Optional)</label>
                  <select formControlName="staffId" class="form-control">
                    <option value="">Leave Unassigned (Assign Later)</option>
                    @for (st of staffList(); track st.id) {
                      <option [value]="st.id">{{ st.name }} ({{ st.role }})</option>
                    }
                  </select>
                </div>
              } @else {
                <div class="staff-assignment-notice">
                  <span>Assigned to your station: <strong>{{ currentStaffName() }}</strong></span>
                  <span class="notice-sub">This client will be tagged as Walk-in/Phone and submitted for Owner's review.</span>
                </div>
              }

              <div class="modal-footer">
                <button type="button" class="btn btn-ghost" (click)="closeWalkinModal()">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="walkinForm.invalid">
                  Create Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- 3. DELETE CONFIRMATION MODAL (SUPERADMIN ONLY) -->
      @if (deletingAppointment(); as aptToDelete) {
        <div class="modal-backdrop" (click)="cancelDelete()">
          <div class="croppers-card modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title">Delete Booking</h3>
              <button type="button" class="close-modal-btn" (click)="cancelDelete()">✕</button>
            </div>
            <p class="delete-warning">
              Are you sure you want to permanently delete appointment <strong>{{ aptToDelete.referenceNumber }}</strong> for <strong>{{ aptToDelete.customer.name }}</strong>?
            </p>
            <div class="modal-footer">
              <button type="button" class="btn btn-ghost" (click)="cancelDelete()">Cancel</button>
              <button type="button" class="btn btn-primary delete-confirm-btn" (click)="executeDelete(aptToDelete)">
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './admin-appointments.component.css'
})
export class AdminAppointmentsComponent implements OnInit {
  readonly adminService = inject(AdminService);
  private readonly fb = inject(FormBuilder);

  @ViewChild('universalSearchInput') searchInputRef?: ElementRef<HTMLInputElement>;

  readonly appointments = signal<AdminAppointment[]>([]);
  readonly staffList = signal<StaffMember[]>([]);
  readonly servicesList = signal<SalonService[]>([]);

  readonly selectedDateMode = signal<'today' | 'tomorrow' | 'all' | 'custom'>('all');
  readonly selectedCustomDate = signal<string>(new Date().toISOString().split('T')[0]);
  readonly selectedStatus = signal<'all' | 'booked' | 'completed' | 'cancelled' | 'no_show'>('all');
  readonly unassignedOnly = signal<boolean>(false);
  readonly selectedStaffId = signal<string>('');

  // Feature 6.1, 2.1, 3.1 & 4.2 Signals
  readonly searchQuery = signal<string>('');
  readonly exceptionsOnly = signal<boolean>(false);
  readonly expandedCardIds = signal<Set<string>>(new Set());
  readonly inlineAddonOpenAptId = signal<string | null>(null);

  @HostListener('window:keydown', ['$event'])
  handleGlobalKeyDown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.focusSearch();
    }
  }

  readonly currentStaffMember = computed(() => {
    const staffId = this.adminService.currentStaffId();
    return this.staffList().find(s => s.id === staffId);
  });

  readonly currentStaffName = computed(() => {
    return this.currentStaffMember()?.name || this.adminService.currentUser()?.name || 'Stylist';
  });

  // Review & Edit Modal state (Requirement 2)
  readonly reviewingAppointment = signal<AdminAppointment | null>(null);
  readonly reviewServices = signal<AppointmentServiceItem[]>([]);
  readonly reviewFinalPrice = signal<number>(0);
  readonly reviewPriceNote = signal<string>('');
  readonly reviewAssignedStaff = signal<StaffMember[]>([]);
  readonly reviewApproveNow = signal<boolean>(true);

  readonly reviewTotalDuration = computed(() =>
    this.reviewServices().reduce((sum, s) => sum + s.durationMinutes, 0)
  );

  readonly reviewCatalogPrice = computed(() =>
    this.reviewServices().reduce((sum, s) => sum + s.price, 0)
  );

  // Walk-in modal state
  readonly isWalkinModalOpen = signal<boolean>(false);
  readonly deletingAppointment = signal<AdminAppointment | null>(null);
  readonly actionFeedback = signal<string | null>(null);

  walkinForm: FormGroup = this.fb.group({
    bookingSource: ['walk_in', [Validators.required]],
    customerName: ['', [Validators.required, Validators.minLength(2)]],
    customerPhone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
    serviceId: ['', [Validators.required]],
    date: [new Date().toISOString().split('T')[0], [Validators.required]],
    startTime: ['11:00', [Validators.required]],
    staffId: [''],
    notes: ['']
  });

  async ngOnInit(): Promise<void> {
    await this.refreshData();
  }

  async refreshData(): Promise<void> {
    const [staff, apts, services] = await Promise.all([
      this.adminService.getStaffMembers(),
      this.adminService.getAppointments(),
      this.adminService.getServices()
    ]);
    this.staffList.set(staff);
    this.appointments.set(apts);
    this.servicesList.set(services);

    if (services.length > 0 && !this.walkinForm.get('serviceId')?.value) {
      this.walkinForm.patchValue({ serviceId: services[0].id });
    }
  }

  readonly unassignedCount = computed(() =>
    this.appointments().filter(a => a.assignedStaff.length === 0 && a.status === 'booked').length
  );

  readonly filteredAppointments = computed(() => {
    let list = this.appointments();

    const mode = this.selectedDateMode();
    const todayStr = this.getTodayIso();
    const tomorrowStr = this.getTomorrowIso();

    if (mode === 'today') {
      list = list.filter(a => a.date === todayStr);
    } else if (mode === 'tomorrow') {
      list = list.filter(a => a.date === tomorrowStr);
    } else if (mode === 'custom' && this.selectedCustomDate()) {
      list = list.filter(a => a.date === this.selectedCustomDate());
    }

    const status = this.selectedStatus();
    if (status !== 'all') {
      list = list.filter(a => a.status === status);
    }

    if (this.adminService.isSuperadmin()) {
      if (this.unassignedOnly()) {
        list = list.filter(a => a.assignedStaff.length === 0 && a.status === 'booked');
      }
      if (this.selectedStaffId()) {
        list = list.filter(a => a.assignedStaff.some(s => s.id === this.selectedStaffId()));
      }
    }

    // Feature 2.1: Exceptions & Pending Only Filter
    if (this.exceptionsOnly()) {
      list = list.filter(a =>
        a.ownerApprovalStatus === 'pending' ||
        a.bookingSource === 'walk_in' ||
        a.bookingSource === 'phone_call' ||
        !!a.customPriceNote ||
        this.hasPriceAdjustment(a) ||
        (a.status !== 'booked')
      );
    }

    // Feature 6.1: Universal Instant Search
    const q = this.searchQuery().trim().toLowerCase();
    if (q) {
      list = list.filter(a =>
        a.customer.name.toLowerCase().includes(q) ||
        a.customer.phone.includes(q) ||
        a.referenceNumber.toLowerCase().includes(q)
      );
    }

    return list;
  });

  // End-of-Day Review Stats with Cash vs Digital breakdown (Requirement 1 & Feature 2.3)
  readonly dayReviewStats = computed(() => {
    const list = this.filteredAppointments();
    const totalBookings = list.length;
    const completed = list.filter(a => a.status === 'completed').length;
    const walkinOrPhone = list.filter(a => a.bookingSource === 'walk_in' || a.bookingSource === 'phone_call').length;
    const pendingReview = list.filter(a => a.ownerApprovalStatus === 'pending').length;
    const approvedCount = list.filter(a => a.ownerApprovalStatus === 'approved').length;
    const totalRevenue = list.filter(a => a.status === 'completed').reduce((sum, a) => sum + (a.totalPrice || a.service.price || 0), 0);

    // Feature 2.3: Cash vs Digital Settlement
    const completedList = list.filter(a => a.status === 'completed');
    const cashTotal = completedList
      .filter(a => a.paymentMethod === 'cash' || (!a.paymentMethod && a.bookingSource === 'walk_in'))
      .reduce((sum, a) => sum + (a.totalPrice || a.service.price || 0), 0);
    const digitalTotal = completedList
      .filter(a => a.paymentMethod === 'upi' || a.paymentMethod === 'card' || (!a.paymentMethod && a.bookingSource !== 'walk_in'))
      .reduce((sum, a) => sum + (a.totalPrice || a.service.price || 0), 0);

    return { totalBookings, completed, walkinOrPhone, pendingReview, approvedCount, totalRevenue, cashTotal, digitalTotal };
  });

  setDateMode(mode: 'today' | 'tomorrow' | 'all'): void {
    this.selectedDateMode.set(mode);
  }

  onCustomDateChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    if (val) {
      this.selectedCustomDate.set(val);
      this.selectedDateMode.set('custom');
    }
  }

  setStatusFilter(status: 'all' | 'booked' | 'completed' | 'cancelled' | 'no_show'): void {
    this.selectedStatus.set(status);
  }

  toggleUnassigned(event: Event): void {
    this.unassignedOnly.set((event.target as HTMLInputElement).checked);
  }

  onStaffFilterChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedStaffId.set(val);
  }

  resetFilters(): void {
    this.selectedDateMode.set('all');
    this.selectedStatus.set('all');
    this.unassignedOnly.set(false);
    this.selectedStaffId.set('');
  }

  // Owner Review & Approval: Approve individual booking
  async approveBooking(apt: AdminAppointment): Promise<void> {
    if (!this.adminService.isSuperadmin()) return;
    const success = await this.adminService.approveAppointment(apt.id);
    if (success) {
      await this.refreshData();
      this.showToast(`Approved booking ${apt.referenceNumber} for ${apt.customer.name}.`);
    }
  }

  // Owner Review & Approval: "Approve All" for the day
  async approveAllForDay(): Promise<void> {
    if (!this.adminService.isSuperadmin()) return;
    const activeDate = this.selectedDateMode() === 'today' ? this.getTodayIso() : (this.selectedDateMode() === 'tomorrow' ? this.getTomorrowIso() : undefined);
    const res = await this.adminService.approveAllAppointmentsForDate(activeDate);
    await this.refreshData();
    this.showToast(`All ${res.count} pending bookings and transactions approved by Owner.`);
  }

  // Review & Edit Modal (Requirement 2)
  openReviewModal(apt: AdminAppointment): void {
    if (!this.adminService.isSuperadmin()) return;
    const serviceList = apt.services && apt.services.length > 0
      ? apt.services
      : [{
          id: apt.service.id,
          name: apt.service.name,
          durationMinutes: apt.service.durationMinutes,
          price: apt.service.price,
          categoryName: apt.service.categoryName
        }];

    this.reviewServices.set([...serviceList]);
    this.reviewFinalPrice.set(apt.totalPrice !== undefined ? apt.totalPrice : apt.service.price);
    this.reviewPriceNote.set(apt.customPriceNote || '');
    this.reviewAssignedStaff.set([...apt.assignedStaff]);
    this.reviewApproveNow.set(apt.ownerApprovalStatus === 'approved');
    this.reviewingAppointment.set(apt);
  }

  closeReviewModal(): void {
    this.reviewingAppointment.set(null);
  }

  removeServiceFromReview(index: number): void {
    const current = this.reviewServices();
    if (current.length <= 1) return; // Keep at least one service
    const updated = current.filter((_, i) => i !== index);
    this.reviewServices.set(updated);
    this.reviewFinalPrice.set(updated.reduce((sum, s) => sum + s.price, 0));
  }

  addServiceToReview(serviceId: string): void {
    const found = this.servicesList().find(s => s.id === serviceId);
    if (!found) return;

    const newItem: AppointmentServiceItem = {
      id: found.id,
      name: found.name,
      durationMinutes: found.duration_minutes,
      price: found.price,
      categoryName: found.category_name
    };

    const updated = [...this.reviewServices(), newItem];
    this.reviewServices.set(updated);
    this.reviewFinalPrice.set(this.reviewFinalPrice() + found.price);
  }

  onFinalPriceChange(event: Event): void {
    const val = parseFloat((event.target as HTMLInputElement).value);
    this.reviewFinalPrice.set(isNaN(val) ? 0 : val);
  }

  onPriceNoteChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.reviewPriceNote.set(val);
  }

  isStaffSelectedInReview(staffId: string): boolean {
    return this.reviewAssignedStaff().some(s => s.id === staffId);
  }

  toggleStaffInReview(staff: StaffMember): void {
    const current = this.reviewAssignedStaff();
    if (current.some(s => s.id === staff.id)) {
      this.reviewAssignedStaff.set(current.filter(s => s.id !== staff.id));
    } else {
      this.reviewAssignedStaff.set([...current, staff]);
    }
  }

  toggleApproveNow(event: Event): void {
    this.reviewApproveNow.set((event.target as HTMLInputElement).checked);
  }

  async saveReviewedAppointment(apt: AdminAppointment): Promise<void> {
    if (!this.adminService.isSuperadmin()) return;
    const res = await this.adminService.reviewAndEditAppointment(apt.id, {
      services: this.reviewServices(),
      finalPrice: this.reviewFinalPrice(),
      priceAdjustmentNote: this.reviewPriceNote(),
      assignedStaff: this.reviewAssignedStaff(),
      approveNow: this.reviewApproveNow()
    });

    if (res) {
      await this.refreshData();
      this.showToast(`Updated charges, services & stylists for ${apt.customer.name}.`);
      this.closeReviewModal();
    }
  }

  getStylistNames(staffList: StaffMember[]): string {
    if (!staffList || staffList.length === 0) return 'Unassigned';
    return staffList.map(s => s.name).join(', ');
  }

  getOtherStylists(staffList: StaffMember[]): string {
    const myId = this.adminService.currentStaffId();
    const others = staffList.filter(s => s.id !== myId);
    return others.map(s => s.name).join(', ');
  }

  // Walk-in / Phone Booking (Superadmin & Staff)
  openWalkinModal(): void {
    this.isWalkinModalOpen.set(true);
    if (this.adminService.isStaff()) {
      const myStaffId = this.adminService.currentStaffId();
      if (myStaffId) {
        this.walkinForm.patchValue({ staffId: myStaffId });
      }
    }
  }

  closeWalkinModal(): void {
    this.isWalkinModalOpen.set(false);
  }

  async saveWalkinBooking(): Promise<void> {
    if (this.walkinForm.invalid) return;

    const val = this.walkinForm.value;
    const newApt = await this.adminService.createManualAppointment(val);
    await this.refreshData();
    this.showToast(`Created booking ${newApt.referenceNumber} for ${val.customerName}.`);
    this.closeWalkinModal();
  }

  // Delete Appointment (Superadmin Only)
  confirmDelete(apt: AdminAppointment): void {
    if (!this.adminService.isSuperadmin()) return;
    this.deletingAppointment.set(apt);
  }

  cancelDelete(): void {
    this.deletingAppointment.set(null);
  }

  async executeDelete(apt: AdminAppointment): Promise<void> {
    await this.adminService.deleteAppointment(apt.id);
    this.showToast(`Deleted booking ${apt.referenceNumber}.`);
    this.deletingAppointment.set(null);
    await this.refreshData();
  }

  // Status Update (Allowed for both roles)
  async updateStatus(
    apt: AdminAppointment,
    status: 'booked' | 'completed' | 'cancelled' | 'no_show'
  ): Promise<void> {
    const success = await this.adminService.updateAppointmentStatus(apt.id, status);
    if (success) {
      await this.refreshData();
      this.showToast(`Appointment ${apt.referenceNumber} marked as ${status}.`);
    }
  }

  private showToast(msg: string): void {
    this.actionFeedback.set(msg);
    setTimeout(() => {
      this.actionFeedback.set(null);
    }, 3500);
  }

  formatTime12(timeStr: string): string {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    let hour = parseInt(parts[0], 10);
    const minute = parts[1] || '00';
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${hour}:${minute} ${ampm}`;
  }

  // Feature 6.1: Search Helpers
  onSearchInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    if (this.searchInputRef) {
      this.searchInputRef.nativeElement.value = '';
      this.searchInputRef.nativeElement.focus();
    }
  }

  focusSearch(): void {
    if (this.searchInputRef) {
      this.searchInputRef.nativeElement.focus();
      this.searchInputRef.nativeElement.select();
    }
  }

  // Feature 2.1: Exceptions Filter Helper
  toggleExceptionsFilter(): void {
    this.exceptionsOnly.update(v => !v);
  }

  // Feature 2.2: Price Difference Calculation
  getCatalogTotal(apt: AdminAppointment): number {
    if (apt.services && apt.services.length > 0) {
      return apt.services.reduce((sum, s) => sum + s.price, 0);
    }
    return apt.service.price;
  }

  hasPriceAdjustment(apt: AdminAppointment): boolean {
    if (apt.totalPrice === undefined) return false;
    return apt.totalPrice !== this.getCatalogTotal(apt);
  }

  // Feature 3.1: Progressive Disclosure / Card Details
  toggleCardDetails(aptId: string): void {
    this.expandedCardIds.update(set => {
      const next = new Set(set);
      if (next.has(aptId)) {
        next.delete(aptId);
      } else {
        next.add(aptId);
      }
      return next;
    });
  }

  isCardExpanded(aptId: string): boolean {
    return this.expandedCardIds().has(aptId);
  }

  // Feature 4.2: Inline Add-on Service
  toggleInlineAddon(aptId: string): void {
    this.inlineAddonOpenAptId.update(current => (current === aptId ? null : aptId));
  }

  async addQuickAddon(aptId: string, srvId: string): Promise<void> {
    const res = await this.adminService.addQuickAddonService(aptId, srvId);
    if (res) {
      await this.refreshData();
      this.showToast(`Quick add-on service added to booking ${res.referenceNumber}.`);
      this.inlineAddonOpenAptId.set(null);
    }
  }

  // Feature 4.1: Quick Modifiers in Review Modal
  applyQuickDiscount(percent: number): void {
    const catalog = this.reviewCatalogPrice();
    const discounted = Math.round(catalog * (1 - percent / 100));
    this.reviewFinalPrice.set(discounted);
    this.reviewPriceNote.set(`${percent}% Owner Courtesy Discount`);
  }

  applyRoundTo50(): void {
    const current = this.reviewFinalPrice();
    const rounded = Math.round(current / 50) * 50;
    this.reviewFinalPrice.set(rounded);
  }

  resetToCatalogPrice(): void {
    this.reviewFinalPrice.set(this.reviewCatalogPrice());
    this.reviewPriceNote.set('');
  }

  formatDateTime(iso?: string): string {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return iso;
    }
  }

  private getTodayIso(): string {
    return new Date().toISOString().split('T')[0];
  }

  private getTomorrowIso(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }
}
