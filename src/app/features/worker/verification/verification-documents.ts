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
    <div class="max-w-4xl mx-auto space-y-8 pb-24 font-manrope animate-in fade-in duration-700">
      
      <!-- Trust Audit Header -->
      <header class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-8">
        <div class="space-y-2">
          <div class="flex items-center gap-3 mb-1">
            <div class="w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center">
              <span class="material-symbols-outlined text-lg">verified_user</span>
            </div>
            <span class="font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase">Identity Vault</span>
          </div>
          <h1 class="text-3xl font-black text-brand-teal">Trust Audit</h1>
          <p class="font-body-sm text-body-sm text-on-surface-variant max-w-md">Compliance auditing for secure marketplace operations. High-level encryption active.</p>
        </div>

        <div class="flex items-center gap-4 p-4 bg-white border border-outline-variant rounded-xl shadow-sm">
           <div class="text-right">
              <span class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest block">Audit Readiness</span>
              <h2 class="text-2xl font-black text-brand-teal">{{ state.currentWorkerCompletion() }}%</h2>
           </div>
           <div class="h-12 w-12 rounded-lg bg-secondary-container flex items-center justify-center">
              <span class="material-symbols-outlined text-on-secondary-container" style="font-variation-settings: 'FILL' 1;">security</span>
           </div>
        </div>
      </header>

      <!-- Rejection Alert -->
      @if (workerStatus === 'Rejected' && rejectionReason) {
        <div class="bg-error-container border border-error/10 rounded-xl p-6 flex items-start gap-4 animate-in slide-in-from-top duration-500 shadow-sm">
          <div class="w-12 h-12 rounded-lg bg-error text-white flex items-center justify-center shadow-lg shadow-error/20 shrink-0">
            <mat-icon>report_problem</mat-icon>
          </div>
          <div class="flex-1">
            <h3 class="font-bold text-on-error-container mb-1 uppercase tracking-wider text-xs">Action Required</h3>
            <p class="text-sm text-on-error-container/80 leading-relaxed">{{ rejectionReason }}</p>
            <div class="mt-4 flex items-center gap-4">
              <p class="text-[10px] text-error font-black uppercase tracking-widest">Update documents and resubmit below.</p>
              <button (click)="dismissRejection()" class="text-[10px] font-black text-error hover:underline uppercase">Dismiss</button>
            </div>
          </div>
        </div>
      }

      @if (workerStatus !== 'Pending') {
        <div class="grid grid-cols-1 md:grid-cols-12 gap-8">
          <!-- Main Submission Area -->
          <div class="md:col-span-7 space-y-8">
            
            <!-- Identity Documents -->
            <section class="space-y-4">
              <h3 class="font-label-md text-label-md text-brand-teal uppercase tracking-widest px-1">Primary Credentials</h3>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <!-- ID Front -->
                <div (click)="fileInputFront.click()" class="group relative aspect-[1.5/1] bg-surface-container-low rounded-xl flex flex-col items-center justify-center border border-outline-variant hover:border-brand-teal transition-all cursor-pointer overflow-hidden shadow-sm">
                  <input #fileInputFront type="file" accept="image/*,.pdf" (change)="onFileSelected($event, 'ID-Front')" class="hidden">
                  @if (getFileUrl('ID-Front')) {
                    <img [src]="getFileUrl('ID-Front')" class="w-full h-full object-cover">
                    <div class="absolute inset-0 bg-brand-teal/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-[2px]">
                      <span class="bg-white px-3 py-1.5 rounded-lg text-brand-teal text-[10px] font-black uppercase tracking-widest shadow-lg">Replace Front</span>
                    </div>
                    <div class="absolute top-2 right-2 bg-brand-teal text-white w-6 h-6 rounded-full flex items-center justify-center shadow-sm">
                       <mat-icon class="!text-[14px]">check</mat-icon>
                    </div>
                  } @else {
                    <div class="flex flex-col items-center gap-2">
                      <div class="w-14 h-14 rounded-full bg-white flex items-center justify-center text-brand-teal border border-outline-variant shadow-sm">
                        <span class="material-symbols-outlined text-2xl">add_a_photo</span>
                      </div>
                      <span class="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">ID Front View</span>
                    </div>
                  }
                </div>

                <!-- ID Back -->
                <div (click)="fileInputBack.click()" class="group relative aspect-[1.5/1] bg-surface-container-low rounded-xl flex flex-col items-center justify-center border border-outline-variant hover:border-brand-teal transition-all cursor-pointer overflow-hidden shadow-sm">
                  <input #fileInputBack type="file" accept="image/*,.pdf" (change)="onFileSelected($event, 'ID-Back')" class="hidden">
                  @if (getFileUrl('ID-Back')) {
                    <img [src]="getFileUrl('ID-Back')" class="w-full h-full object-cover">
                    <div class="absolute inset-0 bg-brand-teal/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-[2px]">
                      <span class="bg-white px-3 py-1.5 rounded-lg text-brand-teal text-[10px] font-black uppercase tracking-widest shadow-lg">Replace Back</span>
                    </div>
                    <div class="absolute top-2 right-2 bg-brand-teal text-white w-6 h-6 rounded-full flex items-center justify-center shadow-sm">
                       <mat-icon class="!text-[14px]">check</mat-icon>
                    </div>
                  } @else {
                    <div class="flex flex-col items-center gap-2">
                      <div class="w-14 h-14 rounded-full bg-white flex items-center justify-center text-brand-teal border border-outline-variant shadow-sm">
                        <span class="material-symbols-outlined text-2xl">add_a_photo</span>
                      </div>
                      <span class="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">ID Back View</span>
                    </div>
                  }
                </div>
              </div>
            </section>

            <!-- Professional Proof -->
            <section class="space-y-4">
              <h3 class="font-label-md text-label-md text-brand-teal uppercase tracking-widest px-1">Secondary Proof</h3>
              <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-6">
                <div class="flex items-center justify-between gap-4">
                  <div class="flex-1">
                    <h4 class="font-bold text-brand-teal mb-1">Trade Certifications</h4>
                    <p class="text-xs text-on-surface-variant leading-relaxed">Safety audits, specialized licenses, or trade diplomas.</p>
                  </div>
                  <button (click)="bulkFileInput.click()" class="w-12 h-12 bg-brand-teal text-white rounded-lg flex items-center justify-center shadow-lg active:scale-95 transition-transform">
                    <mat-icon>upload_file</mat-icon>
                  </button>
                  <input #bulkFileInput type="file" multiple accept=".pdf,.jpg,.png" (change)="onFileSelected($event, 'Certification')" class="hidden">
                </div>
              </div>
            </section>
          </div>

          <!-- Sidebar: Secure Vault -->
          <aside class="md:col-span-5 space-y-6">
            <div class="bg-brand-teal text-white rounded-xl p-6 shadow-xl relative overflow-hidden group">
              <!-- Subtle AES encryption pattern background -->
              <div class="absolute inset-0 opacity-5 pointer-events-none" style="background-image: radial-gradient(#fff 1px, transparent 1px); background-size: 20px 20px;"></div>
              
              <div class="relative z-10">
                <div class="flex items-center justify-between mb-8">
                  <h3 class="text-xl font-black tracking-tight">Audit Ledger</h3>
                  <span class="material-symbols-outlined text-white/60">lock_open</span>
                </div>

                <div class="space-y-4">
                  <div class="flex items-center justify-between bg-white/10 p-3 rounded-lg border border-white/5">
                    <div class="flex items-center gap-3">
                      <span class="material-symbols-outlined text-secondary-container-fixed">fingerprint</span>
                      <div>
                        <p class="text-[9px] text-white/40 font-black uppercase tracking-widest">Encryption</p>
                        <p class="text-xs font-bold">AES-256 Standard</p>
                      </div>
                    </div>
                    <span class="text-[10px] bg-white/20 px-2 py-0.5 rounded font-bold">ACTIVE</span>
                  </div>

                  <div class="space-y-2 mt-6">
                     <p class="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">Inventory • {{ uploadedFiles().length }} Items</p>
                     @for (file of uploadedFiles(); track file.id) {
                       <div class="flex items-center justify-between p-2 hover:bg-white/5 rounded transition-colors group/item">
                          <div class="flex items-center gap-2 truncate">
                             <mat-icon class="text-white/40 !text-sm">description</mat-icon>
                             <span class="text-[11px] text-white/80 font-medium truncate">{{ file.name }}</span>
                          </div>
                          <button (click)="removeFile(file)" class="opacity-0 group-hover/item:opacity-100 text-white/40 hover:text-white transition-opacity">
                             <mat-icon class="!text-[14px]">delete</mat-icon>
                          </button>
                       </div>
                     }
                     @if (uploadedFiles().length === 0) {
                        <div class="text-center py-6 border border-dashed border-white/10 rounded-lg">
                           <p class="text-[10px] text-white/30 italic">No credentials staged for audit</p>
                        </div>
                     }
                  </div>
                </div>
              </div>
            </div>

            <!-- Profile Readiness Action -->
            <div class="bg-white rounded-xl p-6 border border-outline-variant shadow-sm space-y-4">
               <div>
                  <h4 class="font-bold text-brand-teal">Commit to Audit</h4>
                  <p class="text-xs text-on-surface-variant mt-1 leading-relaxed">
                     Review is finalized by compliance officers. Integrity check usually completes within 24 operational hours.
                  </p>
               </div>
               
               <button (click)="submitApplication()" 
                       [disabled]="isSubmitting() || uploadedFiles().length === 0 || state.currentWorkerCompletion() < 100"
                       class="w-full py-4 bg-brand-teal text-white rounded-lg font-bold text-sm uppercase tracking-widest hover:opacity-90 disabled:opacity-30 disabled:grayscale transition-all shadow-lg shadow-brand-teal/10 active:scale-[0.98]">
                  {{ isSubmitting() ? 'Transmitting...' : 'Sign & Submit' }}
               </button>

               @if (state.currentWorkerCompletion() < 100) {
                 <div class="flex items-start gap-2 p-3 bg-surface-container rounded-lg border border-outline-variant/30">
                    <mat-icon class="text-brand-teal !text-[16px]">info_outline</mat-icon>
                    <p class="text-[10px] text-on-surface-variant font-medium leading-normal">
                      Profile requires 100% completion: bio, skills, work history, certifications, ID documents (front & back), and trade certification proof before transmission to compliance.
                    </p>
                 </div>
               }
            </div>
          </aside>
        </div>
      } @else {
        <!-- Pending Review State -->
        <div class="bg-surface-container-lowest rounded-xl p-12 text-center max-w-xl mx-auto border border-outline-variant shadow-sm animate-in zoom-in duration-700">
          <div class="w-20 h-20 bg-secondary-container text-on-secondary-container rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <span class="material-symbols-outlined text-[40px]" style="font-variation-settings: 'FILL' 1;">security</span>
          </div>
          <h2 class="text-2xl font-black text-brand-teal mb-3">Audit Underway</h2>
          <p class="text-on-surface-variant text-sm font-medium mb-8 leading-relaxed px-4">Our compliance team is currently auditing your professional credentials. Verification usually completes within 24 business hours.</p>
          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <button routerLink="/worker/dashboard" class="px-6 py-3 bg-brand-teal text-white rounded-lg font-bold text-xs uppercase tracking-widest shadow-sm active:scale-95 transition-transform">Back to Workspace</button>
            <button class="px-6 py-3 border border-outline-variant text-brand-teal rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-surface-container-low transition-colors">Support Line</button>
          </div>
        </div>
      }
      
      <footer class="text-center pt-12">
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-surface-container-low rounded-full border border-outline-variant">
           <span class="w-1.5 h-1.5 bg-brand-teal rounded-full animate-pulse"></span>
           <span class="text-[9px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Kazi Secure Shield Active • ISO 27001 Protocol</span>
        </div>
      </footer>
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

  getFileUrl(type: string): string | null {
    const file = this.uploadedFiles().find(f => f.type === type);
    return file ? file.url : null;
  }

  get totalSize(): number {
    return this.uploadedFiles().reduce((sum, f) => sum + (f.file?.size / 1024 / 1024 || 0), 0);
  }

  async onFileSelected(event: Event, type: string) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    for (let i = 0; i < input.files.length; i++) {
      const file = input.files[i];
      
      // Check for duplicates
      const isDuplicate = (this.worker().uploadedDocuments || []).some(d => d.name === file.name && d.type === type);
      if (isDuplicate) {
        this.notification.error(`${file.name} is already uploaded in this category.`);
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        this.notification.error('File too large (max 10MB)');
        continue;
      }
      const userId = this.state.currentWorker().userId;
      if (!userId) {
        this.notification.error('User identity not found. Please re-login.');
        return;
      }
      this.state.uploadDocument(userId, type, file.name, file).subscribe({
        next: (doc) => {
          this.state.currentWorker.update(w => {
            // Only replace if it's a unique identity type (Front or Back)
            const isIdentity = type.startsWith('ID-');
            const filteredDocs = isIdentity 
              ? (w.uploadedDocuments || []).filter(d => d.type !== type)
              : (w.uploadedDocuments || []);
              
            return {
              ...w,
              uploadedDocuments: [...filteredDocs, {
                id: doc.id,
                name: doc.name,
                type: doc.type,
                status: 'uploaded',
                url: doc.documentUrl,
                file
              }]
            };
          });
          this.notification.success(`${file.name} uploaded`);
        },
        error: () => this.notification.error(`Failed to upload ${file.name}`)
      });
    }
    input.value = '';
  }

  removeFile(file: any) {
    const removeFromLocal = () => {
      this.state.currentWorker.update(w => ({
        ...w,
        uploadedDocuments: (w.uploadedDocuments || []).filter(f => f.id ? f.id !== file.id : f !== file)
      }));
    };

    if (file.id) {
      // Optimistic remove
      removeFromLocal();
      
      this.state.deleteDocument(file.id).subscribe({
        next: () => {
          this.notification.info('✓ File deleted successfully');
        },
        error: (err) => {
          console.error('[Verification] Delete failed:', err);
          this.notification.error(`Server error: ${err.status} - ${err.message || 'Failed to remove'}`);
          // Rollback if needed, but usually 404/500 on delete means we sync anyway
        }
      });
      return;
    }
    
    removeFromLocal();
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
      const userId = this.state.currentWorker().userId;
      if (userId) this.state.resubmitWorker(userId);
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