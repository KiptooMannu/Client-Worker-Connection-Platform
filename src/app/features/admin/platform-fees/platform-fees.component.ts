import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

export interface PlatformFeeBalance {
  totalFeesCollected: number;
  withdrawnAmount: number;
  pendingWithdrawals: number;
  processingWithdrawals: number;
  availableBalance: number;
}

export interface WithdrawalRequest {
  amount: number;
  withdrawalMethod: string;
  withdrawalDetails?: string;
  mpesaPhoneNumber?: string;
}

export interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  withdrawalMethod: string;
  requestedAt: string;
  processedAt?: string;
  failureReason?: string;
}

@Component({
  selector: 'app-platform-fees',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="max-w-7xl mx-auto space-y-6 p-4 md:p-0">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 class="text-lg md:text-xl font-black text-slate-900 tracking-tight">Platform Fee Management</h1>
          <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Withdraw and manage platform revenue</p>
        </div>
      </div>

      <!-- Balance Overview -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <mat-card class="!rounded-[16px] !border !border-slate-100 !p-6 bg-white shadow-sm">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-8 h-8 rounded-xl bg-brand-teal-soft text-brand-teal flex items-center justify-center">
              <mat-icon class="!text-sm">account_balance_wallet</mat-icon>
            </div>
            <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Collected</span>
          </div>
          <p class="text-xl font-black text-slate-900">KES {{ balance()?.totalFeesCollected.toLocaleString() || 0 }}</p>
        </mat-card>

        <mat-card class="!rounded-[16px] !border !border-slate-100 !p-6 bg-white shadow-sm">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <mat-icon class="!text-sm">check_circle</mat-icon>
            </div>
            <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Available</span>
          </div>
          <p class="text-xl font-black text-emerald-600">KES {{ balance()?.availableBalance.toLocaleString() || 0 }}</p>
        </mat-card>

        <mat-card class="!rounded-[16px] !border !border-slate-100 !p-6 bg-white shadow-sm">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <mat-icon class="!text-sm">pending</mat-icon>
            </div>
            <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pending</span>
          </div>
          <p class="text-xl font-black text-amber-600">KES {{ balance()?.pendingWithdrawals.toLocaleString() || 0 }}</p>
        </mat-card>

        <mat-card class="!rounded-[16px] !border !border-slate-100 !p-6 bg-white shadow-sm">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <mat-icon class="!text-sm">payments</mat-icon>
            </div>
            <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Withdrawn</span>
          </div>
          <p class="text-xl font-black text-blue-600">KES {{ balance()?.withdrawnAmount.toLocaleString() || 0 }}</p>
        </mat-card>
      </div>

      <!-- Withdrawal Form -->
      <mat-card class="!rounded-[24px] !border !border-slate-100 !p-6 bg-white shadow-sm">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-8 h-8 rounded-xl bg-brand-teal-soft text-brand-teal flex items-center justify-center">
            <mat-icon class="!text-sm">send</mat-icon>
          </div>
          <h3 class="text-base font-black text-slate-900 tracking-tight">Request Withdrawal</h3>
        </div>

        <form [formGroup]="withdrawalForm" (ngSubmit)="submitWithdrawal()">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Amount (KES)</label>
              <input type="number" formControlName="amount" 
                     class="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 outline-none focus:border-brand-teal"
                     placeholder="Enter amount">
              @if (withdrawalForm.get('amount')?.invalid && withdrawalForm.get('amount')?.touched) {
                <p class="text-[8px] text-red-500 mt-1">Amount is required and must be greater than 0</p>
              }
            </div>

            <div>
              <label class="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Withdrawal Method</label>
              <select formControlName="withdrawalMethod"
                      class="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 outline-none focus:border-brand-teal">
                <option value="">Select method</option>
                <option value="mpesa">M-Pesa</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>

            @if (withdrawalForm.get('withdrawalMethod')?.value === 'mpesa') {
              <div class="md:col-span-2">
                <label class="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">M-Pesa Phone Number</label>
                <input type="text" formControlName="mpesaPhoneNumber"
                       class="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 outline-none focus:border-brand-teal"
                       placeholder="2547XXXXXXXX">
              </div>
            }

            <div class="md:col-span-2">
              <label class="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Additional Details (Optional)</label>
              <textarea formControlName="withdrawalDetails"
                        class="w-full h-20 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 outline-none focus:border-brand-teal resize-none"
                        placeholder="Any additional withdrawal details"></textarea>
            </div>
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <button type="button" (click)="withdrawalForm.reset()" 
                    class="px-6 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">
              Clear
            </button>
            <button type="submit" [disabled]="withdrawalForm.invalid || loading()"
                    class="px-6 py-2.5 rounded-lg bg-brand-teal text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-brand-teal/20 hover:bg-brand-teal-dark hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed">
              @if (loading()) {
                <span>Processing...</span>
              } @else {
                <span>Request Withdrawal</span>
              }
            </button>
          </div>
        </form>
      </mat-card>

      <!-- Withdrawal History -->
      <mat-card class="!rounded-[24px] !border !border-slate-100 !shadow-sm !overflow-hidden">
        <mat-card-header class="!p-6 !border-b !border-slate-50 !bg-slate-50/50">
          <mat-card-title class="!text-[10px] !font-black !text-slate-900 !uppercase !tracking-widest !m-0">Withdrawal History</mat-card-title>
        </mat-card-header>

        @if (loadingWithdrawals()) {
          <div class="p-12 text-center">
            <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest">Loading withdrawal history...</p>
          </div>
        } @else if (withdrawals().length === 0) {
          <div class="p-12 text-center">
            <mat-icon class="text-slate-200 !text-3xl !w-auto !h-auto mb-2">history</mat-icon>
            <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest">No withdrawal history</p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-900 text-white">
                  <th class="px-5 py-2.5 text-[9px] font-black uppercase tracking-widest">Date</th>
                  <th class="px-5 py-2.5 text-[9px] font-black uppercase tracking-widest">Amount</th>
                  <th class="px-5 py-2.5 text-[9px] font-black uppercase tracking-widest">Method</th>
                  <th class="px-5 py-2.5 text-[9px] font-black uppercase tracking-widest">Status</th>
                  <th class="px-5 py-2.5 text-[9px] font-black uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (withdrawal of withdrawals(); track withdrawal.id) {
                  <tr class="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td class="px-5 py-2.5 text-[11px] font-bold text-slate-600">
                      {{ new Date(withdrawal.requestedAt).toLocaleDateString() }}
                    </td>
                    <td class="px-5 py-2.5 text-sm font-black text-slate-900">
                      KES {{ withdrawal.amount.toLocaleString() }}
                    </td>
                    <td class="px-5 py-2.5 text-[10px] font-medium text-slate-500">
                      {{ withdrawal.withdrawalMethod.replace('_', ' ').toUpperCase() }}
                    </td>
                    <td class="px-5 py-2.5">
                      <span class="inline-block px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest"
                            [ngClass]="{
                              'bg-emerald-50 text-emerald-600': withdrawal.status === 'COMPLETED',
                              'bg-amber-50 text-amber-600': withdrawal.status === 'PENDING',
                              'bg-blue-50 text-blue-600': withdrawal.status === 'PROCESSING',
                              'bg-rose-50 text-rose-600': withdrawal.status === 'FAILED'
                            }">
                        {{ withdrawal.status }}
                      </span>
                    </td>
                    <td class="px-5 py-2.5 text-right">
                      @if (withdrawal.status === 'PENDING') {
                        <button (click)="cancelWithdrawal(withdrawal.id)" 
                                class="text-[9px] font-black uppercase text-rose-600 hover:underline">
                          Cancel
                        </button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </mat-card>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class PlatformFeesComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  balance = signal<PlatformFeeBalance | null>(null);
  withdrawals = signal<Withdrawal[]>([]);
  loading = signal(false);
  loadingWithdrawals = signal(false);

  withdrawalForm: FormGroup = this.fb.group({
    amount: ['', [Validators.required, Validators.min(0.01)]],
    withdrawalMethod: ['', Validators.required],
    withdrawalDetails: [''],
    mpesaPhoneNumber: ['']
  });

  private apiUrl = 'http://localhost:8080/api/platform-fees';

  ngOnInit() {
    this.loadBalance();
    this.loadWithdrawalHistory();
  }

  loadBalance() {
    this.http.get<PlatformFeeBalance>(`${this.apiUrl}/balance`).subscribe({
      next: (data) => this.balance.set(data),
      error: (error) => console.error('Error loading balance:', error)
    });
  }

  loadWithdrawalHistory() {
    this.loadingWithdrawals.set(true);
    this.http.get<Withdrawal[]>(`${this.apiUrl}/withdrawals`).subscribe({
      next: (data) => {
        this.withdrawals.set(data);
        this.loadingWithdrawals.set(false);
      },
      error: (error) => {
        console.error('Error loading withdrawal history:', error);
        this.loadingWithdrawals.set(false);
      }
    });
  }

  submitWithdrawal() {
    if (this.withdrawalForm.invalid) return;

    this.loading.set(true);
    const request: WithdrawalRequest = this.withdrawalForm.value;

    this.http.post<Withdrawal>(`${this.apiUrl}/withdraw`, request).subscribe({
      next: (response) => {
        this.snackBar.open('Withdrawal request submitted successfully', 'Close', { duration: 3000 });
        this.withdrawalForm.reset();
        this.loadBalance();
        this.loadWithdrawalHistory();
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error submitting withdrawal:', error);
        this.snackBar.open('Failed to submit withdrawal request', 'Close', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  cancelWithdrawal(id: string) {
    this.http.post<Withdrawal>(`${this.apiUrl}/withdrawals/${id}/cancel`, {}).subscribe({
      next: (response) => {
        this.snackBar.open('Withdrawal cancelled successfully', 'Close', { duration: 3000 });
        this.loadBalance();
        this.loadWithdrawalHistory();
      },
      error: (error) => {
        console.error('Error cancelling withdrawal:', error);
        this.snackBar.open('Failed to cancel withdrawal', 'Close', { duration: 3000 });
      }
    });
  }
}
