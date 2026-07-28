import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import {
  AreaChartComponent,
  BarChartComponent,
  DonutChartComponent,
  LineChartComponent,
  PieChartComponent
} from '../../../shared/components/charts';
import {
  AnalyticsService,
  EnterpriseAnalytics,
  MultiSeries,
  NameValue
} from '../../../shared/services/analytics.service';

/** One KPI tile's resolved display state. */
interface KpiTile {
  label: string;
  value: string;
  icon: string;
  tint: string;
  iconTint: string;
  /** Signed percentage shown as a delta chip, when the metric has one. */
  delta?: number;
  /** Sub-caption clarifying how a derived metric is defined. */
  hint?: string;
}

const RANGE_OPTIONS = [
  { label: '3M', months: 3 },
  { label: '6M', months: 6 },
  { label: '12M', months: 12 },
  { label: '24M', months: 24 }
];

@Component({
  selector: 'app-enterprise-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    LineChartComponent,
    BarChartComponent,
    PieChartComponent,
    AreaChartComponent,
    DonutChartComponent
  ],
  template: `
    <div class="max-w-[1600px] mx-auto space-y-4 md:space-y-6">

      <!-- Header + range filter. Filters sit in one row above the charts. -->
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 class="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Analytics</h1>
          <p class="text-slate-500 text-xs font-medium mt-1">
            Platform performance across revenue, jobs, users and escrow.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <div role="group" aria-label="Time range"
               class="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            @for (option of rangeOptions; track option.months) {
              <button type="button"
                      (click)="setRange(option.months)"
                      [attr.aria-pressed]="months() === option.months"
                      class="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                      [ngClass]="months() === option.months
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'">
                {{ option.label }}
              </button>
            }
          </div>

          <button type="button" (click)="reload()" [disabled]="loading()"
                  aria-label="Refresh analytics"
                  class="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200
                         text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-all
                         disabled:opacity-40">
            <mat-icon class="!text-base !w-auto !h-auto" [class.spin]="loading()">refresh</mat-icon>
          </button>
        </div>
      </div>

      @if (error()) {
        <div class="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-3">
          <mat-icon class="!text-base !w-auto !h-auto text-rose-500 shrink-0 mt-0.5">error</mat-icon>
          <div class="flex-1">
            <p class="text-xs font-black text-rose-700">Couldn't load analytics</p>
            <p class="text-[11px] font-medium text-rose-600 mt-0.5">{{ error() }}</p>
          </div>
          <button type="button" (click)="reload()"
                  class="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest">
            Retry
          </button>
        </div>
      }

      <!-- ── KPI row ──────────────────────────────────────────────────────── -->
      <!-- Fixed 7-col grid at xl so tiles never reflow between load and loaded. -->
      <section aria-label="Key metrics"
               class="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        @if (loading()) {
          @for (i of skeletonTiles; track i) {
            <div class="bg-white rounded-2xl border border-slate-100 p-4 min-h-[104px] animate-pulse">
              <div class="w-8 h-8 rounded-lg bg-slate-100 mb-3"></div>
              <div class="h-4 bg-slate-100 rounded w-3/4 mb-2"></div>
              <div class="h-2 bg-slate-50 rounded w-1/2"></div>
            </div>
          }
        } @else {
          @for (tile of kpiTiles(); track tile.label) {
            <!--
              min-h, not h. A hard 104px left only 32px below the icon row for a
              20px value and its label, so any label that wrapped to two lines
              ("PLATFORM REVENUE", "PENDING PAYMENTS", "CONVERSION RATE") spilled
              out of the box and printed on top of the figure above it. The tile
              now grows, and grid row stretching keeps every tile in a row equal.
            -->
            <div class="bg-white rounded-2xl border border-slate-100 p-4 min-h-[104px] flex flex-col
                        hover:shadow-md transition-shadow">
              <div class="flex items-start justify-between gap-1.5 mb-2">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" [ngClass]="tile.tint">
                  <mat-icon class="!text-sm !w-auto !h-auto" [ngClass]="tile.iconTint">{{ tile.icon }}</mat-icon>
                </div>
                @if (tile.delta !== undefined) {
                  <!-- Icon + sign carry direction, so the colour isn't the only cue. -->
                  <span class="flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0"
                        [ngClass]="tile.delta >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'">
                    <mat-icon class="!text-[10px] !w-auto !h-auto">
                      {{ tile.delta >= 0 ? 'arrow_upward' : 'arrow_downward' }}
                    </mat-icon>
                    {{ absPercent(tile.delta) }}
                  </span>
                }
              </div>
              <p class="text-base font-black text-slate-900 leading-tight truncate" [title]="tile.value">
                {{ tile.value }}
              </p>
              <!-- tracking-wide rather than tracking-widest: at 9px in a ~110px
                   content box the wider spacing was what pushed most of these
                   labels onto a second line in the first place. -->
              <p class="text-[9px] font-black text-slate-400 uppercase tracking-wide mt-auto pt-1 leading-tight">
                {{ tile.label }}
              </p>
            </div>
          }
        }
      </section>

      <!-- ── Line charts ──────────────────────────────────────────────────── -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ng-container
          [ngTemplateOutlet]="chartCard"
          [ngTemplateOutletContext]="{ title: 'Revenue Trends', subtitle: 'Gross revenue, platform fees and worker payouts', kind: 'line', data: data()?.revenueTrend, yLabel: 'KES' }">
        </ng-container>

        <ng-container
          [ngTemplateOutlet]="chartCard"
          [ngTemplateOutletContext]="{ title: 'Bookings', subtitle: 'Jobs posted vs. jobs funded', kind: 'line', data: data()?.bookingsTrend, yLabel: 'Jobs' }">
        </ng-container>

        <ng-container
          [ngTemplateOutlet]="chartCard"
          [ngTemplateOutletContext]="{ title: 'Worker Earnings', subtitle: 'Net payouts released to workers', kind: 'line', data: data()?.earningsTrend, yLabel: 'KES' }">
        </ng-container>

        <ng-container
          [ngTemplateOutlet]="chartCard"
          [ngTemplateOutletContext]="{ title: 'Monthly Transactions', subtitle: 'Volume by settlement outcome', kind: 'line', data: data()?.transactionsTrend, yLabel: 'Transactions' }">
        </ng-container>
      </div>

      <!-- Platform growth spans full width: cumulative totals need the horizontal room. -->
      <ng-container
        [ngTemplateOutlet]="chartCard"
        [ngTemplateOutletContext]="{ title: 'Platform Growth', subtitle: 'Cumulative registered users', kind: 'line', data: data()?.platformGrowth, yLabel: 'Users' }">
      </ng-container>

      <!-- ── Area chart ───────────────────────────────────────────────────── -->
      <ng-container
        [ngTemplateOutlet]="chartCard"
        [ngTemplateOutletContext]="{ title: 'Platform Activity', subtitle: 'Jobs created, payments processed and jobs completed', kind: 'area', data: data()?.platformActivity, yLabel: 'Count' }">
      </ng-container>

      <!-- ── Bar charts ───────────────────────────────────────────────────── -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ng-container
          [ngTemplateOutlet]="chartCard"
          [ngTemplateOutletContext]="{ title: 'Jobs by Category', subtitle: 'From the assigned worker\\'s category', kind: 'bar', data: data()?.jobsByCategory, yLabel: 'Jobs' }">
        </ng-container>

        <ng-container
          [ngTemplateOutlet]="chartCard"
          [ngTemplateOutletContext]="{ title: 'Worker Performance', subtitle: 'Top workers by jobs completed', kind: 'bar', data: data()?.workerPerformance, yLabel: 'Completed' }">
        </ng-container>

        <ng-container
          [ngTemplateOutlet]="chartCard"
          [ngTemplateOutletContext]="{ title: 'Completed Jobs', subtitle: 'Monthly completions', kind: 'bar', data: data()?.completedJobs, yLabel: 'Jobs' }">
        </ng-container>

        <ng-container
          [ngTemplateOutlet]="chartCard"
          [ngTemplateOutletContext]="{ title: 'Pending Jobs', subtitle: 'Awaiting acceptance or funding', kind: 'bar', data: data()?.pendingJobs, yLabel: 'Jobs' }">
        </ng-container>
      </div>

      <ng-container
        [ngTemplateOutlet]="chartCard"
        [ngTemplateOutletContext]="{ title: 'Client Growth', subtitle: 'New client registrations per month', kind: 'bar', data: data()?.clientGrowth, yLabel: 'Clients' }">
      </ng-container>

      <!-- ── Pie charts ───────────────────────────────────────────────────── -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <ng-container
          [ngTemplateOutlet]="chartCard"
          [ngTemplateOutletContext]="{ title: 'Booking Statuses', subtitle: 'Current job state mix', kind: 'pie', data: data()?.bookingStatuses }">
        </ng-container>

        <ng-container
          [ngTemplateOutlet]="chartCard"
          [ngTemplateOutletContext]="{ title: 'Payment Methods', subtitle: 'M-Pesa vs. wallet funding', kind: 'pie', data: data()?.paymentMethods }">
        </ng-container>

        <ng-container
          [ngTemplateOutlet]="chartCard"
          [ngTemplateOutletContext]="{ title: 'Escrow Distribution', subtitle: 'Where escrowed value sits', kind: 'pie', data: data()?.escrowDistribution }">
        </ng-container>

        <ng-container
          [ngTemplateOutlet]="chartCard"
          [ngTemplateOutletContext]="{ title: 'Worker Categories', subtitle: 'Supply mix by trade', kind: 'pie', data: data()?.workerCategories }">
        </ng-container>
      </div>

      <!-- ── Donut charts ─────────────────────────────────────────────────── -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ng-container
          [ngTemplateOutlet]="chartCard"
          [ngTemplateOutletContext]="{ title: 'Wallet Distribution', subtitle: 'Client settlement wallet funds', kind: 'donut', data: data()?.walletDistribution, currency: true, centerLabel: 'Total' }">
        </ng-container>

        <ng-container
          [ngTemplateOutlet]="chartCard"
          [ngTemplateOutletContext]="{ title: 'Platform Fees', subtitle: 'Revenue wallet position', kind: 'donut', data: data()?.platformFeeDistribution, currency: true, centerLabel: 'Fees' }">
        </ng-container>

        <ng-container
          [ngTemplateOutlet]="chartCard"
          [ngTemplateOutletContext]="{ title: 'User Registrations', subtitle: 'Accounts by role', kind: 'donut', data: data()?.userRegistrations, centerLabel: 'Users' }">
        </ng-container>
      </div>
    </div>

    <!--
      One card shell for all 18 charts: keeps the loading skeleton, the empty
      state and the header identical everywhere, and means a chart can't render
      at a different height before and after load.
    -->
    <ng-template #chartCard let-title="title" let-subtitle="subtitle" let-kind="kind"
                 let-data="data" let-yLabel="yLabel" let-currency="currency" let-centerLabel="centerLabel">
      <section class="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col">
        <header class="mb-3">
          <h2 class="text-sm font-black text-slate-900 tracking-tight">{{ title }}</h2>
          @if (subtitle) {
            <p class="text-[10px] font-medium text-slate-400 mt-0.5">{{ subtitle }}</p>
          }
        </header>

        @if (loading()) {
          <div class="plot-box skeleton-plot" [class.plot-box-compact]="isCompact(kind)">
            @for (bar of skeletonBars; track bar) {
              <div class="skeleton-bar" [style.height.%]="bar"></div>
            }
          </div>
        } @else if (isEmpty(data)) {
          <div class="plot-box empty-plot" [class.plot-box-compact]="isCompact(kind)">
            <mat-icon class="!text-2xl !w-auto !h-auto text-slate-200">bar_chart</mat-icon>
            <p class="text-[11px] font-bold text-slate-400">No data in this period</p>
          </div>
        } @else {
          @switch (kind) {
            @case ('line') {
              <app-line-chart [data]="data" [yAxisLabel]="yLabel" [showYAxisLabel]="!!yLabel"
                              [showXAxisLabel]="false" [legend]="data.length > 1"></app-line-chart>
            }
            @case ('area') {
              <app-area-chart [data]="data" [yAxisLabel]="yLabel" [showYAxisLabel]="!!yLabel"
                              [showXAxisLabel]="false" [legend]="data.length > 1"></app-area-chart>
            }
            @case ('bar') {
              <!-- Single measure per bar chart, so no legend box — the title names it. -->
              <app-bar-chart [data]="data" [yAxisLabel]="yLabel" [showYAxisLabel]="!!yLabel"
                             [showXAxisLabel]="false" [legend]="false"></app-bar-chart>
            }
            @case ('pie') {
              <app-pie-chart [data]="data" [labels]="true" [legend]="false"></app-pie-chart>
            }
            @case ('donut') {
              <app-donut-chart [data]="data" [currency]="!!currency"
                               [centerLabel]="centerLabel"></app-donut-chart>
            }
          }
        }
      </section>
    </ng-template>
  `,
  styles: [`
    .spin { animation: spin 0.9s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /*
     * Placeholder and empty boxes are pinned to the same heights the real chart
     * components render at (300px for line/bar/area, 260px for pie/donut), so
     * swapping skeleton → chart causes no layout shift.
     */
    .plot-box {
      height: 300px;
      border-radius: 0.75rem;
    }
    .plot-box-compact { height: 260px; }

    .skeleton-plot {
      display: flex;
      align-items: flex-end;
      gap: 0.5rem;
      padding: 1rem;
      background: #f8fafc;
      animation: pulse 1.6s ease-in-out infinite;
    }
    .skeleton-bar {
      flex: 1;
      background: #eef2f6;
      border-radius: 0.25rem 0.25rem 0 0;
    }
    .empty-plot {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      text-align: center;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.55; }
    }

    @media (prefers-reduced-motion: reduce) {
      .spin, .skeleton-plot { animation: none; }
    }
  `]
})
export class EnterpriseDashboardComponent implements OnInit {
  private analytics = inject(AnalyticsService);

  readonly rangeOptions = RANGE_OPTIONS;
  /** Fixed-length placeholder lists — indexes only, never rendered as values. */
  readonly skeletonTiles = Array.from({ length: 14 }, (_, i) => i);
  readonly skeletonBars = [45, 70, 35, 85, 55, 95, 40, 65];

  data = signal<EnterpriseAnalytics | null>(null);
  loading = signal(true);
  error = signal('');
  months = signal(6);

  ngOnInit(): void {
    this.load();
  }

  setRange(months: number): void {
    if (this.months() === months) return;
    this.months.set(months);
    this.load();
  }

  reload(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.error.set('');

    this.analytics.getEnterpriseAnalytics(this.months()).subscribe({
      next: (result) => {
        this.data.set(result);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        const body = err?.error;
        this.error.set(
          typeof body === 'string'
            ? body
            : body?.message || body?.error || 'The analytics service is unavailable.'
        );
      }
    });
  }

  /** Pie and donut plots are shorter than the cartesian charts. */
  isCompact(kind: string): boolean {
    return kind === 'pie' || kind === 'donut';
  }

  /** True when a series has no points at all — drives the per-card empty state. */
  isEmpty(data: NameValue[] | MultiSeries[] | null | undefined): boolean {
    if (!Array.isArray(data) || data.length === 0) return true;

    const first = data[0] as MultiSeries;
    if (Array.isArray(first?.series)) {
      // Multi-series: empty when every series is empty or entirely zero.
      return (data as MultiSeries[]).every(
        s => !s.series?.length || s.series.every(p => !p.value)
      );
    }
    return (data as NameValue[]).every(d => !d.value);
  }

  kpiTiles = computed<KpiTile[]>(() => {
    const k = this.data()?.kpis;
    if (!k) return [];

    return [
      {
        label: 'Total Revenue', value: this.money(k.totalRevenue),
        icon: 'payments', tint: 'bg-blue-50', iconTint: '!text-blue-600',
        delta: k.monthlyGrowth
      },
      {
        label: 'Platform Revenue', value: this.money(k.platformRevenue),
        icon: 'account_balance', tint: 'bg-indigo-50', iconTint: '!text-indigo-600'
      },
      {
        label: 'Escrow Balance', value: this.money(k.escrowBalance),
        icon: 'lock', tint: 'bg-amber-50', iconTint: '!text-amber-600'
      },
      {
        label: 'Pending Payments', value: this.money(k.pendingPayments),
        icon: 'hourglass_top', tint: 'bg-orange-50', iconTint: '!text-orange-600'
      },
      {
        label: 'Withdrawals', value: this.money(k.withdrawals),
        icon: 'north_east', tint: 'bg-purple-50', iconTint: '!text-purple-600'
      },
      {
        label: 'Wallet Balance', value: this.money(k.walletBalance),
        icon: 'account_balance_wallet', tint: 'bg-teal-50', iconTint: '!text-teal-600'
      },
      {
        label: 'Active Workers', value: this.count(k.activeWorkers),
        icon: 'engineering', tint: 'bg-cyan-50', iconTint: '!text-cyan-600'
      },
      {
        label: 'Active Clients', value: this.count(k.activeClients),
        icon: 'groups', tint: 'bg-sky-50', iconTint: '!text-sky-600'
      },
      {
        label: 'Jobs Completed', value: this.count(k.jobsCompleted),
        icon: 'task_alt', tint: 'bg-emerald-50', iconTint: '!text-emerald-600'
      },
      {
        label: 'Jobs Pending', value: this.count(k.jobsPending),
        icon: 'pending_actions', tint: 'bg-slate-100', iconTint: '!text-slate-600'
      },
      {
        label: 'Conversion Rate', value: this.percent(k.conversionRate),
        icon: 'trending_up', tint: 'bg-green-50', iconTint: '!text-green-600'
      },
      {
        label: 'Success Rate', value: this.percent(k.successRate),
        icon: 'verified', tint: 'bg-lime-50', iconTint: '!text-lime-700'
      },
      {
        label: 'Avg Response', value: this.duration(k.averageResponseTimeHours),
        icon: 'schedule', tint: 'bg-violet-50', iconTint: '!text-violet-600'
      },
      {
        label: 'Monthly Growth', value: this.signedPercent(k.monthlyGrowth),
        icon: 'show_chart', tint: 'bg-rose-50', iconTint: '!text-rose-600'
      }
    ];
  });

  // ── Formatters ──────────────────────────────────────────────────────────
  // Compact forms keep 14 tiles legible without wrapping or truncating.

  private money(value: number): string {
    const n = Number(value) || 0;
    if (Math.abs(n) >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(1)}M`;
    if (Math.abs(n) >= 1_000) return `KES ${(n / 1_000).toFixed(1)}K`;
    return `KES ${Math.round(n).toLocaleString()}`;
  }

  private count(value: number): string {
    return (Number(value) || 0).toLocaleString();
  }

  private percent(value: number): string {
    return `${(Number(value) || 0).toFixed(1)}%`;
  }

  private signedPercent(value: number): string {
    const n = Number(value) || 0;
    return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
  }

  /** Sub-hour averages read better in minutes than as "0.4h". */
  private duration(hours: number): string {
    const h = Number(hours) || 0;
    if (h <= 0) return '—';
    if (h < 1) return `${Math.round(h * 60)}m`;
    if (h < 48) return `${h.toFixed(1)}h`;
    return `${(h / 24).toFixed(1)}d`;
  }

  absPercent(value: number): string {
    return `${Math.abs(Number(value) || 0).toFixed(1)}%`;
  }
}
