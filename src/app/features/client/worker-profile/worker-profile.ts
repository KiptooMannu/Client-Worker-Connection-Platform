import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { PlatformStateService } from '../../../core/services/platform-state.service';

@Component({
  selector: 'app-client-worker-profile',
  standalone: true,
  imports: [
    CommonModule, 
    MatCardModule, 
    MatButtonModule, 
    MatIconModule, 
    MatChipsModule,
    MatProgressBarModule,
    MatDividerModule,
    RouterLink
  ],
  template: `
    <div class="space-y-8 animate-in fade-in duration-700">
      <!-- Breadcrumbs -->
      <nav class="flex items-center gap-2 text-slate-500 font-black text-[10px] uppercase tracking-widest">
        <a routerLink="/client" class="hover:text-blue-600 transition-colors">Marketplace</a>
        <mat-icon class="!text-xs">chevron_right</mat-icon>
        <span class="text-slate-900">{{ worker()?.name }}</span>
      </nav>

      <div class="grid grid-cols-12 gap-8">
        <!-- Main Identity Section -->
        <div class="col-span-12 lg:col-span-8 space-y-8">
          <mat-card class="!rounded-[2.5rem] !border !border-slate-100 !shadow-sm !p-10 relative overflow-hidden">
            <div class="absolute top-10 right-10">
              <span class="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                <mat-icon class="!text-sm !w-auto !h-auto" style="font-variation-settings: 'FILL' 1;">verified</mat-icon>
                Top Rated Plus
              </span>
            </div>

            <div class="flex flex-col md:flex-row gap-10 items-center md:items-start text-center md:text-left">
              <div class="shrink-0 relative">
                <div class="w-40 h-40 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white ring-1 ring-slate-100 flex items-center justify-center bg-blue-50 text-blue-700 font-black text-4xl uppercase">
                  @if (worker()?.image) {
                    <img [src]="worker()?.image" class="w-full h-full object-cover">
                  } @else {
                    {{ worker()?.initials }}
                  }
                </div>
              </div>

              <div class="flex-1 space-y-6">
                <div>
                  <h1 class="text-4xl font-black text-slate-900 tracking-tighter">{{ worker()?.name }}</h1>
                  <p class="text-blue-600 font-black text-lg mt-1">{{ worker()?.category }}</p>
                </div>

                <div class="flex flex-wrap justify-center md:justify-start gap-6 text-slate-500 font-bold text-xs">
                  <div class="flex items-center gap-2">
                    <mat-icon class="!text-slate-400 !text-lg">location_on</mat-icon> London, UK
                  </div>
                  <div class="flex items-center gap-2">
                    <mat-icon class="!text-slate-400 !text-lg">schedule</mat-icon> 9:45 AM local
                  </div>
                  <div class="flex items-center gap-2">
                    <mat-icon class="!text-slate-400 !text-lg">language</mat-icon> English, German
                  </div>
                </div>

                <mat-divider class="!border-slate-50"></mat-divider>

                <div class="grid grid-cols-3 gap-8">
                  <div>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Hourly Rate</p>
                    <p class="text-2xl font-black text-blue-600 tracking-tighter">\${{ worker()?.rate }}</p>
                  </div>
                  <div>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Reviews</p>
                    <p class="text-2xl font-black text-slate-900 tracking-tighter">{{ worker()?.reviews }}</p>
                  </div>
                  <div>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Success Rate</p>
                    <p class="text-2xl font-black text-slate-900 tracking-tighter">99%</p>
                  </div>
                </div>
              </div>
            </div>
          </mat-card>

          <!-- Bio Section -->
          <mat-card class="!rounded-[2.5rem] !border !border-slate-100 !shadow-sm !p-10">
            <h3 class="text-2xl font-black text-slate-900 tracking-tight mb-8">Professional Dossier</h3>
            <div class="text-slate-600 font-medium text-lg leading-relaxed space-y-6">
              <p>{{ worker()?.bio }}</p>
              <div class="flex flex-wrap gap-3 pt-4">
                @for (skill of worker()?.skills; track skill) {
                  <span class="px-5 py-2.5 bg-slate-50 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-tight border border-slate-100 flex items-center gap-2">
                    {{ skill }}
                    <mat-icon class="!text-blue-600 !text-[16px] !w-auto !h-auto" style="font-variation-settings: 'FILL' 1;">verified</mat-icon>
                  </span>
                }
              </div>
            </div>
          </mat-card>

          <!-- Work History -->
          <mat-card class="!rounded-[2.5rem] !border !border-slate-100 !shadow-sm !p-10">
            <div class="flex justify-between items-center mb-10">
              <h3 class="text-2xl font-black text-slate-900 tracking-tight">Work History</h3>
              <div class="flex gap-2">
                <button mat-flat-button color="primary" class="!px-6 !py-1 !rounded-full !text-[10px] !font-black !uppercase !tracking-widest">Newest First</button>
              </div>
            </div>

            <div class="space-y-10">
              @for (job of history; track job.title) {
                <div class="group cursor-pointer">
                  <div class="flex justify-between mb-2">
                    <h4 class="text-lg font-black text-blue-600 group-hover:underline transition-all">{{ job.title }}</h4>
                    <span class="text-sm font-black text-slate-900">{{ job.earned }}</span>
                  </div>
                  <div class="flex items-center gap-1 mb-4">
                    @for (s of [1,2,3,4,5]; track s) {
                      <mat-icon class="!text-amber-500 !text-lg !w-auto !h-auto" style="font-variation-settings: 'FILL' 1;">star</mat-icon>
                    }
                    <span class="ml-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{{ job.date }}</span>
                  </div>
                  <p class="text-slate-600 font-medium italic text-lg leading-relaxed mb-4">"{{ job.feedback }}"</p>
                  <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">— {{ job.client }}</p>
                  @if (!$last) { <mat-divider class="!mt-10 !border-slate-50"></mat-divider> }
                </div>
              }
            </div>
            <button mat-stroked-button class="w-full !mt-12 !py-8 !rounded-2xl !border-slate-200 !text-blue-700 !font-black !text-[10px] !uppercase !tracking-widest">
              View all 138 reviews
            </button>
          </mat-card>
        </div>

        <!-- Sidebar / Actions -->
        <div class="col-span-12 lg:col-span-4 space-y-8">
          <!-- Action Card -->
          <mat-card class="!rounded-[2.5rem] !bg-blue-600 !text-white !shadow-2xl shadow-blue-900/30 !border-none !p-10 sticky top-10">
            <h3 class="text-3xl font-black mb-4 tracking-tight">Hire {{ worker()?.name?.split(' ')?.[0] || 'Professional' }}</h3>
            <p class="text-blue-100 font-medium mb-10 text-lg">Available for new projects starting next week. Book a consultation now.</p>
            
            <div class="space-y-4">
              <button mat-flat-button class="w-full !bg-white !text-blue-700 !py-8 !rounded-2xl !font-black !text-sm !shadow-xl" (click)="hire()">
                Hire Professional
              </button>
              <button mat-stroked-button class="w-full !border-white/30 !text-white !py-8 !rounded-2xl !font-black !text-sm" (click)="message()">
                Message {{ worker()?.name?.split(' ')?.[0] || 'Professional' }}
              </button>
            </div>
            <div class="mt-8 pt-8 border-t border-white/10">
              <button mat-button class="w-full !text-white/70 !font-black !text-[10px] !uppercase !tracking-widest hover:!text-white">
                <mat-icon class="!text-sm !mr-2">favorite</mat-icon> Save to Shortlist
              </button>
            </div>
          </mat-card>

          <!-- Performance Metrics -->
          <mat-card class="!rounded-[2.5rem] !border !border-slate-100 !shadow-sm !p-10">
            <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10">Platform Performance</h3>
            <div class="space-y-8">
              @for (m of metrics; track m.label) {
                <div>
                  <div class="flex justify-between mb-3 text-[10px] font-black uppercase tracking-widest">
                    <span class="text-slate-400">{{ m.label }}</span>
                    <span class="text-slate-900">{{ m.value }}%</span>
                  </div>
                  <mat-progress-bar mode="determinate" [value]="m.value" class="!h-2 rounded-full"></mat-progress-bar>
                </div>
              }
            </div>
          </mat-card>

          <!-- Certifications -->
          <mat-card class="!rounded-[2.5rem] !border !border-slate-100 !shadow-sm !p-10">
            <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10">Certifications</h3>
            <div class="space-y-8">
              @for (c of certs; track c.name) {
                <div class="flex gap-4 items-center">
                  <div class="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                    <mat-icon class="!text-blue-600">{{ c.icon }}</mat-icon>
                  </div>
                  <div>
                    <p class="text-sm font-black text-slate-900">{{ c.name }}</p>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{{ c.issuer }} • {{ c.year }}</p>
                  </div>
                </div>
              }
            </div>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
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

  metrics = [
    { label: 'Job Success', value: 99 },
    { label: 'Client Recommendation', value: 100 },
    { label: 'On-Time Delivery', value: 96 }
  ];

  certs = [
    { name: 'AWS Solutions Architect', issuer: 'Professional', year: '2023', icon: 'cloud' },
    { name: 'Google Cloud Engineer', issuer: 'Professional', year: '2022', icon: 'storage' },
    { name: 'CKA: Kubernetes Admin', issuer: 'CNCF', year: '2021', icon: 'architecture' }
  ];

  history = [
    { 
      title: 'Scalable Infrastructure for Neo-Bank Platform', 
      earned: '$14,500.00', 
      date: 'May 2023 - Oct 2023', 
      feedback: 'Alexander is a top-tier professional. He re-architected our entire Kubernetes cluster and reduced our AWS bill by 35% while improving stability.', 
      client: 'Marcus Thorne, CTO at FinFlow' 
    },
    { 
      title: 'CI/CD Pipeline Security Audit', 
      earned: '$3,200.00', 
      date: 'Mar 2023 - Apr 2023', 
      feedback: 'Prompt communication and deep technical expertise. Highly recommended for any complex devops task.', 
      client: 'Sarah Chen, Dev Manager' 
    }
  ];

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
