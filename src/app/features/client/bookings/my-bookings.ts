import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { PlatformStateService } from '../../../core/services/platform-state.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-client-bookings',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink,
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
            <p class="text-xs text-slate-500 font-medium mt-2">Fiscal year 2026</p>
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
          <mat-card-title class="!text-[10px] !font-black !text-slate-900 !uppercase !tracking-widest !m-0">Active & Past Projects</mat-card-title>
        </mat-card-header>
        
        <table mat-table [dataSource]="state.bookings()" class="w-full">
          <!-- Worker Column -->
          <ng-container matColumnDef="worker">
            <th mat-header-cell *matHeaderCellDef class="!bg-slate-900 !text-white !font-black !text-[10px] !uppercase !tracking-widest">Professional</th>
            <td mat-cell *matCellDef="let booking" data-label="Professional">
              <div class="flex items-center gap-4 py-6">
                <div class="h-10 w-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-700 font-black text-[11px] uppercase border border-indigo-100 shadow-sm">{{ booking.workerInitials }}</div>
                <div>
                  <p class="text-sm font-black text-slate-900 leading-tight">{{ booking.workerName }}</p>
                  <p class="text-[10px] text-slate-400 font-black uppercase mt-1">{{ booking.service }}</p>
                </div>
              </div>
            </td>
          </ng-container>

          <!-- Date Column -->
          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef class="!bg-slate-900 !text-white !font-black !text-[10px] !uppercase !tracking-widest">Date</th>
            <td mat-cell *matCellDef="let booking" data-label="Date" class="text-sm font-bold text-slate-500">{{ booking.date }}</td>
          </ng-container>

          <!-- Cost Column -->
          <ng-container matColumnDef="cost">
            <th mat-header-cell *matHeaderCellDef class="!bg-slate-900 !text-white !font-black !text-[10px] !uppercase !tracking-widest">Cost</th>
            <td mat-cell *matCellDef="let booking" data-label="Cost" class="text-sm font-black text-slate-900">$\{{ booking.earnings }}</td>
          </ng-container>

          <!-- Status Column -->
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef class="!bg-slate-900 !text-white !font-black !text-[10px] !uppercase !tracking-widest text-right">Status</th>
            <td mat-cell *matCellDef="let booking" data-label="Status" class="text-right">
              <span class="inline-block px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest" 
                    [ngClass]="getStatusClasses(booking.status)">
                {{ booking.status }}
              </span>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="hover:bg-slate-50 transition-colors"></tr>
        </table>

        @if (state.bookings().length === 0) {
            <div class="p-20 text-center bg-slate-50">
                <mat-icon class="!text-6xl !w-auto !h-auto text-slate-200 mb-6">work_history</mat-icon>
                <h3 class="text-2xl font-black text-slate-900 mb-2">No Hires Yet</h3>
                <p class="text-slate-500 font-medium">Browse the marketplace to find and connect with top-tier professionals.</p>
                <button mat-flat-button color="primary" class="mt-8 !rounded-xl !px-8 !py-4 !font-black !text-[10px] !uppercase !tracking-widest" routerLink="/client/marketplace">Explore Marketplace</button>
            </div>
        }
      </mat-card>
    </div>
  `,
  styles: [`
    :host { display: block; }
    
    @media (max-width: 768px) {
      .text-5xl { font-size: 2.5rem !important; }
      .p-8, .p-20 { padding: 1.5rem !important; }
      .grid-cols-3 { grid-template-columns: 1fr !important; }
      
      /* Mobile Table Handling */
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

  showHistory() {
    this.notification.info('Viewing historical records (Simulation)');
  }

  get activeCount() { return this.state.bookings().filter(b => b.status === 'Approved' || b.status === 'Processing').length; }
  get pendingCount() { return this.state.bookings().filter(b => b.status === 'Pending').length; }
  get totalSpent() { 
    return this.state.bookings()
      .filter(b => b.status === 'Approved' || b.status === 'Completed')
      .reduce((sum, b) => sum + b.earnings, 0); 
  }

  getStatusClasses(status: string) {
    switch (status) {
      case 'Approved': return 'bg-teal-50 text-teal-700';
      case 'Pending': return 'bg-blue-50 text-blue-700';
      case 'Processing': return 'bg-amber-50 text-amber-700';
      case 'Completed': return 'bg-slate-100 text-slate-600';
      default: return 'bg-slate-50 text-slate-500';
    }
  }
}
