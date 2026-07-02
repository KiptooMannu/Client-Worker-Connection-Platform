import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';

interface DialogData {
  userType: 'client' | 'worker';
}

interface EvidenceRequestResult {
  requestType: string;
  description: string;
}

@Component({
  selector: 'app-evidence-request-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    FormsModule
  ],
  template: `
    <h2 mat-dialog-title>Request Evidence from {{ data.userType === 'client' ? 'Client' : 'Worker' }}</h2>
    <mat-dialog-content>
      <div class="flex flex-col gap-4 pt-4">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Evidence Type</mat-label>
          <mat-select [(ngModel)]="requestType" required>
            <mat-option value="screenshot">Screenshot</mat-option>
            <mat-option value="video">Video Recording</mat-option>
            <mat-option value="receipt">Receipt/Invoice</mat-option>
            <mat-option value="work_progress">Work Progress</mat-option>
            <mat-option value="communication">Communication Logs</mat-option>
            <mat-option value="other">Other</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Description</mat-label>
          <textarea matInput [(ngModel)]="description" rows="4" required
                    placeholder="Please describe what evidence you need..."></textarea>
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" (click)="onSubmit()" [disabled]="!requestType || !description">
        Send Request
      </button>
    </mat-dialog-actions>
  `
})
export class EvidenceRequestDialogComponent {
  requestType: string = '';
  description: string = '';

  constructor(
    public dialogRef: MatDialogRef<EvidenceRequestDialogComponent, EvidenceRequestResult>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  onSubmit(): void {
    if (this.requestType && this.description) {
      this.dialogRef.close({
        requestType: this.requestType,
        description: this.description
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
