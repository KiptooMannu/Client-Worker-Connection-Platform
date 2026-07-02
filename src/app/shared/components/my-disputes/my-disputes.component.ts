import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { DisputeService } from '../../../core/services/dispute.service';
import { NotificationService } from '../../../core/services/notification.service';
import { EvidenceSubmissionDialogComponent } from '../evidence-submission-dialog/evidence-submission-dialog.component';

interface Dispute {
  id: string;
  jobId: string;
  disputeReasonKey: string;
  disputeDescription: string;
  status: string;
  priority: string;
  filedAt: string;
  evidenceRequests: Array<{
    id: string;
    requestType: string;
    requestDescription: string;
    requestStatus: string;
    dueDate: string;
  }>;
  clientProfile: {
    id: string;
    fullName: string;
    email: string;
  };
  workerProfile: {
    id: string;
    fullName: string;
    email: string;
  };
}

@Component({
  selector: 'app-my-disputes',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    RouterModule
  ],
  template: `
    <div class="max-w-6xl mx-auto px-4 py-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-6">My Disputes</h1>

      @if (loading) {
        <div class="flex justify-center items-center py-12">
          <mat-icon class="animate-spin text-4xl text-indigo-600">sync</mat-icon>
        </div>
      } @else if (disputes.length === 0) {
        <div class="text-center py-12">
          <mat-icon class="text-6xl text-gray-300 mb-4">check_circle</mat-icon>
          <p class="text-gray-500 text-lg">No disputes found</p>
        </div>
      } @else {
        <div class="space-y-4">
          @for (dispute of disputes; track dispute.id) {
            <mat-card class="hover:shadow-lg transition-shadow">
              <mat-card-content>
                <div class="flex justify-between items-start mb-4">
                  <div>
                    <div class="flex items-center gap-2 mb-2">
                      <h3 class="text-lg font-semibold text-gray-900">
                        Dispute #{{ dispute.id.slice(0, 8) }}
                      </h3>
                      @if (hasPendingEvidenceRequests(dispute)) {
                        <span class="bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-1 rounded-full">
                          Evidence Required
                        </span>
                      }
                    </div>
                    <p class="text-sm text-gray-600">Job ID: {{ dispute.jobId.slice(0, 8) }}</p>
                  </div>
                  <mat-chip [color]="getStatusColor(dispute.status)" selected>
                    {{ dispute.status }}
                  </mat-chip>
                </div>

                <div class="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p class="text-xs text-gray-500 font-semibold">Client</p>
                    <p class="text-sm font-medium">{{ dispute.clientProfile.fullName }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-gray-500 font-semibold">Worker</p>
                    <p class="text-sm font-medium">{{ dispute.workerProfile.fullName }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-gray-500 font-semibold">Reason</p>
                    <p class="text-sm font-medium">{{ formatReason(dispute.disputeReasonKey) }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-gray-500 font-semibold">Filed On</p>
                    <p class="text-sm font-medium">{{ formatDate(dispute.filedAt) }}</p>
                  </div>
                </div>

                <p class="text-sm text-gray-700 mb-4">{{ dispute.disputeDescription }}</p>

                <!-- Evidence Requests Section -->
                @if (dispute.evidenceRequests && dispute.evidenceRequests.length > 0) {
                  <div class="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                    <h4 class="text-sm font-semibold text-amber-900 mb-3">
                      <mat-icon class="text-sm align-middle mr-1">warning</mat-icon>
                      Evidence Requests
                    </h4>
                    @for (request of dispute.evidenceRequests; track request.id) {
                      <div class="bg-white rounded p-4 mb-3 last:mb-0">
                        <div class="flex justify-between items-start mb-2">
                          <span class="text-sm font-medium text-gray-900">{{ request.requestType }}</span>
                          <mat-chip [color]="getRequestStatusColor(request.requestStatus)" selected class="!text-xs">
                            {{ formatRequestStatus(request.requestStatus) }}
                          </mat-chip>
                        </div>

                        <!-- Progress Bar -->
                        <div class="mb-3">
                          <div class="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>{{ getEvidenceProgress(request.requestStatus) }}%</span>
                          </div>
                          <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="h-2 rounded-full transition-all duration-500"
                                 [ngClass]="getProgressBarColor(request.requestStatus)"
                                 [style.width.%]="getEvidenceProgress(request.requestStatus)">
                            </div>
                          </div>
                          <div class="flex justify-between text-[10px] text-gray-500 mt-1">
                            <span>Awaiting Evidence</span>
                            <span>Submitted</span>
                            <span>Reviewed</span>
                          </div>
                        </div>

                        @if (request.requestDescription) {
                          <p class="text-xs text-gray-600 mb-2">{{ request.requestDescription }}</p>
                        }
                        <p class="text-xs text-gray-500 mb-3">Due: {{ formatDate(request.dueDate) }}</p>
                        @if (request.requestStatus === 'PENDING') {
                          <button (click)="openEvidenceSubmissionDialog(dispute.id)"
                                  class="w-full px-3 py-2 text-xs font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 transition-colors">
                            Submit Evidence
                          </button>
                        }
                      </div>
                    }
                  </div>
                }

                <div class="flex justify-end">
                  <button [routerLink]="['/disputes', dispute.id]"
                          class="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800">
                    View Details
                  </button>
                </div>
              </mat-card-content>
            </mat-card>
          }
        </div>
      }
    </div>
  `
})
export class MyDisputesComponent implements OnInit {
  disputes: Dispute[] = [];
  loading = true;

  private disputeService = inject(DisputeService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.loadDisputes();
  }

  loadDisputes(): void {
    this.loading = true;
    this.disputeService.getUserDisputes().subscribe({
      next: (response) => {
        this.disputes = response.disputes || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading disputes:', error);
        this.notification.error('Failed to load disputes');
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  hasPendingEvidenceRequests(dispute: Dispute): boolean {
    return dispute.evidenceRequests?.some(req => req.requestStatus === 'PENDING') || false;
  }

  openEvidenceSubmissionDialog(disputeId: string): void {
    const dialogRef = this.dialog.open(EvidenceSubmissionDialogComponent, {
      width: '500px',
      data: { disputeId }
    });

    dialogRef.componentInstance.disputeId = disputeId;

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadDisputes(); // Reload to show updated evidence requests
      }
    });
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'OPEN': 'accent',
      'AWAITING_EVIDENCE': 'warn',
      'IN_REVIEW': 'warn',
      'RESOLVED': 'primary',
      'CLOSED': 'primary'
    };
    return colors[status] || 'primary';
  }

  getRequestStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'PENDING': 'warn',
      'PROVIDED': 'primary',
      'SATISFIED': 'primary',
      'OVERDUE': 'accent'
    };
    return colors[status] || 'primary';
  }

  formatRequestStatus(status: string): string {
    const statuses: { [key: string]: string } = {
      'PENDING': 'Awaiting Evidence',
      'PROVIDED': 'Evidence Submitted',
      'SATISFIED': 'Evidence Reviewed',
      'OVERDUE': 'Overdue'
    };
    return statuses[status] || status;
  }

  getEvidenceProgress(status: string): number {
    const progress: { [key: string]: number } = {
      'PENDING': 0,
      'PROVIDED': 50,
      'SATISFIED': 100,
      'OVERDUE': 0
    };
    return progress[status] || 0;
  }

  getProgressBarColor(status: string): string {
    const colors: { [key: string]: string } = {
      'PENDING': 'bg-amber-500',
      'PROVIDED': 'bg-blue-500',
      'SATISFIED': 'bg-green-500',
      'OVERDUE': 'bg-red-500'
    };
    return colors[status] || 'bg-gray-400';
  }

  formatReason(reasonKey: string): string {
    const reasons: { [key: string]: string } = {
      'WORK_NOT_COMPLETED': 'Work Not Completed',
      'POOR_QUALITY': 'Poor Quality',
      'INCOMPLETE_DELIVERY': 'Incomplete Delivery',
      'MISSED_DEADLINE': 'Missed Deadline',
      'COMMUNICATION_BREAKDOWN': 'Communication Breakdown',
      'PAYMENT_DISPUTE': 'Payment Dispute',
      'MATERIAL_ISSUES': 'Material/Supply Issues',
      'SCOPE_CHANGE_DISPUTE': 'Scope Change Dispute',
      'SERVICE_NOT_PROVIDED': 'Service Not Provided',
      'OTHER': 'Other'
    };
    return reasons[reasonKey] || reasonKey;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
}
