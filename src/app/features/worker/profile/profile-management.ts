import { Component, inject, signal, computed, effect } from '@angular/core';
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
import { NotificationService } from '../../../core/services/notification.service';
import { FormsModule } from '@angular/forms';
import { PlatformStateService } from '../../../core/services/platform-state.service';
import { AuthService } from '../../../core/services/auth.service';

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
    FormsModule
  ],
  template: `
    <div class="space-y-8 animate-in fade-in duration-500">
      <!-- Rejection Alert (unchanged) -->
      @if (status === 'Rejected' && rejectionReason) {
        <mat-card class="!rounded-2xl !bg-red-50 !border-2 !border-red-100 !shadow-sm animate-in slide-in-from-top">
          <mat-card-content class="!p-6 flex items-start gap-4">
            <div class="flex-shrink-0">
              <mat-icon class="!text-2xl !w-auto !h-auto text-red-600">warning</mat-icon>
            </div>
            <div class="flex-1">
              <h3 class="font-black text-red-900 mb-1 text-sm">Verification Rejected</h3>
              <p class="text-xs text-red-800 font-medium mb-3">{{ rejectionReason }}</p>
              <p class="text-[10px] text-red-700 font-black uppercase tracking-widest">✓ Please update your documents and resubmit below.</p>
            </div>
          </mat-card-content>
        </mat-card>
      }

      <!-- Header (unchanged) -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 class="header-title text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">Profile Management</h1>
          <p class="text-slate-500 text-sm font-medium mt-1">Update your professional identity and presence.</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button mat-stroked-button [disabled]="isSaving()" class="!border-slate-900 !text-slate-900 !px-6 !py-3 !rounded-xl !font-black !text-[11px] !uppercase !tracking-widest">Cancel</button>
          @if (status === 'Draft' || status === 'Rejected') {
            <button mat-flat-button color="primary" [disabled]="isSaving()" (click)="goToDocuments()" class="!px-6 !py-3 !rounded-xl !font-black !text-[11px] !uppercase !tracking-widest !shadow-lg">
              Next Step
            </button>
          } @else if (status === 'Pending') {
            <div class="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-black text-[10px] uppercase tracking-widest border border-blue-100">
              Under Review
            </div>
          }
          <button mat-flat-button color="primary" [disabled]="isSaving()" (click)="saveProfile()" class="!px-6 !py-3 !rounded-xl !font-black !text-[11px] !uppercase !tracking-widest !shadow-lg">
            <mat-icon class="!text-xs mr-1">{{ isSaving() ? 'hourglass_empty' : 'save' }}</mat-icon>
            {{ isSaving() ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-12 gap-8">
        <!-- Sidebar (unchanged) -->
        <div class="col-span-12 lg:col-span-4 space-y-6">
          <mat-card class="!rounded-2xl !border !border-slate-100 !shadow-sm !overflow-hidden">
            <mat-card-content class="!p-6 text-center">
              <div class="relative inline-block group mb-4 cursor-pointer" (click)="avatarInput.click()">
                <input #avatarInput type="file" accept="image/*" (change)="onAvatarSelected($event)" class="hidden">
                <div class="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-10">
                   <mat-icon class="!text-white">photo_camera</mat-icon>
                </div>
                @if (worker().image) { 
                  <img class="w-32 h-32 rounded-full border-4 border-slate-50 shadow-xl object-cover" [src]="worker().image">
                  <button (click)="$event.stopPropagation(); removeProfilePicture()" 
                          class="absolute -top-1 -right-1 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-700 transition-colors z-20">
                    <mat-icon class="!text-sm">close</mat-icon>
                  </button>
                }
                @else { <div class="w-32 h-32 rounded-full border-4 border-slate-50 shadow-xl bg-blue-50 flex items-center justify-center text-4xl font-black text-blue-700">{{ worker().initials }}</div> }
              </div>
              <h3 class="text-xl font-black text-slate-900">{{ worker().name }}</h3>
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

          <mat-card class="!rounded-3xl !border !border-slate-100 !shadow-sm !p-6">
             <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Verification Checklist</h4>
             <div class="space-y-4">
               @for (req of requirements(); track req.label) {
                 <div class="flex items-center gap-3">
                   <mat-icon [class]="req.done ? 'text-teal-600' : 'text-slate-200'" class="!text-lg">
                     {{ req.done ? 'check_circle' : 'radio_button_unchecked' }}
                   </mat-icon>
                   <span class="text-xs font-bold" [class]="req.done ? 'text-slate-900' : 'text-slate-400'">{{ req.label }}</span>
                 </div>
               }
             </div>
             
             @if (completionPercentage() < 100) {
                <div class="mt-8 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <p class="text-[9px] font-black text-indigo-800 uppercase tracking-widest mb-1">Onboarding Guide</p>
                  <p class="text-[10px] text-indigo-700 font-medium">Follow the "Next Step" buttons to complete your professional setup sequentially.</p>
                </div>
              }
          </mat-card>

          <mat-card class="!rounded-3xl !border !border-slate-100 !shadow-sm !p-6">
             <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Service Availability</h4>
             <div class="space-y-6">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-bold text-slate-700">Market Visibility</span>
                  <mat-slide-toggle color="primary" [checked]="status === 'Verified'" [disabled]="status !== 'Verified'"></mat-slide-toggle>
                </div>
             </div>
          </mat-card>
        </div>

        <!-- Main Form with Tabs -->
        <div class="col-span-12 lg:col-span-8 space-y-6">
          <!-- Profile Completion Card (still visible across tabs) -->
          <mat-card class="!rounded-2xl !border !border-slate-100 !shadow-sm !p-6">
            <h4 class="text-[9px] font-black text-slate-900 uppercase tracking-widest mb-4">Profile Completion</h4>
            <div class="flex items-center gap-4">
              <div class="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full bg-blue-600 transition-all duration-1000" [style.width.%]="completionPercentage()"></div>
              </div>
              <span class="text-[10px] font-black text-slate-900">{{ completionPercentage() }}%</span>
            </div>
          </mat-card>

          <!-- Tab Switcher -->
          <div class="flex gap-1 p-1 bg-slate-100/50 rounded-xl border border-slate-200 overflow-x-auto no-scrollbar whitespace-nowrap">
            @for (tab of tabs; track tab.id) {
              <button (click)="activeTab.set(tab.id)"
                      class="flex-shrink-0 flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 font-black text-[10px] uppercase tracking-wider"
                      [class]="activeTab() === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'">
                <mat-icon class="!text-base">{{ tab.icon }}</mat-icon>
                {{ tab.label }}
              </button>
            }
          </div>

          <!-- Tab Content (each section in its own scrollable container) -->
          <div class="min-h-[500px] transition-all duration-300">
            <!-- Identity Tab -->
            @if (activeTab() === 'identity') {
              <mat-card class="!rounded-2xl !border !border-slate-100 !shadow-sm !p-6">
                <h4 class="text-[9px] font-black text-slate-900 uppercase tracking-widest mb-4">Professional Identity</h4>
                <div class="space-y-4">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <mat-form-field appearance="outline">
                      <mat-label>Full Name</mat-label>
                      <input matInput [ngModel]="form.name()" (ngModelChange)="form.name.set($event)" name="name" placeholder="Enter your full name">
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Phone Number (Mandatory)</mat-label>
                      <input matInput [ngModel]="form.phoneNumber()" (ngModelChange)="form.phoneNumber.set($event)" name="phoneNumber" placeholder="e.g. +254 700 000000">
                      <mat-icon matPrefix class="mr-2 text-slate-400">phone</mat-icon>
                    </mat-form-field>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <mat-form-field appearance="outline">
                      <mat-label>Primary Category</mat-label>
                      <mat-select [ngModel]="form.category()" (ngModelChange)="form.category.set($event)" name="category">
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
                      <input matInput type="number" [ngModel]="form.rate()" (ngModelChange)="form.rate.set($event)" name="rate" placeholder="0">
                    </mat-form-field>
                  </div>

                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Professional Bio</mat-label>
                    <textarea matInput rows="3" [ngModel]="form.bio()" (ngModelChange)="form.bio.set($event)" name="bio" placeholder="Describe your experience..."></textarea>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Core Skills (Comma separated)</mat-label>
                    <input matInput [ngModel]="form.skills()" (ngModelChange)="form.skills.set($event)" name="skills" placeholder="e.g. Plumbing, Leak Detection">
                  </mat-form-field>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <mat-form-field appearance="outline">
                      <mat-label>Primary Work Location</mat-label>
                      <input matInput [ngModel]="form.location()" (ngModelChange)="form.location.set($event)" name="location" placeholder="e.g. Nairobi">
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Preferred Job Locations (Comma separated)</mat-label>
                      <input matInput [ngModel]="form.preferredLocations()" (ngModelChange)="form.preferredLocations.set($event)" name="preferredLocations" placeholder="e.g. Westlands, Kilimani">
                    </mat-form-field>
                  </div>
                  
                  <div class="pt-6 flex justify-end">
                    <button mat-flat-button color="primary" (click)="nextTab()" class="!px-10 !py-3 !rounded-xl !font-black !text-[11px] !uppercase !tracking-widest shadow-lg">
                      Next: Experience <mat-icon class="ml-2">arrow_forward</mat-icon>
                    </button>
                  </div>
                </div>
              </mat-card>
            }

            <!-- Work History Tab -->
            @if (activeTab() === 'experience') {
              <mat-card class="!rounded-2xl !border !border-slate-100 !shadow-sm !p-6">
                <div class="flex justify-between items-center mb-6">
                  <h4 class="text-[10px] font-black text-slate-900 uppercase tracking-widest">Work History & Experience</h4>
                  <button mat-button color="primary" (click)="addWorkHistory()" class="!font-black !text-[10px] !uppercase !tracking-widest">
                    <mat-icon class="!text-sm">add</mat-icon> Add Experience
                  </button>
                </div>
                <!-- Scrollable list of work entries -->
                <div class="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  @for (work of form.workHistory(); track $index) {
                    <div class="p-4 bg-slate-50 rounded-xl border border-slate-100 relative group/item">
                      <button mat-icon-button (click)="removeWorkHistory($index)" class="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity">
                        <mat-icon>delete</mat-icon>
                      </button>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <mat-form-field appearance="outline" class="!mb-0">
                          <mat-label>Company / Project</mat-label>
                          <input matInput [(ngModel)]="work.company">
                        </mat-form-field>
                        <mat-form-field appearance="outline" class="!mb-0">
                          <mat-label>Role</mat-label>
                          <input matInput [(ngModel)]="work.role">
                        </mat-form-field>
                      </div>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <mat-form-field appearance="outline" class="!mb-0">
                          <mat-label>Period</mat-label>
                          <input matInput [(ngModel)]="work.period">
                        </mat-form-field>
                      </div>
                      <mat-form-field appearance="outline" class="w-full !mb-0">
                        <mat-label>Description</mat-label>
                        <textarea matInput rows="2" [(ngModel)]="work.description"></textarea>
                      </mat-form-field>
                    </div>
                  } @empty {
                    <div class="text-center py-8 text-slate-400 text-sm">No experience added yet. Click "Add Experience" to start.</div>
                  }
                </div>
                
                <div class="pt-6 flex justify-end">
                  <button mat-flat-button color="primary" (click)="nextTab()" class="!px-10 !py-3 !rounded-xl !font-black !text-[11px] !uppercase !tracking-widest shadow-lg">
                    Next: Certifications <mat-icon class="ml-2">arrow_forward</mat-icon>
                  </button>
                </div>
              </mat-card>
            }

            <!-- Certifications Tab -->
            @if (activeTab() === 'certifications') {
              <mat-card class="!rounded-2xl !border !border-slate-100 !shadow-sm !p-6">
                <div class="flex justify-between items-center mb-6">
                  <h4 class="text-[10px] font-black text-slate-900 uppercase tracking-widest">Professional Certifications</h4>
                  <button mat-button color="primary" (click)="addCertification()" class="!font-black !text-[10px] !uppercase !tracking-widest">
                    <mat-icon class="!text-sm">add</mat-icon> Add Certification
                  </button>
                </div>
                <div class="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  @for (cert of form.certifications(); track $index) {
                    <div class="flex flex-col md:flex-row gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 items-end group/cert">
                      <mat-form-field appearance="outline" class="flex-1 !mb-0">
                        <mat-label>Certificate Name</mat-label>
                        <input matInput [(ngModel)]="cert.name">
                      </mat-form-field>
                      <mat-form-field appearance="outline" class="flex-1 !mb-0">
                        <mat-label>Issuing Institution</mat-label>
                        <input matInput [(ngModel)]="cert.issuer">
                      </mat-form-field>
                      <mat-form-field appearance="outline" class="w-24 !mb-0">
                        <mat-label>Year</mat-label>
                        <input matInput [(ngModel)]="cert.year">
                      </mat-form-field>
                      <button mat-icon-button (click)="removeCertification($index)" class="text-slate-300 hover:text-red-500 opacity-0 group-hover/cert:opacity-100 transition-opacity">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  } @empty {
                    <div class="text-center py-8 text-slate-400 text-sm">No certifications added yet. Click "Add Certification" to start.</div>
                  }
                </div>
                
                <div class="pt-6 flex justify-end">
                  <button mat-flat-button color="primary" (click)="nextTab()" class="!px-10 !py-3 !rounded-xl !font-black !text-[11px] !uppercase !tracking-widest shadow-lg">
                    Next: Availability <mat-icon class="ml-2">arrow_forward</mat-icon>
                  </button>
                </div>
              </mat-card>
            }

            <!-- Availability Tab -->
            @if (activeTab() === 'availability') {
              <mat-card class="!rounded-2xl !border !border-slate-100 !shadow-sm !p-6">
                <h4 class="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-6">Detailed Availability</h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div class="flex items-center justify-between flex-wrap gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 availability-card">
                    <div class="flex flex-col min-w-[120px]">
                      <span class="text-xs font-black text-slate-900 uppercase">Weekdays</span>
                      <span class="text-[10px] text-slate-500">Mon - Fri</span>
                    </div>
                    <mat-slide-toggle color="primary" [ngModel]="form.availabilityDetails().weekdays" (ngModelChange)="form.availabilityDetails.set({...form.availabilityDetails(), weekdays: $event})" name="weekdays"></mat-slide-toggle>
                  </div>
                  <div class="flex items-center justify-between flex-wrap gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 availability-card">
                    <div class="flex flex-col min-w-[120px]">
                      <span class="text-xs font-black text-slate-900 uppercase">Weekends</span>
                      <span class="text-[10px] text-slate-500">Sat - Sun</span>
                    </div>
                    <mat-slide-toggle color="primary" [ngModel]="form.availabilityDetails().weekends" (ngModelChange)="form.availabilityDetails.set({...form.availabilityDetails(), weekends: $event})" name="weekends"></mat-slide-toggle>
                  </div>
                  <div class="flex items-center justify-between flex-wrap gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 availability-card">
                    <div class="flex flex-col min-w-[120px]">
                      <span class="text-xs font-black text-slate-900 uppercase">Evenings</span>
                      <span class="text-[10px] text-slate-500">After 6 PM</span>
                    </div>
                    <mat-slide-toggle color="primary" [ngModel]="form.availabilityDetails().evenings" (ngModelChange)="form.availabilityDetails.set({...form.availabilityDetails(), evenings: $event})" name="evenings"></mat-slide-toggle>
                  </div>
                </div>

                <div class="pt-8 flex justify-end">
                  <button mat-flat-button color="primary" (click)="goToDocuments()" class="!px-10 !py-4 !rounded-2xl !font-black !text-xs !uppercase !tracking-widest shadow-xl bg-slate-900 text-white">
                    Final Step: Verification <mat-icon class="ml-2">verified_user</mat-icon>
                  </button>
                </div>
              </mat-card>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }

    .availability-card {
      transition: all 0.2s ease;
    }
    .availability-card:hover {
      border-color: #cbd5e1 !important;
      background: #f8fafc !important;
    }

    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    
    @media (max-width: 768px) {
      .header-title { font-size: 1.75rem !important; }
      mat-card-content { padding: 1.25rem !important; }
      .gap-8 { gap: 1rem !important; }
      .w-32 { width: 6rem !important; height: 6rem !important; }
      .flex-col.md\\:flex-row { align-items: stretch !important; }
    }
  `]
})
export class WorkerProfilePage {
  private notification = inject(NotificationService);
  private router = inject(Router);
  public auth = inject(AuthService);
  state = inject(PlatformStateService);

  activeTab = signal<'identity' | 'experience' | 'certifications' | 'availability'>('identity');

  tabs: { id: 'identity' | 'experience' | 'certifications' | 'availability', label: string, icon: string }[] = [
    { id: 'identity', label: 'Identity', icon: 'person' },
    { id: 'experience', label: 'Experience', icon: 'work' },
    { id: 'certifications', label: 'Certifications', icon: 'verified' },
    { id: 'availability', label: 'Availability', icon: 'schedule' }
  ];

  get status() { return this.state.currentWorker().status; }
  get rejectionReason() { return this.state.currentWorker().rejectionReason; }

  completionPercentage = computed(() => this.state.currentWorkerCompletion());
  isSaving = signal(false);
  worker = this.state.currentWorker;

  requirements = computed(() => {
    const w = this.worker();
    return [
      { label: 'Basic Info & Name', done: !!w.name },
      { label: 'Primary Category', done: !!w.category },
      { label: 'Professional Bio', done: !!w.bio && w.bio.length > 20 },
      { label: 'Work History', done: w.workHistory && w.workHistory.length > 0 },
      { label: 'Skills Added', done: w.skills && w.skills.length > 0 },
      { label: 'ID Front Uploaded', done: (w.uploadedDocuments || []).some((d: any) => d.type === 'ID-Front') },
      { label: 'ID Back Uploaded', done: (w.uploadedDocuments || []).some((d: any) => d.type === 'ID-Back') }
    ];
  });

  // Local reactive form state
  form = {
    name: signal(''),
    phoneNumber: signal(''),
    category: signal(''),
    rate: signal(0),
    bio: signal(''),
    skills: signal(''),
    location: signal(''),
    preferredLocations: signal(''),
    workHistory: signal<any[]>([]),
    certifications: signal<any[]>([]),
    availabilityDetails: signal({ weekdays: true, weekends: false, evenings: false }),
    image: signal<string | undefined>(undefined)
  };

  constructor() {
    effect(() => {
      const w = this.state.currentWorker();
      if (w && w.id) {
        this.form.name.set(w.name || '');
        this.form.phoneNumber.set(w.phoneNumber || '');
        this.form.category.set(w.category || '');
        this.form.rate.set(w.rate || 0);
        this.form.bio.set(w.bio || '');
        this.form.skills.set((w.skills || []).join(', '));
        this.form.location.set(w.location || '');
        this.form.preferredLocations.set((w.preferredLocations || []).join(', '));
        this.form.workHistory.set(JSON.parse(JSON.stringify(w.workHistory || [])));
        this.form.certifications.set(JSON.parse(JSON.stringify(w.certifications || [])));
        this.form.availabilityDetails.set({ ...(w.availabilityDetails || { weekdays: true, weekends: false, evenings: false }) });
        this.form.image.set(w.image);
      }
    });
  }

  removeProfilePicture() {
    this.notification.info('Removing profile picture...');
    this.state.deleteProfilePicture(this.worker().id).subscribe({
      next: (response: any) => {
        const mapped = this.state.mapWorkerProfile(response);
        this.state.currentWorker.set(mapped);
        this.notification.success('Profile picture removed!');
      },
      error: (err: any) => {
        this.notification.error('Failed to remove profile picture.');
      }
    });
  }

  async onAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    this.notification.info('Uploading profile picture...');
    this.state.uploadProfilePicture(this.worker().id, file).subscribe({
      next: (response: any) => {
        const mapped = this.state.mapWorkerProfile(response);
        this.state.currentWorker.set(mapped);
        this.notification.success('Profile picture updated!');
      },
      error: (err: any) => {
        this.notification.error(`Upload failed: ${err.error || err.message || 'Unknown error'}`);
      }
    });
  }

  addWorkHistory() {
    this.form.workHistory.update(prev => [...prev, { company: '', role: '', period: '', description: '' }]);
  }

  removeWorkHistory(index: number) {
    this.form.workHistory.update(prev => prev.filter((_, i) => i !== index));
  }

  addCertification() {
    this.form.certifications.update(prev => [...prev, { name: '', issuer: '', year: new Date().getFullYear() }]);
  }

  removeCertification(index: number) {
    this.form.certifications.update(prev => prev.filter((_, i) => i !== index));
  }

  saveProfile() {
    const updates: Partial<any> = {
      fullName: this.form.name(),
      phoneNumber: this.form.phoneNumber(),
      category: this.form.category(),
      hourlyRate: Number(this.form.rate()) || 0,
      bio: this.form.bio(),
      skills: (this.form.skills() || '').split(',').map(s => s.trim()).filter(s => s),
      location: this.form.location(),
      preferredLocations: (this.form.preferredLocations() || '').split(',').map(l => l.trim()).filter(l => l),
      workHistory: this.form.workHistory()
        .filter(w => w.company.trim() && w.role.trim())
        .map(w => ({ ...w })),
      certifications: this.form.certifications()
        .filter(c => c.name.trim() && c.issuer.trim())
        .map(c => ({ ...c, year: Number(c.year) })),
      availabilityDetails: this.form.availabilityDetails(),
      profilePictureUrl: this.form.image()
    };
    this.isSaving.set(true);
    this.state.updateWorkerProfile(this.worker().id, updates).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.notification.success('✓ Profile saved successfully!');
        this.state.fetchWorkerProfile(this.auth.currentUser()!.id);
      },
      error: () => {
        this.isSaving.set(false);
        this.notification.error('❌ Failed to save profile updates.');
      }
    });
  }

  submit() {
    this.saveProfile();
    if (this.state.currentWorkerCompletion() < 100) {
      this.notification.error('Please complete your profile details (100%) before submitting for review.');
      return;
    }
    this.state.submitForVerification();
    this.notification.success('Application submitted successfully!');
  }

  resubmit() {
    this.isSaving.set(true);
    const updates = this.getProfileUpdates();
    this.state.updateWorkerProfile(this.worker().id, updates).subscribe({
      next: () => {
        this.state.resubmitWorker(this.worker().id);
        this.isSaving.set(false);
      },
      error: () => this.isSaving.set(false)
    });
  }

  private getProfileUpdates(): any {
    return {
      fullName: this.form.name(),
      phoneNumber: this.form.phoneNumber(),
      category: this.form.category(),
      hourlyRate: Number(this.form.rate()) || 0,
      bio: this.form.bio(),
      skills: (this.form.skills() || '').split(',').map(s => s.trim()).filter(s => s),
      location: this.form.location(),
      preferredLocations: (this.form.preferredLocations() || '').split(',').map(l => l.trim()).filter(l => l),
      workHistory: this.form.workHistory()
        .filter(w => w.company.trim() && w.role.trim())
        .map(w => ({ ...w })),
      certifications: this.form.certifications()
        .filter(c => c.name.trim() && c.issuer.trim())
        .map(c => ({ ...c, year: Number(c.year) })),
      availabilityDetails: this.form.availabilityDetails(),
      profilePictureUrl: this.form.image()
    };
  }

  nextTab() {
    this.saveProfile();
    const current = this.activeTab();
    const index = this.tabs.findIndex(t => t.id === current);
    if (index < this.tabs.length - 1) {
      this.activeTab.set(this.tabs[index + 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  goToDocuments() {
    this.saveProfile();
    this.router.navigate(['/worker/verification']);
  }
}