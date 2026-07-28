import { Component, inject, signal, computed, afterNextRender, PLATFORM_ID, OnInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../core/services/notification.service';
import { RouterLink } from '@angular/router';
import { PlatformStateService } from '../../core/services/platform-state.service';
import { AuthService } from '../../core/services/auth.service';
import { AnalyticsService, ClientSpendingData } from '../../shared/services/analytics.service';
import { LineChartComponent, BarChartComponent } from '../../shared/components/charts';

const FILTER_KEY = 'kazi_marketplace_filters';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormsModule,
    RouterLink,
    LineChartComponent,
    BarChartComponent
  ],
  template: `
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 animate-in fade-in duration-700 pb-24 lg:pb-12 font-manrope">

      <!-- Hero -->
      <section class="pt-8 pb-6">
        <p class="text-[9px] font-black uppercase tracking-[0.25em] text-brand-teal mb-3">Verified Professionals</p>
        <h1 class="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-2">
          Find the right person<br class="hidden sm:block"> for the job.
        </h1>
        <p class="text-slate-400 text-sm font-medium">Browse local experts, book instantly, pay safely via M-Pesa.</p>
      </section>

      <!-- Trust strip -->
      <div class="flex items-center gap-6 py-3 mb-6 border-y border-slate-100 overflow-x-auto scrollbar-none">
        <div class="flex items-center gap-2 shrink-0">
          <mat-icon class="!text-sm text-brand-teal">verified_user</mat-icon>
          <span class="text-[10px] font-black text-slate-500 uppercase tracking-wider">Escrow Protection</span>
        </div>
        <div class="w-px h-4 bg-slate-200 shrink-0"></div>
        <div class="flex items-center gap-2 shrink-0">
          <mat-icon class="!text-sm text-brand-teal">payments</mat-icon>
          <span class="text-[10px] font-black text-slate-500 uppercase tracking-wider">M-Pesa Payments</span>
        </div>
        <div class="w-px h-4 bg-slate-200 shrink-0"></div>
        <div class="flex items-center gap-2 shrink-0">
          <mat-icon class="!text-sm text-brand-teal">star</mat-icon>
          <span class="text-[10px] font-black text-slate-500 uppercase tracking-wider">{{ state.verifiedWorkers().length }} Experts</span>
        </div>
        <div class="w-px h-4 bg-slate-200 shrink-0"></div>
        <div class="flex items-center gap-2 shrink-0">
          <mat-icon class="!text-sm text-brand-teal">trending_up</mat-icon>
          <span class="text-[10px] font-black text-slate-500 uppercase tracking-wider">Avg KSh {{ averageRate() }}/hr</span>
        </div>
      </div>

      <!-- Spending Analytics -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <mat-card class="!rounded-2xl !border !border-slate-100 !p-5 bg-white shadow-sm">
          <div class="flex items-center gap-2 mb-4">
            <mat-icon class="!text-sm text-brand-teal">account_balance_wallet</mat-icon>
            <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Spending Trends</span>
          </div>
          @if (loading()) {
            <div class="h-[200px] flex items-center justify-center">
              <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest">Loading...</p>
            </div>
          } @else if (spendingData().length > 0) {
            <app-line-chart [data]="spendingData()" [xAxisLabel]="'Period'" [yAxisLabel]="'Amount (KES)'" [legend]="false"></app-line-chart>
          } @else {
            <div class="h-[200px] flex items-center justify-center">
              <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest">No spending data</p>
            </div>
          }
        </mat-card>

        <mat-card class="!rounded-2xl !border !border-slate-100 !p-5 bg-white shadow-sm overflow-hidden">
          <div class="flex items-center gap-2 mb-4">
            <mat-icon class="!text-sm text-brand-teal">pie_chart</mat-icon>
            <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Spending by Category</span>
          </div>
          @if (loading()) {
            <div class="h-[200px] flex items-center justify-center">
              <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest">Loading...</p>
            </div>
          } @else if (spendingByCategory.length > 0) {
            <app-bar-chart [data]="spendingByCategory" [xAxisLabel]="'Category'" [yAxisLabel]="'Amount (KES)'" [legend]="false"></app-bar-chart>
          } @else {
            <div class="h-[200px] flex items-center justify-center">
              <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest">No category data</p>
            </div>
          }
        </mat-card>
      </div>

      <!-- Filter bar -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

          <!-- Name search -->
          <label class="relative block">
            <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 !text-[16px] text-slate-300 pointer-events-none">search</mat-icon>
            <input type="text" placeholder="Search by name or email"
                   [ngModel]="nameQuery()" (ngModelChange)="onNameChange($event)"
                   class="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-brand-teal transition-all placeholder:text-slate-400 placeholder:font-medium">
          </label>

          <!-- Category -->
          <select [ngModel]="selectedCategory()"
                  (ngModelChange)="selectedCategory.set($event); onFilterChange()"
                  class="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-brand-teal transition-all appearance-none cursor-pointer">
            <option [ngValue]="null">All Categories</option>
            @for (cat of availableCategories(); track cat) {
              <option [ngValue]="cat">{{ cat }}</option>
            }
          </select>

          <!-- Location -->
          <select [ngModel]="locationQuery()"
                  (ngModelChange)="locationQuery.set($event); onFilterChange()"
                  class="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-brand-teal transition-all appearance-none cursor-pointer">
            <option [ngValue]="null">All Locations</option>
            @for (loc of state.availableLocations(); track loc) {
              <option [ngValue]="loc">{{ loc }}</option>
            }
          </select>

          <!-- Experience -->
          <select [ngModel]="selectedExperience()"
                  (ngModelChange)="selectedExperience.set($event); onFilterChange()"
                  class="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-brand-teal transition-all appearance-none cursor-pointer">
            <option [ngValue]="null">Any Experience</option>
            <option value="Junior">Junior</option>
            <option value="Mid">Mid</option>
            <option value="Senior">Senior</option>
            <option value="Lead">Lead</option>
            <option value="Master">Master</option>
          </select>

        </div>
      </div>

      <!-- Results header -->
      <div class="flex items-center justify-between mb-4 px-1">
        <div class="flex items-center gap-3">
          <span class="text-sm font-black text-slate-900">{{ filteredWorkers().length }} workers found</span>
          @if (hasActiveFilters()) {
            <button (click)="clearFilters()"
                    class="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-colors">
              Clear filters
            </button>
          }
        </div>
        <select class="h-8 rounded-lg border border-slate-200 bg-white px-3 text-[10px] font-black text-slate-600 outline-none focus:border-brand-teal transition-all appearance-none cursor-pointer"
                [ngModel]="selectedSort()" (ngModelChange)="selectedSort.set($event)">
          <option value="Highest Rated">Top Rated</option>
          <option value="Newest">Newest</option>
          <option value="Rate: Low to High">Price: Low → High</option>
        </select>
      </div>

      <!-- Workers list -->
      @if (paginatedWorkers().length > 0) {
        <div class="flex flex-col gap-2.5 mb-8">
          @for (worker of paginatedWorkers(); track worker.id) {
            <div class="bg-white border border-slate-100 rounded-xl px-4 py-3.5 hover:border-brand-teal/30 hover:shadow-sm transition-all group flex items-center gap-4">

              <!-- Avatar -->
              <div class="relative shrink-0">
                <div class="w-11 h-11 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center text-brand-teal font-black text-sm uppercase">
                  @if (worker.image) {
                    <img [src]="worker.image" class="w-full h-full object-cover">
                  } @else {
                    {{ worker.initials }}
                  }
                </div>
                <span class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-brand-teal border-2 border-white rounded-full"></span>
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-0.5 flex-wrap">
                  <h3 class="text-xs font-black text-slate-900 group-hover:text-brand-teal transition-colors truncate tracking-tight">
                    {{ worker.name }}
                  </h3>
                  <!-- Rating -->
                  <div class="flex items-center gap-1 shrink-0">
                    <mat-icon class="!text-amber-400 !text-[10px] !w-auto !h-auto" style="font-variation-settings: 'FILL' 1;">star</mat-icon>
                    <span class="text-[9px] font-black text-slate-500">
                      {{ worker.reviews > 0 ? worker.rating.toFixed(1) : 'New' }}
                      @if (worker.reviews > 0) {
                        <span class="font-medium text-slate-400">({{ worker.reviews }})</span>
                      }
                    </span>
                  </div>
                </div>

                <div class="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span class="text-[9px] font-black text-brand-teal uppercase tracking-wider">{{ worker.category || 'Expert' }}</span>
                  <span class="w-1 h-1 rounded-full bg-slate-200"></span>
                  <span class="text-[9px] font-semibold text-slate-400">{{ worker.completedJobs || 0 }} jobs done</span>
                  @if (worker.location) {
                    <span class="w-1 h-1 rounded-full bg-slate-200"></span>
                    <span class="text-[9px] font-semibold text-slate-400">{{ worker.location }}</span>
                  }
                </div>

                @if (worker.highlightedReview) {
                  <p class="text-[10px] text-slate-500 italic truncate max-w-lg">"{{ worker.highlightedReview }}"</p>
                } @else {
                  <p class="text-[10px] text-slate-400 truncate max-w-lg">{{ worker.bio || 'Professional dedicated to quality delivery.' }}</p>
                }
              </div>

              <!-- Price & CTA -->
              <div class="flex items-center gap-4 shrink-0">
                <div class="text-right hidden sm:block">
                  <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest">From</p>
                  <p class="text-sm font-black text-slate-900">KSh {{ worker.rate }}</p>
                </div>
                <button [routerLink]="['/client/profile', worker.id]"
                        class="px-4 py-2 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-brand-teal transition-all active:scale-95 shadow-sm">
                  View
                </button>
              </div>

            </div>
          }
        </div>
      } @else {
        <!-- Empty state -->
        <div class="bg-white rounded-2xl border border-slate-100 p-12 text-center max-w-sm mx-auto mt-8">
          <mat-icon class="!text-3xl text-slate-200 mb-3">search_off</mat-icon>
          <h3 class="text-sm font-black text-slate-900 mb-1">No workers found</h3>
          <p class="text-xs text-slate-400 mb-4">Try adjusting your filters to see more results.</p>
          <button (click)="clearFilters()"
                  class="px-4 py-2 bg-brand-teal text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-brand-teal/90 transition-all">
            Clear Filters
          </button>
        </div>
      }

      <!-- Pagination -->
      @if (totalPages() > 1) {
        <div class="flex items-center justify-center gap-2 pb-6">
          <button (click)="goToPage(currentPage() - 1)"
                  [disabled]="currentPage() === 1"
                  class="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-brand-teal hover:border-brand-teal disabled:opacity-30 transition-all">
            <mat-icon class="!text-base">chevron_left</mat-icon>
          </button>

          @for (page of pageNumbers(); track page) {
            <button (click)="goToPage(page)"
                    [ngClass]="page === currentPage()
                      ? 'bg-brand-teal text-white border-brand-teal'
                      : 'bg-white text-slate-400 border-slate-200 hover:text-brand-teal'"
                    class="w-9 h-9 flex items-center justify-center rounded-xl border text-[10px] font-black transition-all">
              {{ page }}
            </button>
          }

          <button (click)="goToPage(currentPage() + 1)"
                  [disabled]="currentPage() === totalPages()"
                  class="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-brand-teal hover:border-brand-teal disabled:opacity-30 transition-all">
            <mat-icon class="!text-base">chevron_right</mat-icon>
          </button>
        </div>
      }

    </div>
  `,
  styles: [`
    :host { display: block; background-color: var(--color-surface); }
    .scrollbar-none { scrollbar-width: none; }
    .scrollbar-none::-webkit-scrollbar { display: none; }
  `]
})
export class ClientDashboardPage implements OnInit {
  state = inject(PlatformStateService);
  private notification = inject(NotificationService);
  private platformId = inject(PLATFORM_ID);
  private analyticsService = inject(AnalyticsService);
  private auth = inject(AuthService);

  // Analytics data
  spendingData = signal<ClientSpendingData[]>([]);
  loading = signal(true);

  nameQuery = signal('');
  selectedCategory = signal<string | null>(null);
  locationQuery = signal<string | null>(null);
  selectedExperience = signal<string | null>(null);
  selectedSort = signal<string>('Highest Rated');

  currentPage = signal(1);
  itemsPerPage = signal(8);

  constructor() {
    afterNextRender(() => {
      if (isPlatformBrowser(this.platformId)) {
        try {
          const raw = sessionStorage.getItem(FILTER_KEY);
          if (raw) {
            const f = JSON.parse(raw);
            if (f.name) this.nameQuery.set(f.name);
            if (f.category) this.selectedCategory.set(f.category);
            if (f.location) this.locationQuery.set(f.location);
            if (f.experience) this.selectedExperience.set(f.experience);
            if (f.sort) this.selectedSort.set(f.sort);
          }
        } catch { /* ignore */ }
      }
    });
  }

  private persistFilters() {
    if (isPlatformBrowser(this.platformId)) {
      try {
        sessionStorage.setItem(FILTER_KEY, JSON.stringify({
          name: this.nameQuery(),
          category: this.selectedCategory(),
          location: this.locationQuery(),
          experience: this.selectedExperience(),
          sort: this.selectedSort(),
        }));
      } catch { /* ignore */ }
    }
  }

  hasActiveFilters = computed(() =>
    !!(this.nameQuery() || this.selectedCategory() || this.locationQuery() || this.selectedExperience())
  );

  clearFilters() {
    this.nameQuery.set('');
    this.selectedCategory.set(null);
    this.locationQuery.set(null);
    this.selectedExperience.set(null);
    this.currentPage.set(1);
    this.persistFilters();
  }

  availableCategories = computed(() =>
    this.state.verifiedWorkers()
      .map(w => w.category)
      .filter((c, i, arr) => c && arr.indexOf(c) === i)
      .sort() as string[]
  );

  averageRate = computed(() => {
    const workers = this.state.verifiedWorkers();
    if (!workers.length) return 0;
    return Math.round(workers.reduce((s, w) => s + (w.rate || 0), 0) / workers.length);
  });

  filteredWorkers = computed(() => {
    let list = this.state.verifiedWorkers();

    if (this.nameQuery()) {
      const q = this.nameQuery().toLowerCase();
      list = list.filter(w =>
        (w.name && w.name.toLowerCase().includes(q)) ||
        (w.email && w.email.toLowerCase().includes(q))
      );
    }

    if (this.selectedCategory() && this.selectedCategory() !== 'null') {
      const q = this.selectedCategory()!.toLowerCase();
      list = list.filter(w => w.category && w.category.toLowerCase().includes(q));
    }

    if (this.locationQuery() && this.locationQuery() !== 'null') {
      const loc = this.locationQuery()!.toLowerCase();
      list = list.filter(w =>
        (w.location && w.location.toLowerCase().includes(loc)) ||
        (w.preferredLocations && w.preferredLocations.some((pl: string) => pl.toLowerCase().includes(loc)))
      );
    }

    if (this.selectedExperience() && this.selectedExperience() !== 'null') {
      const exp = this.selectedExperience()!.toLowerCase();
      list = list.filter(w =>
        (w.category && w.category.toLowerCase().includes(exp)) ||
        (w.bio && w.bio.toLowerCase().includes(exp)) ||
        (w.workHistory && w.workHistory.some((wh: any) =>
          (wh.role && wh.role.toLowerCase().includes(exp)) ||
          (wh.description && wh.description.toLowerCase().includes(exp))
        ))
      );
    }

    const sort = this.selectedSort();
    return [...list].sort((a, b) => {
      if (sort === 'Highest Rated') return (b.rating || 0) - (a.rating || 0);
      if (sort === 'Newest') return b.id.localeCompare(a.id);
      if (sort === 'Rate: Low to High') return a.rate - b.rate;
      return 0;
    });
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredWorkers().length / this.itemsPerPage())));

  paginatedWorkers = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    return this.filteredWorkers().slice(start, start + this.itemsPerPage());
  });

  pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    return Array.from({ length: total }, (_, i) => i + 1)
      .slice(Math.max(0, current - 3), Math.max(0, current - 3) + 5);
  });

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      if (isPlatformBrowser(this.platformId)) window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  onFilterChange() {
    this.currentPage.set(1);
    this.persistFilters();
    this.state.fetchMarketplaceWorkers(
      this.selectedCategory() || undefined,
      this.locationQuery() || undefined,
      this.selectedExperience() === 'Junior' ? 1 :
        this.selectedExperience() === 'Mid' ? 3 :
          this.selectedExperience() === 'Senior' ? 5 :
            this.selectedExperience() === 'Lead' ? 8 :
              this.selectedExperience() === 'Master' ? 12 : undefined
    );
  }

  onNameChange(value: string) {
    this.nameQuery.set(value);
    this.currentPage.set(1);
    this.persistFilters();
  }

  ngOnInit() {
    this.loadClientSpendingData();
  }

  private loadClientSpendingData() {
    // Get client ID from auth service
    const user = this.auth.currentUser();
    const clientId = user?.id;
    if (!clientId) {
      this.loading.set(false);
      return;
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);

    this.analyticsService.getClientSpendingData(
      clientId,
      startDate.toISOString(),
      endDate.toISOString()
    ).subscribe({
      next: (data: ClientSpendingData[]) => {
        this.spendingData.set(this.transformSpendingData(data));
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading spending data:', error);
        this.loading.set(false);
      }
    });
  }

  private transformSpendingData(data: ClientSpendingData[]): any[] {
    return [
      {
        name: 'Spending',
        series: data.map(d => ({
          name: d.period,
          value: d.amount
        }))
      }
    ];
  }

  get spendingByCategory() {
    return this.spendingData().map(d => ({
      name: d.category || 'Other',
      value: d.amount
    }));
  }
}