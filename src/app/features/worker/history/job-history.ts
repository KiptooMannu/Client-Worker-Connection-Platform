import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { PlatformStateService } from '../../../core/services/platform-state.service';
import { inject, computed, signal } from '@angular/core';

@Component({
  selector: 'app-worker-history',
  standalone: true,
  imports: [
    CommonModule, 
    MatCardModule, 
    MatButtonModule, 
    MatIconModule, 
    MatTableModule, 
    MatChipsModule,
    MatDividerModule,
    FormsModule
  ],
  template: `
    <div class="space-y-8 animate-in fade-in duration-500">
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 class="text-5xl font-black text-slate-900 tracking-tighter">Job History & Analytics</h1>
          <p class="text-slate-500 font-medium mt-2">Review your past performance and financial growth metrics.</p>
        </div>
        <div class="flex flex-wrap gap-3">
          <div class="flex items-center border border-slate-200 rounded-xl px-4 py-2 bg-white focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/10 transition-all w-64">
            <mat-icon class="text-slate-400 mr-2 !text-sm">search</mat-icon>
            <input class="w-full border-none focus:ring-0 bg-transparent text-xs font-bold" placeholder="Search client or service..." type="text" [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($any($event))"/>
          </div>
          <button mat-stroked-button class="!border-slate-300 !px-6 !py-4 !rounded-xl !font-black !text-xs !uppercase !tracking-widest flex items-center gap-2">
            <mat-icon>download</mat-icon> Export PDF
          </button>
        </div>
      </div>

      <!-- Analytics Grid -->
      <div class="grid grid-cols-1 md:grid-cols-12 gap-8">
        <mat-card class="md:col-span-8 !rounded-3xl !border !border-slate-100 !shadow-sm !p-10">
          <div class="flex justify-between items-center mb-12">
            <h3 class="text-2xl font-black text-slate-900 tracking-tight">Monthly Earnings</h3>
            <mat-chip class="!bg-teal-50 !text-teal-700 !border-none !min-h-0 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
              <mat-icon class="!text-xs !w-auto !h-auto mr-1">trending_up</mat-icon> +12%
            </mat-chip>
          </div>
          <div class="h-72 flex items-end justify-between gap-6 px-4 border-b border-slate-100 pb-2">
            @for (bar of earnings; track $index) {
              <div class="flex flex-col items-center gap-4 flex-1 group">
                <div class="w-full bg-slate-100 rounded-t-xl transition-all group-hover:bg-blue-600 group-hover:shadow-xl group-hover:shadow-blue-900/20" 
                     [ngClass]="{'!bg-blue-600 !shadow-xl !shadow-blue-900/20': bar.active}" 
                     [style.height]="bar.height + '%'"></div>
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">{{ bar.label }}</span>
              </div>
            }
          </div>
        </mat-card>

        <mat-card class="md:col-span-4 !rounded-3xl !bg-slate-900 !text-white !shadow-2xl !p-10 flex flex-col justify-between">
          <div>
            <h3 class="text-2xl font-black mb-2 tracking-tight">Performance Insights</h3>
            <p class="text-slate-400 text-sm font-medium">Your service quality remains in the top 5% of providers.</p>
          </div>
          <div class="space-y-8 my-10">
            @for (m of metrics; track m.label) {
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <div class="p-2 bg-white/5 rounded-xl border border-white/10"><mat-icon class="!text-blue-400">{{ m.icon }}</mat-icon></div>
                  <span class="text-sm font-bold">{{ m.label }}</span>
                </div>
                <span class="text-2xl font-black text-blue-400 tracking-tighter">{{ m.value }}</span>
              </div>
            }
          </div>
          <button mat-flat-button class="!bg-white/5 !text-slate-400 hover:!bg-white/10 !py-6 !rounded-2xl !font-black !text-[10px] !uppercase !tracking-widest !border !border-white/10">
            View Detailed Metrics
          </button>
        </mat-card>
      </div>

      <!-- Table Section -->
      <mat-card class="!rounded-3xl !border !border-slate-100 !shadow-sm !overflow-hidden">
        <mat-card-header class="!p-8 !border-b !border-slate-50 !bg-slate-50/50 flex !flex-row !justify-between !items-center">
          <mat-card-title class="!text-[10px] !font-black !text-slate-900 !uppercase !tracking-widest !m-0">Complete Job Ledger</mat-card-title>
          <span class="text-[9px] text-slate-400 font-black uppercase tracking-widest">Showing 50 results</span>
        </mat-card-header>
        
        <table mat-table [dataSource]="jobs" class="w-full">
          <!-- Client Column -->
          <ng-container matColumnDef="client">
            <th mat-header-cell *matHeaderCellDef class="!bg-slate-900 !text-white !font-black !text-[10px] !uppercase !tracking-widest">Client Name</th>
            <td mat-cell *matCellDef="let job">
              <div class="flex items-center gap-4 py-6">
                <div class="h-10 w-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-700 font-black text-[11px] uppercase border border-blue-100 shadow-sm">{{ job.initials }}</div>
                <div>
                  <p class="text-sm font-black text-slate-900 leading-tight">{{ job.client }}</p>
                  <p class="text-[10px] text-slate-400 font-black uppercase mt-1">{{ job.service }}</p>
                </div>
              </div>
            </td>
          </ng-container>

          <!-- Date Column -->
          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef class="!bg-slate-900 !text-white !font-black !text-[10px] !uppercase !tracking-widest">Service Date</th>
            <td mat-cell *matCellDef="let job" class="text-sm font-bold text-slate-500">{{ job.date }}</td>
          </ng-container>

          <!-- Earnings Column -->
          <ng-container matColumnDef="earnings">
            <th mat-header-cell *matHeaderCellDef class="!bg-slate-900 !text-white !font-black !text-[10px] !uppercase !tracking-widest">Earnings</th>
            <td mat-cell *matCellDef="let job" class="text-sm font-black text-slate-900">{{ job.earnings }}</td>
          </ng-container>

          <!-- Rating Column -->
          <ng-container matColumnDef="rating">
            <th mat-header-cell *matHeaderCellDef class="!bg-slate-900 !text-white !font-black !text-[10px] !uppercase !tracking-widest text-center">Quality Rating</th>
            <td mat-cell *matCellDef="let job" class="text-center">
              <div class="flex items-center justify-center gap-0.5 text-amber-500">
                @if (job.rating) {
                  @for (s of [1,2,3,4,5]; track s) {
                    <mat-icon class="!text-[14px] !w-auto !h-auto" [style.font-variation-settings]="s <= job.rating ? '\\'FILL\\' 1' : ''">star</mat-icon>
                  }
                } @else {
                  <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Awaiting Review</span>
                }
              </div>
            </td>
          </ng-container>

          <!-- Status Column -->
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef class="!bg-slate-900 !text-white !font-black !text-[10px] !uppercase !tracking-widest text-right">Status</th>
            <td mat-cell *matCellDef="let job" class="text-right">
              <span class="inline-block px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest" [ngClass]="job.statusBg + ' ' + job.statusColor">
                {{ job.status }}
              </span>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let job; columns: displayedColumns;" class="hover:bg-slate-50 transition-colors"></tr>
        </table>

        <div class="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <button mat-button color="primary" class="!font-black !text-[10px] !uppercase !tracking-widest flex items-center gap-1">
            <mat-icon class="!text-sm">chevron_left</mat-icon> Previous
          </button>
          <div class="flex gap-2">
            <button mat-flat-button color="primary" class="!min-w-[40px] !w-10 !h-10 !p-0 !rounded-xl !font-black">1</button>
            <button mat-stroked-button class="!min-w-[40px] !w-10 !h-10 !p-0 !rounded-xl !font-black !border-slate-200">2</button>
          </div>
          <button mat-button color="primary" class="!font-black !text-[10px] !uppercase !tracking-widest flex items-center gap-1">
            Next <mat-icon class="!text-sm">chevron_right</mat-icon>
          </button>
        </div>
      </mat-card>
    </div>
  `
})
export class WorkerHistoryPage {
  state = inject(PlatformStateService);
  displayedColumns: string[] = ['client', 'date', 'earnings', 'rating', 'status'];
  searchQuery = signal<string>('');
  
  earnings = [
    { label: 'JAN', height: 40 },
    { label: 'FEB', height: 60 },
    { label: 'MAR', height: 50 },
    { label: 'APR', height: 85, active: true },
    { label: 'MAY', height: 70 },
    { label: 'JUN', height: 75 }
  ];

  metrics = [
    { label: 'On-time Arrival', value: '98%', icon: 'schedule' },
    { label: 'Completion Rate', value: '100%', icon: 'verified' },
    { label: 'Avg. Rating', value: '4.92', icon: 'star' }
  ];

  get jobs() {
    const query = this.searchQuery().toLowerCase();
    return this.state.bookings()
      .filter(b => !query || b.clientName.toLowerCase().includes(query) || b.service.toLowerCase().includes(query))
      .map(b => ({
        ...b,
        client: b.clientName,
        initials: b.clientInitials,
        service: b.service,
        date: b.date,
        earnings: `$\{{ b.earnings.toFixed(2) }}`,
        rating: b.rating,
        statusBg: b.status === 'Approved' ? 'bg-teal-50' : 'bg-blue-50',
        statusColor: b.status === 'Approved' ? 'text-teal-700' : 'text-blue-700'
      }));
  }
}
