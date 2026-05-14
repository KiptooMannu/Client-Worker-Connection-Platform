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
    <div class="space-y-6 animate-in fade-in duration-700">
      <!-- Step-by-Step Progress Tracker -->
      <mat-card class="premium-card !border !border-slate-100 !shadow-sm !p-5 md:!p-6">
        <div class="flex justify-between items-center mb-6">
           <h3 class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Verification Progress</h3>
           <span class="text-[10px] font-black text-blue-600">{{ completionPercentage() }}% Complete</span>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          <!-- Connector Lines (Desktop) -->
          <div class="hidden md:block absolute top-5 left-20 right-20 h-0.5 bg-slate-100 z-0">
             <div class="h-full bg-blue-600 transition-all duration-1000" [style.width]="(currentStep() / 2) * 100 + '%'"></div>
          </div>

          @for (step of steps; track step.id; let i = $index) {
            <div class="relative z-10 flex flex-col items-center text-center group">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 mb-3 border-2"
                   [ngClass]="{
                     'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-200 scale-110': currentStep() === i,
                     'bg-teal-500 border-teal-500 text-white': currentStep() > i,
                     'bg-white border-slate-100 text-slate-300': currentStep() < i
                   }">
                <mat-icon class="!text-lg"> {{ currentStep() > i ? 'check' : step.icon }} </mat-icon>
              </div>
              <p class="text-[11px] font-black transition-colors" [ngClass]="currentStep() >= i ? 'text-slate-900' : 'text-slate-400'">{{ step.label }}</p>
              <p class="text-[9px] font-medium text-slate-500 mt-0.5">{{ step.desc }}</p>
            </div>
          }
        </div>
      </mat-card>

      <!-- Status Hero Card -->
      <mat-card class="premium-card overflow-hidden !border-none !shadow-xl" 
                [ngClass]="worker().status === 'Verified' ? '!bg-emerald-700' : (worker().status === 'Pending' ? '!bg-slate-700' : '!bg-indigo-900')">
        <mat-card-content class="!p-5 md:!p-6 text-white relative">
          <div class="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div class="flex items-center gap-6 text-center md:text-left flex-col md:flex-row">
              <div class="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/30">
                <mat-icon class="!text-white !text-2xl !w-auto !h-auto" style="font-variation-settings: 'FILL' 1;">
                  {{ worker().status === 'Verified' ? 'verified' : (worker().status === 'Pending' ? 'schedule' : 'edit_note') }}
                </mat-icon>
              </div>
              <div>
                <h2 class="text-xl md:text-2xl font-black tracking-tight mb-1">
                  {{ worker().status === 'Verified' ? 'Identity Verified' : (worker().status === 'Pending' ? 'Review in Progress' : 'Profile Incomplete') }}
                </h2>
                <p class="text-white/80 font-medium text-sm max-w-xl leading-relaxed">
                  {{ worker().status === 'Verified' ? 'Your profile is live! You are visible to clients.' : 
                     (worker().status === 'Pending' ? 'Admins are reviewing your documents.' : 
                     'Complete your profile and upload documents to get verified.') }}
                </p>
              </div>
            </div>
            
            <div class="flex flex-col gap-2">
              @if (worker().status === 'Verified') {
                <button mat-flat-button (click)="state.toggleAvailability(worker().id)" 
                        class="!px-6 !py-3 !rounded-xl !font-black !text-[9px] !uppercase !tracking-widest transition-all shadow-md"
                        [ngClass]="worker().isAvailable ? '!bg-white !text-teal-700' : '!bg-white/20 !text-white !border !border-white/30'">
                  <mat-icon class="!text-xs !mr-1">{{ worker().isAvailable ? 'check_circle' : 'do_not_disturb_on' }}</mat-icon>
                  {{ worker().isAvailable ? 'Available' : 'Busy' }}
                </button>
              }
              
              @if (worker().status === 'Draft' || worker().status === 'Rejected') {
                <button 
                  mat-flat-button 
                  [routerLink]="['../profile']"
                  class="!bg-white !text-blue-700 !px-8 !py-4 !rounded-xl !font-black !text-xs !shadow-lg hover:scale-105 transition-transform">
                  Onboarding
                </button>
              }
            </div>
          </div>
          <mat-icon class="absolute -right-5 -bottom-5 !text-[120px] !w-auto !h-auto text-white/10 pointer-events-none">verified</mat-icon>
        </mat-card-content>
      </mat-card>

      <!-- Hire Requests Section -->
      @if (pendingRequests().length > 0) {
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-black text-slate-900 tracking-tight">New Hire Requests</h3>
            <span class="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[9px] font-black uppercase tracking-widest">{{ pendingRequests().length }} Pending</span>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            @for (req of pendingRequests(); track req.id) {
              <mat-card class="!rounded-2xl !border !border-slate-100 !shadow-sm !p-5 animate-in zoom-in duration-300">
                <div class="flex justify-between items-start mb-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-700 font-black text-xs">{{ req.clientInitials }}</div>
                    <div>
                      <p class="text-xs font-black text-slate-900">{{ req.clientName }}</p>
                      <p class="text-[10px] font-medium text-slate-500">{{ req.service }}</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-base font-black text-slate-900 tracking-tighter">$\{{ req.earnings }}</p>
                  </div>
                </div>
                
                <div class="flex gap-2">
                  <button mat-flat-button color="primary" class="flex-grow !py-2 !rounded-lg !font-black !text-[9px] !uppercase !tracking-widest" (click)="state.acceptBooking(req.id)">
                    Accept
                  </button>
                  <button mat-stroked-button class="!border-slate-100 !text-slate-400 !px-4 !rounded-lg !font-black !text-[9px] !uppercase !tracking-widest" (click)="state.declineBooking(req.id)">
                    Decline
                  </button>
                </div>
              </mat-card>
            }
          </div>
        </div>
      }

      <!-- Quick Actions & Messaging -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <mat-card class="!rounded-[24px] !border !border-slate-100 !shadow-sm !p-6 bg-white overflow-hidden">
           <div class="flex justify-between items-center mb-6">
             <div class="flex items-center gap-3">
               <h3 class="text-base font-black text-slate-900 tracking-tight">Recent Dialogues</h3>
               @if (state.unreadMessagesCount() > 0) {
                 <span class="px-2 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-black uppercase tracking-widest rounded-full">
                   {{ state.unreadMessagesCount() }} New
                 </span>
               }
             </div>
             <button routerLink="../messages" class="text-[9px] font-black uppercase text-blue-600 hover:underline">Inbox</button>
           </div>
           
           <div class="space-y-4">
              @for (chat of state.chats().slice(0, 3); track chat.id) {
                <div class="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer" routerLink="../messages">
                   <div class="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center font-black text-xs uppercase overflow-hidden border border-white">
                      @if (chat.image) { <img [src]="chat.image" class="w-full h-full object-cover"> } @else { {{ chat.initials }} }
                   </div>
                   <div class="flex-1 min-w-0">
                      <div class="flex justify-between items-center mb-0.5">
                         <p class="text-xs font-black text-slate-900 truncate">{{ chat.name }}</p>
                         <span class="text-[8px] font-bold text-slate-400">{{ chat.time }}</span>
                      </div>
                      <p class="text-[10px] text-slate-500 truncate">{{ chat.lastMessage }}</p>
                   </div>
                </div>
              }
              @if (state.chats().length === 0) {
                <div class="py-10 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                   <mat-icon class="text-slate-200 !text-2xl !w-auto !h-auto mb-2">forum</mat-icon>
                   <p class="text-[9px] text-slate-400 font-black uppercase tracking-widest">No active chats</p>
                </div>
              }
           </div>
        </mat-card>

        <div class="grid grid-cols-1 gap-4">
          <mat-card class="!rounded-2xl !border !border-slate-100 !shadow-sm !p-6 group hover:!border-blue-600 transition-all cursor-pointer" routerLink="../profile">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                <mat-icon>person</mat-icon>
              </div>
              <div>
                <h3 class="text-lg font-black text-slate-900">Manage Profile</h3>
                <p class="text-xs text-slate-500 font-medium">Bio, skills, and rates.</p>
              </div>
            </div>
          </mat-card>

          <mat-card class="!rounded-2xl !border !border-slate-100 !shadow-sm !p-6 group hover:!border-teal-600 transition-all cursor-pointer" routerLink="../verification">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-all">
                <mat-icon>file_upload</mat-icon>
              </div>
              <div>
                <h3 class="text-lg font-black text-slate-900">Verification</h3>
                <p class="text-xs text-slate-500 font-medium">Upload ID & certificates.</p>
              </div>
            </div>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    
    @media (max-width: 640px) {
      .premium-card { padding: 1.25rem !important; }
      .text-xl { font-size: 1.125rem !important; }
      .text-base { font-size: 1rem !important; }
    }
  `]
})
export class WorkerDashboardOverviewPage {
  state = inject(PlatformStateService);
  private notification = inject(NotificationService);

  worker = this.state.currentWorker;

  steps = [
    { id: 'profile', label: 'Professional Profile', desc: 'Bio & Skills', icon: 'person' },
    { id: 'documents', label: 'ID Verification', desc: 'Upload Credentials', icon: 'badge' },
    { id: 'review', label: 'Admin Approval', desc: 'Trust Audit', icon: 'security' }
  ];

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