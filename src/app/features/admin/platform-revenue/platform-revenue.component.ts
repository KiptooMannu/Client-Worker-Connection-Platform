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
import { PlatformRevenueService } from '../../../shared/services/platform-revenue.service';
import { LineChartComponent } from '../../../shared/components/charts';

interface RevenueSummary {
  totalRevenueEarned: number;
  availableBalance: number;
  pendingBalance: number;
  totalWithdrawn: number;
  revenueToday: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
  revenueThisYear: number;
  totalCompletedTransactions: number;
  transactionsToday: number;
  transactionsThisWeek: number;
  transactionsThisMonth: number;
  transactionsThisYear: number;
  averagePlatformFeePerTransaction: number;
}

interface LedgerEntry {
  id: string;
  transactionReference: string;
  bookingId: string;
  escrowId: string;
  totalJobAmount: number;
  platformFeePercent: number;
  platformFeeAmount: number;
  workerPayout: number;
  balanceBefore: number;
  balanceAfter: number;
  transactionType: string;
  description: string;
  timestamp: string;
}

interface Withdrawal {
  id: string;
  withdrawalReference: string;
  amount: number;
  withdrawalMethod: string;
  status: string;
  requestedBy: string;
  createdAt: string;
  processedAt?: string;
  receiptNumber?: string;
  failureReason?: string;
}

@Component({
  selector: 'app-platform-revenue',
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
          <h1 class="text-2xl font-black text-slate-900 tracking-tight">Platform Revenue</h1>
          <p class="text-slate-500 text-sm mt-1">Monitor platform earnings and manage withdrawals</p>
        </div>
        <button (click)="openWithdrawalDialog()" class="px-6 py-3 rounded-xl bg-brand-teal text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-teal/20 hover:bg-brand-teal-dark hover:scale-105 transition-transform flex items-center gap-2">
          <mat-icon class="!text-sm">account_balance_wallet</mat-icon>
          Withdraw Funds
        </button>
      </div>

      <!-- Revenue Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <mat-card class="!rounded-2xl !p-5 border border-slate-100 hover:shadow-lg transition-shadow">
          <div class="flex items-center justify-between mb-3">
            <div class="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <mat-icon class="!text-green-600">payments</mat-icon>
            </div>
            <span class="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">+{{ summary().revenueToday | currency:'KES' }}</span>
          </div>
          <p class="text-2xl font-black text-slate-900">{{ summary().totalRevenueEarned | currency:'KES' }}</p>
          <p class="text-xs text-slate-500 mt-1">Total Revenue</p>
        </mat-card>

        <mat-card class="!rounded-2xl !p-5 border border-slate-100 hover:shadow-lg transition-shadow">
          <div class="flex items-center justify-between mb-3">
            <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <mat-icon class="!text-blue-600">account_balance</mat-icon>
            </div>
            <span class="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Available</span>
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
          <p class="text-2xl font-black text-slate-900">{{ summary().pendingBalance | currency:'KES' }}</p>
          <p class="text-xs text-slate-500 mt-1">Pending Balance</p>
        </mat-card>

        <mat-card class="!rounded-2xl !p-5 border border-slate-100 hover:shadow-lg transition-shadow">
          <div class="flex items-center justify-between mb-3">
            <div class="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <mat-icon class="!text-purple-600">receipt_long</mat-icon>
            </div>
            <span class="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">{{ summary().totalCompletedTransactions }}</span>
          </div>
          <p class="text-2xl font-black text-slate-900">{{ summary().totalWithdrawn | currency:'KES' }}</p>
          <p class="text-xs text-slate-500 mt-1">Total Withdrawn</p>
        </mat-card>
      </div>

      <!-- Revenue Trends Chart -->
      <mat-card class="!rounded-2xl !p-6 border border-slate-100">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-black text-slate-900">Revenue Trends</h3>
          <div class="flex gap-2">
            <button (click)="setTimeRange('week')" [class.bg-brand-teal]="timeRange() === 'week'" [class.text-white]="timeRange() === 'week'" class="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 hover:bg-slate-50 transition-colors">Week</button>
            <button (click)="setTimeRange('month')" [class.bg-brand-teal]="timeRange() === 'month'" [class.text-white]="timeRange() === 'month'" class="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 hover:bg-slate-50 transition-colors">Month</button>
            <button (click)="setTimeRange('year')" [class.bg-brand-teal]="timeRange() === 'year'" [class.text-white]="timeRange() === 'year'" class="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 hover:bg-slate-50 transition-colors">Year</button>
          </div>
        </div>
        <app-line-chart [data]="revenueChartData()"></app-line-chart>
      </mat-card>

      <!-- Recent Transactions -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Ledger Entries -->
        <mat-card class="!rounded-2xl !p-6 border border-slate-100">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-black text-slate-900">Revenue Ledger</h3>
            <button class="text-xs font-bold text-brand-teal hover:underline">View All</button>
          </div>
          <div class="space-y-3 max-h-96 overflow-y-auto">
            @for (entry of recentLedgerEntries(); track entry.id) {
              <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <mat-icon class="!text-green-600 !text-sm">trending_up</mat-icon>
                  </div>
                  <div>
                    <p class="text-sm font-bold text-slate-900">{{ entry.description }}</p>
                    <p class="text-xs text-slate-500">{{ entry.timestamp | date:'short' }}</p>
                  </div>
                </div>
                <p class="text-sm font-black text-green-600">+{{ entry.platformFeeAmount | currency:'KES' }}</p>
              </div>
            }
          </div>
        </mat-card>

        <!-- Recent Withdrawals -->
        <mat-card class="!rounded-2xl !p-6 border border-slate-100">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-black text-slate-900">Recent Withdrawals</h3>
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

      <!-- Withdrawal Modal Overlay -->
      @if (showWithdrawModal()) {
        <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div class="flex items-center justify-between border-b border-slate-100 pb-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-brand-teal/10 flex items-center justify-center">
                  <mat-icon class="!text-brand-teal">account_balance_wallet</mat-icon>
                </div>
                <div>
                  <h3 class="text-lg font-black text-slate-900">Withdraw Platform Revenue</h3>
                  <p class="text-xs text-slate-500">Available Balance: <span class="font-bold text-brand-teal">{{ summary().availableBalance | currency:'KES' }}</span></p>
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
              <!-- Step 1: Form -->
              <div class="space-y-4">
                <div>
                  <div class="flex justify-between items-center mb-1">
                    <label class="text-xs font-bold text-slate-700">Withdrawal Amount (KES)</label>
                    <button (click)="setFullWithdrawal()" class="text-xs font-bold text-brand-teal hover:underline">Withdraw All</button>
                  </div>
                  <input type="number" [(ngModel)]="withdrawAmountVal" placeholder="e.g. 50000" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-teal text-slate-900 font-bold" />
                </div>

                <div>
                  <label class="text-xs font-bold text-slate-700 block mb-1">Withdrawal Method</label>
                  <div class="grid grid-cols-2 gap-3">
                    <button (click)="withdrawMethod.set('MPESA_B2C')" [class.border-brand-teal]="withdrawMethod() === 'MPESA_B2C'" [class.bg-brand-teal/5]="withdrawMethod() === 'MPESA_B2C'" class="p-3 rounded-xl border border-slate-200 text-left font-bold text-xs flex items-center gap-2">
                      <mat-icon [class.text-brand-teal]="withdrawMethod() === 'MPESA_B2C'">phone_iphone</mat-icon>
                      M-Pesa B2C
                    </button>
                    <button (click)="withdrawMethod.set('BANK_TRANSFER')" [class.border-brand-teal]="withdrawMethod() === 'BANK_TRANSFER'" [class.bg-brand-teal/5]="withdrawMethod() === 'BANK_TRANSFER'" class="p-3 rounded-xl border border-slate-200 text-left font-bold text-xs flex items-center gap-2">
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
                  <label class="text-xs font-bold text-slate-700 block mb-1">Notes / Remarks</label>
                  <input type="text" [(ngModel)]="withdrawNotesVal" placeholder="Reason or reference for withdrawal" class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm" />
                </div>

                <div class="flex justify-end gap-3 pt-2">
                  <button (click)="closeWithdrawalModal()" class="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                  <button (click)="goToConfirmation()" class="px-6 py-2.5 rounded-xl bg-brand-teal text-white text-xs font-bold hover:bg-brand-teal-dark">Continue to Confirm</button>
                </div>
              </div>
            } @else {
              <!-- Step 2: Confirmation -->
              <div class="space-y-4">
                <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
                  <p class="text-xs font-bold text-amber-900 uppercase tracking-wider">Withdrawal Summary Confirmation</p>
                  <div class="text-sm space-y-1 text-amber-800">
                    <p class="flex justify-between"><span>Amount:</span> <span class="font-black text-slate-900">{{ withdrawAmountVal | currency:'KES' }}</span></p>
                    <p class="flex justify-between"><span>Method:</span> <span class="font-bold">{{ withdrawMethod() === 'MPESA_B2C' ? 'M-Pesa B2C' : 'Bank Transfer' }}</span></p>
                    @if (withdrawMethod() === 'MPESA_B2C') {
                      <p class="flex justify-between"><span>Recipient Phone:</span> <span class="font-bold">{{ phoneNumberVal }}</span></p>
                    } @else {
                      <p class="flex justify-between"><span>Bank:</span> <span class="font-bold">{{ bankNameVal }} ({{ bankBranchVal }})</span></p>
                      <p class="flex justify-between"><span>Account:</span> <span class="font-bold">{{ accountNameVal }} - {{ accountNumberVal }}</span></p>
                    }
                    @if (withdrawNotesVal) {
                      <p class="flex justify-between"><span>Notes:</span> <span>{{ withdrawNotesVal }}</span></p>
                    }
                  </div>
                </div>

                <p class="text-xs text-slate-500">Please verify all details. Money will be transferred out of the platform wallet balance once initiated.</p>

                <div class="flex justify-end gap-3 pt-2">
                  <button (click)="withdrawStep.set(1)" class="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50">Back</button>
                  <button (click)="submitWithdrawal()" [disabled]="submittingWithdrawal()" class="px-6 py-2.5 rounded-xl bg-green-600 text-white text-xs font-bold hover:bg-green-700 flex items-center gap-2 disabled:opacity-50">
                    <mat-icon class="!text-sm">check_circle</mat-icon>
                    Confirm & Execute Withdrawal
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
export class PlatformRevenueComponent implements OnInit {
  private revenueService = inject(PlatformRevenueService);
  
  summary = signal<RevenueSummary>({
    totalRevenueEarned: 0,
    availableBalance: 0,
    pendingBalance: 0,
    totalWithdrawn: 0,
    revenueToday: 0,
    revenueThisWeek: 0,
    revenueThisMonth: 0,
    revenueThisYear: 0,
    totalCompletedTransactions: 0,
    transactionsToday: 0,
    transactionsThisWeek: 0,
    transactionsThisMonth: 0,
    transactionsThisYear: 0,
    averagePlatformFeePerTransaction: 0
  });

  recentLedgerEntries = signal<LedgerEntry[]>([]);
  recentWithdrawals = signal<Withdrawal[]>([]);
  timeRange = signal<'week' | 'month' | 'year'>('month');
  loading = signal(false);

  // Withdrawal modal state
  showWithdrawModal = signal(false);
  withdrawStep = signal<1 | 2>(1);
  withdrawMethod = signal<'MPESA_B2C' | 'BANK_TRANSFER'>('MPESA_B2C');
  withdrawAmountVal: number | null = null;
  phoneNumberVal: String | string = '';
  accountNameVal: string = '';
  accountNumberVal: string = '';
  bankNameVal: string = '';
  bankBranchVal: string = '';
  withdrawNotesVal: string = '';
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
    this.loadRevenueData();
  }

  loadRevenueData() {
    this.loading.set(true);
    this.revenueService.getRevenueSummary().subscribe({
      next: (data) => {
        this.summary.set(data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load revenue summary:', error);
        this.loading.set(false);
      }
    });

    this.revenueService.getLedgerEntries(0, 10).subscribe({
      next: (data) => {
        this.recentLedgerEntries.set(data);
      },
      error: (error) => {
        console.error('Failed to load ledger entries:', error);
      }
    });

    this.revenueService.getWithdrawals(0, 10).subscribe({
      next: (data) => {
        this.recentWithdrawals.set(data);
      },
      error: (error) => {
        console.error('Failed to load withdrawals:', error);
      }
    });
  }

  setTimeRange(range: 'week' | 'month' | 'year') {
    this.timeRange.set(range);
  }

  revenueChartData() {
    const labels = this.getTimeRangeLabels();
    const values = this.getTimeRangeValues();
    
    return [
      {
        name: 'Revenue',
        series: labels.map((label, i) => ({
          name: label,
          value: values[i] || 0
        }))
      }
    ];
  }

  getTimeRangeLabels() {
    const range = this.timeRange();
    if (range === 'week') {
      return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    } else if (range === 'month') {
      return Array.from({length: 30}, (_, i) => `Day ${i + 1}`);
    } else {
      return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    }
  }

  getTimeRangeValues() {
    const data = this.summary();
    const range = this.timeRange();
    
    if (range === 'week') {
      return [data.revenueThisWeek / 7, data.revenueThisWeek / 7, data.revenueThisWeek / 7, data.revenueThisWeek / 7, data.revenueThisWeek / 7, data.revenueThisWeek / 7, data.revenueThisWeek / 7];
    } else if (range === 'month') {
      return Array.from({length: 30}, () => data.revenueThisMonth / 30);
    } else {
      return Array.from({length: 12}, () => data.revenueThisYear / 12);
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
      this.withdrawError.set(`Cannot withdraw more than available balance (KES ${this.summary().availableBalance}).`);
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
    this.revenueService.initiateWithdrawal({
      amount: this.withdrawAmountVal!,
      method: this.withdrawMethod(),
      phoneNumber: String(this.phoneNumberVal),
      accountName: this.accountNameVal,
      accountNumber: this.accountNumberVal,
      bankName: this.bankNameVal,
      bankBranch: this.bankBranchVal,
      notes: this.withdrawNotesVal
    }).subscribe({
      next: (resp) => {
        this.submittingWithdrawal.set(false);
        this.closeWithdrawalModal();
        this.loadRevenueData();
      },
      error: (err) => {
        this.submittingWithdrawal.set(false);
        this.withdrawError.set(err?.error?.message || err?.error || 'Failed to initiate withdrawal.');
      }
    });
  }
}
