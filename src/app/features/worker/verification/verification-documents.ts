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
    <div class="max-w-6xl mx-auto space-y-6 pb-20">
      <!-- Header -->
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="px-2 py-0.5 bg-blue-600 text-white rounded-md font-black text-[8px] uppercase">Security</span>
          <span class="text-slate-300">/</span>
          <span class="text-[9px] font-black text-slate-400 uppercase">Trust Audit</span>
        </div>
        <h1 class="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Identity Verification</h1>
        <p class="text-slate-500 text-sm font-medium">Securely upload credentials for marketplace approval.</p>
      </div>

      <!-- Rejection Alert -->
      @if (workerStatus === 'Rejected' && rejectionReason) {
        <div class="bg-red-50 border border-red-100 rounded-3xl p-6 flex items-start gap-4">
          <mat-icon class="text-red-600">report_problem</mat-icon>
          <div class="flex-1">
            <h3 class="font-black text-red-900 mb-1">Review Required</h3>
            <p class="text-sm text-red-800 font-medium">{{ rejectionReason }}</p>
            <p class="text-[10px] text-red-700 font-black uppercase mt-2">Update documents and resubmit below.</p>
          </div>
          <button (click)="dismissRejection()" class="text-red-400"><mat-icon>close</mat-icon></button>
        </div>
      }

      @if (workerStatus !== 'Pending') {
        <div class="grid grid-cols-12 gap-8">
          <!-- Main Content -->
          <div class="col-span-12 lg:col-span-8 space-y-6">
            <!-- ID Uploads (Front & Back) -->
            <div class="bg-white rounded-3xl p-6 border border-slate-100">
              <div class="flex items-center gap-3 mb-6">
                <mat-icon class="text-blue-600">badge</mat-icon>
                <div>
                  <h2 class="font-black text-slate-900">Identification</h2>
                  <p class="text-xs text-slate-400">National ID / Passport</p>
                </div>
              </div>
                <div (click)="fileInputFront.click()" class="aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500">
                  <input #fileInputFront type="file" accept="image/*,.pdf" (change)="onFileSelected($event, 'ID-Front')" class="hidden">
                  <mat-icon class="text-slate-400 mb-2">upload_file</mat-icon>
                  <span class="text-xs font-black uppercase">ID Front</span>
                </div>
                <div (click)="fileInputBack.click()" class="aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500">
                  <input #fileInputBack type="file" accept="image/*,.pdf" (change)="onFileSelected($event, 'ID-Back')" class="hidden">
                  <mat-icon class="text-slate-400 mb-2">upload_file</mat-icon>
                  <span class="text-xs font-black uppercase">ID Back</span>
                </div>
            </div>

            <!-- Professional Proof -->
            <div class="bg-white rounded-3xl p-6 border border-slate-100">
              <div class="flex items-center gap-3 mb-6">
                <mat-icon class="text-teal-600">workspace_premium</mat-icon>
                <div>
                  <h2 class="font-black text-slate-900">Professional Proof</h2>
                  <p class="text-xs text-slate-400">Trade licenses & certificates</p>
                </div>
              </div>
              <div (click)="bulkFileInput.click()" class="py-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-teal-500">
                <input #bulkFileInput type="file" multiple accept=".pdf,.jpg,.png" (change)="onFileSelected($event, 'Certification')" class="hidden">
                <mat-icon class="text-slate-300 text-4xl mb-2">cloud_upload</mat-icon>
                <p class="text-xs font-black">Drag & drop or click to upload</p>
                <p class="text-[10px] text-slate-400">PDF, JPG, PNG (max 10MB)</p>
              </div>
            </div>
          </div>

          <!-- Sidebar: File Vault -->
          <div class="col-span-12 lg:col-span-4 space-y-6">
            <div class="bg-slate-900 text-white rounded-3xl p-6">
              <mat-icon class="text-teal-400 mb-2">verified_user</mat-icon>
              <h3 class="text-xl font-black">Secure Vault</h3>
              <p class="text-white/60 text-xs my-2">AES-256 encrypted storage.</p>
              <div class="flex items-center gap-2 text-[9px] font-black text-teal-400">🔒 Military Grade Security</div>
            </div>

            <div class="bg-white rounded-3xl p-6 border border-slate-100">
              <div class="flex justify-between text-xs font-black mb-4">
                <span class="text-slate-400">Vault Inventory</span>
                <span>{{ uploadedFiles().length }} items</span>
              </div>
              <div class="space-y-2 max-h-64 overflow-y-auto">
                @for (file of uploadedFiles(); track file.name) {
                  <div class="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                    <div class="flex items-center gap-2 truncate">
                      <mat-icon [class]="file.status === 'approved' ? 'text-teal-600' : 'text-slate-400'" class="text-base">description</mat-icon>
                      <span class="text-xs font-medium truncate">{{ file.name }}</span>
                    </div>
                    <button (click)="removeFile(file.name)" class="text-slate-300 hover:text-red-500"><mat-icon class="text-sm">delete</mat-icon></button>
                  </div>
                } @empty {
                  <div class="text-center py-8 text-slate-400 text-xs">No files uploaded</div>
                }
              </div>
              <div class="mt-4 pt-4 border-t">
                <div class="flex justify-between text-[10px] font-black mb-1">
                  <span>Capacity</span>
                  <span>{{ totalSize.toFixed(1) }} / 50 MB</span>
                </div>
                <div class="h-1 bg-slate-100 rounded-full"><div class="h-full bg-blue-600 rounded-full" [style.width.%]="(totalSize/50)*100"></div></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Submit Button -->
        <div class="flex justify-end">
          <button (click)="submitApplication()" [disabled]="isSubmitting() || uploadedFiles().length === 0"
                  class="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg disabled:opacity-50">
            {{ isSubmitting() ? 'Submitting...' : (workerStatus === 'Rejected' ? 'Resubmit' : 'Submit for Review') }}
          </button>
        </div>
      } @else {
        <!-- Pending State -->
        <div class="bg-white rounded-3xl p-12 text-center max-w-2xl mx-auto">
          <mat-icon class="text-blue-600 text-6xl !w-auto !h-auto mb-4">security</mat-icon>
          <h2 class="text-2xl font-black">Review in Progress</h2>
          <p class="text-slate-500 my-4">Your credentials are being verified. This takes 12-24 business hours.</p>
          <button routerLink="/worker/dashboard" class="bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase">Go to Dashboard</button>
        </div>
      }
    </div>
  `
})
export class WorkerVerificationPage {
  state = inject(PlatformStateService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  isSubmitting = signal(false);

  get workerStatus() { return this.state.currentWorker().status; }
  get rejectionReason() { return (this.state.currentWorker() as any).rejectionReason; }
  worker = this.state.currentWorker;
  uploadedFiles = computed<any[]>(() => this.worker().uploadedDocuments || []);

  get totalSize(): number {
    return this.uploadedFiles().reduce((sum, f) => sum + (f.file?.size / 1024 / 1024 || 0), 0);
  }

  async onFileSelected(event: Event, type: string) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    for (let i = 0; i < input.files.length; i++) {
      const file = input.files[i];
      if (file.size > 10 * 1024 * 1024) {
        this.notification.error('File too large (max 10MB)');
        continue;
      }
      const workerId = this.state.currentWorker().id;
      this.state.uploadDocument(workerId, type, file.name, file).subscribe({
        next: (doc) => {
          this.state.currentWorker.update(w => ({
            ...w,
            uploadedDocuments: [...(w.uploadedDocuments || []), {
              id: doc.id,
              name: doc.name,
              type: doc.type,
              status: 'uploaded',
              url: doc.documentUrl,
              file
            }]
          }));
          this.notification.success(`${file.name} uploaded`);
        },
        error: () => this.notification.error(`Failed to upload ${file.name}`)
      });
    }
    input.value = '';
  }

  removeFile(fileName: string) {
    const doc = this.uploadedFiles().find(f => f.name === fileName);
    if (doc?.id) {
      this.state.deleteDocument(doc.id).subscribe({
        next: () => {
          this.state.currentWorker.update(w => ({
            ...w,
            uploadedDocuments: (w.uploadedDocuments || []).filter(f => f.name !== fileName)
          }));
          this.notification.info('File removed');
        },
        error: () => this.notification.error('Failed to remove file')
      });
      return;
    }
    this.state.currentWorker.update(w => ({
      ...w,
      uploadedDocuments: (w.uploadedDocuments || []).filter(f => f.name !== fileName)
    }));
  }

  dismissRejection() {
    this.state.currentWorker.update(w => ({ ...w, rejectionReason: undefined }));
  }

  submitApplication() {
    if (this.state.currentWorkerCompletion() < 100) {
      this.notification.error('Complete your profile (100%) before submitting.');
      return;
    }
    if (this.uploadedFiles().length === 0) {
      this.notification.error('Upload at least one document.');
      return;
    }
    this.isSubmitting.set(true);
    if (this.state.currentWorker().status === 'Rejected') {
      this.state.resubmitWorker(this.state.currentWorker().id);
      setTimeout(() => this.isSubmitting.set(false), 2000);
    } else {
      this.state.submitForVerification();
      setTimeout(() => {
        this.isSubmitting.set(false);
        this.notification.success('Submitted for review!');
      }, 1000);
    }
  }
}