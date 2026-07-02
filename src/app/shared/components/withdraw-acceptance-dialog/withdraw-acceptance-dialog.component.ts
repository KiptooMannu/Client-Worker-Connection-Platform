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
  selector: 'app-withdraw-acceptance-dialog',
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
    <div class="withdraw-acceptance-dialog">
      <h2 class="text-lg font-black text-slate-900 mb-2">Withdraw Acceptance</h2>
      <p class="text-sm text-slate-600 mb-6">Please select a reason for withdrawing your acceptance. This action cannot be undone.</p>
      
      <div class="mb-4">
        <label class="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2">Reason for Withdrawal</label>
        <select [(ngModel)]="selectedReason" class="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-brand-teal">
          <option value="">Select a reason...</option>
          <option value="Client taking too long">Client is taking too long to fund</option>
          <option value="Got another job">I got another job</option>
          <option value="No longer available">I am no longer available</option>
          <option value="Requirements changed">Project requirements changed</option>
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
        <button (click)="confirm()" [disabled]="!selectedReason()" class="px-4 py-2.5 rounded-xl bg-amber-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
          Confirm Withdrawal
        </button>
      </div>
    </div>
  `,
  styles: [`
    .withdraw-acceptance-dialog {
      padding: 24px;
      max-width: 500px;
    }
  `]
})
export class WithdrawAcceptanceDialogComponent {
  dialogRef = inject(MatDialogRef<WithdrawAcceptanceDialogComponent>);
  
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
