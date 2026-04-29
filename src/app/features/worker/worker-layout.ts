import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map, Observable, shareReplay } from 'rxjs';
import { NavbarComponent } from '../../shared/components/navbar';
import { PlatformStateService } from '../../core/services/platform-state.service';

@Component({
  selector: 'app-worker-layout',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    RouterLink, 
    RouterLinkActive, 
    MatSidenavModule, 
    MatListModule, 
    MatIconModule, 
    MatButtonModule,
    NavbarComponent
  ],
  template: `
    <div class="h-screen bg-[#faf9fd] flex flex-col overflow-hidden">
      <app-navbar></app-navbar>

      <mat-sidenav-container class="flex-grow">
        <mat-sidenav #sidenav 
                     [mode]="(isHandset$ | async) ? 'over' : 'side'" 
                     [opened]="(isHandset$ | async) === false"
                     class="!w-72 !border-r !border-slate-100 !bg-slate-50/50">
          <div class="p-8">
            <!-- Navigation -->
            <mat-nav-list class="!p-0 space-y-2">
              <a mat-list-item routerLink="dashboard" routerLinkActive="active-link" class="!rounded-2xl group cursor-pointer">
                <mat-icon matListItemIcon class="group-[.active-link]:!text-blue-600 transition-colors">analytics</mat-icon>
                <div matListItemTitle class="text-sm font-black text-slate-600 group-[.active-link]:!text-blue-700">Dashboard</div>
              </a>
              <a mat-list-item routerLink="profile" routerLinkActive="active-link" class="!rounded-2xl group cursor-pointer">
                <mat-icon matListItemIcon class="group-[.active-link]:!text-blue-600 transition-colors">badge</mat-icon>
                <div matListItemTitle class="text-sm font-black text-slate-600 group-[.active-link]:!text-blue-700">Profile</div>
              </a>
              <a mat-list-item routerLink="verification" routerLinkActive="active-link" class="!rounded-2xl group cursor-pointer">
                <mat-icon matListItemIcon class="group-[.active-link]:!text-blue-600 transition-colors">verified_user</mat-icon>
                <div matListItemTitle class="text-sm font-black text-slate-600 group-[.active-link]:!text-blue-700">Verification</div>
              </a>
              <a mat-list-item routerLink="history" routerLinkActive="active-link" class="!rounded-2xl group cursor-pointer">
                <mat-icon matListItemIcon class="group-[.active-link]:!text-blue-600 transition-colors">work_history</mat-icon>
                <div matListItemTitle class="text-sm font-black text-slate-600 group-[.active-link]:!text-blue-700">History</div>
              </a>
            </mat-nav-list>
          </div>
        </mat-sidenav>

        <mat-sidenav-content class="!p-6 md:!p-10 lg:!p-16">
          <header class="flex justify-between items-center mb-12">
            <div class="flex items-center gap-4">
               @if (isHandset$ | async) {
                <button mat-icon-button (click)="sidenav.toggle()" class="!bg-white !border !border-slate-100 !rounded-xl cursor-pointer">
                  <mat-icon>menu</mat-icon>
                </button>
              }
              @if (worker().status === 'Verified') {
                <div class="bg-teal-50 px-6 py-3 rounded-2xl border border-teal-100 flex items-center gap-3">
                  <mat-icon class="!text-teal-600 !text-sm !w-auto !h-auto">verified</mat-icon>
                  <span class="text-[10px] font-black text-teal-800 uppercase tracking-widest">Verified Expert</span>
                </div>
              } @else {
                <div class="bg-blue-50 px-6 py-3 rounded-2xl border border-blue-100 flex items-center gap-3">
                  <mat-icon class="!text-blue-600 !text-sm !w-auto !h-auto">pending_actions</mat-icon>
                  <span class="text-[10px] font-black text-blue-800 uppercase tracking-widest">{{ worker().status }} Profile</span>
                </div>
              }
            </div>
          </header>

          <main class="max-w-[1440px] mx-auto">
            <router-outlet></router-outlet>
          </main>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </div>
  `,
  styles: [`
    .active-link { background: #f1f5f9 !important; border-right: 4px solid #0f172a; }
    :host { display: block; }
  `]
})
export class WorkerLayout {
  private breakpointObserver = inject(BreakpointObserver);
  state = inject(PlatformStateService);
  worker = this.state.currentWorker;

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );
}
