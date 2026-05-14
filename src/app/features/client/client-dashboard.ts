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
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-700">
      <!-- Hero Section -->
      <section class="mb-16 relative">
        <div class="max-w-3xl">
          <div class="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-50 text-slate-500 rounded-full text-[9px] font-black uppercase tracking-[0.2em] mb-6 border border-slate-100 shadow-sm">
            <mat-icon class="!text-[14px] !w-auto !h-auto text-indigo-500">verified</mat-icon>
            World-Class Professionals
          </div>
          <h1 class="text-5xl sm:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-tight">Elite Marketplace for Local Talent</h1>
          <p class="text-xl text-slate-500 font-medium leading-relaxed">Connect with vetted experts, track project milestones, and secure your transactions through our premium escrow system.</p>
        </div>
        
        <!-- Filter Bar (Floating Glassmorphism) -->
        <div class="mt-12 bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] filter-card shadow-2xl shadow-slate-200/50 border border-white grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 relative z-20">
          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Search Experts</label>
            <div class="relative group">
              <mat-icon class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors">search</mat-icon>
              <input type="text" class="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-600 transition-all outline-none shadow-inner" 
                     placeholder="Name or email..."
                     [ngModel]="nameQuery()" (ngModelChange)="nameQuery.set($event)">
            </div>
          </div>
          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Specialization</label>
            <div class="relative">
              <mat-icon class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">psychology</mat-icon>
              <select class="w-full pl-12 pr-10 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-600 transition-all outline-none cursor-pointer appearance-none shadow-inner" 
                      [ngModel]="selectedSkill()" (ngModelChange)="selectedSkill.set($event)">
                <option [value]="null">All Skills</option>
                @for (skill of state.availableSkills(); track skill) {
                  <option [value]="skill">{{ skill }}</option>
                }
              </select>
            </div>
          </div>
          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Regional Location</label>
            <div class="relative">
              <mat-icon class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">location_on</mat-icon>
              <select class="w-full pl-12 pr-10 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-600 transition-all outline-none cursor-pointer appearance-none shadow-inner" 
                      [ngModel]="locationQuery()" (ngModelChange)="locationQuery.set($event)">
                <option [value]="null">Global Access</option>
                @for (loc of state.availableLocations(); track loc) {
                  <option [value]="loc">{{ loc }}</option>
                }
              </select>
            </div>
          </div>
          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Seniority Level</label>
            <div class="relative">
              <mat-icon class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">verified_user</mat-icon>
              <select class="w-full pl-12 pr-10 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-600 transition-all outline-none cursor-pointer appearance-none shadow-inner" 
                      [ngModel]="selectedExperience()" (ngModelChange)="selectedExperience.set($event)">
                <option [value]="null">Any Experience</option>
                <option value="Senior">Senior (5+ yrs)</option>
                <option value="Lead">Lead (8+ yrs)</option>
                <option value="Master">Master (12+ yrs)</option>
              </select>
            </div>
          </div>
          <div class="flex items-end">
            <button (click)="performSearch()" class="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] hover:bg-indigo-600 active:scale-95 transition-all shadow-xl shadow-slate-900/10">
              Apply Filters
            </button>
          </div>
        </div>
      </section>

      <!-- Main Content Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <!-- Sidebar Insights -->
        <aside class="hidden lg:block lg:col-span-3 space-y-8">
          <div class="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
              <h3 class="text-[11px] font-black text-slate-900 uppercase tracking-widest">Market Insights</h3>
            </div>
            <div class="space-y-4">
              <div class="group">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-indigo-600 transition-colors">Verified Experts</p>
                <p class="text-3xl font-black text-slate-900 tracking-tighter">{{ state.verifiedWorkers().length }}</p>
              </div>
              <div class="group">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-indigo-600 transition-colors">Market Average</p>
                <p class="text-3xl font-black text-slate-900 tracking-tighter">\${{ averageRate() }}<span class="text-xs text-slate-400 font-medium ml-1">/hr</span></p>
              </div>
              <div class="group">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-indigo-600 transition-colors">Active Connections</p>
                <div class="flex items-center gap-2">
                  <span class="text-3xl font-black text-slate-900 tracking-tighter">{{ filteredWorkers().length }}</span>
                  <span class="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black rounded uppercase tracking-tight">Real-time</span>
                </div>
              </div>
            </div>
          </div>

          <div class="p-8 rounded-[2.5rem] engagement-card bg-indigo-950 text-white shadow-2xl relative overflow-hidden group">
             <mat-icon class="!text-5xl mb-6 opacity-20 group-hover:scale-110 transition-transform duration-500">shield_with_heart</mat-icon>
             <h4 class="text-xl font-black leading-tight mb-4 relative z-10">Uncompromising Security</h4>
             <p class="text-xs text-indigo-200 leading-relaxed font-medium relative z-10 mb-8">Every professional in our ecosystem undergoes multi-stage document verification and background alignment.</p>
             <div class="absolute -bottom-8 -right-8 opacity-5">
               <mat-icon class="!text-[12rem] !w-auto !h-auto">gpp_maybe</mat-icon>
             </div>
          </div>
        </aside>

        <!-- Professional Grid -->
        <section class="col-span-12 lg:col-span-9">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10">
            <div class="flex items-center gap-4">
              <h2 class="text-2xl font-black text-slate-900 tracking-tight">Discover Professionals</h2>
              <span class="px-3 py-1 bg-slate-100 text-slate-400 text-[10px] font-black rounded-full uppercase tracking-widest">{{ filteredWorkers().length }} Available</span>
            </div>
            <div class="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm">
              <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">Order by:</span>
              <select class="bg-transparent border-none font-black text-slate-900 text-[10px] focus:ring-0 cursor-pointer uppercase tracking-widest p-0 pr-6 appearance-none"
                      [ngModel]="selectedSort()" (ngModelChange)="selectedSort.set($event)">
                <option value="Highest Rated">Top Rated</option>
                <option value="Newest">Recently Joined</option>
                <option value="Rate: Low to High">Affordability</option>
              </select>
              <mat-icon class="!text-[14px] !w-auto !h-auto text-slate-300">expand_more</mat-icon>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            @for (worker of paginatedWorkers(); track worker.id) {
              <div class="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-500 group flex flex-col h-full relative overflow-hidden">
                <!-- Background Decoration -->
                <div class="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700"></div>
                
                <div class="relative z-10 flex items-start justify-between mb-5">
                  <div class="relative">
                    <div class="w-14 h-14 rounded-2xl overflow-hidden border-2 border-white shadow-lg bg-slate-50 flex items-center justify-center text-indigo-600 font-black text-lg uppercase group-hover:rotate-3 transition-transform duration-500">
                      @if (worker.image) { 
                        <img [src]="worker.image" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"> 
                      } @else { {{ worker.initials }} }
                    </div>
                    <span class="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-sm"></span>
                  </div>
                  <div class="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                    <mat-icon class="!text-amber-400 !text-[12px] !w-auto !h-auto" style="font-variation-settings: 'FILL' 1;">star</mat-icon>
                    <span class="text-[9px] font-black text-slate-500 uppercase tracking-tighter">{{ worker.reviews > 0 ? worker.rating.toFixed(1) : 'New' }}</span>
                  </div>
                </div>

                <div class="relative z-10 min-w-0 mb-4">
                  <h3 class="text-lg font-black text-slate-900 truncate group-hover:text-indigo-600 transition-colors mb-0.5 tracking-tight">{{ worker.name }}</h3>
                  <p class="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] truncate mb-3">{{ worker.category }}</p>
                  <p class="text-[11px] text-slate-400 font-medium leading-relaxed line-clamp-2">{{ worker.bio || 'Professional expert dedicated to excellence and quality delivery.' }}</p>
                </div>

                <div class="relative z-10 flex flex-wrap gap-1.5 mb-6 mt-auto">
                  @for (skill of worker.skills.slice(0, 2); track skill) {
                    <span class="bg-slate-50 text-slate-400 px-2.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border border-slate-100">{{ skill }}</span>
                  }
                </div>

                <div class="relative z-10 flex items-center justify-between pt-4 border-t border-slate-50">
                  <div class="flex flex-col">
                    <span class="text-xl font-black text-slate-900 tracking-tighter">$\{{ worker.rate }}</span>
                    <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rate</span>
                  </div>
                  <button [routerLink]="['/client/profile', worker.id]" 
                          class="bg-slate-950 text-white px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg shadow-slate-950/10 hover:bg-indigo-600 hover:scale-105 active:scale-95 transition-all">
                    View
                  </button>
                </div>
              </div>
            }
          </div>

          <!-- Pagination Bar -->
          @if (totalPages() > 1) {
            <div class="mt-12 flex items-center justify-center gap-2">
              <button (click)="goToPage(currentPage() - 1)" 
                      [disabled]="currentPage() === 1"
                      class="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:border-indigo-600 hover:text-indigo-600 disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:text-slate-400 transition-all bg-white shadow-sm">
                <mat-icon>chevron_left</mat-icon>
              </button>
              
              <div class="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
                @for (page of [].constructor(totalPages()); track $index) {
                  <button (click)="goToPage($index + 1)"
                          [class.bg-indigo-600]="$index + 1 === currentPage()"
                          [class.text-white]="$index + 1 === currentPage()"
                          [class.shadow-lg]="$index + 1 === currentPage()"
                          [class.shadow-indigo-600/20]="$index + 1 === currentPage()"
                          [class.text-slate-400]="$index + 1 !== currentPage()"
                          [class.hover:bg-slate-50]="$index + 1 !== currentPage()"
                          class="w-10 h-10 rounded-xl font-black text-xs transition-all">
                    {{ $index + 1 }}
                  </button>
                }
              </div>

              <button (click)="goToPage(currentPage() + 1)" 
                      [disabled]="currentPage() === totalPages()"
                      class="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:border-indigo-600 hover:text-indigo-600 disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:text-slate-400 transition-all bg-white shadow-sm">
                <mat-icon>chevron_right</mat-icon>
              </button>
            </div>
          }
        </section>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; background: #fafafa; }
    :ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }
    
    .animate-bounce-slow {
      animation: bounce 3s infinite;
    }
    
    @keyframes bounce {
      0%, 100% { transform: translateY(-5%); animation-timing-function: cubic-bezier(0.8,0,1,1); }
      50% { transform: translateY(0); animation-timing-function: cubic-bezier(0,0,0.2,1); }
    }

    @media (max-width: 768px) {
      .text-5xl { font-size: 2.5rem !important; }
      .text-6xl { font-size: 3rem !important; }
      .p-8 { padding: 1.5rem !important; }
      .filter-card, .engagement-card { border-radius: 2rem !important; }
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
      this.selectedExperience() === 'Senior' ? 5 : (this.selectedExperience() === 'Lead' ? 8 : (this.selectedExperience() === 'Master' ? 12 : undefined))
    );
  }

  loadMore() {
    this.performSearch();
  }
}
