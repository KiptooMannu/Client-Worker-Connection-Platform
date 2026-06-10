import { Component, inject, signal, computed, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PlatformStateService, Booking } from '../../../core/services/platform-state.service';
import { NotificationService } from '../../../core/services/notification.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

// ── Status metadata ────────────────────────────────────────────────────────────
// mapBooking() in PlatformStateService converts API statuses to "Display Format"
// e.g. IN_PROGRESS → "In Progress", REVISION_REQUESTED → "Revision Requested"
// normalizeStatus() here converts any variant back to SCREAMING_SNAKE_CASE for lookups.

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
  PENDING:            { label: 'Pending',           icon: 'hourglass_empty',      color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',  accent: 'bg-amber-400',  priority: 0 },
  ACCEPTED:           { label: 'Accepted',          icon: 'handshake',            color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200',   accent: 'bg-blue-500',   priority: 1 },
  IN_PROGRESS:        { label: 'In Progress',       icon: 'construction',         color: 'text-indigo-700',  bg: 'bg-indigo-50',  border: 'border-indigo-200', accent: 'bg-indigo-500', priority: 2 },
  SUBMITTED:          { label: 'Awaiting Review',   icon: 'assignment_turned_in', color: 'text-violet-700',  bg: 'bg-violet-50',  border: 'border-violet-200', accent: 'bg-violet-500', priority: 3 },
  REVISION_REQUESTED: { label: 'Revision',          icon: 'edit_note',            color: 'text-orange-700',  bg: 'bg-orange-50',  border: 'border-orange-200', accent: 'bg-orange-400', priority: 4 },
  APPROVED:           { label: 'Approved',          icon: 'verified',             color: 'text-teal-700',    bg: 'bg-teal-50',    border: 'border-teal-200',   accent: 'bg-teal-500',   priority: 5 },
  COMPLETED:          { label: 'Completed',         icon: 'task_alt',             color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200',accent: 'bg-emerald-500',priority: 6 },
  DISPUTED:           { label: 'Disputed',          icon: 'gavel',                color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-200',   accent: 'bg-rose-500',   priority: 7 },
  REJECTED:           { label: 'Rejected',          icon: 'cancel',               color: 'text-slate-600',   bg: 'bg-slate-100',  border: 'border-slate-200',  accent: 'bg-slate-400',  priority: 8 },
  CANCELLED:          { label: 'Cancelled',         icon: 'block',                color: 'text-slate-500',   bg: 'bg-slate-50',   border: 'border-slate-200',  accent: 'bg-slate-300',  priority: 9 },
};

// Maps every known status variant → SCREAMING_SNAKE key in STATUS_META
function normalizeStatus(raw: string): string {
  if (!raw) return 'PENDING';
  const s = raw.trim().toUpperCase();
  // Handle display-format (e.g. "In Progress", "Revision Requested")
  const mapped: Record<string, string> = {
    'IN PROGRESS':        'IN_PROGRESS',
    'REVISION REQUESTED': 'REVISION_REQUESTED',
    'REVISION':           'REVISION_REQUESTED',
  };
  // Replace spaces with underscores first for a generic pass
  const spaceReplaced = s.replace(/ /g, '_');
  return mapped[s] ?? (STATUS_META[spaceReplaced] ? spaceReplaced : (STATUS_META[s] ? s : 'PENDING'));
}

const TERMINAL_STATUSES = new Set(['COMPLETED', 'REJECTED', 'CANCELLED']);

@Component({
  selector: 'app-admin-job-tracker',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatIconModule, MatButtonModule,
    MatProgressBarModule, MatTooltipModule
  ],
  template: `
    <div class="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-700 p-4 md:p-0">

      <!-- ── Header ─────────────────────────────────────────────────────── -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">Live</span>
            <span class="text-[9px] font-black uppercase tracking-widest text-slate-400">Job Progress Tracker</span>
          </div>
          <h1 class="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Worker × Client Job Monitor</h1>
          <p class="text-slate-500 text-xs font-medium mt-1">Real-time overview of every job — filter by status, search, and resolve disputes.</p>
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
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" [class]="stat.iconBg">
                <mat-icon class="!text-sm" [class]="stat.iconColor">{{ stat.icon }}</mat-icon>
              </div>
              <div>
                <p class="text-[8px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">{{ stat.label }}</p>
                <p class="text-xl font-black leading-none" [class]="stat.urgent ? 'text-rose-700' : 'text-slate-900'">{{ stat.value }}</p>
              </div>
            </div>
            <mat-progress-bar mode="determinate" [value]="stat.progress"
              class="!mt-3 !h-1 !rounded-full">
            </mat-progress-bar>
          </mat-card>
        }
      </div>

      <!-- ── Pipeline Strip (Status Filter Buttons) ────────────────────── -->
      <mat-card class="!rounded-2xl !border !border-slate-100 !shadow-sm !p-5 bg-white">
        <p class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-4">
          Filter by Status — click a pill to filter the table
        </p>
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
          @if (pipelineCols().length === 0) {
            <p class="text-[10px] text-slate-400 font-medium">No jobs loaded yet.</p>
          }
          @if (activeStatusFilter()) {
            <button (click)="clearFilter()"
              class="flex items-center gap-1 px-3 py-2 rounded-xl border border-dashed border-slate-300 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:border-rose-300 hover:text-rose-500 transition-all">
              <mat-icon class="!text-xs">close</mat-icon> Clear filter
            </button>
          }
        </div>
      </mat-card>

      <!-- ── Search & Sort Bar ─────────────────────────────────────────── -->
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="relative flex-1">
          <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 !text-sm text-slate-400 pointer-events-none">search</mat-icon>
          <input
            [value]="searchQuery()"
            (input)="onSearch($event)"
            placeholder="Search by worker name, client name, or description…"
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

        <!-- Table Header Bar -->
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-indigo-500" [class.animate-pulse]="!loading()"></div>
            <span class="text-[10px] font-black uppercase tracking-widest text-slate-700">
              {{ filteredJobs().length }} job{{ filteredJobs().length !== 1 ? 's' : '' }}
              @if (activeStatusFilter() || searchQuery()) { <span class="text-slate-400 font-medium normal-case tracking-normal"> (filtered)</span> }
            </span>
          </div>
          <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            Page {{ currentPage() }} / {{ totalPages() }}
          </span>
        </div>

        <!-- Loading state -->
        @if (loading()) {
          <div class="py-20 flex flex-col items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
              <mat-icon class="text-indigo-400 animate-spin !text-3xl">sync</mat-icon>
            </div>
            <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Fetching jobs from server…</p>
          </div>

        <!-- Empty state -->
        } @else if (filteredJobs().length === 0) {
          <div class="py-20 flex flex-col items-center gap-3">
            <div class="w-16 h-16 rounded-[20px] bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm">
              <mat-icon class="!text-3xl !w-auto !h-auto text-slate-200">work_off</mat-icon>
            </div>
            <p class="text-sm font-black text-slate-800">No jobs found</p>
            <p class="text-[10px] text-slate-400 font-medium">
              @if (activeStatusFilter() || searchQuery()) {
                Try clearing filters or searching with different terms.
              } @else {
                No jobs exist on the platform yet.
              }
            </p>
            @if (activeStatusFilter() || searchQuery()) {
              <button (click)="clearAll()" class="mt-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
                Clear All Filters
              </button>
            }
          </div>

        <!-- Table -->
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

                    <!-- Status accent bar -->
                    <td class="pl-3 pr-0 py-0">
                      <div class="w-1 h-10 rounded-full" [class]="getMeta(job).accent"></div>
                    </td>

                    <!-- Worker -->
                    <td class="px-5 py-3">
                      <div class="flex items-center gap-2">
                        <div class="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-[9px] uppercase flex-shrink-0">
                          {{ job.workerInitials }}
                        </div>
                        <span class="text-[11px] font-black text-slate-900 whitespace-nowrap">{{ job.workerName }}</span>
                      </div>
                    </td>

                    <!-- Client -->
                    <td class="px-5 py-3">
                      <div class="flex items-center gap-2">
                        <div class="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-black text-[9px] uppercase flex-shrink-0">
                          {{ job.clientInitials }}
                        </div>
                        <span class="text-[11px] font-bold text-slate-700 whitespace-nowrap">{{ job.clientName }}</span>
                      </div>
                    </td>

                    <!-- Description -->
                    <td class="px-5 py-3 hidden md:table-cell max-w-[200px]">
                      <p class="text-[10px] font-medium text-slate-500 truncate max-w-[180px]">{{ job.service || '—' }}</p>
                    </td>

                    <!-- Date -->
                    <td class="px-5 py-3 hidden lg:table-cell whitespace-nowrap">
                      <p class="text-[10px] font-bold text-slate-700">{{ job.date }}</p>
                    </td>

                    <!-- Cost -->
                    <td class="px-5 py-3 hidden lg:table-cell text-right">
                      <span class="text-[11px] font-black text-slate-800">
                        {{ job.earnings ? job.earnings.toLocaleString() : '—' }}
                      </span>
                    </td>

                    <!-- Status pill -->
                    <td class="px-5 py-3 text-center">
                      <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border whitespace-nowrap"
                            [class]="getMeta(job).bg + ' ' + getMeta(job).border + ' ' + getMeta(job).color">
                        <mat-icon class="!text-[9px] !w-3 !h-3">{{ getMeta(job).icon }}</mat-icon>
                        {{ getMeta(job).label }}
                      </span>
                    </td>

                    <!-- Actions -->
                    <td class="px-5 py-3 text-right" (click)="$event.stopPropagation()">
                      <div class="flex items-center gap-1 justify-end">

                        <!-- Dispute resolution buttons -->
                        @if (getKey(job) === 'DISPUTED') {
                          <button (click)="resolveDispute(job.id, 'COMPLETED')"
                            [disabled]="isUpdating(job.id)"
                            matTooltip="Force Complete — releases escrow payment to worker"
                            class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[8px] font-black uppercase tracking-wider hover:bg-emerald-100 transition-all disabled:opacity-50 whitespace-nowrap">
                            <mat-icon class="!text-[10px]">task_alt</mat-icon>Resolve
                          </button>
                          <button (click)="resolveDispute(job.id, 'CANCELLED')"
                            [disabled]="isUpdating(job.id)"
                            matTooltip="Cancel job & refund client"
                            class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[8px] font-black uppercase tracking-wider hover:bg-rose-100 transition-all disabled:opacity-50 whitespace-nowrap">
                            <mat-icon class="!text-[10px]">block</mat-icon>Cancel
                          </button>
                        }

                        <!-- Force cancel for any non-terminal, non-disputed job -->
                        @if (!isTerminal(job) && getKey(job) !== 'DISPUTED') {
                          <button (click)="forceCancel(job.id)"
                            [disabled]="isUpdating(job.id)"
                            matTooltip="Admin: Force cancel this job (triggers refund)"
                            class="p-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-all disabled:opacity-50">
                            <mat-icon class="!text-xs">close</mat-icon>
                          </button>
                        }

                        <!-- Updating spinner -->
                        @if (isUpdating(job.id)) {
                          <mat-icon class="!text-sm text-slate-400 animate-spin">sync</mat-icon>
                        }

                        <!-- Expand/collapse toggle -->
                        <button class="p-1.5 rounded-lg text-slate-300 group-hover:text-slate-500 hover:text-indigo-600 transition-colors"
                                (click)="toggleExpand(job.id)">
                          <mat-icon class="!text-sm transition-transform duration-200" [class.rotate-180]="expandedJobId() === job.id">
                            expand_more
                          </mat-icon>
                        </button>
                      </div>
                    </td>
                  </tr>

                  <!-- Expanded Detail Row -->
                  @if (expandedJobId() === job.id) {
                    <tr class="bg-gradient-to-b from-slate-50/80 to-white border-b border-slate-100">
                      <td colspan="8" class="px-6 py-5">
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

                          <!-- Left: Job metadata -->
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
                                <span class="text-[10px] font-black text-slate-700">
                                  {{ job.earnings ? 'KES ' + job.earnings.toLocaleString() : 'Not set' }}
                                </span>
                              </div>
                              @if (job.rating) {
                                <div class="flex items-center gap-2">
                                  <mat-icon class="!text-xs text-amber-400">star</mat-icon>
                                  <span class="text-[10px] text-slate-400">Rating:</span>
                                  <span class="text-[10px] font-black text-slate-700">{{ job.rating }} / 5</span>
                                </div>
                              }
                            </div>
                          </div>

                          <!-- Right: Description + Status Journey -->
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
                                    @if (!last) {
                                      <mat-icon class="!text-[9px] text-slate-300 !w-3 !h-3">arrow_forward_ios</mat-icon>
                                    }
                                  </div>
                                }
                              </div>
                            </div>
                          </div>
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
                    [class]="p === currentPage()
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'">
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
  `,
  styles: [`
    :host { display: block; }
    .animate-spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .rotate-180 { transform: rotate(180deg); }
  `]
})
export class AdminJobTrackerPage implements OnInit {
  // Expose STATUS_META to template
  readonly STATUS_META = STATUS_META;

  private state   = inject(PlatformStateService);
  private notify  = inject(NotificationService);
  private http    = inject(HttpClient);
  private pid     = inject(PLATFORM_ID);
  private apiUrl  = environment.apiUrl;

  // ── State signals (all reactive — computed() will track these) ────────
  loading          = signal(false);
  activeStatusFilter = signal<string | null>(null);
  expandedJobId    = signal<string | null>(null);
  updatingIds      = signal<Set<string>>(new Set());
  searchQuery      = signal('');
  sortKey          = signal('date_desc');
  currentPage      = signal(1);
  readonly pageSize = 12;

  // ── Static journey definition (linear happy path) ─────────────────────
  readonly journeySteps = [
    { key: 'PENDING',     label: 'Pending',   icon: 'hourglass_empty'       },
    { key: 'ACCEPTED',    label: 'Accepted',  icon: 'handshake'             },
    { key: 'IN_PROGRESS', label: 'Working',   icon: 'construction'          },
    { key: 'SUBMITTED',   label: 'Delivered', icon: 'assignment_turned_in'  },
    { key: 'APPROVED',    label: 'Approved',  icon: 'verified'              },
    { key: 'COMPLETED',   label: 'Done',      icon: 'task_alt'              },
  ];
  private readonly journeyOrder = this.journeySteps.map(s => s.key);

  ngOnInit() {
    if (isPlatformBrowser(this.pid)) {
      this.refresh();
    }
  }

  // ── Refresh: delegate entirely to state service (single HTTP call) ───
  refresh() {
    if (this.loading()) return;
    this.loading.set(true);
    this.http.get<any[]>(`${this.apiUrl}/jobs/all`).subscribe({
      next: (raw) => {
        // Let the state service do its own mapping via fetchAllJobs.
        // We pass the raw result directly into allBookings to avoid a second round-trip.
        this.state.allBookings.set(
          raw.map((b: any) => {
            const status = (b.status || 'PENDING').split('_')
              .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
              .join(' ');
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
              hasReview: b.rating !== undefined && b.rating !== null
            };
          })
        );
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Job tracker refresh error', err);
        this.notify.error('Failed to load jobs from server.');
        this.loading.set(false);
      }
    });
  }

  // ── Computed: filtered + sorted + paged list ─────────────────────────
  // All dependencies (searchQuery, sortKey, activeStatusFilter, currentPage)
  // are signals, so computed() correctly tracks and re-runs on changes.
  filteredJobs = computed<Booking[]>(() => {
    let jobs = [...this.state.allBookings()];

    // 1. Status filter
    const sf = this.activeStatusFilter();
    if (sf) {
      jobs = jobs.filter(j => normalizeStatus(j.status) === sf);
    }

    // 2. Text search
    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      jobs = jobs.filter(j =>
        (j.workerName || '').toLowerCase().includes(q) ||
        (j.clientName || '').toLowerCase().includes(q) ||
        (j.service    || '').toLowerCase().includes(q)
      );
    }

    // 3. Sort (using rawDate for date comparisons — locale strings don't sort correctly)
    switch (this.sortKey()) {
      case 'date_asc':  jobs.sort((a, b) => (a.rawDate ?? 0) - (b.rawDate ?? 0)); break;
      case 'cost_desc': jobs.sort((a, b) => (b.earnings ?? 0) - (a.earnings ?? 0)); break;
      case 'worker_az': jobs.sort((a, b) => (a.workerName ?? '').localeCompare(b.workerName ?? '')); break;
      case 'client_az': jobs.sort((a, b) => (a.clientName ?? '').localeCompare(b.clientName ?? '')); break;
      default:          jobs.sort((a, b) => (b.rawDate ?? 0) - (a.rawDate ?? 0)); break; // date_desc
    }

    return jobs;
  });

  pagedJobs = computed<Booking[]>(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredJobs().slice(start, start + this.pageSize);
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredJobs().length / this.pageSize)));

  // Upper bound for the current page — used in the pagination label instead of `| min`
  pageEnd = computed(() => Math.min(this.currentPage() * this.pageSize, this.filteredJobs().length));

  pageNumbers = computed<number[]>(() => {
    const tp = this.totalPages();
    const cp = this.currentPage();
    const start = Math.max(1, cp - 2);
    const end   = Math.min(tp, cp + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  // ── Summary stats ─────────────────────────────────────────────────────
  summaryStats = computed(() => {
    const jobs  = this.state.allBookings();
    const total    = jobs.length;
    const active   = jobs.filter(j => !TERMINAL_STATUSES.has(normalizeStatus(j.status))).length;
    const awaiting = jobs.filter(j => normalizeStatus(j.status) === 'SUBMITTED').length;
    const disputed = jobs.filter(j => normalizeStatus(j.status) === 'DISPUTED').length;
    const pct = (n: number) => total ? Math.round((n / total) * 100) : 0;

    return [
      { label: 'Total Jobs',        value: total,    icon: 'work',                 iconBg: 'bg-slate-100',  iconColor: 'text-slate-600',  progress: 100,      urgent: false },
      { label: 'Active',            value: active,   icon: 'bolt',                 iconBg: 'bg-indigo-50',  iconColor: 'text-indigo-600', progress: pct(active),   urgent: false },
      { label: 'Awaiting Approval', value: awaiting, icon: 'assignment_turned_in', iconBg: 'bg-violet-50',  iconColor: 'text-violet-600', progress: pct(awaiting), urgent: false },
      { label: 'Disputed 🚨',       value: disputed, icon: 'gavel',               iconBg: 'bg-rose-50',    iconColor: 'text-rose-600',   progress: pct(disputed), urgent: disputed > 0 },
    ];
  });

  // ── Pipeline columns (only statuses that actually exist) ──────────────
  pipelineCols = computed(() => {
    const jobs = this.state.allBookings();
    return Object.entries(STATUS_META)
      .map(([status, meta]) => ({
        status,
        meta,
        count: jobs.filter(j => normalizeStatus(j.status) === status).length
      }))
      .filter(c => c.count > 0)
      .sort((a, b) => a.meta.priority - b.meta.priority);
  });

  // ── Status Journey: has this job reached a given step? ─────────────────
  isStepReached(job: Booking, stepKey: string): boolean {
    const current = normalizeStatus(job.status);
    // Off-path statuses: only highlight steps up to ACCEPTED
    if (['DISPUTED', 'REVISION_REQUESTED', 'CANCELLED', 'REJECTED'].includes(current)) {
      return stepKey === 'PENDING' || stepKey === 'ACCEPTED';
    }
    const ci = this.journeyOrder.indexOf(current);
    const si = this.journeyOrder.indexOf(stepKey);
    return ci !== -1 && si !== -1 && si <= ci;
  }

  // ── Helper: get StatusMeta for a Booking ─────────────────────────────
  getMeta(job: Booking): StatusMeta {
    return STATUS_META[normalizeStatus(job.status)] ?? STATUS_META['PENDING'];
  }

  // ── Helper: normalized status key for a Booking ───────────────────────
  getKey(job: Booking): string {
    return normalizeStatus(job.status);
  }

  isTerminal(job: Booking): boolean {
    return TERMINAL_STATUSES.has(normalizeStatus(job.status));
  }

  isUpdating(id: string): boolean {
    return this.updatingIds().has(id);
  }

  // ── Filter / sort event handlers ──────────────────────────────────────
  onSearch(e: Event) {
    this.searchQuery.set((e.target as HTMLInputElement).value);
    this.currentPage.set(1);
  }

  onSort(e: Event) {
    this.sortKey.set((e.target as HTMLSelectElement).value);
    this.currentPage.set(1);
  }

  toggleStatusFilter(status: string) {
    this.activeStatusFilter.update(cur => cur === status ? null : status);
    this.currentPage.set(1);
  }

  clearFilter() {
    this.activeStatusFilter.set(null);
    this.currentPage.set(1);
  }

  clearAll() {
    this.activeStatusFilter.set(null);
    this.searchQuery.set('');
    this.currentPage.set(1);
  }

  toggleExpand(id: string) {
    this.expandedJobId.update(cur => cur === id ? null : id);
  }

  goToPage(p: number) {
    if (p >= 1 && p <= this.totalPages()) this.currentPage.set(p);
  }

  // ── Admin actions ─────────────────────────────────────────────────────
  resolveDispute(jobId: string, resolution: 'COMPLETED' | 'CANCELLED') {
    this.markUpdating(jobId, true);
    this.http.put(`${this.apiUrl}/jobs/${jobId}/status?status=${resolution}`, {}).subscribe({
      next: () => {
        this.notify.success(`Dispute resolved: job marked as ${resolution.toLowerCase()}.`);
        this.state.fetchAllJobs();
        this.markUpdating(jobId, false);
      },
      error: (err) => {
        this.notify.error(err?.error || 'Failed to resolve dispute.');
        this.markUpdating(jobId, false);
      }
    });
  }

  forceCancel(jobId: string) {
    this.markUpdating(jobId, true);
    this.http.put(`${this.apiUrl}/jobs/${jobId}/status?status=CANCELLED`, {}).subscribe({
      next: () => {
        this.notify.success('Job cancelled by admin.');
        this.state.fetchAllJobs();
        this.markUpdating(jobId, false);
      },
      error: (err) => {
        this.notify.error(err?.error || 'Failed to cancel job.');
        this.markUpdating(jobId, false);
      }
    });
  }

  private markUpdating(id: string, val: boolean) {
    this.updatingIds.update(s => {
      const next = new Set(s);
      val ? next.add(id) : next.delete(id);
      return next;
    });
  }
}
