import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Event, NavigationEnd, Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PlatformStateService } from '../../core/services/platform-state.service';
import { AuthService } from '../../core/services/auth.service';
import { NavbarComponent } from '../../shared/components/navbar';
import { MyDisputesComponent } from '../../shared/components/my-disputes/my-disputes.component';

@Component({
  selector: 'app-client-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatButtonModule,
    NavbarComponent,
    MyDisputesComponent
  ],
  template: `
    <div class="min-h-screen bg-surface flex flex-col font-manrope">
      <!-- Standard Navbar at Top -->
      <app-navbar 
        [showHireTalent]="false" 
        pageTitle="Marketplace" 
        badge="Employer">
      </app-navbar>

      <div class="flex flex-1 overflow-hidden">
        <!-- Minimalist Sidebar (Desktop) -->
        <aside class="hidden lg:flex flex-col w-72 border-r border-outline-variant/30 bg-surface px-4 py-8 space-y-6 shrink-0">
          <nav class="space-y-1">
            <a routerLink="marketplace" routerLinkActive="active-tab" class="flex items-center gap-4 px-5 py-4 rounded-xl text-on-surface-variant font-black text-xs uppercase tracking-widest hover:bg-surface-container-low transition-all group">
              <mat-icon class="group-[.active-tab]:text-brand-teal transition-colors">explore</mat-icon>
              Explore
            </a>
            <a routerLink="bookings" routerLinkActive="active-tab" class="flex items-center gap-4 px-5 py-4 rounded-xl text-on-surface-variant font-black text-xs uppercase tracking-widest hover:bg-surface-container-low transition-all group">
              <mat-icon class="group-[.active-tab]:text-brand-teal transition-colors">event_note</mat-icon>
              My Bookings
            </a>
            <a routerLink="disputes" routerLinkActive="active-tab" class="flex items-center gap-4 px-5 py-4 rounded-xl text-on-surface-variant font-black text-xs uppercase tracking-widest hover:bg-surface-container-low transition-all group">
              <mat-icon class="group-[.active-tab]:text-brand-teal transition-colors">gavel</mat-icon>
              Disputes
            </a>
            <a routerLink="messages" routerLinkActive="active-tab" class="flex items-center gap-4 px-5 py-4 rounded-xl text-on-surface-variant font-black text-xs uppercase tracking-widest hover:bg-surface-container-low transition-all group">
              <mat-icon class="group-[.active-tab]:text-brand-teal transition-colors">chat_bubble_outline</mat-icon>
              Messages
            </a>
            <a routerLink="settings" routerLinkActive="active-tab" class="flex items-center gap-4 px-5 py-4 rounded-xl text-on-surface-variant font-black text-xs uppercase tracking-widest hover:bg-surface-container-low transition-all group">
              <mat-icon class="group-[.active-tab]:text-brand-teal transition-colors">settings</mat-icon>
              Settings
            </a>
          </nav>

          <div class="mt-auto pt-8 border-t border-outline-variant/30 px-2 space-y-1">
             <button (click)="auth.logout()" class="w-full flex items-center gap-4 px-5 py-4 rounded-xl text-error font-black text-[10px] uppercase tracking-widest hover:bg-error/5 transition-all">
                <mat-icon class="!text-xl">logout</mat-icon>
                Log Out
             </button>
          </div>
        </aside>

        <!-- Dynamic Content -->
        <main class="flex-1 overflow-y-auto bg-surface-container-lowest/30 pb-24 lg:pb-0">
          <div class="max-w-[1400px] mx-auto p-4 md:p-10 lg:p-12">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>

      <!-- Mobile Bottom Navigation Bar -->
      @if (showBottomNav()) {
        <div class="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-slate-100 flex items-center justify-around px-4 z-[100] pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
          <a routerLink="marketplace" routerLinkActive="active-mobile-tab" class="flex flex-col items-center gap-1 text-slate-400 group">
            <mat-icon class="group-[.active-mobile-tab]:text-brand-teal transition-colors">explore</mat-icon>
            <span class="text-[10px] font-black uppercase tracking-tighter group-[.active-mobile-tab]:text-brand-teal">Find</span>
          </a>
          <a routerLink="bookings" routerLinkActive="active-mobile-tab" class="flex flex-col items-center gap-1 text-slate-400 group">
            <mat-icon class="group-[.active-mobile-tab]:text-brand-teal transition-colors">event_note</mat-icon>
            <span class="text-[10px] font-black uppercase tracking-tighter group-[.active-mobile-tab]:text-brand-teal">Bookings</span>
          </a>
          <a routerLink="disputes" routerLinkActive="active-mobile-tab" class="flex flex-col items-center gap-1 text-slate-400 group">
            <mat-icon class="group-[.active-mobile-tab]:text-brand-teal transition-colors">gavel</mat-icon>
            <span class="text-[10px] font-black uppercase tracking-tighter group-[.active-mobile-tab]:text-brand-teal">Disputes</span>
          </a>
          <a routerLink="messages" routerLinkActive="active-mobile-tab" class="flex flex-col items-center gap-1 text-slate-400 group">
            <div class="relative">
              <mat-icon class="group-[.active-mobile-tab]:text-brand-teal transition-colors">chat_bubble_outline</mat-icon>
              @if (state.unreadMessagesCount() > 0) {
                <span class="absolute -top-1 -right-1 w-4 h-4 bg-brand-teal text-white text-[8px] flex items-center justify-center rounded-full border-2 border-white font-black">
                  {{ state.unreadMessagesCount() }}
                </span>
              }
            </div>
            <span class="text-[10px] font-black uppercase tracking-tighter group-[.active-mobile-tab]:text-brand-teal">Chats</span>
          </a>
          <a routerLink="settings" routerLinkActive="active-mobile-tab" class="flex flex-col items-center gap-1 text-slate-400 group">
            <mat-icon class="group-[.active-mobile-tab]:text-brand-teal transition-colors">settings</mat-icon>
            <span class="text-[10px] font-black uppercase tracking-tighter group-[.active-mobile-tab]:text-brand-teal">Settings</span>
          </a>
        </div>
      }
    </div>
  `,
  styles: [`
    .active-tab {
      background-color: var(--color-surface-container-low) !important;
      color: var(--brand-teal) !important;
    }
    .active-mobile-tab {
      color: var(--brand-teal) !important;
    }
    :host { display: block; height: 100vh; }
  `]
})
export class ClientLayout {
  state = inject(PlatformStateService);
  auth = inject(AuthService);
  router = inject(Router);

  currentRoute = signal('');
  showBottomNav = computed(() => !this.currentRoute().startsWith('/client/profile'));

  constructor() {
    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        this.currentRoute.set(event.urlAfterRedirects || event.url);
      }
    });
  }
}
