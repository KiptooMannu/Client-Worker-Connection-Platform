import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PlatformStateService } from '../../core/services/platform-state.service';
import { AuthService } from '../../core/services/auth.service';
import { NavbarComponent } from '../../shared/components/navbar';
import { NotificationService } from '../../core/services/notification.service';
import { JobOfferBanner } from '../../shared/components/job-offer-banner/job-offer-banner';

@Component({
  selector: 'app-worker-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatButtonModule,
    NavbarComponent,
    JobOfferBanner
  ],
  template: `
    <div class="min-h-screen bg-surface flex flex-col font-manrope">
      <app-navbar 
        [showHireTalent]="false" 
        pageTitle="Dashboard" 
        [badge]="worker().status">
      </app-navbar>

      <!-- Job Offer Banner -->
      @if (showJobOfferBanner()) {
        <app-job-offer-banner 
          [jobOffer]="latestJobOffer()!"
          (dismiss)="dismissJobOfferBanner()" 
        />
      }

      <div class="flex flex-1 overflow-hidden">
        <aside class="hidden lg:flex flex-col w-72 border-r border-outline-variant/30 bg-surface px-4 py-8 space-y-6 shrink-0">
          <nav class="space-y-1">
            <!-- Dashboard -->
            <a routerLink="dashboard" routerLinkActive="active-tab" class="flex items-center gap-4 px-5 py-4 rounded-xl text-on-surface-variant font-black text-xs uppercase tracking-widest hover:bg-surface-container-low transition-all group">
              <mat-icon class="group-[.active-tab]:text-brand-teal transition-colors flex items-center justify-center">dashboard</mat-icon>
              Dashboard
            </a>
            
            <!-- Profile -->
            <a routerLink="profile" routerLinkActive="active-tab" class="flex items-center gap-4 px-5 py-4 rounded-xl text-on-surface-variant font-black text-xs uppercase tracking-widest hover:bg-surface-container-low transition-all group relative">
              <mat-icon class="group-[.active-tab]:text-brand-teal transition-colors flex items-center justify-center">person</mat-icon>
              My Profile
              @if (!canSubmitForReview()) {
                <span class="ml-auto text-[8px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-black">{{ state.currentWorkerCompletion() }}%</span>
              } @else if (canSubmitForReview() && !isUnderReview()) {
                <span class="ml-auto text-[8px] bg-green-500 text-white px-1.5 py-0.5 rounded-full font-black">Ready ✓</span>
              }
            </a>
            
            <!-- Documents -->
            <div class="relative group">
              <a routerLink="verification" 
                 [class.pointer-events-none]="!canAccessDocuments()" 
                 [class.opacity-50]="!canAccessDocuments()"
                 routerLinkActive="active-tab" 
                 class="flex items-center gap-4 px-5 py-4 rounded-xl text-on-surface-variant font-black text-xs uppercase tracking-widest hover:bg-surface-container-low transition-all group">
                <mat-icon class="group-[.active-tab]:text-brand-teal transition-colors flex items-center justify-center">verified_user</mat-icon>
                Documents
                @if (!canAccessDocuments()) {
                  <mat-icon class="ml-auto !text-sm text-amber-500 flex items-center justify-center">lock</mat-icon>
                } @else if (hasDocumentsToUpload()) {
                  <span class="ml-auto text-[8px] bg-brand-teal text-white px-1.5 py-0.5 rounded-full font-black">{{ pendingDocumentsCount() }}</span>
                }
              </a>
              @if (!canAccessDocuments()) {
                <div class="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-20 hidden group-hover:block">
                  <div class="bg-slate-900 text-white text-[10px] font-black px-3 py-2 rounded-lg whitespace-nowrap shadow-xl">
                    Add your name and trade category first
                    <div class="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                  </div>
                </div>
              }
            </div>
            
            <!-- My Jobs -->
            <div class="relative group">
              <a routerLink="history" 
                 [class.pointer-events-none]="!canAccessJobs()" 
                 [class.opacity-50]="!canAccessJobs()"
                 routerLinkActive="active-tab" 
                 class="flex items-center gap-4 px-5 py-4 rounded-xl text-on-surface-variant font-black text-xs uppercase tracking-widest hover:bg-surface-container-low transition-all group">
                <mat-icon class="group-[.active-tab]:text-brand-teal transition-colors flex items-center justify-center">work_history</mat-icon>
                My Jobs
                @if (!canAccessJobs()) {
                  <mat-icon class="ml-auto !text-sm text-amber-500 flex items-center justify-center">lock</mat-icon>
                } @else if (pendingJobsCount() > 0) {
                  <span class="ml-auto text-[8px] bg-brand-teal text-white px-1.5 py-0.5 rounded-full font-black">{{ pendingJobsCount() }}</span>
                }
              </a>
              @if (!canAccessJobs()) {
                <div class="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-20 hidden group-hover:block">
                  <div class="bg-slate-900 text-white text-[10px] font-black px-3 py-2 rounded-lg whitespace-nowrap shadow-xl">
                    Complete profile + upload documents + get verified first
                    <div class="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                  </div>
                </div>
              }
            </div>
            
            <!-- Messages -->
            <a routerLink="messages" 
               [class.pointer-events-none]="!canAccessMessages()" 
               [class.opacity-50]="!canAccessMessages()"
               routerLinkActive="active-tab" 
               class="flex items-center gap-4 px-5 py-4 rounded-xl text-on-surface-variant font-black text-xs uppercase tracking-widest hover:bg-surface-container-low transition-all group">
              <mat-icon class="group-[.active-tab]:text-brand-teal transition-colors flex items-center justify-center">chat</mat-icon>
              Messages
              @if (state.unreadMessagesCount() > 0 && canAccessMessages()) {
                <span class="ml-auto text-[8px] bg-brand-teal text-white px-1.5 py-0.5 rounded-full font-black">{{ state.unreadMessagesCount() }}</span>
              }
            </a>
            
            <!-- Settings -->
            <a routerLink="settings" routerLinkActive="active-tab" class="flex items-center gap-4 px-5 py-4 rounded-xl text-on-surface-variant font-black text-xs uppercase tracking-widest hover:bg-surface-container-low transition-all group">
              <mat-icon class="group-[.active-tab]:text-brand-teal transition-colors flex items-center justify-center">settings</mat-icon>
              Settings
            </a>
          </nav>

          <!-- ONBOARDING PROGRESS CARD - WITH COLLAPSE/EXPAND -->
          @if (!isApproved()) {
            <div class="mx-3 mt-4 p-4 rounded-xl" [ngClass]="hasMinimumProfile() ? 'bg-brand-teal/10 border border-brand-teal/20' : 'bg-amber-50 border border-amber-200'">
              <!-- Collapsible Header -->
              <div class="flex items-center justify-between cursor-pointer mb-3" (click)="toggleProgressCard()">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center" [ngClass]="hasMinimumProfile() ? 'bg-brand-teal text-white' : 'bg-amber-500 text-white'">
                    <mat-icon class="!text-sm flex items-center justify-center">{{ hasMinimumProfile() ? 'checklist' : 'assignment' }}</mat-icon>
                  </div>
                  <div>
                    <p class="text-[10px] font-black uppercase tracking-wider" [ngClass]="hasMinimumProfile() ? 'text-brand-teal' : 'text-amber-800'">
                      Step {{ currentStep() }} of 4
                    </p>
                    <p class="text-[11px] font-black" [ngClass]="hasMinimumProfile() ? 'text-brand-teal' : 'text-amber-800'">
                      {{ getStepTitle() }}
                    </p>
                  </div>
                </div>
                <mat-icon class="!text-sm transition-transform" [class.rotate-180]="isProgressCardExpanded()">
                  expand_more
                </mat-icon>
              </div>
              
              <!-- Collapsible Content -->
              @if (isProgressCardExpanded()) {
                <div class="animate-in slide-in-from-top duration-200">
                  <!-- Progress Steps -->
                  <div class="space-y-3">
                    <div class="flex items-center gap-3">
                      <div class="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black" 
                           [ngClass]="hasMinimumProfile() ? 'bg-brand-teal text-white' : 'bg-amber-500 text-white'">
                        {{ hasMinimumProfile() ? '✓' : '1' }}
                      </div>
                      <div class="flex-1">
                        <p class="text-[9px] font-black" [ngClass]="hasMinimumProfile() ? 'text-brand-teal' : 'text-amber-800'">Basic Profile (Name + Category)</p>
                        <div class="h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                          <div class="h-full bg-amber-500 rounded-full transition-all" [style.width.%]="basicProfilePercent()"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div class="flex items-center gap-3">
                      <div class="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black" 
                           [ngClass]="isProfileComplete() ? 'bg-brand-teal text-white' : (hasMinimumProfile() ? 'bg-gray-300 text-gray-500' : 'bg-gray-200 text-gray-400')">
                        {{ isProfileComplete() ? '✓' : '2' }}
                      </div>
                      <div class="flex-1">
                        <p class="text-[9px] font-black" [ngClass]="isProfileComplete() ? 'text-brand-teal' : (hasMinimumProfile() ? 'text-gray-500' : 'text-gray-400')">Complete Profile (Bio + Skills)</p>
                        <div class="h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                          <div class="h-full bg-amber-500 rounded-full transition-all" [style.width.%]="fullProfilePercent()"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div class="flex items-center gap-3">
                      <div class="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black" 
                           [ngClass]="hasUploadedDocuments() ? 'bg-brand-teal text-white' : (isProfileComplete() ? 'bg-gray-300 text-gray-500' : 'bg-gray-200 text-gray-400')">
                        {{ hasUploadedDocuments() ? '✓' : '3' }}
                      </div>
                      <div class="flex-1">
                        <p class="text-[9px] font-black" [ngClass]="hasUploadedDocuments() ? 'text-brand-teal' : (isProfileComplete() ? 'text-gray-500' : 'text-gray-400')">Upload ID & Documents</p>
                      </div>
                    </div>
                    
                    <div class="flex items-center gap-3">
                      <div class="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black" 
                           [ngClass]="isApproved() ? 'bg-brand-teal text-white' : (hasUploadedDocuments() ? 'bg-gray-300 text-gray-500' : 'bg-gray-200 text-gray-400')">
                        {{ isApproved() ? '✓' : '4' }}
                      </div>
                      <div class="flex-1">
                        <p class="text-[9px] font-black" [ngClass]="isApproved() ? 'text-brand-teal' : (hasUploadedDocuments() ? 'text-gray-500' : 'text-gray-400')">Get Approved</p>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Action Button -->
                  <button (click)="goToNextStep()" 
                          class="w-full mt-4 py-2.5 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all"
                          [ngClass]="getButtonClass()">
                    {{ getButtonText() }}
                  </button>
                  
                  <p class="text-[8px] text-center mt-2 opacity-60" [ngClass]="hasMinimumProfile() ? 'text-brand-teal' : 'text-amber-700'">
                    {{ getStepMessage() }}
                  </p>
                </div>
              }
            </div>
          }

          <!-- Approved User Card -->
          @if (isApproved()) {
            <div class="mx-3 p-4 bg-brand-teal/10 rounded-xl border border-brand-teal/20">
              <div class="flex items-center gap-2">
                <mat-icon class="text-brand-teal flex items-center justify-center">verified</mat-icon>
                <p class="text-[10px] font-black text-brand-teal uppercase tracking-wider">You're Approved!</p>
              </div>
              <p class="text-[9px] text-brand-teal/70 mt-1 leading-relaxed">You can now receive job offers and messages.</p>
            </div>
          }

          <div class="mt-auto pt-8 border-t border-outline-variant/30 px-2 space-y-1">
             <button (click)="auth.logout()" class="w-full flex items-center gap-4 px-5 py-4 rounded-xl text-error font-black text-[10px] uppercase tracking-widest hover:bg-error/5 transition-all">
                <mat-icon class="!text-xl flex items-center justify-center">logout</mat-icon>
                Log Out
             </button>
          </div>
        </aside>

        <main class="flex-1 overflow-y-auto bg-surface-container-lowest/30 pb-24 lg:pb-0">
          <div class="max-w-[1400px] mx-auto p-4 md:p-10 lg:p-12">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>

      <!-- Mobile Bottom Navigation -->
      <div class="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-slate-100 flex items-center justify-around px-4 z-[100] pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <a routerLink="dashboard" routerLinkActive="active-mobile-tab" class="flex flex-col items-center gap-1 text-slate-400 group">
          <mat-icon class="group-[.active-mobile-tab]:text-brand-teal transition-colors flex items-center justify-center">dashboard</mat-icon>
          <span class="text-[10px] font-black uppercase tracking-tighter group-[.active-mobile-tab]:text-brand-teal">Home</span>
        </a>
        
        <a routerLink="profile" routerLinkActive="active-mobile-tab" class="flex flex-col items-center gap-1 text-slate-400 group relative">
          <div class="relative">
            <mat-icon class="group-[.active-mobile-tab]:text-brand-teal transition-colors flex items-center justify-center">person</mat-icon>
            @if (!canSubmitForReview() && !isUnderReview()) {
              <span class="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-pulse"></span>
            }
          </div>
          <span class="text-[10px] font-black uppercase tracking-tighter group-[.active-mobile-tab]:text-brand-teal">Profile</span>
        </a>
        
        <a routerLink="verification" 
           [class.pointer-events-none]="!canAccessDocuments()" 
           [class.opacity-50]="!canAccessDocuments()"
           routerLinkActive="active-mobile-tab" 
           class="flex flex-col items-center gap-1 text-slate-400 group">
          <div class="relative">
            <mat-icon class="group-[.active-mobile-tab]:text-brand-teal transition-colors flex items-center justify-center">verified_user</mat-icon>
            @if (canAccessDocuments() && hasDocumentsToUpload()) {
              <span class="absolute -top-1 -right-1 w-3 h-3 bg-brand-teal rounded-full"></span>
            }
          </div>
          <span class="text-[10px] font-black uppercase tracking-tighter group-[.active-mobile-tab]:text-brand-teal">Verify</span>
        </a>
        
        <a routerLink="history" 
           [class.pointer-events-none]="!canAccessJobs()" 
           [class.opacity-50]="!canAccessJobs()"
           routerLinkActive="active-mobile-tab" 
           class="flex flex-col items-center gap-1 text-slate-400 group">
          <div class="relative">
            <mat-icon class="group-[.active-mobile-tab]:text-brand-teal transition-colors flex items-center justify-center">work_history</mat-icon>
            @if (canAccessJobs() && pendingJobsCount() > 0) {
              <span class="absolute -top-1 -right-1 w-3 h-3 bg-brand-teal rounded-full"></span>
            }
          </div>
          <span class="text-[10px] font-black uppercase tracking-tighter group-[.active-mobile-tab]:text-brand-teal">Jobs</span>
        </a>
        
        <a routerLink="settings" routerLinkActive="active-mobile-tab" class="flex flex-col items-center gap-1 text-slate-400 group">
          <mat-icon class="group-[.active-mobile-tab]:text-brand-teal transition-colors flex items-center justify-center">settings</mat-icon>
          <span class="text-[10px] font-black uppercase tracking-tighter group-[.active-mobile-tab]:text-brand-teal">More</span>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .active-tab {
      background-color: var(--color-surface-container-low) !important;
      color: var(--color-primary) !important;
    }
    .active-mobile-tab {
      color: var(--color-primary) !important;
    }
    :host { display: block; height: 100vh; }
    
    mat-icon {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      vertical-align: middle !important;
      flex-shrink: 0 !important;
    }
    
    .rotate-180 {
      transform: rotate(180deg);
    }
  `]
})
export class WorkerLayout {
  state = inject(PlatformStateService);
  auth = inject(AuthService);
  router = inject(Router);
  notification = inject(NotificationService);
  
  worker = this.state.currentWorker;
  isHandsetMenuOpen = signal(false);
  isProgressCardExpanded = signal(true); // Default expanded
  jobOfferBannerDismissed = signal(false);

  // Job offer banner logic
  pendingJobRequests = computed(() => {
    return this.state.workerBookings().filter(b => b.status === 'Pending');
  });

  latestJobOffer = computed(() => {
    const pending = this.pendingJobRequests();
    if (pending.length === 0) return null;
    const latest = pending[0];
    return {
      id: latest.id,
      clientName: latest.clientName,
      service: latest.service,
      budget: latest.earnings
    };
  });

  showJobOfferBanner = computed(() => {
    return this.latestJobOffer() !== null && !this.jobOfferBannerDismissed();
  });

  dismissJobOfferBanner() {
    this.jobOfferBannerDismissed.set(true);
  }

  // Toggle progress card
  toggleProgressCard() {
    this.isProgressCardExpanded.update(prev => !prev);
  }

  
  // LEVEL 1: MINIMUM PROFILE (Name + Category) - Unlocks Documents
  hasMinimumProfile = computed(() => {
    const w = this.worker();
    return !!(w.name && w.name.length > 2 && w.category);
  });

  basicProfilePercent = computed(() => {
    const w = this.worker();
    let score = 0;
    if (w.name && w.name.length > 2) score += 50;
    if (w.category) score += 50;
    return score;
  });

  // LEVEL 2: COMPLETE PROFILE (Name + Category + Bio + Skills) - Required for submission
  isProfileComplete = computed(() => {
    const w = this.worker();
    return !!(w.name && w.name.length > 2 && 
               w.category && 
               w.bio && w.bio.length > 20 &&
               w.skills && w.skills.length > 0);
  });

  fullProfilePercent = computed(() => {
    const w = this.worker();
    let score = 0;
    if (w.name && w.name.length > 2) score += 25;
    if (w.category) score += 25;
    if (w.bio && w.bio.length > 20) score += 25;
    if (w.skills && w.skills.length > 0) score += 25;
    return score;
  });

  // FIXED: Use the same calculation as dashboard and profile page
  profileCompletionPercent = computed(() => {
    return this.state.currentWorkerCompletion();
  });

  // Documents
  hasUploadedDocuments = computed(() => {
    const docs = this.worker().uploadedDocuments || [];
    const hasIdFront = docs.some((d: any) => d.type === 'ID-Front');
    const hasIdBack = docs.some((d: any) => d.type === 'ID-Back');
    return hasIdFront && hasIdBack;
  });

  hasDocumentsToUpload = computed(() => {
    const docs = this.worker().uploadedDocuments || [];
    const hasIdFront = docs.some((d: any) => d.type === 'ID-Front');
    const hasIdBack = docs.some((d: any) => d.type === 'ID-Back');
    return !hasIdFront || !hasIdBack;
  });

  pendingDocumentsCount = computed(() => {
    const docs = this.worker().uploadedDocuments || [];
    let missing = 0;
    if (!docs.some((d: any) => d.type === 'ID-Front')) missing++;
    if (!docs.some((d: any) => d.type === 'ID-Back')) missing++;
    return missing;
  });

  pendingJobsCount = computed(() => {
    const bookings = this.state.workerBookings();
    return bookings.filter((b: any) => b.status === 'Pending' || b.status === 'Accepted').length;
  });

  // BACKEND STATUSES: DRAFT, PENDING, APPROVED, REJECTED
  isDraft = computed(() => {
    const status = this.worker().status;
    return status === 'DRAFT' || status === 'Draft';
  });

  isUnderReview = computed(() => {
    const status = this.worker().status;
    return status === 'PENDING' || status === 'Pending';
  });

  isApproved = computed(() => {
    const status = this.worker().status;
    // Frontend receives 'Verified' when backend sends APPROVED
    return status === 'Verified' || status === 'APPROVED' || status === 'Approved';
  });

  isRejected = computed(() => {
    const status = this.worker().status;
    return status === 'REJECTED' || status === 'Rejected';
  });

  isFullyVerified = computed(() => {
    return this.isApproved();
  });

  // Can submit for review? Requires COMPLETE profile (100%) and current status is DRAFT or REJECTED
  canSubmitForReview = computed(() => {
    return this.isProfileComplete() && (this.isDraft() || this.isRejected());
  });

  // Can access documents? Requires MINIMUM profile (name + category)
  canAccessDocuments = computed(() => {
    return this.hasMinimumProfile();
  });

  // Can access jobs? Requires APPROVED status
  canAccessJobs = computed(() => {
    return this.isApproved();
  });

  // Can access messages? Requires MINIMUM profile
  canAccessMessages = computed(() => {
    return this.hasMinimumProfile();
  });

  // Step tracking
  currentStep = computed(() => {
    if (this.isApproved()) return 4;
    if (this.hasUploadedDocuments()) return 3;
    if (this.isProfileComplete()) return 2;
    if (this.hasMinimumProfile()) return 1;
    return 1;
  });

  getStepTitle = computed(() => {
    if (!this.hasMinimumProfile()) return 'Add Basic Info';
    if (!this.isProfileComplete()) return 'Complete Your Profile';
    if (!this.hasUploadedDocuments()) return 'Upload Documents';
    if (!this.isApproved()) return 'Under Review';
    return 'Ready for Jobs!';
  });

  getStepMessage = computed(() => {
    if (!this.hasMinimumProfile()) {
      return "Add your name and select your trade category";
    }
    if (!this.isProfileComplete()) {
      return "Add your bio and skills to reach 100%";
    }
    if (!this.hasUploadedDocuments()) {
      return "Upload your ID and work certificates";
    }
    if (!this.isApproved()) {
      return "Submitted! Review takes 24-48 hours";
    }
    return "You're all set! Start applying for jobs";
  });

  getButtonText = computed(() => {
    if (!this.hasMinimumProfile()) return 'Add Basic Info →';
    if (!this.isProfileComplete()) return 'Complete Profile →';
    if (!this.hasUploadedDocuments()) return 'Upload Documents →';
    if (!this.isApproved() && !this.isUnderReview()) return 'Submit for Review';
    if (this.isUnderReview()) return 'Review in Progress';
    return 'Dashboard →';
  });

  getButtonClass = computed(() => {
    if (!this.hasMinimumProfile()) return 'bg-amber-500 text-white hover:bg-amber-600';
    if (!this.isProfileComplete()) return 'bg-amber-500 text-white hover:bg-amber-600';
    if (!this.hasUploadedDocuments()) return 'bg-brand-teal text-white hover:opacity-90';
    if (!this.isApproved() && !this.isUnderReview()) return 'bg-brand-teal text-white hover:opacity-90';
    if (this.isUnderReview()) return 'bg-gray-400 text-white cursor-not-allowed';
    return 'bg-brand-teal text-white hover:opacity-90';
  });

  goToNextStep() {
    if (!this.hasMinimumProfile()) {
      this.router.navigate(['/worker/profile']);
    } else if (!this.isProfileComplete()) {
      this.router.navigate(['/worker/profile']);
    } else if (!this.hasUploadedDocuments()) {
      this.router.navigate(['/worker/verification']);
    } else if (!this.isApproved() && !this.isUnderReview()) {
      // Submit for verification only when profile is 100% complete AND documents uploaded
      this.state.submitForVerification();
      this.notification.success('Profile submitted for review! You will hear back within 24-48 hours.');
    } else if (this.isUnderReview()) {
      this.notification.info('Your application is already under review.');
    } else {
      this.router.navigate(['/worker/dashboard']);
    }
  }
}