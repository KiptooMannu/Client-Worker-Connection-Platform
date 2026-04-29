import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { NotificationService } from '../../../core/services/notification.service';
import { PlatformStateService } from '../../../core/services/platform-state.service';

@Component({
  selector: 'app-worker-verification',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule, 
    MatButtonModule, 
    MatIconModule, 
    MatChipsModule, 
    MatProgressBarModule, 
    MatDividerModule,
    MatListModule,
  ],
  template: `
    <div class="space-y-8 animate-in fade-in duration-500">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="header-title text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">Identity & Verification</h1>
        <p class="text-slate-500 text-sm font-medium mt-1">Complete your profile verification to unlock premium marketplace features.</p>
      </div>

      <!-- Rejection Alert -->
      @if (workerStatus === 'Rejected' && rejectionReason) {
        <mat-card class="!rounded-3xl !bg-red-50 !border-2 !border-red-100 !shadow-sm animate-in slide-in-from-top">
          <mat-card-content class="!p-8 flex items-start gap-6">
            <div class="flex-shrink-0">
              <mat-icon class="!text-[32px] !w-auto !h-auto text-red-600">info</mat-icon>
            </div>
            <div class="flex-1">
              <h3 class="font-black text-red-900 mb-2">Verification Rejected - Action Required</h3>
              <p class="text-sm text-red-800 font-medium mb-4">{{ rejectionReason }}</p>
              <p class="text-xs text-red-700 font-black uppercase tracking-widest">🔁 Please update your documents and resubmit your profile.</p>
            </div>
            <button mat-icon-button (click)="dismissRejection()" class="text-red-500 hover:!text-red-700"><mat-icon>close</mat-icon></button>
          </mat-card-content>
        </mat-card>
      }

      <!-- Security Banner -->
      <mat-card class="!rounded-2xl !bg-slate-800 !text-white !shadow-xl overflow-hidden !border !border-slate-700">
        <mat-card-content class="!p-6 flex items-center gap-6 relative">
          <div class="absolute right-0 top-0 opacity-5 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
            <mat-icon class="!text-[120px] !w-auto !h-auto">encrypted</mat-icon>
          </div>
          <div class="flex-shrink-0 bg-slate-700 p-4 rounded-2xl border border-slate-600 hidden sm:flex">
            <mat-icon class="!text-slate-400 !text-3xl !w-auto !h-auto">lock</mat-icon>
          </div>
          <div class="relative z-10">
            <h3 class="text-xl font-black mb-2 tracking-tight text-white">Secure Document Handling</h3>
            <p class="text-slate-300 text-xs max-w-2xl leading-relaxed font-medium">Your privacy is our priority. All uploaded documents are strictly encrypted using <strong class="text-white">AES-256 standards</strong>. Data is stored on disconnected secure servers.</p>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Main Layout -->
      @if (workerStatus !== 'Pending') {
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in zoom-in duration-500">
          <!-- Upload Area -->
          <div class="lg:col-span-8 space-y-6">
            <mat-card class="!rounded-2xl !border !border-slate-100 !shadow-sm !p-6 md:!p-8">
              <div class="flex items-center gap-3 mb-6">
                <div class="p-2 bg-blue-50 text-blue-600 rounded-xl"><mat-icon class="!w-5 !h-5">badge</mat-icon></div>
                <h2 class="text-xl font-black text-slate-900 tracking-tight">Identification Documents</h2>
              </div>
              <p class="text-xs text-slate-500 mb-6 font-medium">Please upload a clear copy of your National ID or Passport.</p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div 
                  (click)="fileInputFront.click()"
                  class="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-blue-600 hover:bg-slate-50 transition-all cursor-pointer group">
                  <input #fileInputFront type="file" accept="image/*,.pdf" (change)="onFileSelected($event, 'Identification-Front')" class="hidden">
                  <div class="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <mat-icon class="text-slate-400 group-hover:text-blue-600 !text-2xl !w-auto !h-auto">upload_file</mat-icon>
                  </div>
                  <p class="text-xs font-black text-slate-900 uppercase tracking-widest">ID Front Side</p>
                </div>
                <div 
                  (click)="fileInputBack.click()"
                  class="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-blue-600 hover:bg-slate-50 transition-all cursor-pointer group">
                  <input #fileInputBack type="file" accept="image/*,.pdf" (change)="onFileSelected($event, 'Identification-Back')" class="hidden">
                  <div class="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <mat-icon class="text-slate-400 group-hover:text-blue-600 !text-2xl !w-auto !h-auto">upload_file</mat-icon>
                  </div>
                  <p class="text-xs font-black text-slate-900 uppercase tracking-widest">ID Back Side</p>
                </div>
              </div>
            </mat-card>

            <mat-card class="!rounded-2xl !border !border-slate-100 !shadow-sm !p-6 md:!p-8">
              <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-3">
                  <div class="p-2 bg-blue-50 text-blue-600 rounded-xl"><mat-icon class="!w-5 !h-5">workspace_premium</mat-icon></div>
                  <h2 class="text-xl font-black text-slate-900 tracking-tight">Professional Certifications</h2>
                </div>
                <button (click)="certFileInput.click()" mat-flat-button color="primary" class="!rounded-xl !px-4 !py-2 !font-black !text-[9px] !uppercase !tracking-widest">
                  <input #certFileInput type="file" accept=".pdf,.jpg,.png" (change)="onFileSelected($event, 'Certification')" class="hidden">
                  <mat-icon class="!text-xs">add</mat-icon> Add New
                </button>
              </div>
              <div (click)="bulkFileInput.click()" class="w-full border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center text-center hover:border-blue-600 transition-all group cursor-pointer">
                <input #bulkFileInput type="file" multiple accept=".pdf,.jpg,.png" (change)="onFileSelected($event, 'Certification')" class="hidden">
                <mat-icon class="text-slate-200 text-5xl !w-auto !h-auto mb-4 group-hover:text-blue-600 transition-colors">clinical_notes</mat-icon>
                <p class="text-xs text-slate-500 max-w-sm font-medium leading-relaxed">Drag and drop your professional licenses, certificates, or diplomas here.</p>
                <button mat-button color="primary" class="mt-4 !font-black !text-[9px] !uppercase !tracking-widest">Browse Files</button>
              </div>
            </mat-card>
          </div>

          <!-- File List -->
          <div class="lg:col-span-4 h-full">
            <mat-card class="!rounded-2xl !border !border-slate-100 !shadow-sm flex flex-col h-full overflow-hidden">
              <mat-card-header class="!p-6 !border-b !border-slate-50 !bg-slate-50/50">
                <mat-card-title class="!text-[9px] !font-black !text-slate-900 !uppercase !tracking-widest !m-0">Uploaded Files ({{ uploadedFiles().length }})</mat-card-title>
                <mat-card-subtitle class="!text-[8px] !text-slate-400 !mt-1 !font-black !uppercase !tracking-tighter">Managed cryptographically</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content class="flex-1 !p-0 overflow-y-auto">
                @if (uploadedFiles().length === 0) {
                  <div class="p-8 text-center">
                    <mat-icon class="!text-5xl !w-auto !h-auto text-slate-200 mb-4">folder_open</mat-icon>
                    <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest">No files uploaded yet</p>
                  </div>
                } @else {
                  <mat-nav-list class="divide-y divide-slate-50">
                    @for (file of uploadedFiles(); track file.name) {
                      <mat-list-item class="!h-auto !py-6 group">
                        <div matListItemIcon class="p-3 rounded-2xl" [ngClass]="getStatusClasses(file.status).bg">
                          <mat-icon class="!text-sm !w-auto !h-auto" [ngClass]="getStatusClasses(file.status).color">
                            @switch (file.status) {
                              @case ('uploaded') { <span>check_circle</span> }
                              @case ('validating') { <span>hourglass_empty</span> }
                              @case ('approved') { <span>check_circle</span> }
                              @case ('rejected') { <span>error</span> }
                            }
                          </mat-icon>
                        </div>
                        <div matListItemTitle class="flex justify-between items-start w-full">
                          <div class="min-w-0 pr-4 flex-1">
                            <p class="text-xs font-black text-slate-900 truncate">{{ file.name }}</p>
                            <p class="text-[9px] text-slate-400 font-black uppercase mt-1">{{ file.type }} • {{ (file.file?.size / 1024 / 1024 || 0).toFixed(1) }} MB</p>
                            <mat-chip class="!min-h-0 !p-0 !mt-3 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest" [ngClass]="getStatusClasses(file.status).bg + ' ' + getStatusClasses(file.status).color">
                              {{ file.status | titlecase }}
                            </mat-chip>
                          </div>
                          <button mat-icon-button (click)="removeFile(file.name)" class="text-slate-200 hover:!text-red-500 transition-colors">
                            <mat-icon>delete</mat-icon>
                          </button>
                        </div>
                      </mat-list-item>
                    }
                  </mat-nav-list>
                }
              </mat-card-content>
              <div class="p-6 bg-slate-50 border-t border-slate-100">
                <div class="flex justify-between items-center text-[9px] font-black uppercase tracking-widest mb-2">
                  <span class="text-slate-400">Storage Used</span>
                  <span class="text-slate-900">{{ totalSize.toFixed(1) }} MB / 50 MB</span>
                </div>
                <mat-progress-bar mode="determinate" [value]="(totalSize / 50) * 100" class="!h-1.5 rounded-full"></mat-progress-bar>
              </div>
            </mat-card>
          </div>
        </div>

        <!-- Submission Action -->
        <div class="mt-8 flex justify-end">
          <button 
            mat-flat-button 
            color="primary" 
            [disabled]="isSubmitting()"
            class="!rounded-xl !px-12 !py-6 !font-black !text-[12px] !uppercase !tracking-widest !shadow-lg"
            (click)="submitApplication()">
            <mat-icon class="!text-sm mr-2">{{ isSubmitting() ? 'hourglass_empty' : 'send' }}</mat-icon>
            {{ isSubmitting() ? 'Submitting...' : (state.currentWorker().status === 'Rejected' ? 'Resubmit Application' : 'Submit Application') }}
          </button>
        </div>
      } @else {
        <!-- Success/Pending State -->
        <mat-card class="!rounded-[2rem] !border-none !shadow-xl !bg-white overflow-hidden animate-in fade-in zoom-in duration-700">
          <mat-card-content class="!p-10 md:!p-16 flex flex-col items-center text-center">
            <div class="w-24 h-24 bg-teal-50 rounded-[1.5rem] flex items-center justify-center mb-8 relative">
              <mat-icon class="!text-teal-600 !text-5xl !w-auto !h-auto">task_alt</mat-icon>
              <div class="absolute -right-1 -bottom-1 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                <mat-icon class="!text-white !text-base !w-auto !h-auto">hourglass_empty</mat-icon>
              </div>
            </div>
            <h2 class="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter mb-3">Application Successfully Submitted</h2>
            <p class="text-slate-500 text-sm font-medium max-w-md leading-relaxed mb-8">
              Our administrators have received your credentials. Your profile is currently under a manual trust audit. 
              Typically takes 12-24 hours.
            </p>
            <div class="flex flex-wrap justify-center gap-3">
              <button mat-flat-button color="primary" routerLink="/worker/dashboard" class="!px-8 !py-4 !rounded-xl !font-black !text-[10px] !uppercase !tracking-widest !shadow-lg">
                Go to Dashboard
              </button>
              <button mat-stroked-button class="!border-slate-200 !px-8 !py-4 !rounded-xl !font-black !text-[10px] !uppercase !tracking-widest">
                Contact Support
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    
    @media (max-width: 640px) {
      .header-title { font-size: 1.5rem !important; }
      mat-card-content { padding: 1.5rem !important; }
      .grid { gap: 1rem !important; }
    }
    
    @media (min-width: 641px) and (max-width: 1024px) {
      .header-title { font-size: 2rem !important; }
    }
  `]
})
export class WorkerVerificationPage {
  state = inject(PlatformStateService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  isSubmitting = signal(false);

  get workerStatus() {
    return this.state.currentWorker().status;
  }

  get rejectionReason() {
    return (this.state.currentWorker() as any).rejectionReason;
  }

  worker = this.state.currentWorker;

  uploadedFiles = computed<any[]>(() => this.worker().uploadedDocuments || []);

  getStatusClasses(status: string) {
    const statusMap: { [key: string]: { bg: string; color: string } } = {
      'uploaded': { bg: 'bg-teal-50', color: 'text-teal-700' },
      'validating': { bg: 'bg-amber-50', color: 'text-amber-800' },
      'approved': { bg: 'bg-teal-50', color: 'text-teal-700' },
      'rejected': { bg: 'bg-red-50', color: 'text-red-700' }
    };
    return statusMap[status] || statusMap['uploaded'];
  }

  get totalSize(): number {
    return this.uploadedFiles().reduce((sum: number, f: any) => sum + (f.file?.size / 1024 / 1024 || 0), 0);
  }

  async onFileSelected(event: Event, type: string) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    for (let i = 0; i < input.files.length; i++) {
      const file = input.files[i];
      
      if (file.size > 10 * 1024 * 1024) {
        this.notification.error('❌ File too large. Max 10MB allowed.');
        continue;
      }

      const workerId = this.state.currentWorker().id;
      this.state.uploadDocument(workerId, type, file.name, file).subscribe({
        next: (doc) => {
          this.state.currentWorker.update(w => ({
            ...w,
            uploadedDocuments: [...(w.uploadedDocuments || []), {
              name: doc.name,
              type: doc.type,
              status: 'uploaded',
              url: doc.documentUrl,
              file: file
            }]
          }));
          this.notification.success(`✓ ${file.name} uploaded successfully!`);
        },
        error: (err) => {
          console.error('Upload failed', err);
          this.notification.error(`❌ Failed to upload ${file.name}`);
        }
      });
    }
    input.value = '';
  }

  removeFile(fileName: string) {
    this.state.currentWorker.update(w => ({
      ...w,
      uploadedDocuments: (w.uploadedDocuments || []).filter(f => f.name !== fileName)
    }));
    this.notification.info('File removed');
  }

  dismissRejection() {
    this.state.currentWorker.update(w => ({...w, rejectionReason: undefined}));
  }

  submitApplication() {
    if (this.state.currentWorkerCompletion() < 100) {
      this.notification.error('❌ Please complete your profile details (100%) before submitting.');
      return;
    }

    if (this.uploadedFiles().length === 0) {
      this.notification.error('❌ Please upload at least one document.');
      return;
    }
    
    if (this.state.currentWorker().status === 'Rejected') {
      this.isSubmitting.set(true);
      this.state.resubmitWorker(this.state.currentWorker().id);
      setTimeout(() => this.isSubmitting.set(false), 2000); // UI feel
    } else {
      this.isSubmitting.set(true);
      this.state.submitForVerification();
      setTimeout(() => {
        this.isSubmitting.set(false);
        this.notification.success('✓ Application submitted for review!');
      }, 1000);
    }
  }
}
