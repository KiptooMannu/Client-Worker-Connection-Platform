import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { DisputeService } from '../../../core/services/dispute.service';
import { PlatformStateService } from '../../../core/services/platform-state.service';
import { NotificationService } from '../../../core/services/notification.service';
import { EvidenceRequestDialogComponent } from './evidence-request-dialog.component';

interface DisputeDetail {
  id: string;
  jobId: string;
  clientProfile?: {
    id: string;
    fullName: string;
    email: string;
  };
  workerProfile?: {
    id: string;
    fullName: string;
    email: string;
  };
  clientName: string;
  workerName: string;
  reason: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  escrowAmount?: number;
  evidence: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSizeBytes: number;
    mimeType: string;
    description: string;
  }>;
  evidenceRequests: Array<{
    id: string;
    requestType: string;
    requestDescription: string;
    requestStatus: string;
    dueDate: string;
    requestedFromUser: {
      id: string;
      fullName: string;
      email: string;
    };
  }>;
  messages: Array<{
    id: string;
    senderName: string;
    message: string;
    timestamp: string;
  }>;
}

type ResolutionType = 'force_complete' | 'full_refund' | 'partial_refund' | 'request_evidence' | null;

@Component({
  selector: 'app-admin-dispute-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDialogModule,
    FormsModule
  ],
  template: `
    <div class="p-6">
      <button mat-stroked-button color="primary" (click)="goBack()">
        <mat-icon>arrow_back</mat-icon>
        Back to Disputes
      </button>

      <div class="mt-6">
        @if (loading) {
          <div class="flex justify-center items-center py-12">
            <mat-spinner></mat-spinner>
          </div>
        } @else if (dispute) {
          <div class="space-y-6">
            <!-- Header Card -->
            <mat-card>
              <mat-card-header>
                <mat-card-title>Dispute #{{ dispute.id | slice:0:8 }}</mat-card-title>
                <mat-card-subtitle>Job ID: {{ dispute.jobId }}</mat-card-subtitle>
              </mat-card-header>

              <mat-card-content>
                <div class="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p class="text-sm text-gray-500 font-semibold">Client</p>
                    <p class="text-lg font-bold">{{ dispute.clientName }}</p>
                    <div class="flex gap-2 mt-2">
                      <button mat-stroked-button class="!text-xs !py-1" (click)="messageClient()">
                        <mat-icon class="!text-sm">message</mat-icon>
                        Message
                      </button>
                      <button mat-stroked-button class="!text-xs !py-1" (click)="requestEvidenceFromClient()">
                        <mat-icon class="!text-sm">upload_file</mat-icon>
                        Request Evidence
                      </button>
                    </div>
                  </div>
                  <div>
                    <p class="text-sm text-gray-500 font-semibold">Worker</p>
                    <p class="text-lg font-bold">{{ dispute.workerName }}</p>
                    <div class="flex gap-2 mt-2">
                      <button mat-stroked-button class="!text-xs !py-1" (click)="messageWorker()">
                        <mat-icon class="!text-sm">message</mat-icon>
                        Message
                      </button>
                      <button mat-stroked-button class="!text-xs !py-1" (click)="requestEvidenceFromWorker()">
                        <mat-icon class="!text-sm">upload_file</mat-icon>
                        Request Evidence
                      </button>
                    </div>
                  </div>
                  <div>
                    <p class="text-sm text-gray-500 font-semibold">Status</p>
                    <mat-chip [color]="getStatusColor(dispute.status)" selected>
                      {{ dispute.status }}
                    </mat-chip>
                  </div>
                  <div>
                    <p class="text-sm text-gray-500 font-semibold">Priority</p>
                    <mat-chip [color]="getPriorityColor(dispute.priority)" selected>
                      {{ dispute.priority }}
                    </mat-chip>
                  </div>
                  <div>
                    <p class="text-sm text-gray-500 font-semibold">Reason</p>
                    <p class="text-sm font-medium">{{ dispute.reason }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-500 font-semibold">Filed On</p>
                    <p class="text-sm font-medium">{{ dispute.createdAt | date:'short' }}</p>
                  </div>
                </div>

                <mat-divider class="my-4"></mat-divider>

                <div>
                  <p class="text-sm text-gray-500 font-semibold mb-2">Description</p>
                  <p class="text-sm leading-relaxed">{{ dispute.description }}</p>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Evidence Requests Section -->
            @if (dispute.evidenceRequests && dispute.evidenceRequests.length > 0) {
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Evidence Requests ({{ dispute.evidenceRequests.length }})</mat-card-title>
                </mat-card-header>

                <mat-card-content>
                  <div class="space-y-3">
                    @for (request of dispute.evidenceRequests; track request.id) {
                      <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div class="flex justify-between items-start mb-2">
                          <div>
                            <p class="text-sm font-semibold text-gray-900">{{ request.requestType }}</p>
                            <p class="text-xs text-gray-600">Requested from: {{ request.requestedFromUser.fullName }}</p>
                          </div>
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
                        <p class="text-xs text-gray-500">Due: {{ request.dueDate | date:'short' }}</p>
                      </div>
                    }
                  </div>
                </mat-card-content>
              </mat-card>
            }

            <!-- Evidence Section -->
            @if (dispute.evidence && dispute.evidence.length > 0) {
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Evidence Files ({{ dispute.evidence.length }})</mat-card-title>
                </mat-card-header>

                <mat-card-content>
                  <!-- Client Evidence -->
                  @if (getEvidenceByRole('CLIENT').length > 0) {
                    <div class="mb-6">
                      <div class="flex items-center gap-2 mb-3">
                        <mat-icon class="text-blue-500">person</mat-icon>
                        <h3 class="text-sm font-bold text-gray-900">Client Evidence ({{ getEvidenceByRole('CLIENT').length }})</h3>
                      </div>
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        @for (file of getEvidenceByRole('CLIENT'); track file.id) {
                          <div class="border border-blue-200 rounded-lg p-3 hover:shadow-md transition-shadow bg-blue-50/30">
                            <!-- File Preview -->
                            <div class="mb-3 bg-gray-100 rounded p-2 min-h-32 flex items-center justify-center">
                              @switch (getFileCategory(file.mimeType)) {
                                @case ('image') {
                                  <img [src]="file.fileUrl" [alt]="file.fileName" 
                                       class="max-w-full max-h-32 object-contain rounded">
                                }
                                @case ('pdf') {
                                  <div class="text-center">
                                    <mat-icon class="text-red-500 text-4xl">picture_as_pdf</mat-icon>
                                    <p class="text-xs text-gray-600 mt-1">PDF Document</p>
                                  </div>
                                }
                                @case ('video') {
                                  <div class="text-center">
                                    <mat-icon class="text-blue-500 text-4xl">videocam</mat-icon>
                                    <p class="text-xs text-gray-600 mt-1">Video File</p>
                                  </div>
                                }
                                @default {
                                  <div class="text-center">
                                    <mat-icon class="text-gray-400 text-4xl">insert_drive_file</mat-icon>
                                    <p class="text-xs text-gray-600 mt-1">Document</p>
                                  </div>
                                }
                              }
                            </div>

                            <!-- File Info -->
                            <div class="text-xs space-y-1">
                              <p class="font-semibold truncate" [title]="file.fileName">{{ file.fileName }}</p>
                              <p class="text-gray-500">{{ getFileSizeDisplay(file.fileSizeBytes) }}</p>
                              @if (file.uploadedByName) {
                                <p class="text-blue-600 text-xs">Uploaded by: {{ file.uploadedByName }}</p>
                              }
                              @if (file.description) {
                                <p class="text-gray-600 italic">{{ file.description }}</p>
                              }
                              <button mat-stroked-button 
                                      class="mt-2 w-full !px-2 !py-1 !text-xs" 
                                      (click)="downloadFile(file)">
                                <mat-icon class="!w-4 !h-4">download</mat-icon>
                                Download
                              </button>
                            </div>
                          </div>
                        }
                      </div>
                    </div>
                  }

                  <!-- Worker Evidence -->
                  @if (getEvidenceByRole('WORKER').length > 0) {
                    <div class="mb-6">
                      <div class="flex items-center gap-2 mb-3">
                        <mat-icon class="text-green-500">engineering</mat-icon>
                        <h3 class="text-sm font-bold text-gray-900">Worker Evidence ({{ getEvidenceByRole('WORKER').length }})</h3>
                      </div>
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        @for (file of getEvidenceByRole('WORKER'); track file.id) {
                          <div class="border border-green-200 rounded-lg p-3 hover:shadow-md transition-shadow bg-green-50/30">
                            <!-- File Preview -->
                            <div class="mb-3 bg-gray-100 rounded p-2 min-h-32 flex items-center justify-center">
                              @switch (getFileCategory(file.mimeType)) {
                                @case ('image') {
                                  <img [src]="file.fileUrl" [alt]="file.fileName" 
                                       class="max-w-full max-h-32 object-contain rounded">
                                }
                                @case ('pdf') {
                                  <div class="text-center">
                                    <mat-icon class="text-red-500 text-4xl">picture_as_pdf</mat-icon>
                                    <p class="text-xs text-gray-600 mt-1">PDF Document</p>
                                  </div>
                                }
                                @case ('video') {
                                  <div class="text-center">
                                    <mat-icon class="text-blue-500 text-4xl">videocam</mat-icon>
                                    <p class="text-xs text-gray-600 mt-1">Video File</p>
                                  </div>
                                }
                                @default {
                                  <div class="text-center">
                                    <mat-icon class="text-gray-400 text-4xl">insert_drive_file</mat-icon>
                                    <p class="text-xs text-gray-600 mt-1">Document</p>
                                  </div>
                                }
                              }
                            </div>

                            <!-- File Info -->
                            <div class="text-xs space-y-1">
                              <p class="font-semibold truncate" [title]="file.fileName">{{ file.fileName }}</p>
                              <p class="text-gray-500">{{ getFileSizeDisplay(file.fileSizeBytes) }}</p>
                              @if (file.uploadedByName) {
                                <p class="text-green-600 text-xs">Uploaded by: {{ file.uploadedByName }}</p>
                              }
                              @if (file.description) {
                                <p class="text-gray-600 italic">{{ file.description }}</p>
                              }
                              <button mat-stroked-button 
                                      class="mt-2 w-full !px-2 !py-1 !text-xs" 
                                      (click)="downloadFile(file)">
                                <mat-icon class="!w-4 !h-4">download</mat-icon>
                                Download
                              </button>
                            </div>
                          </div>
                        }
                      </div>
                    </div>
                  }

                  <!-- Admin/Other Evidence -->
                  @if (getEvidenceByRole('ADMIN').length > 0 || getEvidenceByRole('OTHER').length > 0) {
                    <div>
                      <div class="flex items-center gap-2 mb-3">
                        <mat-icon class="text-purple-500">admin_panel_settings</mat-icon>
                        <h3 class="text-sm font-bold text-gray-900">Other Evidence ({{ getEvidenceByRole('ADMIN').length + getEvidenceByRole('OTHER').length }})</h3>
                      </div>
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        @for (file of [...getEvidenceByRole('ADMIN'), ...getEvidenceByRole('OTHER')]; track file.id) {
                          <div class="border border-purple-200 rounded-lg p-3 hover:shadow-md transition-shadow bg-purple-50/30">
                            <!-- File Preview -->
                            <div class="mb-3 bg-gray-100 rounded p-2 min-h-32 flex items-center justify-center">
                              @switch (getFileCategory(file.mimeType)) {
                                @case ('image') {
                                  <img [src]="file.fileUrl" [alt]="file.fileName" 
                                       class="max-w-full max-h-32 object-contain rounded">
                                }
                                @case ('pdf') {
                                  <div class="text-center">
                                    <mat-icon class="text-red-500 text-4xl">picture_as_pdf</mat-icon>
                                    <p class="text-xs text-gray-600 mt-1">PDF Document</p>
                                  </div>
                                }
                                @case ('video') {
                                  <div class="text-center">
                                    <mat-icon class="text-blue-500 text-4xl">videocam</mat-icon>
                                    <p class="text-xs text-gray-600 mt-1">Video File</p>
                                  </div>
                                }
                                @default {
                                  <div class="text-center">
                                    <mat-icon class="text-gray-400 text-4xl">insert_drive_file</mat-icon>
                                    <p class="text-xs text-gray-600 mt-1">Document</p>
                                  </div>
                                }
                              }
                            </div>

                            <!-- File Info -->
                            <div class="text-xs space-y-1">
                              <p class="font-semibold truncate" [title]="file.fileName">{{ file.fileName }}</p>
                              <p class="text-gray-500">{{ getFileSizeDisplay(file.fileSizeBytes) }}</p>
                              @if (file.uploadedByName) {
                                <p class="text-purple-600 text-xs">Uploaded by: {{ file.uploadedByName }} ({{ file.uploadedByRole }})</p>
                              }
                              @if (file.description) {
                                <p class="text-gray-600 italic">{{ file.description }}</p>
                              }
                              <button mat-stroked-button 
                                      class="mt-2 w-full !px-2 !py-1 !text-xs" 
                                      (click)="downloadFile(file)">
                                <mat-icon class="!w-4 !h-4">download</mat-icon>
                                Download
                              </button>
                            </div>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </mat-card-content>
              </mat-card>
            }

            <!-- Messages Section -->
            @if (dispute.messages && dispute.messages.length > 0) {
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Messages ({{ dispute.messages.length }})</mat-card-title>
                </mat-card-header>

                <mat-card-content>
                  <div class="space-y-3 max-h-96 overflow-y-auto">
                    @for (msg of dispute.messages; track msg.id) {
                      <div class="border-l-4 border-indigo-400 pl-3 py-2">
                        <p class="font-semibold text-sm">{{ msg.senderName }}</p>
                        <p class="text-gray-600 text-sm">{{ msg.message }}</p>
                        <p class="text-gray-400 text-xs">{{ msg.timestamp | date:'short' }}</p>
                      </div>
                    }
                  </div>
                </mat-card-content>
              </mat-card>
            }

            <!-- Actions Card -->
            <mat-card>
              <mat-card-header>
                <mat-card-title>Resolution Actions</mat-card-title>
              </mat-card-header>

              <mat-card-content>
                <div class="grid grid-cols-2 gap-3 mb-4">
                  <button mat-stroked-button color="primary" (click)="openResolutionModal('force_complete')">
                    <mat-icon>check_circle</mat-icon>
                    Force Complete
                  </button>
                  <button mat-stroked-button color="warn" (click)="openResolutionModal('full_refund')">
                    <mat-icon>undo</mat-icon>
                    Full Refund
                  </button>
                  <button mat-stroked-button color="accent" (click)="openResolutionModal('partial_refund')">
                    <mat-icon>call_split</mat-icon>
                    Partial Refund
                  </button>
                  <button mat-stroked-button (click)="openResolutionModal('request_evidence')">
                    <mat-icon>hourglass_empty</mat-icon>
                    Request Evidence
                  </button>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        }
      </div>

      <!-- Resolution Modal -->
      @if (showResolutionModal()) {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" (click)="closeResolutionModal()">
          <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
            <div class="p-6">
              <h3 class="text-xl font-bold text-gray-900 mb-2">{{ getResolutionTitle() }}</h3>
              <p class="text-sm text-gray-600 mb-6">{{ getResolutionDescription() }}</p>

              <!-- Partial refund inputs -->
              @if (activeResolutionType() === 'partial_refund' && dispute?.escrowAmount) {
                <div class="grid grid-cols-2 gap-4 p-4 rounded-xl bg-purple-50 border border-purple-200 mb-4">
                  <div>
                    <label class="text-xs font-bold uppercase tracking-wider text-purple-700 block mb-1.5">Worker Gets (KES)</label>
                    <input type="number" [(ngModel)]="workerAmount" min="0" [max]="dispute?.escrowAmount || 9999"
                      placeholder="e.g. 3000"
                      class="w-full px-3 py-2 rounded-lg border border-purple-300 bg-white text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-300"/>
                  </div>
                  <div>
                    <label class="text-xs font-bold uppercase tracking-wider text-purple-700 block mb-1.5">Client Refund (KES)</label>
                    <input type="number" [(ngModel)]="clientRefund" min="0" [max]="dispute?.escrowAmount || 9999"
                      placeholder="e.g. 2000"
                      class="w-full px-3 py-2 rounded-lg border border-purple-300 bg-white text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-300"/>
                  </div>
                  <div class="col-span-2">
                    <p class="text-xs font-bold"
                       [class]="partialAmountsValid() ? 'text-emerald-600' : 'text-rose-600'">
                      Total: KES {{ (workerAmount() + clientRefund()).toLocaleString() }}
                      / KES {{ dispute?.escrowAmount?.toLocaleString() || 0 }} required
                    </p>
                  </div>
                </div>
              }

              <!-- Reason (required) -->
              <div class="mb-4">
                <label class="text-xs font-bold uppercase tracking-wider text-gray-600 block mb-1.5">
                  Decision Reason <span class="text-rose-500">*</span>
                </label>
                <textarea [(ngModel)]="resolutionReason" rows="3"
                  placeholder="Explain the basis for this decision clearly. This will be recorded and sent to both parties…"
                  class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 resize-none"></textarea>
              </div>

              <!-- Evidence notes (optional) -->
              <div class="mb-6">
                <label class="text-xs font-bold uppercase tracking-wider text-gray-600 block mb-1.5">
                  Evidence Notes <span class="text-gray-400">(optional)</span>
                </label>
                <textarea [(ngModel)]="evidenceNotes" rows="2"
                  placeholder="Note which evidence was most relevant to your decision…"
                  class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none"></textarea>
              </div>

              <!-- Modal Footer -->
              <div class="flex items-center justify-between gap-3">
                <button (click)="closeResolutionModal()"
                  class="px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 text-xs font-bold uppercase tracking-wider hover:bg-gray-100 transition-all">
                  Cancel
                </button>
                <button (click)="confirmResolution()"
                  [disabled]="!resolutionReason().trim() || submittingResolution() || (activeResolutionType() === 'partial_refund' && !partialAmountsValid())"
                  class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 shadow-lg bg-indigo-600 hover:bg-indigo-700">
                  @if (submittingResolution()) {
                    <mat-icon class="!text-sm animate-spin">sync</mat-icon>
                    Processing…
                  } @else {
                    <mat-icon class="!text-sm">check_circle</mat-icon>
                    Confirm Resolution
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class AdminDisputeDetailComponent implements OnInit {
  dispute: DisputeDetail | null = null;
  loading = true;
  disputeId = '';
  
  // Resolution modal state
  showResolutionModal = signal(false);
  activeResolutionType = signal<ResolutionType>(null);
  workerAmount = signal(0);
  clientRefund = signal(0);
  resolutionReason = signal('');
  evidenceNotes = signal('');
  submittingResolution = signal(false);
  
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private disputeService = inject(DisputeService);
  private platformState = inject(PlatformStateService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);

  ngOnInit(): void {
    this.disputeId = this.route.snapshot.paramMap.get('id') || '';
    this.loadDisputeDetails();
  }

  loadDisputeDetails(): void {
    this.loading = true;
    this.disputeService.getDisputeDetail(this.disputeId).subscribe({
      next: (data) => {
        this.dispute = data?.dispute ?? data;
        console.log('Loaded dispute:', this.dispute);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading dispute:', error);
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/disputes']);
  }

  messageClient(): void {
    this.router.navigate(['/admin/messages'], { queryParams: { userId: this.dispute?.clientProfile?.id } });
  }

  messageWorker(): void {
    this.router.navigate(['/admin/messages'], { queryParams: { userId: this.dispute?.workerProfile?.id } });
  }

  requestEvidenceFromClient(): void {
    this.openEvidenceRequestDialog(this.dispute?.clientProfile?.id, 'client');
  }

  requestEvidenceFromWorker(): void {
    this.openEvidenceRequestDialog(this.dispute?.workerProfile?.id, 'worker');
  }

  openEvidenceRequestDialog(userId: string | undefined, userType: 'client' | 'worker'): void {
    if (!userId) {
      this.notification.error('User ID not available');
      return;
    }

    const dialogRef = this.dialog.open(EvidenceRequestDialogComponent, {
      width: '500px',
      data: { userType }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.submitEvidenceRequest(userId, result);
      }
    });
  }

  submitEvidenceRequest(userId: string, requestData: any): void {
    this.disputeService.requestEvidence(this.disputeId, {
      requestFromUserId: userId,
      requestType: requestData.requestType,
      requestDescription: requestData.description
    }).subscribe({
      next: () => {
        this.notification.success('Evidence request sent successfully');
        this.loadDisputeDetails(); // Reload to show new evidence request
      },
      error: (error) => {
        console.error('Error requesting evidence:', error);
        this.notification.error('Failed to send evidence request');
      }
    });
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

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'OPEN': 'accent',
      'IN_REVIEW': 'warn',
      'RESOLVED': 'primary',
      'APPEALED': 'warn'
    };
    return colors[status] || 'primary';
  }

  getPriorityColor(priority: string): string {
    const colors: { [key: string]: string } = {
      'LOW': 'primary',
      'MEDIUM': 'accent',
      'HIGH': 'warn'
    };
    return colors[priority] || 'primary';
  }

  getFileCategory(mimeType: string | undefined): string {
    if (!mimeType) return 'document';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.startsWith('video/')) return 'video';
    return 'document';
  }

  getFileSizeDisplay(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  downloadFile(file: any): void {
    const link = document.createElement('a');
    link.href = file.fileUrl;
    link.download = file.fileName;
    link.click();
  }

  getEvidenceByRole(role: string): any[] {
    if (!this.dispute?.evidence) return [];
    return this.dispute.evidence.filter((e: any) => e.uploadedByRole === role);
  }

  openResolutionModal(type: ResolutionType): void {
    this.activeResolutionType.set(type);
    this.workerAmount.set(0);
    this.clientRefund.set(0);
    this.resolutionReason.set('');
    this.evidenceNotes.set('');
    this.showResolutionModal.set(true);
  }

  closeResolutionModal(): void {
    this.showResolutionModal.set(false);
    this.activeResolutionType.set(null);
  }

  partialAmountsValid(): boolean {
    const total = this.dispute?.escrowAmount || 0;
    return Math.abs((this.workerAmount() + this.clientRefund()) - total) < 1;
  }

  confirmResolution(): void {
    const type = this.activeResolutionType();
    if (!type || !this.resolutionReason().trim()) return;
    if (type === 'partial_refund' && !this.partialAmountsValid()) return;

    this.submittingResolution.set(true);

    const payload: any = {
      decisionType: type,
      reason: this.resolutionReason(),
      evidenceNotes: this.evidenceNotes()
    };

    if (type === 'partial_refund') {
      payload.workerAmount = this.workerAmount();
      payload.clientRefund = this.clientRefund();
    }

    this.platformState.adminResolveDispute(this.dispute?.jobId || '', payload).subscribe({
      next: () => {
        this.notification.success('Dispute resolved successfully');
        this.closeResolutionModal();
        this.loadDisputeDetails();
      },
      error: (err) => {
        console.error('Error resolving dispute:', err);
        this.notification.error('Failed to resolve dispute');
        this.submittingResolution.set(false);
      },
      complete: () => {
        this.submittingResolution.set(false);
      }
    });
  }

  getResolutionTitle(): string {
    const type = this.activeResolutionType();
    if (!type) return '';
    
    const titles: Record<string, string> = {
      'force_complete': 'Force Complete Job',
      'full_refund': 'Issue Full Refund',
      'partial_refund': 'Partial Settlement',
      'request_evidence': 'Request More Evidence'
    };
    return titles[type] || '';
  }

  getResolutionDescription(): string {
    const type = this.activeResolutionType();
    if (!type) return '';
    
    const descriptions: Record<string, string> = {
      'force_complete': 'This will immediately release the full escrow amount to the worker and mark the job as complete. This action cannot be undone.',
      'full_refund': 'This will refund the full job payment to the client. The worker will not receive any payment. This action cannot be undone.',
      'partial_refund': 'Enter how much of the payment goes to the worker and how much is refunded to the client. Both amounts must add up to the total job cost.',
      'request_evidence': 'The dispute will remain open. Both parties will be notified that more evidence is required before a decision can be made.'
    };
    return descriptions[type] || '';
  }
}
