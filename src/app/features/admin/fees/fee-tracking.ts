import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PaymentService, PlatformFeeRecord } from '../../../core/services/payment.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-admin-fee-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule],
  template: `
    <div class="space-y-6 animate-in fade-in duration-700">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 class="text-xl font-black text-slate-900 tracking-tight">Platform Fee Ledger</h2>
          <p class="text-sm text-slate-500 mt-1">Track captured payments, escrow status, platform fees, and worker net payouts.</p>
        </div>
        <button (click)="exportFees()"
                class="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:border-brand-teal hover:text-brand-teal transition-all flex items-center gap-2">
          <mat-icon class="!text-sm !w-auto !h-auto">download</mat-icon> Export CSV
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <p class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Collected</p>
          <p class="text-2xl font-black text-slate-900">KES {{ totalCollected() | number:'1.2-2' }}</p>
        </div>
        <div class="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <p class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Platform Fees</p>
          <p class="text-2xl font-black text-indigo-600">KES {{ totalFees() | number:'1.2-2' }}</p>
        </div>
        <div class="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <p class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Worker Net</p>
          <p class="text-2xl font-black text-emerald-600">KES {{ totalWorkerNet() | number:'1.2-2' }}</p>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div class="grid grid-cols-1 lg:grid-cols-[160px_180px_1fr_100px] gap-3">
          <input type="date" [(ngModel)]="filterDate" (ngModelChange)="loadFees()"
                 class="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-800 outline-none focus:border-brand-teal">
          <select [(ngModel)]="filterStatus" (ngModelChange)="loadFees()"
                  class="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none focus:border-brand-teal">
            @for (status of statusOptions; track status) {
              <option [value]="status">{{ status === 'All' ? 'All Payment Statuses' : status }}</option>
            }
          </select>
          <label class="relative block">
            <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 !text-[18px] text-slate-400">search</mat-icon>
            <input [(ngModel)]="searchQuery" (ngModelChange)="loadFees()"
                   placeholder="Search job, client, worker, service"
                   class="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-brand-teal">
          </label>
          <button (click)="clearFilters()"
                  class="h-10 rounded-xl border border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-brand-teal hover:border-brand-teal transition-all">
            Clear
          </button>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse min-w-[920px]">
            <thead>
              <tr class="bg-slate-900 text-white">
                <th class="px-4 py-3 text-[9px] font-black uppercase tracking-widest">Job</th>
                <th class="px-4 py-3 text-[9px] font-black uppercase tracking-widest">Client</th>
                <th class="px-4 py-3 text-[9px] font-black uppercase tracking-widest">Worker</th>
                <th class="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-right">Total</th>
                <th class="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-right">Fee</th>
                <th class="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-right">Worker Net</th>
                <th class="px-4 py-3 text-[9px] font-black uppercase tracking-widest">Payment</th>
                <th class="px-4 py-3 text-[9px] font-black uppercase tracking-widest">Date</th>
              </tr>
            </thead>
            <tbody>
              @for (row of records(); track row.jobId + row.createdAt) {
                <tr class="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                  <td class="px-4 py-3">
                    <p class="text-[10px] font-black text-slate-900">{{ row.jobId.slice(0, 8) }}...</p>
                    <p class="text-[9px] text-slate-400 truncate max-w-[160px]">{{ row.service || 'Service' }}</p>
                  </td>
                  <td class="px-4 py-3 text-xs font-bold text-slate-700">{{ row.clientName }}</td>
                  <td class="px-4 py-3 text-xs font-bold text-slate-700">{{ row.workerName }}</td>
                  <td class="px-4 py-3 text-xs font-black text-slate-900 text-right">KES {{ row.totalAmount | number:'1.2-2' }}</td>
                  <td class="px-4 py-3 text-xs font-black text-indigo-600 text-right">KES {{ row.platformFee | number:'1.2-2' }}</td>
                  <td class="px-4 py-3 text-xs font-black text-emerald-600 text-right">KES {{ row.workerNetAmount | number:'1.2-2' }}</td>
                  <td class="px-4 py-3">
                    <span class="inline-block px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest border"
                          [ngClass]="paymentStatusClass(row.paymentStatus)">
                      {{ formatPaymentStatus(row.paymentStatus) }}
                    </span>
                    <p class="text-[9px] text-slate-400 mt-1">{{ row.jobStatus }}</p>
                  </td>
                  <td class="px-4 py-3 text-[10px] font-semibold text-slate-500">
                    {{ row.transactionDate || row.createdAt || '—' }}
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8" class="px-4 py-12 text-center">
                    <mat-icon class="text-slate-200 !text-4xl !w-auto !h-auto mb-2">payments</mat-icon>
                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">No fee records match your filters</p>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class AdminFeeTrackingPage implements OnInit {
  private payment = inject(PaymentService);
  private notification = inject(NotificationService);

  records = signal<PlatformFeeRecord[]>([]);
  filterDate = '';
  filterStatus = 'All';
  searchQuery = '';
  loading = signal(false);

  readonly statusOptions = ['All', 'ESCROWED', 'SUCCESS', 'RELEASED', 'PENDING', 'REFUNDED', 'FAILED', 'PARTIALLY_SETTLED'];

  totalCollected = computed(() => this.records().reduce((sum, r) => sum + (r.totalAmount || 0), 0));
  totalFees = computed(() => this.records().reduce((sum, r) => sum + (r.platformFee || 0), 0));
  totalWorkerNet = computed(() => this.records().reduce((sum, r) => sum + (r.workerNetAmount || 0), 0));

  ngOnInit() {
    this.loadFees();
  }

  loadFees() {
    this.loading.set(true);
    this.payment.getPlatformFees({
      date: this.filterDate || undefined,
      status: this.filterStatus,
      search: this.searchQuery.trim() || undefined
    }).subscribe({
      next: (rows) => {
        this.records.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.notification.error('Could not load platform fee records.');
        this.loading.set(false);
      }
    });
  }

  clearFilters() {
    this.filterDate = '';
    this.filterStatus = 'All';
    this.searchQuery = '';
    this.loadFees();
  }

  formatPaymentStatus(status: string): string {
    if (!status) return 'Unknown';
    if (status === 'ESCROWED' || status === 'SUCCESS') return 'In Escrow';
    if (status === 'RELEASED') return 'Released';
    return status.replace(/_/g, ' ');
  }

  paymentStatusClass(status: string): string {
    const base = 'bg-slate-50 text-slate-600 border-slate-100';
    if (status === 'ESCROWED' || status === 'SUCCESS') return base + ' !bg-amber-50 !text-amber-700 !border-amber-100';
    if (status === 'RELEASED') return base + ' !bg-emerald-50 !text-emerald-700 !border-emerald-100';
    if (status === 'REFUNDED' || status === 'FAILED') return base + ' !bg-rose-50 !text-rose-600 !border-rose-100';
    return base;
  }

  exportFees() {
    const header = 'jobId,client,worker,service,total,fee,workerNet,paymentStatus,jobStatus,date';
    const rows = this.records().map(r =>
      `${r.jobId},${r.clientName},${r.workerName},${r.service},${r.totalAmount},${r.platformFee},${r.workerNetAmount},${r.paymentStatus},${r.jobStatus},${r.transactionDate || r.createdAt}`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `platform-fees-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.notification.success('Platform fee ledger exported.');
  }
}
