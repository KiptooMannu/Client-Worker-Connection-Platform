import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-dispute-status-button',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatTooltipModule,
    MatDialogModule
  ],
  template: `
    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-2">
        <button *ngIf="!hasDispute && canFileDispute" 
                mat-raised-button color="warn"
                (click)="openDisputeDialog()"
                matTooltip="File a dispute for this booking">
          <mat-icon>gavel</mat-icon>
          File Dispute
        </button>

        <button *ngIf="!hasDispute && !canFileDispute && disputeBlockedReason"
                mat-stroked-button color="warn"
                disabled
                [matTooltip]="disputeBlockedReason">
          <mat-icon>block</mat-icon>
          Dispute Unavailable
        </button>

        <button *ngIf="hasDispute" 
                mat-raised-button color="accent"
                (click)="viewDisputeStatus()"
                matTooltip="View dispute details and status">
          <mat-icon>check_circle</mat-icon>
          Dispute Submitted – View Status
        </button>
      </div>

    </div>
  `
})
export class DisputeStatusButtonComponent implements OnInit {
  @Input() jobId: string = '';
  @Input() bookingStatus: string = '';
  @Input() paymentStatus: string = '';
  @Input() escrowFunded: boolean = false;
  @Input() disputedAt: string | null = null;

  hasDispute = false;
  canFileDispute = false;
  disputeBlockedReason = '';

  constructor(
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.checkDisputeStatus();
  }

  async openDisputeDialog(): Promise<void> {
    const { FileDisputeDialogComponent } = await import('../file-dispute-dialog/file-dispute-dialog.component');
    const dialogRef = this.dialog.open(FileDisputeDialogComponent, {
      width: '600px',
      data: { jobId: this.jobId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.hasDispute = true;
        this.canFileDispute = false;
      }
    });
  }

  checkDisputeStatus(): void {
    this.hasDispute = !!this.disputedAt;
    const normalizedPaymentStatus = (this.paymentStatus || '').toUpperCase().trim();
    const normalizedBookingStatus = (this.bookingStatus || '').trim();

    if (normalizedPaymentStatus === 'RELEASED') {
      this.canFileDispute = false;
      this.disputeBlockedReason = 'This payment has already been released to the worker wallet, so disputes are no longer available.';
      return;
    }

    if (!this.escrowFunded) {
      this.canFileDispute = false;
      this.disputeBlockedReason = 'This booking does not have funded escrow, so disputes are unavailable.';
      return;
    }

    if (this.hasDispute) {
      this.canFileDispute = false;
      this.disputeBlockedReason = '';
      return;
    }

    const allowedStatuses = ['Pending', 'Accepted', 'Assigned', 'In Progress', 'Submitted', 'Revision Requested', 'Approved'];
    this.canFileDispute = allowedStatuses.includes(normalizedBookingStatus);
    this.disputeBlockedReason = this.canFileDispute ? '' : 'Disputes can only be filed while the job is still active and before funds are released.';
  }

  viewDisputeStatus(): void {
    // Navigate to dispute detail page or open detail dialog
    console.log('View dispute for job:', this.jobId);
  }
}
