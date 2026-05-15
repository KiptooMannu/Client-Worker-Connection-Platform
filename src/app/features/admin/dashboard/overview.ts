import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { PlatformStateService } from '../../../core/services/platform-state.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-admin-dashboard-overview',
  standalone: true,
  imports: [
    CommonModule, 
    MatCardModule, 
    MatButtonModule, 
    MatIconModule, 
    MatChipsModule, 
    MatListModule,
    MatProgressBarModule,
    RouterLink
  ],
  template: `
    <div class="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-1000 p-4 md:p-0">
      <!-- Header Section -->
      <!-- Compact Authority Header -->
      <div class="flex flex-col gap-4 mb-4">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 class="text-lg md:text-xl font-black text-slate-900 tracking-tight">Executive Intelligence</h1>
          </div>
          
          <div class="flex items-center gap-3">
             <!-- Compact Stat Strip -->
             <div class="hidden lg:flex items-center gap-3 px-3 py-1.5 bg-white border border-slate-100 rounded-2xl shadow-sm mr-2">
                @for (stat of stats; track stat.label) {
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center" [ngClass]="stat.bg">
                      <mat-icon class="!text-sm" [ngClass]="stat.color">{{ stat.icon }}</mat-icon>
                    </div>
                    <div>
                      <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{{ stat.label }}</p>
                      <p class="text-sm font-black text-slate-900 leading-none">{{ stat.value }}</p>
                    </div>
                    @if (!$last) { <div class="h-6 w-px bg-slate-100 ml-4"></div> }
                  </div>
                }
             </div>
          </div>
        </div>
      </div>

      <!-- Dashboard Main Grid -->
      <div class="grid grid-cols-12 gap-6">
        
        <!-- Primary Operations (Left) -->
        <div class="col-span-12 lg:col-span-7 space-y-6">
          <!-- Verification Focus -->
          <mat-card class="!rounded-[24px] !bg-slate-900 !text-white !shadow-2xl !p-6 relative overflow-hidden group min-h-[220px]">
            <div class="relative z-10 flex flex-col h-full">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-8 h-8 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/5">
                  <mat-icon class="!text-white !text-sm">fact_check</mat-icon>
                </div>
                <h3 class="text-base font-black tracking-tight">Trust Verification Queue</h3>
              </div>
              
              <p class="text-slate-400 text-xs font-medium leading-relaxed max-w-md mb-6">
                Maintain platform integrity by reviewing <span class="text-white font-black underline decoration-2 underline-offset-4">{{ state.pendingWorkers().length }} pending applications</span>.
              </p>
              
              <div class="flex gap-2 mt-auto">
                <button routerLink="../verification" class="px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-900/20 hover:scale-105 transition-transform">
                  Access Queue
                </button>
                <button (click)="reviewGuidelines()" class="px-5 py-2.5 rounded-lg bg-white/5 text-white font-black text-[10px] uppercase tracking-widest border border-white/10 backdrop-blur-sm hover:bg-white/20 transition-all">
                  Guidelines
                </button>
              </div>
            </div>
            <mat-icon class="absolute -right-6 -bottom-6 !text-[100px] !w-auto !h-auto text-white/5 group-hover:rotate-12 transition-transform duration-1000 pointer-events-none">shield</mat-icon>
          </mat-card>

          <!-- Governance Metrics (Fills the gap) -->
          <div class="grid grid-cols-2 gap-6">
            <mat-card class="!rounded-[24px] !border !border-slate-100 !p-6 bg-white shadow-sm">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <mat-icon class="!text-sm">analytics</mat-icon>
                </div>
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform Load</span>
              </div>
              <div class="space-y-4">
                <div>
                  <div class="flex justify-between mb-1">
                    <span class="text-[9px] font-black text-slate-500 uppercase">Verification Capacity</span>
                    <span class="text-[9px] font-black text-slate-900">82%</span>
                  </div>
                  <mat-progress-bar mode="determinate" value="82" class="!h-1.5 !rounded-full"></mat-progress-bar>
                </div>
                <p class="text-[10px] text-slate-400 font-medium">System performance is optimal. Latency < 45ms.</p>
              </div>
            </mat-card>

            <mat-card class="!rounded-[24px] !border !border-slate-100 !p-6 bg-white shadow-sm">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <mat-icon class="!text-sm">security</mat-icon>
                </div>
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trust Index</span>
              </div>
              <div class="space-y-4">
                 <div class="flex items-baseline gap-2">
                    <span class="text-2xl font-black text-slate-900">A+</span>
                    <span class="text-[10px] font-bold text-emerald-600">Stable</span>
                 </div>
                 <p class="text-[10px] text-slate-400 font-medium">Identity verification accuracy is at 99.4%.</p>
              </div>
            </mat-card>
          </div>
        </div>

        <!-- Insights (Right) -->
        <div class="col-span-12 lg:col-span-5 space-y-6">
           <!-- Communications -->
           <mat-card class="!rounded-[24px] !border !border-slate-200/60 !shadow-sm !p-6 bg-white overflow-hidden">
              <div class="flex justify-between items-center mb-6">
                <div class="flex items-center gap-3">
                  <h3 class="text-base font-black text-slate-900 tracking-tight">Messaging Overview</h3>
                </div>
                <button routerLink="../messages" class="text-[9px] font-black uppercase text-blue-600 hover:underline">Inbox</button>
              </div>
              <div class="space-y-4">
                 @for (chat of state.chats().slice(0, 3); track chat.id) {
                    <div class="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer" routerLink="../messages">
                       <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black text-xs uppercase overflow-hidden border border-white">
                          @if (chat.image) { <img [src]="chat.image" class="w-full h-full object-cover"> } @else { {{ chat.initials }} }
                       </div>
                       <div class="flex-1 min-w-0">
                          <p class="text-xs font-black text-slate-900 truncate">{{ chat.name }}</p>
                          <p class="text-[10px] text-slate-500 truncate">{{ chat.lastMessage }}</p>
                       </div>
                    </div>
                 }
                 @if (state.chats().length === 0) {
                    <p class="py-8 text-center text-[10px] text-slate-400 font-black uppercase tracking-widest bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">No recent messages</p>
                 }
              </div>
           </mat-card>

           <!-- Security Stream -->
           <mat-card class="!rounded-[24px] !border !border-slate-200/60 !shadow-sm !p-6 flex flex-col bg-white max-h-[400px]">
              <div class="flex justify-between items-center mb-6">
                <div class="flex items-center gap-3">
                  <h3 class="text-base font-black text-slate-900 tracking-tight">Security Stream</h3>
                  <span class="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest rounded-full flex items-center gap-1">
                    <div class="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                    Live
                  </span>
                </div>
                <button (click)="exportReport()" class="text-[9px] font-black uppercase text-blue-600 hover:underline">Export</button>
              </div>
 
              <div class="space-y-3 overflow-y-auto pr-1 custom-scrollbar flex-grow">
                 @for (alert of alerts; track alert.id) {
                    <div class="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:border-indigo-100 hover:bg-white transition-all group relative overflow-hidden">
                       <div class="absolute left-0 top-0 bottom-0 w-1 group-hover:w-1.5 transition-all" [ngClass]="alert.accent"></div>
                       <div class="flex justify-between items-center mb-1">
                          <span class="text-[8px] font-black uppercase tracking-widest" [ngClass]="alert.sevColor">
                            {{ alert.type }}
                          </span>
                          <span class="text-[8px] font-bold text-slate-400">{{ alert.time }}</span>
                       </div>
                       <p class="text-[10px] text-slate-600 font-bold leading-tight">{{ alert.desc }}</p>
                    </div>
                 }
                 @if (alerts.length === 0) {
                   <div class="py-12 text-center">
                     <mat-icon class="text-slate-200 !text-3xl !w-auto !h-auto mb-2">history</mat-icon>
                     <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest">No recent events</p>
                   </div>
                 }
              </div>
 
              <button routerLink="../activity" class="w-full mt-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 border border-slate-100 hover:bg-slate-50 transition-all">
                Audit All Activities
              </button>
           </mat-card>
        </div>
      </div>

      <!-- System Oversight (Hires Ledger) -->
      <mat-card class="!rounded-[24px] !border !border-slate-100 !shadow-sm !overflow-hidden">
        <mat-card-header class="!p-8 !border-b !border-slate-50 !bg-slate-50/50 flex !flex-row !justify-between !items-center">
          <mat-card-title class="!text-[10px] !font-black !text-slate-900 !uppercase !tracking-widest !m-0">Global Hires Ledger (Oversight)</mat-card-title>
          <span class="text-[8px] text-slate-400 font-black uppercase tracking-widest">Tracking {{ state.allBookings().length }} platform-wide connections</span>
        </mat-card-header>
        
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-900 text-white">
                <th class="px-6 py-3 text-[9px] font-black uppercase tracking-widest">Professional</th>
                <th class="px-6 py-3 text-[9px] font-black uppercase tracking-widest">Client</th>
                <th class="px-6 py-3 text-[9px] font-black uppercase tracking-widest">Service</th>
                <th class="px-6 py-3 text-[9px] font-black uppercase tracking-widest text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              @for (job of paginatedAllBookings(); track job.id) {
                <tr class="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td class="px-6 py-3">
                    <div class="flex items-center gap-3">
                      <div class="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-black text-[9px] uppercase border border-white">{{ job.workerInitials }}</div>
                      <span class="text-[11px] font-black text-slate-900">{{ job.workerName }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-3 text-[11px] font-bold text-slate-600">{{ job.clientName }}</td>
                  <td class="px-6 py-3 text-[10px] font-medium text-slate-500">{{ job.service }}</td>
                  <td class="px-6 py-3 text-right">
                    <span class="inline-block px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest" 
                          [ngClass]="job.status === 'Approved' ? 'bg-teal-50 text-teal-700' : 'bg-blue-50 text-blue-700'">
                      {{ job.status }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (totalPages() > 1) {
          <div class="p-4 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
            <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Page {{ currentPage() }} of {{ totalPages() }}
            </span>
            <div class="flex gap-2">
              <button (click)="goToPage(currentPage() - 1)" [disabled]="currentPage() === 1" class="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 disabled:opacity-30 hover:text-indigo-600 transition-all">
                <mat-icon class="!text-lg">chevron_left</mat-icon>
              </button>
              <button (click)="goToPage(currentPage() + 1)" [disabled]="currentPage() === totalPages()" class="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 disabled:opacity-30 hover:text-indigo-600 transition-all">
                <mat-icon class="!text-lg">chevron_right</mat-icon>
              </button>
            </div>
          </div>
        }

        @if (state.allBookings().length === 0) {
            <div class="p-12 text-center">
                <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest">No active marketplace connections</p>
            </div>
        }
      </mat-card>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class AdminOverviewPage {
  state = inject(PlatformStateService);
  private notification = inject(NotificationService);

  // Pagination for Hires Ledger
  currentPage = signal(1);
  itemsPerPage = signal(10);

  paginatedAllBookings = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    return this.state.allBookings().slice(start, start + this.itemsPerPage());
  });

  totalPages = computed(() => Math.ceil(this.state.allBookings().length / this.itemsPerPage()));

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  get stats() {
    const totalUsers = this.state.clients().length + this.state.workers().length;
    const verified = this.state.verifiedWorkers().length;
    const pending = this.state.pendingWorkers().length;
    const trustScore = totalUsers > 0 ? Math.round((verified / Math.max(this.state.workers().length, 1)) * 100) : 0;
    return [
      { label: 'Total Users', value: totalUsers, icon: 'group', bg: 'bg-blue-50', color: 'text-blue-600', trend: 'live', trendBg: 'bg-blue-50', progress: 100, progressBg: 'bg-blue-600' },
      { label: 'Marketplace Trust', value: `${trustScore}%`, icon: 'shield', bg: 'bg-emerald-50', color: 'text-emerald-600', trend: 'verified', trendBg: 'bg-emerald-50', progress: trustScore, progressBg: 'bg-emerald-600' },
      { label: 'Pending Review', value: this.state.pendingWorkers().length, icon: 'priority_high', bg: 'bg-amber-50', color: 'text-amber-600', trend: this.state.pendingWorkers().length > 10 ? 'High' : 'Normal', trendBg: 'bg-amber-50', progress: Math.min(100, this.state.pendingWorkers().length * 4), progressBg: 'bg-amber-600' },
      { label: 'Verified Workers', value: verified, icon: 'verified', bg: 'bg-indigo-50', color: 'text-indigo-600', trend: 'approved', trendBg: 'bg-indigo-50', progress: Math.min(100, verified === 0 ? 0 : (verified / Math.max(this.state.workers().length, 1)) * 100), progressBg: 'bg-indigo-600' }
    ];
  }

  get alerts() {
    const workers = this.state.workers();
    return this.state.activityLogs().slice(0, 8).map((log, idx) => {
      const worker = workers.find(w => w.id === log.workerId);
      const name = worker ? worker.name : `Worker ${String(log.workerId).slice(0, 8)}`;
      const isNegative = log.action === 'rejected';
      
      return {
        id: log.id || idx,
        type: String(log.action).toUpperCase().replace('_', ' '),
        sevBg: isNegative ? 'bg-rose-50' : 'bg-indigo-50',
        sevColor: isNegative ? 'text-rose-600' : 'text-indigo-600',
        accent: isNegative ? 'bg-rose-500' : 'bg-indigo-500',
        time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        desc: `${name} has been ${log.action}`
      };
    });
  }

  exportReport() {
    const payload = {
      exportedAt: new Date().toISOString(),
      totalUsers: this.state.clients().length + this.state.workers().length,
      verifiedWorkers: this.state.verifiedWorkers().length,
      pendingWorkers: this.state.pendingWorkers().length,
      recentActivity: this.state.activityLogs().slice(0, 20)
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.notification.success('Report exported.');
  }

  reviewGuidelines() {
    window.open('https://owasp.org/www-project-top-ten/', '_blank');
  }
}
