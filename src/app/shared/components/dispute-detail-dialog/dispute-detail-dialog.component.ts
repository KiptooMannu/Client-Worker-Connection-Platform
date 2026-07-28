import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';

interface DisputeDetailData {
  disputeId: string;
  jobId: string;
}

@Component({
  selector: 'app-dispute-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule
  ],
  template: `
    <!-- A 600px floor forced 280px of horizontal scroll inside the dialog on a
         320px phone. The dialog now fills the available width and only reaches
         for 600px once the viewport can actually supply it. -->
    <div class="p-4 sm:p-6 w-full sm:min-w-[min(600px,80vw)] max-w-[800px]">
      <h2 class="text-xl font-black text-slate-900 mb-4">Dispute Details</h2>
      
      @if (loading) {
        <div class="flex justify-center py-8">
          <mat-progress-spinner mode="indeterminate"></mat-progress-spinner>
        </div>
      } @else if (error) {
        <div class="bg-rose-50 border border-rose-200 rounded-lg p-4 text-rose-700">
          <p class="font-bold">{{ error }}</p>
        </div>
      } @else if (dispute) {
        <div class="space-y-4">
          <!-- Dispute Status -->
          <div class="flex items-center gap-3">
            <span class="text-sm font-bold text-slate-600">Status:</span>
            <span [ngClass]="getStatusColor(dispute.status)" 
                  class="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
              {{ dispute.status }}
            </span>
          </div>

          <!-- Dispute ID -->
          <div class="flex items-center gap-3">
            <span class="text-sm font-bold text-slate-600">Dispute ID:</span>
            <span class="text-sm font-mono text-slate-800">{{ dispute.id }}</span>
          </div>

          <!-- Filed By -->
          <div class="flex items-center gap-3">
            <span class="text-sm font-bold text-slate-600">Filed By:</span>
            <span class="text-sm text-slate-800">{{ dispute.filedByUsername }} ({{ dispute.filedByRole }})</span>
          </div>

          <!-- Filed At -->
          <div class="flex items-center gap-3">
            <span class="text-sm font-bold text-slate-600">Filed At:</span>
            <span class="text-sm text-slate-800">{{ formatDate(dispute.filedAt) }}</span>
          </div>

          <!-- Reason -->
          <div class="bg-slate-50 rounded-lg p-4">
            <span class="text-sm font-bold text-slate-600 block mb-2">Reason:</span>
            <span class="text-sm text-slate-800">{{ dispute.disputeReasonKey }}</span>
          </div>

          <!-- Description -->
          <div class="bg-slate-50 rounded-lg p-4">
            <span class="text-sm font-bold text-slate-600 block mb-2">Description:</span>
            <p class="text-sm text-slate-800">{{ dispute.disputeDescription }}</p>
          </div>

          <!-- Priority -->
          <div class="flex items-center gap-3">
            <span class="text-sm font-bold text-slate-600">Priority:</span>
            <span [ngClass]="getPriorityColor(dispute.priority)" 
                  class="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
              {{ dispute.priority }}
            </span>
          </div>

          <!-- Resolution Info (if resolved) -->
          @if (dispute.status === 'RESOLVED') {
            <mat-divider></mat-divider>
            <div class="bg-emerald-50 rounded-lg p-4">
              <h3 class="text-sm font-black text-emerald-800 mb-3">Resolution Details</h3>
              
              <div class="space-y-2">
                <div class="flex items-center gap-3">
                  <span class="text-sm font-bold text-emerald-700">Resolution Type:</span>
                  <span class="text-sm text-emerald-900">{{ dispute.resolutionType }}</span>
                </div>
                
                @if (dispute.clientResolutionAmount !== null) {
                  <div class="flex items-center gap-3">
                    <span class="text-sm font-bold text-emerald-700">Client Amount:</span>
                    <span class="text-sm text-emerald-900">KES {{ dispute.clientResolutionAmount?.toLocaleString() }}</span>
                  </div>
                }
                
                @if (dispute.workerResolutionAmount !== null) {
                  <div class="flex items-center gap-3">
                    <span class="text-sm font-bold text-emerald-700">Worker Amount:</span>
                    <span class="text-sm text-emerald-900">KES {{ dispute.workerResolutionAmount?.toLocaleString() }}</span>
                  </div>
                }
                
                @if (dispute.adminResolutionReason) {
                  <div class="mt-3">
                    <span class="text-sm font-bold text-emerald-700 block mb-1">Admin Reason:</span>
                    <p class="text-sm text-emerald-900">{{ dispute.adminResolutionReason }}</p>
                  </div>
                }
                
                @if (dispute.resolvedAt) {
                  <div class="flex items-center gap-3 mt-2">
                    <span class="text-sm font-bold text-emerald-700">Resolved At:</span>
                    <span class="text-sm text-emerald-900">{{ formatDate(dispute.resolvedAt) }}</span>
                  </div>
                }
                
                @if (dispute.resolvedByAdminName) {
                  <div class="flex items-center gap-3">
                    <span class="text-sm font-bold text-emerald-700">Resolved By:</span>
                    <span class="text-sm text-emerald-900">{{ dispute.resolvedByAdminName }}</span>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Evidence Count -->
          @if (dispute.evidence && dispute.evidence.length > 0) {
            <div class="flex items-center gap-3">
              <span class="text-sm font-bold text-slate-600">Evidence Files:</span>
              <span class="text-sm text-slate-800">{{ dispute.evidence.length }} file(s) uploaded</span>
            </div>
          }
        </div>

        <div class="flex justify-end mt-6">
          <button mat-button (click)="close()">Close</button>
        </div>
      }
    </div>
  `
})
export class DisputeDetailDialogComponent {
  loading = true;
  error = '';
  dispute: any = null;

  constructor(
    private dialogRef: MatDialogRef<DisputeDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DisputeDetailData,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadDisputeDetails();
  }

  loadDisputeDetails(): void {
    // First try to get dispute by jobId
    this.http.get<any>(`/api/disputes/by-job/${this.data.jobId}`).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.dispute = response.data;
        } else {
          this.error = 'Dispute not found';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load dispute details';
        this.loading = false;
      }
    });
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'OPEN': 'bg-blue-100 text-blue-800',
      'AWAITING_EVIDENCE': 'bg-amber-100 text-amber-800',
      'IN_REVIEW': 'bg-purple-100 text-purple-800',
      'RESOLVED': 'bg-emerald-100 text-emerald-800',
      'CLOSED': 'bg-slate-100 text-slate-800'
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  }

  getPriorityColor(priority: string): string {
    const colors: { [key: string]: string } = {
      'LOW': 'bg-slate-100 text-slate-800',
      'MEDIUM': 'bg-amber-100 text-amber-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'CRITICAL': 'bg-rose-100 text-rose-800'
    };
    return colors[priority] || 'bg-slate-100 text-slate-800';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
