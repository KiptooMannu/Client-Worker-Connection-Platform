import {
  Component, inject, signal, computed, OnDestroy
} from '@angular/core';
import { CommonModule }     from '@angular/common';
import { RouterLink }       from '@angular/router';
import { FormsModule }      from '@angular/forms';
import { MatCardModule }    from '@angular/material/card';
import { MatButtonModule }  from '@angular/material/button';
import { MatIconModule }    from '@angular/material/icon';
import { MatTableModule }   from '@angular/material/table';
import { MatChipsModule }   from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar }      from '@angular/material/snack-bar';
import { Subscription }     from 'rxjs';

import { PlatformStateService } from '../../../core/services/platform-state.service';
import { NotificationService }  from '../../../core/services/notification.service';
import { PaymentService }       from '../../../core/services/payment.service';
import { AuthService }          from '../../../core/services/auth.service';

@Component({
  selector: 'app-client-bookings',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatChipsModule, MatDividerModule,
  ],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-in fade-in duration-700 font-manrope">

      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-2xl font-black text-slate-900 tracking-tight">My Work History</h1>
          <p class="text-slate-500 font-medium text-xs">Track your work and payments here.</p>
        </div>
        <button (click)="showHistory()"
                class="px-4 py-2 bg-white border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-600 hover:border-primary transition-all flex items-center gap-2">
          <mat-icon class="!w-4 !h-4">download</mat-icon> Export
        </button>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div class="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
            <mat-icon class="!text-xl">engineering</mat-icon>
          </div>
          <div>
            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ongoing</p>
            <p class="text-xl font-black text-slate-900">{{ activeCount }}</p>
          </div>
        </div>
        <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div class="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
            <mat-icon class="!text-xl">payments</mat-icon>
          </div>
          <div>
            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Paid</p>
            <p class="text-xl font-black text-slate-900">KES {{ totalSpent | number }}</p>
          </div>
        </div>
        <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div class="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
            <mat-icon class="!text-xl">pending_actions</mat-icon>
          </div>
          <div>
            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pending</p>
            <p class="text-xl font-black text-slate-900">{{ pendingCount }}</p>
          </div>
        </div>
      </div>

      <!-- Bookings Table -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-12">
        <div class="overflow-x-auto">
          <table mat-table [dataSource]="paginatedBookings()" class="w-full min-w-[900px]">

            <!-- Worker Column -->
            <ng-container matColumnDef="worker">
              <th mat-header-cell *matHeaderCellDef
                  class="!px-6 !py-4 !bg-slate-50/50 !text-slate-400 !font-black !text-[10px] !uppercase !tracking-widest">
                Worker
              </th>
              <td mat-cell *matCellDef="let b" class="!px-6 !py-4">
                <div class="flex items-center gap-4">
                  <div class="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400
                              font-black text-xs uppercase border border-slate-200 overflow-hidden">
                    @if (b.workerImage) { <img [src]="b.workerImage" class="w-full h-full object-cover"> }
                    @else { {{ b.workerInitials }} }
                  </div>
                  <div>
                    <p class="text-sm font-black text-slate-900 leading-tight mb-0.5">{{ b.workerName }}</p>
                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{{ b.service }}</p>
                  </div>
                </div>
              </td>
            </ng-container>

            <!-- Date Column -->
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef
                  class="!px-6 !py-4 !bg-slate-50/50 !text-slate-400 !font-black !text-[10px] !uppercase !tracking-widest text-center">
                Date
              </th>
              <td mat-cell *matCellDef="let b" class="!px-6 !py-4 text-center">
                <p class="text-[12px] font-bold text-slate-900">{{ b.date }}</p>
              </td>
            </ng-container>

            <!-- Cost Column -->
            <ng-container matColumnDef="cost">
              <th mat-header-cell *matHeaderCellDef
                  class="!px-6 !py-4 !bg-slate-50/50 !text-slate-400 !font-black !text-[10px] !uppercase !tracking-widest text-center">
                Amount
              </th>
              <td mat-cell *matCellDef="let b" class="!px-6 !py-4 text-center">
                <div class="flex flex-col items-center">
                  <span class="text-sm font-black text-slate-900">KES {{ b.earnings | number }}</span>
                  <span class="text-[9px] font-black uppercase text-slate-400">
                    {{ b.status === 'Approved' ? 'Released' : 'Escrowed' }}
                  </span>
                </div>
              </td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef
                  class="!px-6 !py-4 !bg-slate-50/50 !text-slate-400 !font-black !text-[10px] !uppercase !tracking-widest text-right">
                Actions
              </th>
              <td mat-cell *matCellDef="let b" class="!px-6 !py-4">
                <div class="flex items-center justify-end gap-3">

                  <!-- Status badge -->
                  <span [ngClass]="getStatusClasses(b.status)" class="min-w-[90px] text-center">
                    {{ pollingJobId() === b.id ? 'Waiting...' : b.status }}
                  </span>

                  <!-- Loading spinner while polling -->
                  @if (pollingJobId() === b.id) {
                    <mat-icon class="animate-spin text-indigo-500 !w-5 !h-5">sync</mat-icon>
                  }

                  <!-- PAY button — shown for Accepted jobs without an active payment -->
                  @else if (b.status === 'Accepted') {
                    <button (click)="openPayModal(b)"
                            class="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-[9px] font-black
                                   uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-sm">
                      Pay Escrow
                    </button>
                  }

                  <!-- RETRY button — for failed payments -->
                  @else if (b.paymentStatus === 'FAILED') {
                    <button (click)="openPayModal(b)"
                            class="px-4 py-1.5 bg-rose-600 text-white rounded-lg text-[9px] font-black
                                   uppercase tracking-widest hover:bg-rose-700 transition-all shadow-sm">
                      Retry Payment
                    </button>
                  }

                  <!-- RELEASE button — work submitted, client must approve -->
                  @else if (b.status === 'Submitted') {
                    <button (click)="openReleaseConfirm(b)"
                            [disabled]="releasingJobId() === b.id"
                            class="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-black
                                   uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-sm
                                   disabled:opacity-50 disabled:cursor-wait">
                      {{ releasingJobId() === b.id ? 'Releasing...' : 'Release Funds' }}
                    </button>
                    <button (click)="state.updateJobStatus(b.id, 'REVISION_REQUESTED')"
                            title="Request revision"
                            class="w-8 h-8 flex items-center justify-center border border-slate-200
                                   text-slate-400 rounded-lg hover:text-amber-600 transition-all">
                      <mat-icon class="!text-lg">rebase_edit</mat-icon>
                    </button>
                  }

                  <!-- FEEDBACK button — approved jobs without a review -->
                  @else if (b.status === 'Approved' && !b.hasReview) {
                    <button (click)="openReviewModal(b)"
                            class="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-black
                                   uppercase tracking-widest hover:bg-primary transition-all">
                      Feedback
                    </button>
                  }

                  <!-- CANCEL button — pending jobs -->
                  @else if (b.status === 'Pending') {
                    <button (click)="state.updateJobStatus(b.id, 'CANCELLED')"
                            class="px-3 py-1.5 border border-slate-200 text-slate-400 rounded-lg text-[9px]
                                   font-black uppercase tracking-widest hover:text-rose-600 hover:border-rose-100 transition-all">
                      Cancel
                    </button>
                  }

                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                class="hover:bg-slate-50 transition-colors"></tr>
          </table>
        </div>

        <!-- Pagination -->
        @if (totalPages() > 1) {
          <div class="p-4 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
            <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Page {{ currentPage() }} of {{ totalPages() }}
            </span>
            <div class="flex gap-2">
              <button (click)="goToPage(currentPage() - 1)" [disabled]="currentPage() === 1"
                      class="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200
                             text-slate-400 disabled:opacity-30 hover:text-primary transition-all">
                <mat-icon class="!text-lg">chevron_left</mat-icon>
              </button>
              <button (click)="goToPage(currentPage() + 1)" [disabled]="currentPage() === totalPages()"
                      class="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200
                             text-slate-400 disabled:opacity-30 hover:text-primary transition-all">
                <mat-icon class="!text-lg">chevron_right</mat-icon>
              </button>
            </div>
          </div>
        }

        @if (state.bookings().length === 0) {
          <div class="p-20 text-center">
            <h3 class="text-xl font-black text-slate-900 mb-2">No bookings yet</h3>
            <p class="text-slate-400 text-xs mb-8">Start your first project from the marketplace.</p>
            <button mat-flat-button routerLink="/client/marketplace"
                    class="!bg-primary !text-white !rounded-xl !px-8 !py-4 !font-black !text-[10px] !uppercase !tracking-widest">
              Browse Professionals
            </button>
          </div>
        }
      </div>

      <!-- PAY MODAL -->
      @if (payModal) {
        <div class="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div class="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" (click)="closePayModal()"></div>
          <div class="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in-95 duration-300">

            <h3 class="text-2xl font-black text-slate-900 mb-1">
              {{ payModal.retrying ? 'Retry Payment' : 'Fund Escrow' }}
            </h3>
            <p class="text-slate-400 text-sm mb-8">
              KES <span class="font-black text-slate-800">{{ payModal.booking.earnings | number }}</span>
              will be held securely until you approve the work.
            </p>

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
                      [disabled]="payModal.loading || !payModal.phone"
                      class="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs
                             uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-40
                             disabled:cursor-wait transition-all active:scale-95">
                {{ payModal.loading ? 'Sending...' : 'Send STK Push' }}
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
            <h3 class="text-2xl font-black text-slate-900 mb-2">Release Funds?</h3>
            <p class="text-slate-400 text-sm mb-2">
              You are about to release
              <span class="font-black text-slate-800">KES {{ releaseConfirm.earnings | number }}</span>
              to <span class="font-black text-slate-800">{{ releaseConfirm.workerName }}</span>.
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
            <div class="flex justify-center gap-4 mb-12">
              @for (star of [1,2,3,4,5]; track star) {
                <button (click)="reviewRating = star" class="transition-all hover:scale-125 active:scale-95">
                  <mat-icon class="!text-5xl !w-auto !h-auto transition-colors"
                            [ngClass]="reviewRating >= star ? 'text-amber-400' : 'text-slate-100'">
                    star
                  </mat-icon>
                </button>
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

  state        = inject(PlatformStateService);
  private auth    = inject(AuthService);
  private notif   = inject(NotificationService);
  private payment = inject(PaymentService);
  private snack   = inject(MatSnackBar);

  displayedColumns = ['worker', 'date', 'cost', 'status'];

  // Pagination
  currentPage  = signal(1);
  itemsPerPage = signal(8);

  paginatedBookings = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    return this.state.bookings().slice(start, start + this.itemsPerPage());
  });
  totalPages = computed(() => Math.ceil(this.state.bookings().length / this.itemsPerPage()));
  goToPage(p: number) { if (p >= 1 && p <= this.totalPages()) this.currentPage.set(p); }

  // Payment polling state
  pollingJobId   = signal<string | null>(null);
  releasingJobId = signal<string | null>(null);
  private pollSub?: Subscription;

  // Modals
  payModal:      { booking: any; phone: string; loading: boolean; error: string; retrying: boolean } | null = null;
  releaseConfirm: any = null;
  reviewBooking:  any = null;
  reviewRating        = 0;
  reviewComment       = '';

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

  openPayModal(booking: any, retrying = false) {
    this.payModal = { booking, phone: '', loading: false, error: '', retrying };
  }

  closePayModal() { this.payModal = null; }

  submitPayment() {
    if (!this.payModal || !this.payModal.phone) return;
    const { booking, phone } = this.payModal;

    this.payModal.loading = true;
    this.payModal.error   = '';

    this.payment.initiateStkPush(booking.id, phone).subscribe({
      next: (resp) => {
        this.closePayModal();
        this.snack.open('STK push sent — check your phone for the PIN prompt', 'OK', { duration: 5000 });
        this.startPolling(booking.id);
      },
      error: (err) => {
        this.payModal!.loading = false;
        this.payModal!.error = err?.error || 'Failed to send STK push. Please try again.';
      }
    });
  }

  // ── Payment Polling ─────────────────────────────────────────────────────

  startPolling(jobId: string) {
    this.pollSub?.unsubscribe();
    this.pollingJobId.set(jobId);

    this.pollSub = this.payment.pollPaymentStatus(jobId).subscribe({
      next: (resp) => {
        if (resp.status === 'ESCROWED') {
          this.pollingJobId.set(null);
          this.snack.open('Payment confirmed! Work is now in progress.', 'OK', { duration: 6000 });
          this.refreshBookings();
        } else if (resp.status === 'FAILED') {
          this.pollingJobId.set(null);
          this.snack.open('Payment failed. Use "Retry Payment" to try again.', 'Retry', { duration: 8000 })
            .onAction().subscribe(() => {
              const b = this.state.bookings().find((b: any) => b.id === jobId);
              if (b) this.openPayModal(b, true);
            });
          this.refreshBookings();
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

    this.payment.releaseEscrow(booking.id).subscribe({
      next: () => {
        this.releasingJobId.set(null);
        this.snack.open('Funds released to worker successfully!', 'OK', { duration: 5000 });
        this.refreshBookings();
      },
      error: (err) => {
        this.releasingJobId.set(null);
        this.snack.open(err?.error || 'Failed to release funds. Please try again.', 'OK', { duration: 5000 });
      }
    });
  }

  // ── Review ──────────────────────────────────────────────────────────────

  openReviewModal(booking: any) { this.reviewBooking = booking; this.reviewRating = 0; this.reviewComment = ''; }

  submitReview() {
    if (!this.reviewBooking || !this.reviewRating) return;
    this.state.submitReview(this.reviewBooking.workerId, this.reviewBooking.id, this.reviewRating, this.reviewComment);
    this.reviewBooking = null;
  }

  // ── CSV Export ──────────────────────────────────────────────────────────

  showHistory() {
    const rows = this.state.bookings().map((b: any) =>
      `${b.clientName},${b.workerName},${b.status},${b.date},${b.earnings}`);
    const csv  = ['Employer,Worker,Status,Date,Amount (KES)', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `bookings-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.notif.success('Booking history exported.');
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  get activeCount()  { return this.state.bookings().filter((b: any) => ['Accepted','In Progress','Submitted'].includes(b.status)).length; }
  get pendingCount() { return this.state.bookings().filter((b: any) => b.status === 'Pending').length; }
  get totalSpent()   { return this.state.bookings().filter((b: any) => ['Approved','Completed'].includes(b.status)).reduce((s: number, b: any) => s + b.earnings, 0); }

  getStatusClasses(status: string) {
    const base = 'px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider border transition-colors ';
    switch ((status || '').toLowerCase()) {
      case 'approved':           return base + 'bg-slate-50 text-indigo-600 border-indigo-100';
      case 'submitted':          return base + 'bg-emerald-50/50 text-emerald-600 border-emerald-100';
      case 'pending':            return base + 'bg-slate-50 text-slate-500 border-slate-200';
      case 'in progress':        return base + 'bg-indigo-50/30 text-indigo-500 border-indigo-100';
      case 'accepted':           return base + 'bg-blue-50 text-blue-600 border-blue-100';
      case 'cancelled':          return base + 'bg-slate-50 text-rose-400 border-rose-100';
      case 'disputed':           return base + 'bg-rose-50 text-rose-600 border-rose-200';
      case 'revision requested': return base + 'bg-amber-50 text-amber-600 border-amber-100';
      default:                   return base + 'bg-slate-50 text-slate-400 border-slate-100';
    }
  }

  ngOnDestroy() { this.pollSub?.unsubscribe(); }
}