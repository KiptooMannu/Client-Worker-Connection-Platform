import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PlatformStateService } from '../../../core/services/platform-state.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-admin-activity',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTableModule, MatChipsModule],
  template: `
    <div class="max-w-7xl mx-auto space-y-6 md:space-y-10 animate-in fade-in duration-1000">
      
      <!-- Header Section -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-slate-100 pb-10">
        <div>
          <div class="flex items-center gap-3 mb-3">
            <span class="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-indigo-100/50">Audit Trail</span>
            <span class="h-1 w-1 rounded-full bg-slate-300"></span>
            <span class="text-slate-400 text-[10px] font-medium uppercase tracking-widest">Real-time Telemetry</span>
          </div>
          <h1 class="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-2">Platform Activity</h1>
          <p class="text-slate-500 font-medium text-lg">Continuous monitoring of administrative and professional events.</p>
        </div>
        
        <div class="flex items-center gap-3">
          <button (click)="toggleRejectedOnly()" class="px-6 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-sm">
             <mat-icon class="!text-sm mr-1">filter_list</mat-icon> Filter Events
          </button>
          <button (click)="refresh()" class="px-6 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">
             <mat-icon class="!text-sm mr-1">refresh</mat-icon> Live Refresh
          </button>
        </div>
      </div>

      <!-- Activity Feed Card -->
      <mat-card class="!rounded-[32px] !border !border-slate-200/60 !shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden bg-white">
        <!-- Live Header -->
        <div class="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
          <div class="flex items-center gap-3">
            <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <h3 class="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Live Synchronization</h3>
          </div>
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Events: {{ visibleLogs().length }}</span>
        </div>

        <div class="overflow-x-auto">
          <table mat-table [dataSource]="pagedVisibleLogs()" class="w-full !bg-transparent">
            
            <!-- Type Column -->
            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef class="!bg-slate-50/50 !border-b !border-slate-100 !text-[11px] !font-bold !text-slate-400 !uppercase !tracking-[0.2em] !py-6 !px-8">Event Profile</th>
              <td mat-cell *matCellDef="let event" class="!border-b !border-slate-50 !px-8">
                <div class="flex items-center gap-4 py-6">
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center transition-all" [ngClass]="getLogIconAndColor(event.action).bgClass">
                    <mat-icon class="!text-xl">{{ getLogIconAndColor(event.action).icon }}</mat-icon>
                  </div>
                  <div>
                    <p class="text-sm font-bold text-slate-900 leading-tight mb-0.5">{{ event.action | titlecase }}</p>
                    <p class="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Automated Event</p>
                  </div>
                </div>
              </td>
            </ng-container>

            <!-- Description Column -->
            <ng-container matColumnDef="description">
              <th mat-header-cell *matHeaderCellDef class="!bg-slate-50/50 !border-b !border-slate-100 !text-[11px] !font-bold !text-slate-400 !uppercase !tracking-[0.2em]">Context Dossier</th>
              <td mat-cell *matCellDef="let event" class="!border-b !border-slate-50">
                <div class="max-w-md py-6">
                  <p class="text-sm text-slate-600 font-medium leading-relaxed">
                    {{ event.action === 'approved' ? 'Successfully verified application for' : 
                       event.action === 'rejected' ? 'Declined application for' : 
                       event.action === 'submitted' ? 'New service provider submission from' : 'Profile updated and resubmitted by' }} 
                    <span class="text-slate-900 font-bold">{{ event.workerName }}</span>
                  </p>
                  @if (event.reason) {
                    <p class="mt-2 text-[11px] text-rose-500 font-bold bg-rose-50/50 px-3 py-1 rounded-lg border border-rose-100/50 w-fit">Feedback: {{ event.reason }}</p>
                  }
                </div>
              </td>
            </ng-container>

            <!-- User Column -->
            <ng-container matColumnDef="user">
              <th mat-header-cell *matHeaderCellDef class="!bg-slate-50/50 !border-b !border-slate-100 !text-[11px] !font-bold !text-slate-400 !uppercase !tracking-[0.2em]">Origin Agent</th>
              <td mat-cell *matCellDef="let event" class="!border-b !border-slate-50">
                <div class="flex flex-col">
                  <p class="text-sm font-bold text-slate-900">{{ event.adminName || event.workerName }}</p>
                  <span class="text-[10px] font-black uppercase tracking-tighter" [ngClass]="event.adminName ? 'text-indigo-600' : 'text-slate-400'">
                    {{ event.adminName ? 'Staff Authority' : 'Professional' }}
                  </span>
                </div>
              </td>
            </ng-container>

            <!-- Time Column -->
            <ng-container matColumnDef="time">
              <th mat-header-cell *matHeaderCellDef class="!bg-slate-50/50 !border-b !border-slate-100 !text-[11px] !font-bold !text-slate-400 !uppercase !tracking-[0.2em]">Temporal Stamp</th>
              <td mat-cell *matCellDef="let event" class="!border-b !border-slate-50">
                <div class="flex flex-col">
                  <p class="text-sm font-bold text-slate-900">{{ event.timestamp | date:'shortTime' }}</p>
                  <p class="text-[10px] text-slate-400 font-medium uppercase">{{ event.timestamp | date:'mediumDate' }}</p>
                </div>
              </td>
            </ng-container>

            <!-- Severity Column -->
            <ng-container matColumnDef="severity">
              <th mat-header-cell *matHeaderCellDef class="!bg-slate-50/50 !border-b !border-slate-100 !text-[11px] !font-bold !text-slate-400 !uppercase !tracking-[0.2em] text-right !px-8">Criticality</th>
              <td mat-cell *matCellDef="let event" class="text-right !px-8 !border-b !border-slate-50">
                <span class="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border" 
                      [ngClass]="getLogIconAndColor(event.action).sevClass">
                  {{ event.action === 'rejected' ? 'Medium' : 'Low' }}
                </span>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let event; columns: displayedColumns;" class="hover:bg-slate-50 transition-all duration-300"></tr>
          </table>
        </div>

        @if (visibleLogs().length === 0) {
          <div class="py-32 flex flex-col items-center justify-center bg-slate-50/30">
            <div class="w-20 h-20 rounded-[32px] bg-white shadow-xl shadow-slate-100 flex items-center justify-center mb-6 border border-slate-100">
              <mat-icon class="!text-[32px] !w-auto !h-auto text-slate-200">history_toggle_off</mat-icon>
            </div>
            <h3 class="text-xl font-black text-slate-900 mb-1">Quiet Stream</h3>
            <p class="text-slate-400 font-medium text-sm">No significant events detected in the current cycle.</p>
          </div>
        }

        <div class="p-6 bg-slate-50/30 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <button (click)="loadHistoricalArchives()" class="px-8 py-3 rounded-2xl bg-white text-indigo-600 font-black text-xs uppercase tracking-widest border border-slate-200 hover:bg-slate-50 transition-all shadow-sm">
            Load Historical Archives
          </button>
          @if (visibleLogs().length > pageSize) {
            <div class="flex flex-wrap items-center justify-center gap-2">
              <button (click)="prevPage()" [disabled]="currentPage === 1" class="px-3 py-2 rounded-lg border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 disabled:opacity-40">Prev</button>
              @for (p of pageNumbers; track p) {
                <button
                  (click)="goToPage(p)"
                  class="w-8 h-8 rounded-lg border text-[10px] font-black transition-all"
                  [ngClass]="p === currentPage ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'">
                  {{ p }}
                </button>
              }
              <button (click)="nextPage()" [disabled]="currentPage >= totalPages" class="px-3 py-2 rounded-lg border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 disabled:opacity-40">Next</button>
            </div>
          }
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    :host { display: block; }
    @media (max-width: 768px) {
      .mat-mdc-table { display: block; overflow-x: auto; }
      .mat-mdc-header-row, .mat-mdc-row { min-width: 900px; }
    }
  `]
})
export class AdminActivityPage implements OnInit {
  state = inject(PlatformStateService);
  private notification = inject(NotificationService);
  private platformId = inject(PLATFORM_ID);
  displayedColumns: string[] = ['type', 'description', 'user', 'time', 'severity'];
  rejectedOnly = false;
  showAll = false;
  currentPage = 1;
  readonly pageSize = 10;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.state.fetchAdminActivityLogs();
    }
  }
  
  refresh() {
    this.state.fetchAdminActivityLogs();
  }

  visibleLogs() {
    let logs = this.state.activityLogs();
    if (this.rejectedOnly) logs = logs.filter(l => l.action === 'rejected');
    if (!this.showAll) logs = logs.slice(0, 50);
    return logs;
  }

  pagedVisibleLogs() {
    const logs = this.visibleLogs();
    const start = (this.currentPage - 1) * this.pageSize;
    return logs.slice(start, start + this.pageSize);
  }

  get totalPages() {
    return Math.max(1, Math.ceil(this.visibleLogs().length / this.pageSize));
  }

  get pageNumbers() {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  toggleRejectedOnly() {
    this.rejectedOnly = !this.rejectedOnly;
    this.currentPage = 1;
    this.notification.info(this.rejectedOnly ? 'Filter: rejected events only.' : 'Filter cleared.');
  }

  loadHistoricalArchives() {
    this.showAll = true;
    this.currentPage = 1;
    this.notification.success('Historical activity loaded.');
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  prevPage() {
    this.goToPage(this.currentPage - 1);
  }

  nextPage() {
    this.goToPage(this.currentPage + 1);
  }

  getLogIconAndColor(action: string) {
    switch (action) {
      case 'approved': return { icon: 'verified', bgClass: 'bg-emerald-50 text-emerald-600', sevClass: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
      case 'rejected': return { icon: 'report_problem', bgClass: 'bg-rose-50 text-rose-600', sevClass: 'bg-rose-50 text-rose-700 border-rose-100' };
      case 'submitted': return { icon: 'assignment_turned_in', bgClass: 'bg-indigo-50 text-indigo-600', sevClass: 'bg-indigo-50 text-indigo-700 border-indigo-100' };
      case 'resubmitted': return { icon: 'history', bgClass: 'bg-amber-50 text-amber-600', sevClass: 'bg-amber-50 text-amber-700 border-amber-100' };
      default: return { icon: 'info', bgClass: 'bg-slate-50 text-slate-500', sevClass: 'bg-slate-50 text-slate-600 border-slate-100' };
    }
  }
}
