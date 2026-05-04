import { Component, inject } from '@angular/core';
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
    <div class="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-1000 p-4 md:p-0">
      <!-- Header Section -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-slate-100 pb-10">
        <div>
          <div class="flex items-center gap-3 mb-3">
            <span class="bg-slate-100 text-slate-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-slate-200/50">Admin Console</span>
            <span class="h-1 w-1 rounded-full bg-slate-300"></span>
            <span class="text-slate-400 text-[10px] font-medium uppercase tracking-widest">Platform Authority</span>
          </div>
          <h1 class="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-2">Operational Insights</h1>
          <p class="text-slate-500 font-medium text-lg">Comprehensive overview of the Client-Worker Connection Ecosystem.</p>
        </div>
        
        <div class="flex items-center gap-3">
          <button (click)="exportReport()" class="px-6 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-sm">
            Export Report
          </button>
          <button (click)="systemHealth()" class="px-6 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">
            System Health
          </button>
        </div>
      </div>

      <!-- Key Performance Indicators -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        @for (stat of stats; track stat.label) {
          <mat-card class="!rounded-[32px] !border !border-slate-200/60 !shadow-sm hover:!shadow-xl transition-all duration-500 group overflow-hidden">
            <mat-card-content class="!p-8">
              <div class="flex justify-between items-start mb-8">
                <div class="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500" [ngClass]="stat.bg">
                  <mat-icon [ngClass]="stat.color" class="!text-xl">{{ stat.icon }}</mat-icon>
                </div>
                <div class="flex items-center gap-1 px-2 py-1 rounded-lg" [ngClass]="stat.trendBg">
                  <mat-icon class="!text-[10px] !w-auto !h-auto" [ngClass]="stat.color">trending_up</mat-icon>
                  <span class="text-[10px] font-black uppercase tracking-tighter" [ngClass]="stat.color">{{ stat.trend }}</span>
                </div>
              </div>
              
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{{ stat.label }}</p>
              <h3 class="text-4xl font-black text-slate-900 tracking-tight mb-4">{{ stat.value }}</h3>
              
              <div class="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-1000" [ngClass]="stat.progressBg" [style.width]="stat.progress + '%'"></div>
              </div>
            </mat-card-content>
          </mat-card>
        }
      </div>

      <!-- Dashboard Main Grid -->
      <div class="grid grid-cols-12 gap-8">
        
        <!-- Verification Focus -->
        <div class="col-span-12 lg:col-span-8 space-y-8">
          <mat-card class="!rounded-[40px] !bg-indigo-600 !text-white !shadow-2xl !p-12 relative overflow-hidden group">
            <div class="relative z-10 flex flex-col h-full">
              <div class="flex items-center gap-4 mb-8">
                <div class="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10">
                  <mat-icon class="!text-white !text-2xl">fact_check</mat-icon>
                </div>
                <h3 class="text-3xl font-black tracking-tight">Trust Verification Queue</h3>
              </div>
              
              <p class="text-indigo-100 text-xl font-medium leading-relaxed max-w-xl mb-12">
                Maintain platform integrity by reviewing <span class="text-white font-black underline decoration-2 underline-offset-4">{{ state.pendingWorkers().length }} pending applications</span> from specialized service providers.
              </p>
              
              <div class="flex flex-wrap gap-4 mt-auto">
                <button routerLink="../verification" class="px-10 py-5 rounded-2xl bg-white text-indigo-600 font-black text-[13px] uppercase tracking-widest shadow-xl shadow-indigo-900/20 hover:scale-105 transition-transform">
                  Access Queue
                </button>
                <button (click)="reviewGuidelines()" class="px-10 py-5 rounded-2xl bg-white/10 text-white font-black text-[13px] uppercase tracking-widest border border-white/20 backdrop-blur-sm hover:bg-white/20 transition-all">
                  Review Guidelines
                </button>
              </div>
            </div>
            
            <!-- Decorative Icon -->
            <mat-icon class="absolute -right-16 -bottom-16 !text-[320px] !w-auto !h-auto text-white/10 group-hover:rotate-12 transition-transform duration-1000 pointer-events-none">shield</mat-icon>
          </mat-card>

          <!-- User Management Overview -->
          <mat-card class="!rounded-[40px] !border !border-slate-200/60 !shadow-sm !p-0 overflow-hidden flex flex-col md:flex-row">
            <div class="p-12 flex-grow">
               <div class="flex items-center gap-3 mb-4">
                  <mat-icon class="text-slate-400">people</mat-icon>
                  <h3 class="text-2xl font-black text-slate-900 tracking-tight">Participant Oversight</h3>
               </div>
               <p class="text-slate-500 font-medium text-lg leading-relaxed mb-10 max-w-md">Manage identity authentication and account statuses across our global service community.</p>
               <button routerLink="../users" class="px-8 py-4 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all">
                 Manage All Users
               </button>
            </div>
            <div class="bg-slate-50/50 p-12 md:w-80 border-l border-slate-100 flex flex-col justify-center gap-10">
               <div>
                 <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Verified Workers</p>
                 <h4 class="text-4xl font-black text-slate-900 tracking-tight">{{ state.verifiedWorkers().length }}</h4>
                 <div class="flex items-center gap-1 text-emerald-500 font-bold text-[10px] mt-1">
                   <mat-icon class="!text-[10px] !w-auto !h-auto">trending_up</mat-icon>
                   <span>Stable Growth</span>
                 </div>
               </div>
               <div>
                 <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Active Clients</p>
                 <h4 class="text-4xl font-black text-slate-900 tracking-tight">{{ state.clients().length }}</h4>
                 <div class="flex items-center gap-1 text-indigo-500 font-bold text-[10px] mt-1">
                   <mat-icon class="!text-[10px] !w-auto !h-auto">star</mat-icon>
                   <span>Registered Accounts</span>
                 </div>
               </div>
            </div>
          </mat-card>
        </div>

        <!-- Right Side Alerts -->
        <div class="col-span-12 lg:col-span-4 space-y-8">
           <mat-card class="!rounded-[40px] !border !border-slate-200/60 !shadow-sm !p-10 flex flex-col h-full">
              <div class="flex justify-between items-center mb-10">
                <h3 class="text-2xl font-black text-slate-900 tracking-tight">Security Stream</h3>
                <div class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
              </div>

              <div class="space-y-6 overflow-y-auto max-h-[600px] pr-2">
                 @for (alert of alerts; track alert.id) {
                    <div class="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all group cursor-pointer relative overflow-hidden">
                       <div class="absolute left-0 top-0 bottom-0 w-1 group-hover:w-1.5 transition-all" [ngClass]="alert.accent"></div>
                       <div class="flex justify-between items-start mb-4">
                          <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" [ngClass]="alert.sevBg + ' ' + alert.sevColor">
                            {{ alert.severity }}
                          </span>
                          <span class="text-[10px] font-bold text-slate-300">{{ alert.time }}</span>
                       </div>
                       <h4 class="text-sm font-black text-slate-900 mb-2 leading-tight">{{ alert.type }}</h4>
                       <p class="text-xs text-slate-400 leading-relaxed font-medium">{{ alert.desc }}</p>
                    </div>
                 }
              </div>

              <button routerLink="../activity" class="w-full mt-10 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-slate-400 border border-slate-100 hover:bg-slate-50 transition-all">
                Audit All Activities
              </button>
           </mat-card>
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class AdminOverviewPage {
  state = inject(PlatformStateService);
  private notification = inject(NotificationService);

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
    return this.state.activityLogs().slice(0, 5).map((log, idx) => ({
      id: log.id || idx,
      type: String(log.action).toUpperCase().replace('_', ' '),
      severity: log.action === 'rejected' ? 'Medium' : 'Info',
      sevBg: log.action === 'rejected' ? 'bg-amber-50' : 'bg-blue-50',
      sevColor: log.action === 'rejected' ? 'text-amber-600' : 'text-blue-600',
      accent: log.action === 'rejected' ? 'bg-amber-500' : 'bg-blue-500',
      time: new Date(log.timestamp).toLocaleString(),
      desc: `${log.action} for worker ${log.workerId}`
    }));
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

  systemHealth() {
    const pending = this.state.pendingWorkers().length;
    const workers = this.state.workers().length;
    const logs = this.state.activityLogs().length;
    this.notification.info(`System healthy: workers=${workers}, pending=${pending}, logs=${logs}`);
  }

  reviewGuidelines() {
    window.open('https://owasp.org/www-project-top-ten/', '_blank');
  }
}
