import { Component, inject, signal, computed, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PlatformStateService, Booking, JobProgress } from '../../../core/services/platform-state.service';
import { NotificationService } from '../../../core/services/notification.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

// ── Status metadata ────────────────────────────────────────────────────────────

interface StatusMeta {
  label: string;
  icon: string;
  color: string;
  bg: string;
  border: string;
  accent: string;
  priority: number;
}

const STATUS_META: Record<string, StatusMeta> = {
  PENDING:            { label: 'Pending',           icon: 'hourglass_empty',      color: 'text-amber-700',   bg: 'bg-amber-50',    border: 'border-amber-200',  accent: 'bg-amber-400',   priority: 0 },
  NEGOTIATING:        { label: 'Negotiating',        icon: 'compare_arrows',       color: 'text-blue-700',    bg: 'bg-blue-50',     border: 'border-blue-200',   accent: 'bg-blue-400',    priority: 1 },
  ACCEPTED:           { label: 'Accepted',           icon: 'handshake',            color: 'text-blue-700',    bg: 'bg-blue-50',     border: 'border-blue-200',   accent: 'bg-blue-500',    priority: 2 },
  ASSIGNED:           { label: 'Assigned',           icon: 'person_pin',           color: 'text-cyan-700',    bg: 'bg-cyan-50',     border: 'border-cyan-200',   accent: 'bg-cyan-500',    priority: 3 },
  IN_PROGRESS:        { label: 'In Progress',        icon: 'construction',         color: 'text-indigo-700',  bg: 'bg-indigo-50',   border: 'border-indigo-200', accent: 'bg-indigo-500',  priority: 4 },
  SUBMITTED:          { label: 'Awaiting Review',    icon: 'assignment_turned_in', color: 'text-violet-700',  bg: 'bg-violet-50',   border: 'border-violet-200', accent: 'bg-violet-500',  priority: 5 },
  REVISION_REQUESTED: { label: 'Revision',           icon: 'edit_note',            color: 'text-orange-700',  bg: 'bg-orange-50',   border: 'border-orange-200', accent: 'bg-orange-400',  priority: 6 },
  APPROVED:           { label: 'Approved',           icon: 'verified',             color: 'text-teal-700',    bg: 'bg-teal-50',     border: 'border-teal-200',   accent: 'bg-teal-500',    priority: 7 },
  COMPLETED:          { label: 'Completed',          icon: 'task_alt',             color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-200',accent: 'bg-emerald-500', priority: 8 },
  DISPUTED:           { label: 'Disputed',           icon: 'gavel',                color: 'text-rose-700',    bg: 'bg-rose-50',     border: 'border-rose-200',   accent: 'bg-rose-500',    priority: 9 },
  PARTIALLY_SETTLED:  { label: 'Partial Settled',   icon: 'call_split',           color: 'text-purple-700',  bg: 'bg-purple-50',   border: 'border-purple-200', accent: 'bg-purple-400',  priority: 10 },
  FORCE_COMPLETED:    { label: 'Force Completed',    icon: 'admin_panel_settings', color: 'text-emerald-800', bg: 'bg-emerald-100', border: 'border-emerald-300',accent: 'bg-emerald-600', priority: 11 },
  REFUNDED:           { label: 'Refunded',           icon: 'undo',                 color: 'text-sky-700',     bg: 'bg-sky-50',      border: 'border-sky-200',    accent: 'bg-sky-400',     priority: 12 },
  REJECTED:           { label: 'Rejected',           icon: 'cancel',               color: 'text-slate-600',   bg: 'bg-slate-100',   border: 'border-slate-200',  accent: 'bg-slate-400',   priority: 13 },
  CANCELLED:          { label: 'Cancelled',          icon: 'block',                color: 'text-slate-500',   bg: 'bg-slate-50',    border: 'border-slate-200',  accent: 'bg-slate-300',   priority: 14 },
};

function normalizeStatus(raw: string): string {
  if (!raw) return 'PENDING';
  const s = raw.trim().toUpperCase().replace(/ /g, '_');
  // Map display variants
  const mapped: Record<string, string> = {
    'IN_PROGRESS': 'IN_PROGRESS',
    'REVISION_REQUESTED': 'REVISION_REQUESTED',
    'PARTIALLY_SETTLED': 'PARTIALLY_SETTLED',
    'FORCE_COMPLETED': 'FORCE_COMPLETED',
    'PARTIAL_SETTLED': 'PARTIALLY_SETTLED',
  };
  return mapped[s] ?? (STATUS_META[s] ? s : 'PENDING');
}

const TERMINAL_STATUSES = new Set(['COMPLETED', 'REJECTED', 'CANCELLED', 'FORCE_COMPLETED', 'REFUNDED', 'PARTIALLY_SETTLED']);

type ModalType = 'force_complete' | 'full_refund' | 'cancel_job' | 'request_evidence' | null;

@Component({
  selector: 'app-admin-job-tracker',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatIconModule, MatButtonModule,
    MatProgressBarModule, MatTooltipModule
  ],
  template: `
    <div class="max-w-7xl mx-auto space-y-4 md:space-y-6 animate-in fade-in duration-700">

      <!-- ── Header ─────────────────────────────────────────────────────── -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="text-[9px] font-black uppercase tracking-widest text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">Live</span>
            <span class="text-[9px] font-black uppercase tracking-widest text-slate-400">Job Progress Tracker</span>
          </div>
          <h1 class="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Worker × Client Job Monitor</h1>
          <p class="text-slate-500 text-xs font-medium mt-1">Real-time overview of every job — filter, search, and resolve disputes with evidence.</p>
        </div>
        <button (click)="refresh()" [disabled]="loading()"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50 shadow-lg shadow-slate-900/10 self-start md:self-auto">
          <mat-icon class="!text-sm" [class.animate-spin]="loading()">refresh</mat-icon>
          {{ loading() ? 'Loading…' : 'Refresh' }}
        </button>
      </div>

      <!-- ── Stats Strip ────────────────────────────────────────────────── -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        @for (stat of summaryStats(); track stat.label) {
          <mat-card class="!rounded-2xl !border !shadow-sm !p-4 bg-white transition-all"
                    [class]="stat.urgent ? '!border-rose-200 !bg-rose-50/60' : '!border-slate-100'">
            <!-- Two columns at 320px leaves ~108px inside each card, of which the
                 icon takes 48px. Without min-w-0 the widest labels
                 ("AWAITING FUNDING") pushed past the card edge. -->
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" [class]="stat.iconBg">
                <mat-icon class="!text-sm" [class]="stat.iconColor">{{ stat.icon }}</mat-icon>
              </div>
              <div class="min-w-0">
                <p class="text-[8px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1 truncate">{{ stat.label }}</p>
                <p class="text-xl font-black leading-none" [class]="stat.urgent ? 'text-rose-700' : 'text-slate-900'">{{ stat.value }}</p>
              </div>
            </div>
            <mat-progress-bar mode="determinate" [value]="stat.progress" class="!mt-3 !h-1 !rounded-full"></mat-progress-bar>
          </mat-card>
        }
      </div>

      <!-- ── Pipeline Strip ────────────────────────────────────────────── -->
      <mat-card class="!rounded-2xl !border !border-slate-100 !shadow-sm !p-5 bg-white">
        <p class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-4">Filter by Status</p>
        <div class="flex gap-2 flex-wrap">
          @for (col of pipelineCols(); track col.status) {
            <button (click)="toggleStatusFilter(col.status)"
              class="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all"
              [class]="activeStatusFilter() === col.status
                ? col.meta.bg + ' ' + col.meta.border + ' ' + col.meta.color + ' shadow-sm scale-[1.04]'
                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'">
              <mat-icon class="!text-[10px] !w-3.5 !h-3.5">{{ col.meta.icon }}</mat-icon>
              {{ col.meta.label }}
              <span class="ml-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-black leading-none"
                    [class]="activeStatusFilter() === col.status
                      ? 'bg-white/70 ' + col.meta.color
                      : 'bg-slate-100 text-slate-600'">{{ col.count }}</span>
            </button>
          }
          @if (activeStatusFilter()) {
            <button (click)="clearFilter()"
              class="flex items-center gap-1 px-3 py-2 rounded-xl border border-dashed border-slate-300 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:border-rose-300 hover:text-rose-500 transition-all">
              <mat-icon class="!text-xs">close</mat-icon> Clear filter
            </button>
          }
        </div>
      </mat-card>

      <!-- ── Search & Sort ─────────────────────────────────────────────── -->
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="relative flex-1">
          <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 !text-sm text-slate-400 pointer-events-none">search</mat-icon>
          <input [value]="searchQuery()" (input)="onSearch($event)"
            placeholder="Search by worker, client, or description…"
            id="job-search-input"
            class="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all shadow-sm"/>
        </div>
        <select [value]="sortKey()" (change)="onSort($event)"
          class="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 shadow-sm cursor-pointer min-w-[160px]">
          <option value="date_desc">Newest First</option>
          <option value="date_asc">Oldest First</option>
          <option value="cost_desc">Highest Cost</option>
          <option value="worker_az">Worker A → Z</option>
          <option value="client_az">Client A → Z</option>
        </select>
      </div>

      <!-- ── Jobs Table ─────────────────────────────────────────────────── -->
      <mat-card class="!rounded-2xl !border !border-slate-100 !shadow-sm !overflow-hidden bg-white">

        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-black uppercase tracking-widest text-slate-700">
              {{ filteredJobs().length }} job{{ filteredJobs().length !== 1 ? 's' : '' }}
              @if (activeStatusFilter() || searchQuery()) { <span class="text-slate-400 font-medium normal-case tracking-normal"> (filtered)</span> }
            </span>
          </div>
          <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Page {{ currentPage() }} / {{ totalPages() }}</span>
        </div>

        @if (loading()) {
          <div class="py-20 flex flex-col items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
              <mat-icon class="text-indigo-400 animate-spin !text-3xl">sync</mat-icon>
            </div>
            <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Fetching jobs…</p>
          </div>
        } @else if (filteredJobs().length === 0) {
          <div class="py-20 flex flex-col items-center gap-3">
            <mat-icon class="!text-5xl text-slate-200">work_off</mat-icon>
            <p class="text-sm font-black text-slate-800">No jobs found</p>
            @if (activeStatusFilter() || searchQuery()) {
              <button (click)="clearAll()" class="mt-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Clear All Filters</button>
            }
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-900 text-white">
                  <th class="px-4 py-3 text-[8px] font-black uppercase tracking-widest w-3"></th>
                  <th class="px-5 py-3 text-[8px] font-black uppercase tracking-widest">Worker</th>
                  <th class="px-5 py-3 text-[8px] font-black uppercase tracking-widest">Client</th>
                  <th class="px-5 py-3 text-[8px] font-black uppercase tracking-widest hidden md:table-cell">Description</th>
                  <th class="px-5 py-3 text-[8px] font-black uppercase tracking-widest hidden lg:table-cell">Date</th>
                  <th class="px-5 py-3 text-[8px] font-black uppercase tracking-widest hidden lg:table-cell text-right">Cost (KES)</th>
                  <th class="px-5 py-3 text-[8px] font-black uppercase tracking-widest text-center">Status</th>
                  <th class="px-5 py-3 text-[8px] font-black uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (job of pagedJobs(); track job.id) {

                  <!-- Main Row -->
                  <tr class="border-b border-slate-50 hover:bg-slate-50/60 transition-colors cursor-pointer group"
                      (click)="toggleExpand(job.id)">

                    <td class="pl-3 pr-0 py-0">
                      <div class="w-1 h-10 rounded-full" [class]="getMeta(job).accent"></div>
                    </td>

                    <!-- Worker -->
                    <td class="px-5 py-3">
                      <div class="flex items-center gap-2">
                        <div class="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-[9px] uppercase flex-shrink-0">{{ job.workerInitials }}</div>
                        <span class="text-[11px] font-black text-slate-900 whitespace-nowrap">{{ job.workerName }}</span>
                      </div>
                    </td>

                    <!-- Client -->
                    <td class="px-5 py-3">
                      <div class="flex items-center gap-2">
                        <div class="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-black text-[9px] uppercase flex-shrink-0">{{ job.clientInitials }}</div>
                        <span class="text-[11px] font-bold text-slate-700 whitespace-nowrap">{{ job.clientName }}</span>
                      </div>
                    </td>

                    <td class="px-5 py-3 hidden md:table-cell max-w-[200px]">
                      <p class="text-[10px] font-medium text-slate-500 truncate max-w-[180px]">{{ job.service || '—' }}</p>
                    </td>

                    <td class="px-5 py-3 hidden lg:table-cell whitespace-nowrap">
                      <p class="text-[10px] font-bold text-slate-700">{{ job.date }}</p>
                    </td>

                    <td class="px-5 py-3 hidden lg:table-cell text-right">
                      <span class="text-[11px] font-black text-slate-800">{{ job.earnings ? job.earnings.toLocaleString() : '—' }}</span>
                    </td>

                    <!-- Status pill -->
                    <td class="px-5 py-3 text-center">
                      <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border whitespace-nowrap"
                            [class]="getMeta(job).bg + ' ' + getMeta(job).border + ' ' + getMeta(job).color">
                        <mat-icon class="!text-[9px] !w-3 !h-3">{{ getMeta(job).icon }}</mat-icon>
                        {{ getMeta(job).label }}
                      </span>
                      @if (getKey(job) === 'DISPUTED') {
                        <span class="block text-[7px] font-black text-rose-500 mt-0.5 uppercase tracking-widest animate-pulse">⚡ Needs Review</span>
                      }
                    </td>

                    <!-- Actions -->
                    <td class="px-5 py-3 text-right" (click)="$event.stopPropagation()">
                      <div class="flex items-center gap-1 justify-end">

                        <!-- Dispute resolution buttons (open modals) -->
                        @if (getKey(job) === 'DISPUTED') {
                          <button (click)="openModal('force_complete', job)" [disabled]="isUpdating(job.id)"
                            matTooltip="Force Complete — releases escrow to worker (requires reason)"
                            class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[8px] font-black uppercase tracking-wider hover:bg-emerald-100 transition-all disabled:opacity-50 whitespace-nowrap">
                            <mat-icon class="!text-[10px]">task_alt</mat-icon>Complete
                          </button>
                          <button (click)="openModal('full_refund', job)" [disabled]="isUpdating(job.id)"
                            matTooltip="Full Refund — refund client (requires reason)"
                            class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 text-[8px] font-black uppercase tracking-wider hover:bg-sky-100 transition-all disabled:opacity-50 whitespace-nowrap">
                            <mat-icon class="!text-[10px]">undo</mat-icon>Refund
                          </button>
                        }

                        <!-- Force cancel for non-terminal, non-disputed -->
                        @if (!isTerminal(job) && getKey(job) !== 'DISPUTED') {
                          <button (click)="openModal('cancel_job', job)" [disabled]="isUpdating(job.id)"
                            matTooltip="Admin: Force cancel (requires reason)"
                            class="p-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-all disabled:opacity-50">
                            <mat-icon class="!text-xs">close</mat-icon>
                          </button>
                        }

                        @if (isUpdating(job.id)) {
                          <mat-icon class="!text-sm text-slate-400 animate-spin">sync</mat-icon>
                        }

                        <button class="p-1.5 rounded-lg text-slate-300 group-hover:text-slate-500 hover:text-indigo-600 transition-colors"
                                (click)="toggleExpand(job.id)">
                          <mat-icon class="!text-sm transition-transform duration-200" [class.rotate-180]="expandedJobId() === job.id">expand_more</mat-icon>
                        </button>
                      </div>
                    </td>
                  </tr>

                  <!-- ── Expanded Detail Row ────────────────────────────── -->
                  @if (expandedJobId() === job.id) {
                    <tr class="bg-gradient-to-b from-slate-50/80 to-white border-b border-slate-100">
                      <td colspan="8" class="px-6 py-6">
                        <div class="space-y-6">

                          <!-- Top: metadata + journey -->
                          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <!-- Job meta -->
                            <div class="space-y-3">
                              <p class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Job Details</p>
                              <div class="space-y-2.5">
                                <div class="flex items-center gap-2">
                                  <mat-icon class="!text-xs text-slate-300">badge</mat-icon>
                                  <span class="text-[10px] text-slate-400">ID:</span>
                                  <span class="text-[10px] font-black text-slate-700 font-mono">{{ job.id.slice(0,8) }}…</span>
                                </div>
                                <div class="flex items-center gap-2">
                                  <mat-icon class="!text-xs text-slate-300">calendar_today</mat-icon>
                                  <span class="text-[10px] text-slate-400">Created:</span>
                                  <span class="text-[10px] font-black text-slate-700">{{ job.date }}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                  <mat-icon class="!text-xs text-slate-300">payments</mat-icon>
                                  <span class="text-[10px] text-slate-400">Cost:</span>
                                  <span class="text-[10px] font-black text-slate-700">{{ job.earnings ? 'KES ' + job.earnings.toLocaleString() : 'Not set' }}</span>
                                </div>
                                @if (job.submittedAt) {
                                  <div class="flex items-center gap-2">
                                    <mat-icon class="!text-xs text-violet-400">assignment_turned_in</mat-icon>
                                    <span class="text-[10px] text-slate-400">Submitted:</span>
                                    <span class="text-[10px] font-black text-slate-700">{{ formatDate(job.submittedAt) }}</span>
                                  </div>
                                }
                                @if (job.disputedAt) {
                                  <div class="flex items-center gap-2">
                                    <mat-icon class="!text-xs text-rose-400">gavel</mat-icon>
                                    <span class="text-[10px] text-slate-400">Disputed:</span>
                                    <span class="text-[10px] font-black text-rose-700">{{ formatDate(job.disputedAt) }}</span>
                                  </div>
                                }
                                @if (job.resolvedAt) {
                                  <div class="flex items-center gap-2">
                                    <mat-icon class="!text-xs text-emerald-400">check_circle</mat-icon>
                                    <span class="text-[10px] text-slate-400">Resolved:</span>
                                    <span class="text-[10px] font-black text-emerald-700">{{ formatDate(job.resolvedAt) }}</span>
                                  </div>
                                }
                                @if (job.adminDecisionReason) {
                                  <div class="mt-2 p-2.5 rounded-lg bg-slate-800 text-white">
                                    <p class="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Admin Decision</p>
                                    <p class="text-[10px] font-medium">{{ job.adminDecisionReason }}</p>
                                    @if (job.workerPartialAmount || job.clientPartialAmount) {
                                      <p class="text-[9px] mt-1 text-slate-300">Worker: KES {{ job.workerPartialAmount?.toLocaleString() }} · Client: KES {{ job.clientPartialAmount?.toLocaleString() }}</p>
                                    }
                                  </div>
                                }
                              </div>
                            </div>

                            <!-- Description + Journey -->
                            <div class="md:col-span-2 space-y-4">
                              <div>
                                <p class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Description</p>
                                <p class="text-xs font-medium text-slate-600 leading-relaxed bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                                  {{ job.service || 'No description provided.' }}
                                </p>
                              </div>
                              <div>
                                <p class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Status Journey</p>
                                <div class="flex items-center gap-1 flex-wrap">
                                  @for (step of journeySteps; track step.key; let last = $last) {
                                    <div class="flex items-center gap-1">
                                      <div class="flex items-center gap-1 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all"
                                           [class]="isStepReached(job, step.key)
                                             ? STATUS_META[step.key].bg + ' ' + STATUS_META[step.key].color
                                             : 'bg-slate-100 text-slate-400'">
                                        <mat-icon class="!text-[9px] !w-3 !h-3">{{ step.icon }}</mat-icon>
                                        {{ step.label }}
                                      </div>
                                      @if (!last) { <mat-icon class="!text-[9px] text-slate-300 !w-3 !h-3">arrow_forward_ios</mat-icon> }
                                    </div>
                                  }
                                </div>
                              </div>
                            </div>
                          </div>

                          <!-- ── Dispute Section (only if disputed) ──────── -->
                          @if (job.disputeReason || job.disputeResponse) {
                            <div class="border-t border-rose-100 pt-5">
                              <div class="flex items-center gap-2 mb-4">
                                <div class="w-6 h-6 rounded-lg bg-rose-100 flex items-center justify-center">
                                  <mat-icon class="!text-xs text-rose-600">gavel</mat-icon>
                                </div>
                                <p class="text-[10px] font-black uppercase tracking-widest text-rose-700">Dispute Evidence Review</p>
                              </div>

                              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

                                <!-- Client Side -->
                                <div class="rounded-xl border border-rose-200 bg-rose-50/50 p-4">
                                  <div class="flex items-center gap-2 mb-3">
                                    <div class="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-black text-[8px]">{{ job.clientInitials }}</div>
                                    <div>
                                      <p class="text-[9px] font-black text-rose-800">{{ job.clientName }} (Client)</p>
                                      <p class="text-[8px] text-rose-500 uppercase tracking-widest">Dispute Filed</p>
                                    </div>
                                  </div>
                                  @if (job.disputeReason) {
                                    <div class="mb-2">
                                      <p class="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1">Reason</p>
                                      <p class="text-[10px] font-medium text-slate-700 bg-white rounded-lg p-3 border border-rose-100">{{ job.disputeReason }}</p>
                                    </div>
                                  }
                                  @if (job.disputeEvidence) {
                                    <div class="mb-2">
                                      <p class="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1">Evidence Details</p>
                                      <p class="text-[10px] font-medium text-slate-700 bg-white rounded-lg p-3 border border-rose-100">{{ job.disputeEvidence }}</p>
                                    </div>
                                  }
                                  @if (job.disputeAttachmentUrl) {
                                    <a [href]="job.disputeAttachmentUrl" target="_blank"
                                       class="inline-flex items-center gap-1 text-[9px] font-black text-rose-600 hover:text-rose-800 underline">
                                      <mat-icon class="!text-xs">attachment</mat-icon>View Attachment
                                    </a>
                                  }
                                  @if (!job.disputeEvidence && !job.disputeAttachmentUrl) {
                                    <p class="text-[9px] text-slate-400 italic">No supporting evidence provided.</p>
                                  }
                                </div>

                                <!-- Worker Side -->
                                <div class="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
                                  <div class="flex items-center gap-2 mb-3">
                                    <div class="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-[8px]">{{ job.workerInitials }}</div>
                                    <div>
                                      <p class="text-[9px] font-black text-indigo-800">{{ job.workerName }} (Worker)</p>
                                      <p class="text-[8px] text-indigo-500 uppercase tracking-widest">
                                        {{ job.disputeResponse ? 'Response Filed' : 'No Response Yet' }}
                                      </p>
                                    </div>
                                  </div>
                                  @if (job.disputeResponse) {
                                    <div class="mb-2">
                                      <p class="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1">Response</p>
                                      <p class="text-[10px] font-medium text-slate-700 bg-white rounded-lg p-3 border border-indigo-100">{{ job.disputeResponse }}</p>
                                    </div>
                                  }
                                  @if (job.disputeResponseEvidence) {
                                    <div class="mb-2">
                                      <p class="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1">Evidence</p>
                                      <p class="text-[10px] font-medium text-slate-700 bg-white rounded-lg p-3 border border-indigo-100">{{ job.disputeResponseEvidence }}</p>
                                    </div>
                                  }
                                  @if (job.disputeResponseAttachmentUrl) {
                                    <a [href]="job.disputeResponseAttachmentUrl" target="_blank"
                                       class="inline-flex items-center gap-1 text-[9px] font-black text-indigo-600 hover:text-indigo-800 underline">
                                      <mat-icon class="!text-xs">attachment</mat-icon>View Attachment
                                    </a>
                                  }
                                  @if (!job.disputeResponse) {
                                    <div class="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                                      <mat-icon class="!text-xs text-amber-600">warning</mat-icon>
                                      <p class="text-[9px] font-black text-amber-700">Worker has not yet responded to this dispute.</p>
                                    </div>
                                  }
                                </div>
                              </div>

                              <!-- ── Dispute Scorecard ──────────────────── -->
                              <div class="mt-4 rounded-xl border border-slate-200 bg-white p-5">
                                <div class="flex items-center justify-between mb-4">
                                  <p class="text-[10px] font-black uppercase tracking-widest text-slate-700">🧮 Evidence Scorecard</p>
                                  <span class="text-[9px] font-black px-3 py-1 rounded-full"
                                        [class]="getScoreClass(computeDisputeScore(job))">
                                    {{ getScoreVerdict(computeDisputeScore(job)) }}
                                  </span>
                                </div>

                                <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                  @for (item of getScorecardItems(job); track item.label) {
                                    <div class="rounded-lg p-3 text-center" [class]="item.value ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50 border border-slate-200'">
                                      <mat-icon class="!text-base" [class]="item.value ? 'text-emerald-600' : 'text-slate-300'">{{ item.icon }}</mat-icon>
                                      <p class="text-[8px] font-black uppercase tracking-widest mt-1" [class]="item.value ? 'text-emerald-700' : 'text-slate-400'">{{ item.label }}</p>
                                      <p class="text-[9px] font-black" [class]="item.value ? 'text-emerald-800' : 'text-slate-400'">{{ item.value ? '✓ Yes' : '✗ No' }}</p>
                                    </div>
                                  }
                                </div>

                                <div class="flex items-center gap-3">
                                  <div class="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                                    <div class="h-full rounded-full transition-all duration-500"
                                         [class]="computeDisputeScore(job) >= 4 ? 'bg-emerald-500' : computeDisputeScore(job) >= 2 ? 'bg-amber-400' : 'bg-rose-500'"
                                         [style.width.%]="(computeDisputeScore(job) / 6) * 100"></div>
                                  </div>
                                  <span class="text-[9px] font-black text-slate-600">{{ computeDisputeScore(job) }}/6</span>
                                </div>

                                <p class="text-[9px] text-slate-500 mt-3">
                                  <strong>How to use:</strong> High score (5-6) = worker delivered, favour Force Complete.
                                  Mid score (3-4) = use Partial Settlement. Low score (0-2) = client has strong case, favour Refund.
                                  This is a <em>guide only</em> — admin must review evidence before acting.
                                </p>
                              </div>
                            </div>
                          }

                          <!-- ── Progress Log ───────────────────────────── -->
                          @if (jobProgressMap()[job.id]?.length) {
                            <div class="border-t border-slate-100 pt-5">
                              <p class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Worker Progress Log</p>
                              <div class="space-y-2">
                                @for (log of jobProgressMap()[job.id]; track log.id) {
                                  <div class="flex gap-3 bg-white rounded-xl border border-slate-100 p-3 shadow-sm">
                                    <div class="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                      <mat-icon class="!text-xs text-indigo-500">update</mat-icon>
                                    </div>
                                    <div class="flex-1">
                                      <p class="text-[10px] font-medium text-slate-700">{{ log.description }}</p>
                                      @if (log.attachmentUrl) {
                                        <a [href]="log.attachmentUrl" target="_blank"
                                           class="text-[9px] text-indigo-600 hover:underline inline-flex items-center gap-0.5 mt-0.5">
                                          <mat-icon class="!text-[9px]">attachment</mat-icon>Attachment
                                        </a>
                                      }
                                    </div>
                                    <span class="text-[8px] text-slate-400 whitespace-nowrap">{{ formatDate(log.createdAt) }}</span>
                                  </div>
                                }
                              </div>
                            </div>
                          }

                        </div>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="px-6 py-4 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
              <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Showing {{ (currentPage()-1)*pageSize + 1 }}–{{ pageEnd() }} of {{ filteredJobs().length }}
              </span>
              <div class="flex gap-1.5">
                <button (click)="goToPage(currentPage() - 1)" [disabled]="currentPage() === 1"
                  class="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-30 hover:text-indigo-600 hover:border-indigo-200 transition-all">
                  <mat-icon class="!text-sm">chevron_left</mat-icon>
                </button>
                @for (p of pageNumbers(); track p) {
                  <button (click)="goToPage(p)"
                    class="w-8 h-8 flex items-center justify-center rounded-lg border text-[10px] font-black transition-all"
                    [class]="p === currentPage() ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'">
                    {{ p }}
                  </button>
                }
                <button (click)="goToPage(currentPage() + 1)" [disabled]="currentPage() === totalPages()"
                  class="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-30 hover:text-indigo-600 hover:border-indigo-200 transition-all">
                  <mat-icon class="!text-sm">chevron_right</mat-icon>
                </button>
              </div>
            </div>
          }
        }
      </mat-card>
    </div>

    <!-- ════════════════════════════════════════════════════════════════════
         ACTION CONFIRMATION MODALS
    ══════════════════════════════════════════════════════════════════════ -->
    @if (activeModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4"
           (click)="closeModal()">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>

        <div class="relative z-10 bg-white rounded-3xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200"
             (click)="$event.stopPropagation()">

          <!-- Modal Header -->
          <div class="p-6 border-b border-slate-100" [class]="modalHeaderClass()">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl flex items-center justify-center" [class]="modalIconBg()">
                <mat-icon class="!text-xl" [class]="modalIconColor()">{{ modalIcon() }}</mat-icon>
              </div>
              <div>
                <h2 class="text-base font-black text-slate-900">{{ modalTitle() }}</h2>
                <p class="text-[10px] text-slate-500 font-medium">Job ID: {{ modalJobId()?.slice(0,8) }}…</p>
              </div>
            </div>
          </div>

          <div class="p-6 space-y-5">

            <!-- Warning banner -->
            <div class="flex items-start gap-3 p-4 rounded-xl" [class]="modalWarnBg()">
              <mat-icon class="!text-sm flex-shrink-0 mt-0.5" [class]="modalWarnIcon()">warning</mat-icon>
              <p class="text-[10px] font-medium" [class]="modalWarnText()">{{ modalWarning() }}</p>
            </div>

            <!-- Job details pill row -->
            @if (modalJob()) {
              <div class="flex gap-3 flex-wrap">
                <span class="px-3 py-1.5 rounded-lg bg-slate-100 text-[9px] font-black text-slate-600">
                  Worker: {{ modalJob()!.workerName }}
                </span>
                <span class="px-3 py-1.5 rounded-lg bg-slate-100 text-[9px] font-black text-slate-600">
                  Client: {{ modalJob()!.clientName }}
                </span>
                <span class="px-3 py-1.5 rounded-lg bg-slate-100 text-[9px] font-black text-slate-600">
                  KES {{ modalJob()!.earnings.toLocaleString() }}
                </span>
              </div>
            }

            <!-- Reason (required) -->
            <div>
              <label class="text-[9px] font-black uppercase tracking-widest text-slate-600 block mb-1.5">
                Decision Reason <span class="text-rose-500">*</span>
              </label>
              <textarea [(ngModel)]="modalReason" rows="3"
                placeholder="Explain the basis for this decision clearly. This will be recorded and sent to both parties…"
                class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 resize-none transition-all"></textarea>
            </div>

            <!-- Evidence notes (optional) -->
            <div>
              <label class="text-[9px] font-black uppercase tracking-widest text-slate-600 block mb-1.5">
                Evidence Notes <span class="text-slate-400">(optional)</span>
              </label>
              <textarea [(ngModel)]="modalEvidenceNotes" rows="2"
                placeholder="Note which evidence was most relevant to your decision…"
                class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none transition-all"></textarea>
            </div>

          </div>

          <!-- Modal Footer -->
          <div class="px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-3xl flex items-center justify-between gap-3">
            <button (click)="closeModal()"
              class="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">
              Cancel
            </button>
            <button (click)="confirmAction()"
              [disabled]="!modalReason.trim() || submittingModal()"
              class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40 shadow-lg"
              [class]="modalConfirmClass()">
              @if (submittingModal()) {
                <mat-icon class="!text-sm animate-spin">sync</mat-icon>
              } @else {
                <mat-icon class="!text-sm">{{ modalIcon() }}</mat-icon>
              }
              {{ submittingModal() ? 'Processing…' : modalConfirmLabel() }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .animate-spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .rotate-180 { transform: rotate(180deg); }
  `]
})
export class AdminJobTrackerPage implements OnInit {
  readonly STATUS_META = STATUS_META;
  readonly Math = Math;

  private state   = inject(PlatformStateService);
  private notify  = inject(NotificationService);
  private http    = inject(HttpClient);
  private pid     = inject(PLATFORM_ID);
  private apiUrl  = environment.apiUrl;

  // ── Table signals ──────────────────────────────────────────────────────
  loading            = signal(false);
  activeStatusFilter = signal<string | null>(null);
  expandedJobId      = signal<string | null>(null);
  updatingIds        = signal<Set<string>>(new Set());
  searchQuery        = signal('');
  sortKey            = signal('date_desc');
  currentPage        = signal(1);
  readonly pageSize  = 12;

  // ── Progress log cache (jobId → log[]) ────────────────────────────────
  jobProgressMap = signal<Record<string, JobProgress[]>>({});

  // ── Modal signals ──────────────────────────────────────────────────────
  activeModal       = signal<ModalType>(null);
  modalJobId        = signal<string | null>(null);
  modalJobRef       = signal<Booking | null>(null);
  modalReason       = '';
  modalEvidenceNotes = '';
  submittingModal   = signal(false);

  modalJob = computed(() => this.modalJobRef());

  // ── Journey definition ─────────────────────────────────────────────────
  readonly journeySteps = [
    { key: 'PENDING',     label: 'Pending',   icon: 'hourglass_empty'      },
    { key: 'ACCEPTED',    label: 'Accepted',  icon: 'handshake'            },
    { key: 'IN_PROGRESS', label: 'Working',   icon: 'construction'         },
    { key: 'SUBMITTED',   label: 'Delivered', icon: 'assignment_turned_in' },
    { key: 'APPROVED',    label: 'Approved',  icon: 'verified'             },
    { key: 'COMPLETED',   label: 'Done',      icon: 'task_alt'             },
  ];
  private readonly journeyOrder = this.journeySteps.map(s => s.key);

  ngOnInit() {
    if (isPlatformBrowser(this.pid)) {
      this.refresh();
    }
  }

  // ── Refresh ────────────────────────────────────────────────────────────
  refresh() {
    if (this.loading()) return;
    this.loading.set(true);
    this.http.get<any[]>(`${this.apiUrl}/jobs/all`).subscribe({
      next: (raw) => {
        this.state.allBookings.set(raw.map(b => {
          const status = (b.status || 'PENDING').split('_')
            .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
          const createdAtMs = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return {
            id: b.id,
            clientId: b.clientId,
            clientName: b.clientName || 'Client',
            clientInitials: (b.clientName || 'CL').split(' ').filter((n: string) => n).map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
            workerId: b.workerId,
            workerName: b.workerName || 'Worker',
            workerInitials: (b.workerName || 'WK').split(' ').filter((n: string) => n).map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
            service: b.description || b.service || 'Service Request',
            date: b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A',
            rawDate: createdAtMs,
            earnings: b.totalCost || 0,
            status: status as any,
            rating: b.rating,
            hasReview: b.rating !== undefined && b.rating !== null,
            // lifecycle
            startedAt: b.startedAt, submittedAt: b.submittedAt, approvedAt: b.approvedAt,
            disputedAt: b.disputedAt, resolvedAt: b.resolvedAt, deadline: b.deadline,
            // dispute
            disputeReason: b.disputeReason, disputeEvidence: b.disputeEvidence,
            disputeAttachmentUrl: b.disputeAttachmentUrl, disputeResponse: b.disputeResponse,
            disputeResponseEvidence: b.disputeResponseEvidence,
            disputeResponseAttachmentUrl: b.disputeResponseAttachmentUrl,
            // admin
            adminDecisionReason: b.adminDecisionReason, adminEvidenceNotes: b.adminEvidenceNotes,
            workerPartialAmount: b.workerPartialAmount, clientPartialAmount: b.clientPartialAmount,
            hasActiveDispute: b.hasActiveDispute,
          } as Booking;
        }));

        // Load progress for all disputed jobs
        const disputed = raw.filter(b => (b.status || '').toUpperCase() === 'DISPUTED');
        disputed.forEach(b => this.loadProgress(b.id));

        this.loading.set(false);
      },
      error: (err) => {
        console.error('Job tracker refresh error', err);
        this.notify.error('Failed to load jobs from server.');
        this.loading.set(false);
      }
    });
  }

  loadProgress(jobId: string) {
    this.state.getProgress(jobId).subscribe({
      next: (logs) => this.jobProgressMap.update(m => ({ ...m, [jobId]: logs })),
      error: () => {}
    });
  }

  // ── Expand row + lazy-load progress ───────────────────────────────────
  toggleExpand(id: string) {
    const wasExpanded = this.expandedJobId() === id;
    this.expandedJobId.update(cur => cur === id ? null : id);
    if (!wasExpanded && !this.jobProgressMap()[id]) {
      this.loadProgress(id);
    }
  }

  // ── Computed: filter + sort + page ────────────────────────────────────
  filteredJobs = computed<Booking[]>(() => {
    let jobs = [...this.state.allBookings()];
    const sf = this.activeStatusFilter();
    if (sf) jobs = jobs.filter(j => normalizeStatus(j.status) === sf);
    const q = this.searchQuery().toLowerCase().trim();
    if (q) jobs = jobs.filter(j =>
      (j.workerName || '').toLowerCase().includes(q) ||
      (j.clientName || '').toLowerCase().includes(q) ||
      (j.service    || '').toLowerCase().includes(q)
    );
    switch (this.sortKey()) {
      case 'date_asc':  jobs.sort((a, b) => (a.rawDate ?? 0) - (b.rawDate ?? 0)); break;
      case 'cost_desc': jobs.sort((a, b) => (b.earnings ?? 0) - (a.earnings ?? 0)); break;
      case 'worker_az': jobs.sort((a, b) => (a.workerName ?? '').localeCompare(b.workerName ?? '')); break;
      case 'client_az': jobs.sort((a, b) => (a.clientName ?? '').localeCompare(b.clientName ?? '')); break;
      default:          jobs.sort((a, b) => (b.rawDate ?? 0) - (a.rawDate ?? 0)); break;
    }
    return jobs;
  });

  pagedJobs    = computed<Booking[]>(() => this.filteredJobs().slice((this.currentPage()-1)*this.pageSize, this.currentPage()*this.pageSize));
  totalPages   = computed(() => Math.max(1, Math.ceil(this.filteredJobs().length / this.pageSize)));
  pageEnd      = computed(() => Math.min(this.currentPage() * this.pageSize, this.filteredJobs().length));
  pageNumbers  = computed<number[]>(() => {
    const tp = this.totalPages(), cp = this.currentPage();
    const start = Math.max(1, cp - 2), end = Math.min(tp, cp + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  summaryStats = computed(() => {
    const jobs = this.state.allBookings();
    const total    = jobs.length;
    const active   = jobs.filter(j => !TERMINAL_STATUSES.has(normalizeStatus(j.status))).length;
    const awaiting = jobs.filter(j => normalizeStatus(j.status) === 'SUBMITTED').length;
    const disputed = jobs.filter(j => normalizeStatus(j.status) === 'DISPUTED').length;
    const pct = (n: number) => total ? Math.round((n / total) * 100) : 0;
    return [
      { label: 'Total Jobs',        value: total,    icon: 'work',                 iconBg: 'bg-slate-100', iconColor: 'text-slate-600',  progress: 100,           urgent: false },
      { label: 'Active',            value: active,   icon: 'bolt',                 iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600', progress: pct(active),   urgent: false },
      { label: 'Awaiting Approval', value: awaiting, icon: 'assignment_turned_in', iconBg: 'bg-violet-50', iconColor: 'text-violet-600', progress: pct(awaiting), urgent: false },
      { label: 'Disputed 🚨',       value: disputed, icon: 'gavel',               iconBg: 'bg-rose-50',   iconColor: 'text-rose-600',   progress: pct(disputed), urgent: disputed > 0 },
    ];
  });

  pipelineCols = computed(() =>
    Object.entries(STATUS_META)
      .map(([status, meta]) => ({ status, meta, count: this.state.allBookings().filter(j => normalizeStatus(j.status) === status).length }))
      .filter(c => c.count > 0)
      .sort((a, b) => a.meta.priority - b.meta.priority)
  );

  // ── Dispute Scorecard ──────────────────────────────────────────────────
  computeDisputeScore(job: Booking): number {
    let score = 0;
    if (job.submittedAt)                  score++; // Worker actually delivered
    if (job.disputeResponse)              score++; // Worker responded
    if (job.disputeResponseEvidence)      score++; // Worker provided evidence
    if (job.disputeResponseAttachmentUrl) score++; // Worker attached proof
    if ((this.jobProgressMap()[job.id]?.length ?? 0) > 0) score++; // Worker logged progress
    const progressCount = this.jobProgressMap()[job.id]?.length ?? 0;
    if (progressCount >= 3)               score++; // Multiple progress updates
    return Math.min(score, 6);
  }

  getScoreVerdict(score: number): string {
    if (score >= 5) return '✅ Favour Worker';
    if (score >= 3) return '⚖️ Balanced — Consider Split';
    return '🔴 Favour Client';
  }

  getScoreClass(score: number): string {
    if (score >= 5) return 'bg-emerald-100 text-emerald-800 font-black';
    if (score >= 3) return 'bg-amber-100 text-amber-800 font-black';
    return 'bg-rose-100 text-rose-800 font-black';
  }

  getScorecardItems(job: Booking): { label: string; icon: string; value: boolean }[] {
    return [
      { label: 'Work Submitted',      icon: 'assignment_turned_in', value: !!job.submittedAt },
      { label: 'Worker Responded',    icon: 'reply',                value: !!job.disputeResponse },
      { label: 'Worker Evidence',     icon: 'description',          value: !!job.disputeResponseEvidence },
      { label: 'Worker Attachment',   icon: 'attachment',           value: !!job.disputeResponseAttachmentUrl },
      { label: 'Progress Logged',     icon: 'update',               value: (this.jobProgressMap()[job.id]?.length ?? 0) > 0 },
      { label: '3+ Progress Updates', icon: 'trending_up',          value: (this.jobProgressMap()[job.id]?.length ?? 0) >= 3 },
    ];
  }

  // ── Modal helpers ──────────────────────────────────────────────────────
  openModal(type: ModalType, job: Booking) {
    this.activeModal.set(type);
    this.modalJobId.set(job.id);
    this.modalJobRef.set(job);
    this.modalReason = '';
    this.modalEvidenceNotes = '';
  }

  closeModal() {
    if (this.submittingModal()) return;
    this.activeModal.set(null);
    this.modalJobId.set(null);
    this.modalJobRef.set(null);
  }

  confirmAction() {
    const jobId = this.modalJobId();
    const type  = this.activeModal();
    if (!jobId || !type || !this.modalReason.trim()) return;

    this.submittingModal.set(true);
    this.markUpdating(jobId, true);

    const decisionTypeMap: Record<string, string> = {
      force_complete:    'FORCE_COMPLETE',
      full_refund:       'FULL_REFUND',
      cancel_job:        'CANCEL_JOB',
      request_evidence:  'REQUEST_MORE_EVIDENCE',
    };

    const payload: any = {
      decisionType:  decisionTypeMap[type],
      reason:        this.modalReason.trim(),
      evidenceNotes: this.modalEvidenceNotes.trim(),
    };

    this.state.adminResolveDispute(jobId, payload).subscribe({
      next: () => {
        const labels: Record<string, string> = {
          force_complete:   'Job force-completed. Worker payment released.',
          full_refund:      'Full refund issued to client.',
          cancel_job:       'Job cancelled and client refunded.',
          request_evidence: 'Evidence request logged.',
        };
        this.notify.success(labels[type] ?? 'Action completed.');
        this.submittingModal.set(false);
        this.markUpdating(jobId, false);
        this.closeModal();
        this.refresh();
      },
      error: (err) => {
        this.notify.error(err?.error || 'Action failed. Please try again.');
        this.submittingModal.set(false);
        this.markUpdating(jobId, false);
      }
    });
  }

  // ── Modal computed metadata ────────────────────────────────────────────
  modalTitle = computed(() => {
    switch (this.activeModal()) {
      case 'force_complete':   return 'Force Complete Job';
      case 'full_refund':      return 'Issue Full Refund';
      case 'cancel_job':       return 'Force Cancel Job';
      case 'request_evidence': return 'Request More Evidence';
      default:                 return 'Admin Action';
    }
  });

  modalWarning = computed(() => {
    switch (this.activeModal()) {
      case 'force_complete':   return 'This will immediately release the full escrow amount to the worker and mark the job as complete. This action cannot be undone.';
      case 'full_refund':      return 'This will refund the full job payment to the client. The worker will not receive any payment. This action cannot be undone.';
      case 'cancel_job':       return 'This will cancel the job and trigger a full refund to the client. The worker will be notified. This action cannot be undone.';
      case 'request_evidence': return 'The dispute will remain open. Both parties will be notified that more evidence is required before a decision can be made.';
      default:                 return '';
    }
  });

  modalIcon = computed(() => {
    switch (this.activeModal()) {
      case 'force_complete':   return 'task_alt';
      case 'full_refund':      return 'undo';
      case 'cancel_job':       return 'block';
      case 'request_evidence': return 'help_outline';
      default:                 return 'admin_panel_settings';
    }
  });

  modalIconBg = computed(() => {
    switch (this.activeModal()) {
      case 'force_complete':   return 'bg-emerald-100';
      case 'full_refund':      return 'bg-sky-100';
      case 'cancel_job':       return 'bg-rose-100';
      default:                 return 'bg-slate-100';
    }
  });

  modalIconColor = computed(() => {
    switch (this.activeModal()) {
      case 'force_complete':   return 'text-emerald-600';
      case 'full_refund':      return 'text-sky-600';
      case 'cancel_job':       return 'text-rose-600';
      default:                 return 'text-slate-600';
    }
  });

  modalHeaderClass = computed(() => 'bg-slate-50/50');

  modalWarnBg = computed(() => {
    switch (this.activeModal()) {
      case 'force_complete': return 'bg-emerald-50 border border-emerald-200';
      case 'full_refund':    return 'bg-sky-50 border border-sky-200';
      case 'cancel_job':     return 'bg-rose-50 border border-rose-200';
      default:               return 'bg-amber-50 border border-amber-200';
    }
  });

  modalWarnIcon = computed(() => {
    switch (this.activeModal()) {
      case 'force_complete': return 'text-emerald-600';
      case 'full_refund':    return 'text-sky-600';
      case 'cancel_job':     return 'text-rose-600';
      default:               return 'text-amber-600';
    }
  });

  modalWarnText = computed(() => {
    switch (this.activeModal()) {
      case 'force_complete': return 'text-emerald-800';
      case 'full_refund':    return 'text-sky-800';
      case 'cancel_job':     return 'text-rose-800';
      default:               return 'text-amber-800';
    }
  });

  modalConfirmLabel = computed(() => {
    switch (this.activeModal()) {
      case 'force_complete':   return 'Force Complete';
      case 'full_refund':      return 'Issue Full Refund';
      case 'cancel_job':       return 'Cancel Job';
      case 'request_evidence': return 'Request Evidence';
      default:                 return 'Confirm';
    }
  });

  modalConfirmClass = computed(() => {
    switch (this.activeModal()) {
      case 'force_complete':   return 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200';
      case 'full_refund':      return 'bg-sky-600 hover:bg-sky-700 shadow-sky-200';
      case 'cancel_job':       return 'bg-rose-600 hover:bg-rose-700 shadow-rose-200';
      default:                 return 'bg-slate-800 hover:bg-slate-900 shadow-slate-200';
    }
  });

  // ── Status helpers ─────────────────────────────────────────────────────
  getMeta(job: Booking): StatusMeta { return STATUS_META[normalizeStatus(job.status)] ?? STATUS_META['PENDING']; }
  getKey(job: Booking): string      { return normalizeStatus(job.status); }
  isTerminal(job: Booking): boolean { return TERMINAL_STATUSES.has(normalizeStatus(job.status)); }
  isUpdating(id: string): boolean   { return this.updatingIds().has(id); }

  isStepReached(job: Booking, stepKey: string): boolean {
    const current = normalizeStatus(job.status);
    if (['DISPUTED', 'REVISION_REQUESTED', 'CANCELLED', 'REJECTED'].includes(current)) {
      return stepKey === 'PENDING' || stepKey === 'ACCEPTED';
    }
    const ci = this.journeyOrder.indexOf(current);
    const si = this.journeyOrder.indexOf(stepKey);
    return ci !== -1 && si !== -1 && si <= ci;
  }

  formatDate(val?: string): string {
    if (!val) return '—';
    try { return new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return '—'; }
  }

  // ── Filter/sort/page handlers ──────────────────────────────────────────
  onSearch(e: Event)           { this.searchQuery.set((e.target as HTMLInputElement).value); this.currentPage.set(1); }
  onSort(e: Event)             { this.sortKey.set((e.target as HTMLSelectElement).value); this.currentPage.set(1); }
  toggleStatusFilter(s: string){ this.activeStatusFilter.update(cur => cur === s ? null : s); this.currentPage.set(1); }
  clearFilter()                { this.activeStatusFilter.set(null); this.currentPage.set(1); }
  clearAll()                   { this.activeStatusFilter.set(null); this.searchQuery.set(''); this.currentPage.set(1); }
  goToPage(p: number)          { if (p >= 1 && p <= this.totalPages()) this.currentPage.set(p); }

  private markUpdating(id: string, val: boolean) {
    this.updatingIds.update(s => { const next = new Set(s); val ? next.add(id) : next.delete(id); return next; });
  }
}
