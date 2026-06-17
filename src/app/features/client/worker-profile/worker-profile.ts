import { Component, inject, computed, signal, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { PlatformStateService } from '../../../core/services/platform-state.service';

// Define types for better type safety
interface WorkerProfile {
  id: string;
  name: string;
  initials: string;
  category: string;
  image?: string;
  location?: string;
  rate: number;
  reviews: number;
  rating?: number;
  bio?: string;
  skills: string[];
  completedJobs: number;
  workHistory: WorkHistory[];
  certifications: Certification[];
  reviewsList: Review[];
  status?: string;
}

interface WorkHistory {
  role: string;
  company: string;
  period: string;
  description: string;
}

interface Certification {
  name: string;
  issuer: string;
  year: string;
}

interface Review {
  id: string;
  clientName?: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

interface Booking {
  id: string;
  workerId: string;
  status: string;
}

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
        <a routerLink="/employer" class="hover:text-slate-900 transition-colors">Marketplace</a>
        <mat-icon class="!text-[10px] !w-auto !h-auto">chevron_right</mat-icon>
        <span class="text-slate-900">{{ workerData().name }}</span>
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
                @if (workerData().image) { 
                  <img [src]="workerData().image" class="w-full h-full object-cover"> 
                } @else { {{ workerData().initials }} }
              </div>
              <div class="absolute bottom-[-4px] right-[-4px] w-6 h-6 bg-emerald-500 border-4 border-slate-900 rounded-full"></div>
            </div>

            <!-- Identity -->
            <h1 class="text-2xl font-black mb-1 tracking-tight">{{ workerData().name }}</h1>
            <p class="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-6">{{ workerData().category }}</p>

            <!-- Status Badges -->
            <div class="flex flex-wrap justify-center gap-2 mb-8">
              <span class="inline-flex items-center gap-1.5 bg-white/10 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10">
                <mat-icon class="!text-emerald-400 !text-xs !w-auto !h-auto">verified</mat-icon>
                Verified Expert
              </span>
              <span class="inline-flex items-center gap-1.5 bg-white/10 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10">
                <mat-icon class="!text-slate-400 !text-xs !w-auto !h-auto">location_on</mat-icon>
                {{ workerData().location || 'Nairobi, Kenya' }}
              </span>
            </div>

            <!-- Mobile Primary Action -->
            <div class="w-full flex gap-2 sm:hidden">
              <button (click)="message()" class="flex-1 bg-blue-100 border-2 border-blue-400 text-blue-600 font-black py-4 rounded-xl text-[10px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-1.5">
                <mat-icon class="!text-xs !w-auto !h-auto">chat_bubble</mat-icon>
                Negotiate
              </button>
              <button (click)="hire()" [disabled]="hasPendingRequest() || hiring()" class="flex-1 bg-white text-slate-900 font-black py-4 rounded-xl text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-xl disabled:opacity-50">
                {{ hasPendingRequest() ? 'PENDING' : (hiring() ? 'SENDING...' : 'HIRE') }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Desktop/Tablet Split View -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 mx-4">
        <!-- Main Details -->
        <main class="lg:col-span-8 space-y-6">
          <!-- Quick Stats -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-sm">
              <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Rate</p>
              <p class="text-lg font-black text-slate-900">KSh {{ workerData().rate }}</p>
            </div>
            <div class="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-sm">
              <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Reviews</p>
              <p class="text-lg font-black text-slate-900">{{ workerData().reviews }}</p>
            </div>
            <div class="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-sm">
              <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Success</p>
              <p class="text-lg font-black text-emerald-600">{{ successRate() }}%</p>
            </div>
            <div class="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-sm">
              <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Projects</p>
              <p class="text-lg font-black text-slate-900">{{ workerData().workHistory.length }}</p>
            </div>
          </div>

          <!-- About Section -->
          <section class="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div class="flex items-center gap-2 mb-6">
              <div class="w-1 h-4 bg-slate-900 rounded-full"></div>
              <h2 class="text-[10px] font-black text-slate-900 uppercase tracking-widest">About Professional</h2>
            </div>
            <p class="text-sm text-slate-600 leading-relaxed font-medium mb-8">
              {{ workerData().bio }}
            </p>
            <div class="flex flex-wrap gap-2">
              @for (skill of workerData().skills; track skill) {
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

          <!-- Reviews Section -->
          <section class="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div class="flex items-center gap-2 mb-8">
              <div class="w-1 h-4 bg-slate-900 rounded-full"></div>
              <h2 class="text-[10px] font-black text-slate-900 uppercase tracking-widest">Client Reviews</h2>
            </div>
            
            <!-- Overall Rating -->
            <div class="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-8">
              <div class="flex items-center gap-4">
                <div class="text-center">
                  <p class="text-4xl font-black text-slate-900 tracking-tighter">{{ workerData().rating.toFixed(1) || '0.0' }}</p>
                  <div class="flex items-center gap-0.5 mt-1 justify-center">
                    @for (s of [1,2,3,4,5]; track s) {
                      <mat-icon class="!text-sm !w-auto !h-auto text-amber-400" [class.material-fill]="s <= (workerData().rating || 0)">star</mat-icon>
                    }
                  </div>
                  <p class="text-[9px] font-black text-slate-500 mt-1">{{ workerData().reviews }} reviews</p>
                </div>
                <div class="flex-1 h-px bg-slate-200"></div>
                <div class="text-center">
                  <p class="text-2xl font-black text-slate-900 tracking-tighter">{{ workerData().completedJobs }}</p>
                  <p class="text-[9px] font-black text-slate-500 uppercase tracking-wider mt-1">Jobs Completed</p>
                </div>
              </div>
            </div>

            <!-- Individual Reviews - FIXED -->
            @if (hasReviews()) {
              <div class="space-y-6">
                @for (review of reviewsList(); track review.id) {
                  <div class="bg-slate-50 rounded-xl p-5 border border-slate-100">
                    <div class="flex items-start justify-between mb-3">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm uppercase">
                          {{ review.clientName?.substring(0, 2) || 'AN' }}
                        </div>
                        <div>
                          <p class="text-sm font-black text-slate-900">{{ review.clientName || 'Anonymous' }}</p>
                          <div class="flex items-center gap-0.5 mt-0.5">
                            @for (s of [1,2,3,4,5]; track s) {
                              <mat-icon class="!text-xs !w-auto !h-auto text-amber-400" [class.material-fill]="s <= review.rating">star</mat-icon>
                            }
                          </div>
                        </div>
                      </div>
                      <span class="text-[8px] font-black text-slate-400 uppercase tracking-wider">{{ review.createdAt }}</span>
                    </div>
                    <p class="text-sm text-slate-600 leading-relaxed font-medium">"{{ review.comment || 'No comment provided.' }}"</p>
                  </div>
                }
              </div>
            } @else {
              <div class="text-center py-8">
                <div class="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 mx-auto mb-3 border border-slate-100/50">
                  <mat-icon class="!text-2xl">star_outline</mat-icon>
                </div>
                <p class="text-sm text-slate-400 font-medium">No reviews yet</p>
                <p class="text-[10px] text-slate-300 mt-1">Be the first to leave a review!</p>
              </div>
            }
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
              <span class="text-3xl font-black text-slate-900 tracking-tighter">KSh {{ workerData().rate }}</span>
            </div>

            <!-- Rating & CTA Intro -->
            <div class="flex items-center gap-0.5 mb-8 bg-slate-50 p-3 rounded-xl border border-slate-100">
              @for (s of [1,2,3,4,5]; track s) {
                <mat-icon class="!text-sm !w-auto !h-auto text-amber-400" [class.material-fill]="s <= (workerData().rating || 0)">star</mat-icon>
              }
              <span class="text-[10px] font-black text-slate-500 ml-2 tracking-tighter">{{ workerData().reviews }} reviews</span>
            </div>

            <!-- Helper Text -->
            <p class="text-[9px] text-slate-500 font-medium mb-4 italic">💡 Tip: Message first to discuss rates, timeline, or specific requirements before hiring.</p>

            <div class="space-y-3">
              <button (click)="message()" class="w-full bg-blue-50 border-2 border-blue-400 text-blue-600 font-black py-4 rounded-xl text-[10px] uppercase tracking-widest hover:bg-blue-100 transition-all active:scale-95 flex items-center justify-center gap-2">
                <mat-icon class="!text-sm !w-auto !h-auto">chat_bubble_outline</mat-icon>
                Negotiate Terms
              </button>
              <button (click)="hire()" [disabled]="hasPendingRequest() || hiring()" 
                      class="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-30 flex items-center justify-center gap-2">
                <mat-icon class="!text-sm !w-auto !h-auto">check_circle</mat-icon>
                {{ hasPendingRequest() ? 'REQUEST PENDING' : (hiring() ? 'SENDING...' : 'HIRE NOW') }}
              </button>
            </div>

            <div class="mt-6 text-center">
              <p class="text-[9px] font-black text-blue-500 uppercase tracking-widest flex items-center justify-center gap-1.5">
                <mat-icon class="!text-xs !w-auto !h-auto">lock</mat-icon>
                Secure Payments Enabled
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
               @if (displayCerts().length) {
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
               } @else {
                 <p class="text-[9px] text-slate-500 italic">No certifications added.</p>
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
              <span class="text-xl font-black text-slate-900 tracking-tighter">KSh {{ workerData().rate }}</span>
            </div>
            <div class="flex items-center gap-0.5 mt-0.5">
              <mat-icon class="!text-xs !w-auto !h-auto text-amber-400" style="font-variation-settings: 'FILL' 1;">star</mat-icon>
              <span class="text-[9px] font-black text-slate-500 ml-1">{{ workerData().reviews }} reviews</span>
            </div>
          </div>
          <button (click)="hire()" [disabled]="hasPendingRequest() || hiring()" 
                  class="bg-slate-900 hover:bg-slate-800 text-white font-black py-4 px-8 rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-30">
            {{ hasPendingRequest() ? 'PENDING' : (hiring() ? 'SENDING...' : 'HIRE NOW') }}
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
  hiring = signal(false);

  // Get the raw worker data with safe fallback
  private workerRaw = computed(() => {
    const id = this.route.snapshot.paramMap.get('id');
    const w = this.state.workers().find(w => w.id === id);
    return (w && w.status === 'Verified') ? w : null;
  });

  // Worker data with safe defaults for null/undefined
  workerData = computed(() => {
    const w = this.workerRaw();
    return {
      id: w?.id || '',
      name: w?.name || 'Unknown Worker',
      initials: w?.initials || 'UN',
      category: w?.category || 'Professional',
      image: w?.image,
      location: w?.location || 'Nairobi, Kenya',
      rate: w?.rate || 0,
      reviews: w?.reviews || 0,
      rating: w?.rating || 0,
      bio: w?.bio || 'No bio available.',
      skills: w?.skills || [],
      completedJobs: w?.completedJobs || 0,
      workHistory: w?.workHistory || [],
      certifications: w?.certifications || [],
      reviewsList: w?.reviewsList || [],
      status: w?.status
    };
  });

  // Computed signals for template - cleaner and safer
  displayCerts = computed(() => this.workerData().certifications);
  displayHistory = computed(() => this.workerData().workHistory);
  
  // Safe computed for reviews
  reviewsList = computed(() => this.workerData().reviewsList);
  hasReviews = computed(() => this.reviewsList().length > 0);

  successRate = computed(() => {
    const reviews = this.workerData().reviews;
    return reviews > 0 ? Math.min(100, 80 + reviews) : 0;
  });
  
  hasPendingRequest = computed(() => {
    const worker = this.workerRaw();
    if (!worker) return false;
    return this.state.bookings().some((b: Booking) => 
      b.workerId === worker.id && 
      (b.status.toLowerCase() === 'pending' || b.status.toLowerCase() === 'accepted')
    );
  });

  constructor() {
    // Fetch reviews and rating summary when worker ID changes
    effect(() => {
      const worker = this.workerRaw();
      if (worker) {
        this.state.fetchWorkerReviews(worker.id);
        this.state.fetchWorkerRatingSummary(worker.id);
      }
    });
  }

  hire() {
    const worker = this.workerRaw();
    if (worker) {
      this.hiring.set(true);
      this.state.hireWorker(worker.id).subscribe({
        next: () => {
          this.hiring.set(false);
          this.router.navigate(['/client/bookings']);
        },
        error: () => {
          this.hiring.set(false);
        }
      });
    }
  }

  message() {
    const worker = this.workerRaw();
    if (worker) {
      this.state.startChat(worker.id);
      this.router.navigate(['/client', 'messages']);
    }
  }
}