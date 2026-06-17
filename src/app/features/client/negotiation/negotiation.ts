import { Component, inject, signal, OnInit, computed } from '@angular/core'; // Added computed
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PlatformStateService, WorkerProfile } from '../../../core/services/platform-state.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-negotiation',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule],
  template: `
    <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-manrope">

      @if (!worker()) {
        <!-- Loading State -->
        <div class="text-center py-16">
          <mat-icon class="!text-5xl text-slate-300 mb-4">search</mat-icon>
          <p class="text-slate-500 font-medium">Loading worker details...</p>
        </div>
      }

      @if (worker()) {
        <div class="w-full max-w-2xl">

          <!-- Back Button -->
          <button (click)="goBack()"
                  class="flex items-center gap-2 text-slate-400 hover:text-slate-700 font-black text-[10px] uppercase tracking-widest mb-8 transition-colors group">
            <mat-icon class="!text-base group-hover:-translate-x-0.5 transition-transform">arrow_back</mat-icon>
            Back to Marketplace
          </button>

          <!-- Worker Card -->
          <div class="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-6">

            <!-- Worker Header -->
            <div class="p-8 border-b border-slate-50">
              <div class="flex items-start gap-6">
                <div class="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center text-brand-teal font-black text-2xl uppercase shrink-0">
                  @if (worker()?.image) {
                    <img [src]="worker()!.image" class="w-full h-full object-cover" [alt]="worker()!.name">
                  } @else {
                    {{ worker()?.initials || worker()?.name?.charAt(0) || '?' }}
                  }
                </div>
                <div class="flex-1">
                  <div class="flex items-start justify-between gap-4">
                    <div>
                      <h1 class="text-2xl font-black text-slate-900 tracking-tight mb-1">{{ worker()?.name }}</h1>
                      <p class="text-brand-teal font-black text-[10px] uppercase tracking-widest">{{ worker()?.category }}</p>
                    </div>
                    <div class="text-right shrink-0">
                      <p class="text-2xl font-black text-slate-900">KSh {{ worker()?.rate }}</p>
                      <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">per hour</p>
                    </div>
                  </div>

                  <div class="flex items-center gap-4 mt-4">
                    @if ((worker()?.reviews ?? 0) > 0) {
                      <div class="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                        <mat-icon class="!text-amber-500 !text-sm !w-4 !h-4" style="font-variation-settings: 'FILL' 1;">star</mat-icon>
                        <span class="text-[10px] font-black text-amber-700">{{ worker()?.rating?.toFixed(1) }}</span>
                        <span class="text-[9px] text-amber-600">({{ worker()?.reviews }})</span>
                      </div>
                    }
                    @if (worker()?.location) {
                      <div class="flex items-center gap-1 text-slate-400">
                        <mat-icon class="!text-sm !w-4 !h-4">location_on</mat-icon>
                        <span class="text-[10px] font-medium">{{ worker()?.location }}</span>
                      </div>
                    }
                    @if ((worker()?.experienceYears ?? 0) > 0) {
                      <div class="flex items-center gap-1 text-slate-400">
                        <mat-icon class="!text-sm !w-4 !h-4">work</mat-icon>
                        <span class="text-[10px] font-medium">{{ worker()?.experienceYears }}yr exp</span>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>

            <!-- Bio -->
            @if (worker()?.bio) {
              <div class="px-8 py-6 border-b border-slate-50">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">About</p>
                <p class="text-sm text-slate-600 font-medium leading-relaxed">{{ worker()?.bio }}</p>
              </div>
            }

            <!-- Skills -->
            @if ((worker()?.skills?.length ?? 0) > 0) {
              <div class="px-8 py-6 border-b border-slate-50">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Skills</p>
                <div class="flex flex-wrap gap-2">
                  @for (skill of worker()?.skills; track skill) {
                    <span class="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                      {{ skill }}
                    </span>
                  }
                </div>
              </div>
            }

            <!-- Job Description Input -->
            <div class="px-8 py-6 border-b border-slate-50">
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Describe Your Job (Optional)</p>
              <textarea
                [(ngModel)]="jobDescription"
                placeholder="e.g. Fix leaking kitchen pipe, install 3 ceiling lights, paint 2 rooms..."
                rows="3"
                class="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-700
                       placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-teal/30
                       focus:border-brand-teal transition-all resize-none">
              </textarea>
            </div>

            <!-- Job Price Input -->
            <div class="px-8 py-6">
              <div class="flex items-center justify-between mb-3">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Offer (Optional)</p>
                <p class="text-[10px] text-slate-500">Suggested: KSh {{ worker()?.rate }}/hr</p>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-lg font-black text-slate-600">KSh</span>
                <input 
                  type="number"
                  [(ngModel)]="jobPrice"
                  placeholder="Enter offer amount or leave blank for hourly rate"
                  class="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-700
                         placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-teal/30
                         focus:border-brand-teal transition-all"
                  min="0"
                  step="0.01"
                >
              </div>
              <p class="text-[9px] text-slate-400 mt-2">Worker can see this offer and accept, reject, or negotiate.</p>
            </div>
          </div>

          <!-- Escrow Education Banner -->
          <div class="bg-slate-900 rounded-2xl p-6 mb-6 flex items-start gap-4">
            <div class="w-10 h-10 bg-brand-teal/20 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
              <mat-icon class="text-brand-teal !text-xl">lock</mat-icon>
            </div>
            <div>
              <p class="text-white font-black text-sm mb-1">Your Payment is Protected</p>
              <p class="text-slate-400 text-xs leading-relaxed font-medium">
                After hiring, you'll fund an escrow account before work begins. Your money is held safely and only released to
                the worker once you approve the completed work. You can request revisions or a refund if needed.
              </p>
            </div>
          </div>

          <!-- Error Message -->
          @if (errorMsg()) {
            <div class="mb-4 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3">
              <mat-icon class="text-rose-500 !text-xl shrink-0">error_outline</mat-icon>
              <p class="text-rose-700 text-sm font-medium">{{ errorMsg() }}</p>
            </div>
          }

          <!-- Action Buttons -->
          <div class="flex gap-4">
            <button (click)="goBack()"
                    class="flex-1 py-4 rounded-2xl border border-slate-200 text-slate-400 font-black
                           text-[10px] uppercase tracking-widest hover:text-slate-600 hover:border-slate-300 transition-colors">
              Cancel
            </button>
            <button (click)="hire()"
                    [disabled]="loading()"
                    class="flex-[2] bg-brand-teal text-white py-4 rounded-2xl font-black text-[10px]
                           uppercase tracking-widest hover:opacity-90 disabled:opacity-40 disabled:cursor-wait
                           transition-all active:scale-95 shadow-lg shadow-brand-teal/20 flex items-center justify-center gap-2">
              @if (loading()) {
                <mat-icon class="animate-spin !text-base">sync</mat-icon>
                Sending Request...
              } @else {
                <mat-icon class="!text-base">handshake</mat-icon>
                Hire {{ workerFirstName() }}
              }
            </button>
          </div>

          <p class="text-center text-[9px] text-slate-400 font-medium mt-4 uppercase tracking-widest">
            No charges yet. You'll fund escrow on the next step.
          </p>

        </div>
      }
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class NegotiationPage implements OnInit {
  private route        = inject(ActivatedRoute);
  private router       = inject(Router);
  private state        = inject(PlatformStateService);
  private notification = inject(NotificationService);
  private auth         = inject(AuthService);

  worker       = signal<WorkerProfile | null>(null);
  loading      = signal(false);
  errorMsg     = signal('');
  jobDescription = '';
  jobPrice: number | null = null;

  // FIX: Computed property for worker's first name
  workerFirstName = computed(() => {
    const w = this.worker();
    if (!w?.name) return 'Worker';
    return w.name.split(' ')[0];
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const found = this.state.workers().find((w: WorkerProfile) => w.id === id);
      if (found) {
        this.worker.set(found);
      } else {
        this.router.navigate(['/client/marketplace']);
      }
    } else {
      this.router.navigate(['/client/marketplace']);
    }
  }

  hire() {
    const w = this.worker();
    if (!w) return;

    const user = this.auth.currentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    // Check for duplicate active booking (case-insensitive)
    const alreadyActive = this.state.bookings().some((b: any) =>
      b.workerId === w.id && 
      ['pending', 'accepted', 'in progress'].includes(b.status.toLowerCase())
    );

    if (alreadyActive) {
      this.errorMsg.set(`You already have an active job with ${w.name}. Check My Bookings.`);
      return;
    }

    this.loading.set(true);
    this.errorMsg.set('');

    this.state.hireWorker(w.id, this.jobDescription || undefined, this.jobPrice || undefined).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/client/bookings'], {
          queryParams: { highlight: 'new' }
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err.error?.message || err.error || 'Failed to send hire request.');
      }
    });
  }

  decline() {
    this.goBack();
  }

  goBack() {
    this.router.navigate(['/client/marketplace']);
  }
}