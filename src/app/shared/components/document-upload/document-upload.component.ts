import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-document-upload',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 transition-all hover:border-brand-teal">
      <label class="block mb-2 font-semibold text-gray-700">{{ label }}</label>
      @if (description) {
        <p class="text-sm text-gray-600 mb-3">{{ description }}</p>
      }
      <input #fileInput type="file" [multiple]="allowMultiple" [accept]="acceptedFileTypes"
             (change)="onFileSelected($event)" class="hidden" />
      <button type="button" mat-raised-button color="primary"
              (click)="fileInput.click()" class="w-full" [disabled]="isUploading">
        <mat-icon *ngIf="!isUploading">cloud_upload</mat-icon>
        <mat-spinner *ngIf="isUploading" diameter="20" class="mr-2"></mat-spinner>
        {{ isUploading ? 'Uploading...' : buttonText }}
      </button>

      <!-- Selected Files Display -->
      @if (files.length > 0) {
        <div class="mt-4">
          <p class="font-semibold mb-2 text-gray-700">Selected Files ({{ files.length }}):</p>
          <div *ngFor="let file of files; let i = index" 
               class="flex justify-between items-center p-2 bg-gray-100 rounded mb-2 transition-all hover:bg-gray-200">
            <div class="flex items-center gap-2 flex-1 min-w-0">
              <mat-icon class="text-gray-500 !text-sm">description</mat-icon>
              <span class="text-sm truncate">{{ file.name }}</span>
              <span class="text-xs text-gray-500 ml-2">{{ formatFileSize(file.size) }}</span>
            </div>
            <button type="button" mat-icon-button (click)="removeFile(i)" [disabled]="isUploading">
              <mat-icon>close</mat-icon>
            </button>
          </div>
        </div>
      }

      <!-- Validation Message -->
      @if (validationMessage) {
        <div class="mt-3 p-2 rounded text-sm" 
             [class.bg-red-50]="validationType === 'error'"
             [class.bg-green-50]="validationType === 'success'"
             [class.text-red-700]="validationType === 'error'"
             [class.text-green-700]="validationType === 'success'">
          {{ validationMessage }}
        </div>
      }
    </div>
  `
})
export class DocumentUploadComponent {
  @Input() label: string = 'Upload Documents';
  @Input() description: string = '';
  @Input() buttonText: string = 'Choose Files';
  @Input() allowMultiple: boolean = true;
  @Input() acceptedFileTypes: string = '.jpg,.jpeg,.png,.gif,.pdf,.mp4,.avi,.mov,.doc,.docx';
  @Input() maxFileSize: number = 10 * 1024 * 1024; // 10MB default
  @Input() isUploading: boolean = false;

  @Output() filesChanged = new EventEmitter<File[]>();
  @Output() fileRemoved = new EventEmitter<number>();

  files: File[] = [];
  validationMessage: string = '';
  validationType: 'error' | 'success' = 'error';

  constructor(private cdr: ChangeDetectorRef) {}

  onFileSelected(event: any): void {
    const inputFiles = event.target.files;
    if (!inputFiles) return;

    let hasError = false;
    const newFiles: File[] = [];

    for (let i = 0; i < inputFiles.length; i++) {
      const file = inputFiles[i];

      // Validate file size
      if (file.size > this.maxFileSize) {
        this.validationMessage = `File ${file.name} is too large. Maximum size is ${this.formatFileSize(this.maxFileSize)}.`;
        this.validationType = 'error';
        hasError = true;
        continue;
      }

      // Check for duplicates
      const isDuplicate = this.files.some(f => f.name === file.name && f.size === file.size);
      if (isDuplicate) {
        this.validationMessage = `File ${file.name} is already selected.`;
        this.validationType = 'error';
        hasError = true;
        continue;
      }

      newFiles.push(file);
    }

    if (newFiles.length > 0) {
      this.files = [...this.files, ...newFiles];
      this.filesChanged.emit(this.files);
      
      if (!hasError) {
        this.validationMessage = `${newFiles.length} file(s) added successfully.`;
        this.validationType = 'success';
      }
    }

    // Clear validation message after 3 seconds
    setTimeout(() => {
      this.validationMessage = '';
      this.cdr.detectChanges();
    }, 3000);

    // Reset input
    event.target.value = '';
    this.cdr.detectChanges();
  }

  removeFile(index: number): void {
    const removedFile = this.files[index];
    this.files.splice(index, 1);
    this.fileRemoved.emit(index);
    this.filesChanged.emit(this.files);
    this.validationMessage = `${removedFile.name} removed.`;
    this.validationType = 'success';
    
    setTimeout(() => {
      this.validationMessage = '';
      this.cdr.detectChanges();
    }, 2000);
  }

  clearAllFiles(): void {
    this.files = [];
    this.filesChanged.emit(this.files);
    this.cdr.detectChanges();
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}
