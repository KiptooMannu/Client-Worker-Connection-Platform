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
      <section class="mb-12 space-y-6">
        <div class="max-w-2xl">
          <h1 class="text-4xl font-black text-slate-900 mb-3 tracking-tight">Find Trusted Local Workers</h1>
          <p class="text-base text-slate-500 font-medium">Connect with verified plumbers, electricians, mechanics, and cleaners ready to help with your next job.</p>
        </div>
        
        <!-- Filter Bar -->
        <div class="bg-white p-6 rounded-3xl shadow-[0_4px_24px_rgba(4,22,39,0.06)] border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Professional Skill</label>
            <div class="flex items-center border border-slate-200 rounded-xl px-4 py-3 bg-white focus-within:border-indigo-600 transition-all">
              <mat-icon class="text-slate-400 mr-2">psychology</mat-icon>
              <select class="w-full border-none focus:ring-0 bg-transparent text-sm font-bold cursor-pointer" [ngModel]="selectedSkill()" (ngModelChange)="selectedSkill.set($event)">
                <option [value]="null">Select Skill</option>
                @for (skill of state.availableSkills(); track skill) {
                  <option [value]="skill">{{ skill }}</option>
                }
              </select>
            </div>
          </div>
          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Location</label>
            <div class="flex items-center border border-slate-200 rounded-xl px-4 py-3 bg-white focus-within:border-indigo-600 transition-all">
              <mat-icon class="text-slate-400 mr-2">location_on</mat-icon>
              <select class="w-full border-none focus:ring-0 bg-transparent text-sm font-bold cursor-pointer" [ngModel]="locationQuery()" (ngModelChange)="locationQuery.set($event)">
                <option [value]="null">Select Location</option>
                @for (loc of state.availableLocations(); track loc) {
                  <option [value]="loc">{{ loc }}</option>
                }
              </select>
            </div>
          </div>
          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Experience</label>
            <div class="flex items-center border border-slate-200 rounded-xl px-4 py-3 bg-white focus-within:border-indigo-600 transition-all">
              <mat-icon class="text-slate-400 mr-2">work_history</mat-icon>
              <select class="w-full border-none focus:ring-0 bg-transparent text-sm font-bold cursor-pointer" [ngModel]="selectedExperience()" (ngModelChange)="selectedExperience.set($event)">
                <option [value]="null">Any Experience</option>
                <option value="Senior">Senior (5+ yrs)</option>
                <option value="Lead">Lead (8+ yrs)</option>
                <option value="Master">Master (12+ yrs)</option>
              </select>
            </div>
          </div>
          <div class="flex items-end">
            <button (click)="performSearch()" class="w-full bg-[#0f172a] text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-indigo-900/20">
              Search Professionals
            </button>
          </div>
        </div>
      </section>

      <!-- Main Content Layout -->
      <div class="grid grid-cols-12 gap-8">
        <!-- Sidebar Stats -->
        <aside class="hidden lg:block lg:col-span-3 space-y-8">
          <div class="bg-slate-50 p-6 premium-card border border-slate-100">
            <h3 class="text-lg font-black text-slate-900 mb-4">Market Insights</h3>
            <ul class="space-y-6">
              <li class="flex items-center justify-between">
                <span class="text-sm font-medium text-slate-500">Active Experts</span>
                <span class="text-sm font-black text-slate-900">{{ state.verifiedWorkers().length }}</span>
              </li>
              <li class="flex items-center justify-between">
                <span class="text-sm font-medium text-slate-500">Avg. Hourly Rate</span>
                <span class="text-sm font-black text-slate-900">\${{ averageRate() }}/hr</span>
              </li>
              <li class="flex items-center justify-between">
                <span class="text-sm font-medium text-slate-500">Matched Results</span>
                <span class="text-[10px] font-black text-teal-700 bg-teal-50 px-2 py-0.5 rounded tracking-tighter uppercase">{{ filteredWorkers().length }} workers</span>
              </li>
            </ul>
          </div>

          <!-- Messaging Insight -->
          <div class="bg-white p-6 premium-card border border-slate-100 shadow-sm">
             <div class="flex justify-between items-center mb-6">
                <h3 class="text-sm font-black text-slate-900 uppercase tracking-widest">Recent Chats</h3>
                <button routerLink="/client/messages" class="text-[9px] font-black text-blue-600 hover:underline">All</button>
             </div>
             <div class="space-y-4">
                @for (chat of state.chats().slice(0, 3); track chat.id) {
                   <div class="flex items-center gap-3 cursor-pointer group" routerLink="/client/messages">
                      <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black text-[10px] text-slate-500 uppercase overflow-hidden border border-white">
                         @if (chat.image) { <img [src]="chat.image" class="w-full h-full object-cover"> } @else { {{ chat.initials }} }
                      </div>
                      <div class="flex-1 min-w-0">
                         <p class="text-[11px] font-black text-slate-900 truncate group-hover:text-blue-600 transition-colors">{{ chat.name }}</p>
                         <p class="text-[9px] text-slate-400 truncate">{{ chat.lastMessage }}</p>
                      </div>
                   </div>
                }
                @if (state.chats().length === 0) {
                   <p class="text-center py-4 text-[10px] font-black text-slate-300 uppercase tracking-widest border border-dashed border-slate-200 rounded-xl">No active chats</p>
                }
             </div>
          </div>
          
          <!-- Featured Card -->
          <div class="relative premium-card overflow-hidden aspect-[4/5] group shadow-2xl bg-slate-900 text-white p-6 flex flex-col justify-end">
            <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
            <div class="relative z-10">
              <p class="text-[9px] font-black text-blue-300 uppercase tracking-widest mb-1">Top Rated</p>
              <h4 class="text-xl font-black text-white leading-tight mb-1">{{ topWorker()?.name || 'No verified worker yet' }}</h4>
              <p class="text-xs font-medium text-slate-300">{{ topWorker()?.category || 'Awaiting approvals' }}</p>
            </div>
          </div>
        </aside>

        <!-- Professional Grid -->
        <section class="col-span-12 lg:col-span-9">
          <div class="flex items-center justify-between mb-8">
            <h2 class="text-3xl font-black text-slate-900 tracking-tight">Available Workers</h2>
            <div class="flex items-center gap-2 text-slate-400">
              <span class="text-[10px] font-black uppercase tracking-widest">Sort by:</span>
              <select class="bg-transparent border-none font-black text-slate-900 text-xs focus:ring-0 cursor-pointer uppercase tracking-widest"
                      [ngModel]="selectedSort()" (ngModelChange)="selectedSort.set($event)">
                <option value="Highest Rated">Highest Rated</option>
                <option value="Newest">Newest</option>
                <option value="Rate: Low to High">Rate: Low to High</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            @for (worker of filteredWorkers(); track worker.id) {
              <div class="bg-white border border-slate-100 premium-card p-8 shadow-[0_4px_24px_rgba(4,22,39,0.04)] hover:shadow-[0_12px_48px_rgba(4,22,39,0.1)] transition-all group">
                <div class="flex items-start justify-between mb-6">
                  <div class="flex items-center gap-5">
                    <div class="relative shrink-0">
                      <div class="w-20 h-20 rounded-[1.75rem] overflow-hidden border-4 border-white shadow-xl bg-slate-50 flex items-center justify-center text-blue-700 font-black text-xl uppercase">
                        @if (worker.image) { <img [src]="worker.image" class="w-full h-full object-cover"> } @else { {{ worker.initials }} }
                      </div>
                      <span class="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full"></span>
                    </div>
                    <div>
                      <h3 class="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{{ worker.name }}</h3>
                      <p class="text-xs font-black text-blue-600 uppercase tracking-widest mt-1">{{ worker.category }}</p>
                    </div>
                  </div>
                  <div class="flex items-center bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100/50">
                    <mat-icon class="!text-sm !w-auto !h-auto text-blue-700" style="font-variation-settings: 'FILL' 1;">star</mat-icon>
                    <span class="text-xs font-black text-blue-800 ml-1">{{ worker.rating || 'New' }}</span>
                  </div>
                </div>

                <div class="flex flex-wrap gap-2 mb-8">
                  @for (skill of worker.skills; track skill) {
                    <span class="bg-slate-50 text-slate-500 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-tight border border-slate-100">{{ skill }}</span>
                  }
                </div>

                <div class="flex items-center justify-between pt-6 border-t border-slate-50">
                  <div>
                    <p class="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Starting from</p>
                    <p class="text-2xl font-black text-slate-900 tracking-tighter">\${{ worker.rate }}<span class="text-xs font-medium text-slate-400 ml-1">/hr</span></p>
                  </div>
                  <button [routerLink]="['/client/profile', worker.id]" 
                          class="bg-[#0f172a] text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-indigo-900/10">
                    View Profile
                  </button>
                </div>
              </div>
            }
          </div>

          @if (filteredWorkers().length === 0) {
            <div class="p-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 mt-8">
              <mat-icon class="!text-6xl !w-auto !h-auto text-slate-200 mb-6">search_off</mat-icon>
              <h3 class="text-2xl font-black text-slate-900 mb-2">No Workers Found</h3>
              <p class="text-slate-500 font-medium">Try adjusting your skill filters or location search.</p>
            </div>
          }

          <!-- Pagination -->
          <div class="mt-12 flex justify-center">
            <button (click)="loadMore()" class="text-slate-900 font-black text-[10px] uppercase tracking-widest border-2 border-slate-100 px-10 py-4 rounded-2xl hover:bg-slate-50 active:scale-95 transition-all">
              Load More Workers
            </button>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    :ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }
    select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2374777d'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 1rem center; background-size: 1.25rem; padding-right: 2.5rem; }

    @media (max-width: 768px) {
      .text-5xl { font-size: 2.5rem !important; }
      .text-3xl { font-size: 1.75rem !important; }
      .p-6, .p-8 { padding: 1.5rem !important; }
      .grid-cols-4 { grid-template-columns: 1fr !important; }
      .lg\\:col-span-3 { display: none; }
      .col-span-12.lg\\:col-span-9 { grid-column: span 12 / span 12 !important; }
    }
  `]
})
export class ClientDashboardPage {
  state = inject(PlatformStateService);
  private notification = inject(NotificationService);
  
  // Removed hardcoded options - now wired to database signals

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

  topWorker = computed(() => {
    const workers = this.state.verifiedWorkers();
    return workers.length ? workers[0] : null;
  });

  filteredWorkers = computed(() => {
    let list = this.state.verifiedWorkers();
    
    // Skill Filter
    if (this.selectedSkill() && this.selectedSkill() !== 'null') {
      const q = this.selectedSkill()!.toLowerCase();
      list = list.filter(w => w.category.toLowerCase().includes(q) || 
                              w.skills.some(s => s.toLowerCase().includes(q)));
    }

    // Location Search
    if (this.locationQuery() && this.locationQuery() !== 'null') {
      const loc = this.locationQuery()!.toLowerCase();
      list = list.filter(w => 
        w.location.toLowerCase().includes(loc) || 
        w.preferredLocations.some(pl => pl.toLowerCase().includes(loc))
      );
    }

    // Experience Filter
    if (this.selectedExperience() && this.selectedExperience() !== 'null') {
       const exp = this.selectedExperience()!.toLowerCase();
       // Search in bio and work history for experience keywords
       list = list.filter(w => 
         w.category.toLowerCase().includes(exp) || 
         w.bio.toLowerCase().includes(exp) ||
         w.workHistory.some(wh => wh.role.toLowerCase().includes(exp) || wh.description.toLowerCase().includes(exp))
       );
    }

    // Sorting
    const sort = this.selectedSort();
    return [...list].sort((a, b) => {
      if (sort === 'Highest Rated') return (b.rating || 0) - (a.rating || 0);
      if (sort === 'Newest') return b.id.localeCompare(a.id); // Mock newer ID = higher
      if (sort === 'Rate: Low to High') return a.rate - b.rate;
      return 0;
    });
  });

  performSearch() {
    this.notification.info('Searching for professionals...');
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
