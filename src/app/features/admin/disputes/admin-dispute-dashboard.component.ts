import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DisputeService } from '../../../core/services/dispute.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-dispute-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    MatDialogModule
  ],
  template: `
    <div class="max-w-7xl mx-auto space-y-4 md:space-y-6 animate-in fade-in duration-700">
      <!-- Header Section -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 class="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Dispute Resolution Console</h1>
          <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Review, mediate, and settle marketplace disputes</p>
        </div>
        <button (click)="refreshDisputes()" 
                class="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-black text-[10px] uppercase tracking-widest hover:border-brand-teal hover:text-brand-teal transition-all flex items-center gap-2 shadow-sm">
          <mat-icon class="!text-sm">refresh</mat-icon>
          Refresh Ledger
        </button>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white rounded-[20px] border border-slate-100 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Open Disputes</p>
            <p class="text-2xl font-black text-rose-600">{{ stats.openDisputes }}</p>
          </div>
          <div class="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <mat-icon class="!text-lg">warning</mat-icon>
          </div>
        </div>

        <div class="bg-white rounded-[20px] border border-slate-100 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Awaiting Evidence</p>
            <p class="text-2xl font-black text-amber-600">{{ stats.awaitingEvidence }}</p>
          </div>
          <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <mat-icon class="!text-lg">hourglass_empty</mat-icon>
          </div>
        </div>

        <div class="bg-white rounded-[20px] border border-slate-100 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">In Review</p>
            <p class="text-2xl font-black text-blue-600">{{ stats.inReview }}</p>
          </div>
          <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <mat-icon class="!text-lg">assignment</mat-icon>
          </div>
        </div>

        <div class="bg-white rounded-[20px] border border-slate-100 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Resolved</p>
            <p class="text-2xl font-black text-emerald-600">{{ stats.resolved }}</p>
          </div>
          <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <mat-icon class="!text-lg">check_circle</mat-icon>
          </div>
        </div>
      </div>

      <!-- Filters & Control Bar -->
      <div class="bg-white rounded-[20px] border border-slate-100 p-4 shadow-sm">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label class="relative block">
            <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 !text-[16px] text-slate-300 pointer-events-none">search</mat-icon>
            <input type="text" [(ngModel)]="searchTerm" (keyup)="onFilterChange()" 
                   placeholder="Search by ID, user, or reason"
                   class="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-brand-teal transition-all">
          </label>

          <select [(ngModel)]="statusFilter" (change)="onFilterChange()"
                  class="h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-brand-teal transition-all cursor-pointer">
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="AWAITING_EVIDENCE">Awaiting Evidence</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          <select [(ngModel)]="priorityFilter" (change)="onFilterChange()"
                  class="h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-brand-teal transition-all cursor-pointer">
            <option value="">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      <!-- Disputes Data Table -->
      <div class="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
        @if (isLoading) {
          <div class="py-16 flex flex-col items-center justify-center gap-3">
            <mat-spinner diameter="36" class="!text-brand-teal"></mat-spinner>
            <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest">Loading dispute records...</p>
          </div>
        } @else if (disputes.length === 0) {
          <div class="p-12 text-center">
            <mat-icon class="text-slate-200 !text-4xl !w-auto !h-auto mb-2">inbox</mat-icon>
            <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest">No disputes found</p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table mat-table [dataSource]="disputes" class="w-full text-left border-collapse">
              <!-- ID Column -->
              <ng-container matColumnDef="id">
                <th mat-header-cell *matHeaderCellDef class="!bg-slate-900 !text-white text-[9px] font-black uppercase tracking-widest px-4 py-3">Dispute ID</th>
                <td mat-cell *matCellDef="let dispute" class="px-4 py-3 text-xs font-mono font-bold text-slate-700">
                  {{ dispute.id | slice:0:8 }}
                </td>
              </ng-container>

              <!-- Client Column -->
              <ng-container matColumnDef="client">
                <th mat-header-cell *matHeaderCellDef class="!bg-slate-900 !text-white text-[9px] font-black uppercase tracking-widest px-4 py-3">Client</th>
                <td mat-cell *matCellDef="let dispute" class="px-4 py-3 text-xs font-bold text-slate-900">
                  {{ dispute.clientName }}
                </td>
              </ng-container>

              <!-- Worker Column -->
              <ng-container matColumnDef="worker">
                <th mat-header-cell *matHeaderCellDef class="!bg-slate-900 !text-white text-[9px] font-black uppercase tracking-widest px-4 py-3">Worker</th>
                <td mat-cell *matCellDef="let dispute" class="px-4 py-3 text-xs font-bold text-slate-900">
                  {{ dispute.workerName }}
                </td>
              </ng-container>

              <!-- Filed By Column -->
              <ng-container matColumnDef="filedBy">
                <th mat-header-cell *matHeaderCellDef class="!bg-slate-900 !text-white text-[9px] font-black uppercase tracking-widest px-4 py-3">Filed By</th>
                <td mat-cell *matCellDef="let dispute" class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {{ dispute.filedByName || dispute.filedByRole || 'User' }}
                </td>
              </ng-container>

              <!-- Reason Column -->
              <ng-container matColumnDef="reason">
                <th mat-header-cell *matHeaderCellDef class="!bg-slate-900 !text-white text-[9px] font-black uppercase tracking-widest px-4 py-3">Reason</th>
                <td mat-cell *matCellDef="let dispute" class="px-4 py-3 max-w-[200px]">
                  <p class="text-xs font-bold text-slate-900 truncate">{{ formatReasonKey(dispute.disputeReasonKey || dispute.reason) }}</p>
                  @if (dispute.disputeDescription) {
                    <p class="text-[10px] text-slate-400 truncate">{{ dispute.disputeDescription }}</p>
                  }
                </td>
              </ng-container>

              <!-- Evidence Column -->
              <ng-container matColumnDef="evidence">
                <th mat-header-cell *matHeaderCellDef class="!bg-slate-900 !text-white text-[9px] font-black uppercase tracking-widest px-4 py-3">Evidence</th>
                <td mat-cell *matCellDef="let dispute" class="px-4 py-3">
                  @if (dispute.evidence?.length || dispute.clientEvidenceAttachmentUrl || dispute.workerEvidenceAttachmentUrl) {
                    <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 border border-indigo-100">
                      <mat-icon class="!text-xs">attach_file</mat-icon>
                      Evidence Uploaded
                    </span>
                  } @else {
                    <span class="text-[9px] font-bold text-slate-300 uppercase">None</span>
                  }
                </td>
              </ng-container>

              <!-- Priority Column -->
              <ng-container matColumnDef="priority">
                <th mat-header-cell *matHeaderCellDef class="!bg-slate-900 !text-white text-[9px] font-black uppercase tracking-widest px-4 py-3">Priority</th>
                <td mat-cell *matCellDef="let dispute" class="px-4 py-3">
                  <span class="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest"
                        [ngClass]="{
                          'bg-rose-50 text-rose-600': dispute.priority === 'CRITICAL' || dispute.priority === 'HIGH',
                          'bg-amber-50 text-amber-600': dispute.priority === 'MEDIUM',
                          'bg-slate-100 text-slate-600': dispute.priority === 'LOW'
                        }">
                    {{ dispute.priority }}
                  </span>
                </td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef class="!bg-slate-900 !text-white text-[9px] font-black uppercase tracking-widest px-4 py-3">Status</th>
                <td mat-cell *matCellDef="let dispute" class="px-4 py-3">
                  <span class="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest"
                        [ngClass]="{
                          'bg-rose-50 text-rose-600': dispute.status === 'OPEN',
                          'bg-amber-50 text-amber-600': dispute.status === 'AWAITING_EVIDENCE',
                          'bg-blue-50 text-blue-600': dispute.status === 'IN_REVIEW',
                          'bg-emerald-50 text-emerald-600': dispute.status === 'RESOLVED'
                        }">
                    {{ dispute.status }}
                  </span>
                </td>
              </ng-container>

              <!-- Amount Column -->
              <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef class="!bg-slate-900 !text-white text-[9px] font-black uppercase tracking-widest px-4 py-3">Escrow Amount</th>
                <td mat-cell *matCellDef="let dispute" class="px-4 py-3 text-xs font-black text-slate-900">
                  KES {{ (dispute.escrowAmount || 0).toLocaleString() }}
                </td>
              </ng-container>

              <!-- Created Column -->
              <ng-container matColumnDef="created">
                <th mat-header-cell *matHeaderCellDef class="!bg-slate-900 !text-white text-[9px] font-black uppercase tracking-widest px-4 py-3">Filed Date</th>
                <td mat-cell *matCellDef="let dispute" class="px-4 py-3 text-[10px] font-bold text-slate-500">
                  {{ dispute.createdAt | date:'shortDate' }}
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef class="!bg-slate-900 !text-white text-[9px] font-black uppercase tracking-widest px-4 py-3 text-right">Actions</th>
                <td mat-cell *matCellDef="let dispute" class="px-4 py-3 text-right">
                  <button (click)="viewDispute(dispute.id)"
                          class="px-3 py-1.5 rounded-lg bg-brand-teal text-white font-black text-[9px] uppercase tracking-widest hover:bg-brand-teal-dark transition-all shadow-xs">
                    Mediate
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="border-b border-slate-50 hover:bg-slate-50/80 transition-colors"></tr>
            </table>
          </div>

          <!-- Paginator -->
          <mat-paginator [length]="totalDisputes"
                        [pageSize]="pageSize"
                        [pageSizeOptions]="[10, 20, 50]"
                        (page)="onPageChange($event)"
                        class="!border-t !border-slate-100">
          </mat-paginator>
        }
      </div>
    </div>
  `
})
export class AdminDisputeDashboardComponent implements OnInit {
  disputes: any[] = [];
  isLoading = false;
  
  stats = {
    openDisputes: 0,
    awaitingEvidence: 0,
    inReview: 0,
    resolved: 0
  };

  statusFilter = '';
  priorityFilter = '';
  searchTerm = '';
  pageSize = 20;
  currentPage = 0;
  totalDisputes = 0;

  displayedColumns = ['id', 'client', 'worker', 'filedBy', 'reason', 'evidence', 'priority', 'status', 'amount', 'created', 'actions'];

  constructor(
    private disputeService: DisputeService,
    private authService: AuthService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDisputes();
  }

  loadDisputes(): void {
    this.isLoading = true;
    // Fetch all disputes (not just assigned to current admin)
    this.disputeService.getAllDisputes(this.currentPage, this.pageSize)
      .subscribe({
        next: (response) => {
          this.disputes = response.disputes;
          this.totalDisputes = response.totalElements;
          this.isLoading = false;
          this.calculateStats();
        },
        error: (error) => {
          console.error('Error loading disputes:', error);
          this.isLoading = false;
        }
      });
  }

  calculateStats(): void {
    this.stats = {
      openDisputes: this.disputes.filter(d => d.status === 'OPEN').length,
      awaitingEvidence: this.disputes.filter(d => d.status === 'AWAITING_EVIDENCE').length,
      inReview: this.disputes.filter(d => d.status === 'IN_REVIEW').length,
      resolved: this.disputes.filter(d => d.status === 'RESOLVED').length
    };
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.loadDisputes();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadDisputes();
  }

  refreshDisputes(): void {
    this.loadDisputes();
  }

  viewDispute(disputeId: string): void {
    this.router.navigate(['/admin/disputes', disputeId]);
  }

  editDispute(disputeId: string): void {
    this.router.navigate(['/admin/disputes', disputeId, 'edit']);
  }

  formatReasonKey(key: string): string {
    return key.replace(/_/g, ' ').toLowerCase()
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
  }

  getStatusClass(status: string): string {
    const classes: {[key: string]: string} = {
      'OPEN': 'mat-warn',
      'AWAITING_EVIDENCE': 'mat-accent',
      'IN_REVIEW': 'mat-primary',
      'RESOLVED': 'mat-success'
    };
    return classes[status] || '';
  }

  getPriorityClass(priority: string): string {
    const classes: {[key: string]: string} = {
      'CRITICAL': 'bg-red-100 text-red-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'MEDIUM': 'bg-yellow-100 text-yellow-800',
      'LOW': 'bg-green-100 text-green-800'
    };
    return classes[priority] || '';
  }
}
