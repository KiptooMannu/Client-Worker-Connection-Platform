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
import { AppNavItem, AppNavSection, bottomNavItems } from './nav-model';

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
      <!--
        The gaps and paddings step up with the viewport. They were previously
        fixed at "gap-8 px-4", which spent 64px of a 320px screen on whitespace
        between three blocks that already did not fit.
      -->
      <div class="max-w-7xl mx-auto flex items-center px-3 sm:px-5 md:px-8 lg:px-12 h-16 md:h-20 gap-2 sm:gap-4 lg:gap-6">

        <!-- Logo Section -->
        <!--
          "min-w-0" and a shrinkable box: this block used to be "shrink-0", so
          a long page title could not be truncated and instead pushed the
          profile menu and hamburger off the right edge of small phones.
        -->
        <div class="flex items-center gap-2.5 md:gap-6 min-w-0 flex-1 lg:flex-none">
          <a routerLink="/" class="flex items-center gap-2.5 group shrink-0" aria-label="Kazi Konnect home">
            <div class="w-8 h-8 md:w-10 md:h-10 bg-brand-teal rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform duration-300 shrink-0">
              <mat-icon class="!text-lg md:!text-xl">corporate_fare</mat-icon>
            </div>
            <span class="text-lg md:text-xl font-black tracking-tighter text-brand-teal hidden lg:block">KaziKonnect</span>
          </a>

          <!-- Dynamic Context Title & Badge -->
          @if (pageTitle) {
            <div class="h-6 w-px bg-slate-200 hidden md:block shrink-0"></div>
            <div class="flex items-center gap-2 min-w-0">
              <h1 class="text-[11px] sm:text-xs md:text-sm font-black text-slate-900 uppercase tracking-wider md:tracking-widest truncate">{{ pageTitle }}</h1>
              <!-- Hidden on the narrowest phones: "Under Review" plus the page
                   title cannot both fit beside the account controls at 320px. -->
              @if (badge) {
                <span class="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shrink-0"
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
        <div class="flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0 ml-auto">
          @if (auth.isAuthenticated()) {
            <!-- Notifications & Messages -->
            <div class="flex items-center gap-1 sm:gap-2 sm:mr-1 sm:border-r sm:border-slate-100 sm:pr-3">
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
            <button [matMenuTriggerFor]="profileMenu" class="flex items-center gap-2 xl:gap-3 p-1 sm:p-1.5 hover:bg-slate-50 rounded-xl transition-all cursor-pointer group shrink-0" aria-label="Account menu">
              <div class="hidden xl:flex flex-col items-end min-w-0">
                <span class="text-[9px] font-black uppercase tracking-widest leading-none mb-1"
                      [ngClass]="getRoleBadgeClass()">
                  {{ formatRole() }}
                </span>
                <span class="text-xs font-bold text-slate-900 leading-none max-w-[120px] truncate">{{ auth.currentUser()?.name }}</span>
              </div>
              <div class="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 shrink-0 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm group-hover:shadow-md transition-all">
                @if (auth.currentUser()?.avatarUrl) {
                  <img [src]="auth.currentUser()?.avatarUrl" class="w-full h-full object-cover" alt="Avatar">
                } @else {
                  <div class="w-full h-full bg-brand-teal text-white text-xs sm:text-sm font-black flex items-center justify-center uppercase">
                    {{ auth.currentUser()?.name?.charAt(0) || 'U' }}
                  </div>
                }
              </div>
              <mat-icon class="hidden sm:inline-flex text-slate-400 !text-sm !w-auto !h-auto group-hover:text-slate-600 transition-colors">expand_more</mat-icon>
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

          <!-- Mobile Menu Toggle: three bars that fold into a cross, so the
               control itself shows whether the menu is open. -->
          <button
            type="button"
            class="nav-burger lg:hidden"
            [class.is-open]="isMobileMenuOpen()"
            (click)="toggleMobileMenu()"
            [attr.aria-label]="isMobileMenuOpen() ? 'Close menu' : 'Open menu'"
            [attr.aria-expanded]="isMobileMenuOpen()"
            aria-controls="mobile-menu"
          >
            <span class="nav-burger-box" aria-hidden="true">
              <span class="nav-burger-bar"></span>
              <span class="nav-burger-bar"></span>
              <span class="nav-burger-bar"></span>
            </span>
          </button>
        </div>
      </div>
    </header>

    <!-- Spacer for fixed header -->
    <div class="h-16 md:h-20"></div>

    <!--
      Mobile bottom navigation — one bar for the whole app.

      Client and worker each used to render their own bar on top of the one the
      navbar rendered here, so on a phone two bars stacked in the same fixed
      position and the lower one was unreachable. The client bar also carried
      six destinations, which at 320px gives each 48px and clipped the labels.

      Now the bar is built from the layout's own navigation: four routes plus a
      Menu button, so each slot gets a comfortable 64px at 320px and everything
      that does not fit is one tap away in the drawer.
    -->
    <!-- Only where a layout supplied navigation. An authenticated user browsing
         a public page (the landing page uses this navbar too) would otherwise get
         a bar containing nothing but the Menu button. -->
    @if (auth.isAuthenticated() && showBottomNav && bottomItems().length > 0) {
      <nav class="mobile-bar lg:hidden" aria-label="Primary">
        @for (item of bottomItems(); track item.path) {
          <a class="mobile-bar-item"
             [routerLink]="item.path"
             routerLinkActive="is-active"
             [routerLinkActiveOptions]="{ exact: !!item.exact }"
             [class.is-locked]="item.locked"
             [attr.aria-disabled]="item.locked ? 'true' : null"
             [attr.tabindex]="item.locked ? -1 : null">
            <span class="mobile-bar-icon-wrap">
              <mat-icon class="mobile-bar-icon">{{ item.icon }}</mat-icon>
              @if (item.locked) {
                <mat-icon class="mobile-bar-dot-icon">lock</mat-icon>
              } @else if (item.badge) {
                <span class="mobile-bar-dot" [ngClass]="'tone-' + (item.badgeTone || 'brand')"></span>
              }
            </span>
            <span class="mobile-bar-label">{{ item.shortLabel || item.label }}</span>
          </a>
        }

        <!-- The hamburger is repeated here because the header copy is a long
             thumb-stretch away on a tall phone. -->
        <button type="button"
                class="mobile-bar-item"
                [class.is-active]="isMobileMenuOpen()"
                (click)="toggleMobileMenu()"
                [attr.aria-expanded]="isMobileMenuOpen()"
                aria-controls="mobile-menu"
                aria-label="Open menu">
          <span class="mobile-bar-icon-wrap">
            <mat-icon class="mobile-bar-icon">{{ isMobileMenuOpen() ? 'close' : 'menu' }}</mat-icon>
          </span>
          <span class="mobile-bar-label">Menu</span>
        </button>
      </nav>
    }

    <!--
      Mobile menu: a right-anchored drawer rather than the previous full-width
      teal sheet. Rows carry icons and sit in labelled groups so the menu can be
      scanned instead of read, the current route is highlighted, and the sign-in
      actions are pinned to the bottom where a thumb reaches.

      It stays mounted and is driven by a class so it animates both open and
      closed; the inert attribute keeps the hidden state out of the tab order
      and the accessibility tree.
    -->
    <div
      class="nav-scrim lg:hidden"
      [class.is-open]="isMobileMenuOpen()"
      (click)="closeMobileMenu()"
      aria-hidden="true"
    ></div>

    <aside
      id="mobile-menu"
      class="nav-drawer lg:hidden"
      [class.is-open]="isMobileMenuOpen()"
      [attr.inert]="isMobileMenuOpen() ? null : ''"
      role="dialog"
      aria-modal="true"
      aria-label="Main menu"
    >
      <div class="nav-drawer-head">
        @if (auth.isAuthenticated()) {
          <div class="nav-user">
            <span class="nav-avatar" aria-hidden="true">{{ userInitials() }}</span>
            <span class="nav-user-text">
              <span class="nav-user-name">{{ auth.currentUser()?.name || 'Your account' }}</span>
              <span class="nav-user-role">{{ auth.userRole() }}</span>
            </span>
          </div>
        } @else {
          <div class="nav-user-text">
            <span class="nav-drawer-eyebrow">Menu</span>
            <span class="nav-user-name">KaziKonnect</span>
          </div>
        }
        <button type="button" class="nav-drawer-close" (click)="closeMobileMenu()" aria-label="Close menu">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <nav class="nav-drawer-body">
        @if (!auth.isAuthenticated()) {
          <p class="nav-section" id="grp-explore">Explore</p>
          <a class="nav-row" routerLink="/worker/dashboard" (click)="closeMobileMenu()">
            <mat-icon class="nav-row-icon">work</mat-icon>
            <span class="nav-row-label">Find Jobs</span>
            <mat-icon class="nav-row-chevron">chevron_right</mat-icon>
          </a>
          <a class="nav-row" routerLink="/client/marketplace" (click)="closeMobileMenu()">
            <mat-icon class="nav-row-icon">groups</mat-icon>
            <span class="nav-row-label">Hire Workers</span>
            <mat-icon class="nav-row-chevron">chevron_right</mat-icon>
          </a>
          <a class="nav-row" routerLink="/enterprise" routerLinkActive="is-active" (click)="closeMobileMenu()">
            <mat-icon class="nav-row-icon">corporate_fare</mat-icon>
            <span class="nav-row-label">For Business</span>
            <mat-icon class="nav-row-chevron">chevron_right</mat-icon>
          </a>
          <a class="nav-row" routerLink="/solutions" routerLinkActive="is-active" (click)="closeMobileMenu()">
            <mat-icon class="nav-row-icon">route</mat-icon>
            <span class="nav-row-label">How it Works</span>
            <mat-icon class="nav-row-chevron">chevron_right</mat-icon>
          </a>

          <!--
            These jump to sections of the landing page. They previously pointed
            at "about" and "contact", neither of which is an id that exists in
            landing.html, so both were dead links — the targets below are the
            page's actual section landmarks.
          -->
          <p class="nav-section">On the home page</p>
          <a class="nav-row" [routerLink]="['/']" fragment="features" (click)="closeMobileMenu()">
            <mat-icon class="nav-row-icon">info</mat-icon>
            <span class="nav-row-label">Why Kazi Konnect</span>
            <mat-icon class="nav-row-chevron">arrow_downward</mat-icon>
          </a>
          <a class="nav-row" [routerLink]="['/']" fragment="how-it-works" (click)="closeMobileMenu()">
            <mat-icon class="nav-row-icon">layers</mat-icon>
            <span class="nav-row-label">Platform overview</span>
            <mat-icon class="nav-row-chevron">arrow_downward</mat-icon>
          </a>
          <a class="nav-row" [routerLink]="['/']" fragment="testimonials" (click)="closeMobileMenu()">
            <mat-icon class="nav-row-icon">reviews</mat-icon>
            <span class="nav-row-label">Reviews</span>
            <mat-icon class="nav-row-chevron">arrow_downward</mat-icon>
          </a>
          <a class="nav-row" [routerLink]="['/']" fragment="faq" (click)="closeMobileMenu()">
            <mat-icon class="nav-row-icon">help</mat-icon>
            <span class="nav-row-label">FAQ</span>
            <mat-icon class="nav-row-chevron">arrow_downward</mat-icon>
          </a>
        } @else if (navSections.length) {
          <!--
            The host dashboard's own navigation, so the drawer offers every
            destination its desktop sidebar does. Previously the drawer showed a
            fixed handful of links, which meant a client on a phone had no route
            to their wallet or disputes, and an admin had no mobile route at all
            to nine of eleven sections.
          -->
          @for (section of navSections; track section.label) {
            <p class="nav-section">{{ section.label }}</p>
            @for (item of section.items; track item.path) {
              @if (item.locked) {
                <!-- Gated destinations stay visible with the reason inline. The
                     desktop sidebar explained these in a hover tooltip, which a
                     touch device can never show. -->
                <div class="nav-row is-locked">
                  <mat-icon class="nav-row-icon">{{ item.icon }}</mat-icon>
                  <span class="nav-row-label">
                    {{ item.label }}
                    @if (item.lockReason) {
                      <span class="nav-row-hint">{{ item.lockReason }}</span>
                    }
                  </span>
                  <mat-icon class="nav-row-chevron">lock</mat-icon>
                </div>
              } @else {
                <a class="nav-row"
                   [routerLink]="item.path"
                   routerLinkActive="is-active"
                   [routerLinkActiveOptions]="{ exact: !!item.exact }"
                   (click)="closeMobileMenu()">
                  <mat-icon class="nav-row-icon">{{ item.icon }}</mat-icon>
                  <span class="nav-row-label">{{ item.label }}</span>
                  @if (item.badge) {
                    <span class="nav-row-badge" [ngClass]="'tone-' + (item.badgeTone || 'brand')">{{ item.badge }}</span>
                  } @else {
                    <mat-icon class="nav-row-chevron">chevron_right</mat-icon>
                  }
                </a>
              }
            }
          }
        } @else {
          <p class="nav-section">Your workspace</p>
          <a class="nav-row" [routerLink]="getDashboardPath()" routerLinkActive="is-active" (click)="closeMobileMenu()">
            <mat-icon class="nav-row-icon">home</mat-icon>
            <span class="nav-row-label">Dashboard</span>
            <mat-icon class="nav-row-chevron">chevron_right</mat-icon>
          </a>

          <a class="nav-row" [routerLink]="getMessagesPath()" routerLinkActive="is-active" (click)="closeMobileMenu()">
            <mat-icon class="nav-row-icon">chat_bubble</mat-icon>
            <span class="nav-row-label">Messages</span>
            @if (state.unreadMessagesCount() > 0) {
              <span class="nav-row-badge tone-brand">{{ state.unreadMessagesCount() > 9 ? '9+' : state.unreadMessagesCount() }}</span>
            } @else {
              <mat-icon class="nav-row-chevron">chevron_right</mat-icon>
            }
          </a>

          <p class="nav-section">Account</p>
          <a class="nav-row" [routerLink]="getSettingsPath()" routerLinkActive="is-active" (click)="closeMobileMenu()">
            <mat-icon class="nav-row-icon">settings</mat-icon>
            <span class="nav-row-label">Account Settings</span>
            <mat-icon class="nav-row-chevron">chevron_right</mat-icon>
          </a>
        }
      </nav>

      <div class="nav-drawer-foot">
        @if (auth.isAuthenticated()) {
          <button type="button" class="nav-cta nav-cta--danger" (click)="logoutAndCloseMenu()">
            <mat-icon class="nav-row-icon">logout</mat-icon>
            Log Out
          </button>
        } @else {
          <a class="nav-cta nav-cta--primary" routerLink="/register" (click)="closeMobileMenu()">Sign Up</a>
          <a class="nav-cta nav-cta--ghost" routerLink="/login" (click)="closeMobileMenu()">Log In</a>
        }
      </div>
    </aside>
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

    /* ── Hamburger ─────────────────────────────────────────────────────────
       Three bars that rotate into a cross. The outer bars translate to the
       centre line and rotate; the middle one fades and contracts, so the
       transition reads as a fold rather than a swap. */
    .nav-burger {
      display: grid;
      place-items: center;
      width: 2.6rem;
      height: 2.6rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.8rem;
      background: #fff;
      cursor: pointer;
      transition: background 0.18s ease, border-color 0.18s ease;
    }
    .nav-burger:hover { background: #f8fafc; border-color: #cbd5e1; }
    .nav-burger:focus-visible { outline: 2px solid var(--brand-teal, #29b2c7); outline-offset: 2px; }

    .nav-burger-box { position: relative; width: 1.15rem; height: 0.8rem; }
    .nav-burger-bar {
      position: absolute;
      left: 0;
      width: 100%;
      height: 2px;
      border-radius: 999px;
      background: #334155;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease, top 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .nav-burger-bar:nth-child(1) { top: 0; }
    .nav-burger-bar:nth-child(2) { top: calc(50% - 1px); }
    .nav-burger-bar:nth-child(3) { top: calc(100% - 2px); }

    .nav-burger.is-open .nav-burger-bar { background: var(--brand-teal, #29b2c7); }
    .nav-burger.is-open .nav-burger-bar:nth-child(1) { top: calc(50% - 1px); transform: rotate(45deg); }
    .nav-burger.is-open .nav-burger-bar:nth-child(2) { opacity: 0; transform: scaleX(0.2); }
    .nav-burger.is-open .nav-burger-bar:nth-child(3) { top: calc(50% - 1px); transform: rotate(-45deg); }

    /* ── Drawer ────────────────────────────────────────────────────────── */
    .nav-scrim {
      position: fixed;
      inset: 0;
      z-index: 100000;
      background: rgba(15, 23, 42, 0.5);
      backdrop-filter: blur(2px);
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.28s ease, visibility 0.28s ease;
    }
    .nav-scrim.is-open { opacity: 1; visibility: visible; }

    .nav-drawer {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      z-index: 100001;
      display: flex;
      flex-direction: column;
      width: 87%;
      max-width: 21rem;
      background: #fff;
      border-radius: 1.25rem 0 0 1.25rem;
      box-shadow: -20px 0 60px -20px rgba(15, 23, 42, 0.4);
      transform: translateX(100%);
      transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .nav-drawer.is-open { transform: translateX(0); }

    .nav-drawer-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 1.1rem 1.15rem;
      border-bottom: 1px solid #eef2f7;
    }

    .nav-user { display: flex; align-items: center; gap: 0.7rem; min-width: 0; }
    .nav-avatar {
      display: grid;
      place-items: center;
      width: 2.5rem;
      height: 2.5rem;
      flex: none;
      border-radius: 50%;
      background: var(--brand-teal, #29b2c7);
      color: #fff;
      font-size: 0.8rem;
      font-weight: 900;
    }
    .nav-user-text { display: flex; flex-direction: column; min-width: 0; }
    .nav-drawer-eyebrow {
      font-size: 0.6rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.22em;
      color: #94a3b8;
    }
    .nav-user-name {
      font-size: 0.95rem;
      font-weight: 800;
      color: #0f172a;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .nav-user-role {
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--brand-teal, #29b2c7);
    }

    .nav-drawer-close {
      display: grid;
      place-items: center;
      width: 2.3rem;
      height: 2.3rem;
      flex: none;
      border: 0;
      border-radius: 0.7rem;
      background: #f1f5f9;
      color: #475569;
      cursor: pointer;
      transition: background 0.18s ease, color 0.18s ease;
    }
    .nav-drawer-close:hover { background: #e2e8f0; color: #0f172a; }
    .nav-drawer-close mat-icon { font-size: 1.25rem !important; width: auto !important; height: auto !important; }

    .nav-drawer-body {
      flex: 1;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      padding: 0.75rem 0.7rem 1rem;
    }

    .nav-section {
      margin: 0.9rem 0 0.4rem;
      padding: 0 0.55rem;
      font-size: 0.6rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: #a8b4c4;
    }
    .nav-section:first-child { margin-top: 0.2rem; }

    .nav-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 0.55rem;
      border-radius: 0.8rem;
      text-decoration: none;
      color: #0f172a;
      font-size: 0.9rem;
      font-weight: 700;
      transition: background 0.16s ease, color 0.16s ease;
    }
    .nav-row:hover { background: #f6f8fa; }
    .nav-row:active { background: #eef2f7; }

    /* Current route: teal wash plus a leading rule, so position is obvious at a
       glance without relying on colour alone. */
    .nav-row.is-active {
      background: var(--brand-teal-soft, #eaf7f9);
      color: var(--brand-teal-dark, #1f8999);
      box-shadow: inset 3px 0 0 var(--brand-teal, #29b2c7);
    }
    .nav-row.is-active .nav-row-icon { color: var(--brand-teal, #29b2c7); }

    .nav-row-label { flex: 1; min-width: 0; }

    .nav-row-icon {
      flex: none;
      color: #94a3b8;
      font-size: 1.3rem !important;
      width: auto !important;
      height: auto !important;
    }
    .nav-row-chevron {
      flex: none;
      color: #cbd5e1;
      font-size: 1.15rem !important;
      width: auto !important;
      height: auto !important;
    }

    .nav-row-badge {
      flex: none;
      min-width: 1.3rem;
      padding: 0.1rem 0.4rem;
      border-radius: 999px;
      background: var(--brand-teal, #29b2c7);
      color: #fff;
      font-size: 0.65rem;
      font-weight: 900;
      text-align: center;
    }
    .nav-row-badge.tone-warn { background: #f59e0b; }
    .nav-row-badge.tone-ok { background: #16a34a; }
    .nav-row-badge.tone-danger { background: #e11d48; }

    /* Gated row: dimmed and inert, with the requirement spelled out beneath the
       label rather than hidden in a hover tooltip. */
    .nav-row.is-locked { opacity: 0.55; cursor: not-allowed; }
    .nav-row.is-locked:hover { background: transparent; }
    .nav-row-hint {
      display: block;
      margin-top: 0.15rem;
      font-size: 0.66rem;
      font-weight: 600;
      line-height: 1.3;
      color: #94a3b8;
      white-space: normal;
    }

    /* ── Mobile bottom bar ─────────────────────────────────────────────────
       Five equal slots, so at 320px each gets 64px — wide enough for a 20px
       icon and a 9px uppercase label without clipping. "min-width: 0" on the
       slots plus ellipsis on the label means a longer word degrades to a
       trimmed word instead of widening the bar. */
    .mobile-bar {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 90;
      display: flex;
      align-items: stretch;
      gap: 0.1rem;
      padding: 0.3rem 0.25rem;
      padding-bottom: calc(0.3rem + env(safe-area-inset-bottom, 0px));
      background: rgba(255, 255, 255, 0.97);
      backdrop-filter: blur(12px);
      border-top: 1px solid #e2e8f0;
      box-shadow: 0 -8px 40px -24px rgba(15, 23, 42, 0.15);
    }

    .mobile-bar-item {
      flex: 1 1 0;
      min-width: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.1rem;
      padding: 0.3rem 0.1rem;
      border: 0;
      border-radius: 0.7rem;
      background: none;
      color: #64748b;
      font-family: inherit;
      text-decoration: none;
      cursor: pointer;
      transition: color 0.16s ease, background 0.16s ease;
    }
    .mobile-bar-item:active { background: #f1f5f9; }
    .mobile-bar-item.is-active { color: var(--brand-teal, #29b2c7); background: var(--brand-teal-soft, #eaf7f9); }
    .mobile-bar-item.is-locked { opacity: 0.4; pointer-events: none; }
    .mobile-bar-item:focus-visible { outline: 2px solid var(--brand-teal, #29b2c7); outline-offset: -2px; }

    .mobile-bar-icon-wrap { position: relative; display: grid; place-items: center; }
    .mobile-bar-icon {
      font-size: 1.25rem !important;
      width: 1.25rem !important;
      height: 1.25rem !important;
    }
    .mobile-bar-dot {
      position: absolute;
      top: -1px;
      right: -3px;
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      border: 2px solid #fff;
      background: var(--brand-teal, #29b2c7);
    }
    .mobile-bar-dot.tone-warn { background: #f59e0b; }
    .mobile-bar-dot.tone-ok { background: #16a34a; }
    .mobile-bar-dot.tone-danger { background: #e11d48; }
    .mobile-bar-dot-icon {
      position: absolute;
      top: -4px;
      right: -6px;
      font-size: 0.7rem !important;
      width: 0.7rem !important;
      height: 0.7rem !important;
      color: #f59e0b;
    }

    .mobile-bar-label {
      max-width: 100%;
      font-size: 0.5625rem;
      font-weight: 900;
      line-height: 1.1;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .nav-drawer-foot {
      display: grid;
      gap: 0.55rem;
      padding: 0.9rem 1.15rem;
      padding-bottom: calc(0.9rem + env(safe-area-inset-bottom, 0px));
      border-top: 1px solid #eef2f7;
      background: #fff;
    }

    .nav-cta {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      height: 2.9rem;
      border: 1px solid transparent;
      border-radius: 999px;
      font-family: inherit;
      font-size: 0.72rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      text-decoration: none;
      cursor: pointer;
      transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
    }
    .nav-cta--primary { background: var(--brand-teal, #29b2c7); color: #fff; }
    .nav-cta--primary:hover { background: var(--brand-teal-dark, #1f8999); }
    .nav-cta--ghost { background: #fff; color: var(--brand-teal, #29b2c7); border-color: var(--brand-teal, #29b2c7); }
    .nav-cta--ghost:hover { background: var(--brand-teal-soft, #eaf7f9); }
    .nav-cta--danger { background: #fff1f2; color: #be123c; border-color: #fecdd3; }
    .nav-cta--danger:hover { background: #ffe4e6; }
    .nav-cta--danger .nav-row-icon { color: #be123c; }

    @media (prefers-reduced-motion: reduce) {
      .nav-drawer, .nav-scrim, .nav-burger-bar { transition-duration: 0.01ms; }
    }
  `]
})
export class NavbarComponent implements OnInit, OnDestroy {
  @Input() showHireTalent = true;
  @Input() showMessages = true;
  @Input() pageTitle = '';
  @Input() bottomNavHeight = 64;
  @Input() badge = '';

  /**
   * The host dashboard's navigation. Drives both the hamburger drawer and the
   * mobile bottom bar, so a layout declares its destinations once and cannot
   * end up with a sidebar and a mobile bar that disagree.
   */
  @Input() set navSections(value: AppNavSection[]) {
    this._navSections = value ?? [];
    this.bottomItems.set(bottomNavItems(this._navSections));
  }
  get navSections(): AppNavSection[] {
    return this._navSections;
  }
  private _navSections: AppNavSection[] = [];

  /** Public marketing pages have no bottom bar. */
  @Input() showBottomNav = true;

  auth = inject(AuthService);
  state = inject(PlatformStateService);
  ws = inject(WebSocketService);
  router = inject(Router);

  isMobileMenuOpen = signal(false);
  isScrolled = signal(false);
  bottomItems = signal<AppNavItem[]>([]);
  private routerSubscription?: Subscription;

  unreadNotificationsCount = signal(0);

  ngOnInit() {
    if (typeof window !== 'undefined') {
      // Scroll is observed through the @HostListener below rather than a manual
      // addEventListener: the previous pairing passed a fresh `.bind(this)` to
      // both add and remove, so the listener was registered twice over and
      // never actually detached on destroy.
      this.routerSubscription = this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe(() => this.closeMobileMenu());
    }

    // Update notification count for workers (pending job requests)
    if (this.auth.userRole() === 'Worker') {
      this.unreadNotificationsCount.set(this.state.workerBookings().filter(b => b.status === 'Pending').length);
    }
  }

  ngOnDestroy() {
    this.routerSubscription?.unsubscribe();
    // Never leave the page unscrollable if the drawer was open at teardown.
    this.setScrollLock(false);
  }

  @HostListener('window:scroll')
  handleScroll() {
    this.isScrolled.set(window.scrollY > 10);
  }

  /** Escape closes the drawer, as expected of anything modal. */
  @HostListener('document:keydown.escape')
  onEscapeKey() {
    this.closeMobileMenu();
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(v => !v);
    this.setScrollLock(this.isMobileMenuOpen());
  }

  closeMobileMenu() {
    if (!this.isMobileMenuOpen()) return;
    this.isMobileMenuOpen.set(false);
    this.setScrollLock(false);
  }

  private setScrollLock(locked: boolean) {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = locked ? 'hidden' : '';
  }

  /** Up to two letters for the drawer avatar: first and last name where given. */
  userInitials(): string {
    const name = this.auth.currentUser()?.name?.trim();
    if (!name) return '?';
    const parts = name.split(/\s+/).filter(Boolean);
    const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2);
    return letters.toUpperCase();
  }

  logout() {
    this.auth.logout();
    this.closeMobileMenu();
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