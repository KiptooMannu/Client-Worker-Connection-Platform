import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Event, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { PlatformStateService } from '../../core/services/platform-state.service';
import { AuthService } from '../../core/services/auth.service';
import { NavbarComponent } from '../../shared/components/navbar';
import { DashboardSidebarComponent } from '../../shared/components/dashboard-sidebar';
import { AppNavSection } from '../../shared/components/nav-model';

@Component({
  selector: 'app-client-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NavbarComponent,
    DashboardSidebarComponent
  ],
  template: `
    <div class="min-h-screen bg-surface flex flex-col font-manrope">
      <!--
        The navbar owns the hamburger, the drawer and the single mobile bottom
        bar. This layout used to render a second bottom bar of its own, which
        landed in the same fixed position as the navbar's — two stacked bars,
        the lower one unreachable — and carried six destinations that could not
        fit 320px. Both now come from navSections() below.
      -->
      <app-navbar
        [showHireTalent]="false"
        pageTitle="Marketplace"
        badge="Employer"
        [navSections]="navSections()"
        [showBottomNav]="showBottomNav()">
      </app-navbar>

      <div class="flex flex-1 items-stretch">
        <app-dashboard-sidebar
          [sections]="navSections()"
          ariaLabel="Employer navigation"
          (logout)="auth.logout()">
        </app-dashboard-sidebar>

        <!-- Dynamic Content -->
        <main class="flex-1 min-w-0 bg-surface-container-lowest/30">
          <!--
            Padding scales with the viewport instead of jumping straight from
            16px to 40px, and the bottom clears the fixed mobile bar via the
            shared "--bottom-nav-safe" custom property.
          -->
          <div class="app-container px-3 sm:px-5 md:px-8 lg:px-10 xl:px-12 py-4 sm:py-6 md:py-8 lg:py-10 pb-bottom-nav">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; }
  `]
})
export class ClientLayout {
  state = inject(PlatformStateService);
  auth = inject(AuthService);
  router = inject(Router);

  currentRoute = signal('');

  /**
   * The worker-profile screen carries its own fixed hire/negotiate action bar,
   * which would sit on top of the bottom nav.
   */
  showBottomNav = computed(() => !this.currentRoute().startsWith('/client/profile'));

  /**
   * Four `primary` items plus the Menu button is exactly what fits a 320px bar
   * at a comfortable 64px per slot. Disputes and Settings live in the drawer.
   */
  navSections = computed<AppNavSection[]>(() => {
    const unread = this.state.unreadMessagesCount();

    return [
      {
        label: 'Marketplace',
        items: [
          { path: '/client/marketplace', label: 'Explore', shortLabel: 'Find', icon: 'explore', primary: true },
          { path: '/client/bookings', label: 'My Bookings', shortLabel: 'Bookings', icon: 'event_note', primary: true },
          { path: '/client/wallet', label: 'My Wallet', shortLabel: 'Wallet', icon: 'account_balance_wallet', primary: true }
        ]
      },
      {
        label: 'Support',
        items: [
          {
            path: '/client/messages',
            label: 'Messages',
            shortLabel: 'Chat',
            icon: 'chat_bubble_outline',
            primary: true,
            badge: unread > 0 ? (unread > 9 ? '9+' : unread) : null,
            badgeTone: 'brand'
          },
          { path: '/client/disputes', label: 'Disputes', shortLabel: 'Disputes', icon: 'gavel' }
        ]
      },
      {
        label: 'Account',
        items: [
          { path: '/client/settings', label: 'Settings', shortLabel: 'Settings', icon: 'settings' }
        ]
      }
    ];
  });

  constructor() {
    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        this.currentRoute.set(event.urlAfterRedirects || event.url);
      }
    });
  }
}
