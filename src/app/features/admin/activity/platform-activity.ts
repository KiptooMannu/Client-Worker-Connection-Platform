import { Component, inject } from '@angular/core';
import { PlatformStateService } from '../../../core/services/platform-state.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-admin-activity',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTableModule, MatChipsModule],
  template: `
    <div class="space-y-8 animate-in fade-in duration-500">
      <!-- Header -->
      <div class="flex justify-between items-end">
        <div>
          <h2 class="text-4xl font-black text-slate-900 tracking-tight">System Activity</h2>
          <p class="text-slate-500 font-medium">Real-time event stream and global platform surveillance.</p>
        </div>
        <div class="flex gap-3">
          <button mat-stroked-button class="!border-slate-300">
            <mat-icon>filter_list</mat-icon> Advanced Filter
          </button>
          <button mat-flat-button color="primary">
            <mat-icon>refresh</mat-icon> Refresh Feed
          </button>
        </div>
      </div>

      <!-- Activity Table -->
      <mat-card class="!rounded-2xl !border !border-slate-100 !shadow-sm !overflow-hidden">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 class="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
            <mat-icon class="!w-4 !h-4 !text-[16px] !text-blue-600">bolt</mat-icon>
            Live Event Stream
          </h3>
          <mat-chip class="!min-h-0 !p-0 px-2 py-0.5 !bg-teal-50 !text-teal-700 rounded text-[9px] font-black uppercase">
            System Synchronized
          </mat-chip>
        </div>

        <table mat-table [dataSource]="state.activityLogs()" class="w-full">
          <!-- Type Column -->
          <ng-container matColumnDef="type">
            <th mat-header-cell *matHeaderCellDef class="!bg-slate-900 !text-white !font-black !text-[10px] !uppercase !tracking-widest">Event Type</th>
            <td mat-cell *matCellDef="let event">
              <div class="flex items-center gap-3 py-4">
                <div class="p-2 rounded-xl" [ngClass]="getLogIconAndColor(event.action).bgClass">
                  <mat-icon class="!w-5 !h-5 !text-[20px]">{{ getLogIconAndColor(event.action).icon }}</mat-icon>
                </div>
                <span class="text-sm font-black text-slate-900">{{ event.action | titlecase }}</span>
              </div>
            </td>
          </ng-container>

          <!-- Description Column -->
          <ng-container matColumnDef="description">
            <th mat-header-cell *matHeaderCellDef class="!bg-slate-900 !text-white !font-black !text-[10px] !uppercase !tracking-widest">Description</th>
            <td mat-cell *matCellDef="let event">
              <p class="text-sm text-slate-600 max-w-md leading-relaxed font-medium">
                {{ event.action === 'approved' ? 'Approved application for' : 
                   event.action === 'rejected' ? 'Rejected application for' : 
                   event.action === 'submitted' ? 'New application submitted by' : 'Resubmitted application from' }} 
                <strong>{{ event.workerName }}</strong>
                @if (event.reason) {
                  <br><span class="text-xs text-slate-400">Reason: {{ event.reason }}</span>
                }
              </p>
            </td>
          </ng-container>

          <!-- User Column -->
          <ng-container matColumnDef="user">
            <th mat-header-cell *matHeaderCellDef class="!bg-slate-900 !text-white !font-black !text-[10px] !uppercase !tracking-widest">Origin User</th>
            <td mat-cell *matCellDef="let event">
              <p class="text-sm font-bold text-slate-900">{{ event.adminName || event.workerName }}</p>
              <p class="text-[9px] text-slate-400 font-black uppercase">{{ event.adminName ? 'Staff Admin' : 'Worker' }}</p>
            </td>
          </ng-container>

          <!-- Time Column -->
          <ng-container matColumnDef="time">
            <th mat-header-cell *matHeaderCellDef class="!bg-slate-900 !text-white !font-black !text-[10px] !uppercase !tracking-widest">Timestamp</th>
            <td mat-cell *matCellDef="let event">
              <p class="text-sm font-bold text-slate-900">{{ event.timestamp | date:'shortTime' }}</p>
              <p class="text-[9px] text-slate-400 font-black uppercase">{{ event.timestamp | date:'mediumDate' }}</p>
            </td>
          </ng-container>

          <!-- Severity Column -->
          <ng-container matColumnDef="severity">
            <th mat-header-cell *matHeaderCellDef class="!bg-slate-900 !text-white !font-black !text-[10px] !uppercase !tracking-widest text-right">Severity</th>
            <td mat-cell *matCellDef="let event" class="text-right">
              <span class="inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest" [ngClass]="getLogIconAndColor(event.action).sevClass">
                {{ event.action === 'rejected' ? 'Medium' : 'Low' }}
              </span>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let event; columns: displayedColumns;" class="hover:bg-slate-50 transition-colors"></tr>
        </table>

        <div class="p-6 bg-slate-50 flex justify-center border-t border-slate-100">
          <button mat-button class="!text-blue-600 !font-black !text-xs !uppercase !tracking-widest">Load Previous Events</button>
        </div>
      </mat-card>
    </div>
  `
})
export class AdminActivityPage {
  state = inject(PlatformStateService);
  displayedColumns: string[] = ['type', 'description', 'user', 'time', 'severity'];
  
  getLogIconAndColor(action: string) {
    switch (action) {
      case 'approved': return { icon: 'verified', bgClass: 'bg-teal-50 text-teal-600', sevClass: 'bg-teal-50 text-teal-700' };
      case 'rejected': return { icon: 'cancel', bgClass: 'bg-red-50 text-red-600', sevClass: 'bg-red-600 text-white' };
      case 'submitted': return { icon: 'file_upload', bgClass: 'bg-blue-50 text-blue-600', sevClass: 'bg-blue-50 text-blue-700' };
      case 'resubmitted': return { icon: 'published_with_changes', bgClass: 'bg-amber-50 text-amber-600', sevClass: 'bg-amber-50 text-amber-700' };
      default: return { icon: 'info', bgClass: 'bg-slate-100 text-slate-700', sevClass: 'bg-slate-100 text-slate-700' };
    }
  }
}
