import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { PlatformStateService } from '../../../core/services/platform-state.service';

@Component({
  selector: 'app-admin-verification-queue',
  standalone: true,
  imports: [
    CommonModule, 
    MatCardModule, 
    MatButtonModule, 
    MatIconModule, 
    MatTableModule, 
    MatChipsModule,
    MatProgressBarModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatCheckboxModule
  ],
  template: `
    <div class="space-y-8 animate-in fade-in duration-700">
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 class="text-5xl font-black text-slate-900 tracking-tighter">Verification Queue</h1>
          <p class="text-slate-500 font-medium mt-2">Reviewing {{ state.pendingWorkers().length }} new applications from service providers.</p>
        </div>
        
        <!-- Bulk Actions Toolbar -->
        @if (selectedIds.size > 0) {
          <div class="bg-blue-50 border border-blue-100 px-6 py-3 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-4">
            <span class="text-xs font-black text-blue-800 uppercase tracking-widest">{{ selectedIds.size }} Selected</span>
            <div class="flex gap-2">
              <button mat-button color="warn" (click)="openBulkReject()" class="!font-black !text-[10px] !uppercase">Reject</button>
              <button mat-flat-button color="primary" (click)="bulkApprove()" class="!rounded-xl !font-black !text-[10px] !uppercase">Approve</button>
            </div>
          </div>
        }
      </div>

      <!-- Main Table -->
      <mat-card class="!rounded-[2.5rem] !border !border-slate-100 !shadow-sm overflow-hidden">
        <mat-card-header class="!p-8 !border-b !border-slate-50 !bg-slate-50/50">
          <mat-card-title class="!text-[10px] !font-black !text-slate-900 !uppercase !tracking-widest !m-0">New Applicants</mat-card-title>
        </mat-card-header>

        <table mat-table [dataSource]="state.pendingWorkers()" class="w-full">
          <!-- Select Column -->
          <ng-container matColumnDef="select">
            <th mat-header-cell *matHeaderCellDef class="!w-16 !bg-slate-900 !px-6">
              <mat-checkbox 
                (change)="$event ? masterToggle() : null"
                [checked]="isAllSelected()"
                [indeterminate]="selectedIds.size > 0 && !isAllSelected()"
                color="primary">
              </mat-checkbox>
            </th>
            <td mat-cell *matCellDef="let user" class="!px-6">
              <mat-checkbox 
                (click)="$event.stopPropagation()"
                (change)="$event ? toggleSelection(user.id) : null"
                [checked]="selectedIds.has(user.id)"
                color="primary">
              </mat-checkbox>
            </td>
          </ng-container>

          <ng-container matColumnDef="applicant">
            <th mat-header-cell *matHeaderCellDef class="!bg-slate-900 !text-white !font-black !text-[10px] !uppercase !tracking-widest">Name</th>
            <td mat-cell *matCellDef="let user">
              <div class="flex items-center gap-4 py-6">
                <div class="w-10 h-10 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center text-blue-700 font-black text-[11px] uppercase">
                  @if (user.image) { <img [src]="user.image" class="w-full h-full object-cover"> } @else { {{ user.initials }} }
                </div>
                <div>
                  <p class="text-sm font-black text-slate-900 leading-tight">{{ user.name }}</p>
                  <p class="text-[10px] text-slate-500 font-medium mt-0.5">{{ user.email }}</p>
                </div>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="category">
            <th mat-header-cell *matHeaderCellDef class="!bg-slate-900 !text-white !font-black !text-[10px] !uppercase !tracking-widest">Service Type</th>
            <td mat-cell *matCellDef="let user" class="text-sm font-bold text-slate-900">{{ user.category }}</td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef class="!bg-slate-900 !text-white !font-black !text-[10px] !uppercase !tracking-widest">Priority</th>
            <td mat-cell *matCellDef="let user">
              <mat-chip class="!min-h-0 !p-0 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest" 
                        [ngClass]="user.status === 'Priority' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'">
                {{ user.status }}
              </mat-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef class="!bg-slate-900 !text-white !font-black !text-[10px] !uppercase !tracking-widest text-right">Actions</th>
            <td mat-cell *matCellDef="let user" class="text-right">
              @if (reviewingId === user.id && !detailedReview) {
                <div class="flex items-center justify-end gap-2 animate-in slide-in-from-right-4">
                  <button mat-button (click)="openDetailedReview(user)" class="!text-[10px] !font-black !uppercase !text-blue-700">View Details</button>
                  <button mat-button color="warn" (click)="openReject(user)" class="!text-[10px] !font-black !uppercase">Reject</button>
                  <button mat-flat-button color="primary" (click)="approve(user)" class="!text-[10px] !font-black !uppercase !rounded-xl">Approve</button>
                  <button mat-icon-button (click)="reviewingId = null"><mat-icon class="!text-sm">close</mat-icon></button>
                </div>
              } @else if (reviewingId === user.id && detailedReview) {
                <button mat-icon-button (click)="detailedReview = null"><mat-icon class="!text-sm">close</mat-icon></button>
              } @else {
                <button mat-button color="primary" (click)="reviewingId = user.id" class="!font-black !text-[10px] !uppercase !underline !decoration-2 !underline-offset-4">Review Profile</button>
              }
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="hover:bg-slate-50 transition-colors"></tr>
        </table>
        
        @if (state.pendingWorkers().length === 0) {
          <div class="p-20 text-center bg-slate-50">
            <mat-icon class="!text-[64px] !w-auto !h-auto text-slate-200 mb-4">check_circle</mat-icon>
            <p class="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No pending applications. You're all caught up!</p>
          </div>
        }
      </mat-card>

      <!-- Detailed Review Panel -->
      @if (detailedReview) {
        <mat-card class="!rounded-[2.5rem] !border !border-slate-100 !shadow-2xl animate-in zoom-in mt-8">
          <mat-card-header class="!p-8 !bg-slate-50/50 !border-b !border-slate-100 flex justify-between items-center">
            <mat-card-title class="!text-xl !font-black !text-slate-900">Reviewing: {{ detailedReview.name }}</mat-card-title>
            <button mat-icon-button (click)="detailedReview = null"><mat-icon>close</mat-icon></button>
          </mat-card-header>
          <mat-card-content class="!p-8">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div class="space-y-6">
                <div>
                  <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Profile Overview</h4>
                  <div class="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 text-sm">
                    <p><strong>Email:</strong> {{ detailedReview.email }}</p>
                    <p><strong>Service Category:</strong> {{ detailedReview.category }}</p>
                    <p><strong>Hourly Rate:</strong> \${{ detailedReview.rate }}/hr</p>
                    <p><strong>Primary Location:</strong> {{ detailedReview.location }}</p>
                    <p><strong>Preferred Areas:</strong> {{ detailedReview.preferredLocations.join(', ') }}</p>
                    <div>
                      <strong>Skills:</strong>
                      <div class="flex flex-wrap gap-2 mt-2">
                        @for (skill of detailedReview.skills; track skill) {
                          <mat-chip class="!min-h-0 !p-0 px-2 py-1 rounded text-[10px] font-black uppercase">{{ skill }}</mat-chip>
                        }
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Work History</h4>
                  <div class="space-y-3">
                    @for (work of detailedReview.workHistory; track $index) {
                      <div class="p-4 bg-white border border-slate-200 rounded-xl">
                        <p class="font-black text-slate-900">{{ work.role }} @ {{ work.company }}</p>
                        <p class="text-[10px] text-slate-500 uppercase font-bold">{{ work.period }}</p>
                        <p class="text-xs text-slate-600 mt-2">{{ work.description }}</p>
                      </div>
                    }
                    @if (detailedReview.workHistory.length === 0) {
                      <p class="text-xs text-slate-400 italic">No work history provided.</p>
                    }
                  </div>
                </div>
              </div>
              <div class="space-y-6">
                <div>
                  <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Certifications</h4>
                  <div class="space-y-3">
                    @for (cert of detailedReview.certifications; track $index) {
                      <div class="p-4 bg-white border border-slate-200 rounded-xl flex justify-between items-center">
                        <div>
                          <p class="font-black text-slate-900">{{ cert.name }}</p>
                          <p class="text-[10px] text-slate-500 uppercase font-bold">{{ cert.issuer }}</p>
                        </div>
                        <span class="text-xs font-black text-blue-600">{{ cert.year }}</span>
                      </div>
                    }
                    @if (detailedReview.certifications.length === 0) {
                      <p class="text-xs text-slate-400 italic">No certifications provided.</p>
                    }
                  </div>
                </div>

                <div>
                  <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Uploaded Documents</h4>
                  <div class="space-y-3">
                    @for (doc of detailedReview.uploadedDocuments; track doc.name) {
                      <div class="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                        <div class="flex items-center gap-3">
                          <mat-icon class="text-blue-600">{{ doc.type.toLowerCase().includes('identification') ? 'badge' : 'workspace_premium' }}</mat-icon>
                          <div>
                            <p class="text-sm font-bold text-slate-900">{{ doc.name }}</p>
                            <p class="text-[10px] text-slate-500 uppercase">{{ doc.type }} • {{ doc.status }}</p>
                          </div>
                        </div>
                        <button mat-button class="!text-[10px] !font-black !uppercase !text-blue-600">View File</button>
                      </div>
                    }
                    @if (!detailedReview.uploadedDocuments || detailedReview.uploadedDocuments.length === 0) {
                       <p class="text-xs text-slate-400 italic">No documents uploaded for this application.</p>
                    }
                  </div>
                </div>
                <div class="flex justify-end gap-3 pt-6">
                  <button mat-button color="warn" (click)="openReject(detailedReview)" class="!font-black !text-[10px] !uppercase">Reject</button>
                  <button mat-flat-button color="primary" (click)="approve(detailedReview)" class="!px-8 !py-4 !rounded-xl !font-black !text-[10px] !uppercase">Approve Application</button>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      }

      <!-- Rejection Form (Single & Bulk) -->
      @if (rejectingUser || bulkRejecting) {
        <mat-card class="!rounded-[2.5rem] !border-2 !border-red-100 !shadow-2xl animate-in zoom-in mt-8">
          <mat-card-header class="!p-8 !bg-red-50/50">
            <mat-card-title class="!text-xl !font-black !text-red-700">
              Reject {{ bulkRejecting ? selectedIds.size + ' Applications' : 'Application: ' + rejectingUser.name }}
            </mat-card-title>
          </mat-card-header>
          <mat-card-content class="!p-8 space-y-6">
            <p class="text-sm text-slate-600 font-medium">Please explain why this profile is being rejected. This reason will be sent to the worker.</p>
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Rejection Reason</mat-label>
              <textarea matInput rows="4" [(ngModel)]="rejectionReason" placeholder="e.g. Identity documents are blurry, please re-upload."></textarea>
            </mat-form-field>
            <div class="flex justify-end gap-3">
              <button mat-button (click)="cancelReject()" class="!font-black !text-[10px] !uppercase">Cancel</button>
              <button mat-flat-button color="warn" [disabled]="!rejectionReason" (click)="confirmReject()" class="!px-8 !py-4 !rounded-xl !font-black !text-[10px] !uppercase">Send Rejection</button>
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    :host { display: block; } 
    :ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }
    
    @media (max-width: 768px) {
      .text-5xl { font-size: 2.5rem !important; }
      .p-8, .p-10, .p-20 { padding: 1.5rem !important; }
      .grid-cols-2 { grid-template-columns: 1fr !important; }
      
      /* Table Handling */
      .mat-mdc-table { display: block; overflow-x: auto; }
      .mat-mdc-header-row { min-width: 600px; }
      .mat-mdc-row { min-width: 600px; }
    }
  `]
})
export class AdminVerificationPage {
  state = inject(PlatformStateService);
  displayedColumns: string[] = ['select', 'applicant', 'category', 'status', 'actions'];
  reviewingId: string | null = null;
  detailedReview: any = null;
  
  rejectingUser: any = null;
  bulkRejecting = false;
  rejectionReason: string = '';
  
  selectedIds = new Set<string>();

  isAllSelected() {
    const pending = this.state.pendingWorkers();
    return pending.length > 0 && this.selectedIds.size === pending.length;
  }

  masterToggle() {
    if (this.isAllSelected()) {
      this.selectedIds.clear();
    } else {
      this.state.pendingWorkers().forEach(w => this.selectedIds.add(w.id));
    }
  }

  toggleSelection(id: string) {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  }

  bulkApprove() {
    this.selectedIds.forEach(id => this.state.approveWorker(id));
    this.selectedIds.clear();
  }

  openBulkReject() {
    this.bulkRejecting = true;
    this.rejectionReason = '';
    this.rejectingUser = null;
  }

  openDetailedReview(user: any) {
    this.reviewingId = user.id;
    this.detailedReview = user;
    this.rejectingUser = null;
  }

  approve(user: any) {
    this.state.approveWorker(user.id);
    this.reviewingId = null;
  }

  openReject(user: any) {
    this.rejectingUser = user;
    this.rejectionReason = '';
  }

  cancelReject() {
    this.rejectingUser = null;
    this.bulkRejecting = false;
  }

  confirmReject() {
    if (this.bulkRejecting) {
      this.selectedIds.forEach(id => this.state.rejectWorker(id, this.rejectionReason));
      this.selectedIds.clear();
    } else if (this.rejectingUser) {
      this.state.rejectWorker(this.rejectingUser.id, this.rejectionReason);
    }
    this.cancelReject();
    this.reviewingId = null;
  }
}
