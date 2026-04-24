import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { PlatformStateService } from '../../../core/services/platform-state.service';

@Component({
  selector: 'app-worker-profile',
  standalone: true,
  imports: [
    CommonModule, 
    MatCardModule, 
    MatButtonModule, 
    MatIconModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatChipsModule, 
    MatDividerModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    FormsModule
  ],
  template: `
    <div class="space-y-8 animate-in fade-in duration-500">
      <!-- Rejection Alert -->
      @if (status === 'Rejected' && rejectionReason) {
        <mat-card class="!rounded-3xl !bg-red-50 !border-2 !border-red-100 !shadow-sm animate-in slide-in-from-top">
          <mat-card-content class="!p-8 flex items-start gap-6">
            <div class="flex-shrink-0">
              <mat-icon class="!text-[32px] !w-auto !h-auto text-red-600">warning</mat-icon>
            </div>
            <div class="flex-1">
              <h3 class="font-black text-red-900 mb-2">Verification Rejected</h3>
              <p class="text-sm text-red-800 font-medium mb-4">{{ rejectionReason }}</p>
              <p class="text-xs text-red-700 font-black uppercase tracking-widest">✓ Please update your documents and click "Resubmit For Verification" below.</p>
            </div>
          </mat-card-content>
        </mat-card>
      }

      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 class="text-5xl font-black text-slate-900 tracking-tighter">Profile Management</h1>
          <p class="text-slate-500 font-medium mt-1">Update your professional identity and marketplace presence.</p>
        </div>
        <div class="flex gap-3">
          <button mat-stroked-button class="!border-slate-900 !text-slate-900 !px-8 !py-6 !rounded-2xl !font-black !text-sm">Cancel</button>
          @if (status === 'Draft' || status === 'Rejected') {
            <button mat-flat-button color="primary" (click)="goToDocuments()" class="!px-8 !py-6 !rounded-2xl !font-black !text-sm !shadow-xl shadow-blue-900/40">
              <mat-icon>arrow_forward</mat-icon> Next: Upload Documents
            </button>
          } @else if (status === 'Pending') {
            <div class="px-6 py-4 bg-blue-50 text-blue-700 rounded-xl font-black text-xs uppercase tracking-widest border border-blue-100">
              Under Review
            </div>
          } @else {
            <div class="px-6 py-4 bg-teal-50 text-teal-700 rounded-xl font-black text-xs uppercase tracking-widest border border-teal-100 flex items-center gap-2">
              <mat-icon class="!text-sm">verified</mat-icon> Profile Verified
            </div>
          }
        </div>
      </div>

      <div class="grid grid-cols-12 gap-8">
        <!-- Sidebar -->
        <div class="col-span-12 lg:col-span-4 space-y-8">
          <mat-card class="!rounded-3xl !border !border-slate-100 !shadow-sm !overflow-hidden">
            <mat-card-content class="!p-8 text-center">
              <div class="relative inline-block group mb-6">
                <img class="w-40 h-40 rounded-full border-4 border-slate-50 shadow-2xl object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDNa6H8lcicPMcBd2CL8FS4giFI4AQxRqB2xzs-iuz8dPD9zwg2aeh1dUonSYmMRiJxtfLrsg7qccTIvpPz4KTfjCho58Sy9-WC_w9O_MO7i0sAfdFVqMKHbmfP0zkXvQ-BhMfI9pdL9nLp7RAnDzthz2J_OK683jGwAJD4L67ZCQh131sjcUQ3LkFZJHdxQ6WVaGZiWHXYA74igT6jTbgAPJmf24IVmGESXqNrY6qYA78g0SgDtoufHz2yv8zUkXjIZMk5u1BnGk8">
              </div>
              <h3 class="text-2xl font-black text-slate-900">David Harrison</h3>
              <div class="flex items-center justify-center gap-2 mt-3">
                @switch (status) {
                  @case ('Draft') {
                    <mat-icon class="!text-sm !w-auto !h-auto text-slate-400">edit_note</mat-icon>
                    <p class="text-[10px] text-slate-500 font-black uppercase tracking-widest">Status: Draft</p>
                  }
                  @case ('Pending') {
                    <mat-icon class="!text-sm !w-auto !h-auto text-amber-600">hourglass_top</mat-icon>
                    <p class="text-[10px] text-amber-700 font-black uppercase tracking-widest">Status: Pending</p>
                  }
                  @case ('Verified') {
                    <mat-icon class="!text-sm !w-auto !h-auto text-teal-600">check_circle</mat-icon>
                    <p class="text-[10px] text-teal-700 font-black uppercase tracking-widest">Status: Verified</p>
                  }
                  @case ('Rejected') {
                    <mat-icon class="!text-sm !w-auto !h-auto text-red-600">cancel</mat-icon>
                    <p class="text-[10px] text-red-700 font-black uppercase tracking-widest">Status: Rejected</p>
                  }
                }
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="!rounded-3xl !border !border-slate-100 !shadow-sm !p-8">
             <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Service Availability</h4>
             <div class="space-y-6">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-bold text-slate-700">Market Visibility</span>
                  <mat-slide-toggle color="primary" [checked]="status === 'Verified'" [disabled]="status !== 'Verified'"></mat-slide-toggle>
                </div>
             </div>
          </mat-card>
        </div>

        <!-- Main Form -->
        <div class="col-span-12 lg:col-span-8 space-y-8">
           <mat-card class="!rounded-3xl !border !border-slate-100 !shadow-sm !p-8">
             <h4 class="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-6">Profile Completion</h4>
             <div class="flex items-center gap-4">
               <div class="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                 <div class="h-full bg-blue-600 transition-all duration-1000" [style.width.%]="completionPercentage()"></div>
               </div>
               <span class="text-xs font-black text-slate-900">{{ completionPercentage() }}%</span>
             </div>
             @if (completionPercentage() < 100) {
               <p class="text-xs text-slate-500 mt-4 font-medium italic">Complete your profile details to reach 100% and enable marketplace visibility.</p>
             } @else {
               <p class="text-xs text-teal-600 mt-4 font-black uppercase tracking-widest">Profile 100% Complete!</p>
             }
           </mat-card>

          <mat-card class="!rounded-3xl !border !border-slate-100 !shadow-sm !p-8">
            <h4 class="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-6">Professional Identity</h4>
            <div class="space-y-6">
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Full Name</mat-label>
                <input matInput [(ngModel)]="worker().name" placeholder="e.g. David Harrison">
              </mat-form-field>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <mat-form-field appearance="outline">
                  <mat-label>Primary Category</mat-label>
                  <mat-select [(ngModel)]="worker().category">
                    <mat-option value="Master Electrician">Master Electrician</mat-option>
                    <mat-option value="Senior Plumber">Senior Plumber</mat-option>
                    <mat-option value="General Labor">General Labor</mat-option>
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Hourly Rate ($)</mat-label>
                  <input matInput type="number" [(ngModel)]="worker().rate">
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Professional Bio</mat-label>
                <textarea matInput rows="4" [(ngModel)]="worker().bio" placeholder="Describe your experience and specialties..."></textarea>
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Core Skills (Comma separated)</mat-label>
                <input matInput [ngModel]="worker().skills.join(', ')" (ngModelChange)="updateSkills($event)" placeholder="e.g. Wiring, Repairs, Safety">
              </mat-form-field>
            </div>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class WorkerProfilePage {
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  state = inject(PlatformStateService);

  get status() {
    return this.state.currentWorker().status;
  }

  get rejectionReason() {
    return this.state.currentWorker().rejectionReason;
  }

  completionPercentage = computed(() => this.state.currentWorkerCompletion());

  worker = this.state.currentWorker;

  updateSkills(val: string) {
    const skills = val.split(',').map(s => s.trim()).filter(s => s.length > 0);
    this.worker().skills = skills;
  }

  submit() {
    this.state.submitForVerification();
    this.snackBar.open('Profile submitted to Admins for verification.', 'Dismiss', {
      duration: 5000,
      panelClass: ['bg-slate-900', 'text-white']
    });
  }

  resubmit() {
    this.state.resubmitWorker(this.state.currentWorker().id);
    this.snackBar.open('✓ Profile resubmitted for review.', 'Dismiss', {
      duration: 5000,
      panelClass: ['bg-slate-900', 'text-white']
    });
  }

  goToDocuments() {
    this.router.navigate(['/worker/verification']);
    this.snackBar.open('Identity details saved. Please upload your documents.', 'Continue', { duration: 3000 });
  }
}
