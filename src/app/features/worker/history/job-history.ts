import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { PlatformStateService } from '../../../core/services/platform-state.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  getPaymentStatusLabel,
  JOB_STATUS_OPTIONS,
  matchesPaymentStatusFilter,
  PAYMENT_STATUS_OPTIONS,
  PaymentStatusFilter
} from '../../../core/utils/payment-status.util';
import { DisputeStatusButtonComponent } from '../../../shared/components/dispute-status-button/dispute-status-button.component';

type HistoryTab = 'wallet' | 'ledger';

@Component({
  selector: 'app-worker-history',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatDialogModule, FormsModule, DisputeStatusButtonComponent],
  template: `
    @if (state.currentWorker().status === 'loading' || !state.currentWorker().id) {
      <!-- Loading State -->
      <div class="flex items-center justify-center min-h-[60vh]">
        <div class="text-center space-y-4">
          <mat-icon class="!text-6xl text-brand-teal animate-spin">sync</mat-icon>
          <p class="text-sm font-bold text-brand-teal uppercase tracking-widest">Loading Job History...</p>
        </div>
      </div>
    } @else {
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 font-manrope animate-in fade-in duration-700">

      <!-- Header -->
      <header class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 class="text-xl font-black text-brand-teal tracking-tight">Job Ledger</h1>
          <p class="text-on-surface-variant font-medium text-[11px] mt-0.5">Wallet, withdrawals, and work history in one place.</p>
        </div>
        <button (click)="exportHistory()"
                class="px-3.5 py-2 bg-white border border-outline-variant rounded-xl font-black text-[9px] uppercase tracking-widest text-brand-teal hover:border-brand-teal transition-all flex items-center gap-1.5 shadow-sm">
          <mat-icon class="!text-xs !w-auto !h-auto">download</mat-icon> Export
        </button>
      </header>

      <!-- Summary strip -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div class="bg-white p-4 rounded-xl border border-outline-variant shadow-sm flex items-center gap-3 border-l-4 border-l-brand-teal">
          <div class="w-9 h-9 bg-brand-teal-soft rounded-lg flex items-center justify-center text-brand-teal">
            <mat-icon class="!text-lg">account_balance_wallet</mat-icon>
          </div>
          <div>
            <p class="text-[8px] font-black text-on-surface-variant uppercase tracking-widest mb-0.5">Available Balance</p>
            <p class="text-lg font-black text-brand-teal leading-none">KSh {{ state.walletBalance().toFixed(2) }}</p>
          </div>
        </div>
        <div class="bg-white p-4 rounded-xl border border-outline-variant shadow-sm flex items-center gap-3 border-l-4 border-l-emerald-500">
          <div class="w-9 h-9 bg-surface-container-low rounded-lg flex items-center justify-center text-emerald-600">
            <mat-icon class="!text-lg">work_history</mat-icon>
          </div>
          <div>
            <p class="text-[8px] font-black text-on-surface-variant uppercase tracking-widest mb-0.5">Released Jobs</p>
            <p class="text-lg font-black text-brand-teal leading-none">{{ releasedJobsCount() }}</p>
          </div>
        </div>
        <div class="bg-white p-4 rounded-xl border border-outline-variant shadow-sm flex items-center gap-3 border-l-4 border-l-blue-500">
          <div class="w-9 h-9 bg-surface-container-low rounded-lg flex items-center justify-center text-blue-600">
            <mat-icon class="!text-lg">payments</mat-icon>
          </div>
          <div>
            <p class="text-[8px] font-black text-on-surface-variant uppercase tracking-widest mb-0.5">Total Released</p>
            <p class="text-lg font-black text-brand-teal leading-none">KSh {{ totalReleased().toFixed(2) }}</p>
          </div>
        </div>
      </div>

      <!-- Inline message -->
      @if (uiMessage()) {
        <div class="mb-4 px-4 py-3 rounded-xl border text-xs font-bold flex items-start gap-2"
             [ngClass]="uiMessage()!.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                        uiMessage()!.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-700' :
                        'bg-blue-50 border-blue-100 text-blue-700'">
          <mat-icon class="!text-sm !w-auto !h-auto shrink-0 mt-0.5">
            {{ uiMessage()!.type === 'success' ? 'check_circle' : uiMessage()!.type === 'error' ? 'error' : 'info' }}
          </mat-icon>
          <span>{{ uiMessage()!.text }}</span>
          <button (click)="uiMessage.set(null)" class="ml-auto text-current opacity-60 hover:opacity-100">
            <mat-icon class="!text-sm !w-auto !h-auto">close</mat-icon>
          </button>
        </div>
      }

      <!-- Tab switcher -->
      <div class="flex gap-2 mb-6 p-1 bg-surface-container-low rounded-xl border border-outline-variant w-fit">
        <button (click)="activeTab.set('ledger')"
                [ngClass]="activeTab() === 'ledger' ? 'bg-brand-teal text-white shadow-sm' : 'text-on-surface-variant hover:text-brand-teal'"
                class="px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5">
          <mat-icon class="!text-sm !w-auto !h-auto">receipt_long</mat-icon> Job Ledger
        </button>
        <button (click)="activeTab.set('wallet')"
                [ngClass]="activeTab() === 'wallet' ? 'bg-brand-teal text-white shadow-sm' : 'text-on-surface-variant hover:text-brand-teal'"
                class="px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5">
          <mat-icon class="!text-sm !w-auto !h-auto">account_balance_wallet</mat-icon> Wallet & Withdrawals
        </button>
      </div>

      <!-- Wallet tab -->
      @if (activeTab() === 'wallet') {
        <div class="bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden mb-6">
          <div class="p-5 border-b border-outline-variant bg-surface-container-low/50">
            <h2 class="text-sm font-black text-brand-teal">Withdraw to M-Pesa</h2>
            <p class="text-[10px] text-on-surface-variant font-bold mt-0.5">Released earnings after client approval.</p>
            <div class="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 pt-4 max-w-2xl">
              <input type="number" min="1" [(ngModel)]="withdrawAmount" placeholder="Amount"
                     class="h-10 rounded-lg border border-outline-variant bg-white px-3 text-sm font-bold text-brand-teal outline-none focus:border-brand-teal">
              <input type="tel" [(ngModel)]="withdrawPhone" placeholder="M-Pesa phone"
                     class="h-10 rounded-lg border border-outline-variant bg-white px-3 text-sm font-bold text-brand-teal outline-none focus:border-brand-teal">
              <button (click)="withdraw()"
                      [disabled]="withdrawing() || !withdrawAmount || !withdrawPhone || withdrawAmount <= 0 || withdrawAmount > state.walletBalance()"
                      class="h-10 px-4 rounded-lg bg-brand-teal text-white text-[10px] font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5">
                <mat-icon class="!text-sm !w-auto !h-auto">{{ withdrawing() ? 'sync' : 'payments' }}</mat-icon>
                {{ withdrawing() ? 'Sending...' : 'Withdraw' }}
              </button>
            </div>
          </div>

          <div class="px-5 py-3 border-b border-outline-variant flex items-center justify-between">
            <h3 class="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Wallet Activity</h3>
            <span class="text-[9px] font-bold text-on-surface-variant">{{ sortedWalletTransactions().length }} entries</span>
          </div>

          <div class="divide-y divide-outline-variant">
            @for (txn of pagedWalletTransactions(); track txn.id) {
              <div class="px-5 py-3 flex items-center justify-between gap-4 hover:bg-surface-container-low/50 transition-colors">
                <div class="flex items-center gap-3 min-w-0">
                  <mat-icon class="!text-[16px] !w-auto !h-auto shrink-0"
                            [ngClass]="txn.txnType === 'CREDIT' ? 'text-brand-teal' : 'text-rose-500'">
                    {{ txn.txnType === 'CREDIT' ? 'south_west' : 'north_east' }}
                  </mat-icon>
                  <div class="min-w-0">
                    <p class="text-xs font-black text-brand-teal truncate">{{ txn.description || txn.txnType }}</p>
                    <p class="text-[10px] font-bold text-on-surface-variant">{{ txn.createdAt ? (txn.createdAt | date:'medium') : 'Recent' }}</p>
                  </div>
                </div>
                <div class="text-right shrink-0">
                  <p class="text-sm font-black" [ngClass]="txn.txnType === 'CREDIT' ? 'text-brand-teal' : 'text-rose-500'">
                    {{ txn.txnType === 'CREDIT' ? '+' : '-' }} KSh {{ txn.amount.toFixed(2) }}
                  </p>
                  <p class="text-[9px] font-bold text-on-surface-variant">Bal KSh {{ txn.balanceAfter.toFixed(2) }}</p>
                </div>
              </div>
            } @empty {
              <div class="px-5 py-10 text-center">
                <mat-icon class="text-on-surface-variant/30 !text-3xl !w-auto !h-auto mb-2">account_balance_wallet</mat-icon>
                <p class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">No wallet activity yet</p>
                <p class="text-[10px] text-on-surface-variant/70 mt-1">Funds appear here after a client approves your work.</p>
              </div>
            }
          </div>

          @if (sortedWalletTransactions().length > walletPageSize) {
            <div class="p-3 border-t border-outline-variant bg-surface-container-low/30 flex items-center justify-between">
              <span class="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">
                Showing {{ walletPageStart() + 1 }}-{{ walletPageEnd() }} of {{ sortedWalletTransactions().length }}
              </span>
              <div class="flex gap-1.5">
                <button (click)="prevWalletPage()" [disabled]="walletPage() === 1"
                        class="w-7 h-7 flex items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant disabled:opacity-30 hover:text-brand-teal transition-all bg-white">
                  <mat-icon class="!text-base">chevron_left</mat-icon>
                </button>
                @for (p of walletPageNumbers(); track p) {
                  <button (click)="goToWalletPage(p)"
                          [ngClass]="p === walletPage() ? 'bg-brand-teal text-white border-brand-teal' : 'bg-white text-on-surface-variant border-outline-variant hover:text-brand-teal'"
                          class="w-7 h-7 flex items-center justify-center rounded-lg border text-[10px] font-black transition-all">
                    {{ p }}
                  </button>
                }
                <button (click)="nextWalletPage()" [disabled]="walletPage() >= walletTotalPages()"
                        class="w-7 h-7 flex items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant disabled:opacity-30 hover:text-brand-teal transition-all bg-white">
                  <mat-icon class="!text-base">chevron_right</mat-icon>
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Ledger tab -->
      @if (activeTab() === 'ledger') {
        <div class="bg-white rounded-2xl border border-outline-variant shadow-sm p-4 mb-4">
          <div class="grid grid-cols-1 lg:grid-cols-[1fr_180px_180px_100px] gap-3">
            <label class="relative block">
              <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 !text-[18px] text-on-surface-variant">search</mat-icon>
              <input [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event); currentPage.set(1)"
                     placeholder="Search client, service, status, payment, amount"
                     class="w-full h-10 rounded-xl border border-outline-variant bg-surface-container-low pl-10 pr-4 text-sm font-bold text-brand-teal outline-none focus:bg-white focus:border-brand-teal">
            </label>
            <select [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event); currentPage.set(1)"
                    class="h-10 rounded-xl border border-outline-variant bg-surface-container-low px-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant outline-none focus:bg-white focus:border-brand-teal">
              @for (status of jobStatusOptions; track status) {
                <option [value]="status">{{ status === 'All' ? 'All Job Statuses' : status }}</option>
              }
            </select>
            <select [ngModel]="paymentStatusFilter()" (ngModelChange)="paymentStatusFilter.set($event); currentPage.set(1)"
                    class="h-10 rounded-xl border border-outline-variant bg-surface-container-low px-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant outline-none focus:bg-white focus:border-brand-teal">
              @for (status of paymentStatusOptions; track status) {
                <option [value]="status">{{ status === 'All' ? 'All Payments' : status }}</option>
              }
            </select>
            <button (click)="clearFilters()"
                    class="h-10 rounded-xl border border-outline-variant bg-white text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:text-brand-teal hover:border-brand-teal transition-all">
              Clear
            </button>
          </div>
        </div>

        @if (filteredJobs().length > 0) {
          <div class="bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
            <div class="divide-y divide-outline-variant">
              @for (job of pagedJobs(); track job.id) {
                <div class="px-5 py-3 hover:bg-surface-container-low/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div class="flex items-center gap-3 min-w-[200px]">
                    <div class="h-9 w-9 rounded-lg bg-surface-container flex items-center justify-center text-brand-teal font-black text-[10px] border border-outline-variant shrink-0">
                      {{ job.initials }}
                    </div>
                    <div class="min-w-0">
                      <h3 class="text-xs font-black text-brand-teal leading-tight truncate">{{ job.client }}</h3>
                      <p class="text-[9px] text-on-surface-variant font-black uppercase tracking-wider truncate">{{ job.service }}</p>
                    </div>
                  </div>

                  <div class="flex flex-wrap items-center gap-4 sm:gap-6">
                    <div class="text-[10px] font-semibold text-on-surface-variant flex items-center gap-1">
                      <mat-icon class="!text-[10px] !w-auto !h-auto">calendar_today</mat-icon>
                      {{ job.date | date:'mediumDate' }}
                    </div>

                    <div class="flex items-center gap-1">
                      @if (job.rating) {
                        @for (s of [1,2,3,4,5]; track s) {
                          <mat-icon class="!text-[12px] !w-auto !h-auto text-brand-teal" [class.material-fill]="s <= job.rating">star</mat-icon>
                        }
                      } @else {
                        <span class="text-[9px] font-bold text-on-surface-variant/50 italic">No rating</span>
                      }
                    </div>

                    <div class="flex flex-col items-end min-w-[120px]">
                      <span class="text-xs font-black text-brand-teal">KSh {{ job.earnings.toFixed(2) }}</span>
                      <span class="text-[8px] font-black uppercase bg-surface-container-low border border-outline-variant text-on-surface-variant px-1.5 py-0.5 rounded-md mt-0.5">
                        {{ getPaymentStatusLabel(job.status) }}
                      </span>
                      @if (getEscrowLabel(job)) {
                        <span class="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md mt-1 border"
                              [ngClass]="getEscrowClass(job)">
                          {{ getEscrowLabel(job) }}
                        </span>
                      }
                    </div>

                    <span class="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border"
                          [ngClass]="job.statusBg + ' ' + job.statusColor">
                      {{ job.status }}
                    </span>

                    @if (state.updatingJobIds().has(job.id)) {
                      <mat-icon class="animate-spin text-brand-teal !w-4 !h-4">sync</mat-icon>
                    } @else {
                      @if (job.status === 'Pending') {
                        <div class="flex gap-2">
                          <button (click)="state.updateJobStatus(job.id, 'ACCEPTED')"
                                  class="px-3.5 py-2 bg-brand-teal text-white font-black text-[9px] uppercase tracking-widest rounded-lg hover:opacity-90 transition-all shadow-sm active:scale-95">
                            Accept
                          </button>
                          <button (click)="state.updateJobStatus(job.id, 'REJECTED')"
                                  class="px-3.5 py-2 border border-outline-variant text-on-surface-variant font-black text-[9px] uppercase tracking-widest rounded-lg hover:bg-error/10 hover:text-error hover:border-error/20 transition-all active:scale-95">
                            Cancel
                          </button>
                        </div>
                      }
                      @if (job.status === 'Accepted' || job.status === 'ACCEPTED' || job.status === 'Awaiting Funding' || job.status === 'AWAITING_FUNDING' || job.status === 'Revision Requested' || job.status === 'In Progress') {
                        @if (job.escrowFunded) {
                          <button (click)="state.updateJobStatus(job.id, 'SUBMITTED')"
                                  class="px-3 py-1.5 bg-brand-teal text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-1">
                            <mat-icon class="!text-sm !w-auto !h-auto">send</mat-icon> Deliver
                          </button>
                        } @else {
                          <div class="flex flex-col gap-2">
                            <div class="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200">
                              <mat-icon class="!text-sm !w-auto !h-auto text-slate-400">hourglass_empty</mat-icon>
                              <span class="text-[9px] font-black text-slate-500 uppercase tracking-widest">Waiting for Payment</span>
                            </div>
                            <div class="flex items-center gap-2">
                              <button (click)="openWithdrawAcceptanceDialog(job)"
                                      class="px-2.5 py-1.5 border border-amber-200 text-amber-600 rounded-lg text-[9px]
                                             font-black uppercase tracking-widest hover:bg-amber-50 transition-all bg-white active:scale-95">
                                Withdraw
                              </button>
                              <span class="text-[8px] text-slate-400 font-medium">
                                {{ getTimeRemaining(job) }}
                              </span>
                            </div>
                          </div>
                        }
                      }

                      <!-- DISPUTE button (shows horizontally with other actions) -->
                      @if ((job.status === 'Submitted' || job.status === 'In Progress' || job.status === 'Revision Requested' || (job.status === 'Completed' && job.hasReview) || (job.status === 'Approved' && job.escrowFunded)) && (job.escrowFunded || false)) {
                        <app-dispute-status-button 
                          [jobId]="job.id"
                          [bookingStatus]="job.status"
                          [paymentStatus]="job.paymentStatus || ''"
                          [escrowFunded]="job.escrowFunded || false"
                          [disputedAt]="job.disputedAt || null">
                        </app-dispute-status-button>
                      }
                    }
                  </div>
                </div>
              }
            </div>

            @if (filteredJobs().length > pageSize) {
              <div class="p-3 border-t border-outline-variant bg-surface-container-low/30 flex items-center justify-between">
                <span class="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">
                  Showing {{ pageStart() + 1 }}-{{ pageEnd() }} of {{ filteredJobs().length }}
                </span>
                <div class="flex gap-1.5">
                  <button (click)="prevPage()" [disabled]="currentPage() === 1"
                          class="w-7 h-7 flex items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant disabled:opacity-30 hover:text-brand-teal transition-all bg-white">
                    <mat-icon class="!text-base">chevron_left</mat-icon>
                  </button>
                  @for (p of pageNumbers(); track p) {
                    <button (click)="goToPage(p)"
                            [ngClass]="p === currentPage() ? 'bg-brand-teal text-white border-brand-teal' : 'bg-white text-on-surface-variant border-outline-variant hover:text-brand-teal'"
                            class="w-7 h-7 flex items-center justify-center rounded-lg border text-[10px] font-black transition-all">
                      {{ p }}
                    </button>
                  }
                  <button (click)="nextPage()" [disabled]="currentPage() >= totalPages()"
                          class="w-7 h-7 flex items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant disabled:opacity-30 hover:text-brand-teal transition-all bg-white">
                    <mat-icon class="!text-base">chevron_right</mat-icon>
                  </button>
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="bg-white rounded-2xl border border-dashed border-outline-variant p-12 text-center">
            <mat-icon class="text-on-surface-variant/30 !text-4xl !w-auto !h-auto mb-3">history_edu</mat-icon>
            <p class="text-sm font-black text-brand-teal mb-1">No matching records</p>
            <p class="text-[11px] text-on-surface-variant">Try clearing filters or check back after accepting a job offer.</p>
            @if (searchQuery() || statusFilter() !== 'All' || paymentStatusFilter() !== 'All') {
              <button (click)="clearFilters()" class="mt-4 text-[10px] font-black uppercase tracking-widest text-brand-teal hover:underline">
                Clear all filters
              </button>
            }
          </div>
        }
      }
    </div>

    <!-- Counter-Offer Modal -->
    @if (counterOfferJob()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
          <div class="p-6 border-b border-slate-100">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-black text-slate-900">💰 Counter-Offer</h3>
              <button (click)="closeCounterOfferModal()" class="text-slate-400 hover:text-slate-600">
                <mat-icon class="!text-xl !w-auto !h-auto">close</mat-icon>
              </button>
            </div>
            <p class="text-sm text-slate-500 mt-2">
              Original offer: KES {{ counterOfferJob()?.earnings?.toLocaleString() }}
            </p>
          </div>
          <div class="p-6">
            <label class="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-2">
              Your Counter-Offer Price
            </label>
            <input 
              type="number" 
              [(ngModel)]="counterOfferPrice"
              placeholder="Enter your price"
              class="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-900 outline-none focus:border-brand-teal focus:bg-white transition-all"
            >
            <p class="text-[10px] text-slate-400 mt-2">
              Enter the price you'd like to negotiate for this job.
            </p>
          </div>
          <div class="p-6 border-t border-slate-100 flex gap-3">
            <button 
              (click)="closeCounterOfferModal()"
              class="flex-1 py-3 border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button 
              (click)="submitCounterOffer()"
              [disabled]="counterOfferLoading() || !counterOfferPrice() || (counterOfferPrice() ?? 0) <= 0"
              class="flex-1 py-3 bg-brand-teal text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <mat-icon class="!text-sm !w-auto !h-auto" [class.animate-spin]="counterOfferLoading()">
                {{ counterOfferLoading() ? 'sync' : 'send' }}
              </mat-icon>
              {{ counterOfferLoading() ? 'Submitting...' : 'Submit Offer' }}
            </button>
          </div>
        </div>
      </div>
    }
    }
  `,
  styles: [`
    :host { display: block; background: #f8fafc; min-height: 100vh; }
    mat-icon {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      vertical-align: middle !important;
      flex-shrink: 0 !important;
    }
    .material-fill { font-variation-settings: 'FILL' 1; }
  `]
})
export class WorkerHistoryPage {
  state = inject(PlatformStateService);
  private notification = inject(NotificationService);
  private http = inject(HttpClient);
  private dialog = inject(MatDialog);

  activeTab = signal<HistoryTab>('ledger');
  searchQuery = signal('');
  statusFilter = signal('All');
  paymentStatusFilter = signal<PaymentStatusFilter>('All');
  currentPage = signal(1);
  walletPage = signal(1);
  withdrawing = signal(false);
  withdrawAmount: number | null = null;
  withdrawPhone = '';
  uiMessage = signal<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Counter-offer modal
  counterOfferJob = signal<any>(null);
  counterOfferPrice = signal<number | null>(null);
  counterOfferLoading = signal(false);

  readonly walletPageSize = 10;
  readonly pageSize = 10;
  readonly jobStatusOptions = JOB_STATUS_OPTIONS;
  readonly paymentStatusOptions = PAYMENT_STATUS_OPTIONS;
  readonly getPaymentStatusLabel = getPaymentStatusLabel;

  constructor() {
    this.state.fetchWalletSummary();
    this.withdrawPhone = this.state.currentWorker().phoneNumber || '';
  }

  releasedJobsCount = computed(() =>
    this.state.bookings().filter(j => j.status === 'Approved' || j.status === 'Completed').length
  );

  totalReleased = computed(() =>
    this.state.walletTransactions()
      .filter(txn => txn.txnType === 'CREDIT')
      .reduce((sum, txn) => sum + (txn.amount || 0), 0)
  );

  sortedWalletTransactions = computed(() =>
    [...this.state.walletTransactions()].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    })
  );

  walletTotalPages = computed(() => Math.max(1, Math.ceil(this.sortedWalletTransactions().length / this.walletPageSize)));
  pagedWalletTransactions = computed(() => {
    const start = (this.walletPage() - 1) * this.walletPageSize;
    return this.sortedWalletTransactions().slice(start, start + this.walletPageSize);
  });
  walletPageStart = computed(() => (this.walletPage() - 1) * this.walletPageSize);
  walletPageEnd = computed(() => Math.min(this.walletPageStart() + this.walletPageSize, this.sortedWalletTransactions().length));
  walletPageNumbers = computed(() => {
    const total = this.walletTotalPages();
    const start = Math.max(0, this.walletPage() - 2);
    return Array.from({ length: Math.min(5, total) }, (_, i) => start + i + 1).filter(p => p <= total);
  });

  filteredJobs = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();
    const paymentStatus = this.paymentStatusFilter();

    return [...this.state.bookings()]
      .sort((a, b) => (b.rawDate || 0) - (a.rawDate || 0))
      .filter(b => status === 'All' || b.status === status)
      .filter(b => matchesPaymentStatusFilter(b.status, paymentStatus))
      .filter(b => {
        if (!query) return true;
        const haystack = [
          b.clientName,
          b.service,
          b.status,
          b.date,
          b.earnings,
          getPaymentStatusLabel(b.status)
        ].join(' ').toLowerCase();
        return haystack.includes(query);
      })
      .map(b => ({
        ...b,
        client: b.clientName,
        initials: b.clientInitials,
        statusBg: this.statusBg(b.status),
        statusColor: this.statusColor(b.status)
      }));
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredJobs().length / this.pageSize)));
  pageNumbers = computed(() => {
    const total = this.totalPages();
    const start = Math.max(0, this.currentPage() - 2);
    return Array.from({ length: Math.min(5, total) }, (_, i) => start + i + 1).filter(p => p <= total);
  });
  pagedJobs = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredJobs().slice(start, start + this.pageSize);
  });
  pageStart = computed(() => (this.currentPage() - 1) * this.pageSize);
  pageEnd = computed(() => Math.min(this.pageStart() + this.pageSize, this.filteredJobs().length));

  private statusBg(status: string): string {
    if (status === 'Approved' || status === 'Completed') return 'bg-teal-50';
    if (status === 'Submitted') return 'bg-teal-50';
    if (status === 'Revision Requested') return 'bg-amber-50';
    if (status === 'Cancelled') return 'bg-rose-50';
    if (status === 'Disputed') return 'bg-rose-100';
    return 'bg-brand-teal-soft';
  }

  private statusColor(status: string): string {
    if (status === 'Approved' || status === 'Completed') return 'text-teal-700';
    if (status === 'Submitted') return 'text-teal-700';
    if (status === 'Revision Requested') return 'text-amber-700';
    if (status === 'Cancelled') return 'text-rose-500';
    if (status === 'Disputed') return 'text-rose-700';
    return 'text-brand-teal';
  }

  clearFilters() {
    this.searchQuery.set('');
    this.statusFilter.set('All');
    this.paymentStatusFilter.set('All');
    this.currentPage.set(1);
    this.showMessage('Filters cleared.', 'info');
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
  }

  prevPage() { this.goToPage(this.currentPage() - 1); }
  nextPage() { this.goToPage(this.currentPage() + 1); }

  goToWalletPage(page: number) {
    if (page < 1 || page > this.walletTotalPages()) return;
    this.walletPage.set(page);
  }

  prevWalletPage() { this.goToWalletPage(this.walletPage() - 1); }
  nextWalletPage() { this.goToWalletPage(this.walletPage() + 1); }

  withdraw() {
    if (!this.withdrawAmount || !this.withdrawPhone) return;
    this.withdrawing.set(true);
    this.state.withdrawWallet(this.withdrawAmount, this.withdrawPhone).subscribe({
      next: () => {
        this.showMessage(`KSh ${this.withdrawAmount!.toFixed(2)} withdrawal sent to ${this.withdrawPhone}.`, 'success');
        this.notification.success('Withdrawal request sent to M-Pesa.');
        this.withdrawAmount = null;
        this.withdrawing.set(false);
      },
      error: (err) => {
        const message = err.error?.message || err.error || 'Withdrawal failed. Check your balance and phone number.';
        this.showMessage(message, 'error');
        this.notification.error(message);
        this.withdrawing.set(false);
      }
    });
  }

  // ── Withdraw Acceptance ───────────────────────────────────────────────────

  async openWithdrawAcceptanceDialog(job: any) {
    const { WithdrawAcceptanceDialogComponent } = await import('../../../shared/components/withdraw-acceptance-dialog/withdraw-acceptance-dialog.component');
    const dialogRef = this.dialog.open(WithdrawAcceptanceDialogComponent, {
      width: '500px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(reason => {
      if (reason) {
        this.state.withdrawAcceptance(job.id, reason).subscribe({
          next: () => {
            this.notification.success('Acceptance withdrawn successfully');
          },
          error: (err) => {
            console.error('Error withdrawing acceptance', err);
            this.notification.error('Failed to withdraw acceptance');
          }
        });
      }
    });
  }

  getTimeRemaining(job: any): string {
    if (!job.date) return '';
    
    const acceptedDate = new Date(job.date);
    const now = new Date();
    const expiryHours = 48; // Configurable expiry period
    const expiryDate = new Date(acceptedDate.getTime() + expiryHours * 60 * 60 * 1000);
    
    const diffMs = expiryDate.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffMs <= 0) return 'Expired';
    if (diffHours > 24) return `${diffHours} hours`;
    if (diffHours > 0) return `${diffHours}h ${diffMins}m`;
    return `${diffMins} minutes`;
  }

  exportHistory() {
    const header = 'client,service,date,earnings,job_status,payment_status';
    const rows = this.filteredJobs().map(j =>
      `${j.client},${j.service},${j.date},${j.earnings},${j.status},${getPaymentStatusLabel(j.status)}`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `worker-history-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.showMessage('Job ledger exported to CSV.', 'success');
    this.notification.success('Job history exported.');
  }

  private showMessage(text: string, type: 'success' | 'error' | 'info') {
    this.uiMessage.set({ text, type });
  }

  getEscrowLabel(job: any): string | null {
    const ps = (job.paymentStatus || '').toUpperCase();
    if (ps === 'ESCROWED' || ps === 'SUCCESS') {
      const net = job.workerNetAmount ?? job.earnings;
      return `KSh ${Number(net).toFixed(2)} held in escrow`;
    }
    if (ps === 'RELEASED') {
      return 'Released to wallet';
    }
    if (ps === 'PENDING') {
      return null;
    }
    if (ps === 'REFUNDED') {
      return 'Payment refunded';
    }
    return null;
  }

  getEscrowClass(job: any): string {
    const ps = (job.paymentStatus || '').toUpperCase();
    if (ps === 'ESCROWED' || ps === 'SUCCESS') return 'bg-amber-50 text-amber-700 border-amber-100';
    if (ps === 'RELEASED') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (ps === 'PENDING') return 'bg-slate-50 text-slate-500 border-outline-variant';
    if (ps === 'REFUNDED') return 'bg-rose-50 text-rose-600 border-rose-100';
    return 'bg-surface-container-low text-on-surface-variant border-outline-variant';
  }

  openCounterOfferModal(job: any) {
    this.counterOfferJob.set(job);
    this.counterOfferPrice.set(job.earnings);
  }

  closeCounterOfferModal() {
    this.counterOfferJob.set(null);
    this.counterOfferPrice.set(null);
  }

  submitCounterOffer() {
    if (!this.counterOfferJob() || !this.counterOfferPrice()) return;

    this.counterOfferLoading.set(true);
    const jobId = this.counterOfferJob().id;
    const price = this.counterOfferPrice()!;

    this.state.submitCounterOffer(jobId, price).subscribe({
      next: () => {
        this.counterOfferLoading.set(false);
        this.closeCounterOfferModal();
        this.showMessage('Counter-offer submitted successfully!', 'success');
        this.notification.success('Counter-offer sent to client.');
        this.refreshJobs();
      },
      error: (err: any) => {
        this.counterOfferLoading.set(false);
        const message = err.error?.message || err.error || 'Failed to submit counter-offer.';
        this.showMessage(message, 'error');
        this.notification.error(message);
      }
    });
  }

  rejectCounterOffer(jobId: string) {
    this.state.rejectCounterOffer(jobId).subscribe({
      next: () => {
        this.showMessage('Counter-offer rejected successfully!', 'success');
        this.notification.success('Counter-offer rejected.');
        this.refreshJobs();
      },
      error: (err: any) => {
        const message = err.error?.message || err.error || 'Failed to reject counter-offer.';
        this.showMessage(message, 'error');
        this.notification.error(message);
      }
    });
  }

  refreshJobs() {
    const user = this.state.currentWorker();
    if (user && user.userId) {
      this.state.fetchWorkerJobs(user.userId);
    }
  }
}
