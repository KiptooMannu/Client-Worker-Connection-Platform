import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

export interface JobOffer {
  id: string;
  clientName: string;
  service: string;
  budget: number;
}

@Component({
  selector: 'app-job-offer-banner',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="bg-gradient-to-r from-brand-teal to-teal-600 border-b-2 border-teal-700 shadow-lg animate-in slide-in-from-top duration-500">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-4">
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-4 flex-1">
            <div class="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <mat-icon class="!text-2xl !w-auto !h-auto text-white">work</mat-icon>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h3 class="text-lg font-black text-white uppercase tracking-wider">📢 New Job Offer</h3>
                <span class="px-2 py-0.5 bg-white/20 rounded-full text-[10px] font-black text-white">
                  {{ jobOffer().service }}
                </span>
              </div>
              <p class="text-sm text-white/90 font-medium">
                <span class="font-black">{{ jobOffer().clientName }}</span> • Budget: KES {{ jobOffer().budget.toLocaleString() }}
              </p>
            </div>
          </div>
          
          <div class="flex items-center gap-3 shrink-0">
            <button (click)="dismiss.emit()"
                    class="text-white/80 hover:text-white transition-colors p-2">
              <mat-icon class="!text-xl !w-auto !h-auto">close</mat-icon>
            </button>
            <button (click)="viewOffer()"
                    class="bg-white text-brand-teal px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/90 transition-all shadow-md active:scale-95 flex items-center gap-2">
              <mat-icon class="!text-sm !w-auto !h-auto">visibility</mat-icon>
              View Offer
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class JobOfferBanner {
  jobOffer = input.required<JobOffer>();
  dismiss = output<void>();
  
  // Computed property for formatted budget (optional but cleaner)
  formattedBudget = computed(() => {
    return this.jobOffer().budget.toLocaleString();
  });
  
  constructor(private router: Router) {}

  viewOffer() {
    this.router.navigate(['/worker/history']);
  }
}