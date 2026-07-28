import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/services/auth.service';
import { NavbarComponent } from '../../shared/components/navbar';
import { DashboardSidebarComponent } from '../../shared/components/dashboard-sidebar';
import { AppNavSection } from '../../shared/components/nav-model';

/**
 * Admin shell.
 *
 * Previously built on `mat-sidenav` keyed to the CDK `Handset` breakpoint, which
 * caused two problems. `Handset` tops out at 599px, so every tablet from 600px
 * to 1023px got the rail pinned open in `side` mode — 280px of nav against
 * ~490px of content, which is narrower than the admin tables — and no way to
 * close it, because the toggle button was itself only rendered for handsets.
 * Admin also had no bottom bar and no hamburger in the header, so on a phone
 * nine of the eleven sections were unreachable.
 *
 * It now uses the same shell as client and worker: a sticky rail from 1024px,
 * and the navbar's hamburger drawer plus bottom bar below that.
 */
@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, MatIconModule, MatButtonModule,
    NavbarComponent, DashboardSidebarComponent
  ],
  template: `
    <div class="min-h-screen bg-surface flex flex-col font-manrope">
      <app-navbar
        pageTitle="Admin"
        [navSections]="navSections()">
      </app-navbar>

      <div class="flex flex-1 items-stretch">
        <app-dashboard-sidebar
          class="accent-indigo"
          [sections]="navSections()"
          ariaLabel="Admin navigation"
          (logout)="auth.logout()">
        </app-dashboard-sidebar>

        <main class="flex-1 min-w-0 bg-surface-container-lowest">
          <div class="app-container px-3 sm:px-5 md:px-8 lg:px-10 py-4 sm:py-6 md:py-8 pb-bottom-nav">
            <header class="mb-6 md:mb-8">
              <h1 class="text-xl sm:text-2xl md:text-3xl font-black text-slate-950 tracking-tight">Admin Workspace</h1>
              <p class="mt-1.5 md:mt-2 text-xs sm:text-sm text-slate-500 max-w-2xl">
                Manage users, review verifications, and monitor platform activity.
              </p>
            </header>

            <div class="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <router-outlet></router-outlet>
            </div>

            <footer class="py-10 flex justify-center items-center">
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">
                &copy; 2024 Kazi Konnect. All rights reserved.
              </p>
            </footer>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; }
  `]
})
export class AdminLayout {
  auth = inject(AuthService);

  /**
   * Eleven sections is more than a bottom bar can hold, so the four most-used
   * are flagged `primary` and the rest live in the drawer.
   */
  navSections = computed<AppNavSection[]>(() => [
    {
      label: 'Monitor',
      items: [
        { path: '/admin/dashboard', label: 'Overview', shortLabel: 'Home', icon: 'grid_view', primary: true },
        { path: '/admin/analytics', label: 'Analytics', icon: 'insert_chart' },
        { path: '/admin/jobs', label: 'Job Tracker', shortLabel: 'Jobs', icon: 'track_changes', primary: true },
        { path: '/admin/activity', label: 'Activity', icon: 'insights' }
      ]
    },
    {
      label: 'Money',
      items: [
        { path: '/admin/fees', label: 'Platform Fees', icon: 'payments' },
        { path: '/admin/platform-revenue', label: 'Revenue Wallet', icon: 'account_balance_wallet' }
      ]
    },
    {
      label: 'People',
      items: [
        { path: '/admin/verification', label: 'Verify Users', shortLabel: 'Verify', icon: 'fact_check', primary: true },
        { path: '/admin/users', label: 'Users', icon: 'people_alt' },
        { path: '/admin/disputes', label: 'Disputes', icon: 'gavel' },
        { path: '/admin/messages', label: 'Messages', shortLabel: 'Chat', icon: 'forum', primary: true }
      ]
    },
    {
      label: 'Account',
      items: [
        { path: '/admin/settings', label: 'Settings', icon: 'settings' }
      ]
    }
  ]);
}
