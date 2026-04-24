import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PlatformStateService } from '../../../core/services/platform-state.service';

@Component({
  selector: 'app-worker-verification',
  standalone: true,
  imports: [
    CommonModule, 
    MatCardModule, 
    MatButtonModule, 
    MatIconModule, 
    MatChipsModule, 
    MatProgressBarModule, 
    MatDividerModule,
    MatListModule,
    MatSnackBarModule
  ],
  template: `
    <div class="space-y-8 animate-in fade-in duration-500">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-5xl font-black text-slate-900 tracking-tighter">Identity & Verification</h1>
        <p class="text-slate-500 font-medium mt-2">Complete your profile verification to unlock premium marketplace features.</p>
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
      <mat-card class="!rounded-3xl !bg-slate-900 !text-white !shadow-2xl overflow-hidden !border !border-blue-500/20">
        <mat-card-content class="!p-10 flex items-center gap-8 relative">
          <div class="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
            <mat-icon class="!text-[160px] !w-auto !h-auto">encrypted</mat-icon>
          </div>
          <div class="flex-shrink-0 bg-blue-600/20 p-6 rounded-3xl border border-blue-500/30">
            <mat-icon class="!text-blue-400 !text-5xl !w-auto !h-auto">lock</mat-icon>
          </div>
          <div class="relative z-10">
            <h3 class="text-2xl font-black mb-3 tracking-tight">Secure Document Handling</h3>
            <p class="text-slate-400 text-sm max-w-2xl leading-relaxed font-medium">Your privacy is our priority. All uploaded documents are strictly encrypted using <strong class="text-white">AES-256 standards</strong>. Data is stored on disconnected secure servers and is only used for compliance verification.</p>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Main Layout -->
      @if (workerStatus !== 'Pending') {
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in zoom-in duration-500">
          <!-- Upload Area -->
          <div class="lg:col-span-8 space-y-8">
            <mat-card class="!rounded-3xl !border !border-slate-100 !shadow-sm !p-10">
              <div class="flex items-center gap-4 mb-10">
                <div class="p-3 bg-blue-50 text-blue-600 rounded-2xl"><mat-icon class="!w-6 !h-6">badge</mat-icon></div>
                <h2 class="text-2xl font-black text-slate-900 tracking-tight">Government ID</h2>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div 
                  (click)="fileInputFront.click()"
                  class="border-2 border-dashed border-slate-200 rounded-3xl p-12 flex flex-col items-center justify-center text-center hover:border-blue-600 hover:bg-slate-50 transition-all cursor-pointer group">
                  <input #fileInputFront type="file" accept="image/*,.pdf" (change)="onFileSelected($event, 'ID-Front')" class="hidden">
                  <div class="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <mat-icon class="text-slate-400 group-hover:text-blue-600 !text-[32px] !w-auto !h-auto">upload_file</mat-icon>
                  </div>
                  <p class="text-sm font-black text-slate-900 uppercase tracking-widest">Front Side</p>
                  <p class="text-[10px] text-slate-400 mt-2 font-black uppercase">PNG, JPG, PDF UP TO 10MB</p>
                </div>
                <div 
                  (click)="fileInputBack.click()"
                  class="border-2 border-dashed border-slate-200 rounded-3xl p-12 flex flex-col items-center justify-center text-center hover:border-blue-600 hover:bg-slate-50 transition-all cursor-pointer group">
                  <input #fileInputBack type="file" accept="image/*,.pdf" (change)="onFileSelected($event, 'ID-Back')" class="hidden">
                  <div class="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <mat-icon class="text-slate-400 group-hover:text-blue-600 !text-[32px] !w-auto !h-auto">upload_file</mat-icon>
                  </div>
                  <p class="text-sm font-black text-slate-900 uppercase tracking-widest">Back Side</p>
                  <p class="text-[10px] text-slate-400 mt-2 font-black uppercase">PNG, JPG, PDF UP TO 10MB</p>
                </div>
              </div>
            </mat-card>

            <mat-card class="!rounded-3xl !border !border-slate-100 !shadow-sm !p-10">
              <div class="flex items-center justify-between mb-10">
                <div class="flex items-center gap-4">
                  <div class="p-3 bg-blue-50 text-blue-600 rounded-2xl"><mat-icon class="!w-6 !h-6">workspace_premium</mat-icon></div>
                  <h2 class="text-2xl font-black text-slate-900 tracking-tight">Professional Certifications</h2>
                </div>
                <button (click)="certFileInput.click()" mat-flat-button color="primary" class="!rounded-xl !px-6 !py-4 !font-black !text-[10px] !uppercase !tracking-widest !shadow-lg">
                  <input #certFileInput type="file" accept=".pdf,.jpg,.png" (change)="onFileSelected($event, 'Certification')" class="hidden">
                  <mat-icon class="!text-sm">add</mat-icon> Add New
                </button>
              </div>
              <div (click)="bulkFileInput.click()" class="w-full border-2 border-dashed border-slate-200 rounded-3xl p-16 flex flex-col items-center justify-center text-center hover:border-blue-600 transition-all group cursor-pointer">
                <input #bulkFileInput type="file" multiple accept=".pdf,.jpg,.png" (change)="onFileSelected($event, 'Certification')" class="hidden">
                <mat-icon class="text-slate-200 text-[64px] !w-auto !h-auto mb-6 group-hover:text-blue-600 transition-colors">clinical_notes</mat-icon>
                <p class="text-sm text-slate-500 max-w-sm font-medium leading-relaxed">Drag and drop your professional licenses, industry certificates, or diplomas here.</p>
                <button mat-button color="primary" class="mt-8 !font-black !text-[10px] !uppercase !tracking-widest">Browse Files</button>
              </div>
            </mat-card>
          </div>

          <!-- File List -->
          <div class="lg:col-span-4 h-full">
            <mat-card class="!rounded-3xl !border !border-slate-100 !shadow-sm flex flex-col h-full overflow-hidden">
              <mat-card-header class="!p-8 !border-b !border-slate-50 !bg-slate-50/50">
                <mat-card-title class="!text-[10px] !font-black !text-slate-900 !uppercase !tracking-widest !m-0">Uploaded Files ({{ uploadedFiles().length }})</mat-card-title>
                <mat-card-subtitle class="!text-[9px] !text-slate-400 !mt-1 !font-black !uppercase !tracking-tighter">Managed cryptographically</mat-card-subtitle>
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
                              @case ('uploaded') { <span>hourglass_empty</span> }
                              @case ('validating') { <span>history</span> }
                              @case ('approved') { <span>check_circle</span> }
                              @case ('rejected') { <span>error</span> }
                            }
                          </mat-icon>
                        </div>
                        <div matListItemTitle class="flex justify-between items-start w-full">
                          <div class="min-w-0 pr-4 flex-1">
                            <p class="text-xs font-black text-slate-900 truncate">{{ file.name }}</p>
                            <p class="text-[9px] text-slate-400 font-black uppercase mt-1">{{ file.type }} • {{ (file.file.size / 1024 / 1024).toFixed(1) }} MB</p>
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
              <div class="p-8 bg-slate-50 border-t border-slate-100">
                <div class="flex justify-between items-center text-[10px] font-black uppercase tracking-widest mb-3">
                  <span class="text-slate-400">Storage Used</span>
                  <span class="text-slate-900">{{ totalSize.toFixed(1) }} MB / 50 MB</span>
                </div>
                <mat-progress-bar mode="determinate" [value]="(totalSize / 50) * 100" class="!h-2 rounded-full"></mat-progress-bar>
              </div>
            </mat-card>
          </div>
        </div>

        <!-- Submission Action -->
        <div class="mt-8 flex justify-end">
          <button 
            mat-flat-button 
            color="primary" 
            class="!rounded-xl !px-12 !py-6 !font-black !text-[12px] !uppercase !tracking-widest !shadow-lg"
            (click)="submitApplication()">
            {{ state.currentWorker().status === 'Rejected' ? 'Resubmit Application' : 'Submit Application' }}
          </button>
        </div>
      } @else {
        <!-- Success/Pending State -->
        <mat-card class="!rounded-[3rem] !border-none !shadow-2xl !bg-white overflow-hidden animate-in fade-in zoom-in duration-700">
          <mat-card-content class="!p-20 flex flex-col items-center text-center">
            <div class="w-32 h-32 bg-teal-50 rounded-[2.5rem] flex items-center justify-center mb-10 relative">
              <mat-icon class="!text-teal-600 !text-6xl !w-auto !h-auto">task_alt</mat-icon>
              <div class="absolute -right-2 -bottom-2 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center border-4 border-white animate-bounce">
                <mat-icon class="!text-white !text-lg !w-auto !h-auto">hourglass_empty</mat-icon>
              </div>
            </div>
            <h2 class="text-4xl font-black text-slate-900 tracking-tighter mb-4">Application Successfully Submitted</h2>
            <p class="text-slate-500 font-medium max-w-lg leading-relaxed mb-10">
              Our administrators have received your credentials. Your profile is currently under a **manual trust audit**. 
              This typically takes 12-24 hours. You will receive a notification once your "Verified Expert" badge is live.
            </p>
            <div class="flex flex-wrap justify-center gap-4">
              <button mat-flat-button color="primary" routerLink="/worker/dashboard" class="!px-10 !py-6 !rounded-2xl !font-black !text-xs !uppercase !tracking-widest !shadow-xl">
                Go to Dashboard
              </button>
              <button mat-stroked-button class="!border-slate-200 !px-10 !py-6 !rounded-2xl !font-black !text-xs !uppercase !tracking-widest">
                Contact Support
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `
})
export class WorkerVerificationPage {
  state = inject(PlatformStateService);
  private snackBar = inject(MatSnackBar);

  get workerStatus() {
    return this.state.currentWorker().status;
  }

  get rejectionReason() {
    // Cast to any to prevent strict template IDE errors if language server is stale
    return (this.state.currentWorker() as any).rejectionReason;
  }

  worker = this.state.currentWorker;

  uploadedFiles = computed<any[]>(() => this.worker().uploadedDocuments || []);

  getStatusClasses(status: string) {
    const statusMap: { [key: string]: { bg: string; color: string } } = {
      'uploaded': { bg: 'bg-slate-50', color: 'text-slate-500' },
      'validating': { bg: 'bg-amber-50', color: 'text-amber-800' },
      'approved': { bg: 'bg-teal-50', color: 'text-teal-700' },
      'rejected': { bg: 'bg-red-50', color: 'text-red-700' }
    };
    return statusMap[status] || statusMap['uploaded'];
  }

  get totalSize(): number {
    return this.uploadedFiles().reduce((sum: number, f: any) => sum + (f.file.size / 1024 / 1024), 0);
  }

  onFileSelected(event: Event, type: string) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    for (let i = 0; i < input.files.length; i++) {
      const file = input.files[i];
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        this.snackBar.open('❌ File too large. Max 10MB allowed.', 'Close', { duration: 4000 });
        continue;
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        this.snackBar.open('❌ Invalid file type. Use PNG, JPG, or PDF.', 'Close', { duration: 4000 });
        continue;
      }

      const fileName = `${type}-${Date.now()}-${file.name}`;
      const newFile: any = { 
        name: file.name, 
        file, 
        type, 
        status: 'uploaded' as const,
        error: undefined
      };

      this.state.currentWorker.update(w => ({
        ...w,
        uploadedDocuments: [...(w.uploadedDocuments || []), newFile]
      }));
      this.snackBar.open(`✓ ${file.name} uploaded successfully`, 'Close', { duration: 3000 });

      // Simulate validation after 2 seconds
      setTimeout(() => {
        this.state.currentWorker.update(w => ({
          ...w,
          uploadedDocuments: (w.uploadedDocuments || []).map(f => f.name === file.name ? { ...f, status: 'validating' as any } : f)
        }));
      }, 1000);

      // Simulate approval after 4 seconds
      setTimeout(() => {
        this.state.currentWorker.update(w => ({
          ...w,
          uploadedDocuments: (w.uploadedDocuments || []).map(f => f.name === file.name ? { ...f, status: 'approved' as any } : f)
        }));
      }, 3000);
    }

    // Clear input
    input.value = '';
  }

  removeFile(fileName: string) {
    this.state.currentWorker.update(w => ({
      ...w,
      uploadedDocuments: (w.uploadedDocuments || []).filter(f => f.name !== fileName)
    }));
    this.snackBar.open('File removed', 'Close', { duration: 2000 });
  }

  dismissRejection() {
    // Clear rejection reason from display
    this.state.currentWorker.update(w => ({...w, rejectionReason: undefined}));
  }

  submitApplication() {
    if (this.state.currentWorkerCompletion() < 100) {
      this.snackBar.open('❌ Please complete your profile details (100%) before submitting.', 'Close', { duration: 4000 });
      return;
    }

    if (this.uploadedFiles().length === 0) {
      this.snackBar.open('❌ Please upload at least one document before submitting.', 'Close', { duration: 4000 });
      return;
    }
    
    if (this.state.currentWorker().status === 'Rejected') {
      this.state.resubmitWorker(this.state.currentWorker().id);
      this.snackBar.open('✓ Application resubmitted successfully', 'Close', { duration: 4000 });
    } else {
      this.state.submitForVerification();
      this.snackBar.open('✓ Application submitted successfully! Please wait for Admin approval.', 'Great', { 
        duration: 5000,
        panelClass: ['!bg-teal-900', '!text-white', '!rounded-2xl']
      });
    }
  }
}
