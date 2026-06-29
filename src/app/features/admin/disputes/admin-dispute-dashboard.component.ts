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
    FormsModule
  ],
  template: `
    <div class="p-6">
      <div class="mb-6">
        <h1 class="text-3xl font-bold mb-2">Dispute Management</h1>
        <p class="text-gray-600">Manage and resolve customer disputes</p>
      </div>

      <!-- Stats Row -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-600 text-sm">Open Disputes</p>
              <p class="text-2xl font-bold">{{ stats.openDisputes }}</p>
            </div>
            <mat-icon class="text-4xl text-red-500">warning</mat-icon>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-600 text-sm">Awaiting Evidence</p>
              <p class="text-2xl font-bold">{{ stats.awaitingEvidence }}</p>
            </div>
            <mat-icon class="text-4xl text-orange-500">hourglass_empty</mat-icon>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-600 text-sm">In Review</p>
              <p class="text-2xl font-bold">{{ stats.inReview }}</p>
            </div>
            <mat-icon class="text-4xl text-blue-500">assignment</mat-icon>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-600 text-sm">Resolved</p>
              <p class="text-2xl font-bold">{{ stats.resolved }}</p>
            </div>
            <mat-icon class="text-4xl text-green-500">check_circle</mat-icon>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow p-4 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <mat-form-field class="w-full">
            <mat-label>Status Filter</mat-label>
            <mat-select [(value)]="statusFilter" (selectionChange)="onFilterChange()">
              <mat-option value="">All Statuses</mat-option>
              <mat-option value="OPEN">Open</mat-option>
              <mat-option value="AWAITING_EVIDENCE">Awaiting Evidence</mat-option>
              <mat-option value="IN_REVIEW">In Review</mat-option>
              <mat-option value="RESOLVED">Resolved</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field class="w-full">
            <mat-label>Priority Filter</mat-label>
            <mat-select [(value)]="priorityFilter" (selectionChange)="onFilterChange()">
              <mat-option value="">All Priorities</mat-option>
              <mat-option value="CRITICAL">Critical</mat-option>
              <mat-option value="HIGH">High</mat-option>
              <mat-option value="MEDIUM">Medium</mat-option>
              <mat-option value="LOW">Low</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field class="w-full">
            <mat-label>Search</mat-label>
            <input matInput [(ngModel)]="searchTerm" (keyup)="onFilterChange()" placeholder="Search by booking or user...">
          </mat-form-field>

          <button mat-raised-button color="primary" (click)="refreshDisputes()">
            <mat-icon>refresh</mat-icon> Refresh
          </button>
        </div>
      </div>

      <!-- Disputes Table -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <mat-spinner *ngIf="isLoading" class="mx-auto py-8"></mat-spinner>

        <table mat-table [dataSource]="disputes" *ngIf="!isLoading" class="w-full">
          <!-- Dispute ID Column -->
          <ng-container matColumnDef="id">
            <th mat-header-cell *matHeaderCellDef>Dispute ID</th>
            <td mat-cell *matCellDef="let dispute">
              {{ dispute.id | slice:0:8 }}...
            </td>
          </ng-container>

          <!-- Client Column -->
          <ng-container matColumnDef="client">
            <th mat-header-cell *matHeaderCellDef>Client</th>
            <td mat-cell *matCellDef="let dispute">
              {{ dispute.clientName }}
            </td>
          </ng-container>

          <!-- Worker Column -->
          <ng-container matColumnDef="worker">
            <th mat-header-cell *matHeaderCellDef>Worker</th>
            <td mat-cell *matCellDef="let dispute">
              {{ dispute.workerName }}
            </td>
          </ng-container>

          <!-- Reason Column -->
          <ng-container matColumnDef="reason">
            <th mat-header-cell *matHeaderCellDef>Reason</th>
            <td mat-cell *matCellDef="let dispute">
              {{ formatReasonKey(dispute.disputeReasonKey) }}
            </td>
          </ng-container>

          <!-- Priority Column -->
          <ng-container matColumnDef="priority">
            <th mat-header-cell *matHeaderCellDef>Priority</th>
            <td mat-cell *matCellDef="let dispute">
              <mat-chip [ngClass]="getPriorityClass(dispute.priority)">
                {{ dispute.priority }}
              </mat-chip>
            </td>
          </ng-container>

          <!-- Status Column -->
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let dispute">
              <mat-chip [ngClass]="getStatusClass(dispute.status)">
                {{ dispute.status }}
              </mat-chip>
            </td>
          </ng-container>

          <!-- Amount Column -->
          <ng-container matColumnDef="amount">
            <th mat-header-cell *matHeaderCellDef>Escrow Amount</th>
            <td mat-cell *matCellDef="let dispute">
              KES {{ dispute.escrowAmount | number:'1.2-2' }}
            </td>
          </ng-container>

          <!-- Created Column -->
          <ng-container matColumnDef="created">
            <th mat-header-cell *matHeaderCellDef>Created</th>
            <td mat-cell *matCellDef="let dispute">
              {{ dispute.createdAt | date:'short' }}
            </td>
          </ng-container>

          <!-- Actions Column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let dispute">
              <button mat-icon-button (click)="viewDispute(dispute.id)" matTooltip="View Details">
                <mat-icon>visibility</mat-icon>
              </button>
              <button mat-icon-button (click)="editDispute(dispute.id)" matTooltip="Edit">
                <mat-icon>edit</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>

        <!-- Paginator -->
        <mat-paginator *ngIf="!isLoading" 
                      [length]="totalDisputes"
                      [pageSize]="pageSize"
                      [pageSizeOptions]="[10, 20, 50]"
                      (page)="onPageChange($event)">
        </mat-paginator>

        <!-- Empty State -->
        <div *ngIf="!isLoading && disputes.length === 0" class="p-8 text-center">
          <mat-icon class="text-6xl text-gray-300 mx-auto mb-4">inbox</mat-icon>
          <p class="text-gray-600">No disputes found</p>
        </div>
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

  displayedColumns = ['id', 'client', 'worker', 'reason', 'priority', 'status', 'amount', 'created', 'actions'];

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
    const currentUser = this.authService.currentUser();
    if (!currentUser?.id) {
      this.disputes = [];
      this.totalDisputes = 0;
      this.isLoading = false;
      return;
    }

    this.disputeService.getAdminDisputes(currentUser.id, this.currentPage, this.pageSize)
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
