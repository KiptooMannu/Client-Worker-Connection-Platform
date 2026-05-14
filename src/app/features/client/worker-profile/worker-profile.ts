import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { PlatformStateService } from '../../../core/services/platform-state.service';

@Component({
  selector: 'app-client-worker-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    RouterLink
  ],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-700">
      <!-- Breadcrumb -->
      <nav class="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8">
        <a routerLink="/client" class="hover:text-indigo-600 transition-colors">Marketplace</a>
        <mat-icon class="!text-[10px] !w-auto !h-auto">chevron_right</mat-icon>
        <span class="text-slate-900">{{ worker()?.name }}</span>
      </nav>

      <!-- Profile Header / Hero -->
      <div class="bg-white rounded-[3.5rem] profile-header-card border border-slate-100 shadow-sm overflow-hidden mb-12">
        <div class="bg-[#0f172a] p-10 sm:p-16 relative overflow-hidden group">
          <!-- Decorative elements -->
          <div class="absolute top-0 right-0 p-16 text-white/5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
            <mat-icon class="!text-[15rem] !w-auto !h-auto">workspace_premium</mat-icon>
          </div>
          
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 relative z-10">
            <div class="flex flex-col sm:flex-row items-center gap-8">
              <div class="relative">
                <div class="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-white/10 shadow-2xl bg-indigo-900 flex items-center justify-center text-indigo-300 font-black text-3xl uppercase group-hover:rotate-3 transition-transform duration-500">
                  @if (worker()?.image) { 
                    <img [src]="worker()?.image" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"> 
                  } @else { {{ worker()?.initials }} }
                </div>
                <span class="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 border-4 border-[#0f172a] rounded-full shadow-lg animate-pulse"></span>
              </div>
              <div class="text-center sm:text-left">
                <h1 class="text-4xl sm:text-5xl font-black text-white tracking-tight mb-2">{{ worker()?.name }}</h1>
                <p class="text-indigo-300 text-lg font-black uppercase tracking-[0.2em] mb-6">{{ worker()?.category }}</p>
                <div class="flex flex-wrap justify-center sm:justify-start gap-4">
                  <span class="px-5 py-2 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold text-indigo-100 flex items-center gap-2 backdrop-blur-sm">
                    <mat-icon class="!text-emerald-400 !text-sm !w-auto !h-auto">verified</mat-icon>
                    Verified Professional
                  </span>
                  <span class="px-5 py-2 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold text-indigo-100 flex items-center gap-2 backdrop-blur-sm">
                    <mat-icon class="!text-indigo-400 !text-sm !w-auto !h-auto">location_on</mat-icon>
                    {{ worker()?.location || 'Global' }}
                  </span>
                </div>
              </div>
            </div>
            
            <div class="flex gap-4 w-full md:w-auto">
              <button [disabled]="hasPendingRequest()" 
                      [class.opacity-50]="hasPendingRequest()"
                      (click)="hire()"
                      class="flex-1 md:flex-none px-10 py-5 bg-white text-slate-900 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-50 hover:scale-105 active:scale-95 transition-all disabled:cursor-not-allowed">
                {{ hasPendingRequest() ? 'Request Pending' : 'Hire now' }}
              </button>
              <button (click)="message()" class="px-5 py-5 bg-white/5 text-white border border-white/10 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95">
                <mat-icon>chat_bubble</mat-icon>
              </button>
            </div>
          </div>
        </div>

        <!-- Quick Stats Banner -->
        <div class="grid grid-cols-2 md:grid-cols-4 border-t border-slate-50">
          <div class="p-6 border-r border-slate-50 text-center group hover:bg-slate-50/50 transition-colors">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Hourly Rate</p>
            <p class="text-3xl font-black text-slate-900 tracking-tighter group-hover:text-indigo-600 transition-colors">$\{{ worker()?.rate }}</p>
          </div>
          <div class="p-6 border-r border-slate-50 text-center group hover:bg-slate-50/50 transition-colors">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Reviews</p>
            <p class="text-3xl font-black text-slate-900 tracking-tighter group-hover:text-indigo-600 transition-colors">{{ worker()?.reviews }}</p>
          </div>
          <div class="p-6 border-r border-slate-50 text-center group hover:bg-slate-50/50 transition-colors">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Success Rate</p>
            <p class="text-3xl font-black text-emerald-600 tracking-tighter">{{ successRate() }}%</p>
          </div>
          <div class="p-6 text-center group hover:bg-slate-50/50 transition-colors">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Projects</p>
            <p class="text-3xl font-black text-slate-900 tracking-tighter group-hover:text-indigo-600 transition-colors">{{ worker()?.workHistory?.length || 0 }}</p>
          </div>
        </div>
      </div>

      <!-- Main Profile Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <!-- Left: Details & History -->
        <div class="lg:col-span-8 space-y-12">
          <!-- About -->
          <section class="bg-white p-10 sm:p-14 rounded-[3rem] content-card border border-slate-100 shadow-sm relative overflow-hidden group">
            <div class="flex items-center gap-3 mb-10">
              <div class="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
              <h2 class="text-[12px] font-black text-slate-900 uppercase tracking-[0.2em]">Professional Background</h2>
            </div>
            <p class="text-xl text-slate-600 font-medium leading-relaxed mb-12 relative z-10">{{ worker()?.bio }}</p>
            
            <div class="flex flex-wrap gap-3">
              @for (skill of worker()?.skills; track skill) {
                <span class="px-5 py-2.5 bg-slate-50 text-slate-500 rounded-2xl text-[11px] font-black uppercase tracking-widest border border-slate-100 hover:border-indigo-600 hover:text-indigo-600 transition-all cursor-default">
                  {{ skill }}
                </span>
              }
            </div>
          </section>

          <!-- Portfolio / History -->
          <section class="bg-white p-10 sm:p-14 rounded-[3rem] content-card border border-slate-100 shadow-sm">
            <div class="flex items-center gap-3 mb-12">
              <div class="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
              <h2 class="text-[12px] font-black text-slate-900 uppercase tracking-[0.2em]">Verified Work History</h2>
            </div>

            <div class="space-y-10">
              @for (job of displayHistory(); track $index) {
                <div class="group relative pl-12 border-l-2 border-slate-100 hover:border-indigo-600 transition-all pb-10 last:pb-0">
                  <!-- Timeline point -->
                  <div class="absolute left-[-9px] top-0 w-4 h-4 bg-white border-2 border-slate-200 rounded-full group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-all"></div>
                  
                  <div class="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                    <div>
                      <h4 class="text-2xl font-black text-slate-900 tracking-tight">{{ job.role }}</h4>
                      <p class="text-indigo-500 font-black text-[11px] uppercase tracking-widest">{{ job.company }}</p>
                    </div>
                    <span class="px-4 py-1.5 bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-slate-100">{{ job.period }}</span>
                  </div>
                  <p class="text-slate-500 font-medium leading-relaxed bg-slate-50/50 p-6 rounded-[1.5rem] border border-dashed border-slate-100 italic group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-all">"{{ job.description }}"</p>
                </div>
              }
            </div>
          </section>
        </div>

        <!-- Right: Actions & Metrics -->
        <div class="lg:col-span-4 space-y-8">
          <!-- Sidebar Engagement -->
          <div class="bg-indigo-950 p-10 rounded-[3rem] content-card text-white shadow-2xl sticky top-24 overflow-hidden group">
            <div class="relative z-10">
              <div class="flex items-center gap-3 mb-10">
                <div class="w-1.5 h-6 bg-white rounded-full"></div>
                <h3 class="text-[11px] font-black text-indigo-200 uppercase tracking-widest">Hire Engagement</h3>
              </div>
              
              <div class="flex items-baseline gap-2 mb-8">
                <span class="text-5xl font-black tracking-tighter">$\{{ worker()?.rate }}</span>
                <span class="text-xs font-black text-indigo-300 uppercase tracking-widest">/ hr</span>
              </div>

              <div class="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10 mb-10 backdrop-blur-sm">
                <div class="flex items-center gap-0.5 text-amber-400">
                  @for (s of [1,2,3,4,5]; track s) {
                    <mat-icon class="!text-lg !w-auto !h-auto" style="font-variation-settings: 'FILL' 1;">star</mat-icon>
                  }
                </div>
                <span class="text-xs font-black text-white">{{ worker()?.rating?.toFixed(2) }} · {{ worker()?.reviews }} reviews</span>
              </div>

              <div class="space-y-4">
                <button [disabled]="hasPendingRequest()" 
                        (click)="hire()"
                        class="w-full py-5 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-50 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                  {{ hasPendingRequest() ? 'Hiring Pending' : 'Initialize Contract' }}
                </button>
                <button (click)="message()" class="w-full py-5 bg-white/5 text-white border border-white/10 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95">
                  Send Message
                </button>
              </div>

              <p class="text-[10px] text-center text-indigo-400 font-black uppercase tracking-widest mt-8 italic">Secure Escrow Payments Enabled</p>
            </div>

            <!-- Decoration -->
            <div class="absolute -bottom-10 -right-10 opacity-5 transform rotate-12 group-hover:scale-110 transition-transform duration-700">
              <mat-icon class="!text-[12rem] !w-auto !h-auto">lock_person</mat-icon>
            </div>
          </div>

          <!-- Skills & Certifications -->
          <div class="bg-white p-10 rounded-[3rem] content-card border border-slate-100 shadow-sm overflow-hidden">
            <div class="flex items-center gap-3 mb-10">
              <div class="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
              <h3 class="text-[11px] font-black text-slate-900 uppercase tracking-widest">Credentials</h3>
            </div>
            
            <div class="space-y-8">
              @for (c of displayCerts(); track c.name) {
                <div class="flex items-center gap-5 group">
                  <div class="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                    <mat-icon>workspace_premium</mat-icon>
                  </div>
                  <div>
                    <h5 class="text-sm font-black text-slate-900 leading-tight mb-1 group-hover:text-indigo-600 transition-colors">{{ c.name }}</h5>
                    <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest">{{ c.issuer }} · {{ c.year }}</p>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; background: #fafafa; }
    
    @media (max-width: 768px) {
      .p-10, .p-14, .p-16 { padding: 2rem !important; }
      .text-5xl { font-size: 2.75rem !important; }
      .text-4xl { font-size: 2.25rem !important; }
      .profile-header-card, .content-card { border-radius: 2rem !important; }
    }
  `]
})
export class ClientWorkerProfilePage {
  route = inject(ActivatedRoute);
  router = inject(Router);
  state = inject(PlatformStateService);

  worker = computed(() => {
    const id = this.route.snapshot.paramMap.get('id');
    const w = this.state.workers().find(w => w.id === id);
    // Critical Rule: Clients interact ONLY with verified workers.
    return (w && w.status === 'Verified') ? w : null;
  });

  displayCerts = computed(() => this.worker()?.certifications || []);
  displayHistory = computed(() => this.worker()?.workHistory || []);

  metrics = computed(() => {
    const w = this.worker();
    const rating = Math.round((w?.rating || 0) * 20);
    const reviewCoverage = Math.min(100, (w?.reviews || 0) * 10);
    return [
      { label: 'Job Success', value: this.successRate() },
      { label: 'Client Recommendation', value: rating },
      { label: 'Review Coverage', value: reviewCoverage }
    ];
  });

  successRate = computed(() => {
    const reviews = this.worker()?.reviews || 0;
    return reviews > 0 ? Math.min(100, 80 + reviews) : 0;
  });
  
  hasPendingRequest = computed(() => {
    const w = this.worker();
    if (!w) return false;
    return this.state.bookings().some(b => 
      b.workerId === w.id && (b.status === 'PENDING' || b.status === 'ACCEPTED')
    );
  });

  hire() {
    const w = this.worker();
    if (w) {
      this.state.hireWorker(w.id);
      this.router.navigate(['/client/bookings']);
    }
  }

  message() {
    const w = this.worker();
    if (w) {
      this.state.startChat(w.id);
      this.router.navigate(['/client/messages']);
    }
  }
}