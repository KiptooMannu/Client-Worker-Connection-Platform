import { Component, inject, signal, Input, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { PlatformStateService } from '../../core/services/platform-state.service';
import { WebSocketService } from '../../core/services/websocket.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatButtonModule,
    MatMenuModule
  ],
  template: `
    <header class="bg-white text-slate-900 border-b border-slate-100 shadow-sm fixed top-0 left-0 right-0 z-[99999] backdrop-blur-md bg-white/90 transition-all duration-300"
            [class.scrolled]="isScrolled()">
      <div class="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 md:px-12 h-16 md:h-20 gap-8">

        <!-- Logo Section -->
        <div class="flex items-center gap-4 md:gap-8 shrink-0">
          <a routerLink="/" class="flex items-center gap-3 group shrink-0">
            <div class="w-8 h-8 md:w-10 md:h-10 bg-brand-teal rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform duration-300">
              <mat-icon class="!text-lg md:!text-xl">corporate_fare</mat-icon>
            </div>
            <span class="text-lg md:text-xl font-black tracking-tighter text-brand-teal hidden lg:block">KaziKonnect</span>
          </a>

          <!-- Dynamic Context Title & Badge -->
          @if (pageTitle) {
            <div class="h-6 w-px bg-slate-200 hidden md:block"></div>
            <div class="flex items-center gap-3 min-w-0">
              <h1 class="text-sm font-black text-slate-900 uppercase tracking-widest truncate">{{ pageTitle }}</h1>
              @if (badge) {
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shrink-0"
                      [ngClass]="getBadgeClass()">
                  <span class="w-1.5 h-1.5 rounded-full" [class.animate-pulse]="badge === 'Pending'"></span>
                  {{ formatBadge() }}
                </span>
              }
            </div>
          }
        </div>

        <!-- Desktop Navigation -->
        <div class="flex-1 hidden lg:flex justify-center">
          @if (!pageTitle) {
            <nav class="flex items-center gap-8">
              @if (!auth.isAuthenticated() || auth.userRole() === 'Worker') {
                <a routerLink="/worker/dashboard" routerLinkActive="active-link"
                   class="nav-link text-sm font-black text-slate-500 hover:text-brand-teal transition-all py-2 border-b-2 border-transparent hover:border-brand-teal">
                  Find Jobs
                </a>
              }
              @if (!auth.isAuthenticated() || auth.userRole() === 'Client') {
                <!-- FIX: was /employer/marketplace -->
                <a routerLink="/client/marketplace" routerLinkActive="active-link"
                   class="nav-link text-sm font-black text-slate-500 hover:text-brand-teal transition-all py-2 border-b-2 border-transparent hover:border-brand-teal">
                  Hire Workers
                </a>
              }
              @if (!auth.isAuthenticated()) {
                <a routerLink="/enterprise" routerLinkActive="active-link"
                   class="nav-link text-sm font-black text-slate-500 hover:text-brand-teal transition-all py-2 border-b-2 border-transparent hover:border-brand-teal">
                  For Business
                </a>
                <a routerLink="/solutions" routerLinkActive="active-link"
                   class="nav-link text-sm font-black text-slate-500 hover:text-brand-teal transition-all py-2 border-b-2 border-transparent hover:border-brand-teal">
                  How it Works
                </a>
              }
              @if (auth.userRole() === 'Client') {
                <!-- FIX: was /employer/bookings -->
                <a routerLink="/client/bookings" routerLinkActive="active-link"
                   class="nav-link text-sm font-black text-slate-500 hover:text-brand-teal transition-all py-2 border-b-2 border-transparent hover:border-brand-teal">
                  My Bookings
                </a>
              }
              @if (auth.userRole() === 'Worker') {
                <a routerLink="/worker/history" routerLinkActive="active-link"
                   class="nav-link text-sm font-black text-slate-500 hover:text-brand-teal transition-all py-2 border-b-2 border-transparent hover:border-brand-teal">
                  My Jobs
                </a>
              }
            </nav>
          }
        </div>

        <!-- Right Side Actions -->
        <div class="flex items-center gap-2 sm:gap-3 md:gap-4 shrink-0">
          @if (auth.isAuthenticated()) {
            <!-- Notifications & Messages -->
            <div class="flex items-center gap-1 sm:gap-2 mr-1 sm:mr-2 border-r border-slate-100 pr-2 sm:pr-4">
              <button (click)="toggleNotifications()"
                      class="relative p-1.5 sm:p-2 text-slate-400 hover:text-slate-900 transition-all rounded-full hover:bg-slate-100 cursor-pointer">
                <mat-icon class="!text-xl sm:!text-2xl">notifications_none</mat-icon>
                @if (unreadNotificationsCount() > 0) {
                  <span class="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white">
                    {{ unreadNotificationsCount() > 9 ? '9+' : unreadNotificationsCount() }}
                  </span>
                }
              </button>

              @if (showMessages) {
                <!-- FIX: getMessagesPath() now returns correct /client/messages -->
                <button [routerLink]="getMessagesPath()"
                        class="hidden lg:inline-flex relative p-1.5 sm:p-2 text-slate-400 hover:text-slate-900 transition-all rounded-full hover:bg-slate-100 cursor-pointer"
                        aria-label="Messages">
                  <mat-icon class="!text-xl sm:!text-2xl">chat_bubble_outline</mat-icon>
                  @if (state.unreadMessagesCount() > 0) {
                    <span class="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-teal text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                      {{ state.unreadMessagesCount() > 9 ? '9+' : state.unreadMessagesCount() }}
                    </span>
                  }
                </button>
              }
            </div>

            <!-- Profile Menu -->
            <button [matMenuTriggerFor]="profileMenu" class="flex items-center gap-3 p-1.5 hover:bg-slate-50 rounded-xl transition-all cursor-pointer group">
              <div class="hidden xl:flex flex-col items-end">
                <span class="text-[9px] font-black uppercase tracking-widest leading-none mb-1"
                      [ngClass]="getRoleBadgeClass()">
                  {{ formatRole() }}
                </span>
                <span class="text-xs font-bold text-slate-900 leading-none max-w-[120px] truncate">{{ auth.currentUser()?.name }}</span>
              </div>
              <div class="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm group-hover:shadow-md transition-all">
                @if (auth.currentUser()?.avatarUrl) {
                  <img [src]="auth.currentUser()?.avatarUrl" class="w-full h-full object-cover" alt="Avatar">
                } @else {
                  <div class="w-full h-full bg-brand-teal text-white text-sm font-black flex items-center justify-center uppercase">
                    {{ auth.currentUser()?.name?.charAt(0) || 'U' }}
                  </div>
                }
              </div>
              <mat-icon class="text-slate-400 !text-sm !w-auto !h-auto group-hover:text-slate-600 transition-colors">expand_more</mat-icon>
            </button>

            <!-- Profile Dropdown Menu -->
            <mat-menu #profileMenu="matMenu" class="!rounded-2xl !mt-3 !shadow-2xl border border-slate-100 overflow-hidden min-w-[240px]">
              <div class="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                <p class="text-sm font-black text-slate-900 truncate">{{ auth.currentUser()?.name }}</p>
                <p class="text-[10px] text-slate-500 font-medium truncate">{{ auth.currentUser()?.email }}</p>
              </div>

              <!-- FIX: getDashboardPath() now returns /client/marketplace for Client role -->
              <button mat-menu-item [routerLink]="getDashboardPath()" class="!h-11">
                <mat-icon class="text-slate-500 !text-lg">dashboard</mat-icon>
                <span class="text-xs font-bold text-slate-700">Dashboard</span>
              </button>

              @if (auth.userRole() === 'Worker') {
                <button mat-menu-item routerLink="/worker/profile" class="!h-11">
                  <mat-icon class="text-slate-500 !text-lg">person_edit</mat-icon>
                  <span class="text-xs font-bold text-slate-700">Edit Profile</span>
                  @if (state.currentWorkerCompletion() < 100 && state.currentWorker().status !== 'Approved') {
                    <span class="ml-auto text-[8px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full">{{ state.currentWorkerCompletion() }}%</span>
                  }
                </button>
              }

              @if (auth.userRole() === 'Worker') {
                <button mat-menu-item routerLink="/worker/verification" class="!h-11">
                  <mat-icon class="text-slate-500 !text-lg">verified_user</mat-icon>
                  <span class="text-xs font-bold text-slate-700">Verification</span>
                </button>
              }

              <!-- FIX: getSettingsPath() now returns /client/settings for Client role -->
              <button mat-menu-item [routerLink]="getSettingsPath()" class="!h-11">
                <mat-icon class="text-slate-500 !text-lg">settings</mat-icon>
                <span class="text-xs font-bold text-slate-700">Account Settings</span>
              </button>

              <div class="h-px bg-slate-100 my-1"></div>

              <button mat-menu-item (click)="logout()" class="!h-11 !text-rose-600 hover:!bg-rose-50">
                <mat-icon class="text-rose-500 !text-lg">logout</mat-icon>
                <span class="text-xs font-bold">Log Out</span>
              </button>
            </mat-menu>
          } @else {
            <!-- Unauthenticated Actions -->
            <div class="hidden lg:flex items-center gap-3">
              <button routerLink="/login" class="text-brand-teal font-black text-[10px] uppercase tracking-widest px-5 py-2.5 border border-brand-teal rounded-xl hover:bg-brand-teal/5 transition-all cursor-pointer">
                Log In
              </button>
              <button routerLink="/register" class="bg-brand-teal text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-brand-teal/20 hover:shadow-xl cursor-pointer">
                Sign Up
              </button>
            </div>
          }

          <!-- Mobile Menu Toggle -->
          <button (click)="toggleMobileMenu()" class="lg:hidden p-2 text-slate-600 hover:text-brand-teal transition-colors rounded-lg hover:bg-slate-50">
            <mat-icon>{{ isMobileMenuOpen() ? 'close' : 'menu' }}</mat-icon>
          </button>
        </div>
      </div>
    </header>

    <!-- Spacer for fixed header -->
    <div class="h-16 md:h-20"></div>

    <!-- Mobile Bottom Navigation Bar -->
    @if (auth.isAuthenticated()) {
      <nav class="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-slate-200 bg-white/95 backdrop-blur-md px-4 py-2 shadow-[0_-8px_40px_-24px_rgba(15,23,42,0.15)] safe-bottom">
        <div class="flex items-center justify-around">
          <!-- FIX: getDashboardPath() used here too -->
          <button [routerLink]="getDashboardPath()" class="flex flex-col items-center justify-center text-slate-500 hover:text-brand-teal transition-colors py-1">
            <mat-icon class="!text-xl">home</mat-icon>
            <span class="text-[9px] font-black uppercase tracking-wide mt-0.5">Home</span>
          </button>

          <!-- FIX: getMessagesPath() returns correct route -->
          <button [routerLink]="getMessagesPath()" class="flex flex-col items-center justify-center text-slate-500 hover:text-brand-teal transition-colors relative py-1">
            <mat-icon class="!text-xl">chat_bubble_outline</mat-icon>
            @if (state.unreadMessagesCount() > 0) {
              <span class="absolute -top-0.5 -right-1 w-4 h-4 bg-brand-teal text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white">
                {{ state.unreadMessagesCount() > 9 ? '9+' : state.unreadMessagesCount() }}
              </span>
            }
            <span class="text-[9px] font-black uppercase tracking-wide mt-0.5">Chat</span>
          </button>

          <!-- FIX: getSettingsPath() returns correct route -->
          <button [routerLink]="getSettingsPath()" class="flex flex-col items-center justify-center text-slate-500 hover:text-brand-teal transition-colors py-1">
            <mat-icon class="!text-xl">person</mat-icon>
            <span class="text-[9px] font-black uppercase tracking-wide mt-0.5">Profile</span>
          </button>
        </div>
      </nav>

      <!-- Bottom spacer for mobile nav -->
      <div class="lg:hidden h-16"></div>
    }

    <!-- Mobile Menu Overlay -->
    @if (isMobileMenuOpen()) {
      <div class="fixed inset-0 top-16 md:top-20 z-50 lg:hidden animate-in slide-in-from-top duration-300">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" (click)="toggleMobileMenu()"></div>
        <nav class="relative bg-brand-teal flex flex-col p-6 gap-4 shadow-2xl max-h-[calc(100vh-64px)] overflow-y-auto">
          <div class="flex items-center justify-between mb-2">
            <div>
              <p class="text-[10px] uppercase tracking-[0.3em] text-white/70 font-black mb-1">Menu</p>
              <h2 class="text-xl font-black text-white">KaziKonnect</h2>
            </div>
            <button (click)="toggleMobileMenu()" class="text-white/80 hover:text-white transition-colors p-2">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <div class="flex flex-col gap-2">
            @if (!auth.isAuthenticated()) {
              <a [routerLink]="['/']" fragment="about" (click)="toggleMobileMenu()" class="text-white font-bold py-3 px-4 rounded-xl bg-white/10 border border-white/15 hover:bg-white/20 transition-all">
                About Us
              </a>
              <a [routerLink]="['/']" fragment="faq" (click)="toggleMobileMenu()" class="text-white font-bold py-3 px-4 rounded-xl bg-white/10 border border-white/15 hover:bg-white/20 transition-all">
                FAQ
              </a>
              <a [routerLink]="['/']" fragment="contact" (click)="toggleMobileMenu()" class="text-white font-bold py-3 px-4 rounded-xl bg-white/10 border border-white/15 hover:bg-white/20 transition-all">
                Contact
              </a>
              <div class="h-px bg-white/20 my-2"></div>
            }

            @if (!auth.isAuthenticated() || auth.userRole() === 'Worker') {
              <a routerLink="/worker/dashboard" (click)="toggleMobileMenu()" class="text-white font-bold py-3 px-4 rounded-xl hover:bg-white/10 transition-all">
                Find Jobs
              </a>
            }
            @if (!auth.isAuthenticated() || auth.userRole() === 'Client') {
              <!-- FIX: was /employer/marketplace -->
              <a routerLink="/client/marketplace" (click)="toggleMobileMenu()" class="text-white font-bold py-3 px-4 rounded-xl hover:bg-white/10 transition-all">
                Hire Workers
              </a>
            }

            @if (!auth.isAuthenticated()) {
              <a routerLink="/enterprise" (click)="toggleMobileMenu()" class="text-white font-bold py-3 px-4 rounded-xl hover:bg-white/10 transition-all">
                For Business
              </a>
              <a routerLink="/solutions" (click)="toggleMobileMenu()" class="text-white font-bold py-3 px-4 rounded-xl hover:bg-white/10 transition-all">
                How it Works
              </a>
              <div class="h-px bg-white/20 my-2"></div>
              <a routerLink="/login" (click)="toggleMobileMenu()" class="text-white font-bold py-3 px-4 rounded-xl bg-white/20 border border-white/30">
                Log In
              </a>
              <a routerLink="/register" (click)="toggleMobileMenu()" class="text-brand-teal font-bold py-3 px-4 rounded-xl bg-white">
                Sign Up
              </a>
            }

            @if (auth.userRole() === 'Client') {
              <!-- FIX: was /client/bookings (this one was already correct in mobile menu) -->
              <a routerLink="/client/bookings" (click)="toggleMobileMenu()" class="text-white font-bold py-3 px-4 rounded-xl hover:bg-white/10 transition-all">
                My Bookings
              </a>
              <!-- FIX: added missing messages link for mobile menu -->
              <a routerLink="/client/messages" (click)="toggleMobileMenu()" class="text-white font-bold py-3 px-4 rounded-xl hover:bg-white/10 transition-all">
                Messages
              </a>
            }
            @if (auth.userRole() === 'Worker') {
              <a routerLink="/worker/history" (click)="toggleMobileMenu()" class="text-white font-bold py-3 px-4 rounded-xl hover:bg-white/10 transition-all">
                My Jobs
              </a>
              <a routerLink="/worker/messages" (click)="toggleMobileMenu()" class="text-white font-bold py-3 px-4 rounded-xl hover:bg-white/10 transition-all">
                Messages
              </a>
            }

            @if (auth.isAuthenticated()) {
              <div class="h-px bg-white/20 my-2"></div>
              <button (click)="logoutAndCloseMenu()" class="text-rose-300 font-bold py-3 px-4 rounded-xl text-left hover:bg-rose-500/20 transition-all">
                Log Out
              </button>
            }
          </div>
        </nav>
      </div>
    }
  `,
  styles: [`
    .active-link {
      color: var(--brand-teal, #0f766e) !important;
      border-bottom-color: var(--brand-teal, #0f766e) !important;
    }
    :host { display: block; width: 100%; }

    .nav-link {
      position: relative;
    }

    .nav-link::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 0;
      height: 2px;
      background-color: var(--brand-teal, #0f766e);
      transition: width 0.3s ease;
    }

    .nav-link:hover::after {
      width: 100%;
    }

    .scrolled {
      backdrop-filter: blur(12px);
      background-color: rgba(255, 255, 255, 0.95) !important;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    }

    .safe-bottom {
      padding-bottom: env(safe-area-inset-bottom, 0.5rem);
    }
  `]
})
export class NavbarComponent implements OnInit, OnDestroy {
  @Input() showHireTalent = true;
  @Input() showMessages = true;
  @Input() pageTitle = '';
  @Input() bottomNavHeight = 64;
  @Input() badge = '';

  auth = inject(AuthService);
  state = inject(PlatformStateService);
  ws = inject(WebSocketService);
  router = inject(Router);

  isMobileMenuOpen = signal(false);
  isScrolled = signal(false);
  private routerSubscription?: Subscription;

  unreadNotificationsCount = signal(0);

  ngOnInit() {
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', this.handleScroll.bind(this));

      this.routerSubscription = this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe(() => {
        if (this.isMobileMenuOpen()) {
          this.isMobileMenuOpen.set(false);
        }
      });
    }
  }

  ngOnDestroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.handleScroll.bind(this));
    }
    this.routerSubscription?.unsubscribe();
  }

  @HostListener('window:scroll')
  handleScroll() {
    this.isScrolled.set(window.scrollY > 10);
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(v => !v);
    if (this.isMobileMenuOpen()) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  logout() {
    this.auth.logout();
    if (this.isMobileMenuOpen()) {
      this.isMobileMenuOpen.set(false);
    }
  }

  logoutAndCloseMenu() {
    this.logout();
  }

  toggleNotifications() {
    console.log('Toggle notifications');
  }

  // FIX: All path methods now return correct /client/ routes instead of /employer/
  getSettingsPath(): string {
    const role = this.auth.userRole();
    if (role === 'Admin') return '/admin/settings';
    if (role === 'Worker') return '/worker/settings';
    if (role === 'Client') return '/client/settings';
    return '/';
  }

  getDashboardPath(): string {
    const role = this.auth.userRole();
    if (role === 'Admin') return '/admin';
    if (role === 'Worker') return '/worker/dashboard';
    if (role === 'Client') return '/client/marketplace';
    return '/';
  }

  // FIX: Was returning /employer/messages — now returns /client/messages
  getMessagesPath(): string {
    const role = this.auth.userRole();
    if (role === 'Admin') return '/admin/messages';
    if (role === 'Worker') return '/worker/messages';
    if (role === 'Client') return '/client/messages';
    return '/';
  }

  formatRole(): string {
    const role = this.auth.userRole();
    if (role === 'Client') return 'Employer';
    return role || 'User';
  }

  formatBadge(): string {
    if (this.badge === 'Client' || this.badge === 'client') return 'Employer';
    if (this.badge === 'Pending') return 'Under Review';
    if (this.badge === 'Approved' || this.badge === 'Verified') return 'Verified ✓';
    return this.badge;
  }

  getBadgeClass(): string {
    if (this.badge === 'Pending') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (this.badge === 'Approved' || this.badge === 'Verified') return 'bg-green-50 text-green-700 border-green-200';
    if (this.badge === 'Rejected') return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-blue-50 text-blue-700 border-blue-100';
  }

  getRoleBadgeClass(): string {
    const role = this.auth.userRole();
    if (role === 'Worker') return 'text-brand-teal';
    if (role === 'Client') return 'text-purple-600';
    if (role === 'Admin') return 'text-amber-600';
    return 'text-slate-500';
  }
}