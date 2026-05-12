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
    <div class="animate-in fade-in duration-700">
      <!-- Hero & Search Filters -->
      <section class="mb-10 space-y-6">
        <div class="max-w-2xl">
          <h1 class="text-3xl font-black text-slate-900 mb-2 tracking-tight">Marketplace</h1>
          <p class="text-sm text-slate-500 font-medium">Find and connect with verified professionals in your area.</p>
        </div>
        
        <!-- Filter Bar -->
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-5 gap-4">
          <div class="space-y-1.5">
            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Search People</label>
            <div class="flex items-center border border-slate-200 rounded-lg px-3 py-2 bg-slate-50/50 focus-within:border-indigo-600 transition-all">
              <mat-icon class="text-slate-400 !text-sm mr-2">search</mat-icon>
              <input type="text" class="w-full border-none focus:ring-0 bg-transparent text-xs font-bold placeholder:text-slate-400" 
                     placeholder="Name or email..."
                     [ngModel]="nameQuery()" (ngModelChange)="nameQuery.set($event)">
            </div>
          </div>
          <div class="space-y-1.5">
            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Skill</label>
            <div class="flex items-center border border-slate-200 rounded-lg px-3 py-2 bg-slate-50/50 focus-within:border-indigo-600 transition-all">
              <mat-icon class="text-slate-400 !text-sm mr-2">psychology</mat-icon>
              <select class="w-full border-none focus:ring-0 bg-transparent text-xs font-bold cursor-pointer" [ngModel]="selectedSkill()" (ngModelChange)="selectedSkill.set($event)">
                <option [value]="null">All Skills</option>
                @for (skill of state.availableSkills(); track skill) {
                  <option [value]="skill">{{ skill }}</option>
                }
              </select>
            </div>
          </div>
          <div class="space-y-1.5">
            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Location</label>
            <div class="flex items-center border border-slate-200 rounded-lg px-3 py-2 bg-slate-50/50 focus-within:border-indigo-600 transition-all">
              <mat-icon class="text-slate-400 !text-sm mr-2">location_on</mat-icon>
              <select class="w-full border-none focus:ring-0 bg-transparent text-xs font-bold cursor-pointer" [ngModel]="locationQuery()" (ngModelChange)="locationQuery.set($event)">
                <option [value]="null">All Locations</option>
                @for (loc of state.availableLocations(); track loc) {
                  <option [value]="loc">{{ loc }}</option>
                }
              </select>
            </div>
          </div>
          <div class="space-y-1.5">
            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Experience</label>
            <div class="flex items-center border border-slate-200 rounded-lg px-3 py-2 bg-slate-50/50 focus-within:border-indigo-600 transition-all">
              <mat-icon class="text-slate-400 !text-sm mr-2">work_history</mat-icon>
              <select class="w-full border-none focus:ring-0 bg-transparent text-xs font-bold cursor-pointer" [ngModel]="selectedExperience()" (ngModelChange)="selectedExperience.set($event)">
                <option [value]="null">Any</option>
                <option value="Senior">Senior (5+ yrs)</option>
                <option value="Lead">Lead (8+ yrs)</option>
                <option value="Master">Master (12+ yrs)</option>
              </select>
            </div>
          </div>
          <div class="flex items-end">
            <button (click)="performSearch()" class="w-full bg-[#0f172a] text-white py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-md">
              Search
            </button>
          </div>
        </div>
      </section>

      <!-- Main Content Layout -->
      <div class="grid grid-cols-12 gap-8">
        <!-- Sidebar Stats -->
        <aside class="hidden lg:block lg:col-span-3 space-y-6">
          <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 class="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Insights</h3>
            <ul class="space-y-4">
              <li class="flex items-center justify-between">
                <span class="text-xs font-medium text-slate-500">Active Experts</span>
                <span class="text-xs font-black text-slate-900">{{ state.verifiedWorkers().length }}</span>
              </li>
              <li class="flex items-center justify-between">
                <span class="text-xs font-medium text-slate-500">Avg. Rate</span>
                <span class="text-xs font-black text-slate-900">\${{ averageRate() }}/hr</span>
              </li>
              <li class="flex items-center justify-between">
                <span class="text-xs font-medium text-slate-500">Results</span>
                <span class="text-[9px] font-black text-teal-700 bg-teal-50 px-2 py-0.5 rounded tracking-tight uppercase">{{ filteredWorkers().length }}</span>
              </li>
            </ul>
          </div>

          <div class="p-6 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-lg">
             <mat-icon class="!text-3xl mb-4 opacity-50">verified_user</mat-icon>
             <h4 class="text-lg font-black leading-tight mb-2">Verified Professionals Only</h4>
             <p class="text-[11px] text-indigo-100 leading-relaxed font-medium">Every worker in our marketplace has passed a rigorous document verification process.</p>
          </div>
        </aside>

        <!-- Professional Grid -->
        <section class="col-span-12 lg:col-span-9">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-black text-slate-900 tracking-tight">Available Professionals</h2>
            <div class="flex items-center gap-2 text-slate-400">
              <span class="text-[9px] font-black uppercase tracking-widest">Sort:</span>
              <select class="bg-transparent border-none font-black text-slate-900 text-[10px] focus:ring-0 cursor-pointer uppercase tracking-widest p-0"
                      [ngModel]="selectedSort()" (ngModelChange)="selectedSort.set($event)">
                <option value="Highest Rated">Rated</option>
                <option value="Newest">New</option>
                <option value="Rate: Low to High">Price</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            @for (worker of filteredWorkers(); track worker.id) {
              <div class="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group flex flex-col h-full">
                <div class="flex items-start justify-between mb-4">
                  <div class="flex items-center gap-3">
                    <div class="relative shrink-0">
                      <div class="w-12 h-12 rounded-xl overflow-hidden border-2 border-slate-100 shadow-sm bg-slate-50 flex items-center justify-center text-indigo-600 font-black text-sm uppercase">
                        @if (worker.image) { <img [src]="worker.image" class="w-full h-full object-cover"> } @else { {{ worker.initials }} }
                      </div>
                      <span class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                    </div>
                    <div class="min-w-0">
                      <h3 class="text-sm font-black text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{{ worker.name }}</h3>
                      <p class="text-[10px] font-black text-blue-600 uppercase tracking-widest truncate">{{ worker.category }}</p>
                    </div>
                  </div>
                </div>

                <div class="flex flex-wrap gap-1.5 mb-4 flex-grow">
                  @for (skill of worker.skills.slice(0, 3); track skill) {
                    <span class="bg-slate-50 text-slate-500 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tight border border-slate-50">{{ skill }}</span>
                  }
                </div>

                <div class="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
                  <div>
                    <p class="text-lg font-black text-slate-900 tracking-tighter">\${{ worker.rate }}<span class="text-[10px] font-medium text-slate-400 ml-0.5">/hr</span></p>
                  </div>
                  <button [routerLink]="['/client/profile', worker.id]" 
                          class="bg-slate-900 text-white px-5 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-indigo-600 transition-all">
                    Profile
                  </button>
                </div>
              </div>
            }
          </div>

          @if (filteredWorkers().length === 0) {
            <div class="py-16 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 mt-6">
              <mat-icon class="!text-4xl text-slate-200 mb-4">search_off</mat-icon>
              <h3 class="text-lg font-black text-slate-900 mb-1">No results</h3>
              <p class="text-xs text-slate-500 font-medium">Try adjusting your filters.</p>
            </div>
          }

          @if (filteredWorkers().length \> 6) {
            <div class="mt-10 flex justify-center">
              <button (click)="loadMore()" class="text-slate-900 font-black text-[9px] uppercase tracking-widest border border-slate-200 px-8 py-3 rounded-xl hover:bg-slate-50 transition-all">
                Load More
              </button>
            </div>
          }
        </section>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    :ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }
    select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2374777d'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 0.5rem center; background-size: 1rem; padding-right: 1.5rem; }
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
      this.selectedExperience() === 'Senior' ? 5 : (this.selectedExperience() === 'Lead' ? 8 : (this.selectedExperience() === 'Master' ? 12 : undefined))
    );
  }

  loadMore() {
    this.performSearch();
  }
}
