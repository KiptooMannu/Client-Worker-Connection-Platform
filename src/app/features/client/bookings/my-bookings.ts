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
    <div class="space-y-8 animate-in fade-in duration-500">
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 class="text-5xl font-black text-slate-900 tracking-tighter">My Bookings</h1>
          <p class="text-slate-500 font-medium mt-2">Manage your active service requests and past project history.</p>
        </div>
        <div class="flex gap-3">
          <button (click)="showHistory()" mat-stroked-button class="!border-slate-300 !px-6 !py-4 !rounded-xl !font-black !text-xs !uppercase !tracking-widest flex items-center gap-2">
            <mat-icon>history</mat-icon> Booking History
          </button>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <mat-card class="!rounded-3xl !border !border-slate-100 !shadow-sm !p-8">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Active Hires</p>
            <p class="text-4xl font-black text-slate-900 tracking-tighter">{{ activeCount }}</p>
            <p class="text-xs text-teal-600 font-bold mt-2">All systems functional</p>
        </mat-card>
        <mat-card class="!rounded-3xl !border !border-slate-100 !shadow-sm !p-8">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Spent</p>
            <p class="text-4xl font-black text-slate-900 tracking-tighter">$\{{ totalSpent }}</p>
            <p class="text-xs text-slate-500 font-medium mt-2">From completed/approved jobs</p>
        </mat-card>
        <mat-card class="!rounded-3xl !bg-indigo-900 !text-white !shadow-xl !p-8">
            <p class="text-[10px] font-black text-indigo-100 uppercase tracking-widest mb-2">Pending Requests</p>
            <p class="text-4xl font-black text-white tracking-tighter">{{ pendingCount }}</p>
            <p class="text-xs text-indigo-200 font-medium mt-2">Awaiting worker response</p>
        </mat-card>
      </div>

      <!-- Bookings Table -->
      <mat-card class="!rounded-3xl !border !border-slate-100 !shadow-sm !overflow-hidden">
        <mat-card-header class="!p-8 !border-b !border-slate-50 !bg-slate-50/50 flex !flex-row !justify-between !items-center">
          <mat-card-title class="!text-[10px] !font-black !text-slate-900 !uppercase !tracking-widest !m-0">Project Lifecycle Management</mat-card-title>
        </mat-card-header>
        
        <table mat-table [dataSource]="state.bookings()" class="w-full">
          <!-- Worker Column -->
          <ng-container matColumnDef="worker">
            <th mat-header-cell *matHeaderCellDef class="!bg-slate-900 !text-white !font-black !text-[10px] !uppercase !tracking-widest">Professional</th>
            <td mat-cell *matCellDef="let booking" data-label="Professional">
              <div class="flex items-center gap-4 py-6">
                <div class="h-10 w-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-700 font-black text-[11px] uppercase border border-indigo-100 shadow-sm overflow-hidden">
                   @if (booking.workerImage) { <img [src]="booking.workerImage" class="w-full h-full object-cover"> } @else { {{ booking.workerInitials }} }
                </div>
                <div>
                  <p class="text-sm font-black text-slate-900 leading-tight">{{ booking.workerName }}</p>
                  <p class="text-[10px] text-slate-400 font-black uppercase mt-1">{{ booking.service }}</p>
                </div>
              </div>
            </td>
          </ng-container>

          <!-- Date Column -->
          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef class="!bg-slate-900 !text-white !font-black !text-[10px] !uppercase !tracking-widest">Timeline</th>
            <td mat-cell *matCellDef="let booking" data-label="Date">
               <p class="text-sm font-bold text-slate-900">{{ booking.date }}</p>
               <p class="text-[9px] text-slate-400 font-black uppercase mt-0.5 tracking-tighter">Requested</p>
            </td>
          </ng-container>

          <!-- Cost Column -->
          <ng-container matColumnDef="cost">
            <th mat-header-cell *matHeaderCellDef class="!bg-slate-900 !text-white !font-black !text-[10px] !uppercase !tracking-widest">Escrow / Cost</th>
            <td mat-cell *matCellDef="let booking" data-label="Cost">
               <div class="flex flex-col">
                  <span class="text-sm font-black text-slate-900">$\{{ booking.earnings }}</span>
                  <span class="text-[8px] font-black uppercase tracking-widest" [ngClass]="booking.status === 'Completed' ? 'text-teal-600' : 'text-amber-500'">
                     {{ booking.status === 'Completed' ? 'Released' : 'Pending Escrow' }}
                  </span>
               </div>
            </td>
          </ng-container>

          <!-- Status Column -->
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef class="!bg-slate-900 !text-white !font-black !text-[10px] !uppercase !tracking-widest text-right">Lifecycle Status</th>
            <td mat-cell *matCellDef="let booking" data-label="Status" class="text-right">
              <div class="flex flex-col items-end gap-3">
                <span class="inline-block px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm border border-black/5" 
                      [ngClass]="getStatusClasses(booking.status)">
                  {{ booking.status }}
                </span>
                
                <div class="flex gap-2">
                  @if (state.updatingJobIds().has(booking.id)) {
                    <div class="px-4 py-1.5"><mat-icon class="animate-spin text-teal-600 !text-sm !w-auto !h-auto">sync</mat-icon></div>
                  } @else {
                    @if (booking.status === 'Pending') {
                      <button (click)="state.updateJobStatus(booking.id, 'CANCELLED')" class="text-rose-600 text-[9px] font-black uppercase tracking-widest hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors border border-rose-100">
                        Cancel
                      </button>
                    }
                    @if (booking.status === 'Accepted' || booking.status === 'Approved' || booking.status === 'Revision') {
                      <div class="flex gap-2">
                        <button (click)="state.updateJobStatus(booking.id, 'COMPLETED')" class="bg-teal-600 text-white px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg shadow-teal-600/20 hover:scale-105 transition-all">
                          Confirm & Finish
                        </button>
                        <button (click)="state.updateJobStatus(booking.id, 'REVISION')" class="text-amber-600 text-[9px] font-black uppercase tracking-widest hover:bg-amber-50 px-3 py-1.5 rounded-lg transition-colors border border-amber-100">
                          Request Revision
                        </button>
                      </div>
                    }
                    @if (booking.status === 'Completed' && !booking.hasReview) {
                      <button (click)="openReviewModal(booking)" class="bg-[#0f172a] text-white px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-indigo-600 transition-all">
                        Leave Review
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

        @if (state.bookings().length === 0) {
            <div class="p-24 text-center bg-white">
                <mat-icon class="!text-6xl !w-auto !h-auto text-slate-100 mb-6" style="font-variation-settings: 'FILL' 1;">work_history</mat-icon>
                <h3 class="text-2xl font-black text-slate-900 mb-2">No active projects</h3>
                <p class="text-slate-500 font-medium max-w-sm mx-auto">Start building your team by exploring our verified marketplace of skilled professionals.</p>
                <button mat-flat-button class="mt-8 !bg-indigo-600 !text-white !rounded-2xl !px-10 !py-6 !font-black !text-[11px] !uppercase !tracking-widest !shadow-2xl !shadow-indigo-600/30" routerLink="/client/marketplace">Explore Marketplace</button>
            </div>
        }
      </mat-card>

      <!-- Review Modal -->
      @if (reviewBooking) {
         <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" (click)="reviewBooking = null"></div>
            <div class="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in-95 duration-300">
               <h3 class="text-2xl font-black text-slate-900 tracking-tighter mb-2">How was the service?</h3>
               <p class="text-sm text-slate-500 font-medium mb-8">Your feedback helps {{ reviewBooking.workerName }} and other clients.</p>
               
               <!-- Star Rating -->
               <div class="flex justify-center gap-2 mb-8">
                  @for (star of [1,2,3,4,5]; track star) {
                     <button (click)="reviewRating = star" class="transition-all hover:scale-110 active:scale-95">
                        <mat-icon class="!text-4xl !w-auto !h-auto" 
                                 [ngClass]="reviewRating >= star ? 'text-amber-400 fill-star' : 'text-slate-200'">
                           star
                        </mat-icon>
                     </button>
                  }
               </div>

               <div class="space-y-4">
                  <textarea [(ngModel)]="reviewComment" 
                            name="reviewComment"
                            class="w-full h-32 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium placeholder:text-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all outline-none"
                            placeholder="Write your experience here..."></textarea>
                  
                  <button (click)="submitReview()" 
                          [disabled]="!reviewRating"
                          class="w-full bg-[#0f172a] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                     Submit Feedback
                  </button>
               </div>
            </div>
         </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .fill-star { font-variation-settings: 'FILL' 1; }
    
    @media (max-width: 768px) {
      .text-5xl { font-size: 2.5rem !important; }
      .p-8, .p-24, .p-10 { padding: 1.5rem !important; }
      .grid-cols-3 { grid-template-columns: 1fr !important; }
      
      .mat-mdc-table { display: block; }
      .mat-mdc-header-row { display: none; }
      .mat-mdc-row {
        display: flex;
        flex-direction: column;
        padding: 1.5rem;
        border-bottom: 1px solid #f1f5f9;
        height: auto !important;
      }
      .mat-mdc-cell {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem 0 !important;
        border: none !important;
        text-align: left !important;
      }
      .mat-mdc-cell::before {
        content: attr(data-label);
        font-weight: 800;
        text-transform: uppercase;
        font-size: 10px;
        color: #64748b;
      }
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

  get activeCount() { return this.state.bookings().filter(b => b.status === 'Approved' || b.status === 'Accepted' || b.status === 'Processing').length; }
  get pendingCount() { return this.state.bookings().filter(b => b.status === 'Pending' || b.status === 'PENDING').length; }
  get totalSpent() { 
    return this.state.bookings()
      .filter(b => b.status === 'Approved' || b.status === 'Completed' || b.status === 'Accepted')
      .reduce((sum, b) => sum + b.earnings, 0); 
  }

  getStatusClasses(status: string) {
    switch (status) {
      case 'Approved':
      case 'Accepted': return 'bg-teal-50 text-teal-700 border-teal-100';
      case 'Pending': 
      case 'PENDING': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Processing': 
      case 'IN_PROGRESS': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Completed': return 'bg-slate-50 text-slate-500 border-slate-200';
      case 'Cancelled':
      case 'CANCELLED': return 'bg-rose-50 text-rose-500 border-rose-100';
      case 'Revision':
      case 'REVISION': return 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse';
      default: return 'bg-slate-50 text-slate-400 border-slate-100';
    }
  }
}
