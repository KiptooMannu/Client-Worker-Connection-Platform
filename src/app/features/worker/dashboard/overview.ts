import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
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
    MatSnackBarModule,
    RouterLink
  ],
  template: `
    <div class="space-y-8 animate-in fade-in duration-700">
      <!-- Step-by-Step Progress Tracker -->
      <mat-card class="!rounded-[2.5rem] !border !border-slate-100 !shadow-sm !p-10">
        <div class="flex justify-between items-center mb-10">
           <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verification Progress</h3>
           <span class="text-xs font-black text-blue-600">{{ completionPercentage() }}% Complete</span>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <!-- Connector Lines (Desktop) -->
          <div class="hidden md:block absolute top-6 left-20 right-20 h-0.5 bg-slate-100 z-0">
             <div class="h-full bg-blue-600 transition-all duration-1000" [style.width]="(currentStep() / 2) * 100 + '%'"></div>
          </div>

          @for (step of steps; track step.id; let i = $index) {
            <div class="relative z-10 flex flex-col items-center text-center group">
              <div class="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 mb-4 border-2"
                   [ngClass]="{
                     'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-200 scale-110': currentStep() === i,
                     'bg-teal-500 border-teal-500 text-white': currentStep() > i,
                     'bg-white border-slate-100 text-slate-300': currentStep() < i
                   }">
                <mat-icon>{{ currentStep() > i ? 'check' : step.icon }}</mat-icon>
              </div>
              <p class="text-sm font-black transition-colors" [ngClass]="currentStep() >= i ? 'text-slate-900' : 'text-slate-400'">{{ step.label }}</p>
              <p class="text-[10px] font-medium text-slate-500 mt-1">{{ step.desc }}</p>
            </div>
          }
        </div>
      </mat-card>

      <!-- Status Hero Card -->
      <mat-card class="!rounded-[2.5rem] overflow-hidden !border-none !shadow-2xl shadow-blue-900/20" 
                [ngClass]="worker().status === 'Verified' ? '!bg-teal-600' : (worker().status === 'Pending' ? '!bg-amber-500' : '!bg-blue-600')">
        <mat-card-content class="!p-10 text-white relative">
          <div class="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div class="flex items-center gap-8 text-center md:text-left flex-col md:flex-row">
              <div class="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-md border border-white/30">
                <mat-icon class="!text-white !text-4xl !w-auto !h-auto" style="font-variation-settings: 'FILL' 1;">
                  {{ worker().status === 'Verified' ? 'verified' : (worker().status === 'Pending' ? 'schedule' : 'edit_note') }}
                </mat-icon>
              </div>
              <div>
                <h2 class="text-3xl font-black tracking-tight mb-2">
                  {{ worker().status === 'Verified' ? 'Identity Verified' : (worker().status === 'Pending' ? 'Review in Progress' : 'Profile Incomplete') }}
                </h2>
                <p class="text-white/80 font-medium text-lg max-w-xl leading-relaxed">
                  {{ worker().status === 'Verified' ? 'Your profile is live! You are now visible to clients in the marketplace.' : 
                     (worker().status === 'Pending' ? 'Admins are currently reviewing your documents. You will be notified once verified.' : 
                     'Please complete your profile and upload your documents to be seen by clients.') }}
                </p>
              </div>
            </div>
            
            <div class="flex flex-col gap-3">
              @if (worker().status === 'Verified') {
                <button mat-flat-button (click)="state.toggleAvailability(worker().id)" 
                        class="!px-8 !py-4 !rounded-2xl !font-black !text-[10px] !uppercase !tracking-widest transition-all shadow-lg"
                        [ngClass]="worker().isAvailable ? '!bg-white !text-teal-700' : '!bg-white/20 !text-white !border !border-white/30'">
                  <mat-icon class="!text-sm !mr-2">{{ worker().isAvailable ? 'check_circle' : 'do_not_disturb_on' }}</mat-icon>
                  {{ worker().isAvailable ? 'Currently Available' : 'Set as Busy' }}
                </button>
              }
              
              @if (worker().status === 'Draft' || worker().status === 'Rejected') {
                <button 
                  mat-flat-button 
                  [routerLink]="['../profile']"
                  class="!bg-white !text-blue-700 !px-10 !py-6 !rounded-2xl !font-black !text-sm !shadow-xl hover:scale-105 transition-transform">
                  Continue Onboarding
                </button>
              }
            </div>
          </div>
          <mat-icon class="absolute -right-10 -bottom-10 !text-[200px] !w-auto !h-auto text-white/10 pointer-events-none">verified</mat-icon>
        </mat-card-content>
      </mat-card>

      <!-- Hire Requests Section -->
      @if (pendingRequests().length > 0) {
        <div class="space-y-6">
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-black text-slate-900 tracking-tight">New Hire Requests</h3>
            <span class="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest">{{ pendingRequests().length }} Pending</span>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            @for (req of pendingRequests(); track req.id) {
              <mat-card class="!rounded-3xl !border !border-slate-100 !shadow-sm !p-8 animate-in zoom-in duration-300">
                <div class="flex justify-between items-start mb-6">
                  <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-700 font-black">{{ req.clientInitials }}</div>
                    <div>
                      <p class="text-sm font-black text-slate-900">{{ req.clientName }}</p>
                      <p class="text-xs font-medium text-slate-500">{{ req.service }}</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-lg font-black text-slate-900 tracking-tighter">$\{{ req.earnings }}</p>
                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Est. Earnings</p>
                  </div>
                </div>
                
                <div class="flex gap-3">
                  <button mat-flat-button color="primary" class="flex-grow !py-6 !rounded-xl !font-black !text-[10px] !uppercase !tracking-widest" (click)="state.acceptBooking(req.id)">
                    Accept Work
                  </button>
                  <button mat-stroked-button class="!border-slate-100 !text-slate-400 !px-6 !rounded-xl !font-black !text-[10px] !uppercase !tracking-widest" (click)="state.declineBooking(req.id)">
                    Decline
                  </button>
                </div>
              </mat-card>
            }
          </div>
        </div>
      }

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <mat-card class="!rounded-[2.5rem] !border !border-slate-100 !shadow-sm !p-10 group hover:!border-blue-600 transition-all cursor-pointer" routerLink="../profile">
          <div class="flex items-center gap-6">
            <div class="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
              <mat-icon>person</mat-icon>
            </div>
            <div>
              <h3 class="text-xl font-black text-slate-900">1. Manage Profile</h3>
              <p class="text-sm text-slate-500 font-medium">Bio, skills, and work rates.</p>
            </div>
          </div>
        </mat-card>

        <mat-card class="!rounded-[2.5rem] !border !border-slate-100 !shadow-sm !p-10 group hover:!border-teal-600 transition-all cursor-pointer" routerLink="../verification">
          <div class="flex items-center gap-6">
            <div class="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-all">
              <mat-icon>file_upload</mat-icon>
            </div>
            <div>
              <h3 class="text-xl font-black text-slate-900">2. Upload Documents</h3>
              <p class="text-sm text-slate-500 font-medium">ID, licenses, and certificates.</p>
            </div>
          </div>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class WorkerDashboardOverviewPage {
  state = inject(PlatformStateService);
  private snackBar = inject(MatSnackBar);

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
      this.snackBar.open('❌ Please complete your profile details (100%) before submitting for review.', 'Dismiss', {
        duration: 5000,
        panelClass: ['!bg-red-900', '!text-white', '!rounded-2xl']
      });
      return;
    }

    this.state.submitForVerification();
    this.snackBar.open('✓ Application submitted successfully!', 'Great', {
      duration: 4000,
      panelClass: ['!bg-slate-900', '!text-white', '!rounded-2xl']
    });
  }
}
