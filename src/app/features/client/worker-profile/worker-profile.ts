import { Component, inject, computed, signal } from '@angular/core';
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
    <div class="max-w-4xl mx-auto pb-24 font-manrope animate-in fade-in duration-700">
      <!-- Breadcrumb Navigation -->
      <nav class="p-4 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        <a routerLink="/client" class="hover:text-slate-900 transition-colors">Marketplace</a>
        <mat-icon class="!text-[10px] !w-auto !h-auto">chevron_right</mat-icon>
        <span class="text-slate-900">{{ worker()?.name }}</span>
      </nav>

      <!-- Profile Header / Hero -->
      <section class="mx-4 mb-6">
        <div class="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl">
          <!-- Subtle Decoration -->
          <div class="absolute right-[-20px] top-[-20px] w-32 h-32 border-[16px] border-white/5 rounded-full"></div>
          
          <div class="flex flex-col items-center text-center relative z-10">
            <!-- Profile Avatar -->
            <div class="relative mb-6">
              <div class="w-28 h-28 rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl bg-slate-800 flex items-center justify-center text-slate-400 font-black text-2xl uppercase">
                @if (worker()?.image) { 
                  <img [src]="worker()?.image" class="w-full h-full object-cover"> 
                } @else { {{ worker()?.initials }} }
              </div>
              <div class="absolute bottom-[-4px] right-[-4px] w-6 h-6 bg-emerald-500 border-4 border-slate-900 rounded-full"></div>
            </div>

            <!-- Identity -->
            <h1 class="text-2xl font-black mb-1 tracking-tight">{{ worker()?.name }}</h1>
            <p class="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-6">{{ worker()?.category }}</p>

            <!-- Status Badges -->
            <div class="flex flex-wrap justify-center gap-2 mb-8">
              <span class="inline-flex items-center gap-1.5 bg-white/10 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10">
                <mat-icon class="!text-emerald-400 !text-xs !w-auto !h-auto">verified</mat-icon>
                Verified Expert
              </span>
              <span class="inline-flex items-center gap-1.5 bg-white/10 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10">
                <mat-icon class="!text-slate-400 !text-xs !w-auto !h-auto">location_on</mat-icon>
                {{ worker()?.location || 'Nairobi, Kenya' }}
              </span>
            </div>

            <!-- Mobile Primary Action -->
            <div class="w-full flex gap-2 sm:hidden">
              <button (click)="hire()" [disabled]="hasPendingRequest()" class="flex-1 bg-white text-slate-900 font-black py-4 rounded-xl text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-xl disabled:opacity-50">
                {{ hasPendingRequest() ? 'PENDING' : 'HIRE NOW' }}
              </button>
              <button (click)="message()" class="w-14 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center text-white active:scale-95 transition-all">
                <mat-icon>chat_bubble</mat-icon>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Desktop/Tablet Split View -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 mx-4">
        <!-- Main Details -->
        <main class="lg:col-span-8 space-y-6">
          <!-- Quick Stats (Injected for mobile parity but hidden on very small screens) -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-sm">
              <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Hourly Rate</p>
              <p class="text-lg font-black text-slate-900">$\{{ worker()?.rate }}</p>
            </div>
            <div class="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-sm">
              <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Reviews</p>
              <p class="text-lg font-black text-slate-900">{{ worker()?.reviews }}</p>
            </div>
            <div class="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-sm">
              <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Success</p>
              <p class="text-lg font-black text-emerald-600">{{ successRate() }}%</p>
            </div>
            <div class="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-sm">
              <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Projects</p>
              <p class="text-lg font-black text-slate-900">{{ worker()?.workHistory?.length || 0 }}</p>
            </div>
          </div>

          <!-- About Section -->
          <section class="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div class="flex items-center gap-2 mb-6">
              <div class="w-1 h-4 bg-slate-900 rounded-full"></div>
              <h2 class="text-[10px] font-black text-slate-900 uppercase tracking-widest">About Professional</h2>
            </div>
            <p class="text-sm text-slate-600 leading-relaxed font-medium mb-8">
              {{ worker()?.bio }}
            </p>
            <div class="flex flex-wrap gap-2">
              @for (skill of worker()?.skills; track skill) {
                <span class="bg-slate-50 border border-slate-100 text-slate-500 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tight">
                  {{ skill }}
                </span>
              }
            </div>
          </section>

          <!-- Work History -->
          <section class="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div class="flex items-center gap-2 mb-8">
              <div class="w-1 h-4 bg-slate-900 rounded-full"></div>
              <h2 class="text-[10px] font-black text-slate-900 uppercase tracking-widest">Verified History</h2>
            </div>
            
            <div class="space-y-8">
              @for (job of displayHistory(); track $index) {
                <div class="relative pl-6 pb-2 last:pb-0">
                  <div class="absolute left-[3px] top-2 bottom-0 w-[2px] bg-slate-50"></div>
                  <div class="absolute left-0 top-1.5 w-2 h-2 rounded-full border-2 border-slate-200 bg-white"></div>
                  
                  <div class="flex justify-between items-start mb-2">
                    <div>
                      <h3 class="text-sm font-black text-slate-900 tracking-tight">{{ job.role }}</h3>
                      <p class="text-[10px] font-bold text-blue-600 uppercase tracking-tight">{{ job.company }}</p>
                    </div>
                    <span class="text-[8px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded uppercase border border-slate-100">{{ job.period }}</span>
                  </div>
                  
                  <div class="bg-slate-50 rounded-xl p-4 border border-dashed border-slate-200">
                    <p class="text-[11px] italic text-slate-500 leading-relaxed">
                      "{{ job.description }}"
                    </p>
                  </div>
                </div>
              }
            </div>
          </section>
        </main>

        <!-- Sidebar Engagement (Desktop) -->
        <aside class="hidden lg:block lg:col-span-4 space-y-6">
          <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-xl sticky top-24">
            <div class="flex items-center gap-2 mb-6">
              <div class="w-1 h-4 bg-slate-900 rounded-full"></div>
              <h2 class="text-[10px] font-black text-slate-900 uppercase tracking-widest">Hire Summary</h2>
            </div>

            <div class="flex items-baseline gap-1 mb-6">
              <span class="text-3xl font-black text-slate-900 tracking-tighter">$\{{ worker()?.rate }}</span>
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">/ hr</span>
            </div>

            <!-- Stars Rating -->
            <div class="flex items-center gap-0.5 mb-8 bg-slate-50 p-3 rounded-xl border border-slate-100">
              @for (s of [1,2,3,4,5]; track s) {
                <mat-icon class="!text-sm !w-auto !h-auto text-amber-400" [class.material-fill]="s <= (worker()?.rating || 0)">star</mat-icon>
              }
              <span class="text-[10px] font-black text-slate-500 ml-2 tracking-tighter">{{ worker()?.reviews }} reviews</span>
            </div>

            <div class="space-y-3">
              <button (click)="hire()" [disabled]="hasPendingRequest()" 
                      class="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-30">
                {{ hasPendingRequest() ? 'REQUEST PENDING' : 'HIRE NOW' }}
              </button>
              <button (click)="message()" class="w-full bg-white border border-slate-200 text-slate-900 font-black py-4 rounded-xl text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95">
                SEND MESSAGE
              </button>
            </div>

            <div class="mt-6 text-center">
              <p class="text-[9px] font-black text-blue-500 uppercase tracking-widest flex items-center justify-center gap-1.5">
                <mat-icon class="!text-xs !w-auto !h-auto">lock</mat-icon>
                Secure Escrow Enabled
              </p>
            </div>
          </div>

          <!-- Credentials -->
          <section class="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div class="flex items-center gap-2 mb-6">
              <div class="w-1 h-4 bg-slate-900 rounded-full"></div>
              <h2 class="text-[10px] font-black text-slate-900 uppercase tracking-widest">Certificates</h2>
            </div>
            
            <div class="space-y-6">
              @for (c of displayCerts(); track c.name) {
                <div class="flex items-start gap-4">
                  <div class="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 shrink-0">
                    <mat-icon class="!text-slate-400 !text-lg">workspace_premium</mat-icon>
                  </div>
                  <div>
                    <h4 class="text-[11px] font-black text-slate-900 leading-tight">{{ c.name }}</h4>
                    <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{{ c.issuer }} · {{ c.year }}</p>
                  </div>
                </div>
              }
            </div>
          </section>
        </aside>
      </div>

      <!-- Sticky Mobile Engagement Bar -->
      <div class="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-200 z-50">
        <div class="max-w-md mx-auto flex items-center justify-between gap-4">
          <div>
            <div class="flex items-baseline gap-1">
              <span class="text-xl font-black text-slate-900 tracking-tighter">$\{{ worker()?.rate }}</span>
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-tighter">/ hr</span>
            </div>
            <div class="flex items-center gap-0.5 mt-0.5">
              <mat-icon class="!text-xs !w-auto !h-auto text-amber-400" style="font-variation-settings: 'FILL' 1;">star</mat-icon>
              <span class="text-[9px] font-black text-slate-500 ml-1">{{ worker()?.reviews }} reviews</span>
            </div>
          </div>
          <button (click)="hire()" [disabled]="hasPendingRequest()" 
                  class="bg-slate-900 hover:bg-slate-800 text-white font-black py-4 px-8 rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-30">
            {{ hasPendingRequest() ? 'PENDING' : 'HIRE NOW' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; background: #f8fafc; }
    ::ng-deep mat-icon { vertical-align: middle; }
  `]
})
export class ClientWorkerProfilePage {
  route = inject(ActivatedRoute);
  router = inject(Router);
  state = inject(PlatformStateService);

  worker = computed(() => {
    const id = this.route.snapshot.paramMap.get('id');
    const w = this.state.workers().find(w => w.id === id);
    return (w && w.status === 'Verified') ? w : null;
  });

  displayCerts = computed(() => this.worker()?.certifications || []);
  displayHistory = computed(() => this.worker()?.workHistory || []);

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