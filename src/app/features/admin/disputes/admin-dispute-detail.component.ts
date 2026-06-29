import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { DisputeService } from '../../../core/services/dispute.service';

interface DisputeDetail {
  id: string;
  jobId: string;
  clientName: string;
  workerName: string;
  reason: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  evidence: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSizeBytes: number;
    mimeType: string;
    description: string;
  }>;
  messages: Array<{
    id: string;
    senderName: string;
    message: string;
    timestamp: string;
  }>;
}

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
    MatChipsModule
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
                  </div>
                  <div>
                    <p class="text-sm text-gray-500 font-semibold">Worker</p>
                    <p class="text-lg font-bold">{{ dispute.workerName }}</p>
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

            <!-- Evidence Section -->
            @if (dispute.evidence && dispute.evidence.length > 0) {
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Evidence Files ({{ dispute.evidence.length }})</mat-card-title>
                </mat-card-header>

                <mat-card-content>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    @for (file of dispute.evidence; track file.id) {
                      <div class="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
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

              <mat-card-actions>
                <button mat-flat-button color="accent" (click)="resolveDispute()">
                  <mat-icon>check_circle</mat-icon>
                  Resolve Dispute
                </button>
                <button mat-flat-button color="warn" (click)="requestEvidence()">
                  <mat-icon>hourglass_empty</mat-icon>
                  Request More Evidence
                </button>
              </mat-card-actions>
            </mat-card>
          </div>
        } @else {
          <mat-card>
            <mat-card-content class="py-8 text-center">
              <p class="text-gray-500">Dispute not found</p>
            </mat-card-content>
          </mat-card>
        }
      </div>
    </div>
  `
})
export class AdminDisputeDetailComponent implements OnInit {
  dispute: DisputeDetail | null = null;
  loading = true;
  disputeId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private disputeService: DisputeService
  ) {}

  ngOnInit(): void {
    this.disputeId = this.route.snapshot.paramMap.get('id') || '';
    this.loadDisputeDetails();
  }

  loadDisputeDetails(): void {
    this.loading = true;
    this.disputeService.getDisputeDetail(this.disputeId).subscribe({
      next: (data) => {
        this.dispute = data;
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

  getFileCategory(mimeType: string): string {
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

  resolveDispute(): void {
    console.log('Resolve dispute', this.disputeId);
  }

  requestEvidence(): void {
    console.log('Request evidence for dispute', this.disputeId);
  }
}
