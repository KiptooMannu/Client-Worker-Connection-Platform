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
    <div class="max-w-4xl mx-auto space-y-8 pb-24 font-manrope animate-in fade-in duration-700">
      
      <!-- Rejection Alert -->
      @if (status === 'Rejected' && rejectionReason) {
        <div class="bg-error-container border border-error/10 rounded-xl p-6 flex items-start gap-4 animate-in slide-in-from-top duration-500 shadow-sm">
          <div class="w-12 h-12 rounded-lg bg-error text-white flex items-center justify-center shadow-lg shadow-error/20 shrink-0">
            <mat-icon>report_problem</mat-icon>
          </div>
          <div class="flex-1">
            <h3 class="font-bold text-on-error-container mb-1">Action Required</h3>
            <p class="text-sm text-on-error-container/80 leading-relaxed">{{ rejectionReason }}</p>
            <p class="mt-3 text-[10px] text-error font-black uppercase tracking-widest">Update your profile or documents and resubmit for audit.</p>
          </div>
        </div>
      }

      <!-- Profile Header & Picture -->
      <section class="flex flex-col items-center pt-8">
        <div class="relative group">
          <div class="w-32 h-32 rounded-xl border border-outline-variant bg-surface overflow-hidden shadow-sm">
            @if (worker().image) {
              <img [src]="worker().image" alt="Profile" class="w-full h-full object-cover">
            } @else {
              <div class="w-full h-full flex items-center justify-center bg-surface-container text-2xl font-black text-primary">
                {{ worker().initials }}
              </div>
            }
          </div>
          <button (click)="avatarInput.click()" class="absolute -bottom-2 -right-2 bg-primary text-white p-2.5 rounded-lg shadow-lg active:scale-95 transition-transform hover:bg-primary-container">
            <span class="material-symbols-outlined text-[20px]">photo_camera</span>
          </button>
          <input #avatarInput type="file" accept="image/*" (change)="onAvatarSelected($event)" class="hidden">
          
          @if (worker().image) {
            <button (click)="removeProfilePicture()" class="absolute -top-2 -right-2 w-7 h-7 bg-surface border border-outline-variant text-error rounded-full flex items-center justify-center shadow-md hover:bg-error-container transition-colors">
              <mat-icon class="!text-[16px]">delete_outline</mat-icon>
            </button>
          }
        </div>
        <div class="text-center mt-6">
          <h1 class="text-2xl font-black text-primary">{{ worker().name }}</h1>
          <p class="text-on-surface-variant text-sm">{{ worker().category || 'Professional Craftsman' }}</p>
        </div>
      </section>

      <!-- Tab Interface -->
      <nav class="flex border-b border-outline-variant overflow-x-auto no-scrollbar scroll-smooth">
        @for (tab of tabs; track tab.id) {
          <button (click)="activeTab.set(tab.id)"
                  class="px-6 py-4 transition-all font-bold text-sm whitespace-nowrap border-b-2"
                  [class]="activeTab() === tab.id ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-primary'">
            {{ tab.label }}
          </button>
        }
      </nav>

      <!-- Profile Strength Indicator -->
      <section class="flex flex-col gap-2 px-2">
        <div class="flex justify-between items-end">
          <span class="font-label-md text-label-md text-primary uppercase tracking-wider">Profile Readiness</span>
          <span class="font-bold text-primary">{{ completionPercentage() }}%</span>
        </div>
        <div class="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
          <div class="bg-primary h-full transition-all duration-1000" [style.width.%]="completionPercentage()"></div>
        </div>
      </section>

      <!-- Form Content Area -->
      <div class="bg-white border border-outline-variant rounded-xl p-6 md:p-8 shadow-sm">
        
        <!-- Identity Tab -->
        @if (activeTab() === 'identity') {
          <div class="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="font-label-md text-label-md text-on-surface-variant ml-1">Full Name</label>
                <input [ngModel]="form.name()" (ngModelChange)="form.name.set($event)" 
                       class="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 font-body-md text-body-md focus:border-primary focus:ring-0 transition-colors" 
                       placeholder="Julian Thorne">
              </div>
              <div class="space-y-2">
                <label class="font-label-md text-label-md text-on-surface-variant ml-1">Phone Number</label>
                <input [ngModel]="form.phoneNumber()" (ngModelChange)="form.phoneNumber.set($event)" 
                       class="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 font-body-md text-body-md focus:border-primary focus:ring-0 transition-colors" 
                       placeholder="e.g. +254 700 000000">
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="space-y-2">
                <label class="font-label-md text-label-md text-on-surface-variant ml-1">Craft Category</label>
                <div class="relative">
                  <select [ngModel]="form.category()" (ngModelChange)="form.category.set($event)"
                          class="w-full appearance-none bg-surface border border-outline-variant rounded-lg px-4 py-3 font-body-md text-body-md focus:border-primary focus:ring-0 transition-colors">
                    <option value="Plumbing">Plumber</option>
                    <option value="Electrical Wiring">Electrician</option>
                    <option value="Carpentry">Carpenter</option>
                    <option value="Masonry">Mason</option>
                    <option value="Painting">Painter</option>
                    <option value="Interior Design">Interior Designer</option>
                    <option value="HVAC Installation">HVAC Installer</option>
                    <option value="General Repairs">General Repairs</option>
                    <option value="Farm Worker">Farm Worker</option>
                    <option value="Cleaner">Cleaner</option>
                    <option value="Mechanic">Mechanic</option>
                    <option value="General Laborer">General Laborer</option>
                  </select>
                  <span class="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
                </div>
              </div>
              <div class="space-y-2">
                <label class="font-label-md text-label-md text-on-surface-variant ml-1">Hourly Rate (USD)</label>
                <div class="relative">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-body-md">$</span>
                  <input type="number" [ngModel]="form.rate()" (ngModelChange)="form.rate.set($event)"
                         class="w-full bg-surface border border-outline-variant rounded-lg pl-8 pr-4 py-3 font-body-md text-body-md focus:border-primary focus:ring-0 transition-colors">
                </div>
              </div>
              <div class="space-y-2">
                <label class="font-label-md text-label-md text-on-surface-variant ml-1">Base Location</label>
                <input [ngModel]="form.location()" (ngModelChange)="form.location.set($event)" 
                       class="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 font-body-md text-body-md focus:border-primary focus:ring-0 transition-colors" 
                       placeholder="e.g. Nairobi, Kenya">
              </div>
            </div>

            <div class="space-y-2">
              <label class="font-label-md text-label-md text-on-surface-variant ml-1">Professional Bio</label>
              <textarea [ngModel]="form.bio()" (ngModelChange)="form.bio.set($event)" rows="4"
                        class="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 font-body-md text-body-md focus:border-primary focus:ring-0 transition-colors resize-none"
                        placeholder="Detail your expertise and operational background..."></textarea>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="font-label-md text-label-md text-on-surface-variant ml-1">Core Skills (Comma separated)</label>
                <input [ngModel]="form.skills()" (ngModelChange)="form.skills.set($event)"
                       class="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 font-body-md text-body-md focus:border-primary focus:ring-0 transition-colors"
                       placeholder="e.g. Irrigation, Safety Audits, Harvesting">
              </div>
              <div class="space-y-2">
                <label class="font-label-md text-label-md text-on-surface-variant ml-1">Preferred Locations (Comma separated)</label>
                <input [ngModel]="form.preferredLocations()" (ngModelChange)="form.preferredLocations.set($event)"
                       class="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 font-body-md text-body-md focus:border-primary focus:ring-0 transition-colors"
                       placeholder="e.g. Westlands, Kilimani, Karen">
              </div>
            </div>

            <div class="pt-4">
              <button (click)="nextTab()" class="w-full bg-primary text-white py-4 rounded-lg font-label-md text-label-md active:opacity-90 transition-opacity">
                Next Area: Experience
              </button>
            </div>
          </div>
        }

        <!-- Experience Tab -->
        @if (activeTab() === 'experience') {
          <div class="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div class="flex justify-between items-center mb-2">
              <h2 class="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Work History</h2>
              <button (click)="addWorkHistory()" class="text-primary font-bold text-xs flex items-center gap-1 hover:underline">
                <mat-icon class="!text-sm">add</mat-icon> Add Entry
              </button>
            </div>

            <div class="space-y-4">
              @for (work of form.workHistory(); track $index) {
                <div class="p-6 border border-outline-variant rounded-lg bg-surface relative group">
                  <button (click)="removeWorkHistory($index)" class="absolute top-4 right-4 text-outline hover:text-error transition-colors">
                    <mat-icon class="!text-lg">delete_outline</mat-icon>
                  </button>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div class="space-y-1">
                      <label class="text-[10px] font-bold text-on-surface-variant uppercase">Organization</label>
                      <input [(ngModel)]="work.company" class="w-full bg-white border border-outline-variant rounded px-3 py-2 text-sm outline-none focus:border-primary">
                    </div>
                    <div class="space-y-1">
                      <label class="text-[10px] font-bold text-on-surface-variant uppercase">Role</label>
                      <input [(ngModel)]="work.role" class="w-full bg-white border border-outline-variant rounded px-3 py-2 text-sm outline-none focus:border-primary">
                    </div>
                  </div>
                  <div class="space-y-1">
                     <label class="text-[10px] font-bold text-on-surface-variant uppercase">Details</label>
                     <textarea [(ngModel)]="work.description" rows="2" class="w-full bg-white border border-outline-variant rounded px-3 py-2 text-sm outline-none focus:border-primary resize-none"></textarea>
                  </div>
                </div>
              } @empty {
                <div class="py-12 text-center border-2 border-dashed border-outline-variant rounded-xl bg-surface-container-low">
                   <mat-icon class="text-outline !text-4xl mb-2">history_edu</mat-icon>
                   <p class="text-xs text-on-surface-variant font-bold">No professional history recorded</p>
                </div>
              }
            </div>

            <div class="pt-4 flex gap-4">
              <button (click)="activeTab.set('identity')" class="flex-1 py-4 border border-outline-variant text-primary rounded-lg font-label-md text-label-md">Back</button>
              <button (click)="nextTab()" class="flex-1 bg-primary text-white py-4 rounded-lg font-label-md text-label-md">Continue</button>
            </div>
          </div>
        }

        <!-- Certifications Tab -->
        @if (activeTab() === 'certifications') {
          <div class="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div class="flex justify-between items-center mb-2">
              <h2 class="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Accreditations</h2>
              <button (click)="addCertification()" class="text-primary font-bold text-xs flex items-center gap-1 hover:underline">
                <mat-icon class="!text-sm">add</mat-icon> Add Award
              </button>
            </div>

            <div class="space-y-3">
              @for (cert of form.certifications(); track $index) {
                <div class="flex items-center gap-4 p-4 border border-outline-variant rounded-lg bg-surface group">
                  <div class="w-10 h-10 rounded-lg bg-secondary-container flex items-center justify-center text-on-secondary-container">
                    <mat-icon>military_tech</mat-icon>
                  </div>
                  <div class="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input [(ngModel)]="cert.name" placeholder="Name" class="bg-transparent border-b border-outline-variant py-1 text-sm outline-none focus:border-primary">
                    <input [(ngModel)]="cert.issuer" placeholder="Issuer" class="bg-transparent border-b border-outline-variant py-1 text-sm outline-none focus:border-primary">
                    <input [(ngModel)]="cert.year" placeholder="Year" class="bg-transparent border-b border-outline-variant py-1 text-sm outline-none focus:border-primary">
                  </div>
                  <button (click)="removeCertification($index)" class="text-outline hover:text-error">
                    <mat-icon class="!text-sm">close</mat-icon>
                  </button>
                </div>
              }
            </div>

            <div class="pt-4 flex gap-4">
              <button (click)="activeTab.set('experience')" class="flex-1 py-4 border border-outline-variant text-primary rounded-lg font-label-md text-label-md">Back</button>
              <button (click)="nextTab()" class="flex-1 bg-primary text-white py-4 rounded-lg font-label-md text-label-md">Continue</button>
            </div>
          </div>
        }

        <!-- Availability Tab -->
        @if (activeTab() === 'availability') {
          <div class="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div class="space-y-4">
              <div class="flex items-center justify-between p-5 bg-surface border border-outline-variant/60 rounded-xl hover:bg-surface-container-low transition-all cursor-pointer group"
                   (click)="form.availabilityDetails.set({...form.availabilityDetails(), weekdays: !form.availabilityDetails().weekdays})">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-lg flex items-center justify-center transition-all"
                       [class]="form.availabilityDetails().weekdays ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant'">
                    <mat-icon>{{ form.availabilityDetails().weekdays ? 'calendar_today' : 'calendar_month' }}</mat-icon>
                  </div>
                  <div>
                    <p class="font-bold text-primary">Weekdays</p>
                    <p class="text-[10px] uppercase tracking-widest font-bold opacity-60">Mon - Fri Operational</p>
                  </div>
                </div>
                <mat-slide-toggle color="primary" [checked]="form.availabilityDetails().weekdays"></mat-slide-toggle>
              </div>

              <div class="flex items-center justify-between p-5 bg-surface border border-outline-variant/60 rounded-xl hover:bg-surface-container-low transition-all cursor-pointer group"
                   (click)="form.availabilityDetails.set({...form.availabilityDetails(), weekends: !form.availabilityDetails().weekends})">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-lg flex items-center justify-center transition-all"
                       [class]="form.availabilityDetails().weekends ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant'">
                    <mat-icon>event</mat-icon>
                  </div>
                  <div>
                    <p class="font-bold text-primary">Weekends</p>
                    <p class="text-[10px] uppercase tracking-widest font-bold opacity-60">Sat - Sun Coverage</p>
                  </div>
                </div>
                <mat-slide-toggle color="primary" [checked]="form.availabilityDetails().weekends"></mat-slide-toggle>
              </div>
            </div>

            <div class="flex items-center justify-between p-6 bg-surface-container-high border border-outline-variant rounded-xl shadow-sm">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-lg bg-white flex items-center justify-center text-primary border border-outline-variant">
                  <mat-icon class="!text-2xl">dark_mode</mat-icon>
                </div>
                <div>
                  <p class="font-bold text-primary">Late Shift Coverage</p>
                  <p class="text-xs text-on-surface-variant">Active after 18:00 UTC</p>
                </div>
              </div>
              <mat-slide-toggle color="primary" [ngModel]="form.availabilityDetails().evenings" (ngModelChange)="form.availabilityDetails.set({...form.availabilityDetails(), evenings: $event})"></mat-slide-toggle>
            </div>

            <div class="pt-4 flex gap-4">
              <button (click)="activeTab.set('certifications')" class="flex-1 py-4 border border-outline-variant text-primary rounded-lg font-label-md text-label-md">Back</button>
              <button (click)="saveProfile()" class="flex-1 bg-primary text-white py-4 rounded-lg font-label-md text-label-md shadow-lg shadow-primary/10">Save All Changes</button>
            </div>
          </div>
        }
      </div>

      <!-- Action Footer -->
      <section class="pt-4 flex flex-col gap-3">
        <button (click)="saveProfile()" [disabled]="isSaving()" 
                class="w-full bg-primary text-white py-4 rounded-xl font-bold text-sm uppercase tracking-widest shadow-lg shadow-primary/10 hover:bg-opacity-90 active:scale-95 transition-all">
          {{ isSaving() ? 'Synchronizing...' : 'Commit Profile Changes' }}
        </button>
        <button (click)="goToDocuments()" class="w-full bg-surface border border-outline-variant text-primary py-4 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-surface-container-low transition-all">
          Proceed to Vault Audit
        </button>
      </section>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
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
      { label: 'Certifications Added', done: w.certifications && w.certifications.length > 0 },
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
    const userId = this.worker().userId || this.auth.currentUser()?.id;
    if (!userId) return;
    
    this.notification.info('Removing profile picture...');
    this.state.deleteProfilePicture(userId).subscribe({
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
    
    const userId = this.worker().userId || this.auth.currentUser()?.id;
    if (!userId) {
      this.notification.error('User context not found.');
      return;
    }

    this.notification.info('Uploading profile picture...');
    this.state.uploadProfilePicture(userId, file).subscribe({
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
    const updates = this.getProfileUpdates();
    const userId = this.worker().userId || this.auth.currentUser()?.id;
    if (!userId) {
      this.notification.error('User context not found.');
      return;
    }

    this.isSaving.set(true);
    this.state.updateWorkerProfile(userId, updates).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.notification.success('✓ Profile saved successfully!');
        this.state.fetchWorkerProfile(userId);
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
    const userId = this.worker().userId || this.auth.currentUser()?.id;
    if (!userId) return;

    this.isSaving.set(true);
    const updates = this.getProfileUpdates();
    this.state.updateWorkerProfile(userId, updates).subscribe({
      next: () => {
        this.state.resubmitWorker(userId);
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