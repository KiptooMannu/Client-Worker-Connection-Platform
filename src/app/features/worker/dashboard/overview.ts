import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NotificationService } from '../../../core/services/notification.service';
import { RouterLink } from '@angular/router';
import { PlatformStateService } from '../../../core/services/platform-state.service';

@Component({
  selector: 'app-worker-dashboard-overview',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressBarModule,
    RouterLink
  ],
  template: `
    <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 font-manrope">
      
      <!-- Status Hero Section (Premium Industrial Look) -->
      <section>
        <div class="relative overflow-hidden rounded-[1.5rem] bg-primary-container p-6 md:p-8 min-h-[260px] flex flex-col justify-between group shadow-xl shadow-primary/10 border border-white/5">
          <!-- Atmospheric Background Image -->
          <img class="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:scale-105 transition-transform duration-700" 
               src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80" 
               alt="Background">
          
          <div class="relative z-10">
            <div class="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full mb-6 border border-white/10">
              <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span class="font-label-sm text-[10px] text-white uppercase tracking-[0.2em] font-black">System Live</span>
            </div>
            
            <div class="max-w-2xl">
              <h1 class="text-3xl md:text-4xl font-black text-white mb-2 tracking-tighter leading-none">{{ statusTitle() }}</h1>
              <p class="text-sm md:text-base text-white/70 max-w-xl leading-relaxed">{{ statusDesc() }}</p>
            </div>
          </div>

          <div class="relative z-10 flex flex-wrap gap-12 mt-8 items-end">
            <div class="space-y-1">
              <p class="text-[9px] uppercase tracking-[0.2em] text-white/40 font-black">Profile Status</p>
              <div class="flex items-baseline gap-2">
                <span class="text-3xl font-black text-white">{{ state.currentWorkerCompletion() }}%</span>
                <span class="text-[10px] text-primary font-bold uppercase tracking-widest">Complete</span>
              </div>
            </div>
            <div class="space-y-1">
              <p class="text-[9px] uppercase tracking-[0.2em] text-white/40 font-black">New Requests</p>
              <p class="text-3xl font-black text-white">{{ pendingRequests().length }}</p>
            </div>
            
            <div class="ml-auto hidden md:block">
              <button routerLink="../verification" class="px-8 py-4 bg-white text-primary rounded-xl font-black text-sm hover:scale-105 transition-all active:scale-95 shadow-xl shadow-black/20">
                Check Documents
              </button>
            </div>
          </div>

          <!-- Glassmorphic Accent -->
          <div class="absolute -right-20 -bottom-20 w-80 h-80 bg-primary rounded-full blur-[100px] opacity-20 group-hover:opacity-30 transition-opacity"></div>
        </div>
      </section>

      <!-- Dashboard Layout Grid -->
      <div class="flex flex-col lg:flex-row gap-10 items-start">
        
        <!-- Main Operations Column -->
        <div class="flex-1 w-full space-y-10 min-w-0">
          
          <!-- Hire Requests Ledger -->
          <section>
            <div class="flex justify-between items-center mb-6 px-4">
              <div class="flex items-center gap-3">
                <div class="w-1.5 h-6 bg-primary rounded-full"></div>
                <h2 class="text-xl font-black tracking-tight text-primary uppercase">New Job Requests</h2>
              </div>
              <span class="font-label-sm text-[10px] font-black text-primary bg-primary-fixed px-3 py-1.5 rounded-full tracking-widest">{{ pendingRequests().length }} NEW</span>
            </div>
            
            <div class="space-y-1">
              @for (req of paginatedPendingRequests(); track req.id) {
                <div class="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-surface hover:bg-surface-container-low transition-all border-b border-outline-variant/30 group">
                  <div class="flex items-center gap-4 mb-4 sm:mb-0 min-w-0">
                    <div class="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary font-black text-xs shrink-0">
                      {{ req.clientName[0] }}
                    </div>
                    <div class="min-w-0">
                      <h3 class="font-bold text-sm text-primary truncate">{{ req.service }}</h3>
                      <p class="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider truncate">{{ req.clientName }}</p>
                    </div>
                  </div>
                  
                  <div class="flex items-center gap-6 shrink-0">
                    <div class="text-right hidden md:block">
                      <p class="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold leading-none mb-1">Fee</p>
                      <p class="font-black text-sm text-primary">$ {{ req.earnings }}</p>
                    </div>
                    <div class="flex gap-2">
                      <button (click)="state.acceptBooking(req.id)" class="px-5 py-2 bg-primary text-white font-black text-[10px] uppercase tracking-widest rounded-lg hover:opacity-90 transition-all shadow-sm">Accept</button>
                      <button (click)="state.deleteJobRequest(req.id)" class="px-4 py-2 border border-outline-variant text-on-surface-variant font-black text-[10px] uppercase tracking-widest rounded-lg hover:bg-error/10 hover:text-error hover:border-error/20 transition-all">Decline</button>
                    </div>
                  </div>
                </div>
              }

              @if (totalPages() > 1) {
                <div class="p-4 flex items-center justify-between bg-surface-container-low/30 rounded-b-xl border-t border-outline-variant/10">
                  <span class="text-[9px] font-black text-on-surface-variant/60 uppercase tracking-widest">
                    Page {{ requestPage() }} of {{ totalPages() }}
                  </span>
                  <div class="flex gap-2">
                    <button (click)="goToRequestPage(requestPage() - 1)" [disabled]="requestPage() === 1" class="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant disabled:opacity-30 hover:bg-primary hover:text-white transition-all">
                      <mat-icon class="!text-sm">chevron_left</mat-icon>
                    </button>
                    <button (click)="goToRequestPage(requestPage() + 1)" [disabled]="requestPage() === totalPages()" class="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant disabled:opacity-30 hover:bg-primary hover:text-white transition-all">
                      <mat-icon class="!text-sm">chevron_right</mat-icon>
                    </button>
                  </div>
                </div>
              }
              
              @if (pendingRequests().length === 0) {
                <div class="py-20 text-center bg-surface-container-low border border-dashed border-outline-variant rounded-[1.5rem]">
                  <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <span class="material-symbols-outlined text-outline text-3xl">cloud_done</span>
                  </div>
                  <h3 class="font-black text-primary mb-1 uppercase tracking-widest">No New Requests</h3>
                  <p class="text-[11px] text-on-surface-variant font-bold uppercase tracking-tighter">We'll notify you when new jobs arrive</p>
                </div>
              }
            </div>
          </section>

          <!-- System Controls Ledger -->
          <section>
             <div class="flex items-center gap-3 mb-6 px-4">
                <div class="w-1.5 h-6 bg-primary rounded-full"></div>
                <h2 class="text-xl font-black tracking-tight text-primary uppercase">Quick Links</h2>
              </div>
            <div class="space-y-1">
              <div routerLink="../profile" class="flex items-center justify-between p-4 bg-surface hover:bg-surface-container-low transition-all border-b border-outline-variant/30 cursor-pointer group">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                    <span class="material-symbols-outlined text-xl">identity_platform</span>
                  </div>
                  <div>
                    <h3 class="font-black text-primary text-xs uppercase tracking-widest">Edit Profile</h3>
                    <p class="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest opacity-60">Update your bio and skills</p>
                  </div>
                </div>
                <span class="material-symbols-outlined text-outline group-hover:translate-x-1 transition-transform">chevron_right</span>
              </div>

              <div routerLink="../verification" class="flex items-center justify-between p-4 bg-surface hover:bg-surface-container-low transition-all border-b border-outline-variant/30 cursor-pointer group">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                    <span class="material-symbols-outlined text-xl">verified_user</span>
                  </div>
                  <div>
                    <h3 class="font-black text-primary text-xs uppercase tracking-widest">Documents</h3>
                    <p class="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest opacity-60">Upload ID and certificates</p>
                  </div>
                </div>
                <span class="material-symbols-outlined text-outline group-hover:translate-x-1 transition-transform">chevron_right</span>
              </div>
            </div>
          </section>
        </div>

        <!-- System Intelligence Column -->
        <div class="w-full lg:w-80 xl:w-96 space-y-10 shrink-0">
          <!-- Audit Lifecycle Card -->
          <section class="bg-white border border-outline-variant/60 rounded-xl p-6 shadow-sm">
            <h2 class="text-[10px] font-black text-primary mb-6 uppercase tracking-[0.25em]">Profile Completion</h2>
            
            <div class="space-y-6 relative">
              <div class="absolute left-4 top-3 bottom-3 w-px bg-outline-variant/30"></div>
              
              @for (step of steps; track step.id; let i = $index) {
                <div class="flex gap-4 relative z-10 items-start">
                  <div class="w-6 h-6 rounded-full flex items-center justify-center transition-all shadow-sm shrink-0"
                       [ngClass]="currentStep() > i + 1 ? 'bg-primary text-white' : (currentStep() === i + 1 ? 'bg-white border border-primary text-primary' : 'bg-white border border-outline-variant text-outline')">
                      @if (currentStep() > i + 1) {
                        <span class="material-symbols-outlined text-[12px] font-black">check</span>
                      } @else {
                        <span class="text-[9px] font-black">{{ i + 1 }}</span>
                      }
                  </div>
                  <div class="min-w-0">
                    <h3 class="text-[10px] font-black uppercase tracking-tight" [ngClass]="currentStep() >= i + 1 ? 'text-primary' : 'text-on-surface-variant'">{{ step.label }}</h3>
                    <p class="text-[9px] text-on-surface-variant font-bold uppercase tracking-widest opacity-60 truncate">{{ step.desc }}</p>
                  </div>
                </div>
              }
            </div>
            
            <button (click)="submit()" [disabled]="worker().status !== 'Draft' || state.currentWorkerCompletion() < 100"
                    class="w-full mt-8 py-3 bg-primary text-white rounded-lg font-black text-[10px] uppercase tracking-widest disabled:opacity-20 transition-all shadow-lg shadow-primary/10 active:scale-95">
              Submit for Review
            </button>
          </section>

          <!-- Dialogues Panel -->
          <section class="bg-surface border border-outline-variant/60 rounded-xl p-6 shadow-sm flex flex-col group">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-[10px] font-black text-primary uppercase tracking-[0.25em]">Recent Chats</h3>
              @if (state.unreadMessagesCount() > 0) {
                <span class="bg-primary text-white px-2 py-0.5 rounded-full text-[8px] font-black tracking-widest">{{ state.unreadMessagesCount() }} NEW</span>
              }
            </div>

            <div class="space-y-1 flex-1">
              @for (chat of state.chats().slice(0, 3); track chat.id) {
                <div class="flex items-center gap-3 p-3 hover:bg-surface-container-low rounded-lg transition-all cursor-pointer group/item" routerLink="../messages">
                  <img [src]="chat.image || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop'" 
                       class="w-10 h-10 rounded-lg object-cover shadow-sm group-hover/item:scale-105 transition-transform">
                  <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-baseline mb-0.5">
                      <p class="text-[10px] font-black text-primary truncate uppercase tracking-tight">{{ chat.name }}</p>
                      <span class="text-[8px] text-on-surface-variant font-bold">{{ chat.time }}</span>
                    </div>
                    <p class="text-[9px] text-on-surface-variant font-bold truncate tracking-tight opacity-70">{{ chat.lastMessage }}</p>
                  </div>
                </div>
              }
              @if (state.chats().length === 0) {
                 <div class="py-6 text-center opacity-40">
                    <p class="text-[9px] font-black uppercase tracking-widest">No messages yet</p>
                 </div>
              }
            </div>

            <button routerLink="../messages" class="w-full mt-6 py-3 border border-outline-variant text-primary rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white hover:border-primary transition-all">
              Open Messages
            </button>
          </section>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .fill-1 { font-variation-settings: 'FILL' 1; }
  `]
})
export class WorkerDashboardOverviewPage {
  state = inject(PlatformStateService);
  private notification = inject(NotificationService);

  worker = this.state.currentWorker;

  // Pagination for Job Requests
  requestPage = signal(1);
  itemsPerPage = signal(5);

  paginatedPendingRequests = computed(() => {
    const requests = this.pendingRequests();
    const start = (this.requestPage() - 1) * this.itemsPerPage();
    return requests.slice(start, start + this.itemsPerPage());
  });

  totalPages = computed(() => Math.ceil(this.pendingRequests().length / this.itemsPerPage()));

  goToRequestPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.requestPage.set(page);
    }
  }

  statusTitle = computed(() => {
    const s = this.worker().status;
    if (s === 'Verified') return 'Ready for New Jobs';
    if (s === 'Pending') return 'Trust Audit in Progress';
    return 'Incomplete Profile';
  });

  statusDesc = computed(() => {
    const s = this.worker().status;
    if (s === 'Verified') return 'Your profile is live and visible to elite employers. Keep your availability updated.';
    if (s === 'Pending') return "Admins are currently reviewing your professional credentials. You'll be notified once cleared.";
    return 'Complete your professional audit to unlock premium marketplace features.';
  });

  steps = [
    { id: 'profile', order: 1, label: 'Professional Profile', desc: 'Bio & Skills', icon: 'person' },
    { id: 'documents', order: 2, label: 'ID Verification', desc: 'Upload Credentials', icon: 'badge' },
    { id: 'review', order: 3, label: 'Admin Approval', desc: 'Trust Audit', icon: 'security' }
  ].sort((a, b) => a.order - b.order);

  currentStep = computed(() => {
    const s = this.worker().status;
    if (s === 'Verified') return 3;
    if (s === 'Pending') return 2;
    return 1;
  });

  pendingRequests = computed(() => {
    return this.state.workerBookings().filter(b => b.status === 'Pending');
  });

  completionPercentage = computed(() => {
    return Math.min(Math.round((this.currentStep() / 3) * 100), 100);
  });

  submit() {
    if (this.state.currentWorkerCompletion() < 100) {
      this.notification.error('❌ Please complete your profile details (100%) before submitting for review.');
      return;
    }

    this.state.submitForVerification();
    this.notification.success('✓ Application submitted successfully!');
  }
}