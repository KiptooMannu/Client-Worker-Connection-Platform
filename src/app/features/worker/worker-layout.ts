import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PlatformStateService } from '../../core/services/platform-state.service';
import { AuthService } from '../../core/services/auth.service';
import { NavbarComponent } from '../../shared/components/navbar';
import { DashboardSidebarComponent } from '../../shared/components/dashboard-sidebar';
import { AppNavSection } from '../../shared/components/nav-model';
import { NotificationService } from '../../core/services/notification.service';
import { JobOfferBanner } from '../../shared/components/job-offer-banner/job-offer-banner';

@Component({
  selector: 'app-worker-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatIconModule,
    MatButtonModule,
    NavbarComponent,
    DashboardSidebarComponent,
    JobOfferBanner
  ],
  template: `
    <div class="min-h-screen bg-surface flex flex-col font-manrope">
      <!--
        Navigation is declared once in navSections() and rendered three ways
        by the shell: the desktop rail, the hamburger drawer, and the mobile
        bottom bar. This layout used to hand-write the rail and a bottom bar of
        its own — the latter stacked on top of the navbar's own bar, and omitted
        Messages and Disputes entirely, so a worker on a phone had no route to
        either.
      -->
      <app-navbar
        [showHireTalent]="false"
        pageTitle="Dashboard"
        [badge]="worker().status === 'loading' ? '' : worker().status"
        [navSections]="navSections()">
      </app-navbar>

      <!-- Job Offer Banner -->
      @if (showJobOfferBanner()) {
        <app-job-offer-banner
          [jobOffer]="latestJobOffer()!"
          (dismiss)="dismissJobOfferBanner()"
        />
      }

      <div class="flex flex-1 items-stretch">
        <app-dashboard-sidebar
          [sections]="navSections()"
          ariaLabel="Worker navigation"
          (logout)="auth.logout()">

          <!-- ONBOARDING PROGRESS CARD - WITH COLLAPSE/EXPAND -->
          <!-- Desktop only, by design: the worker dashboard carries the same
               checklist in its side column, which stacks into view on mobile. -->
          @if (!isApproved()) {
            <div class="p-4 rounded-xl" [ngClass]="hasMinimumProfile() ? 'bg-brand-teal/10 border border-brand-teal/20' : 'bg-amber-50 border border-amber-200'">
              <!-- Collapsible Header -->
              <div class="flex items-center justify-between cursor-pointer mb-3 gap-2" (click)="toggleProgressCard()">
                <div class="flex items-center gap-2 min-w-0">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0" [ngClass]="hasMinimumProfile() ? 'bg-brand-teal text-white' : 'bg-amber-500 text-white'">
                    <mat-icon class="!text-sm flex items-center justify-center">{{ hasMinimumProfile() ? 'checklist' : 'assignment' }}</mat-icon>
                  </div>
                  <div class="min-w-0">
                    <p class="text-[10px] font-black uppercase tracking-wider" [ngClass]="hasMinimumProfile() ? 'text-brand-teal' : 'text-amber-800'">
                      Step {{ currentStep() }} of 4
                    </p>
                    <p class="text-[11px] font-black truncate" [ngClass]="hasMinimumProfile() ? 'text-brand-teal' : 'text-amber-800'">
                      {{ getStepTitle() }}
                    </p>
                  </div>
                </div>
                <mat-icon class="!text-sm transition-transform shrink-0" [class.rotate-180]="isProgressCardExpanded()">
                  expand_more
                </mat-icon>
              </div>

              <!-- Collapsible Content -->
              @if (isProgressCardExpanded()) {
                <div class="animate-in slide-in-from-top duration-200">
                  <!-- Progress Steps -->
                  <div class="space-y-3">
                    <div class="flex items-center gap-3">
                      <div class="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black shrink-0"
                           [ngClass]="hasMinimumProfile() ? 'bg-brand-teal text-white' : 'bg-amber-500 text-white'">
                        {{ hasMinimumProfile() ? '✓' : '1' }}
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-[9px] font-black" [ngClass]="hasMinimumProfile() ? 'text-brand-teal' : 'text-amber-800'">Basic Profile (Name + Category)</p>
                        <div class="h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                          <div class="h-full bg-amber-500 rounded-full transition-all" [style.width.%]="basicProfilePercent()"></div>
                        </div>
                      </div>
                    </div>

                    <div class="flex items-center gap-3">
                      <div class="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black shrink-0"
                           [ngClass]="isProfileComplete() ? 'bg-brand-teal text-white' : (hasMinimumProfile() ? 'bg-gray-300 text-gray-500' : 'bg-gray-200 text-gray-400')">
                        {{ isProfileComplete() ? '✓' : '2' }}
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-[9px] font-black" [ngClass]="isProfileComplete() ? 'text-brand-teal' : (hasMinimumProfile() ? 'text-gray-500' : 'text-gray-400')">Complete Profile (Bio + Skills)</p>
                        <div class="h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                          <div class="h-full bg-amber-500 rounded-full transition-all" [style.width.%]="fullProfilePercent()"></div>
                        </div>
                      </div>
                    </div>

                    <div class="flex items-center gap-3">
                      <div class="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black shrink-0"
                           [ngClass]="hasUploadedDocuments() ? 'bg-brand-teal text-white' : (isProfileComplete() ? 'bg-gray-300 text-gray-500' : 'bg-gray-200 text-gray-400')">
                        {{ hasUploadedDocuments() ? '✓' : '3' }}
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-[9px] font-black" [ngClass]="hasUploadedDocuments() ? 'text-brand-teal' : (isProfileComplete() ? 'text-gray-500' : 'text-gray-400')">Upload ID &amp; Documents</p>
                      </div>
                    </div>

                    <div class="flex items-center gap-3">
                      <div class="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black shrink-0"
                           [ngClass]="isApproved() ? 'bg-brand-teal text-white' : (hasUploadedDocuments() ? 'bg-gray-300 text-gray-500' : 'bg-gray-200 text-gray-400')">
                        {{ isApproved() ? '✓' : '4' }}
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-[9px] font-black" [ngClass]="isApproved() ? 'text-brand-teal' : (hasUploadedDocuments() ? 'text-gray-500' : 'text-gray-400')">Get Approved</p>
                      </div>
                    </div>
                  </div>

                  <!-- Action Button -->
                  <button (click)="goToNextStep()"
                          [disabled]="isSubmitting() || isUnderReview()"
                          class="w-full mt-4 py-2.5 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-70"
                          [ngClass]="getButtonClass()">
                    @if (isSubmitting()) {
                      <mat-icon class="!text-sm animate-spin">progress_activity</mat-icon>
                    }
                    <span class="truncate">{{ isSubmitting() ? 'Submitting…' : getButtonText() }}</span>
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
            <div class="p-4 bg-brand-teal/10 rounded-xl border border-brand-teal/20">
              <div class="flex items-center gap-2">
                <mat-icon class="text-brand-teal flex items-center justify-center">verified</mat-icon>
                <p class="text-[10px] font-black text-brand-teal uppercase tracking-wider">You're Approved!</p>
              </div>
              <p class="text-[9px] text-brand-teal/70 mt-1 leading-relaxed">You can now receive job offers and messages.</p>
            </div>
          }
        </app-dashboard-sidebar>

        <main class="flex-1 min-w-0 bg-surface-container-lowest/30">
          <div class="app-container px-3 sm:px-5 md:px-8 lg:px-10 xl:px-12 py-4 sm:py-6 md:py-8 lg:py-10 pb-bottom-nav">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; }

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
  isProgressCardExpanded = signal(true); // Default expanded
  jobOfferBannerDismissed = signal(false);

  /**
   * Reads the service's own pending-operation registry rather than a local flag.
   * `submitForVerification()` subscribes internally and returns void, so a local
   * boolean could only ever be set and cleared synchronously around the call —
   * which is to say never actually shown.
   */
  isSubmitting = computed(() => this.state.isPending('submitForVerification'));

  /**
   * Gated destinations stay in the list rather than disappearing, so the path
   * to unlocking them is visible. `lockReason` is rendered inline in the drawer
   * — the rail used to explain the gate in a hover tooltip, which a touch
   * device cannot reach.
   */
  navSections = computed<AppNavSection[]>(() => {
    const completion = this.state.currentWorkerCompletion();
    const unread = this.state.unreadMessagesCount();
    const docsOpen = this.canAccessDocuments();
    const jobsOpen = this.canAccessJobs();
    const msgsOpen = this.canAccessMessages();
    const pendingDocs = this.pendingDocumentsCount();
    const pendingJobs = this.pendingJobsCount();

    const profileBadge = !this.canSubmitForReview()
      ? `${completion}%`
      : (!this.isUnderReview() ? 'Ready ✓' : null);

    return [
      {
        label: 'Workspace',
        items: [
          { path: '/worker/dashboard', label: 'Dashboard', shortLabel: 'Home', icon: 'dashboard', primary: true },
          {
            path: '/worker/profile',
            label: 'My Profile',
            shortLabel: 'Profile',
            icon: 'person',
            primary: true,
            badge: profileBadge,
            badgeTone: this.canSubmitForReview() ? 'ok' : 'warn'
          },
          {
            path: '/worker/verification',
            label: 'Documents',
            icon: 'verified_user',
            locked: !docsOpen,
            lockReason: 'Add your name and trade category first',
            badge: docsOpen && pendingDocs > 0 ? pendingDocs : null,
            badgeTone: 'brand'
          },
          {
            path: '/worker/history',
            label: 'My Jobs',
            shortLabel: 'Jobs',
            icon: 'work_history',
            primary: true,
            locked: !jobsOpen,
            lockReason: 'Complete your profile, upload documents and get verified first',
            badge: jobsOpen && pendingJobs > 0 ? pendingJobs : null,
            badgeTone: 'brand'
          }
        ]
      },
      {
        label: 'Support',
        items: [
          {
            path: '/worker/messages',
            label: 'Messages',
            shortLabel: 'Chat',
            icon: 'chat',
            primary: true,
            locked: !msgsOpen,
            lockReason: 'Add your name and trade category first',
            badge: msgsOpen && unread > 0 ? (unread > 9 ? '9+' : unread) : null,
            badgeTone: 'brand'
          },
          {
            path: '/worker/disputes',
            label: 'Disputes',
            icon: 'gavel',
            locked: !msgsOpen,
            lockReason: 'Add your name and trade category first'
          }
        ]
      },
      {
        label: 'Account',
        items: [
          { path: '/worker/settings', label: 'Settings', icon: 'settings' }
        ]
      }
    ];
  });

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
    return bookings.filter((b: any) =>
      b.status === 'Pending' || b.status === 'Accepted' || b.status === 'Awaiting Funding' || b.status === 'AWAITING_FUNDING'
    ).length;
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
      // Submit for verification only when profile is 100% complete AND documents
      // uploaded. The service reports its own success/failure toast, so this no
      // longer claims success before the request has been answered.
      this.state.submitForVerification();
    } else if (this.isUnderReview()) {
      this.notification.info('Your application is already under review.');
    } else {
      this.router.navigate(['/worker/dashboard']);
    }
  }
}
