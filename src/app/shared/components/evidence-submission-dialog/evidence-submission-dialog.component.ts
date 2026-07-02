import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { DisputeService } from '../../../core/services/dispute.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-evidence-submission-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule
  ],
  template: `
    <div class="p-6">
      <h2 class="text-xl font-bold text-gray-900 mb-2">Submit Evidence</h2>
      <p class="text-sm text-gray-600 mb-4">Upload evidence files for this dispute</p>

      <div class="space-y-4">
        <!-- File Upload -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">Evidence Files</label>
          <input type="file" 
                 multiple 
                 (change)="onFileSelected($event)"
                 accept="image/*,.pdf,.doc,.docx"
                 class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <p class="text-xs text-gray-500 mt-1">Accepted: Images, PDF, Word documents</p>
        </div>

        <!-- Selected Files Preview -->
        @if (selectedFiles.length > 0) {
          <div class="space-y-2">
            <p class="text-sm font-semibold text-gray-700">Selected Files:</p>
            @for (file of selectedFiles; track file.name) {
              <div class="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                <span class="text-sm text-gray-700 truncate">{{ file.name }}</span>
                <button (click)="removeFile(file)" class="text-red-500 hover:text-red-700">
                  <mat-icon class="text-sm">close</mat-icon>
                </button>
              </div>
            }
          </div>
        }

        <!-- Description -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">Description</label>
          <textarea [(ngModel)]="description" 
                    rows="3"
                    placeholder="Describe the evidence you are submitting..."
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"></textarea>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3 mt-6">
        <button (click)="onCancel()" 
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
          Cancel
        </button>
        <button (click)="onSubmit()" 
                [disabled]="submitting || selectedFiles.length === 0"
                class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
          @if (submitting) {
            <span>Submitting...</span>
          } @else {
            <span>Submit Evidence</span>
          }
        </button>
      </div>
    </div>
  `
})
export class EvidenceSubmissionDialogComponent {
  private dialogRef = inject(MatDialogRef<EvidenceSubmissionDialogComponent>);
  private disputeService = inject(DisputeService);
  private notification = inject(NotificationService);

  disputeId: string = '';
  selectedFiles: File[] = [];
  description: string = '';
  submitting: boolean = false;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedFiles = Array.from(input.files);
    }
  }

  removeFile(file: File): void {
    this.selectedFiles = this.selectedFiles.filter(f => f !== file);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.selectedFiles.length === 0) {
      this.notification.error('Please select at least one file');
      return;
    }

    this.submitting = true;

    // Upload files and submit evidence
    const evidence = this.selectedFiles.map(file => ({
      fileName: file.name,
      fileUrl: '', // Will be set by backend after upload
      fileType: this.getFileType(file),
      fileSizeBytes: file.size,
      mimeType: file.type,
      description: this.description
    }));

    this.disputeService.addEvidence(this.disputeId, evidence).subscribe({
      next: () => {
        this.notification.success('Evidence submitted successfully');
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error('Error submitting evidence:', err);
        this.notification.error('Failed to submit evidence');
        this.submitting = false;
      }
    });
  }

  private getFileType(file: File): string {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type === 'application/pdf') return 'pdf';
    if (file.type.includes('word') || file.name.endsWith('.doc') || file.name.endsWith('.docx')) return 'document';
    return 'other';
  }
}
