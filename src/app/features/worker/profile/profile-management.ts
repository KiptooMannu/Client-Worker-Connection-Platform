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
          <button mat-flat-button color="primary" (click)="saveProfile()" class="!px-8 !py-6 !rounded-2xl !font-black !text-sm !shadow-xl shadow-blue-900/40">
            <mat-icon>save</mat-icon> Save Profile
          </button>
        </div>
      </div>

      <div class="grid grid-cols-12 gap-8">
        <!-- Sidebar -->
        <div class="col-span-12 lg:col-span-4 space-y-8">
          <mat-card class="!rounded-3xl !border !border-slate-100 !shadow-sm !overflow-hidden">
            <mat-card-content class="!p-8 text-center">
              <div class="relative inline-block group mb-6 cursor-pointer" (click)="avatarInput.click()">
                <input #avatarInput type="file" accept="image/*" (change)="onAvatarSelected($event)" class="hidden">
                <div class="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-10">
                   <mat-icon class="!text-white">photo_camera</mat-icon>
                </div>
                @if (worker().image) { <img class="w-40 h-40 rounded-full border-4 border-slate-50 shadow-2xl object-cover" [src]="worker().image"> }
                @else { <div class="w-40 h-40 rounded-full border-4 border-slate-50 shadow-2xl bg-blue-50 flex items-center justify-center text-5xl font-black text-blue-700">{{ worker().initials }}</div> }
              </div>
              <h3 class="text-2xl font-black text-slate-900">{{ worker().name }}</h3>
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
                <input matInput [(ngModel)]="form.name" name="name" placeholder="e.g. David Harrison">
              </mat-form-field>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <mat-form-field appearance="outline">
                  <mat-label>Primary Category</mat-label>
                  <mat-select [(ngModel)]="form.category" name="category">
                    <mat-option value="Plumber">Plumber</mat-option>
                    <mat-option value="Electrician">Electrician</mat-option>
                    <mat-option value="Farm Worker">Farm Worker</mat-option>
                    <mat-option value="Cleaner">Cleaner</mat-option>
                    <mat-option value="Mechanic">Mechanic</mat-option>
                    <mat-option value="General Laborer">General Laborer</mat-option>
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Hourly Rate ($)</mat-label>
                  <input matInput type="number" [(ngModel)]="form.rate" name="rate">
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Professional Bio</mat-label>
                <textarea matInput rows="4" [(ngModel)]="form.bio" name="bio" placeholder="Describe your experience and specialties..."></textarea>
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Core Skills (Comma separated)</mat-label>
                <input matInput [(ngModel)]="form.skills" name="skills" placeholder="e.g. Wiring, Repairs, Safety">
              </mat-form-field>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <mat-form-field appearance="outline">
                  <mat-label>Primary Work Location</mat-label>
                  <input matInput [(ngModel)]="form.location" name="location" placeholder="e.g. Nairobi">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Preferred Job Locations (Comma separated)</mat-label>
                  <input matInput [(ngModel)]="form.preferredLocations" name="preferredLocations" placeholder="e.g. Westlands, Kilimani">
                </mat-form-field>
              </div>
            </div>
          </mat-card>

          <!-- Work History & Experience -->
          <mat-card class="!rounded-3xl !border !border-slate-100 !shadow-sm !p-8">
            <div class="flex justify-between items-center mb-6">
              <h4 class="text-[10px] font-black text-slate-900 uppercase tracking-widest">Work History & Experience</h4>
              <button mat-button color="primary" (click)="addWorkHistory()" class="!font-black !text-[10px] !uppercase !tracking-widest">
                <mat-icon class="!text-sm">add</mat-icon> Add Experience
              </button>
            </div>
            <div class="space-y-6">
              @for (work of form.workHistory; track $index) {
                <div class="p-6 bg-slate-50 rounded-2xl border border-slate-100 relative group/item">
                  <button mat-icon-button (click)="removeWorkHistory($index)" class="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity">
                    <mat-icon>delete</mat-icon>
                  </button>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <mat-form-field appearance="outline">
                      <mat-label>Company / Project</mat-label>
                      <input matInput [(ngModel)]="work.company" placeholder="e.g. Self-Employed">
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Role</mat-label>
                      <input matInput [(ngModel)]="work.role" placeholder="e.g. Lead Plumber">
                    </mat-form-field>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <mat-form-field appearance="outline">
                      <mat-label>Period</mat-label>
                      <input matInput [(ngModel)]="work.period" placeholder="e.g. 2020 - 2023">
                    </mat-form-field>
                  </div>
                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Description</mat-label>
                    <textarea matInput rows="2" [(ngModel)]="work.description" placeholder="Describe your responsibilities..."></textarea>
                  </mat-form-field>
                </div>
              }
              @if (form.workHistory.length === 0) {
                <p class="text-xs text-slate-400 italic text-center py-4">No work history added yet.</p>
              }
            </div>
          </mat-card>

          <!-- Certifications -->
          <mat-card class="!rounded-3xl !border !border-slate-100 !shadow-sm !p-8">
            <div class="flex justify-between items-center mb-6">
              <h4 class="text-[10px] font-black text-slate-900 uppercase tracking-widest">Professional Certifications</h4>
              <button mat-button color="primary" (click)="addCertification()" class="!font-black !text-[10px] !uppercase !tracking-widest">
                <mat-icon class="!text-sm">add</mat-icon> Add Certification
              </button>
            </div>
            <div class="space-y-4">
              @for (cert of form.certifications; track $index) {
                <div class="flex flex-col md:flex-row gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 items-end group/cert">
                  <mat-form-field appearance="outline" class="flex-1">
                    <mat-label>Certificate Name</mat-label>
                    <input matInput [(ngModel)]="cert.name">
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="flex-1">
                    <mat-label>Issuing Institution</mat-label>
                    <input matInput [(ngModel)]="cert.issuer">
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="w-24">
                    <mat-label>Year</mat-label>
                    <input matInput [(ngModel)]="cert.year">
                  </mat-form-field>
                  <button mat-icon-button (click)="removeCertification($index)" class="mb-4 text-slate-300 hover:text-red-500 opacity-0 group-hover/cert:opacity-100 transition-opacity">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              }
              @if (form.certifications.length === 0) {
                <p class="text-xs text-slate-400 italic text-center py-4">No certifications added yet.</p>
              }
            </div>
          </mat-card>

          <!-- Availability Details -->
          <mat-card class="!rounded-3xl !border !border-slate-100 !shadow-sm !p-8">
            <h4 class="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-6">Detailed Availability</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div class="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div class="flex flex-col">
                  <span class="text-xs font-black text-slate-900 uppercase">Weekdays</span>
                  <span class="text-[10px] text-slate-500">Mon - Fri</span>
                </div>
                <mat-slide-toggle color="primary" [(ngModel)]="form.availabilityDetails.weekdays"></mat-slide-toggle>
              </div>
              <div class="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div class="flex flex-col">
                  <span class="text-xs font-black text-slate-900 uppercase">Weekends</span>
                  <span class="text-[10px] text-slate-500">Sat - Sun</span>
                </div>
                <mat-slide-toggle color="primary" [(ngModel)]="form.availabilityDetails.weekends"></mat-slide-toggle>
              </div>
              <div class="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div class="flex flex-col">
                  <span class="text-xs font-black text-slate-900 uppercase">Evenings</span>
                  <span class="text-[10px] text-slate-500">After 6 PM</span>
                </div>
                <mat-slide-toggle color="primary" [(ngModel)]="form.availabilityDetails.evenings"></mat-slide-toggle>
              </div>
            </div>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    
    @media (max-width: 768px) {
      .text-5xl { font-size: 2.25rem !important; }
      .text-4xl { font-size: 1.75rem !important; }
      .p-8 { padding: 1.5rem !important; }
      .gap-8 { gap: 1rem !important; }
      .w-40 { width: 8rem !important; height: 8rem !important; }
      .flex-col.md\\:flex-row.justify-between.items-start.md\\:items-end.gap-6 {
        align-items: stretch !important;
      }
      .flex.gap-3 {
        flex-direction: column !important;
      }
    }
  `]
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

  // Local form state
  form = {
    name: this.state.currentWorker().name,
    category: this.state.currentWorker().category,
    rate: this.state.currentWorker().rate,
    bio: this.state.currentWorker().bio,
    skills: this.state.currentWorker().skills.join(', '),
    location: this.state.currentWorker().location,
    preferredLocations: this.state.currentWorker().preferredLocations.join(', '),
    workHistory: JSON.parse(JSON.stringify(this.state.currentWorker().workHistory)),
    certifications: JSON.parse(JSON.stringify(this.state.currentWorker().certifications)),
    availabilityDetails: { ...this.state.currentWorker().availabilityDetails }
  };

  async onAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.snackBar.open('⌛ Processing profile picture (Moving to backend)...', 'Wait', { duration: 2000 });

    try {
      // Create a local preview URL instead of uploading to Cloudinary
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        this.state.currentWorker.update(w => ({ ...w, image: url }));
        this.snackBar.open('✓ Profile picture updated locally!', 'Dismiss', { duration: 3000 });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      this.snackBar.open('❌ Local processing failed.', 'Dismiss', { duration: 5000 });
    }
  }

  addWorkHistory() {
    this.form.workHistory.push({ company: '', role: '', period: '', description: '' });
  }

  removeWorkHistory(index: number) {
    this.form.workHistory.splice(index, 1);
  }

  addCertification() {
    this.form.certifications.push({ name: '', issuer: '', year: '' });
  }

  removeCertification(index: number) {
    this.form.certifications.splice(index, 1);
  }

  saveProfile() {
    const skills = this.form.skills.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
    const preferredLocations = this.form.preferredLocations.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
    
    this.state.currentWorker.update(w => ({
      ...w,
      name: this.form.name,
      category: this.form.category,
      rate: Number(this.form.rate),
      bio: this.form.bio,
      skills,
      location: this.form.location,
      preferredLocations,
      workHistory: this.form.workHistory,
      certifications: this.form.certifications,
      availabilityDetails: this.form.availabilityDetails,
      initials: this.form.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    }));
    this.snackBar.open('✓ Profile saved successfully!', 'Dismiss', {
      duration: 3000,
      panelClass: ['!bg-slate-900', '!text-white', '!rounded-2xl']
    });
  }

  submit() {
    this.saveProfile();
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

  resubmit() {
    this.saveProfile();
    this.state.resubmitWorker(this.state.currentWorker().id);
    this.snackBar.open('✓ Profile resubmitted for review.', 'Dismiss', {
      duration: 5000,
      panelClass: ['!bg-slate-900', '!text-white', '!rounded-2xl']
    });
  }

  goToDocuments() {
    this.saveProfile();
    this.router.navigate(['/worker/verification']);
  }
}
