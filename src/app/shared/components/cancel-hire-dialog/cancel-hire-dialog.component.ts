import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-cancel-hire-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule
  ],
  template: `
    <div class="cancel-hire-dialog">
      <h2 class="text-lg font-black text-slate-900 mb-2">Cancel Hire</h2>
      <p class="text-sm text-slate-600 mb-6">Please select a reason for cancelling this hire. This action cannot be undone.</p>
      
      <div class="mb-4">
        <label class="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2">Reason for Cancellation</label>
        <select [(ngModel)]="selectedReason" class="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-brand-teal">
          <option value="">Select a reason...</option>
          <option value="Changed mind">I changed my mind</option>
          <option value="Found another worker">I found another worker</option>
          <option value="Lack funds">I lack sufficient funds</option>
          <option value="Hired accidentally">Hired accidentally</option>
          <option value="Project cancelled">Project was cancelled</option>
          <option value="Other">Other reason</option>
        </select>
      </div>
      
      @if (selectedReason() === 'Other') {
        <div class="mb-4">
          <label class="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2">Additional Details</label>
          <textarea [(ngModel)]="customReason" rows="3" placeholder="Please provide more details..." class="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-brand-teal resize-none"></textarea>
        </div>
      }
      
      <div class="flex gap-3 justify-end mt-6">
        <button (click)="dialogRef.close()" class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">
          Cancel
        </button>
        <button (click)="confirm()" [disabled]="!selectedReason()" class="px-4 py-2.5 rounded-xl bg-rose-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
          Confirm Cancellation
        </button>
      </div>
    </div>
  `,
  styles: [`
    .cancel-hire-dialog {
      padding: 24px;
      max-width: 500px;
    }
  `]
})
export class CancelHireDialogComponent {
  dialogRef = inject(MatDialogRef<CancelHireDialogComponent>);
  
  selectedReason = signal('');
  customReason = signal('');
  
  confirm() {
    const reason = this.selectedReason() === 'Other' 
      ? this.customReason() 
      : this.selectedReason();
    
    if (!reason) return;
    
    this.dialogRef.close(reason);
  }
}
