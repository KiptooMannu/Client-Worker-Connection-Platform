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
    <div class="max-w-4xl mx-auto space-y-8 pb-24 font-manrope animate-in fade-in duration-700">
      
      <!-- History Header -->
      <header class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-8">
        <div class="space-y-2">
          <div class="flex items-center gap-3 mb-1">
            <div class="w-10 h-10 rounded-full bg-brand-teal/10 text-brand-teal flex items-center justify-center">
              <mat-icon class="!text-[18px] flex items-center justify-center">account_balance_wallet</mat-icon>
            </div>
            <span class="font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase">Financial Audit</span>
          </div>
          <h1 class="text-3xl font-black text-brand-teal">Job Ledger</h1>
          <p class="font-body-sm text-body-sm text-on-surface-variant max-w-md">Detailed record of service contributions, performance metrics, and verified earnings.</p>
        </div>

        <div class="flex gap-3">
          <button (click)="exportHistory()" class="px-5 py-3 bg-white border border-outline-variant text-brand-teal rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-surface-container-low transition-all shadow-sm flex items-center gap-2">
            <mat-icon class="!text-sm flex items-center justify-center">receipt_long</mat-icon>
            Export
          </button>
        </div>
      </header>

      <!-- Analytics Grid -->
      <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
        <!-- Revenue Momentum -->
        <div class="md:col-span-8 bg-white rounded-xl p-6 border border-outline-variant shadow-sm space-y-6 relative group overflow-hidden">
          <div class="flex justify-between items-start">
             <div>
                <h3 class="font-bold text-brand-teal">Revenue Momentum</h3>
                <p class="text-[10px] text-on-surface-variant font-black uppercase tracking-widest mt-0.5">Earnings per cycle</p>
             </div>
             <div class="text-right">
                <span class="text-2xl font-black text-brand-teal">{{ state.bookings().length }}</span>
                <p class="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Total Projects</p>
             </div>
          </div>

          <div class="h-40 flex items-end justify-between gap-3 px-2">
            @for (bar of earnings; track $index) {
              <div class="flex flex-col items-center gap-3 flex-1 group/bar relative h-full justify-end">
                <div class="w-full bg-surface-container rounded-lg transition-all hover:bg-brand-teal cursor-pointer relative" 
                     [style.height]="bar.height + '%'">
                     <div class="absolute inset-0 bg-white/5 opacity-0 group-hover/bar:opacity-100 transition-opacity"></div>
                </div>
                <span class="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">{{ bar.label }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Performance Index -->
        <div class="md:col-span-4 bg-brand-teal text-white rounded-xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
           <div class="space-y-6 relative z-10">
              <div class="flex items-center justify-between">
                 <h4 class="font-bold tracking-tight">Audit Score</h4>
                 <mat-icon class="text-secondary-container-fixed flex items-center justify-center">monitoring</mat-icon>
              </div>

              <div class="space-y-4">
                 @for (m of metrics; track m.label) {
                   <div class="flex items-center justify-between">
                      <div class="flex items-center gap-3">
                         <mat-icon class="text-white/40 !text-sm flex items-center justify-center">{{ m.icon }}</mat-icon>
                         <span class="text-[10px] font-bold tracking-widest uppercase text-white/60">{{ m.label }}</span>
                      </div>
                      <span class="text-lg font-black">{{ m.value }}</span>
                   </div>
                 }
              </div>
           </div>
           
           <div class="absolute -bottom-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
        </div>
      </div>

      <!-- Job Ledger List -->
      <div class="space-y-4">
        <div class="flex items-center justify-between px-2">
           <h2 class="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Operational Ledger</h2>
           <span class="text-[9px] font-bold text-on-surface-variant/60">{{ jobs().length }} Entries</span>
        </div>

        <div class="grid gap-3">
          @for (job of pagedJobs(); track job.id) {
            <div class="bg-white rounded-xl p-6 border border-outline-variant shadow-sm hover:border-brand-teal transition-all group animate-in slide-in-from-bottom-2 duration-500">
              <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
                 <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-brand-teal font-black text-sm border border-outline-variant">
                       {{ job.initials }}
                    </div>
                    <div class="space-y-0.5">
                       <h3 class="font-bold text-brand-teal">{{ job.client }}</h3>
                       <div class="flex items-center gap-2">
                          <span class="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">{{ job.service }}</span>
                          <span class="w-1 h-1 bg-outline-variant rounded-full"></span>
                          <span class="text-[10px] font-bold text-on-surface-variant/60">{{ job.date | date:'mediumDate' }}</span>
                       </div>
                    </div>
                 </div>

                 <div class="flex flex-wrap items-center gap-8 md:gap-12">
                    <!-- Rating -->
                    <div class="flex flex-col items-center">
                       <p class="text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Rating</p>
                       <div class="flex items-center gap-0.5 text-brand-teal">
                          @if (job.rating) {
                            @for (s of [1,2,3,4,5]; track s) {
                               <mat-icon class="!text-[14px] flex items-center justify-center" [class.material-fill]="s <= job.rating">star</mat-icon>
                            }
                          } @else {
                            <span class="text-[9px] font-bold text-on-surface-variant/40 italic">Pending</span>
                          }
                       </div>
                    </div>

                    <!-- Earnings -->
                    <div class="flex flex-col items-end">
                       <p class="text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-0.5">Earnings</p>
                       <span class="text-xl font-black text-brand-teal">KSh {{ job.earnings }}</span>
                    </div>

                    <!-- Status & Actions -->
                    <div class="flex items-center gap-3">
                       <span class="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors shadow-sm flex items-center gap-2" 
                             [ngClass]="job.statusBg + ' ' + job.statusColor">
                         <span class="w-1.5 h-1.5 rounded-full" [class.bg-current]="true" [class.animate-pulse]="job.status === 'Pending'"></span>
                         {{ job.status }}
                       </span>

                       <div class="flex items-center gap-2">
                          @if (state.updatingJobIds().has(job.id)) {
                             <div class="w-8 h-8 rounded-full border-2 border-outline-variant border-t-primary animate-spin"></div>
                          } @else {
                             @if (job.status === 'Pending') {
                               <div class="flex gap-2">
                                 <button (click)="state.updateJobStatus(job.id, 'ACCEPTED')" 
                                         class="w-9 h-9 bg-surface-container text-brand-teal rounded-lg hover:bg-brand-teal hover:text-white transition-all flex items-center justify-center shadow-sm border border-outline-variant">
                                   <mat-icon class="!text-[18px] flex items-center justify-center">check</mat-icon>
                                 </button>
                                 <button (click)="state.updateJobStatus(job.id, 'REJECTED')" 
                                         class="w-9 h-9 bg-surface-container text-error rounded-lg hover:bg-error hover:text-white transition-all flex items-center justify-center shadow-sm border border-outline-variant">
                                   <mat-icon class="!text-[18px] flex items-center justify-center">close</mat-icon>
                                 </button>
                               </div>
                             }
                             @if (job.status === 'Accepted' || job.status === 'Revision Requested' || job.status === 'In Progress') {
                               <button (click)="state.updateJobStatus(job.id, 'SUBMITTED')" 
                                       class="px-5 py-2.5 bg-brand-teal text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-md shadow-brand-teal/10 flex items-center gap-2">
                                 <mat-icon class="!text-sm flex items-center justify-center">send</mat-icon> Deliver
                               </button>
                             }
                          }
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          } @empty {
             <div class="py-20 text-center bg-white rounded-xl border border-dashed border-outline-variant">
                <mat-icon class="text-on-surface-variant/20 !text-5xl !w-auto !h-auto mb-3 flex items-center justify-center">history_edu</mat-icon>
                <p class="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-[0.2em]">No operational records found</p>
             </div>
          }
        </div>

        <!-- Pagination -->
        @if (jobs().length > pageSize) {
          <div class="flex justify-center items-center gap-6 pt-6">
            <button (click)="prevPage()" [disabled]="currentPage() === 1" 
                    class="p-3 bg-white border border-outline-variant rounded-xl text-brand-teal hover:bg-surface-container-low transition-all disabled:opacity-30 flex items-center justify-center">
              <mat-icon class="flex items-center justify-center">chevron_left</mat-icon>
            </button>
            
            <div class="flex gap-2">
              @for (p of pageNumbers(); track p) {
                <button (click)="goToPage(p)"
                        [ngClass]="p === currentPage() ? 'bg-brand-teal text-white shadow-md shadow-brand-teal/10' : 'bg-white text-on-surface-variant hover:text-brand-teal border border-outline-variant'"
                        class="w-10 h-10 rounded-lg font-bold text-xs transition-all flex items-center justify-center">
                  {{ p }}
                </button>
              }
            </div>
            
            <button (click)="nextPage()" [disabled]="currentPage() >= totalPages()" 
                    class="p-3 bg-white border border-outline-variant rounded-xl text-brand-teal hover:bg-surface-container-low transition-all disabled:opacity-30 flex items-center justify-center">
              <mat-icon class="flex items-center justify-center">chevron_right</mat-icon>
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; background: #f8fafc; min-height: 100vh; }
    /* Fix icon alignment globally */
    mat-icon {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      vertical-align: middle !important;
      flex-shrink: 0 !important;
    }
    /* Ensure buttons with icons have proper spacing */
    button mat-icon {
      margin: 0 2px;
    }
    /* Material icon fill style */
    .material-fill {
      font-variation-settings: 'FILL' 1;
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
      earnings: `KSh ${b.earnings.toFixed(2)}`,
        rating: b.rating,
        statusBg: b.status === 'Approved' ? 'bg-teal-50' : 
                  (b.status === 'Submitted' ? 'bg-teal-50' : 
                  (b.status === 'Revision Requested' ? 'bg-amber-50' : 
                  (b.status === 'Cancelled' ? 'bg-rose-50' : 
                  (b.status === 'Disputed' ? 'bg-rose-100' : 'bg-brand-teal-soft')))),
        statusColor: b.status === 'Approved' ? 'text-teal-700' : 
                     (b.status === 'Submitted' ? 'text-teal-700' : 
                     (b.status === 'Revision Requested' ? 'text-amber-700' : 
                     (b.status === 'Cancelled' ? 'text-rose-500' :
                     (b.status === 'Disputed' ? 'text-rose-700' : 'text-brand-teal'))))
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
    const header = 'employer,service,date,earnings,status';
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