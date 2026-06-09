import { Component, inject, signal, computed } from '@angular/core';
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
  ],
  template: `
    <div class="max-w-[1400px] mx-auto animate-in fade-in duration-1000 pb-24 lg:pb-0 font-manrope">
      
      <!-- Premium Hero Section -->
      <section class="mb-12 relative py-8 px-2 md:px-0">
        <div class="max-w-4xl">
          <div class="inline-flex items-center gap-2 px-3 py-1 bg-brand-teal-soft text-brand-teal rounded-full text-[9px] font-black uppercase tracking-[0.2em] mb-6 border border-brand-teal/10">
            <mat-icon class="!text-[14px]">verified_user</mat-icon>
            Verified Workers
          </div>
          <h1 class="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tighter leading-[1.1]">Find Professional <br> <span class="text-brand-teal">Workers</span></h1>
          <p class="text-lg text-slate-500 font-medium leading-relaxed max-w-2xl">Search for local experts, track your work, and pay safely through M-Pesa with secure settlement.</p>
        </div>
      </section>

      <!-- Advanced Filter Bar -->
      <div class="mb-12 bg-white border border-outline-variant/30 p-6 rounded-3xl shadow-sm">
        <div class="space-y-4 sm:space-y-0 grid grid-cols-1 lg:grid-cols-4 gap-4">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Name or email</mat-label>
            <mat-icon matPrefix class="text-slate-300">search</mat-icon>
            <input matInput type="text" placeholder="Name or email..."
                   [ngModel]="nameQuery()" (ngModelChange)="onNameChange($event)">
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>All Categories</mat-label>
            <mat-icon matPrefix class="text-slate-300">work_outline</mat-icon>
            <mat-select [value]="selectedSkill()" (selectionChange)="selectedSkill.set($event.value); onFilterChange()" panelClass="marketplace-select-panel">
              <mat-option [value]="null">All Categories</mat-option>
              @for (skill of state.availableSkills(); track skill) {
                <mat-option [value]="skill">{{ skill }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>All Locations</mat-label>
            <mat-icon matPrefix class="text-slate-300">location_on</mat-icon>
            <mat-select [value]="locationQuery()" (selectionChange)="locationQuery.set($event.value); onFilterChange()" panelClass="marketplace-select-panel">
              <mat-option [value]="null">All Locations</mat-option>
              @for (loc of state.availableLocations(); track loc) {
                <mat-option [value]="loc">{{ loc }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Experience</mat-label>
            <mat-icon matPrefix class="text-slate-300">trending_up</mat-icon>
            <mat-select [value]="selectedExperience()" (selectionChange)="selectedExperience.set($event.value); onFilterChange()" panelClass="marketplace-select-panel">
              <mat-option [value]="null">Any Level</mat-option>
              <mat-option value="Junior">Junior</mat-option>
              <mat-option value="Mid">Mid</mat-option>
              <mat-option value="Senior">Senior</mat-option>
              <mat-option value="Lead">Lead</mat-option>
              <mat-option value="Master">Master</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
        <p class="mt-4 text-[11px] text-slate-500 font-medium uppercase tracking-[0.2em]">Filters apply automatically.</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <!-- Sidebar Stats -->
        <aside class="hidden lg:block lg:col-span-3 space-y-6">
          <div class="bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-sm">
            <h3 class="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
              <span class="w-1.5 h-1.5 bg-brand-teal rounded-full"></span>
              Market Stats
            </h3>
            <div class="space-y-6">
              <div>
                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Experts</p>
                <p class="text-3xl font-black text-slate-900 tracking-tighter">{{ state.verifiedWorkers().length }}</p>
              </div>
              <div>
                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg. Price</p>
                <p class="text-3xl font-black text-slate-900 tracking-tighter">KSh {{ averageRate() }}</p>
              </div>
            </div>
          </div>

          <div class="p-6 rounded-2xl bg-slate-900 text-white shadow-2xl relative overflow-hidden group">
             <mat-icon class="!text-3xl mb-4 text-brand-teal opacity-80 group-hover:scale-110 transition-transform duration-500">verified_user</mat-icon>
             <h4 class="text-base font-black leading-tight mb-3 relative z-10">Safe Payments</h4>
             <p class="text-[10px] text-slate-400 leading-relaxed font-medium relative z-10">Money is held safely until you approve the work.</p>
             <div class="absolute -bottom-6 -right-6 opacity-5">
               <mat-icon class="!text-[8rem] !w-auto !h-auto">security</mat-icon>
             </div>
          </div>
        </aside>

        <!-- Experts Grid -->
        <section class="col-span-12 lg:col-span-9">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8 px-2">
            <div class="flex items-center gap-3">
              <h2 class="text-xl font-black text-slate-900 tracking-tight">Workers for Hire</h2>
              <span class="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black rounded-full uppercase tracking-widest">{{ filteredWorkers().length }} Found</span>
            </div>
            <div class="flex items-center gap-4 bg-white px-5 py-2.5 rounded-2xl border border-outline-variant/30">
              <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">Sort:</span>
              <select class="bg-transparent border-none font-black text-slate-900 text-[10px] focus:ring-0 cursor-pointer uppercase tracking-widest p-0 pr-6 appearance-none"
                      [ngModel]="selectedSort()" (ngModelChange)="selectedSort.set($event)">
                <option value="Highest Rated">Rating</option>
                <option value="Newest">Newest</option>
                <option value="Rate: Low to High">Price</option>
              </select>
            </div>
          </div>

          <div class="flex flex-col gap-3">
            @for (worker of paginatedWorkers(); track worker.id) {
              <div class="bg-white border border-slate-100 rounded-xl p-3 shadow-sm hover-border-brand-teal transition-all group flex items-center gap-5">
                <!-- Ultra Compact Avatar -->
                <div class="relative shrink-0">
                  <div class="w-12 h-12 rounded-lg overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center text-brand-teal font-black text-sm uppercase transition-transform group-hover:scale-105">
                    @if (worker.image) { 
                      <img [src]="worker.image" class="w-full h-full object-cover"> 
                    } @else { {{ worker.initials }} }
                  </div>
                  <span class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-brand-teal border-2 border-white rounded-full"></span>
                </div>

                <!-- Worker Info (Ultra Compact) -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-0.5">
                    <h3 class="text-[13px] font-black text-slate-900 group-hover:text-brand-teal transition-colors truncate tracking-tight">{{ worker.name }}</h3>
                    <div class="flex items-center gap-1 bg-amber-50 px-1 py-0.5 rounded border border-amber-100 shrink-0">
                      <mat-icon class="!text-amber-500 !text-[8px] !w-auto !h-auto" style="font-variation-settings: 'FILL' 1;">star</mat-icon>
                      <span class="text-[8px] font-black text-amber-700">{{ worker.reviews > 0 ? worker.rating.toFixed(1) : 'NEW' }}</span>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <p class="text-[8px] font-black text-brand-teal uppercase tracking-[0.1em]">{{ worker.category || 'Expert' }}</p>
                    <span class="w-1 h-1 rounded-full bg-slate-200"></span>
                    <p class="text-[10px] text-slate-500 font-medium truncate max-w-[400px]">{{ worker.bio || 'Professional expert dedicated to quality delivery.' }}</p>
                  </div>
                </div>

                <!-- Price & Action (Ultra Compact) -->
                <div class="flex items-center gap-6 shrink-0 border-l border-slate-50 pl-6">
                  <div class="text-right">
                    <span class="text-sm font-black text-slate-900 tracking-tighter">KSh {{ worker.rate }}</span>
                  </div>
                  <button [routerLink]="['/client/profile', worker.id]" 
                          class="bg-slate-900 text-white px-4 py-2 rounded-lg font-black text-[8px] uppercase tracking-widest hover-bg-brand-teal active:scale-95 transition-all shadow-sm">
                    View
                  </button>
                </div>
              </div>
            }
          </div>

          <!-- Modern Pagination -->
          @if (totalPages() > 1) {
            <div class="mt-16 flex items-center justify-center gap-3">
              <button (click)="goToPage(currentPage() - 1)" 
                      [disabled]="currentPage() === 1"
                      class="w-12 h-12 flex items-center justify-center rounded-2xl border border-outline-variant/30 bg-white text-slate-400 hover-text-brand-teal hover-border-brand-teal disabled:opacity-20 transition-all">
                <mat-icon>west</mat-icon>
              </button>
              
              <div class="flex items-center gap-2 bg-white p-2 rounded-2xl border border-outline-variant/30">
                @for (page of [].constructor(totalPages()); track $index) {
                  <button (click)="goToPage($index + 1)"
                          [class]="($index + 1 === currentPage()) ? 'bg-brand-teal text-white shadow-lg shadow-brand-teal/20' : 'text-slate-400 hover:bg-surface'"
                          class="w-10 h-10 rounded-xl font-black text-xs transition-all">
                    {{ $index + 1 }}
                  </button>
                }
              </div>

              <button (click)="goToPage(currentPage() + 1)" 
                      [disabled]="currentPage() === totalPages()"
                      class="w-12 h-12 flex items-center justify-center rounded-2xl border border-outline-variant/30 bg-white text-slate-400 hover-text-brand-teal hover-border-brand-teal disabled:opacity-20 transition-all">
                <mat-icon>east</mat-icon>
              </button>
            </div>
          }
        </section>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; background-color: var(--color-surface); }
    :ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }
    :ng-deep .marketplace-select-panel {
      min-width: 14rem !important;
      max-width: 22rem !important;
      white-space: normal !important;
    }
    :ng-deep .marketplace-select-panel .mat-option-text {
      white-space: normal !important;
      overflow-wrap: anywhere !important;
    }
    @media (max-width: 1024px) {
      .text-7xl { font-size: 3.5rem !important; }
      .p-8 { padding: 1.5rem !important; }
    }
  `]
})
export class ClientDashboardPage {
  state = inject(PlatformStateService);
  private notification = inject(NotificationService);
  
  nameQuery = signal('');
  selectedSkill = signal<string | null>(null);
  locationQuery = signal<string | null>(null);
  selectedExperience = signal<string | null>(null);
  selectedSort = signal<string>('Highest Rated');
  
  currentPage = signal(1);
  itemsPerPage = signal(6);

  totalPages = computed(() => Math.ceil(this.filteredWorkers().length / this.itemsPerPage()));

  paginatedWorkers = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    return this.filteredWorkers().slice(start, start + this.itemsPerPage());
  });

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  averageRate = computed(() => {
    const workers = this.state.verifiedWorkers();
    if (!workers.length) return 0;
    const total = workers.reduce((sum, w) => sum + (w.rate || 0), 0);
    return Math.round(total / workers.length);
  });

  filteredWorkers = computed(() => {
    let list = this.state.verifiedWorkers();
    
    // Name/Email Filter
    if (this.nameQuery()) {
      const q = this.nameQuery().toLowerCase();
      list = list.filter(w => 
        (w.name && w.name.toLowerCase().includes(q)) || 
        (w.email && w.email.toLowerCase().includes(q))
      );
    }

    // Skill Filter
    if (this.selectedSkill() && this.selectedSkill() !== 'null') {
      const q = this.selectedSkill()!.toLowerCase();
      list = list.filter(w => (w.category && w.category.toLowerCase().includes(q)) || 
                              (w.skills && w.skills.some(s => s.toLowerCase().includes(q))));
    }

    // Location Search
    if (this.locationQuery() && this.locationQuery() !== 'null') {
      const loc = this.locationQuery()!.toLowerCase();
      list = list.filter(w => 
        (w.location && w.location.toLowerCase().includes(loc)) || 
        (w.preferredLocations && w.preferredLocations.some(pl => pl.toLowerCase().includes(loc)))
      );
    }

    // Experience Filter
    if (this.selectedExperience() && this.selectedExperience() !== 'null') {
       const exp = this.selectedExperience()!.toLowerCase();
       list = list.filter(w => 
         (w.category && w.category.toLowerCase().includes(exp)) || 
         (w.bio && w.bio.toLowerCase().includes(exp)) ||
         (w.workHistory && w.workHistory.some(wh => 
           (wh.role && wh.role.toLowerCase().includes(exp)) || 
           (wh.description && wh.description.toLowerCase().includes(exp))
         ))
       );
    }

    // Sorting
    const sort = this.selectedSort();
    return [...list].sort((a, b) => {
      if (sort === 'Highest Rated') return (b.rating || 0) - (a.rating || 0);
      if (sort === 'Newest') return b.id.localeCompare(a.id);
      if (sort === 'Rate: Low to High') return a.rate - b.rate;
      return 0;
    });
  });

  performSearch() {
    this.state.fetchMarketplaceWorkers(
      this.selectedSkill() || undefined,
      this.locationQuery() || undefined,
      this.selectedExperience() === 'Junior' ? 1 : (this.selectedExperience() === 'Mid' ? 3 : (this.selectedExperience() === 'Senior' ? 5 : (this.selectedExperience() === 'Lead' ? 8 : (this.selectedExperience() === 'Master' ? 12 : undefined))))
    );
  }

  onFilterChange() {
    this.performSearch();
  }

  onNameChange(value: string) {
    this.nameQuery.set(value);
  }

  loadMore() {
    this.performSearch();
  }
}
