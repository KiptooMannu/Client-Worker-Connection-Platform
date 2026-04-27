import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map, Observable, shareReplay } from 'rxjs';
import { NavbarComponent } from '../../shared/components/navbar';

@Component({
  selector: 'app-admin-layout',
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
    <div class="h-screen bg-[#f8fafc] flex flex-col overflow-hidden">
      <app-navbar></app-navbar>

      <mat-sidenav-container class="flex-grow">
        <mat-sidenav #sidenav 
                     [mode]="(isHandset$ | async) ? 'over' : 'side'" 
                     [opened]="(isHandset$ | async) === false"
                     class="!w-72 !border-r !border-slate-100 !bg-slate-50/50">
          <div class="p-8">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Administration</p>
            
            <mat-nav-list class="!p-0 space-y-2">
              <a mat-list-item routerLink="dashboard" routerLinkActive="active-link" class="!rounded-2xl group cursor-pointer">
                <mat-icon matListItemIcon class="group-[.active-link]:!text-indigo-600 transition-colors">dashboard</mat-icon>
                <div matListItemTitle class="text-sm font-black text-slate-600 group-[.active-link]:!text-indigo-700">Platform Overview</div>
              </a>
              <a mat-list-item routerLink="verification" routerLinkActive="active-link" class="!rounded-2xl group cursor-pointer">
                <mat-icon matListItemIcon class="group-[.active-link]:!text-indigo-600 transition-colors">fact_check</mat-icon>
                <div matListItemTitle class="text-sm font-black text-slate-600 group-[.active-link]:!text-indigo-700">Verification Queue</div>
              </a>
              <a mat-list-item routerLink="users" routerLinkActive="active-link" class="!rounded-2xl group cursor-pointer">
                <mat-icon matListItemIcon class="group-[.active-link]:!text-indigo-600 transition-colors">group</mat-icon>
                <div matListItemTitle class="text-sm font-black text-slate-600 group-[.active-link]:!text-indigo-700">User Management</div>
              </a>
              <a mat-list-item routerLink="activity" routerLinkActive="active-link" class="!rounded-2xl group cursor-pointer">
                <mat-icon matListItemIcon class="group-[.active-link]:!text-indigo-600 transition-colors">history_edu</mat-icon>
                <div matListItemTitle class="text-sm font-black text-slate-600 group-[.active-link]:!text-indigo-700">System Activity</div>
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
              <div class="bg-indigo-900 px-6 py-3 rounded-2xl shadow-xl shadow-indigo-900/20 flex items-center gap-3">
                <mat-icon class="!text-white !text-sm !w-auto !h-auto">security</mat-icon>
                <span class="text-[10px] font-black text-white uppercase tracking-widest">Admin Control</span>
              </div>
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
    .active-link { background: #f5f3ff !important; }
    :host { display: block; }
  `]
})
export class AdminLayout {
  private breakpointObserver = inject(BreakpointObserver);

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );
}
