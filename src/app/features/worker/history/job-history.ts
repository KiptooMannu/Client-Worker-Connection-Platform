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
import { NotificationService } from '../../../core/services/notification.service';
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
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-in fade-in duration-700">
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 class="text-3xl font-black text-slate-900 tracking-tight mb-1">Job History & Analytics</h1>
          <p class="text-slate-500 font-medium text-sm max-w-2xl">Track your professional growth and financial performance.</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="relative hidden sm:block">
            <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 !text-lg">search</mat-icon>
            <input class="pl-10 pr-4 py-2.5 bg-white border-2 border-slate-100 rounded-xl text-xs font-bold focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all outline-none w-56 shadow-sm" 
                   placeholder="Search projects..." type="text" [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($any($event))"/>
          </div>
          <button (click)="exportHistory()" class="group px-6 py-2.5 bg-white border-2 border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-600 hover:border-indigo-600 hover:text-indigo-600 transition-all flex items-center gap-2 shadow-sm">
            <mat-icon class="!w-4 !h-4">download</mat-icon>
            Export
          </button>
        </div>
      </div>

      <!-- Analytics Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        <div class="lg:col-span-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5">
          <div class="flex justify-between items-center mb-6">
            <div class="flex items-center gap-3">
              <div class="w-2 h-8 bg-teal-500 rounded-full"></div>
              <h3 class="text-xl font-black text-slate-900 tracking-tight">Earnings Momentum</h3>
            </div>
            <span class="px-4 py-1.5 bg-teal-50 text-teal-700 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
              <mat-icon class="!text-xs !w-auto !h-auto">trending_up</mat-icon> {{ state.bookings().length }} Total Jobs
            </span>
          </div>
          <div class="h-48 flex items-end justify-between gap-4 px-4 border-b border-slate-50 pb-4">
            @for (bar of earnings; track $index) {
              <div class="flex flex-col items-center gap-4 flex-1 group relative">
                <div class="w-full bg-slate-50 rounded-2xl transition-all group-hover:bg-indigo-600 group-hover:shadow-2xl group-hover:shadow-indigo-900/20 cursor-pointer overflow-hidden" 
                     [style.height]="bar.height + '%'">
                     <div class="w-full h-full bg-gradient-to-t from-black/5 to-transparent"></div>
                </div>
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-900 transition-colors">{{ bar.label }}</span>
                <!-- Tooltip on hover -->
                <div class="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-lg pointer-events-none">
                  Growth Active
                </div>
              </div>
            }
          </div>
        </div>

        <div class="lg:col-span-4 bg-indigo-950 rounded-[2rem] text-white shadow-2xl p-5 flex flex-col justify-between relative overflow-hidden group">
          <div class="relative z-10">
            <h3 class="text-xl font-black mb-1 tracking-tight">Performance Score</h3>
            <p class="text-indigo-200 text-xs font-medium">Top 5% category leader.</p>
          </div>
          <div class="space-y-4 my-4 relative z-10">
            @for (m of metrics; track m.label) {
              <div class="flex items-center justify-between group/metric">
                <div class="flex items-center gap-3">
                  <div class="p-2 bg-white/10 rounded-xl border border-white/10 group-hover/metric:bg-white/20 transition-colors">
                    <mat-icon class="!text-indigo-200 !text-lg !w-auto !h-auto">{{ m.icon }}</mat-icon>
                  </div>
                  <span class="text-[9px] font-black uppercase tracking-widest text-indigo-100">{{ m.label }}</span>
                </div>
                <span class="text-2xl font-black text-white tracking-tighter">{{ m.value }}</span>
              </div>
            }
          </div>
          <button mat-flat-button (click)="openAnalytics()" class="relative z-10 !bg-white/5 !text-white hover:!bg-white/10 !py-3 !rounded-xl !font-black !text-[9px] !uppercase !tracking-[0.15em] !border !border-white/10 transition-all">
            Deep Insights
          </button>
          <div class="absolute -bottom-10 -right-10 opacity-10 transform rotate-12 group-hover:scale-110 transition-transform duration-700">
            <mat-icon class="!text-[12rem] !w-auto !h-auto">insights</mat-icon>
          </div>
        </div>
      </div>

      <!-- Job Ledger Section -->
      <div class="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden mb-8">
        <div class="p-5 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
          <div class="flex items-center gap-2">
            <div class="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
            <h2 class="text-[11px] font-black text-slate-900 uppercase tracking-[0.15em]">Job Ledger</h2>
          </div>
          <span class="text-[9px] text-slate-400 font-black uppercase tracking-widest hidden sm:block">Showing {{ pagedJobs().length }} records</span>
        </div>
        
        <div class="overflow-x-auto">
          <table mat-table [dataSource]="pagedJobs()" class="w-full min-w-[1000px]">
            <!-- Client Column -->
            <ng-container matColumnDef="client">
              <th mat-header-cell *matHeaderCellDef class="!px-6 !py-4 !bg-white !text-slate-400 !font-black !text-[10px] !uppercase !tracking-widest">Client</th>
              <td mat-cell *matCellDef="let job" class="!px-6 !py-5">
                <div class="flex items-center gap-4">
                  <div class="h-11 w-11 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-sm uppercase border border-indigo-100 shadow-sm">
                    {{ job.initials }}
                  </div>
                  <div>
                    <p class="text-base font-black text-slate-900 tracking-tight leading-tight mb-0.5">{{ job.client }}</p>
                    <p class="text-[9px] text-slate-400 font-black uppercase tracking-wider flex items-center gap-1.5">
                      <span class="w-1 h-1 bg-indigo-500 rounded-full"></span>
                      {{ job.service }}
                    </p>
                  </div>
                </div>
              </td>
            </ng-container>

            <!-- Date Column -->
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef class="!px-6 !py-4 !bg-white !text-slate-400 !font-black !text-[10px] !uppercase !tracking-widest text-center">Date</th>
              <td mat-cell *matCellDef="let job" class="!px-6 !py-5 text-center text-sm font-black text-slate-900">{{ job.date }}</td>
            </ng-container>

            <!-- Earnings Column -->
            <ng-container matColumnDef="earnings">
              <th mat-header-cell *matHeaderCellDef class="!px-6 !py-4 !bg-white !text-slate-400 !font-black !text-[10px] !uppercase !tracking-widest text-center">Net</th>
              <td mat-cell *matCellDef="let job" class="!px-6 !py-5 text-center text-lg font-black text-slate-900 tracking-tighter">{{ job.earnings }}</td>
            </ng-container>

            <!-- Rating Column -->
            <ng-container matColumnDef="rating">
              <th mat-header-cell *matHeaderCellDef class="!px-6 !py-4 !bg-white !text-slate-400 !font-black !text-[10px] !uppercase !tracking-widest text-center">Rating</th>
              <td mat-cell *matCellDef="let job" class="!px-6 !py-5 text-center">
                <div class="flex items-center justify-center gap-0.5 text-amber-400">
                  @if (job.rating) {
                    @for (s of [1,2,3,4,5]; track s) {
                      <mat-icon class="!text-base !w-auto !h-auto drop-shadow-sm" [style.font-variation-settings]="s <= job.rating ? '\\'FILL\\' 1' : ''">star</mat-icon>
                    }
                  } @else {
                    <span class="px-3 py-1 bg-slate-50 text-slate-400 text-[8px] font-black uppercase tracking-widest rounded-full border border-slate-100">Pending</span>
                  }
                </div>
              </td>
            </ng-container>

            <!-- Status Column -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef class="!px-6 !py-4 !bg-white !text-slate-400 !font-black !text-[10px] !uppercase !tracking-widest text-right">Actions</th>
              <td mat-cell *matCellDef="let job" class="!px-6 !py-5">
                <div class="flex items-center justify-end gap-3 flex-wrap sm:flex-nowrap">
                  <span class="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.05em] shadow-sm border flex items-center gap-1.5 whitespace-nowrap" 
                        [ngClass]="job.statusBg + ' ' + job.statusColor">
                    <span class="w-1.5 h-1.5 rounded-full" [class.bg-current]="true" [class.animate-pulse]="job.status === 'Pending'"></span>
                    {{ job.status }}
                  </span>
                  
                  <div class="flex items-center gap-2">
                    @if (state.updatingJobIds().has(job.id)) {
                      <mat-icon class="animate-spin text-indigo-600 !w-5 !h-5">sync</mat-icon>
                    } @else {
                      @if (job.status === 'Pending') {
                        <div class="flex gap-1.5">
                          <button (click)="state.updateJobStatus(job.id, 'ACCEPTED')" class="p-2 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-600 hover:text-white transition-all border border-teal-100 shadow-sm" title="Accept Request">
                            <mat-icon class="!text-base !w-auto !h-auto">check</mat-icon>
                          </button>
                          <button (click)="state.updateJobStatus(job.id, 'REJECTED')" class="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all border border-rose-100 shadow-sm" title="Decline Request">
                            <mat-icon class="!text-base !w-auto !h-auto">close</mat-icon>
                          </button>
                        </div>
                      }
                      @if (job.status === 'Accepted' || job.status === 'Revision Requested' || job.status === 'In Progress') {
                        <button (click)="state.updateJobStatus(job.id, 'SUBMITTED')" class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-[0.1em] shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 hover:scale-[1.02] transition-all flex items-center gap-1.5">
                          <mat-icon class="!w-3.5 !h-3.5">send</mat-icon>
                          Deliver
                        </button>
                      }
                      @if (job.status === 'Submitted') {
                        <div class="text-[9px] font-bold text-slate-400 italic px-2">Reviewing...</div>
                      }
                    }
                  </div>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let job; columns: displayedColumns;" class="hover:bg-slate-50/50 transition-colors"></tr>
          </table>
        </div>

        @if (jobs().length > 4) {
          <div class="p-6 bg-slate-50/50 border-t border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <button (click)="prevPage()" [disabled]="currentPage() === 1" class="group px-6 py-3 bg-white border-2 border-slate-200 rounded-xl font-black text-[9px] uppercase tracking-widest text-slate-400 hover:border-indigo-600 hover:text-indigo-600 transition-all disabled:opacity-30 flex items-center gap-2">
              <mat-icon class="!text-lg transition-transform group-hover:-translate-x-1">chevron_left</mat-icon> Previous
            </button>
            <div class="flex gap-2">
              @for (p of pageNumbers(); track p) {
                <button
                  (click)="goToPage(p)"
                  [ngClass]="p === currentPage() ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20' : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-600'"
                  class="w-10 h-10 rounded-lg border-2 font-black text-[10px] transition-all">
                  {{ p }}
                </button>
              }
            </div>
            <button (click)="nextPage()" [disabled]="currentPage() >= totalPages()" class="group px-6 py-3 bg-white border-2 border-slate-200 rounded-xl font-black text-[9px] uppercase tracking-widest text-slate-400 hover:border-indigo-600 hover:text-indigo-600 transition-all disabled:opacity-30 flex items-center gap-2">
              Next <mat-icon class="!text-lg transition-transform group-hover:translate-x-1">chevron_right</mat-icon>
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; background: #fafafa; }
    .fill-star { font-variation-settings: 'FILL' 1; }
    
    .mat-mdc-table { background: transparent !important; }
    .mat-mdc-row, .mat-mdc-header-row { border-bottom: 1px solid #f8fafc !important; }
    .mat-mdc-cell, .mat-mdc-header-cell { border-bottom: none !important; }

    @media (max-width: 1024px) {
      .max-w-7xl { padding-left: 2rem; padding-right: 2rem; }
    }

    @media (max-width: 768px) {
      .text-5xl { font-size: 2.75rem !important; }
      .p-10 { padding: 2rem !important; }
      
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
      .flex.items-center.justify-end { justify-content: flex-start !important; }
    }
  `]
})
export class WorkerHistoryPage {
  state = inject(PlatformStateService);
  private notification = inject(NotificationService);
  displayedColumns: string[] = ['client', 'date', 'earnings', 'rating', 'status'];
  searchQuery = signal<string>('');
  currentPage = signal(1);
  readonly pageSize = 8;

  get earnings() {
    const jobs = this.state.bookings();
    if (jobs.length === 0) return [];
    const grouped = new Map<string, number>();
    jobs.forEach(b => {
      const d = new Date(b.date);
      const key = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
      grouped.set(key, (grouped.get(key) || 0) + (b.earnings || 0));
    });
    const max = Math.max(...Array.from(grouped.values()), 1);
    const entries = Array.from(grouped.entries());
    return entries.map(([label, value], index) => ({
      label,
      height: Math.max(10, Math.round((value / max) * 100)),
      active: index === entries.length - 1
    }));
  }

  get metrics() {
    const jobs = this.state.bookings();
    const completed = jobs.filter(j => j.status === 'Completed' || j.status === 'Approved').length;
    const submitted = jobs.filter(j => j.status === 'Submitted').length;
    const total = jobs.length || 1;
    const rated = jobs.filter(j => typeof j.rating === 'number') as any[];
    const avgRating = rated.length ? (rated.reduce((s, r) => s + (r.rating || 0), 0) / rated.length) : 0;
    return [
      { label: 'Completion Rate', value: `${Math.round((completed / total) * 100)}%`, icon: 'verified' },
      { label: 'Accepted Requests', value: `${Math.round((completed / total) * 100)}%`, icon: 'schedule' },
      { label: 'Avg. Rating', value: avgRating.toFixed(2), icon: 'star' }
    ];
  }

  jobs = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.state.bookings()
      .filter(b => !query || b.clientName.toLowerCase().includes(query) || b.service.toLowerCase().includes(query))
      .map(b => ({
        ...b,
        client: b.clientName,
        initials: b.clientInitials,
        service: b.service,
        date: b.date,
        earnings: `$${b.earnings.toFixed(2)}`,
        rating: b.rating,
        statusBg: b.status === 'Approved' ? 'bg-indigo-50' : 
                  (b.status === 'Submitted' ? 'bg-teal-50' : 
                  (b.status === 'Revision Requested' ? 'bg-amber-50' : 
                  (b.status === 'Cancelled' ? 'bg-rose-50' : 
                  (b.status === 'Disputed' ? 'bg-rose-100' : 'bg-blue-50')))),
        statusColor: b.status === 'Approved' ? 'text-indigo-700' : 
                     (b.status === 'Submitted' ? 'text-teal-700' : 
                     (b.status === 'Revision Requested' ? 'text-amber-700' : 
                     (b.status === 'Cancelled' ? 'text-rose-500' : 
                     (b.status === 'Disputed' ? 'text-rose-700' : 'text-blue-700'))))
      }));
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.jobs().length / this.pageSize)));
  pageNumbers = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));
  pagedJobs = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.jobs().slice(start, start + this.pageSize);
  });

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
  }

  prevPage() {
    this.goToPage(this.currentPage() - 1);
  }

  nextPage() {
    this.goToPage(this.currentPage() + 1);
  }

  exportHistory() {
    const header = 'client,service,date,earnings,status';
    const rows = this.jobs().map(j => `${j.client},${j.service},${j.date},${j.earnings},${j.status}`);
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `worker-history-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.notification.success('Job history exported.');
  }

  openAnalytics() {
    this.notification.info('Analytics refreshed from current history.');
  }
}