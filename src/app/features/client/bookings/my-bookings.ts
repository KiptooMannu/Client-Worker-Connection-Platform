import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { PlatformStateService } from '../../../core/services/platform-state.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-client-bookings',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink,
    FormsModule,
    MatCardModule, 
    MatButtonModule, 
    MatIconModule, 
    MatTableModule, 
    MatChipsModule,
    MatDividerModule,
  ],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-in fade-in duration-700 font-manrope">
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-2xl font-black text-slate-900 tracking-tight">My Work History</h1>
          <p class="text-slate-500 font-medium text-xs">Track your work and payments here.</p>
        </div>
        <button (click)="showHistory()" class="px-4 py-2 bg-white border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-600 hover:border-primary transition-all flex items-center gap-2">
          <mat-icon class="!w-4 !h-4">history</mat-icon>
          Export
        </button>
      </div>

      <!-- Compact Stats Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div class="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400"><mat-icon class="!text-xl">engineering</mat-icon></div>
          <div>
            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ongoing Work</p>
            <p class="text-xl font-black text-slate-900">{{ activeCount }}</p>
          </div>
        </div>
        <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div class="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400"><mat-icon class="!text-xl">payments</mat-icon></div>
          <div>
            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Paid</p>
            <p class="text-xl font-black text-slate-900">$\{{ totalSpent }}</p>
          </div>
        </div>
        <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div class="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400"><mat-icon class="!text-xl">pending_actions</mat-icon></div>
          <div>
            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pending</p>
            <p class="text-xl font-black text-slate-900">{{ pendingCount }}</p>
          </div>
        </div>
      </div>

      <!-- Bookings Section -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-12">
        <div class="overflow-x-auto">
          <table mat-table [dataSource]="paginatedBookings()" class="w-full min-w-[900px]">
            <!-- Worker Column -->
            <ng-container matColumnDef="worker">
              <th mat-header-cell *matHeaderCellDef class="!px-6 !py-4 !bg-slate-50/50 !text-slate-400 !font-black !text-[10px] !uppercase !tracking-widest">Worker</th>
              <td mat-cell *matCellDef="let booking" class="!px-6 !py-4">
                <div class="flex items-center gap-4">
                  <div class="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xs uppercase border border-slate-200 overflow-hidden">
                    @if (booking.workerImage) { 
                      <img [src]="booking.workerImage" class="w-full h-full object-cover"> 
                    } @else { {{ booking.workerInitials }} }
                  </div>
                  <div>
                    <p class="text-sm font-black text-slate-900 leading-tight mb-0.5">{{ booking.workerName }}</p>
                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{{ booking.service }}</p>
                  </div>
                </div>
              </td>
            </ng-container>

            <!-- Date Column -->
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef class="!px-6 !py-4 !bg-slate-50/50 !text-slate-400 !font-black !text-[10px] !uppercase !tracking-widest text-center">Date</th>
              <td mat-cell *matCellDef="let booking" class="!px-6 !py-4 text-center">
                 <p class="text-[12px] font-bold text-slate-900">{{ booking.date }}</p>
              </td>
            </ng-container>

            <!-- Cost Column -->
            <ng-container matColumnDef="cost">
              <th mat-header-cell *matHeaderCellDef class="!px-6 !py-4 !bg-slate-50/50 !text-slate-400 !font-black !text-[10px] !uppercase !tracking-widest text-center">Cost</th>
              <td mat-cell *matCellDef="let booking" class="!px-6 !py-4 text-center">
                  <div class="flex flex-col items-center">
                    <span class="text-sm font-black text-slate-900">$\{{ booking.earnings }}</span>
                    <span class="text-[9px] font-black uppercase text-slate-400">{{ booking.status === 'Completed' ? 'Released' : 'Escrowed' }}</span>
                  </div>
              </td>
            </ng-container>

            <!-- Status Column -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef class="!px-6 !py-4 !bg-slate-50/50 !text-slate-400 !font-black !text-[10px] !uppercase !tracking-widest text-right">Lifecycle</th>
              <td mat-cell *matCellDef="let booking" class="!px-6 !py-4">
                <div class="flex items-center justify-end gap-4">
                  <span [ngClass]="getStatusClasses(booking.status)" class="min-w-[80px] text-center">
                    {{ booking.status }}
                  </span>
                  
                  <div class="flex items-center gap-2">
                    @if (state.updatingJobIds().has(booking.id)) {
                      <mat-icon class="animate-spin text-primary !w-5 !h-5">sync</mat-icon>
                    } @else {
                      @if (booking.status === 'Pending') {
                        <button (click)="state.updateJobStatus(booking.id, 'CANCELLED')" class="px-3 py-1.5 border border-slate-200 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest hover:text-rose-600 hover:border-rose-100 transition-all">
                          Cancel
                        </button>
                      }
                      @if (booking.status === 'Submitted') {
                        <button (click)="state.updateJobStatus(booking.id, 'APPROVED')" class="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-primary transition-all shadow-sm">
                          Release
                        </button>
                        <button (click)="state.updateJobStatus(booking.id, 'REVISION_REQUESTED')" class="w-8 h-8 flex items-center justify-center border border-slate-200 text-slate-400 rounded-lg hover:text-amber-600 transition-all">
                          <mat-icon class="!text-lg">rebase_edit</mat-icon>
                        </button>
                      }
                      @if (booking.status === 'Approved' && !booking.hasReview) {
                        <button (click)="openReviewModal(booking)" class="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-primary transition-all">
                          Feedback
                        </button>
                      }
                    }
                  </div>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="hover:bg-slate-50 transition-colors"></tr>
          </table>
        </div>

        @if (totalPages() > 1) {
          <div class="p-4 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
            <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Page {{ currentPage() }} of {{ totalPages() }}
            </span>
            <div class="flex gap-2">
              <button (click)="goToPage(currentPage() - 1)" [disabled]="currentPage() === 1" class="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 disabled:opacity-30 hover:text-primary transition-all">
                <mat-icon class="!text-lg">chevron_left</mat-icon>
              </button>
              <button (click)="goToPage(currentPage() + 1)" [disabled]="currentPage() === totalPages()" class="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 disabled:opacity-30 hover:text-primary transition-all">
                <mat-icon class="!text-lg">chevron_right</mat-icon>
              </button>
            </div>
          </div>
        }

        @if (state.bookings().length === 0) {
            <div class="p-20 text-center">
                <h3 class="text-xl font-black text-slate-900 mb-2">No bookings yet</h3>
                <p class="text-slate-400 text-xs mb-8">Start your first project from the marketplace.</p>
                <button mat-flat-button class="!bg-primary !text-white !rounded-xl !px-8 !py-4 !font-black !text-[10px] !uppercase !tracking-widest" routerLink="/client/marketplace">
                  Browse Professionals
                </button>
            </div>
        }
      </div>

      <!-- Review Modal -->
      @if (reviewBooking) {
         <div class="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10">
            <div class="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" (click)="reviewBooking = null"></div>
            <div class="relative bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl p-12 sm:p-16 animate-in zoom-in-95 duration-500 overflow-hidden">
               <!-- Decorative elements -->
               <div class="absolute top-0 right-0 p-12 text-slate-50 opacity-10">
                 <mat-icon class="!text-9xl !w-auto !h-auto">rate_review</mat-icon>
               </div>
               
               <h3 class="text-4xl font-black text-slate-900 tracking-tight mb-3 relative">How was the experience?</h3>
               <p class="text-slate-500 font-medium mb-12 relative text-lg">Your honest feedback helps {{ reviewBooking.workerName }} and guides the community.</p>
               
               <!-- Star Rating -->
               <div class="flex justify-center gap-4 mb-12 relative">
                  @for (star of [1,2,3,4,5]; track star) {
                     <button (click)="reviewRating = star" class="transition-all hover:scale-125 active:scale-95 group">
                        <mat-icon class="!text-5xl !w-auto !h-auto transition-colors" 
                                 [ngClass]="reviewRating >= star ? 'text-amber-400 fill-star drop-shadow-xl' : 'text-slate-100 group-hover:text-slate-200'">
                           star
                        </mat-icon>
                     </button>
                  }
               </div>

               <div class="space-y-6 relative">
                  <textarea [(ngModel)]="reviewComment" 
                            name="reviewComment"
                            class="w-full h-40 bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-6 text-slate-700 text-lg font-medium placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all outline-none resize-none"
                            placeholder="Tell us about the project quality, communication, and professionalism..."></textarea>
                  
                  <div class="flex gap-4">
                    <button (click)="reviewBooking = null" class="flex-1 py-5 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">
                      Cancel
                    </button>
                    <button (click)="submitReview()" 
                            [disabled]="!reviewRating"
                            class="flex-[2] bg-slate-950 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-95">
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
    .fill-star { font-variation-settings: 'FILL' 1; }
    
    /* Remove default table cell borders and shadows */
    .mat-mdc-table { background: transparent !important; }
    .mat-mdc-row, .mat-mdc-header-row { border-bottom: 1px solid #f8fafc !important; }
    .mat-mdc-cell, .mat-mdc-header-cell { border-bottom: none !important; }

    /* Custom Responsive Logic via Media Queries */
    @media (max-width: 1024px) {
      .max-w-7xl { padding-left: 2rem; padding-right: 2rem; }
    }

    @media (max-width: 768px) {
      .text-5xl { font-size: 2.75rem !important; }
      .p-32 { padding: 4rem 1rem !important; }
      
      /* Transform table to cards on small screens */
      .mat-mdc-table { display: block !important; }
      .mat-mdc-header-row { display: none !important; }
      .mat-mdc-row {
        display: block !important;
        background: #fff;
        margin-bottom: 1.5rem;
        padding: 2rem !important;
        border: 1px solid #f1f5f9 !important;
        border-radius: 2.5rem !important;
        height: auto !important;
      }
      .mat-mdc-cell {
        display: block !important;
        padding: 1rem 0 !important;
        text-align: left !important;
        width: 100% !important;
        border: none !important;
      }
      .mat-mdc-cell::before {
        content: attr(data-label);
        display: block;
        font-weight: 900;
        text-transform: uppercase;
        font-size: 10px;
        color: #94a3b8;
        letter-spacing: 0.1em;
        margin-bottom: 0.75rem;
      }
      
      .mat-column-status { text-align: left !important; }
      .flex-col.items-end { align-items: flex-start !important; }
      .justify-end { justify-content: flex-start !important; }
    }
  `]
})
export class ClientBookingsPage {
  state = inject(PlatformStateService);
  private notification = inject(NotificationService);
  displayedColumns: string[] = ['worker', 'date', 'cost', 'status'];

  // Pagination
  currentPage = signal(1);
  itemsPerPage = signal(8);

  paginatedBookings = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    return this.state.bookings().slice(start, start + this.itemsPerPage());
  });

  totalPages = computed(() => Math.ceil(this.state.bookings().length / this.itemsPerPage()));

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  // Review State
  reviewBooking: any = null;
  reviewRating: number = 0;
  reviewComment: string = '';

  openReviewModal(booking: any) {
    this.reviewBooking = booking;
    this.reviewRating = 0;
    this.reviewComment = '';
  }

  submitReview() {
    if (!this.reviewBooking || !this.reviewRating) return;
    this.state.submitReview(
      this.reviewBooking.workerId,
      this.reviewBooking.id,
      this.reviewRating,
      this.reviewComment
    );
    this.reviewBooking = null;
  }

  showHistory() {
    const rows = this.state.bookings().map(b =>
      `${b.clientName},${b.workerName},${b.status},${b.date},${b.earnings}`
    );
    const csv = ['client,worker,status,date,amount', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `booking-history-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.notification.success('Booking history exported.');
  }

  get activeCount() { 
    return this.state.bookings().filter(b => 
      b.status === 'Approved' || 
      b.status === 'Accepted' || 
      b.status === 'Processing' || 
      b.status === 'In Progress'
    ).length; 
  }
  get pendingCount() { return this.state.bookings().filter(b => b.status === 'Pending').length; }
  get totalSpent() { 
    return this.state.bookings()
      .filter(b => b.status === 'Approved' || b.status === 'Completed' || b.status === 'Accepted')
      .reduce((sum, b) => sum + b.earnings, 0); 
  }

  getStatusClasses(status: string) {
    const s = status ? status.toLowerCase() : '';
    const base = 'px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider border transition-colors ';
    switch (s) {
      case 'approved': return base + 'bg-slate-50 text-indigo-600 border-indigo-100';
      case 'submitted': return base + 'bg-emerald-50/50 text-emerald-600 border-emerald-100';
      case 'pending': return base + 'bg-slate-50 text-slate-500 border-slate-200';
      case 'processing': 
      case 'in progress': return base + 'bg-indigo-50/30 text-indigo-500 border-indigo-100';
      case 'completed': return base + 'bg-slate-50 text-slate-400 border-slate-100';
      case 'cancelled': return base + 'bg-slate-50 text-rose-400 border-rose-100';
      case 'disputed': return base + 'bg-rose-50 text-rose-600 border-rose-200';
      case 'revision requested': return base + 'bg-amber-50 text-amber-600 border-amber-100';
      default: return base + 'bg-slate-50 text-slate-400 border-slate-100';
    }
  }
}
