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
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatListModule, MatIconModule, MatButtonModule, NavbarComponent
  ],
  template: `
    <div class="min-h-screen bg-surface flex flex-col font-manrope">
      <app-navbar></app-navbar>

      <div class="flex flex-1 overflow-hidden">
        <mat-sidenav-container class="flex-1 min-h-0 bg-surface-container-lowest">
          <mat-sidenav #sidenav
                       [mode]="(isHandset$ | async) ? 'over' : 'side'"
                       [opened]="(isHandset$ | async) === false"
                       class="admin-sidenav">
            <div class="flex flex-col h-full px-4 py-6">
           

              <nav class="space-y-2">
                @for (item of menuItems; track item.path) {
                  <a [routerLink]="item.path"
                     routerLinkActive="active-link"
                     class="admin-nav-item flex items-center gap-4 px-4 py-4 rounded-2xl text-slate-700 hover:bg-slate-100 transition-all group">
                    <mat-icon class="!text-slate-400 group-[.active-link]:!text-indigo-600 transition-colors">{{ item.icon }}</mat-icon>
                    <span class="text-[11px] font-black uppercase tracking-[0.18em] group-[.active-link]:!text-indigo-700">{{ item.label }}</span>
                  </a>
                }
              </nav>

              <div class="mt-auto pt-8 border-t border-slate-200/80">
                <p class="text-[10px] uppercase tracking-[0.25em] text-slate-400 font-black mb-3">Admin tools</p>
                <div class="space-y-3">
                  <a routerLink="../settings" class="block px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-all text-[11px] font-black uppercase tracking-[0.18em]">Settings</a>
                </div>
              </div>
            </div>
          </mat-sidenav>

          <mat-sidenav-content class="overflow-y-auto">
            <div class="max-w-[1400px] mx-auto flex-1 p-4 md:p-8 lg:p-10">
              <div class="flex items-center justify-between gap-4 mb-8">
                <div>
                  <h1 class="text-2xl md:text-3xl font-black text-slate-950 tracking-tight">Admin Workspace</h1>
                  <p class="mt-2 text-sm text-slate-500 max-w-2xl">Manage users, review verifications, and monitor platform activity in a polished admin experience.</p>
                </div>
                @if (isHandset$ | async) {
                  <button (click)="sidenav.toggle()" class="w-11 h-11 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
                    <mat-icon class="!text-lg">menu</mat-icon>
                  </button>
                }
              </div>

              <main class="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <router-outlet></router-outlet>
              </main>

              <footer class="py-12 flex justify-center items-center">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  &copy; 2024 Kazi Konnect. All rights reserved.
                </p>
              </footer>
            </div>
          </mat-sidenav-content>
        </mat-sidenav-container>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; }

    .admin-sidenav {
      width: 280px !important;
      background-color: #f8fafc !important;
      border-right: 1px solid rgba(226, 232, 240, 0.9) !important;
      box-shadow: inset -1px 0 0 rgba(148, 163, 184, 0.1);
    }

    ::ng-deep .mat-drawer-inner-container {
      overflow-x: hidden !important;
      display: flex !important;
      flex-direction: column !important;
    }

    .admin-nav-item {
      border-radius: 1.5rem !important;
      padding: 1rem 1rem !important;
      margin-bottom: 0.5rem !important;
      background-color: transparent !important;
      min-height: auto !important;
    }

    .admin-nav-item:hover {
      background-color: rgba(248, 250, 252, 1) !important;
    }

    .admin-nav-item mat-icon {
      min-width: 1.5rem !important;
      min-height: 1.5rem !important;
    }

    .active-link {
      background: white !important;
      border: 1px solid rgba(226, 232, 240, 0.9) !important;
      color: #1d4ed8 !important;
      box-shadow: 0 12px 40px -20px rgba(15, 23, 42, 0.2) !important;
    }

    ::ng-deep .mat-drawer-backdrop.mat-drawer-shown {
      background-color: rgba(15, 23, 42, 0.16) !important;
      backdrop-filter: blur(4px);
    }
  `]
})
export class AdminLayout {
  private breakpointObserver = inject(BreakpointObserver);

  menuItems = [
    { path: 'dashboard',    label: 'Overview',     icon: 'grid_view' },
    { path: 'jobs',         label: 'Job Tracker',  icon: 'track_changes' },
    { path: 'disputes',     label: 'Disputes',     icon: 'gavel' },
    { path: 'fees',         label: 'Platform Fees', icon: 'payments' },
    { path: 'verification', label: 'Verify Users', icon: 'fact_check' },
    { path: 'users',        label: 'Users',        icon: 'people_alt' },
    { path: 'activity',     label: 'Activity',     icon: 'insights' },
    { path: 'messages',     label: 'Messages',     icon: 'forum' },
    { path: 'settings',     label: 'Settings',     icon: 'settings' }
  ];

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay({ bufferSize: 1, refCount: true })
    );
}
