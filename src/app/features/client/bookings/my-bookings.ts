import {
  Component, inject, signal, computed, OnDestroy, effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';

import { PlatformStateService, Booking } from '../../../core/services/platform-state.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PaymentService } from '../../../core/services/payment.service';
import { AuthService } from '../../../core/services/auth.service';
import { SettlementWalletService } from '../../../shared/services/settlement-wallet.service';
import {
  getPaymentStatusLabel,
  JOB_STATUS_OPTIONS,
  matchesPaymentStatusFilter,
  PAYMENT_STATUS_OPTIONS,
  PaymentStatusFilter
} from '../../../core/utils/payment-status.util';
import { EscrowProgressBar, EscrowStep } from '../../../shared/components/escrow-progress-bar/escrow-progress-bar';
import { EscrowAlertBanner } from '../../../shared/components/escrow-alert-banner/escrow-alert-banner';
import { DisputeStatusButtonComponent } from '../../../shared/components/dispute-status-button/dispute-status-button.component';
import { CancelHireDialogComponent } from '../../../shared/components/cancel-hire-dialog/cancel-hire-dialog.component';

@Component({
  selector: 'app-client-bookings',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatChipsModule, MatDividerModule,
    MatDialogModule,
    EscrowProgressBar, EscrowAlertBanner,
    DisputeStatusButtonComponent
  ],
  template: `
    <!-- Padding comes from the dashboard layout. -->
    <div class="max-w-5xl mx-auto animate-in fade-in duration-700 font-manrope">

      <!-- Escrow Progress Bar -->
      @if (currentBooking()) {
        <app-escrow-progress-bar [steps]="escrowSteps()" />
      }

      <!-- Escrow Alert Banner -->
      @if (showEscrowAlert()) {
        <app-escrow-alert-banner
          (fundEscrow)="openPayModal(currentBooking())"
          (dismiss)="dismissEscrowAlert()"
        />
      }

      <!-- Header -->
      <div class="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div class="min-w-0">
          <h1 class="text-lg sm:text-xl font-black text-slate-900 tracking-tight">My Work History</h1>
          <p class="text-slate-500 font-medium text-[11px]">Track your work and payments here.</p>
        </div>
        <button (click)="showHistory()"
                class="px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-black text-[9px] uppercase tracking-widest text-slate-600 hover:border-brand-teal hover:text-brand-teal transition-all flex items-center gap-1.5 shadow-sm">
          <mat-icon class="!text-xs !w-auto !h-auto">download</mat-icon> Export
        </button>
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

      <!-- Search and Filters -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6">
        <div class="grid grid-cols-1 lg:grid-cols-[1fr_180px_180px_100px] gap-3">
          <label class="relative block">
            <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 !text-[18px] text-slate-400">search</mat-icon>
            <input [ngModel]="searchQuery()"
                   (ngModelChange)="searchQuery.set($event); currentPage.set(1)"
                   placeholder="Search worker, service, payment status, amount, date"
                   class="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-brand-teal">
          </label>
          <select [ngModel]="statusFilter()"
                  (ngModelChange)="statusFilter.set($event); currentPage.set(1)"
                  class="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none focus:bg-white focus:border-brand-teal">
            @for (status of jobStatusOptions; track status) {
              <option [value]="status">{{ status === 'All' ? 'All Job Statuses' : status }}</option>
            }
          </select>
          <select [ngModel]="paymentStatusFilter()"
                  (ngModelChange)="paymentStatusFilter.set($event); currentPage.set(1)"
                  class="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none focus:bg-white focus:border-brand-teal">
            @for (status of paymentStatusOptions; track status) {
              <option [value]="status">{{ status === 'All' ? 'All Payments' : status }}</option>
            }
          </select>
          <button (click)="clearFilters()"
                  class="h-11 rounded-xl border border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-brand-teal hover:border-brand-teal transition-all">
            Clear
          </button>
        </div>
      </div>

      <!-- Bookings List -->
      @if (filteredBookings().length > 0) {
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-12">
          <div class="divide-y divide-slate-100">
            @for (b of paginatedBookings(); track b.id) {
              <div class="px-5 py-3.5 hover:bg-slate-50/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                <!-- Worker Info -->
                <!-- The 240px floor only applies once the row is side-by-side;
                     on a phone the card's content box is 256px wide. -->
                <div class="flex items-center gap-3.5 min-w-0 sm:min-w-[240px]">
                  <div class="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 font-bold text-[10px] uppercase border border-slate-200 overflow-hidden shrink-0">
                    @if ($any(b).workerImage) { <img [src]="$any(b).workerImage" class="w-full h-full object-cover"> }
                    @else { {{ b.workerInitials }} }
                  </div>
                  <div>
                    <h3 class="text-xs font-black text-slate-900 leading-tight mb-0.5">{{ b.workerName }}</h3>
                    <p class="text-[9px] text-slate-400 font-black uppercase tracking-wider">{{ b.service }}</p>
                  </div>
                </div>

                <!-- Date & Amount -->
                <div class="flex flex-row sm:flex-col sm:items-start justify-between sm:justify-center items-center gap-2 sm:gap-0.5">
                  <div class="flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
                    <mat-icon class="!text-[10px] !w-auto !h-auto">calendar_today</mat-icon>
                    <span>{{ b.date }}</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <span class="text-xs font-black text-slate-900">KES {{ b.earnings | number }}</span>
                    <span class="text-[8px] font-black uppercase bg-slate-50 border border-slate-200/50 text-slate-400 px-1.5 py-0.2 rounded-md">
                      {{ getPaymentStatusLabel(b.status) }}
                    </span>
                  </div>
                </div>

                <!-- Status & Actions Column -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between sm:justify-end gap-2 sm:gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-50">

                  <!-- Status badge with subtext -->
                  <div class="flex flex-col items-start sm:items-end gap-0.5">
                    <div class="flex items-center gap-2">
                      <span [ngClass]="getStatusClasses(b.status)">
                        {{ pollingJobId() === b.id ? 'Waiting...' : b.status }}
                      </span>
                      @if (pollingJobId() === b.id) {
                        <mat-icon class="animate-spin text-indigo-500 !w-4 !h-4">sync</mat-icon>
                      }
                    </div>
                    @if (b.paymentStatus === 'RELEASED' || b.status === 'Completed' || b.status === 'Approved') {
                      <span class="text-[8px] font-bold text-teal-600 uppercase tracking-tight">Released to Wallet</span>
                    }
                  </div>

                  <!-- Actions -->
                  <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <!-- Counter-offer badge and accept/counter/decline buttons -->
                    @if (b.negotiatedPrice && b.status === 'Pending') {
                      <div class="flex items-center gap-2">
                        <div class="bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                          <p class="text-[9px] font-black text-amber-700">Counter: KES&nbsp;{{ b.negotiatedPrice.toLocaleString() }}</p>
                        </div>
                        <button (click)="acceptCounterOffer(b)"
                                class="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[9px] font-black
                                       uppercase tracking-widest hover:bg-emerald-600 transition-all active:scale-95 shadow-sm">
                          Accept
                        </button>
                        <button (click)="openCounterModal(b)"
                                class="px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-[9px] font-black
                                       uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 shadow-sm">
                          Counter
                        </button>
                        <button (click)="rejectCounterOffer(b)"
                                class="px-3 py-1.5 bg-rose-500 text-white rounded-lg text-[9px] font-black
                                       uppercase tracking-widest hover:bg-rose-600 transition-all active:scale-95 shadow-sm">
                          Decline
                        </button>
                      </div>
                    }

                    <!-- PAY / CANCEL button -->
                    @if ((b.status === 'Pending' || b.status === 'PENDING' || b.status === 'Accepted' || b.status === 'ACCEPTED' || b.status === 'Awaiting Funding' || b.status === 'AWAITING_FUNDING') && !b.escrowFunded) {
                      <div class="flex items-center gap-2">
                        <button (click)="openPayModal(b)"
                                class="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[9px] font-black
                                       uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95 shadow-sm">
                          Pay
                        </button>
                        <button (click)="openCancelHireDialog(b)"
                                class="px-2.5 py-1.5 border border-rose-200 text-rose-600 rounded-lg text-[9px]
                                       font-black uppercase tracking-widest hover:bg-rose-50 transition-all bg-white active:scale-95">
                          Cancel
                        </button>
                      </div>
                      <div class="text-[8px] text-slate-400 font-medium mt-1">
                        Expires in {{ getTimeRemaining(b) }}
                      </div>
                    }

                    <!-- RETRY button -->
                    @else if (b.paymentStatus?.toLowerCase() === 'failed' || b.paymentStatus?.toLowerCase() === 'payout_failed') {
                      <button (click)="openPayModal(b, true)"
                              class="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-[9px] font-black
                                     uppercase tracking-widest hover:bg-rose-700 transition-all active:scale-95 shadow-sm">
                        Retry Payment
                      </button>
                    }

                    <!-- APPROVE button -->
                    @else if (b.status === 'Submitted') {
                      @if (b.hasActiveDispute) {
                        <button disabled
                                class="px-3 py-1.5 bg-slate-300 text-slate-500 rounded-lg text-[9px] font-black
                                       uppercase tracking-widest cursor-not-allowed shadow-sm"
                                title="This job is currently under dispute and is awaiting administrator review">
                          Under Dispute
                        </button>
                      } @else {
                        <button (click)="openReleaseConfirm(b)"
                                [disabled]="releasingJobId() === b.id"
                                class="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-black
                                       uppercase tracking-widest hover:bg-emerald-600 transition-all active:scale-95 shadow-sm
                                       disabled:opacity-50 disabled:cursor-wait">
                          {{ releasingJobId() === b.id ? 'Approving...' : 'Approve Work' }}
                        </button>
                        <button (click)="state.updateJobStatus(b.id, 'REVISION_REQUESTED')"
                                title="Request revision"
                                class="w-7 h-7 flex items-center justify-center border border-slate-200
                                       text-slate-400 rounded-lg hover:text-amber-600 transition-all bg-white active:scale-95">
                          <mat-icon class="!text-sm">rebase_edit</mat-icon>
                        </button>
                      }
                    }

                    <!-- FEEDBACK button -->
                    @if ((b.status === 'Approved' || b.status === 'Completed') && !b.hasReview) {
                      <button (click)="openReviewModal(b)"
                              class="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-black
                                     uppercase tracking-widest hover:bg-brand-teal transition-all active:scale-95 shadow-sm">
                        Feedback
                      </button>
                    }

                    <!-- DISPUTE button (shows alongside feedback or separately) -->
                    @if ((b.status === 'Submitted' || b.status === 'In Progress' || b.status === 'Revision Requested' || (b.status === 'Completed' && b.hasReview) || (b.status === 'Approved' && b.escrowFunded)) && (b.escrowFunded || false)) {
                      <app-dispute-status-button 
                        [jobId]="b.id"
                        [bookingStatus]="b.status"
                        [paymentStatus]="b.paymentStatus || ''"
                        [escrowFunded]="b.escrowFunded || false"
                        [disputedAt]="b.disputedAt || null"
                        [resolvedAt]="b.resolvedAt || null">
                      </app-dispute-status-button>
                    }

                    <!-- CANCEL button -->
                    @else if (b.status === 'Pending') {
                      <button (click)="openCancelHireDialog(b)"
                              class="px-2.5 py-1.5 border border-slate-200 text-slate-400 rounded-lg text-[9px]
                                     font-black uppercase tracking-widest hover:text-rose-600 hover:border-rose-100 transition-all bg-white active:scale-95">
                        Cancel
                      </button>
                    }
                  </div>

                </div>

              </div>
            }
          </div>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <!-- Wraps: the "showing x of y" caption plus seven pager controls
                 need ~340px, against a 256px card interior at 320px. -->
            <div class="p-3 border-t border-slate-50 bg-slate-50/30 flex flex-wrap items-center justify-between gap-2">
              <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Showing {{ pageStart() + 1 }}-{{ pageEnd() }} of {{ filteredBookings().length }}
              </span>
              <div class="flex flex-wrap gap-1.5">
                <button (click)="goToPage(currentPage() - 1)" [disabled]="currentPage() === 1"
                        class="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200
                               text-slate-400 disabled:opacity-30 hover:text-brand-teal transition-all bg-white">
                  <mat-icon class="!text-base">chevron_left</mat-icon>
                </button>
                @for (page of pageNumbers(); track page) {
                  <button (click)="goToPage(page)"
                          [ngClass]="page === currentPage() ? 'bg-brand-teal text-white border-brand-teal' : 'bg-white text-slate-400 border-slate-200 hover:text-brand-teal'"
                          class="w-7 h-7 flex items-center justify-center rounded-lg border text-[10px] font-black transition-all">
                    {{ page }}
                  </button>
                }
                <button (click)="goToPage(currentPage() + 1)" [disabled]="currentPage() === totalPages()"
                        class="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200
                               text-slate-400 disabled:opacity-30 hover:text-brand-teal transition-all bg-white">
                  <mat-icon class="!text-base">chevron_right</mat-icon>
                </button>
              </div>
            </div>
          }
        </div>
      }

      @if (filteredBookings().length === 0) {
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center max-w-md mx-auto mt-8">
          <div class="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 mx-auto mb-4 border border-slate-100/50">
            <mat-icon class="!text-2xl">assignment_late</mat-icon>
          </div>
          <h3 class="text-lg font-black text-slate-900 mb-1">No bookings yet</h3>
          <p class="text-slate-400 text-xs mb-6 leading-relaxed">Start your first project from the marketplace to track bookings here.</p>
          <button mat-flat-button routerLink="/client/marketplace"
                  class="!bg-brand-teal !text-white !rounded-xl !px-6 !py-3.5 !font-black !text-[10px] !uppercase !tracking-widest shadow-md">
            Browse Professionals
          </button>
        </div>
      }

      <!-- PAY MODAL -->
      @if (payModal) {
        <div class="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div class="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" (click)="closePayModal()"></div>
          <div class="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in-95 duration-300">

            <h3 class="text-2xl font-black text-slate-900 mb-1">
              {{ payModal.retrying ? 'Retry Payment' : 'Fund This Job' }}
            </h3>
            <p class="text-slate-400 text-sm mb-6">
              Total due:
              <span class="font-black text-slate-800">KES {{ payTotal() | number }}</span>
            </p>

            <!-- Wallet source selector -->
            @if (payModal.walletLoading) {
              <div class="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-[11px] font-bold text-slate-400">
                Checking wallet balance...
              </div>
            } @else if (payModal.walletFrozen) {
              <div class="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-2">
                <mat-icon class="!text-sm !w-auto !h-auto text-amber-600 shrink-0 mt-0.5">lock</mat-icon>
                <p class="text-[11px] font-bold text-amber-700">
                  Your wallet is frozen, so this job must be paid entirely via M-Pesa.
                </p>
              </div>
            } @else if (payModal.walletBalance > 0) {
              <button type="button" (click)="toggleUseWallet()"
                      class="w-full mb-4 p-4 rounded-2xl border text-left transition-all"
                      [ngClass]="payModal.useWallet ? 'border-brand-teal bg-brand-teal/5' : 'border-slate-200 hover:border-slate-300'">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                       [ngClass]="payModal.useWallet ? 'bg-brand-teal/10' : 'bg-slate-100'">
                    <mat-icon class="!text-base !w-auto !h-auto"
                              [ngClass]="payModal.useWallet ? 'text-brand-teal' : 'text-slate-400'">
                      account_balance_wallet
                    </mat-icon>
                  </div>
                  <div class="flex-1">
                    <p class="text-[11px] font-black uppercase tracking-widest text-slate-700">Use wallet balance</p>
                    <p class="text-[10px] font-bold text-slate-400">
                      Available: KES {{ payModal.walletBalance | number }}
                    </p>
                  </div>
                  <mat-icon class="!text-lg !w-auto !h-auto shrink-0"
                            [ngClass]="payModal.useWallet ? 'text-brand-teal' : 'text-slate-300'">
                    {{ payModal.useWallet ? 'check_circle' : 'radio_button_unchecked' }}
                  </mat-icon>
                </div>
              </button>

              <!-- Split breakdown: this is the shortfall prompt -->
              @if (payModal.useWallet) {
                <div class="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div class="flex justify-between text-[11px] font-bold">
                    <span class="text-slate-500">From wallet</span>
                    <span class="text-brand-teal font-black">- KES {{ walletPortion() | number }}</span>
                  </div>
                  @if (mpesaShortfall() > 0) {
                    <div class="flex justify-between text-[11px] font-bold">
                      <span class="text-slate-500">Remaining via M-Pesa</span>
                      <span class="text-indigo-600 font-black">KES {{ mpesaShortfall() | number }}</span>
                    </div>
                    <div class="pt-2 border-t border-slate-200 flex items-start gap-2">
                      <mat-icon class="!text-sm !w-auto !h-auto text-indigo-500 shrink-0 mt-0.5">info</mat-icon>
                      <p class="text-[10px] font-bold text-slate-500 leading-relaxed">
                        Your wallet doesn't fully cover this job. We'll deduct
                        <span class="text-slate-800">KES {{ walletPortion() | number }}</span>
                        from your wallet and send an STK push for the remaining
                        <span class="text-slate-800">KES {{ mpesaShortfall() | number }}</span>.
                      </p>
                    </div>
                  } @else {
                    <div class="pt-2 border-t border-slate-200 flex items-start gap-2">
                      <mat-icon class="!text-sm !w-auto !h-auto text-emerald-500 shrink-0 mt-0.5">check_circle</mat-icon>
                      <p class="text-[10px] font-bold text-emerald-600 leading-relaxed">
                        Your wallet covers the full amount — no M-Pesa payment needed.
                      </p>
                    </div>
                  }
                </div>
              }
            }

            <!-- Phone only needed when M-Pesa is actually involved -->
            @if (needsPhone()) {
              <div class="space-y-4 mb-8">
                <div>
                  <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">
                    M-Pesa Number
                  </label>
                  <input type="tel"
                         [(ngModel)]="payModal.phone"
                         placeholder="0712 345 678"
                         class="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium
                                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                </div>
              </div>
            }

            @if (payModal.error) {
              <div class="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-medium">
                {{ payModal.error }}
              </div>
            }

            <div class="flex gap-3">
              <button (click)="closePayModal()"
                      class="flex-1 py-4 rounded-2xl border border-slate-200 text-slate-400 font-black
                             text-xs uppercase tracking-widest hover:text-slate-600 transition-colors">
                Cancel
              </button>
              <button (click)="submitPayment()"
                      [disabled]="payModal.loading || payModal.walletLoading || (needsPhone() && !payModal.phone)"
                      class="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs
                             uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-40
                             disabled:cursor-wait transition-all active:scale-95">
                {{ payModal.loading ? 'Processing...' : payButtonLabel() }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- RELEASE CONFIRM MODAL -->
      @if (releaseConfirm) {
        <div class="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div class="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" (click)="releaseConfirm = null"></div>
          <div class="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in-95 duration-300">
            <div class="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
              <mat-icon class="text-emerald-600 !text-2xl">verified</mat-icon>
            </div>
            <h3 class="text-2xl font-black text-slate-900 mb-2">Approve Work?</h3>
            <p class="text-slate-400 text-sm mb-2">
              You are about to approve
              <span class="font-black text-slate-800">KES {{ releaseConfirm.earnings | number }}</span>
              for <span class="font-black text-slate-800">{{ releaseConfirm.workerName }}</span>.
            </p>
            <p class="text-slate-400 text-xs mb-8">
              This confirms the work is complete and satisfactory. This action cannot be undone.
            </p>
            <div class="flex gap-3">
              <button (click)="releaseConfirm = null"
                      class="flex-1 py-4 rounded-2xl border border-slate-200 text-slate-400 font-black
                             text-xs uppercase tracking-widest hover:text-slate-600 transition-colors">
                Go Back
              </button>
              <button (click)="confirmRelease()"
                      class="flex-[2] bg-slate-900 text-white py-4 rounded-2xl font-black text-xs
                             uppercase tracking-widest hover:bg-emerald-600 transition-all active:scale-95">
                Yes, Release KES {{ releaseConfirm.earnings | number }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- REVIEW MODAL -->
      @if (reviewBooking) {
        <div class="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10">
          <div class="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" (click)="reviewBooking = null"></div>
          <div class="relative bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl p-12 sm:p-16 animate-in zoom-in-95 duration-500">
            <h3 class="text-4xl font-black text-slate-900 tracking-tight mb-3">How was the experience?</h3>
            <p class="text-slate-500 font-medium mb-12 text-lg">
              Your feedback helps {{ reviewBooking.workerName }} and the community.
            </p>
            <div class="flex flex-col items-center mb-12">
              <div class="flex justify-center gap-3 mb-4">
                @for (star of [1,2,3,4,5]; track star) {
                  <button 
                    (click)="reviewRating = star" 
                    (mouseenter)="hoverRating = star"
                    (mouseleave)="hoverRating = 0"
                    [attr.aria-label]="'Rate ' + star + ' stars'"
                    [attr.aria-pressed]="reviewRating >= star"
                    class="transition-all hover:scale-125 active:scale-95 focus:outline-none focus:ring-4 focus:ring-amber-400/50 rounded-full p-2"
                    tabindex="0"
                    (keydown.enter)="reviewRating = star">
                    <mat-icon class="!text-5xl !w-auto !h-auto transition-all"
                              [ngClass]="(reviewRating >= star || hoverRating >= star) ? 'text-amber-400 drop-shadow-lg' : 'text-slate-200'">
                      star
                    </mat-icon>
                  </button>
                }
              </div>
              @if (reviewRating > 0) {
                <div class="text-center">
                  <span class="text-2xl font-black text-amber-400">{{ reviewRating }}/5</span>
                  <span class="text-slate-400 ml-2 text-sm font-medium">{{ getRatingText(reviewRating) }}</span>
                </div>
              } @else {
                <p class="text-slate-400 text-sm font-medium">Select a rating to continue</p>
              }
            </div>
            <div class="space-y-6">
              <textarea [(ngModel)]="reviewComment"
                        class="w-full h-40 bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-6
                               text-slate-700 text-lg font-medium placeholder:text-slate-300
                               focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600
                               transition-all outline-none resize-none"
                        placeholder="Tell us about quality, communication, and professionalism...">
              </textarea>
              <div class="flex gap-4">
                <button (click)="reviewBooking = null"
                        class="flex-1 py-5 rounded-2xl font-black text-xs uppercase tracking-widest
                               text-slate-400 hover:text-slate-600 transition-colors">
                  Cancel
                </button>
                <button (click)="submitReview()"
                        [disabled]="!reviewRating"
                        class="flex-[2] bg-slate-950 text-white py-5 rounded-2xl font-black text-xs
                               uppercase tracking-[0.2em] hover:bg-indigo-600 disabled:opacity-20
                               disabled:cursor-not-allowed transition-all active:scale-95">
                  Submit Review
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Negotiation Modal -->
      @if (negotiateJob()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
            <div class="p-6 border-b border-slate-100">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-black text-slate-900">💰 Negotiate Price</h3>
                <button (click)="closeNegotiateModal()" class="text-slate-400 hover:text-slate-600">
                  <mat-icon class="!text-xl !w-auto !h-auto">close</mat-icon>
                </button>
              </div>
              <p class="text-sm text-slate-500 mt-2">
                Original offer: KES {{ negotiateJob()?.earnings?.toLocaleString() }}
              </p>
            </div>
            <div class="p-6">
              <label class="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-2">
                Your Offer Price
              </label>
              <input
                type="number"
                [(ngModel)]="negotiatePrice"
                placeholder="Enter your price"
                class="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-900 outline-none focus:border-indigo-600 focus:bg-white transition-all"
              >
              <p class="text-[10px] text-slate-400 mt-2">
                Enter the price you'd like to offer for this job.
              </p>
            </div>
            <div class="p-6 border-t border-slate-100 flex gap-3">
              <button
                (click)="closeNegotiateModal()"
                class="flex-1 py-3 border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                (click)="submitNegotiation()"
                [disabled]="negotiateLoading() || !negotiatePrice() || negotiatePrice()! <= 0"
                class="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                <mat-icon class="!text-sm !w-auto !h-auto" [class.animate-spin]="negotiateLoading()">
                  {{ negotiateLoading() ? 'sync' : 'send' }}
                </mat-icon>
                {{ negotiateLoading() ? 'Submitting...' : 'Submit Offer' }}
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; background: #fafafa; }
    .mat-mdc-table { background: transparent !important; }
    .mat-mdc-row, .mat-mdc-header-row { border-bottom: 1px solid #f8fafc !important; }
    .mat-mdc-cell, .mat-mdc-header-cell { border-bottom: none !important; }
  `]
})
export class ClientBookingsPage implements OnDestroy {

  state = inject(PlatformStateService);
  private auth = inject(AuthService);
  private notif = inject(NotificationService);
  private payment = inject(PaymentService);
  private walletService = inject(SettlementWalletService);
  private http = inject(HttpClient);
  private dialog = inject(MatDialog);

  displayedColumns = ['worker', 'date', 'cost', 'status'];

  // Pagination
  currentPage = signal(1);
  itemsPerPage = signal(5);
  searchQuery = signal('');
  statusFilter = signal('All');
  paymentStatusFilter = signal<PaymentStatusFilter>('All');
  uiMessage = signal<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Negotiation modal
  negotiateJob = signal<any>(null);
  negotiatePrice = signal<number | null>(null);
  negotiateLoading = signal(false);

  readonly jobStatusOptions = JOB_STATUS_OPTIONS;
  readonly paymentStatusOptions = PAYMENT_STATUS_OPTIONS;
  readonly getPaymentStatusLabel = getPaymentStatusLabel;

  filteredBookings = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();
    const paymentStatus = this.paymentStatusFilter();

    return [...this.state.bookings()]
      .sort((a: Booking, b: Booking) => (b.rawDate || 0) - (a.rawDate || 0))
      .filter((b: Booking) => status === 'All' || b.status === status)
      .filter((b: Booking) => matchesPaymentStatusFilter(b.status, paymentStatus))
      .filter((b: Booking) => {
        if (!query) return true;
        const haystack = [
          b.workerName,
          b.service,
          b.status,
          b.date,
          b.earnings,
          getPaymentStatusLabel(b.status)
        ].join(' ').toLowerCase();
        return haystack.includes(query);
      });
  });

  paginatedBookings = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    return this.filteredBookings().slice(start, start + this.itemsPerPage());
  });
  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredBookings().length / this.itemsPerPage())));
  pageStart = computed(() => Math.min((this.currentPage() - 1) * this.itemsPerPage(), Math.max(this.filteredBookings().length - 1, 0)));
  pageEnd = computed(() => Math.min(this.pageStart() + this.itemsPerPage(), this.filteredBookings().length));
  pageNumbers = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1).slice(
    Math.max(0, this.currentPage() - 3),
    Math.max(0, this.currentPage() - 3) + 5
  ));
  goToPage(p: number) { if (p >= 1 && p <= this.totalPages()) this.currentPage.set(p); }
  clearFilters() {
    this.searchQuery.set('');
    this.statusFilter.set('All');
    this.paymentStatusFilter.set('All');
    this.currentPage.set(1);
    this.uiMessage.set({ text: 'Filters cleared.', type: 'info' });
  }

  // Payment polling state
  pollingJobId = signal<string | null>(null);
  releasingJobId = signal<string | null>(null);
  private pollSub?: Subscription;

  // Modals
  payModal: {
    booking: any;
    phone: string;
    loading: boolean;
    error: string;
    retrying: boolean;
    walletBalance: number;
    walletFrozen: boolean;
    walletLoading: boolean;
    useWallet: boolean;
  } | null = null;
  releaseConfirm: any = null;
  reviewBooking: any = null;
  reviewRating = 0;
  hoverRating = 0;
  reviewComment = '';

  // Escrow guidance
  escrowAlertDismissed = signal(false);

  currentBooking = computed(() => {
    const bookings = this.state.bookings();
    return bookings.find((b: any) =>
      (b.status === 'Accepted' || b.status === 'ACCEPTED' || b.status === 'Awaiting Funding' || b.status === 'AWAITING_FUNDING') && !this.escrowAlertDismissed()
    ) || null;
  });

  showEscrowAlert = computed(() => {
    const booking = this.currentBooking();
    return booking !== null && !this.escrowAlertDismissed();
  });

  private isAwaitingFunding(status: string) {
    const normalized = (status || '').toLowerCase();
    return normalized === 'accepted' || normalized === 'awaiting funding';
  }

  escrowSteps = computed<EscrowStep[]>(() => {
    const booking = this.currentBooking();
    if (!booking) return [];

    const status = booking.status?.toLowerCase() || '';

    return [
      { step: 1, label: 'Job Posted', status: 'completed' },
      { step: 2, label: 'Worker Accepted', status: 'completed' },
      { step: 3, label: 'Fund Escrow', status: status === 'accepted' || status === 'awaiting funding' ? 'warning' : 'completed' },
      { step: 4, label: 'Work Begins', status: status === 'in_progress' || status === 'assigned' ? 'current' : 'pending' },
      { step: 5, label: 'Delivery', status: status === 'submitted' ? 'current' : 'pending' },
      { step: 6, label: 'Release Payment', status: status === 'approved' || status === 'completed' ? 'current' : 'pending' }
    ];
  });

  dismissEscrowAlert() {
    this.escrowAlertDismissed.set(true);
  }

  acceptCounterOffer(booking: any) {
    this.state.acceptCounterOffer(booking.id).subscribe({
      next: () => {
        this.uiMessage.set({ text: 'Counter-offer accepted! You can now pay the negotiated price.', type: 'success' });
        this.notif.success('Counter-offer accepted! You can now pay the negotiated price.');
        this.refreshBookings();
      },
      error: (err: any) => {
        const message = err.error?.message || err.error || 'Failed to accept counter-offer.';
        this.uiMessage.set({ text: message, type: 'error' });
        this.notif.error(message);
      }
    });
  }

  openCounterModal(booking: any) {
    this.negotiateJob.set(booking);
    this.negotiatePrice.set(booking.negotiatedPrice || booking.earnings);
  }

  rejectCounterOffer(booking: any) {
    this.state.rejectCounterOffer(booking.id).subscribe({
      next: () => {
        this.uiMessage.set({ text: 'Counter-offer declined.', type: 'success' });
        this.notif.success('Counter-offer declined.');
        this.refreshBookings();
      },
      error: (err: any) => {
        const message = err.error?.message || err.error || 'Failed to decline counter-offer.';
        this.uiMessage.set({ text: message, type: 'error' });
        this.notif.error(message);
      }
    });
  }

  openNegotiateModal(booking: any) {
    this.negotiateJob.set(booking);
    this.negotiatePrice.set(booking.earnings);
  }

  closeNegotiateModal() {
    this.negotiateJob.set(null);
    this.negotiatePrice.set(null);
  }

  submitNegotiation() {
    if (!this.negotiateJob() || !this.negotiatePrice()) return;

    this.negotiateLoading.set(true);
    const jobId = this.negotiateJob().id;
    const price = this.negotiatePrice() as number;

    this.state.submitClientCounterOffer(jobId, price).subscribe({
      next: () => {
        this.negotiateLoading.set(false);
        this.closeNegotiateModal();
        this.uiMessage.set({ text: 'Negotiation offer sent to worker!', type: 'success' });
        this.notif.success('Negotiation offer sent to worker!');
        this.refreshBookings();
      },
      error: (err: any) => {
        this.negotiateLoading.set(false);
        const message = err.error?.message || err.error || 'Failed to submit negotiation.';
        this.uiMessage.set({ text: message, type: 'error' });
        this.notif.error(message);
      }
    });
  }

  // ── Private helper ───────────────────────────────────────────────────────

  private refreshBookings() {
    const user = this.auth.currentUser();
    if (user) {
      this.state.fetchClientJobs(user.id);
    } else {
      console.warn('[ClientBookingsPage] Cannot refresh: No authenticated user');
    }
  }

  // ── Pay Modal ───────────────────────────────────────────────────────────

  openPayModal(booking: any, retrying = false, errorMessage = '') {
    this.refreshBookings();
    const updatedBooking = this.state.bookings().find((b: any) => b.id === booking.id);
    const bookingToUse = updatedBooking || booking;
    this.payModal = {
      booking: bookingToUse,
      phone: '',
      loading: false,
      error: errorMessage,
      retrying,
      walletBalance: 0,
      walletFrozen: false,
      walletLoading: true,
      useWallet: false
    };

    this.walletService.getWalletSummary().subscribe({
      next: (summary) => {
        if (!this.payModal) return;
        const balance = summary?.availableBalance || 0;
        this.payModal.walletBalance = balance;
        this.payModal.walletFrozen = !!summary?.isFrozen;
        // Default to spending the wallet first whenever there is usable balance.
        this.payModal.useWallet = balance > 0 && !summary?.isFrozen;
        this.payModal.walletLoading = false;
      },
      error: () => {
        if (!this.payModal) return;
        // Wallet lookup failed — fall back to plain M-Pesa rather than blocking payment.
        this.payModal.walletLoading = false;
        this.payModal.walletBalance = 0;
        this.payModal.useWallet = false;
      }
    });
  }

  closePayModal() { this.payModal = null; }

  /** Total due on the job being funded. */
  payTotal(): number {
    if (!this.payModal) return 0;
    const b = this.payModal.booking;
    return b.negotiatedPrice || b.earnings || 0;
  }

  /** Amount that will actually be drawn from the wallet (capped at the total). */
  walletPortion(): number {
    if (!this.payModal || !this.payModal.useWallet) return 0;
    return Math.min(this.payModal.walletBalance, this.payTotal());
  }

  /** Amount still owed after the wallet is applied — the shortfall to STK push. */
  mpesaShortfall(): number {
    return Math.max(0, this.payTotal() - this.walletPortion());
  }

  /** A phone number is only required when M-Pesa has to cover something. */
  needsPhone(): boolean {
    if (!this.payModal) return false;
    if (this.payModal.walletLoading) return false;
    return this.mpesaShortfall() > 0;
  }

  payButtonLabel(): string {
    if (!this.payModal) return 'Pay';
    if (this.mpesaShortfall() <= 0 && this.payModal.useWallet) return 'Pay From Wallet';
    if (this.walletPortion() > 0) return 'Pay Wallet + STK';
    return 'Send STK Push';
  }

  toggleUseWallet() {
    if (!this.payModal) return;
    this.payModal.useWallet = !this.payModal.useWallet;
    this.payModal.error = '';
  }

  submitPayment() {
    if (!this.payModal) return;
    if (this.needsPhone() && !this.payModal.phone) return;

    const { booking, phone, useWallet } = this.payModal;
    const usingWallet = useWallet && this.walletPortion() > 0;

    this.payModal.loading = true;
    this.payModal.error = '';

    // Plain M-Pesa when the wallet isn't contributing — keeps the existing path intact.
    if (!usingWallet) {
      this.payment.initiateStkPush(booking.id, phone).subscribe({
        next: () => {
          this.closePayModal();
          this.notif.success('STK push sent — check your phone for the PIN prompt');
          this.startPolling(booking.id);
        },
        error: (err) => this.handlePayError(err, 'Failed to send STK push. Please try again.')
      });
      return;
    }

    this.payment.payWithWallet(booking.id, true, phone || undefined).subscribe({
      next: (resp) => {
        this.closePayModal();
        if (resp.status === 'SUCCESS') {
          this.notif.success(resp.message || 'Job funded from your wallet balance.');
          this.refreshBookings();
        } else {
          this.notif.success(
            `KES ${Math.round(resp.paidViaWallet).toLocaleString()} taken from your wallet. ` +
            `Check your phone to approve the remaining KES ${Math.round(resp.paidViaMpesa).toLocaleString()}.`
          );
          this.startPolling(booking.id);
        }
      },
      error: (err) => this.handlePayError(err, 'Wallet payment failed. Please try again.')
    });
  }

  private handlePayError(err: any, fallback: string) {
    if (!this.payModal) return;
    this.payModal.loading = false;
    const body = err?.error;
    this.payModal.error = typeof body === 'string'
      ? body
      : body?.message || body?.error || fallback;
  }

  // ── Payment Polling ─────────────────────────────────────────────────────

  startPolling(jobId: string) {
    this.pollSub?.unsubscribe();
    this.pollingJobId.set(jobId);

    this.pollSub = this.payment.pollPaymentStatus(jobId).subscribe({
      next: (resp) => {
        if (resp.status === 'PAID') {
          this.pollingJobId.set(null);
          const receipt = resp.mpesaReceiptNumber ? ` Receipt: ${resp.mpesaReceiptNumber}` : '';
          this.notif.success(`Payment confirmed!${receipt}`);
          this.refreshBookings();
        } else if (resp.status === 'FAILED' || resp.status === 'PAYOUT_FAILED') {
          this.pollingJobId.set(null);
          const msg = this.payment.getFailureMessage(resp.failureReason, resp.message);
          this.notif.error(msg, {
            actionLabel: 'Retry',
            action: () => {
              const b = this.state.bookings().find((b: any) => b.id === jobId);
              if (b) this.openPayModal(b, true, msg);
            }
          });
          this.refreshBookings();
        } else if (resp.status === 'REFUNDED') {
          this.pollingJobId.set(null);
          this.notif.info('Payment was refunded to your wallet.');
          this.refreshBookings();
        } else if (resp.status === 'PENDING' && resp.message?.includes('refresh')) {
          this.pollingJobId.set(null);
          this.notif.info('Payment may still be processing. Refresh to check status.', {
            actionLabel: 'Refresh',
            action: () => this.refreshBookings()
          });
        }
      },
      error: () => {
        this.pollingJobId.set(null);
      }
    });
  }

  // ── Release Confirm ─────────────────────────────────────────────────────

  openReleaseConfirm(booking: any) { this.releaseConfirm = booking; }

  confirmRelease() {
    if (!this.releaseConfirm) return;
    const booking = this.releaseConfirm;
    this.releaseConfirm = null;
    this.releasingJobId.set(booking.id);

    this.state.updateJobStatusRequest(booking.id, 'APPROVED').subscribe({
      next: () => {
        this.releasingJobId.set(null);
        this.uiMessage.set({ text: 'Work approved. Funds released to the worker wallet.', type: 'success' });
        this.notif.success('Work approved. Funds released to the worker wallet.');
        this.refreshBookings();

        setTimeout(() => {
          const updatedBooking = this.state.bookings().find((b: any) => b.id === booking.id);
          if (updatedBooking && updatedBooking.status === 'Approved' && !updatedBooking.hasReview) {
            this.openReviewModal(updatedBooking);
          }
        }, 1000);
      },
      error: (err) => {
        this.releasingJobId.set(null);
        const body = err?.error;
        const message = typeof body === 'string'
          ? body
          : body?.message || 'Could not approve work. Confirm payment is captured in escrow first.';
        this.uiMessage.set({ text: message, type: 'error' });
      }
    });
  }

  // ── Review ──────────────────────────────────────────────────────────────

  openReviewModal(booking: any) { 
    this.reviewBooking = booking; 
    this.reviewRating = 0; 
    this.hoverRating = 0;
    this.reviewComment = ''; 
  }

  getRatingText(rating: number): string {
    switch(rating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return '';
    }
  }

  submitReview() {
    if (!this.reviewBooking || !this.reviewRating) return;
    this.state.submitReview(this.reviewBooking.workerId, this.reviewBooking.id, this.reviewRating, this.reviewComment);
    this.reviewBooking = null;
  }

  // ── CSV Export ──────────────────────────────────────────────────────────

  showHistory() {
    const rows = this.state.bookings().map((b: any) =>
      `${b.clientName},${b.workerName},${b.status},${b.date},${b.earnings}`);
    const csv = ['Employer,Worker,Status,Date,Amount (KES)', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.notif.success('Booking history exported.');
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  getStatusClasses(status: string) {
    const base = 'px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider border transition-colors ';
    switch ((status || '').toLowerCase()) {
      case 'completed': return base + 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'approved': return base + 'bg-emerald-50/60 text-emerald-600 border-emerald-100';
      case 'accepted': return base + 'bg-brand-teal-soft text-brand-teal border-brand-teal/30';
      case 'awaiting funding': return base + 'bg-amber-50 text-amber-700 border-amber-100';
      case 'submitted': return base + 'bg-emerald-50/50 text-emerald-600 border-emerald-100';
      case 'pending': return base + 'bg-slate-50 text-slate-500 border-slate-200';
      case 'in progress': return base + 'bg-indigo-50/30 text-indigo-500 border-indigo-100';
      case 'cancelled': return base + 'bg-slate-50 text-rose-400 border-rose-100';
      case 'disputed': return base + 'bg-rose-50 text-rose-600 border-rose-200';
      case 'revision requested': return base + 'bg-amber-50 text-amber-600 border-amber-100';
      default: return base + 'bg-slate-50 text-slate-400 border-slate-100';
    }
  }

  ngOnDestroy() { this.pollSub?.unsubscribe(); }

  // ── Cancel Hire ───────────────────────────────────────────────────────────

  openCancelHireDialog(booking: any) {
    const dialogRef = this.dialog.open(CancelHireDialogComponent, {
      width: '500px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(reason => {
      if (reason) {
        this.state.cancelHire(booking.id, reason).subscribe({
          next: () => {
            this.notif.success('Hire cancelled successfully');
          },
          error: (err) => {
            console.error('Error cancelling hire', err);
            this.notif.error('Failed to cancel hire');
          }
        });
      }
    });
  }

  getTimeRemaining(booking: any): string {
    if (!booking.date) return '';
    
    const acceptedDate = new Date(booking.date);
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

  counterOfferListener = effect(() => {
    const notifications = this.state.notifications();
    const counterOfferNotifs = notifications.filter(n =>
      n.title?.includes('Counter-Offer') || n.message?.includes('counter-offer') || n.message?.includes('Counter-offer')
    );

    if (counterOfferNotifs.length > 0) {
      const lastNotif = counterOfferNotifs[counterOfferNotifs.length - 1];
      if (!lastNotif.isRead) {
        setTimeout(() => this.refreshBookings(), 500);
      }
    }
  });
}