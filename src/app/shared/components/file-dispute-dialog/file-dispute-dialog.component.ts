import { Component, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { lastValueFrom } from 'rxjs';
import { DisputeService } from '../../../core/services/dispute.service';
import { environment } from '../../../../environments/environment';
import { DocumentUploadComponent } from '../document-upload/document-upload.component';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-file-dispute-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DocumentUploadComponent
  ],
  template: `
    <div class="p-6">
      <h2 mat-dialog-title class="text-2xl font-bold mb-4">File a Dispute</h2>

      <div *ngIf="isBlocked" class="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        <div class="flex items-start gap-2">
          <mat-icon class="!text-base">info</mat-icon>
          <div>
            <p class="font-semibold">Dispute unavailable</p>
            <p>{{ blockedMessage }}</p>
          </div>
        </div>
      </div>
      
      <form [formGroup]="disputeForm" class="space-y-4">
        <!-- Dispute Reason -->
        <mat-form-field class="w-full">
          <mat-label>Dispute Reason</mat-label>
          <mat-select formControlName="disputeReasonKey">
            <mat-option value="WORK_NOT_COMPLETED">Work Not Completed</mat-option>
            <mat-option value="POOR_QUALITY">Poor Quality</mat-option>
            <mat-option value="INCOMPLETE_DELIVERY">Incomplete Delivery</mat-option>
            <mat-option value="MISSED_DEADLINE">Missed Deadline</mat-option>
            <mat-option value="COMMUNICATION_BREAKDOWN">Communication Breakdown</mat-option>
            <mat-option value="PAYMENT_DISPUTE">Payment Dispute</mat-option>
            <mat-option value="MATERIAL_ISSUES">Material/Supply Issues</mat-option>
            <mat-option value="SCOPE_CHANGE_DISPUTE">Scope Change Dispute</mat-option>
            <mat-option value="SERVICE_NOT_PROVIDED">Service Not Provided</mat-option>
            <mat-option value="OTHER">Other</mat-option>
          </mat-select>
        </mat-form-field>

        <!-- Dispute Description -->
        <mat-form-field class="w-full">
          <mat-label>Detailed Description</mat-label>
          <textarea matInput formControlName="disputeDescription" rows="4" 
                    placeholder="Please provide a detailed description of the issue..."></textarea>
        </mat-form-field>

        <!-- Evidence Upload -->
        <app-document-upload
          label="Upload Evidence (Optional)"
          description="Supported: Screenshots, Photos, Videos, PDFs, Contracts, Receipts"
          buttonText="Choose Files"
          [allowMultiple]="true"
          [acceptedFileTypes]="'.jpg,.jpeg,.png,.gif,.pdf,.mp4,.avi,.mov,.doc,.docx'"
          [maxFileSize]="10 * 1024 * 1024"
          [isUploading]="isSubmitting"
          (filesChanged)="onFilesChanged($event)"
          (fileRemoved)="removeFile($event)">
        </app-document-upload>

        <!-- Action Buttons -->
        <div class="flex gap-3 justify-end mt-6">
          <button type="button" mat-stroked-button (click)="onCancel()">Cancel</button>
          <button type="button" mat-raised-button color="primary" 
                  [disabled]="!disputeForm.valid || isSubmitting || isBlocked"
                  (click)="onSubmit()">
            <mat-icon *ngIf="!isSubmitting">gavel</mat-icon>
            <mat-spinner *ngIf="isSubmitting" diameter="20" class="mr-2"></mat-spinner>
            {{ isSubmitting ? 'Filing...' : 'File Dispute' }}
          </button>
        </div>
      </form>
    </div>
  `
})
export class FileDisputeDialogComponent {
  disputeForm: FormGroup;
  selectedFiles: File[] = [];
  isSubmitting = false;
  isBlocked = false;
  blockedMessage = '';
  uploadProgress: { [key: string]: number } = {};

  private readonly mediaUploadUrl = `${environment.apiUrl}/media/upload`;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private disputeService: DisputeService,
    private dialogRef: MatDialogRef<FileDisputeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { jobId: string; paymentStatus?: string; bookingStatus?: string },
    private cdr: ChangeDetectorRef,
    private notification: NotificationService
  ) {
    this.disputeForm = this.fb.group({
      disputeReasonKey: ['', Validators.required],
      disputeDescription: ['', [Validators.required, Validators.minLength(20)]]
    });

    const paymentStatus = (this.data?.paymentStatus || '').toUpperCase().trim();
    if (paymentStatus === 'RELEASED') {
      this.isBlocked = true;
      this.blockedMessage = 'This payment has already been released to the worker wallet, so a dispute cannot be filed anymore.';
    }
  }

  onFilesChanged(files: File[]): void {
    this.selectedFiles = files;
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    delete this.uploadProgress[index];
  }

  private async uploadEvidenceFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const uploadUrl = `${this.mediaUploadUrl}?folder=disputes/${encodeURIComponent(this.data.jobId)}`;

    try {
      const response: any = await lastValueFrom(this.http.post(uploadUrl, formData));
      return response?.url || response?.secure_url;
    } catch (error) {
      console.error('Evidence upload error:', error);
      throw new Error(`Failed to upload ${file.name}`);
    }
  }

  onSubmit(): void {
    if (!this.disputeForm.valid || this.isBlocked) {
      return;
    }

    this.isSubmitting = true;

    Promise.all(
      this.selectedFiles.map(file =>
        this.uploadEvidenceFile(file).then(url => ({
          fileName: file.name,
          fileUrl: url,
          fileType: this.getFileType(file),
          fileSizeBytes: file.size,
          mimeType: file.type,
          description: `Evidence uploaded by client`
        }))
      )
    ).then(evidence => {
      const request = {
        jobId: this.data.jobId,
        disputeReasonKey: this.disputeForm.value.disputeReasonKey,
        disputeDescription: this.disputeForm.value.disputeDescription,
        evidence
      };

      this.disputeService.fileDispute(request).subscribe({
        next: (response: any) => {
          this.isSubmitting = false;
          this.cdr.detectChanges();
          this.notification.success('Dispute filed successfully');
          this.dialogRef.close(response);
        },
        error: (error: any) => {
          this.isSubmitting = false;
          this.cdr.detectChanges();
          console.error('Error filing dispute:', error);
          const message = this.getUserFriendlyErrorMessage(error);
          this.notification.error(message);
        }
      });
    }).catch(error => {
      this.isSubmitting = false;
      this.cdr.detectChanges();
      console.error('File upload error:', error);
      this.notification.error('Failed to upload evidence files. Please try again.');
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private getFileType(file: File): string {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) return 'screenshot';
    if (ext === 'pdf') return 'pdf';
    if (['mp4', 'avi', 'mov'].includes(ext || '')) return 'video';
    if (['doc', 'docx'].includes(ext || '')) return 'contract';
    return 'other';
  }

  private getUserFriendlyErrorMessage(error: any): string {
    const backendMessage = error?.error?.message || error?.message || '';
    const normalized = (backendMessage || '').toLowerCase();

    if (normalized.includes('released')) {
      return 'This payment has already been released to the worker wallet, so a dispute cannot be filed anymore.';
    }

    if (normalized.includes('dispute')) {
      return 'The dispute could not be filed at this time. Please review the booking status and try again.';
    }

    return 'Failed to file dispute. Please try again.';
  }
}
