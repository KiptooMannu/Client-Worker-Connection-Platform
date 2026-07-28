import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NotificationService } from '../../../core/services/notification.service';
import { RouterLink, Router } from '@angular/router';
import { PlatformStateService } from '../../../core/services/platform-state.service';
import { AuthService } from '../../../core/services/auth.service';
import { AnalyticsService, WorkerEarningsData } from '../../../shared/services/analytics.service';
import { LineChartComponent, BarChartComponent } from '../../../shared/components/charts';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-worker-dashboard-overview',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressBarModule,
    RouterLink,
    FormsModule,
    LineChartComponent,
    BarChartComponent
  ],
  template: `
    @if (worker().status === 'loading' || !worker().id) {
      <!-- Skeleton mirrors the real layout below so the dashboard never flashes an
           empty shell or a bare centred spinner while the profile resolves. -->
      <div class="space-y-8 font-manrope" aria-busy="true" aria-live="polite">
        <span class="sr-only">Loading your dashboard</span>

        <!-- Hero placeholder -->
        <section>
          <div class="rounded-[1.5rem] bg-brand-teal/10 p-6 md:p-8 min-h-[260px] flex flex-col justify-between animate-pulse">
            <div class="space-y-4">
              <div class="h-6 w-32 rounded-full bg-brand-teal/20"></div>
              <div class="h-10 w-3/4 max-w-lg rounded-xl bg-brand-teal/20"></div>
              <div class="h-4 w-1/2 max-w-md rounded-lg bg-brand-teal/15"></div>
            </div>
            <div class="flex flex-wrap gap-12 mt-8">
              @for (stat of skeletonRows(2); track $index) {
                <div class="space-y-2">
                  <div class="h-3 w-24 rounded bg-brand-teal/15"></div>
                  <div class="h-8 w-16 rounded-lg bg-brand-teal/20"></div>
                </div>
              }
            </div>
          </div>
        </section>

        <div class="flex flex-col lg:flex-row gap-10 items-start">
          <!-- Job request rows placeholder -->
          <div class="flex-1 w-full space-y-10 min-w-0">
            <section>
              <div class="flex justify-between items-center mb-6 px-4 animate-pulse">
                <div class="h-6 w-52 rounded-lg bg-brand-teal/20"></div>
                <div class="h-6 w-20 rounded-full bg-brand-teal/15"></div>
              </div>
              <div class="space-y-1">
                @for (row of skeletonRows(4); track $index) {
                  <div class="flex items-center justify-between p-4 bg-surface border-b border-outline-variant/30 animate-pulse">
                    <div class="flex items-center gap-4 min-w-0">
                      <div class="w-12 h-12 rounded-full bg-brand-teal/15 shrink-0"></div>
                      <div class="space-y-2 min-w-0">
                        <div class="h-4 w-40 rounded bg-brand-teal/20"></div>
                        <div class="h-3 w-24 rounded bg-brand-teal/10"></div>
                      </div>
                    </div>
                    <div class="hidden sm:flex items-center gap-3 shrink-0">
                      <div class="h-8 w-20 rounded-lg bg-brand-teal/15"></div>
                      <div class="h-8 w-20 rounded-lg bg-brand-teal/10"></div>
                    </div>
                  </div>
                }
              </div>
            </section>

            <!-- Chart placeholders -->
            <section class="grid grid-cols-1 xl:grid-cols-2 gap-6">
              @for (chart of skeletonRows(2); track $index) {
                <div class="rounded-2xl border border-outline-variant/30 p-5 space-y-4 animate-pulse">
                  <div class="h-4 w-36 rounded bg-brand-teal/20"></div>
                  <div class="h-[200px] rounded-xl bg-brand-teal/10"></div>
                </div>
              }
            </section>
          </div>

          <!-- Side column placeholder -->
          <aside class="w-full lg:w-80 shrink-0 space-y-6">
            @for (card of skeletonRows(3); track $index) {
              <div class="rounded-2xl border border-outline-variant/30 p-5 space-y-3 animate-pulse">
                <div class="h-3 w-28 rounded bg-brand-teal/15"></div>
                <div class="h-8 w-24 rounded-lg bg-brand-teal/20"></div>
                <div class="h-3 w-full rounded bg-brand-teal/10"></div>
              </div>
            }
          </aside>
        </div>
      </div>
    } @else {
      <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 font-manrope">

      <!-- Status Hero Section -->
      <section>
        <div class="relative overflow-hidden rounded-[1.5rem] bg-brand-teal p-6 md:p-8 min-h-[260px] flex flex-col justify-between group shadow-xl shadow-brand-teal/10">
          
          <div class="relative z-10">
            <div class="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full mb-6 border border-white/10">
              <span class="w-2 h-2 rounded-full bg-white animate-pulse"></span>
              <span class="font-label-sm text-[10px] text-white uppercase tracking-[0.2em] font-black">System Live</span>
            </div>
            
            <div class="max-w-2xl">
              <h1 class="text-3xl md:text-4xl font-black text-white mb-2 tracking-tighter leading-none">{{ statusTitle() }}</h1>
              <p class="text-sm md:text-base text-white/70 max-w-xl leading-relaxed">{{ statusDesc() }}</p>
            </div>
          </div>

          <div class="relative z-10 flex flex-wrap gap-12 mt-8 items-end">
            <div class="space-y-1">
              <p class="text-[9px] uppercase tracking-[0.2em] text-white/40 font-black">Profile Status</p>
              <div class="flex items-baseline gap-2">
                <span class="text-3xl font-black text-white">{{ state.currentWorkerCompletion() }}%</span>
                <span class="text-[10px] text-white/80 font-bold uppercase tracking-widest">Complete</span>
              </div>
            </div>
            <div class="space-y-1">
              <p class="text-[9px] uppercase tracking-[0.2em] text-white/40 font-black">New Requests</p>
              <p class="text-3xl font-black text-white">{{ pendingRequests().length }}</p>
            </div>
            
            <div class="ml-auto hidden md:block">
              <button routerLink="../verification" class="px-8 py-4 bg-white text-brand-teal rounded-xl font-black text-sm hover:scale-105 transition-all active:scale-95 shadow-xl shadow-black/20">
                Check Documents
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Dashboard Layout Grid -->
      <div class="flex flex-col lg:flex-row gap-10 items-start">
        
        <!-- Main Operations Column -->
        <div class="flex-1 w-full space-y-10 min-w-0">
          
          <!-- Hire Requests Ledger -->
          <section>
            <div class="flex justify-between items-center mb-6 px-4">
              <div class="flex items-center gap-3">
                <div class="w-1.5 h-6 bg-brand-teal rounded-full"></div>
                <h2 class="text-xl font-black tracking-tight text-brand-teal uppercase">New Job Requests</h2>
              </div>
              <span class="font-label-sm text-[10px] font-black text-brand-teal bg-brand-teal/10 px-3 py-1.5 rounded-full tracking-widest">{{ pendingRequests().length }} NEW</span>
            </div>
            
            <div class="space-y-1">
              @for (req of paginatedPendingRequests(); track req.id) {
                <div class="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-surface hover:bg-surface-container-low transition-all border-b border-outline-variant/30 group">
                  <div class="flex items-center gap-4 mb-4 sm:mb-0 min-w-0">
                    <div class="w-12 h-12 rounded-full bg-brand-teal/10 flex items-center justify-center text-brand-teal font-black text-sm shrink-0">
                      {{ req.clientName[0] }}
                    </div>
                    <div class="min-w-0">
                      <h3 class="font-bold text-sm text-brand-teal truncate">{{ req.service }}</h3>
                      <p class="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider truncate">{{ req.clientName }}</p>
                    </div>
                  </div>
                  
                  <div class="flex items-center gap-6 shrink-0">
                    <div class="text-right hidden md:block">
                      <p class="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold leading-none mb-1">Fee</p>
                      <p class="font-black text-sm text-brand-teal">KSh {{ req.earnings }}</p>
                    </div>
                    <div class="flex gap-2">
                      <button (click)="state.acceptBooking(req.id)" class="px-5 py-2 bg-brand-teal text-white font-black text-[10px] uppercase tracking-widest rounded-lg hover:opacity-90 transition-all shadow-sm">Accept</button>
                      <button (click)="state.deleteJobRequest(req.id)" class="px-4 py-2 border border-outline-variant text-on-surface-variant font-black text-[10px] uppercase tracking-widest rounded-lg hover:bg-error/10 hover:text-error hover:border-error/20 transition-all">Decline</button>
                    </div>
                  </div>
                </div>
              }

              @if (totalPages() > 1) {
                <div class="p-4 flex items-center justify-between bg-surface-container-low/30 rounded-b-xl border-t border-outline-variant/10">
                  <span class="text-[9px] font-black text-on-surface-variant/60 uppercase tracking-widest">
                    Page {{ requestPage() }} of {{ totalPages() }}
                  </span>
                  <div class="flex gap-2">
                    <button (click)="goToRequestPage(requestPage() - 1)" [disabled]="requestPage() === 1" class="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant disabled:opacity-30 hover:bg-brand-teal hover:text-white transition-all">
                      <mat-icon class="!text-sm flex items-center justify-center">chevron_left</mat-icon>
                    </button>
                    <button (click)="goToRequestPage(requestPage() + 1)" [disabled]="requestPage() === totalPages()" class="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant disabled:opacity-30 hover:bg-brand-teal hover:text-white transition-all">
                      <mat-icon class="!text-sm flex items-center justify-center">chevron_right</mat-icon>
                    </button>
                  </div>
                </div>
              }
              
              @if (pendingRequests().length === 0) {
                <div class="py-20 text-center bg-surface-container-low border border-dashed border-outline-variant rounded-[1.5rem]">
                  <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <mat-icon class="text-outline !text-3xl flex items-center justify-center">cloud_done</mat-icon>
                  </div>
                  <h3 class="font-black text-brand-teal mb-1 uppercase tracking-widest">No New Requests</h3>
                  <p class="text-[11px] text-on-surface-variant font-bold uppercase tracking-tighter">We'll notify you when new jobs arrive</p>
                </div>
              }
            </div>
          </section>

          <!-- Counter-Offers Received Section -->
          @if (counterOffersReceived().length > 0) {
            <section>
              <div class="flex items-center gap-3 mb-6 px-4">
                <div class="w-1.5 h-6 bg-amber-500 rounded-full"></div>
                <h2 class="text-xl font-black tracking-tight text-amber-600 uppercase">Client Offers</h2>
              </div>
              
              <div class="space-y-1">
                @for (job of counterOffersReceived(); track job.id) {
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-amber-50 hover:bg-amber-100 transition-all border-b border-amber-200 group">
                    <div class="flex items-center gap-4 mb-4 sm:mb-0 min-w-0">
                      <div class="w-12 h-12 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 font-black text-sm shrink-0">
                        {{ job.clientName[0] }}
                      </div>
                      <div class="min-w-0">
                        <h3 class="font-bold text-sm text-amber-700 truncate">{{ job.service }}</h3>
                        <p class="text-[10px] text-amber-600 font-bold uppercase tracking-wider truncate">{{ job.clientName }}</p>
                      </div>
                    </div>
                    
                    <div class="flex items-center gap-6 shrink-0">
                      <div class="text-right hidden md:block">
                        <p class="text-[10px] uppercase tracking-widest text-amber-600 font-bold leading-none mb-1">Client Offer</p>
                        <p class="font-black text-sm text-amber-700">KSh {{ job.negotiatedPrice }}</p>
                      </div>
                      <div class="flex gap-2">
                        <button (click)="acceptClientOffer(job.id)"
                                class="px-3 py-2 bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest rounded-lg hover:opacity-90 transition-all shadow-sm">
                          Accept
                        </button>
                        <button (click)="openCounterOfferModal(job)"
                                class="px-3 py-2 bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest rounded-lg hover:opacity-90 transition-all shadow-sm">
                          Counter
                        </button>
                        <button (click)="rejectClientOffer(job.id)"
                                class="px-3 py-2 border border-rose-200 text-rose-600 font-black text-[10px] uppercase tracking-widest rounded-lg hover:bg-rose-50 transition-all">
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </section>
          }

          <!-- Counter-Offers Submitted Section -->
          @if (counterOffersSubmitted().length > 0) {
            <section>
              <div class="flex items-center gap-3 mb-6 px-4">
                <div class="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                <h2 class="text-xl font-black tracking-tight text-blue-600 uppercase">Your Counter-Offers</h2>
              </div>
              
              <div class="space-y-1">
                @for (job of counterOffersSubmitted(); track job.id) {
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 transition-all border-b border-blue-200 group">
                    <div class="flex items-center gap-4 mb-4 sm:mb-0 min-w-0">
                      <div class="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-black text-sm shrink-0">
                        {{ job.clientName[0] }}
                      </div>
                      <div class="min-w-0">
                        <h3 class="font-bold text-sm text-blue-700 truncate">{{ job.service }}</h3>
                        <p class="text-[10px] text-blue-600 font-bold uppercase tracking-wider truncate">{{ job.clientName }}</p>
                      </div>
                    </div>
                    
                    <div class="flex items-center gap-6 shrink-0">
                      <div class="text-right hidden md:block">
                        <p class="text-[10px] uppercase tracking-widest text-blue-600 font-bold leading-none mb-1">Your Offer</p>
                        <p class="font-black text-sm text-blue-700">KSh&nbsp;{{ job.negotiatedPrice }}</p>
                      </div>
                      <div class="flex gap-2">
                        <button (click)="navigateToMessages(job.clientId)"
                                title="Discuss with client"
                                class="px-3 py-2 bg-blue-500 text-white font-black text-[10px] uppercase tracking-widest rounded-lg hover:opacity-90 transition-all shadow-sm">
                          Discuss
                        </button>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </section>
          }

          <!-- Counter-Offer Modal -->
          @if (counterOfferModal()) {
            <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
                <div class="p-6 border-b border-slate-100">
                  <div class="flex items-center justify-between">
                    <h3 class="text-lg font-black text-slate-900">💰 Counter Client's Offer</h3>
                    <button (click)="closeCounterOfferModal()" class="text-slate-400 hover:text-slate-600">
                      <mat-icon class="!text-xl !w-auto !h-auto">close</mat-icon>
                    </button>
                  </div>
                  <p class="text-sm text-slate-500 mt-2">
                    Client's offer: KES {{ counterOfferModal()?.earnings?.toLocaleString() }}
                  </p>
                </div>
                <div class="p-6">
                  <label class="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-2">
                    Your Counter Price
                  </label>
                  <input
                    type="number"
                    [(ngModel)]="counterOfferPrice"
                    placeholder="Enter your price"
                    class="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-900 outline-none focus:border-indigo-600 focus:bg-white transition-all"
                  >
                  <p class="text-[10px] text-slate-400 mt-2">
                    Enter the price you'd like to counter with.
                  </p>
                </div>
                <div class="p-6 border-t border-slate-100 flex gap-3">
                  <button
                    (click)="closeCounterOfferModal()"
                    class="flex-1 py-3 border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    (click)="submitCounterOffer()"
                    [disabled]="counterOfferLoading() || !counterOfferPrice() || counterOfferPrice()! <= 0"
                    class="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    <mat-icon class="!text-sm !w-auto !h-auto" [class.animate-spin]="counterOfferLoading()">
                      {{ counterOfferLoading() ? 'sync' : 'send' }}
                    </mat-icon>
                    {{ counterOfferLoading() ? 'Submitting...' : 'Submit Counter' }}
                  </button>
                </div>
              </div>
            </div>
          }

          <!-- Earnings Analytics -->
          <section>
            <div class="flex items-center gap-3 mb-6 px-4">
              <div class="w-1.5 h-6 bg-brand-teal rounded-full"></div>
              <h2 class="text-xl font-black tracking-tight text-brand-teal uppercase">Earnings Analytics</h2>
            </div>

            <div class="space-y-4">
              <mat-card class="!rounded-2xl !border !border-slate-100 !p-5 bg-white shadow-sm">
                <div class="flex items-center gap-2 mb-4">
                  <mat-icon class="!text-sm text-brand-teal">account_balance_wallet</mat-icon>
                  <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Earnings Trends</span>
                </div>
                @if (loading()) {
                  <div class="h-[200px] flex items-center justify-center">
                    <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest">Loading...</p>
                  </div>
                } @else if (earningsData().length > 0) {
                  <app-line-chart [data]="earningsData()" [xAxisLabel]="'Period'" [yAxisLabel]="'Amount (KES)'" [legend]="true" [legendTitle]="'Metrics'"></app-line-chart>
                } @else {
                  <div class="h-[200px] flex items-center justify-center">
                    <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest">No earnings data</p>
                  </div>
                }
              </mat-card>

              <mat-card class="!rounded-2xl !border !border-slate-100 !p-5 bg-white shadow-sm overflow-hidden">
                <div class="flex items-center gap-2 mb-4">
                  <mat-icon class="!text-sm text-brand-teal">bar_chart</mat-icon>
                  <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Earnings by Period</span>
                </div>
                @if (loading()) {
                  <div class="h-[200px] flex items-center justify-center">
                    <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest">Loading...</p>
                  </div>
                } @else if (earningsByPeriod.length > 0) {
                  <app-bar-chart [data]="earningsByPeriod" [xAxisLabel]="'Period'" [yAxisLabel]="'Amount (KES)'" [legend]="false"></app-bar-chart>
                } @else {
                  <div class="h-[200px] flex items-center justify-center">
                    <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest">No period data</p>
                  </div>
                }
              </mat-card>
            </div>
          </section>

          <!-- System Controls Ledger -->
          <section>
             <div class="flex items-center gap-3 mb-6 px-4">
                <div class="w-1.5 h-6 bg-brand-teal rounded-full"></div>
                <h2 class="text-xl font-black tracking-tight text-brand-teal uppercase">Quick Links</h2>
              </div>
            <div class="space-y-1">
              <div routerLink="../profile" class="flex items-center justify-between p-4 bg-surface hover:bg-surface-container-low transition-all border-b border-outline-variant/30 cursor-pointer group">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-brand-teal group-hover:bg-brand-teal group-hover:text-white transition-all shadow-sm">
                    <mat-icon class="!text-xl flex items-center justify-center">identity_platform</mat-icon>
                  </div>
                  <div>
                    <h3 class="font-black text-brand-teal text-xs uppercase tracking-widest">Edit Profile</h3>
                    <p class="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest opacity-60">Update your bio and skills</p>
                  </div>
                </div>
                <mat-icon class="text-outline group-hover:translate-x-1 transition-transform flex items-center justify-center">chevron_right</mat-icon>
              </div>

              <div routerLink="../verification" class="flex items-center justify-between p-4 bg-surface hover:bg-surface-container-low transition-all border-b border-outline-variant/30 cursor-pointer group">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-brand-teal group-hover:bg-brand-teal group-hover:text-white transition-all shadow-sm">
                    <mat-icon class="!text-xl flex items-center justify-center">verified_user</mat-icon>
                  </div>
                  <div>
                    <h3 class="font-black text-brand-teal text-xs uppercase tracking-widest">Documents</h3>
                    <p class="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest opacity-60">Upload ID and certificates</p>
                  </div>
                </div>
                <mat-icon class="text-outline group-hover:translate-x-1 transition-transform flex items-center justify-center">chevron_right</mat-icon>
              </div>
            </div>
          </section>
        </div>

        <!-- System Intelligence Column -->
        <div class="w-full lg:w-80 xl:w-96 space-y-10 shrink-0">
          <!-- Profile Completion Steps Card -->
          <section class="bg-white border border-outline-variant/60 rounded-xl p-6 shadow-sm">
            <h2 class="text-[10px] font-black text-brand-teal mb-6 uppercase tracking-[0.25em]">Profile Completion</h2>
            
            <div class="space-y-6 relative">
              <div class="absolute left-4 top-3 bottom-3 w-px bg-outline-variant/30"></div>
              
              @for (step of steps; track step.id; let i = $index) {
                <div class="flex gap-4 relative z-10 items-start">
                  <!-- Step Circle -->
                  <div class="w-6 h-6 rounded-full flex items-center justify-center transition-all shadow-sm shrink-0"
                       [ngClass]="getStepClass(i + 1)">
                      @if (isStepCompleted(i + 1)) {
                        <mat-icon class="!text-[12px] flex items-center justify-center font-black">check</mat-icon>
                      } @else {
                        <span class="text-[9px] font-black">{{ i + 1 }}</span>
                      }
                  </div>
                  
                  <!-- Step Label -->
                  <div class="min-w-0">
                    <h3 class="text-[10px] font-black uppercase tracking-tight" 
                        [ngClass]="isStepActive(i + 1) ? 'text-brand-teal' : (isStepCompleted(i + 1) ? 'text-brand-teal' : 'text-on-surface-variant')">
                      {{ step.label }}
                    </h3>
                    <p class="text-[9px] text-on-surface-variant font-bold uppercase tracking-widest opacity-60 truncate">
                      {{ step.desc }}
                    </p>
                  </div>
                </div>
              }
            </div>
            
            <!-- Submit Button - Shows only when profile is complete and not yet submitted -->
            @if (canSubmitForReview()) {
              <button (click)="submit()" 
                      class="w-full mt-8 py-3 bg-brand-teal text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-brand-teal/10 active:scale-95">
                Submit for Review
              </button>
            }
            
            <!-- Status Message -->
            @if (worker().status === 'PENDING' || worker().status === 'Pending') {
              <div class="mt-6 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div class="flex items-center gap-2">
                  <mat-icon class="text-amber-600 !text-sm">hourglass_empty</mat-icon>
                  <p class="text-[9px] font-black text-amber-800">Under Review (24-48 hours)</p>
                </div>
              </div>
            }
            
            @if (worker().status === 'REJECTED' || worker().status === 'Rejected') {
              <div class="mt-6 p-3 bg-red-50 rounded-lg border border-red-200">
                <div class="flex items-center gap-2">
                  <mat-icon class="text-red-600 !text-sm">error_outline</mat-icon>
                  <p class="text-[9px] font-black text-red-800">Review Failed - Please update documents</p>
                </div>
              </div>
            }
          </section>

          <!-- Dialogues Panel -->
          <section class="bg-surface border border-outline-variant/60 rounded-xl p-6 shadow-sm flex flex-col group">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-[10px] font-black text-brand-teal uppercase tracking-[0.25em]">Recent Chats</h3>
              @if (state.unreadMessagesCount() > 0) {
                <span class="bg-brand-teal text-white px-2 py-0.5 rounded-full text-[8px] font-black tracking-widest">{{ state.unreadMessagesCount() }} NEW</span>
              }
            </div>

            <div class="space-y-1 flex-1">
              @for (chat of state.chats().slice(0, 3); track chat.id) {
                <div class="flex items-center gap-3 p-3 hover:bg-surface-container-low rounded-lg transition-all cursor-pointer group/item" routerLink="../messages">
                  <img [src]="chat.image || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop'" 
                       class="w-10 h-10 rounded-lg object-cover shadow-sm group-hover/item:scale-105 transition-transform">
                  <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-baseline mb-0.5">
                      <p class="text-[10px] font-black text-brand-teal truncate uppercase tracking-tight">{{ chat.name }}</p>
                      <span class="text-[8px] text-on-surface-variant font-bold">{{ chat.time }}</span>
                    </div>
                    <p class="text-[9px] text-on-surface-variant font-bold truncate tracking-tight opacity-70">{{ chat.lastMessage }}</p>
                  </div>
                </div>
              }
              @if (state.chats().length === 0) {
                 <div class="py-6 text-center opacity-40">
                    <p class="text-[9px] font-black uppercase tracking-widest">No messages yet</p>
                 </div>
              }
            </div>

            <button routerLink="../messages" class="w-full mt-6 py-3 border border-brand-teal text-brand-teal rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-brand-teal hover:text-white transition-all">
              Open Messages
            </button>
          </section>
        </div>
      </div>
    </div>
    }
  `,
  styles: [`
    :host { display: block; }
    /* Fix icon alignment globally */
    mat-icon {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      vertical-align: middle !important;
      flex-shrink: 0 !important;
    }
    /* Ensure buttons with icons have proper spacing */
    button mat-icon {
      margin: 0 2px;
    }
  `]
})
export class WorkerDashboardOverviewPage implements OnInit {
  state = inject(PlatformStateService);

  /** Fixed-length placeholder list for the loading skeleton's @for blocks. */
  private readonly skeletonCache = new Map<number, number[]>();
  skeletonRows(count: number): number[] {
    // Cached so the array identity is stable across change detection and the
    // skeleton rows are not torn down and rebuilt on every tick.
    let rows = this.skeletonCache.get(count);
    if (!rows) {
      rows = Array.from({ length: count }, (_, i) => i);
      this.skeletonCache.set(count, rows);
    }
    return rows;
  }

  private notification = inject(NotificationService);
  private router = inject(Router);
  private auth = inject(AuthService);
  private analyticsService = inject(AnalyticsService);

  // Analytics data
  earningsData = signal<WorkerEarningsData[]>([]);
  loading = signal(true);

  worker = this.state.currentWorker;

  // Pagination for Job Requests
  requestPage = signal(1);
  itemsPerPage = signal(5);

  paginatedPendingRequests = computed(() => {
    const requests = this.pendingRequests();
    const start = (this.requestPage() - 1) * this.itemsPerPage();
    return requests.slice(start, start + this.itemsPerPage());
  });

  totalPages = computed(() => Math.ceil(this.pendingRequests().length / this.itemsPerPage()));

  goToRequestPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.requestPage.set(page);
    }
  }

  statusTitle = computed(() => {
    const s = this.worker().status;
    if (s === 'APPROVED' || s === 'Verified') return 'Ready for New Jobs';
    if (s === 'PENDING' || s === 'Pending') return 'Review in Progress';
    if (s === 'REJECTED' || s === 'Rejected') return 'Review Failed';
    return 'Complete Your Profile';
  });

  statusDesc = computed(() => {
    const s = this.worker().status;
    if (s === 'APPROVED' || s === 'Verified') {
      return 'Your profile is live! You can now accept job offers and message employers.';
    }
    if (s === 'PENDING' || s === 'Pending') {
      return "Our team is reviewing your documents. You'll be notified once approved (usually within 24 hours).";
    }
    if (s === 'REJECTED' || s === 'Rejected') {
      return 'Some documents need attention. Please check the requirements and resubmit.';
    }
    return 'Complete your profile and upload documents to start getting job offers.';
  });

  steps = [
    { id: 'profile', order: 1, label: 'Professional Profile', desc: 'Bio & Skills', icon: 'person' },
    { id: 'documents', order: 2, label: 'ID Verification', desc: 'Upload Credentials', icon: 'badge' },
    { id: 'review', order: 3, label: 'Admin Approval', desc: 'Trust Audit', icon: 'security' }
  ];

  // Step 1: Profile is complete when user has name, category, bio, and skills
  isProfileStepComplete = computed(() => {
    const w = this.worker();
    return !!(w.name && w.name.length > 2 && 
               w.category && 
               w.bio && w.bio.length > 20 &&
               w.skills && w.skills.length > 0);
  });

  // Step 2: Documents step is complete when user has uploaded ID front/back
  isDocumentsStepComplete = computed(() => {
    const docs = this.worker().uploadedDocuments || [];
    const hasIdFront = docs.some((d: any) => d.type === 'ID-Front');
    const hasIdBack = docs.some((d: any) => d.type === 'ID-Back');
    return hasIdFront && hasIdBack;
  });

  // Step 3: Review step is complete when status is approved/verified
  isReviewStepComplete = computed(() => {
    const s = this.worker().status;
    return s === 'APPROVED' || s === 'Verified';
  });

  // Check if a specific step is completed
  isStepCompleted = (stepNumber: number): boolean => {
    if (stepNumber === 1) return this.isProfileStepComplete();
    if (stepNumber === 2) return this.isDocumentsStepComplete();
    if (stepNumber === 3) return this.isReviewStepComplete();
    return false;
  };

  // Check if a step is the current active step
  isStepActive = (stepNumber: number): boolean => {
    if (stepNumber === 1 && !this.isProfileStepComplete()) return true;
    if (stepNumber === 2 && this.isProfileStepComplete() && !this.isDocumentsStepComplete()) return true;
    if (stepNumber === 3 && this.isProfileStepComplete() && this.isDocumentsStepComplete() && !this.isReviewStepComplete()) return true;
    return false;
  };

  // Get CSS class for step circle
  getStepClass = (stepNumber: number): string => {
    if (this.isStepCompleted(stepNumber)) {
      return 'bg-brand-teal text-white';
    }
    if (this.isStepActive(stepNumber)) {
      return 'bg-white border border-brand-teal text-brand-teal';
    }
    return 'bg-white border border-outline-variant text-outline';
  };

  // Current step number (1, 2, or 3)
  currentStepNumber = computed(() => {
    if (this.isReviewStepComplete()) return 3;
    if (this.isDocumentsStepComplete()) return 3; // Waiting for review
    if (this.isProfileStepComplete()) return 2; // Ready for documents
    return 1; // Need to complete profile
  });

  // Check if user can submit for review
  canSubmitForReview = computed(() => {
    const status = this.worker().status;
    const isNotSubmitted = status !== 'PENDING' && status !== 'Pending' && status !== 'APPROVED' && status !== 'Verified';
    return this.isProfileStepComplete() && this.isDocumentsStepComplete() && isNotSubmitted;
  });

  pendingRequests = computed(() => {
    return this.state.workerBookings().filter(b => b.status === 'Pending');
  });

  // Counter-offers submitted by this worker (jobs where they set a negotiatedPrice)
  counterOffersSubmitted = computed(() => {
    return this.state.workerBookings().filter(b => 
      b.negotiatedPrice && b.negotiatedPrice > 0 && b.status === 'Pending'
    );
  });

  // Counter-offers received from clients (jobs where client has countered the worker's offer)
  counterOffersReceived = computed(() => {
    return this.state.workerBookings().filter(b => 
      b.negotiatedPrice && b.negotiatedPrice > 0 && b.status === 'Pending' && b.clientCounterOffer
    );
  });

  // Counter-offer modal state
  counterOfferModal = signal<any>(null);
  counterOfferPrice = signal<number | null>(null);
  counterOfferLoading = signal(false);

  completionPercentage = computed(() => {
    let score = 0;
    if (this.isProfileStepComplete()) score += 33;
    if (this.isDocumentsStepComplete()) score += 34;
    if (this.isReviewStepComplete()) score += 33;
    return score;
  });

  submit() {
    if (!this.isProfileStepComplete()) {
      this.notification.error('❌ Please complete your profile first (name, category, bio, skills).');
      return;
    }

    if (!this.isDocumentsStepComplete()) {
      this.notification.error('❌ Please upload both sides of your ID and your certificates.');
      return;
    }

    const status = this.worker().status;
    if (status === 'PENDING' || status === 'Pending') {
     this.notification.info('Your application is already under review.');
      return;
    }

    this.state.submitForVerification();
    this.notification.success('✓ Application submitted for review! You will hear back within 24-48 hours.');
  }

  // Accept client's counter-offer
  acceptClientOffer(jobId: string) {
    this.state.acceptCounterOffer(jobId).subscribe({
      next: () => {
        this.notification.success('✓ You accepted the client\'s offer!');
      },
      error: (err) => {
        this.notification.error('❌ Failed to accept offer: ' + (err.error?.message || err.message));
      }
    });
  }

  // Reject client's counter-offer
  rejectClientOffer(jobId: string) {
    this.state.rejectCounterOffer(jobId).subscribe({
      next: () => {
        this.notification.success('✓ You declined the client\'s offer.');
      },
      error: (err) => {
        this.notification.error('❌ Failed to decline offer: ' + (err.error?.message || err.message));
      }
    });
  }

  // Open counter-offer modal
  openCounterOfferModal(job: any) {
    this.counterOfferModal.set(job);
    this.counterOfferPrice.set(null);
  }

  // Close counter-offer modal
  closeCounterOfferModal() {
    this.counterOfferModal.set(null);
    this.counterOfferPrice.set(null);
  }

  // Submit counter-offer to client
  submitCounterOffer() {
    const job = this.counterOfferModal();
    if (!job || !this.counterOfferPrice()) return;

    this.counterOfferLoading.set(true);
    this.state.submitCounterOffer(job.id, this.counterOfferPrice()!).subscribe({
      next: () => {
        this.counterOfferLoading.set(false);
        this.closeCounterOfferModal();
        this.notification.success('✓ Your counter-offer has been sent to the client!');
      },
      error: (err) => {
        this.counterOfferLoading.set(false);
        this.notification.error('❌ Failed to submit counter-offer: ' + (err.error?.message || err.message));
      }
    });
  }

  // Navigate to messages with specific client
  navigateToMessages(clientId: string) {
    this.router.navigate(['/worker/messages'], {
      queryParams: { clientId: clientId }
    });
  }

  ngOnInit() {
    this.loadWorkerEarningsData();
  }

  private loadWorkerEarningsData() {
    const user = this.auth.currentUser();
    const workerId = user?.id;
    if (!workerId) {
      this.loading.set(false);
      return;
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);

    this.analyticsService.getWorkerEarningsData(
      workerId,
      startDate.toISOString(),
      endDate.toISOString()
    ).subscribe({
      next: (data: WorkerEarningsData[]) => {
        this.earningsData.set(this.transformEarningsData(data));
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading earnings data:', error);
        this.loading.set(false);
      }
    });
  }

  private transformEarningsData(data: WorkerEarningsData[]): any[] {
    return [
      {
        name: 'Earnings',
        series: data.map(d => ({
          name: d.period,
          value: d.earnings
        }))
      },
      {
        name: 'Jobs Completed',
        series: data.map(d => ({
          name: d.period,
          value: d.jobsCompleted
        }))
      }
    ];
  }

  get earningsByPeriod() {
    return this.earningsData().map(d => ({
      name: d.period,
      value: d.earnings
    }));
  }
}