import { Component, inject, signal, computed, effect, OnInit } from '@angular/core';
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NotificationService } from '../../../core/services/notification.service';
import { FormsModule } from '@angular/forms';
import { PlatformStateService } from '../../../core/services/platform-state.service';
import { AuthService } from '../../../core/services/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { DocumentUploadComponent } from '../../../shared/components/document-upload/document-upload.component';

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
    MatProgressSpinnerModule,
    FormsModule
  ],
  template: `
    <!-- Loading State -->
    @if (isLoading()) {
      <div class="flex justify-center items-center py-32 animate-in fade-in duration-300">
        <div class="text-center">
          <mat-spinner diameter="48" color="accent"></mat-spinner>
          <p class="mt-6 text-on-surface-variant font-medium">Loading your profile...</p>
        </div>
      </div>
    } @else {
      <div class="max-w-3xl mx-auto space-y-6 md:space-y-8 font-manrope animate-in fade-in duration-700">
        
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
        <section class="space-y-6 pt-8">
          <div class="flex flex-col md:flex-row items-start md:items-center gap-6">
            <!-- Profile Picture Upload -->
            <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 transition-all hover:border-brand-teal">
              <label class="block mb-2 font-semibold text-gray-700">Profile Picture</label>
              <p class="text-sm text-gray-600 mb-3">Upload your professional photo</p>
              <input #avatarInput type="file" accept="image/*" (change)="onAvatarSelected($event)" class="hidden" />
              <button type="button" mat-raised-button color="primary"
                      (click)="avatarInput.click()" class="w-full" [disabled]="isUploadingAvatar()">
                <mat-icon *ngIf="!isUploadingAvatar()">cloud_upload</mat-icon>
                <mat-spinner *ngIf="isUploadingAvatar()" diameter="20" class="mr-2"></mat-spinner>
                {{ worker().image ? 'Replace Photo' : 'Upload Photo' }}
              </button>

              @if (worker().image) {
                <div class="mt-4">
                  <div class="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200 mx-auto">
                    @if (isUploadingAvatar()) {
                      <div class="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                        <mat-spinner diameter="30"></mat-spinner>
                      </div>
                    }
                    <img [src]="worker().image" alt="Profile" class="w-full h-full object-cover">
                    <button (click)="removeProfilePicture()" class="absolute top-2 right-2 bg-white border border-outline-variant text-error w-8 h-8 rounded-full flex items-center justify-center shadow-sm hover:bg-error/10 transition-colors">
                      <mat-icon class="!text-[16px] flex items-center justify-center">delete_outline</mat-icon>
                    </button>
                  </div>
                </div>
              }
            </div>

            <!-- Profile Info -->
            <div class="flex-1">
              <h1 class="text-2xl font-black text-brand-teal">{{ worker().name || 'Worker' }}</h1>
              <p class="text-on-surface-variant text-sm mt-1">{{ worker().category }}</p>
              <div class="flex items-center gap-4 mt-4 p-4 bg-white border border-outline-variant rounded-xl shadow-sm">
                <div class="text-right">
                  <span class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest block">Profile Ready</span>
                  <h2 class="text-2xl font-black text-brand-teal">{{ completionPercentage() }}%</h2>
                </div>
                <div class="h-12 w-12 rounded-lg bg-secondary-container flex items-center justify-center">
                  <mat-icon class="text-on-secondary-container flex items-center justify-center" style="font-variation-settings: 'FILL' 1;">security</mat-icon>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Tab Interface -->
        <nav class="flex border-b border-outline-variant overflow-x-auto no-scrollbar scroll-smooth">
          @for (tab of tabs; track tab.id) {
            <button (click)="activeTab.set(tab.id)"
                    class="px-6 py-4 transition-all font-bold text-sm whitespace-nowrap border-b-2 flex items-center gap-2"
                    [class]="activeTab() === tab.id ? 'border-brand-teal text-brand-teal' : 'border-transparent text-on-surface-variant hover:text-brand-teal'">
              <mat-icon class="!text-[18px]">{{ tab.icon }}</mat-icon>
              {{ tab.label }}
            </button>
          }
        </nav>


        <!-- Form Content Area -->
        <div class="bg-white border border-outline-variant rounded-xl p-6 md:p-8 shadow-sm">
          
          <!-- Identity Tab -->
          @if (activeTab() === 'identity') {
            <div class="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-2">
                  <label class="font-label-md text-label-md text-on-surface-variant ml-1">Full Name <span class="text-error">*</span></label>
                  <input [ngModel]="form.name()" (ngModelChange)="form.name.set($event)" 
                         class="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 font-body-md text-body-md focus:border-brand-teal focus:ring-0 transition-colors" 
                         placeholder="Julian Thorne">
                </div>
                <div class="space-y-2">
                  <label class="font-label-md text-label-md text-on-surface-variant ml-1">Phone Number <span class="text-error">*</span></label>
                  <input [ngModel]="form.phoneNumber()" (ngModelChange)="form.phoneNumber.set($event)" 
                         class="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 font-body-md text-body-md focus:border-brand-teal focus:ring-0 transition-colors" 
                         placeholder="e.g. +254 700 000000">
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="space-y-2">
                  <label class="font-label-md text-label-md text-on-surface-variant ml-1">Craft Category <span class="text-error">*</span></label>
                  <div class="relative">
                    <select [ngModel]="form.category()" (ngModelChange)="form.category.set($event)"
                            class="w-full appearance-none bg-surface border border-outline-variant rounded-lg px-4 py-3 font-body-md text-body-md focus:border-brand-teal focus:ring-0 transition-colors">
                      <option value="">Select a category</option>
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
                    <mat-icon class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</mat-icon>
                  </div>
                </div>
  <div class="space-y-2">
  <label class="font-label-md text-label-md text-on-surface-variant ml-1">Rate (KSh)</label>
  <div class="relative">
    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-body-md">KSh</span>
<input type="number" [ngModel]="form.rate() === null ? null : form.rate()" (ngModelChange)="form.rate.set($event === null ? null : $event)"
           class="w-full bg-surface border border-outline-variant rounded-lg pl-14 pr-4 py-3 font-body-md text-body-md focus:border-brand-teal focus:ring-0 transition-colors"
           placeholder="Enter rate">
  </div>
</div>
                <div class="space-y-2">
                  <label class="font-label-md text-label-md text-on-surface-variant ml-1">Base Location</label>
                  <input [ngModel]="form.location()" (ngModelChange)="form.location.set($event)" 
                         class="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 font-body-md text-body-md focus:border-brand-teal focus:ring-0 transition-colors" 
                         placeholder="e.g. Nairobi, Kenya">
                </div>
              </div>

              <div class="space-y-2">
                <label class="font-label-md text-label-md text-on-surface-variant ml-1">Professional Bio <span class="text-error">*</span></label>
                <textarea [ngModel]="form.bio()" (ngModelChange)="form.bio.set($event)" rows="4"
                          class="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 font-body-md text-body-md focus:border-brand-teal focus:ring-0 transition-colors resize-none"
                          placeholder="Detail your expertise and operational background..."></textarea>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-2">
                  <label class="font-label-md text-label-md text-on-surface-variant ml-1">Core Skills (Comma separated) <span class="text-error">*</span></label>
                  <input [ngModel]="form.skills()" (ngModelChange)="form.skills.set($event)"
                         class="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 font-body-md text-body-md focus:border-brand-teal focus:ring-0 transition-colors"
                         placeholder="e.g. Irrigation, Safety Audits, Harvesting">
                </div>
                <div class="space-y-2">
                  <label class="font-label-md text-label-md text-on-surface-variant ml-1">Preferred Locations (Comma separated)</label>
                  <input [ngModel]="form.preferredLocations()" (ngModelChange)="form.preferredLocations.set($event)"
                         class="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 font-body-md text-body-md focus:border-brand-teal focus:ring-0 transition-colors"
                         placeholder="e.g. Westlands, Kilimani, Karen">
                </div>
              </div>

              <div class="pt-4">
                <button (click)="nextTab()" class="w-full bg-brand-teal text-white py-4 rounded-lg font-label-md text-label-md active:opacity-90 transition-opacity flex items-center justify-center gap-2">
                  Next Area: Experience
                  <mat-icon class="!text-[18px]">arrow_forward</mat-icon>
                </button>
              </div>
            </div>
          }

          <!-- Experience Tab -->
          @if (activeTab() === 'experience') {
            <div class="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div class="flex justify-between items-center mb-2">
                <h2 class="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Work History <span class="text-error">*</span></h2>
                <button (click)="addWorkHistory()" class="text-brand-teal font-bold text-xs flex items-center gap-1 hover:underline">
                  <mat-icon class="!text-sm flex items-center">add</mat-icon> Add Entry
                </button>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <mat-form-field appearance="outline" class="w-full profile-experience-field">
                  <mat-label>Experience Level</mat-label>
                  <mat-select class="font-body-md text-body-md" [value]="form.experienceYears()" (selectionChange)="form.experienceYears.set($event.value)">
                    <mat-option [value]="null">Select experience</mat-option>
                    <mat-option [value]="1">Junior (1-2 years)</mat-option>
                    <mat-option [value]="3">Mid (3-5 years)</mat-option>
                    <mat-option [value]="5">Senior (5+ years)</mat-option>
                    <mat-option [value]="8">Lead (8+ years)</mat-option>
                    <mat-option [value]="12">Master (12+ years)</mat-option>
                  </mat-select>
                </mat-form-field>
                <div class="space-y-2">
                  <p class="text-xs uppercase tracking-widest font-bold text-on-surface-variant">Why this matters</p>
                  <p class="text-sm text-slate-600">Employers use this experience level when filtering the marketplace, so selecting it helps your profile appear for the right jobs.</p>
                </div>
              </div>

              <div class="space-y-4">
                @for (work of form.workHistory(); track $index) {
                  <div class="p-6 border border-outline-variant rounded-lg bg-surface relative group">
                    <button (click)="removeWorkHistory($index)" class="absolute top-4 right-4 text-outline hover:text-error transition-colors">
                      <mat-icon class="!text-lg flex items-center">delete_outline</mat-icon>
                    </button>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div class="space-y-1">
                        <label class="text-[10px] font-bold text-on-surface-variant uppercase">Organization</label>
                        <input [(ngModel)]="work.company" class="w-full bg-white border border-outline-variant rounded px-3 py-2 text-sm outline-none focus:border-brand-teal">
                      </div>
                      <div class="space-y-1">
                        <label class="text-[10px] font-bold text-on-surface-variant uppercase">Role</label>
                        <input [(ngModel)]="work.role" class="w-full bg-white border border-outline-variant rounded px-3 py-2 text-sm outline-none focus:border-brand-teal">
                      </div>
                    </div>
                    <div class="space-y-1">
                       <label class="text-[10px] font-bold text-on-surface-variant uppercase">Details</label>
                       <textarea [(ngModel)]="work.description" rows="2" class="w-full bg-white border border-outline-variant rounded px-3 py-2 text-sm outline-none focus:border-brand-teal resize-none"></textarea>
                    </div>
                  </div>
                } @empty {
                  <div class="py-12 text-center border-2 border-dashed border-outline-variant rounded-xl bg-surface-container-low">
                     <mat-icon class="text-outline !text-4xl mb-2 flex items-center justify-center">history_edu</mat-icon>
                     <p class="text-xs text-on-surface-variant font-bold">No professional history recorded</p>
                  </div>
                }
              </div>

              <div class="pt-4 flex gap-4">
                <button (click)="activeTab.set('identity')" class="flex-1 py-4 border border-outline-variant text-brand-teal rounded-lg font-label-md text-label-md flex items-center justify-center gap-2">
                  <mat-icon class="!text-[18px]">arrow_back</mat-icon>
                  Back
                </button>
                <button (click)="nextTab()" class="flex-1 bg-brand-teal text-white py-4 rounded-lg font-label-md text-label-md flex items-center justify-center gap-2">
                  Continue
                  <mat-icon class="!text-[18px]">arrow_forward</mat-icon>
                </button>
              </div>
            </div>
          }

          <!-- Certifications Tab -->
          @if (activeTab() === 'certifications') {
            <div class="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div class="flex justify-between items-center mb-2">
                <h2 class="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Accreditations</h2>
                <button (click)="addCertification()" class="text-brand-teal font-bold text-xs flex items-center gap-1 hover:underline">
                  <mat-icon class="!text-sm flex items-center">add</mat-icon> Add Award
                </button>
              </div>

              <div class="space-y-3">
                @for (cert of form.certifications(); track $index) {
                  <div class="flex items-center gap-4 p-4 border border-outline-variant rounded-lg bg-surface group">
                    <div class="w-10 h-10 rounded-lg bg-secondary-container flex items-center justify-center text-on-secondary-container">
                      <mat-icon class="flex items-center justify-center">military_tech</mat-icon>
                    </div>
                    <div class="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input [(ngModel)]="cert.name" placeholder="Name" class="bg-transparent border-b border-outline-variant py-1 text-sm outline-none focus:border-brand-teal">
                      <input [(ngModel)]="cert.issuer" placeholder="Issuer" class="bg-transparent border-b border-outline-variant py-1 text-sm outline-none focus:border-brand-teal">
                      <input [(ngModel)]="cert.year" placeholder="Year" class="bg-transparent border-b border-outline-variant py-1 text-sm outline-none focus:border-brand-teal">
                    </div>
                    <button (click)="removeCertification($index)" class="text-outline hover:text-error">
                      <mat-icon class="!text-sm flex items-center">close</mat-icon>
                    </button>
                  </div>
                }
              </div>

              <div class="pt-4 flex gap-4">
                <button (click)="activeTab.set('experience')" class="flex-1 py-4 border border-outline-variant text-brand-teal rounded-lg font-label-md text-label-md flex items-center justify-center gap-2">
                  <mat-icon class="!text-[18px]">arrow_back</mat-icon>
                  Back
                </button>
                <button (click)="nextTab()" class="flex-1 bg-brand-teal text-white py-4 rounded-lg font-label-md text-label-md flex items-center justify-center gap-2">
                  Continue
                  <mat-icon class="!text-[18px]">arrow_forward</mat-icon>
                </button>
              </div>
            </div>
          }

          <!-- Availability Tab -->
          @if (activeTab() === 'availability') {
            <div class="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div class="space-y-4">
                <div class="flex items-center justify-between p-5 bg-surface border border-outline-variant/60 rounded-xl hover:bg-surface-container-low transition-all cursor-pointer group"
                     (click)="toggleWeekdays()">
                  <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-lg flex items-center justify-center transition-all"
                         [class]="form.availabilityDetails().weekdays ? 'bg-brand-teal text-white' : 'bg-surface-container-high text-on-surface-variant'">
                      <mat-icon class="flex items-center justify-center">{{ form.availabilityDetails().weekdays ? 'calendar_today' : 'calendar_month' }}</mat-icon>
                    </div>
                    <div>
                      <p class="font-bold text-brand-teal">Weekdays</p>
                      <p class="text-[10px] uppercase tracking-widest font-bold opacity-60">Mon - Fri Operational</p>
                    </div>
                  </div>
                  <mat-slide-toggle color="primary" [checked]="form.availabilityDetails().weekdays" (click)="$event.stopPropagation()" (change)="toggleWeekdays()"></mat-slide-toggle>
                </div>

                <div class="flex items-center justify-between p-5 bg-surface border border-outline-variant/60 rounded-xl hover:bg-surface-container-low transition-all cursor-pointer group"
                     (click)="toggleWeekends()">
                  <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-lg flex items-center justify-center transition-all"
                         [class]="form.availabilityDetails().weekends ? 'bg-brand-teal text-white' : 'bg-surface-container-high text-on-surface-variant'">
                      <mat-icon class="flex items-center justify-center">event</mat-icon>
                    </div>
                    <div>
                      <p class="font-bold text-brand-teal">Weekends</p>
                      <p class="text-[10px] uppercase tracking-widest font-bold opacity-60">Sat - Sun Coverage</p>
                    </div>
                  </div>
                  <mat-slide-toggle color="primary" [checked]="form.availabilityDetails().weekends" (click)="$event.stopPropagation()" (change)="toggleWeekends()"></mat-slide-toggle>
                </div>
              </div>

              <div class="flex items-center justify-between p-6 bg-surface-container-high border border-outline-variant rounded-xl shadow-sm">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-lg bg-white flex items-center justify-center text-brand-teal border border-outline-variant">
                    <mat-icon class="!text-2xl flex items-center justify-center">dark_mode</mat-icon>
                  </div>
                  <div>
                    <p class="font-bold text-brand-teal">Late Shift Coverage</p>
                    <p class="text-xs text-on-surface-variant">Active after 18:00 UTC</p>
                  </div>
                </div>
                <mat-slide-toggle color="primary" [ngModel]="form.availabilityDetails().evenings" (ngModelChange)="toggleEvenings($event)"></mat-slide-toggle>
              </div>

              <div class="pt-4 flex gap-4">
                <button (click)="activeTab.set('certifications')" class="flex-1 py-4 border border-outline-variant text-brand-teal rounded-lg font-label-md text-label-md flex items-center justify-center gap-2">
                  <mat-icon class="!text-[18px]">arrow_back</mat-icon>
                  Back
                </button>
                <!-- isSaving already existed but nothing was bound to it, so the
                     save button stayed live for the whole request. -->
                <button (click)="saveProfile()"
                        [disabled]="isSaving()"
                        class="flex-1 bg-brand-teal text-white py-4 rounded-lg font-label-md text-label-md shadow-lg shadow-brand-teal/10 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                  <mat-icon class="!text-[18px]" [class.animate-spin]="isSaving()">{{ isSaving() ? 'progress_activity' : 'save' }}</mat-icon>
                  {{ isSaving() ? 'Saving…' : 'Save All Changes' }}
                </button>
              </div>
            </div>
          }
        </div>

        <!-- Action Footer -->
        <section class="pt-4 flex flex-col gap-3">
          <button (click)="goToDocuments()" class="w-full bg-surface border border-outline-variant text-brand-teal py-4 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-surface-container-low transition-all flex items-center justify-center gap-2">
            <mat-icon class="!text-[18px]">folder_open</mat-icon>
            Upload Documents
          </button>
        </section>
      </div>
    }
  `,
  styles: [`
    :host { 
      display: block; 
    }
    .no-scrollbar::-webkit-scrollbar { 
      display: none; 
    }
    .no-scrollbar { 
      -ms-overflow-style: none; 
      scrollbar-width: none; 
    }
    /* Fix icon alignment globally */
    mat-icon {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      vertical-align: middle !important;
      flex-shrink: 0 !important;
    }
    /* Ensure buttons with icons have proper spacing */
    button mat-icon {
      margin: 0 2px;
    }
    /* Fix select dropdown icon positioning */
    .relative mat-icon {
      pointer-events: none;
    }
    .profile-experience-field .mat-form-field-infix,
    .profile-experience-field .mat-select-trigger,
    .profile-experience-field .mat-form-field-label {
      font-family: inherit !important;
      font-size: inherit !important;
      line-height: 1.5 !important;
      font-weight: 500 !important;
    }
  `]
})
export class WorkerProfilePage implements OnInit {
  private notification = inject(NotificationService);
  private router = inject(Router);
  public auth = inject(AuthService);
  state = inject(PlatformStateService);

  activeTab = signal<'identity' | 'experience' | 'certifications' | 'availability'>('identity');
  isLoading = signal(true);
  isSaving = signal(false);
  isUploadingAvatar = signal(false);

  tabs: { id: 'identity' | 'experience' | 'certifications' | 'availability', label: string, icon: string }[] = [
    { id: 'identity', label: 'Identity', icon: 'person' },
    { id: 'experience', label: 'Experience', icon: 'work' },
    { id: 'certifications', label: 'Certifications', icon: 'verified' },
    { id: 'availability', label: 'Availability', icon: 'schedule' }
  ];

  get status() { return this.state.currentWorker().status; }
  get rejectionReason() { return this.state.currentWorker().rejectionReason; }

  completionPercentage = computed(() => this.state.currentWorkerCompletion());
  worker = this.state.currentWorker;

  requirements = computed(() => {
    const w = this.worker();
    return [
      { label: 'Basic Info & Name', done: !!w.name },
      { label: 'Primary Category', done: !!w.category },
      { label: 'Professional Bio', done: !!w.bio && w.bio.length > 8},
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
    rate: signal<number | null>(null),
    bio: signal(''),
    skills: signal(''),
    location: signal(''),
    preferredLocations: signal(''),
    experienceYears: signal<number | null>(null),
    workHistory: signal<any[]>([]),
    certifications: signal<any[]>([]),
    availabilityDetails: signal({ weekdays: true, weekends: false, evenings: false }),
    image: signal<string | undefined>(undefined)
  };

  ngOnInit() {
    this.loadWorkerData();
  }

 private loadWorkerData() {
  const userId = this.auth.currentUser()?.id;
  
  if (!userId) {
    this.notification.error('User not authenticated');
    this.router.navigate(['/login'], { queryParams: { returnUrl: '/worker/profile' } });
    return;
  }

  const currentWorker = this.state.currentWorker();
  
  // Check if we have valid cached data (id is not empty and matches the user)
  const hasValidCachedData = currentWorker && 
                             currentWorker.id && 
                             currentWorker.id !== '' && 
                             currentWorker.userId === userId;

  if (hasValidCachedData) {
    this.populateForm(currentWorker);
    this.isLoading.set(false);
    return;
  }

  // Fetch fresh data from server
  this.isLoading.set(true);
  
  // First, fetch the profile
  this.state.fetchWorkerProfile(userId);
  
  // Set up subscription to wait for the data
  const sub = toObservable(this.state.currentWorker).subscribe({
    next: (workerData: any) => {
      // Check if we have valid data with an ID (not the default empty one)
      if (workerData && workerData.id && workerData.id !== '' && workerData.userId === userId) {
        this.populateForm(workerData);
        this.isLoading.set(false);
        sub.unsubscribe();
      }
    },
    error: (err: any) => {
      console.error('Error loading worker profile:', err);
      this.notification.error('Failed to load profile data');
      this.isLoading.set(false);
      sub.unsubscribe();
    }
  });
  
  // Timeout fallback to prevent infinite loading
  setTimeout(() => {
    if (this.isLoading()) {
      this.isLoading.set(false);
      this.notification.error('Loading took too long. Please refresh the page.');
      sub.unsubscribe();
    }
  }, 10000);
}

 private populateForm(w: any) {
  this.form.name.set(w.name || '');
  this.form.phoneNumber.set(w.phoneNumber || '');
  this.form.category.set(w.category || '');
  this.form.rate.set(w.rate ?? null);
  this.form.bio.set(w.bio || '');
  // Handle skills safely - ensure it's an array before joining
  const skillsArray = w.skills || [];
  this.form.skills.set(Array.isArray(skillsArray) ? skillsArray.join(', ') : '');
  this.form.location.set(w.location || '');
  const preferredLocationsArray = w.preferredLocations || [];
  this.form.preferredLocations.set(Array.isArray(preferredLocationsArray) ? preferredLocationsArray.join(', ') : '');
  this.form.workHistory.set(w.workHistory && Array.isArray(w.workHistory) ? JSON.parse(JSON.stringify(w.workHistory)) : []);
  this.form.certifications.set(w.certifications && Array.isArray(w.certifications) ? JSON.parse(JSON.stringify(w.certifications)) : []);
  this.form.availabilityDetails.set({ 
    weekdays: w.availabilityDetails?.weekdays ?? true, 
    weekends: w.availabilityDetails?.weekends ?? false, 
    evenings: w.availabilityDetails?.evenings ?? false 
  });
  this.form.image.set(w.image);
}

  toggleWeekdays() {
    this.form.availabilityDetails.set({
      ...this.form.availabilityDetails(),
      weekdays: !this.form.availabilityDetails().weekdays
    });
  }

  toggleWeekends() {
    this.form.availabilityDetails.set({
      ...this.form.availabilityDetails(),
      weekends: !this.form.availabilityDetails().weekends
    });
  }

  toggleEvenings(value: boolean) {
    this.form.availabilityDetails.set({
      ...this.form.availabilityDetails(),
      evenings: value
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
        this.populateForm(mapped);
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

    this.isUploadingAvatar.set(true);
    this.notification.info('Uploading profile picture...');
    this.state.uploadProfilePicture(userId, file).subscribe({
      next: (response: any) => {
        const mapped = this.state.mapWorkerProfile(response);
        this.state.currentWorker.set(mapped);
        this.populateForm(mapped);
        this.notification.success('Profile picture updated!');
        this.isUploadingAvatar.set(false);
      },
      error: (err: any) => {
        this.notification.error(`Upload failed: ${err.error || err.message || 'Unknown error'}`);
        this.isUploadingAvatar.set(false);
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
    const userId = this.worker().userId || this.auth.currentUser()?.id;
    if (!userId) {
      this.notification.error('User context not found.');
      return;
    }

    const phoneNumber = this.form.phoneNumber();
    if (!phoneNumber || phoneNumber.trim().length < 10) {
      this.notification.error('Phone number is required and must be at least 10 digits.');
      return;
    }

    this.isSaving.set(true);
    
    // Get the current form values
    const fullName = this.form.name();
    const category = this.form.category();
    const hourlyRate = this.form.rate() !== null ? Number(this.form.rate()) : 0;
    const bio = this.form.bio();
    const skillsArray = (this.form.skills() || '').split(',').map(s => s.trim()).filter(s => s);
    const location = this.form.location();
    const preferredLocationsArray = (this.form.preferredLocations() || '').split(',').map(l => l.trim()).filter(l => l);
    
    // DIRECTLY UPDATE THE SIGNAL with form values (use the already-validated phoneNumber)
    this.state.currentWorker.update(current => ({
      ...current,
      name: fullName,
      phoneNumber: phoneNumber,
      category: category,
      rate: hourlyRate,
      bio: bio,
      skills: skillsArray,
      location: location,
      experienceYears: this.form.experienceYears() ?? undefined,
      preferredLocations: preferredLocationsArray,
      workHistory: this.form.workHistory(),
      certifications: this.form.certifications(),
      availabilityDetails: this.form.availabilityDetails()
    }));
    
    // Also update local form display
    this.populateForm(this.state.currentWorker());
    
    // Prepare payload for backend
    const updates = {
      fullName: fullName,
      phoneNumber: phoneNumber,
      category: category,
      hourlyRate: hourlyRate,
      bio: bio,
      skills: skillsArray,
      location: location,
      preferredLocations: preferredLocationsArray,
      experienceYears: this.form.experienceYears(),
      workHistory: this.form.workHistory().filter(w => w.company.trim() && w.role.trim()),
      certifications: this.form.certifications().filter(c => c.name.trim() && c.issuer.trim()),
      availabilityDetails: this.form.availabilityDetails(),
      profilePictureUrl: this.form.image()
    };
    
    this.state.updateWorkerProfile(userId, updates).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.notification.success('✓ Profile saved successfully!');
        // Refresh from backend to ensure consistency
        this.state.fetchWorkerProfile(userId);
      },
      error: () => {
        this.isSaving.set(false);
        this.notification.error('❌ Failed to save profile updates.');
        // Revert by fetching fresh data
        this.state.fetchWorkerProfile(userId);
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
      hourlyRate: this.form.rate() !== null ? Number(this.form.rate()) : undefined,
      bio: this.form.bio(),
      skills: (this.form.skills() || '').split(',').map(s => s.trim()).filter(s => s),
      location: this.form.location(),
      preferredLocations: (this.form.preferredLocations() || '').split(',').map(l => l.trim()).filter(l => l),
      experienceYears: this.form.experienceYears() ?? undefined,
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