import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { SettlementWalletService } from '../../../shared/services/settlement-wallet.service';
import { LineChartComponent } from '../../../shared/components/charts';

interface WalletSummary {
  availableBalance: number;
  pendingCredits: number;
  totalRefunded: number;
  totalWithdrawn: number;
  totalSettlementCredits: number;
  isFrozen: boolean;
  freezeReason?: string;
  refundedToday: number;
  refundedThisWeek: number;
  refundedThisMonth: number;
  withdrawnToday: number;
  withdrawnThisWeek: number;
  withdrawnThisMonth: number;
}

interface WalletTransaction {
  id: string;
  transactionReference: string;
  bookingId?: string;
  escrowId?: string;
  transactionType: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  status: string;
  timestamp: string;
}

interface Withdrawal {
  id: string;
  withdrawalReference: string;
  amount: number;
  withdrawalMethod: string;
  status: string;
  createdAt: string;
  processedAt?: string;
  receiptNumber?: string;
  failureReason?: string;
}

@Component({
  selector: 'app-settlement-wallet',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatListModule,
    MatProgressBarModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    FormsModule,
    LineChartComponent
  ],
  template: `
    <div class="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-1000 p-4 md:p-0">
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 class="text-2xl font-black text-slate-900 tracking-tight">Settlement Wallet</h1>
          <p class="text-slate-500 text-sm mt-1">Manage your refund and settlement funds</p>
        </div>
        @if (!summary().isFrozen) {
          <button (click)="openWithdrawalDialog()" [disabled]="summary().availableBalance <= 0" class="px-6 py-3 rounded-xl bg-brand-teal text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-teal/20 hover:bg-brand-teal-dark hover:scale-105 transition-transform flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            <mat-icon class="!text-sm">account_balance_wallet</mat-icon>
            Withdraw Funds
          </button>
        }
      </div>

      <!-- Frozen Warning -->
      @if (summary().isFrozen) {
        <div class="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <mat-icon class="!text-red-600">lock</mat-icon>
          <div>
            <p class="text-sm font-bold text-red-900">Wallet Frozen</p>
            <p class="text-xs text-red-700">{{ summary().freezeReason }}</p>
          </div>
        </div>
      }

      <!-- Wallet Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <mat-card class="!rounded-2xl !p-5 border border-slate-100 hover:shadow-lg transition-shadow">
          <div class="flex items-center justify-between mb-3">
            <div class="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <mat-icon class="!text-green-600">account_balance_wallet</mat-icon>
            </div>
            <span class="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">Available</span>
          </div>
          <p class="text-2xl font-black text-slate-900">{{ summary().availableBalance | currency:'KES' }}</p>
          <p class="text-xs text-slate-500 mt-1">Available Balance</p>
        </mat-card>

        <mat-card class="!rounded-2xl !p-5 border border-slate-100 hover:shadow-lg transition-shadow">
          <div class="flex items-center justify-between mb-3">
            <div class="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
              <mat-icon class="!text-orange-600">pending</mat-icon>
            </div>
            <span class="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">Pending</span>
          </div>
          <p class="text-2xl font-black text-slate-900">{{ summary().pendingCredits | currency:'KES' }}</p>
          <p class="text-xs text-slate-500 mt-1">Pending Credits</p>
        </mat-card>

        <mat-card class="!rounded-2xl !p-5 border border-slate-100 hover:shadow-lg transition-shadow">
          <div class="flex items-center justify-between mb-3">
            <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <mat-icon class="!text-blue-600">autorenew</mat-icon>
            </div>
            <span class="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">+{{ summary().refundedToday | currency:'KES' }}</span>
          </div>
          <p class="text-2xl font-black text-slate-900">{{ summary().totalRefunded | currency:'KES' }}</p>
          <p class="text-xs text-slate-500 mt-1">Total Refunded</p>
        </mat-card>

        <mat-card class="!rounded-2xl !p-5 border border-slate-100 hover:shadow-lg transition-shadow">
          <div class="flex items-center justify-between mb-3">
            <div class="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <mat-icon class="!text-purple-600">payments</mat-icon>
            </div>
            <span class="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">{{ summary().totalWithdrawn | currency:'KES' }}</span>
          </div>
          <p class="text-2xl font-black text-slate-900">{{ summary().totalSettlementCredits | currency:'KES' }}</p>
          <p class="text-xs text-slate-500 mt-1">Total Credits</p>
        </mat-card>
      </div>

      <!-- Refund Trends Chart -->
      <mat-card class="!rounded-2xl !p-6 border border-slate-100">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-black text-slate-900">Refund Activity</h3>
          <div class="flex gap-2">
            <button (click)="setTimeRange('week')" [class.bg-brand-teal]="timeRange() === 'week'" [class.text-white]="timeRange() === 'week'" class="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 hover:bg-slate-50 transition-colors">Week</button>
            <button (click)="setTimeRange('month')" [class.bg-brand-teal]="timeRange() === 'month'" [class.text-white]="timeRange() === 'month'" class="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 hover:bg-slate-50 transition-colors">Month</button>
          </div>
        </div>
        <app-line-chart [data]="refundChartData()"></app-line-chart>
      </mat-card>

      <!-- Recent Transactions -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Transaction History -->
        <mat-card class="!rounded-2xl !p-6 border border-slate-100">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-black text-slate-900">Transaction History</h3>
            <button class="text-xs font-bold text-brand-teal hover:underline">View All</button>
          </div>
          <div class="space-y-3 max-h-96 overflow-y-auto">
            @for (transaction of recentTransactions(); track transaction.id) {
              <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center" [ngClass]="getTransactionTypeBgClass(transaction.transactionType)">
                    <mat-icon class="!text-sm" [ngClass]="getTransactionTypeIconClass(transaction.transactionType)">{{ getTransactionTypeIcon(transaction.transactionType) }}</mat-icon>
                  </div>
                  <div>
                    <p class="text-sm font-bold text-slate-900">{{ transaction.description }}</p>
                    <p class="text-xs text-slate-500">{{ transaction.timestamp | date:'short' }}</p>
                  </div>
                </div>
                <p class="text-sm font-black" [ngClass]="getTransactionAmountClass(transaction.transactionType)">
                  {{ getTransactionAmountPrefix(transaction.transactionType) }}{{ transaction.amount | currency:'KES' }}
                </p>
              </div>
            }
          </div>
        </mat-card>

        <!-- Withdrawal History -->
        <mat-card class="!rounded-2xl !p-6 border border-slate-100">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-black text-slate-900">Withdrawal History</h3>
            <button class="text-xs font-bold text-brand-teal hover:underline">View All</button>
          </div>
          <div class="space-y-3 max-h-96 overflow-y-auto">
            @for (withdrawal of recentWithdrawals(); track withdrawal.id) {
              <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center" [ngClass]="getStatusBgClass(withdrawal.status)">
                    <mat-icon class="!text-sm" [ngClass]="getStatusIconClass(withdrawal.status)">{{ getStatusIcon(withdrawal.status) }}</mat-icon>
                  </div>
                  <div>
                    <p class="text-sm font-bold text-slate-900">{{ withdrawal.withdrawalReference }}</p>
                    <p class="text-xs text-slate-500">{{ withdrawal.createdAt | date:'short' }}</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-sm font-black text-slate-900">{{ withdrawal.amount | currency:'KES' }}</p>
                  <p class="text-xs font-bold" [ngClass]="getStatusTextClass(withdrawal.status)">{{ withdrawal.status }}</p>
                </div>
              </div>
            }
          </div>
        </mat-card>
      </div>

      <!-- Withdrawal Modal -->
      @if (showWithdrawModal()) {
        <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div class="flex items-center justify-between border-b border-slate-100 pb-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-brand-teal/10 flex items-center justify-center">
                  <mat-icon class="!text-brand-teal">account_balance_wallet</mat-icon>
                </div>
                <div>
                  <h3 class="text-lg font-black text-slate-900">Withdraw Funds</h3>
                  <p class="text-xs text-slate-500">Available: <span class="font-bold text-brand-teal">{{ summary().availableBalance | currency:'KES' }}</span></p>
                </div>
              </div>
              <button (click)="closeWithdrawalModal()" class="text-slate-400 hover:text-slate-600">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            @if (withdrawError()) {
              <div class="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
                <mat-icon class="!text-sm">error</mat-icon>
                {{ withdrawError() }}
              </div>
            }

            @if (withdrawStep() === 1) {
              <div class="space-y-4">
                <div>
                  <div class="flex justify-between items-center mb-1">
                    <label class="text-xs font-bold text-slate-700">Withdrawal Amount (KES)</label>
                    <button (click)="setFullWithdrawal()" class="text-xs font-bold text-brand-teal hover:underline">Withdraw All</button>
                  </div>
                  <input type="number" [(ngModel)]="withdrawAmountVal" placeholder="e.g. 5000" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-teal text-slate-900 font-bold" />
                </div>

                <div>
                  <label class="text-xs font-bold text-slate-700 block mb-1">Withdrawal Method</label>
                  <div class="grid grid-cols-2 gap-3">
                    <button (click)="withdrawMethod.set('MPESA_B2C')" [class.border-brand-teal]="withdrawMethod() === 'MPESA_B2C'" class="p-3 rounded-xl border border-slate-200 text-left font-bold text-xs flex items-center gap-2">
                      <mat-icon [class.text-brand-teal]="withdrawMethod() === 'MPESA_B2C'">phone_iphone</mat-icon>
                      M-Pesa
                    </button>
                    <button (click)="withdrawMethod.set('BANK_TRANSFER')" [class.border-brand-teal]="withdrawMethod() === 'BANK_TRANSFER'" class="p-3 rounded-xl border border-slate-200 text-left font-bold text-xs flex items-center gap-2">
                      <mat-icon [class.text-brand-teal]="withdrawMethod() === 'BANK_TRANSFER'">account_balance</mat-icon>
                      Bank Transfer
                    </button>
                  </div>
                </div>

                @if (withdrawMethod() === 'MPESA_B2C') {
                  <div>
                    <label class="text-xs font-bold text-slate-700 block mb-1">M-Pesa Phone Number</label>
                    <input type="text" [(ngModel)]="phoneNumberVal" placeholder="e.g. 0712345678" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-teal text-slate-900 text-sm" />
                  </div>
                } @else {
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="text-xs font-bold text-slate-700 block mb-1">Bank Name</label>
                      <input type="text" [(ngModel)]="bankNameVal" placeholder="e.g. KCB Bank" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
                    </div>
                    <div>
                      <label class="text-xs font-bold text-slate-700 block mb-1">Bank Branch</label>
                      <input type="text" [(ngModel)]="bankBranchVal" placeholder="e.g. Nairobi" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
                    </div>
                    <div>
                      <label class="text-xs font-bold text-slate-700 block mb-1">Account Name</label>
                      <input type="text" [(ngModel)]="accountNameVal" placeholder="Account holder name" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
                    </div>
                    <div>
                      <label class="text-xs font-bold text-slate-700 block mb-1">Account Number</label>
                      <input type="text" [(ngModel)]="accountNumberVal" placeholder="1234567890" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
                    </div>
                  </div>
                }

                <div>
                  <label class="text-xs font-bold text-slate-700 block mb-1">Notes (optional)</label>
                  <input type="text" [(ngModel)]="withdrawNotesVal" placeholder="Reference for this withdrawal" class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm" />
                </div>

                <div class="flex justify-end gap-3 pt-2">
                  <button (click)="closeWithdrawalModal()" class="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                  <button (click)="goToConfirmation()" class="px-6 py-2.5 rounded-xl bg-brand-teal text-white text-xs font-bold hover:bg-brand-teal-dark">Continue</button>
                </div>
              </div>
            } @else {
              <div class="space-y-4">
                <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
                  <p class="text-xs font-bold text-amber-900 uppercase tracking-wider">Confirm Withdrawal</p>
                  <div class="text-sm space-y-1 text-amber-800">
                    <p class="flex justify-between"><span>Amount:</span> <span class="font-black text-slate-900">{{ withdrawAmountVal | currency:'KES' }}</span></p>
                    <p class="flex justify-between"><span>Method:</span> <span class="font-bold">{{ withdrawMethod() === 'MPESA_B2C' ? 'M-Pesa' : 'Bank Transfer' }}</span></p>
                    @if (withdrawMethod() === 'MPESA_B2C') {
                      <p class="flex justify-between"><span>Phone:</span> <span class="font-bold">{{ phoneNumberVal }}</span></p>
                    } @else {
                      <p class="flex justify-between"><span>Bank:</span> <span class="font-bold">{{ bankNameVal }} ({{ bankBranchVal }})</span></p>
                      <p class="flex justify-between"><span>Account:</span> <span class="font-bold">{{ accountNameVal }} - {{ accountNumberVal }}</span></p>
                    }
                  </div>
                </div>

                <p class="text-xs text-slate-500">Please verify these details. Funds will be sent to the destination above.</p>

                <div class="flex justify-end gap-3 pt-2">
                  <button (click)="withdrawStep.set(1)" class="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50">Back</button>
                  <button (click)="submitWithdrawal()" [disabled]="submittingWithdrawal()" class="px-6 py-2.5 rounded-xl bg-green-600 text-white text-xs font-bold hover:bg-green-700 flex items-center gap-2 disabled:opacity-50">
                    <mat-icon class="!text-sm">check_circle</mat-icon>
                    {{ submittingWithdrawal() ? 'Processing...' : 'Confirm Withdrawal' }}
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class SettlementWalletComponent implements OnInit {
  private walletService = inject(SettlementWalletService);
  
  summary = signal<WalletSummary>({
    availableBalance: 0,
    pendingCredits: 0,
    totalRefunded: 0,
    totalWithdrawn: 0,
    totalSettlementCredits: 0,
    isFrozen: false,
    refundedToday: 0,
    refundedThisWeek: 0,
    refundedThisMonth: 0,
    withdrawnToday: 0,
    withdrawnThisWeek: 0,
    withdrawnThisMonth: 0
  });

  recentTransactions = signal<WalletTransaction[]>([]);
  recentWithdrawals = signal<Withdrawal[]>([]);
  timeRange = signal<'week' | 'month'>('month');
  loading = signal(false);

  // Withdrawal modal state
  showWithdrawModal = signal(false);
  withdrawStep = signal<1 | 2>(1);
  withdrawMethod = signal<'MPESA_B2C' | 'BANK_TRANSFER'>('MPESA_B2C');
  withdrawAmountVal: number | null = null;
  phoneNumberVal = '';
  accountNameVal = '';
  accountNumberVal = '';
  bankNameVal = '';
  bankBranchVal = '';
  withdrawNotesVal = '';
  withdrawError = signal('');
  submittingWithdrawal = signal(false);

  chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: number) => 'KES ' + value.toLocaleString()
        }
      }
    }
  };

  ngOnInit() {
    this.loadWalletData();
  }

  loadWalletData() {
    this.loading.set(true);
    this.walletService.getWalletSummary().subscribe({
      next: (data) => {
        this.summary.set(data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load wallet summary:', error);
        this.loading.set(false);
      }
    });

    this.walletService.getTransactions(0, 10).subscribe({
      next: (data) => {
        this.recentTransactions.set(data);
      },
      error: (error) => {
        console.error('Failed to load transactions:', error);
      }
    });

    this.walletService.getWithdrawals(0, 10).subscribe({
      next: (data) => {
        this.recentWithdrawals.set(data);
      },
      error: (error) => {
        console.error('Failed to load withdrawals:', error);
      }
    });
  }

  setTimeRange(range: 'week' | 'month') {
    this.timeRange.set(range);
  }

  refundChartData() {
    const data = this.summary();
    const labels = this.timeRange() === 'week' 
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : Array.from({length: 30}, (_, i) => `Day ${i + 1}`);
    
    const values = this.timeRange() === 'week'
      ? [data.refundedThisWeek / 7, data.refundedThisWeek / 7, data.refundedThisWeek / 7, data.refundedThisWeek / 7, data.refundedThisWeek / 7, data.refundedThisWeek / 7, data.refundedThisWeek / 7]
      : Array.from({length: 30}, () => data.refundedThisMonth / 30);
    
    return [
      {
        name: 'Refunds',
        series: labels.map((label, i) => ({
          name: label,
          value: values[i] || 0
        }))
      }
    ];
  }

  getTransactionTypeIcon(type: string): string {
    switch (type) {
      case 'REFUND': return 'autorenew';
      case 'PARTIAL_REFUND': return 'split';
      case 'ESCROW_CANCELLATION': return 'cancel';
      case 'WORKER_REJECTION_REFUND': return 'person_off';
      case 'DISPUTE_AWARD': return 'gavel';
      case 'PARTIAL_ESCROW_RELEASE_BALANCE': return 'call_split';
      case 'ADMIN_CREDIT': return 'add_circle';
      case 'ADMIN_DEBIT': return 'remove_circle';
      case 'WITHDRAWAL': return 'payments';
      default: return 'receipt';
    }
  }

  getTransactionTypeBgClass(type: string): string {
    switch (type) {
      case 'REFUND':
      case 'PARTIAL_REFUND':
      case 'ESCROW_CANCELLATION':
      case 'WORKER_REJECTION_REFUND':
      case 'DISPUTE_AWARD':
      case 'PARTIAL_ESCROW_RELEASE_BALANCE':
      case 'ADMIN_CREDIT': return 'bg-green-100';
      case 'ADMIN_DEBIT':
      case 'WITHDRAWAL': return 'bg-red-100';
      default: return 'bg-gray-100';
    }
  }

  getTransactionTypeIconClass(type: string): string {
    switch (type) {
      case 'REFUND':
      case 'PARTIAL_REFUND':
      case 'ESCROW_CANCELLATION':
      case 'WORKER_REJECTION_REFUND':
      case 'DISPUTE_AWARD':
      case 'PARTIAL_ESCROW_RELEASE_BALANCE':
      case 'ADMIN_CREDIT': return '!text-green-600';
      case 'ADMIN_DEBIT':
      case 'WITHDRAWAL': return '!text-red-600';
      default: return '!text-gray-600';
    }
  }

  getTransactionAmountPrefix(type: string): string {
    switch (type) {
      case 'REFUND':
      case 'PARTIAL_REFUND':
      case 'ESCROW_CANCELLATION':
      case 'WORKER_REJECTION_REFUND':
      case 'DISPUTE_AWARD':
      case 'PARTIAL_ESCROW_RELEASE_BALANCE':
      case 'ADMIN_CREDIT': return '+';
      case 'ADMIN_DEBIT':
      case 'WITHDRAWAL': return '-';
      default: return '';
    }
  }

  getTransactionAmountClass(type: string): string {
    switch (type) {
      case 'REFUND':
      case 'PARTIAL_REFUND':
      case 'ESCROW_CANCELLATION':
      case 'WORKER_REJECTION_REFUND':
      case 'DISPUTE_AWARD':
      case 'PARTIAL_ESCROW_RELEASE_BALANCE':
      case 'ADMIN_CREDIT': return 'text-green-600';
      case 'ADMIN_DEBIT':
      case 'WITHDRAWAL': return 'text-red-600';
      default: return 'text-slate-900';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'SUCCESSFUL': return 'check_circle';
      case 'PENDING': return 'pending';
      case 'PROCESSING': return 'sync';
      case 'FAILED': return 'error';
      case 'CANCELLED': return 'cancel';
      default: return 'help';
    }
  }

  getStatusBgClass(status: string): string {
    switch (status) {
      case 'SUCCESSFUL': return 'bg-green-100';
      case 'PENDING': return 'bg-orange-100';
      case 'PROCESSING': return 'bg-blue-100';
      case 'FAILED': return 'bg-red-100';
      case 'CANCELLED': return 'bg-gray-100';
      default: return 'bg-gray-100';
    }
  }

  getStatusIconClass(status: string): string {
    switch (status) {
      case 'SUCCESSFUL': return '!text-green-600';
      case 'PENDING': return '!text-orange-600';
      case 'PROCESSING': return '!text-blue-600';
      case 'FAILED': return '!text-red-600';
      case 'CANCELLED': return '!text-gray-600';
      default: return '!text-gray-600';
    }
  }

  getStatusTextClass(status: string): string {
    switch (status) {
      case 'SUCCESSFUL': return 'text-green-600';
      case 'PENDING': return 'text-orange-600';
      case 'PROCESSING': return 'text-blue-600';
      case 'FAILED': return 'text-red-600';
      case 'CANCELLED': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  }

  openWithdrawalDialog() {
    this.withdrawStep.set(1);
    this.withdrawAmountVal = null;
    this.phoneNumberVal = '';
    this.accountNameVal = '';
    this.accountNumberVal = '';
    this.bankNameVal = '';
    this.bankBranchVal = '';
    this.withdrawNotesVal = '';
    this.withdrawError.set('');
    this.showWithdrawModal.set(true);
  }

  closeWithdrawalModal() {
    this.showWithdrawModal.set(false);
  }

  setFullWithdrawal() {
    this.withdrawAmountVal = this.summary().availableBalance;
  }

  goToConfirmation() {
    this.withdrawError.set('');
    if (!this.withdrawAmountVal || this.withdrawAmountVal <= 0) {
      this.withdrawError.set('Please enter a valid withdrawal amount.');
      return;
    }
    if (this.withdrawAmountVal > this.summary().availableBalance) {
      this.withdrawError.set(`Cannot withdraw more than your available balance (KES ${this.summary().availableBalance}).`);
      return;
    }
    if (this.withdrawMethod() === 'MPESA_B2C' && !this.phoneNumberVal) {
      this.withdrawError.set('Please enter an M-Pesa phone number.');
      return;
    }
    if (this.withdrawMethod() === 'BANK_TRANSFER' && (!this.bankNameVal || !this.accountNumberVal)) {
      this.withdrawError.set('Please enter bank name and account number.');
      return;
    }
    this.withdrawStep.set(2);
  }

  submitWithdrawal() {
    this.submittingWithdrawal.set(true);
    this.walletService.initiateWithdrawal({
      amount: this.withdrawAmountVal!,
      method: this.withdrawMethod(),
      phoneNumber: this.phoneNumberVal,
      accountName: this.accountNameVal,
      accountNumber: this.accountNumberVal,
      bankName: this.bankNameVal,
      bankBranch: this.bankBranchVal,
      notes: this.withdrawNotesVal
    }).subscribe({
      next: () => {
        this.submittingWithdrawal.set(false);
        this.closeWithdrawalModal();
        this.loadWalletData();
      },
      error: (err) => {
        this.submittingWithdrawal.set(false);
        this.withdrawError.set(err?.error?.message || err?.error || 'Failed to initiate withdrawal.');
      }
    });
  }
}
