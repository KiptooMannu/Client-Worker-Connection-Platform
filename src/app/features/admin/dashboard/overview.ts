import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';

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
    <div class="space-y-8 animate-in fade-in duration-700">
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 class="text-5xl font-black text-slate-900 tracking-tighter">Admin Authority</h1>
          <p class="text-slate-500 font-medium mt-2">The trust controller and system moderator console.</p>
        </div>
        <div class="flex gap-3">
          <button mat-stroked-button class="!border-slate-300 !px-6 !py-4 !rounded-xl !font-black !text-xs !uppercase !tracking-widest">
            Audit Logs
          </button>
          <button mat-flat-button color="primary" class="!px-6 !py-4 !rounded-xl !font-black !text-xs !uppercase !tracking-widest !shadow-lg">
            System Status
          </button>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        @for (stat of stats; track stat.label) {
          <mat-card class="!rounded-3xl !border !border-slate-100 !shadow-sm hover:!shadow-xl transition-all group">
            <mat-card-content class="!p-8">
              <div class="p-3 rounded-2xl w-fit mb-6" [ngClass]="stat.bg">
                <mat-icon [ngClass]="stat.color">{{ stat.icon }}</mat-icon>
              </div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{{ stat.label }}</p>
              <h3 class="text-3xl font-black text-slate-900 tracking-tight">{{ stat.value }}</h3>
              <div class="mt-4 flex items-center gap-2">
                <span class="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full" [ngClass]="stat.trendBg + ' ' + stat.color">
                  {{ stat.trend }}
                </span>
                <span class="text-[9px] text-slate-400 font-black uppercase tracking-tighter">{{ stat.trendLabel }}</span>
              </div>
            </mat-card-content>
          </mat-card>
        }
      </div>

      <div class="grid grid-cols-12 gap-8">
        <!-- Verification Control -->
        <mat-card class="col-span-12 lg:col-span-8 !rounded-[2.5rem] !bg-slate-900 !text-white !shadow-2xl !p-10 relative overflow-hidden">
          <mat-card-content class="relative z-10">
            <div class="flex items-center gap-4 mb-8">
              <div class="p-3 bg-blue-600 rounded-2xl border border-blue-500/30">
                <mat-icon class="!text-white">verified_user</mat-icon>
              </div>
              <h3 class="text-3xl font-black tracking-tight">Worker Verification Queue</h3>
            </div>
            <p class="text-slate-400 font-medium max-w-xl text-lg mb-10">
              There are <span class="text-white font-black">24 priority applications</span> pending review. Verify identity and experience authenticity before they go live.
            </p>
            <div class="flex flex-wrap gap-4">
              <button mat-flat-button routerLink="../verification" class="!bg-white !text-slate-900 !px-10 !py-6 !rounded-2xl !font-black !text-sm !shadow-xl">
                Open Queue
              </button>
              <button mat-stroked-button class="!border-white/20 !text-white !px-10 !py-6 !rounded-2xl !font-black !text-sm">
                Verification Settings
              </button>
            </div>
          </mat-card-content>
          <mat-icon class="absolute -right-10 -top-10 !text-[240px] !w-auto !h-auto text-white/5 pointer-events-none" style="font-variation-settings: 'FILL' 1;">shield</mat-icon>
        </mat-card>

        <!-- Fraud Prevention / Activity -->
        <mat-card class="col-span-12 lg:col-span-4 !rounded-[2.5rem] !border !border-slate-100 !shadow-sm !p-10">
          <h3 class="text-2xl font-black text-slate-900 tracking-tight mb-8">Fraud Monitoring</h3>
          <div class="space-y-6">
            @for (alert of alerts; track alert.id) {
              <div class="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 group hover:bg-white hover:shadow-lg transition-all cursor-pointer">
                <div class="flex justify-between items-start mb-3">
                  <span class="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded" [ngClass]="alert.sevBg + ' ' + alert.sevColor">
                    {{ alert.severity }}
                  </span>
                  <span class="text-[9px] text-slate-400 font-black">{{ alert.time }}</span>
                </div>
                <p class="text-sm font-black text-slate-900 mb-1">{{ alert.type }}</p>
                <p class="text-[11px] text-slate-500 font-medium leading-relaxed">{{ alert.desc }}</p>
              </div>
            }
          </div>
          <button mat-button routerLink="../activity" class="w-full !mt-8 !text-blue-600 !font-black !text-[10px] !uppercase !tracking-widest">
            View Live Stream
          </button>
        </mat-card>

        <!-- User Oversight -->
        <mat-card class="col-span-12 !rounded-[2.5rem] !border !border-slate-100 !shadow-sm overflow-hidden flex flex-col md:flex-row items-center">
          <div class="p-10 flex-1">
             <h3 class="text-2xl font-black text-slate-900 tracking-tight mb-2">User Management</h3>
             <p class="text-slate-500 font-medium mb-8">Manage 12,842 global participants including identity auditing and tier management.</p>
             <button mat-flat-button color="primary" routerLink="../users" class="!px-8 !py-4 !rounded-xl !font-black !text-xs !uppercase !tracking-widest">Manage All Users</button>
          </div>
          <div class="p-10 md:border-l border-slate-100 flex-1 bg-slate-50/50">
            <div class="grid grid-cols-2 gap-8">
              <div>
                <p class="text-3xl font-black text-slate-900">4.3k</p>
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Verified Workers</p>
              </div>
              <div>
                <p class="text-3xl font-black text-slate-900">8.5k</p>
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Active Clients</p>
              </div>
            </div>
          </div>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class AdminOverviewPage {
  stats = [
    { label: 'Total Volume', value: '$2.4M', icon: 'payments', bg: 'bg-blue-50', color: 'text-blue-600', trend: '+14%', trendBg: 'bg-blue-50', trendLabel: 'this month' },
    { label: 'Pending Review', value: '24', icon: 'priority_high', bg: 'bg-red-50', color: 'text-red-600', trend: 'Urgent', trendBg: 'bg-red-50', trendLabel: 'Priority' },
    { label: 'Platform Trust', value: '98.4%', icon: 'shield', bg: 'bg-teal-50', color: 'text-teal-600', trend: '+0.2%', trendBg: 'bg-teal-50', trendLabel: 'Quality' },
    { label: 'System Uptime', value: '99.98%', icon: 'bolt', bg: 'bg-indigo-50', color: 'text-indigo-600', trend: 'Stable', trendBg: 'bg-indigo-50', trendLabel: 'Global' }
  ];

  alerts = [
    { id: 1, type: 'Security Anomaly', severity: 'High', sevBg: 'bg-red-50', sevColor: 'text-red-700', time: '2m ago', desc: 'Multiple failed login attempts from IP 192.168.1.45' },
    { id: 2, type: 'Identity Conflict', severity: 'Medium', sevBg: 'bg-amber-50', sevColor: 'text-amber-800', time: '14m ago', desc: 'Worker "David H." uploaded documents matching an existing profile.' }
  ];
}
