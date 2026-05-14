import { Component, inject } from '@angular/core';
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
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-700">
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 class="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-3">My Bookings</h1>
          <p class="text-slate-500 font-medium text-lg max-w-2xl">Manage your project lifecycle, track escrow status, and collaborate with your professionals.</p>
        </div>
        <button (click)="showHistory()" class="group relative px-8 py-4 bg-white border-2 border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-600 hover:border-indigo-600 hover:text-indigo-600 transition-all flex items-center gap-3 shadow-sm hover:shadow-md">
          <mat-icon class="!w-5 !h-5 group-hover:rotate-12 transition-transform">history</mat-icon>
          Export History
        </button>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <div class="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
            <div class="flex items-center gap-4 mb-4">
              <div class="p-3 bg-slate-50 rounded-2xl text-slate-400 group-hover:text-indigo-600 transition-colors"><mat-icon>engineering</mat-icon></div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Active Hires</p>
            </div>
            <p class="text-4xl font-black text-slate-900 tracking-tighter">{{ activeCount }}</p>
            <div class="mt-4 flex items-center gap-2">
              <span class="w-2 h-2 bg-emerald-400 rounded-full"></span>
              <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Infrastructure Optimal</p>
            </div>
        </div>
        
        <div class="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
            <div class="flex items-center gap-4 mb-4">
              <div class="p-3 bg-slate-50 rounded-2xl text-slate-400 group-hover:text-indigo-600 transition-colors"><mat-icon>payments</mat-icon></div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Net Investment</p>
            </div>
            <p class="text-4xl font-black text-slate-900 tracking-tighter">$\{{ totalSpent }}</p>
            <p class="text-[10px] text-slate-400 font-bold mt-4 uppercase tracking-wider">Across {{ state.bookings().length }} connections</p>
        </div>

        <div class="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group border-b-4 border-b-indigo-500/20">
            <div class="flex items-center gap-4 mb-4">
              <div class="p-3 bg-slate-50 rounded-2xl text-slate-400 group-hover:text-indigo-600 transition-colors"><mat-icon>pending_actions</mat-icon></div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Pending Response</p>
            </div>
            <p class="text-4xl font-black text-slate-900 tracking-tighter">{{ pendingCount }}</p>
            <p class="text-[10px] text-slate-400 font-bold mt-4 uppercase tracking-wider italic">Awaiting acceptance</p>
        </div>
      </div>

      <!-- Bookings Section -->
      <div class="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden mb-12">
        <div class="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
          <div class="flex items-center gap-3">
            <div class="w-2 h-8 bg-indigo-600 rounded-full"></div>
            <h2 class="text-[12px] font-black text-slate-900 uppercase tracking-[0.2em]">Project Lifecycle Management</h2>
          </div>
        </div>
        
        <div class="overflow-x-auto">
          <table mat-table [dataSource]="state.bookings()" class="w-full min-w-[900px]">
            <!-- Worker Column -->
            <ng-container matColumnDef="worker">
              <th mat-header-cell *matHeaderCellDef class="!px-8 !py-6 !bg-white !text-slate-400 !font-black !text-[11px] !uppercase !tracking-widest">Professional</th>
              <td mat-cell *matCellDef="let booking" class="!px-8 !py-8">
                <div class="flex items-center gap-5">
                  <div class="relative h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-lg uppercase border border-slate-200 shadow-sm overflow-hidden group">
                    @if (booking.workerImage) { 
                      <img [src]="booking.workerImage" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"> 
                    } @else { {{ booking.workerInitials }} }
                  </div>
                  <div>
                    <p class="text-lg font-black text-slate-900 tracking-tight leading-tight mb-1">{{ booking.workerName }}</p>
                    <p class="text-[11px] text-slate-400 font-black uppercase tracking-wider flex items-center gap-2">
                      <span class="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                      {{ booking.service }}
                    </p>
                  </div>
                </div>
              </td>
            </ng-container>

            <!-- Date Column -->
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef class="!px-8 !py-6 !bg-white !text-slate-400 !font-black !text-[11px] !uppercase !tracking-widest text-center">Timeline</th>
              <td mat-cell *matCellDef="let booking" class="!px-8 !py-8 text-center">
                 <p class="text-[15px] font-black text-slate-900 mb-1">{{ booking.date }}</p>
                 <span class="px-3 py-1 bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-full">Requested</span>
              </td>
            </ng-container>

            <!-- Cost Column -->
            <ng-container matColumnDef="cost">
              <th mat-header-cell *matHeaderCellDef class="!px-8 !py-6 !bg-white !text-slate-400 !font-black !text-[11px] !uppercase !tracking-widest text-center">Escrow Status</th>
              <td mat-cell *matCellDef="let booking" class="!px-8 !py-8 text-center">
                  <div class="flex flex-col items-center gap-2">
                    <span class="text-xl font-black text-slate-900 tracking-tighter">$\{{ booking.earnings }}</span>
                    <div [ngClass]="booking.status === 'Completed' ? 'text-emerald-500' : 'text-slate-400'" 
                         class="px-3 py-1 bg-slate-50 rounded-lg border border-slate-100 text-[9px] font-black uppercase tracking-[0.1em] flex items-center gap-2">
                       <mat-icon class="!text-[12px] !w-auto !h-auto">{{ booking.status === 'Completed' ? 'lock_open' : 'lock' }}</mat-icon>
                       {{ booking.status === 'Completed' ? 'Released' : 'In Escrow' }}
                    </div>
                  </div>
              </td>
            </ng-container>

            <!-- Status Column -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef class="!px-8 !py-6 !bg-white !text-slate-400 !font-black !text-[11px] !uppercase !tracking-widest text-right">Lifecycle Management</th>
              <td mat-cell *matCellDef="let booking" class="!px-8 !py-8">
                <div class="flex flex-col items-end gap-3">
                  <span [ngClass]="getStatusClasses(booking.status)">
                    {{ booking.status }}
                  </span>
                  
                  <div class="flex items-center gap-3">
                    @if (state.updatingJobIds().has(booking.id)) {
                      <div class="px-6 py-3"><mat-icon class="animate-spin text-indigo-600 !w-6 !h-6">sync</mat-icon></div>
                    } @else {
                      @if (booking.status === 'Pending') {
                        <button (click)="state.updateJobStatus(booking.id, 'CANCELLED')" class="px-5 py-3 bg-white text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:text-rose-600 hover:bg-rose-50 transition-all border border-slate-200 hover:border-rose-100 flex items-center gap-2">
                          <mat-icon class="!w-4 !h-4">close</mat-icon>
                          Cancel Request
                        </button>
                      }
                      @if (booking.status === 'Submitted') {
                        <div class="flex items-center gap-2">
                          <button (click)="state.updateJobStatus(booking.id, 'APPROVED')" class="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center gap-2 shadow-lg shadow-slate-900/10">
                            <mat-icon class="!w-4 !h-4">check_circle</mat-icon>
                            Release Funds
                          </button>
                          
                          <div class="h-8 w-px bg-slate-100 mx-1"></div>
                          
                          <button (click)="state.updateJobStatus(booking.id, 'REVISION_REQUESTED')" class="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-amber-600 hover:border-amber-200 transition-all" title="Request Revision">
                            <mat-icon class="!w-5 !h-5">rebase_edit</mat-icon>
                          </button>
                          
                          <button (click)="state.updateJobStatus(booking.id, 'DISPUTED')" class="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-rose-600 hover:border-rose-200 transition-all" title="Dispute">
                            <mat-icon class="!w-5 !h-5">report</mat-icon>
                          </button>
                        </div>
                      }
                      @if (booking.status === 'Approved' && !booking.hasReview) {
                        <button (click)="openReviewModal(booking)" class="px-10 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10 hover:bg-indigo-600 transition-all flex items-center gap-2 group">
                          <mat-icon class="!w-4 !h-4 group-hover:rotate-12 transition-transform">star</mat-icon>
                          Submit Feedback
                        </button>
                      }
                      @if (booking.status === 'Accepted' || booking.status === 'Revision Requested' || booking.status === 'In Progress') {
                         <div class="px-6 py-3.5 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest italic flex items-center gap-3">
                            <span class="flex gap-1">
                              <span class="w-1 h-1 bg-slate-300 rounded-full animate-bounce"></span>
                              <span class="w-1 h-1 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                              <span class="w-1 h-1 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                            </span>
                            Awaiting delivery
                         </div>
                      }
                    }
                  </div>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="group hover:bg-slate-50/50 transition-colors"></tr>
          </table>
        </div>

        @if (state.bookings().length === 0) {
            <div class="p-32 text-center">
                <div class="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-slate-200">
                  <mat-icon class="!text-5xl !w-auto !h-auto">receipt_long</mat-icon>
                </div>
                <h3 class="text-3xl font-black text-slate-900 mb-3 tracking-tight">No project history yet</h3>
                <p class="text-slate-400 font-medium max-w-sm mx-auto mb-10">Start your first project today with our vetted professionals from the marketplace.</p>
                <button mat-flat-button class="!bg-indigo-600 !text-white !rounded-2xl !px-12 !py-7 !font-black !text-[12px] !uppercase !tracking-[0.2em] !shadow-2xl !shadow-indigo-600/30 hover:scale-105 transition-transform" routerLink="/client/marketplace">
                  Browse Marketplace
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
    const base = 'px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-colors ';
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
