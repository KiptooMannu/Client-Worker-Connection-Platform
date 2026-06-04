import { Component, inject, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
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
    <header class="bg-white text-slate-900 border-b border-slate-100 shadow-sm fixed top-0 left-0 right-0 z-[99999] backdrop-blur-md bg-white/90">
      <div class="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 md:px-12 h-20 gap-8">
        <div class="flex items-center gap-4 md:gap-8 shrink-0">
          <a routerLink="/" class="flex items-center gap-3 group shrink-0">
            <div class="w-10 h-10 bg-brand-teal rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
              <mat-icon>corporate_fare</mat-icon>
            </div>
            <span class="text-xl font-black tracking-tighter text-brand-teal hidden xl:block">KaziKonnect</span>
          </a>

          <!-- Dynamic Context Title & Badge -->
          @if (pageTitle) {
          <div class="h-6 w-px bg-slate-200 hidden md:block"></div>
          <div class="flex items-center gap-3 min-w-0">
            <h1 class="text-sm font-black text-slate-900 uppercase tracking-widest truncate">{{ pageTitle }}</h1>
            @if (badge) {
              <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-[9px] font-black uppercase tracking-widest rounded-full shrink-0 border border-blue-100/50">
                <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                {{ badge === 'Client' || badge === 'client' ? 'Employer' : badge }}
              </span>
            }
          </div>
        }
      </div>

      <div class="flex-1 hidden lg:flex justify-center">
        @if (!pageTitle) {
          <nav class="flex items-center gap-10">
              @if (!auth.isAuthenticated() || auth.userRole() === 'Worker') {
                <a routerLink="/worker/dashboard" routerLinkActive="active-link" 
                   class="text-sm font-black text-slate-500 hover:text-[#041627] transition-all py-2 border-b-2 border-transparent hover:border-slate-200 cursor-pointer">
                  Find Jobs
                </a>
              }
              @if (!auth.isAuthenticated() || auth.userRole() === 'Client') {
                <a routerLink="/client/marketplace" routerLinkActive="active-link" 
                   class="text-sm font-black text-slate-500 hover:text-[#041627] transition-all py-2 border-b-2 border-transparent hover:border-slate-200 cursor-pointer">
                  Hire Workers
                </a>
              }
              @if (!auth.isAuthenticated()) {
                <a routerLink="/enterprise" routerLinkActive="active-link" 
                   class="text-sm font-black text-slate-500 hover-text-brand-teal transition-all py-2 border-b-2 border-transparent hover-border-brand-teal cursor-pointer">
                  For Business
                </a>
                <a routerLink="/solutions" routerLinkActive="active-link" 
                   class="text-sm font-black text-slate-500 hover-text-brand-teal transition-all py-2 border-b-2 border-transparent hover-border-brand-teal cursor-pointer">
                  How it Works
                </a>
              }
              @if (auth.userRole() === 'Client') {
                <a routerLink="/client/bookings" routerLinkActive="active-link"
                   class="text-sm font-black text-slate-500 hover:text-[#041627] transition-all py-2 cursor-pointer">
                  My Bookings
                </a>
              }
              @if (auth.userRole() === 'Worker') {
                <a routerLink="/worker/history" routerLinkActive="active-link"
                   class="text-sm font-black text-slate-500 hover:text-[#041627] transition-all py-2 cursor-pointer">
                  My Jobs
                </a>
              }
          </nav>
        }
      </div>

      <div class="flex items-center gap-2 sm:gap-3 md:gap-4 shrink-0">
        @if (auth.isAuthenticated()) {
             <!-- Notifications & Messages Icons (Always Visible when logged in) -->
             <!-- Notifications & Messages Icons (Always Visible when logged in) -->
             <div class="flex items-center gap-1 sm:gap-2 mr-1 sm:mr-2 border-r border-slate-100 pr-2 sm:pr-4">
               <button class="relative p-1.5 sm:p-2 text-slate-400 hover:text-slate-900 transition-colors rounded-full hover:bg-slate-50 cursor-pointer">
                 <mat-icon class="!text-xl sm:!text-2xl">notifications_none</mat-icon>
               </button>
               
               @if (showMessages) {
                 <button [routerLink]="auth.userRole() === 'Admin' ? '/admin/messages' : (auth.userRole() === 'Worker' ? '/worker/messages' : '/client/messages')" 
                         class="hidden lg:inline-flex relative p-1.5 sm:p-2 text-slate-400 hover:text-slate-900 transition-colors rounded-full hover:bg-slate-50 cursor-pointer"
                         aria-label="Messages">
                   <mat-icon class="!text-xl sm:!text-2xl">chat_bubble_outline</mat-icon>
                   @if (state.unreadMessagesCount() > 0) {
                     <span class="absolute top-1 right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-blue-600 text-white text-[8px] sm:text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white">
                       {{ state.unreadMessagesCount() }}
                     </span>
                   }
                 </button>
               }
             </div>

             <!-- Unified Profile Menu -->
             <button [matMenuTriggerFor]="profileMenu" class="flex items-center gap-3 p-1.5 hover:bg-slate-50 rounded-xl transition-all cursor-pointer">
               <div class="hidden xl:flex flex-col items-end">
                  <span class="text-[9px] font-black text-blue-600 uppercase tracking-widest leading-none mb-1">{{ auth.userRole() === 'Client' ? 'Employer' : auth.userRole() }}</span>
                  <span class="text-xs font-bold text-slate-900 leading-none">{{ auth.currentUser()?.name }}</span>
               </div>
               <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                 @if (auth.currentUser()?.avatarUrl) {
                   <img [src]="auth.currentUser()?.avatarUrl" class="w-full h-full object-cover">
                 } @else {
                   <div class="w-full h-full bg-[#0f172a] text-white text-xs font-black flex items-center justify-center uppercase">
                     {{ auth.currentUser()?.name?.charAt(0) }}
                   </div>
                 }
               </div>
               <mat-icon class="text-slate-400 !text-sm !w-auto !h-auto">expand_more</mat-icon>
             </button>

             <mat-menu #profileMenu="matMenu" class="!rounded-2xl !mt-4 !shadow-2xl border border-slate-100 overflow-hidden min-w-[200px]">
               <div class="p-5 border-b border-slate-50 bg-slate-50/30">
                 <p class="text-xs font-black text-slate-900 uppercase tracking-tight">{{ auth.currentUser()?.name }}</p>
                 <p class="text-[10px] text-slate-500 font-medium">{{ auth.currentUser()?.email }}</p>
               </div>
               
               <button mat-menu-item [routerLink]="auth.userRole() === 'Admin' ? '/admin' : (auth.userRole() === 'Worker' ? '/worker/dashboard' : '/client/marketplace')" class="!h-12">
                 <mat-icon class="text-slate-500">dashboard</mat-icon>
                 <span class="text-xs font-bold text-slate-700">Dashboard</span>
               </button>
               
               @if (auth.userRole() === 'Worker') {
                 <button mat-menu-item routerLink="/worker/profile" class="!h-12">
                   <mat-icon class="text-slate-500">person_edit</mat-icon>
                   <span class="text-xs font-bold text-slate-700">Edit Profile</span>
                 </button>
               }

               <button mat-menu-item [routerLink]="getSettingsPath()" class="!h-12">
                 <mat-icon class="text-slate-500">settings</mat-icon>
                 <span class="text-xs font-bold text-slate-700">Account Settings</span>
               </button>

               <div class="h-px bg-slate-50 my-1"></div>
               
               <button mat-menu-item (click)="auth.logout()" class="!h-12 !text-rose-600">
                 <mat-icon class="text-rose-600">logout</mat-icon>
                 <span class="text-xs font-bold">Log Out</span>
               </button>
             </mat-menu>
         } @else {
           <div class="hidden lg:flex items-center gap-2 sm:gap-4">
             <button routerLink="/login" class="text-brand-teal font-black text-[10px] uppercase tracking-widest px-4 py-2 border border-brand-teal rounded-xl hover-bg-brand-teal-soft transition-colors cursor-pointer">Log In</button>
             <button routerLink="/register" class="bg-brand-teal text-white px-6 sm:px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-brand-teal cursor-pointer">Sign Up</button>
           </div>
         }

        <!-- Mobile Menu Toggle -->
        <button (click)="toggleMobileMenu()" class="lg:hidden p-2 text-slate-600 hover:text-slate-900 transition-colors">
          <mat-icon>{{ isMobileMenuOpen() ? 'close' : 'menu' }}</mat-icon>
        </button>
      </div>
      </div>
    </header>

    <!-- Spacer for fixed header so page content starts below the top navbar -->
    <div class="h-20"></div>

    @if (auth.isAuthenticated()) {
      <nav class="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-slate-200 bg-white/95 backdrop-blur-md px-4 py-2 shadow-[0_-8px_40px_-24px_rgba(15,23,42,0.45)]" [style.--bottom-nav-height]="bottomNavHeight + 'px'">
        <div class="flex items-center justify-between">
          <button [routerLink]="auth.userRole() === 'Admin' ? '/admin' : (auth.userRole() === 'Worker' ? '/worker/dashboard' : '/client/marketplace')" class="flex flex-col items-center justify-center text-slate-600 hover:text-slate-900 transition-colors">
            <mat-icon class="!text-lg">home</mat-icon>
            <span class="text-[9px] font-black uppercase tracking-[0.22em] mt-1">Home</span>
          </button>
          <button [routerLink]="auth.userRole() === 'Admin' ? '/admin/messages' : (auth.userRole() === 'Worker' ? '/worker/messages' : '/client/messages')" 
                  class="flex flex-col items-center justify-center text-slate-600 hover:text-slate-900 transition-colors relative">
            <mat-icon class="!text-lg">chat_bubble_outline</mat-icon>
            @if (state.unreadMessagesCount() > 0) {
              <span class="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white">{{ state.unreadMessagesCount() }}</span>
            }
            <span class="text-[9px] font-black uppercase tracking-[0.22em] mt-1">Chat</span>
          </button>
          <button [routerLink]="getSettingsPath()" class="flex flex-col items-center justify-center text-slate-600 hover:text-slate-900 transition-colors">
            <mat-icon class="!text-lg">account_circle</mat-icon>
            <span class="text-[9px] font-black uppercase tracking-[0.22em] mt-1">Profile</span>
          </button>
        </div>
      </nav>

      <div class="lg:hidden" [style.height.px]="bottomNavHeight"></div>
    }

    <!-- Mobile Menu Overlay -->
    @if (isMobileMenuOpen()) {
      <div class="fixed inset-0 top-20 z-50 lg:hidden animate-in slide-in-from-top duration-300">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" (click)="toggleMobileMenu()"></div>
        <nav class="relative bg-brand-teal border-t border-brand-teal flex flex-col p-6 gap-5 shadow-2xl mobile-menu-nav">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-[11px] uppercase tracking-[0.35em] text-white/80 font-black mb-1">Menu</p>
              <h2 class="text-2xl font-black text-white">Kazi Konnect</h2>
            </div>
            <button (click)="toggleMobileMenu()" class="text-white/80 hover:text-white transition-colors">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          <div class="grid gap-3">
            <a [routerLink]="['/']" fragment="about" (click)="toggleMobileMenu()" class="text-lg font-black text-white py-4 px-4 rounded-3xl bg-white/10 border border-white/15 hover:bg-white/15 transition-all">About Us</a>
            <a [routerLink]="['/']" fragment="faq" (click)="toggleMobileMenu()" class="text-lg font-black text-white py-4 px-4 rounded-3xl bg-white/10 border border-white/15 hover:bg-white/15 transition-all">Frequently Asked Questions</a>
            <a [routerLink]="['/']" fragment="contact" (click)="toggleMobileMenu()" class="text-lg font-black text-white py-4 px-4 rounded-3xl bg-white/10 border border-white/15 hover:bg-white/15 transition-all">Contact Us</a>
            <div class="h-px bg-white/20 my-1.5"></div>
          </div>
          @if (!auth.isAuthenticated() || auth.userRole() === 'Worker') {
            <a routerLink="/worker/dashboard" (click)="toggleMobileMenu()" class="text-lg font-black text-white py-3 border-b border-white/10">Find Jobs</a>
          }
          @if (!auth.isAuthenticated() || auth.userRole() === 'Client') {
            <a routerLink="/client/marketplace" (click)="toggleMobileMenu()" class="text-lg font-black text-white py-3 border-b border-white/10">Hire Workers</a>
          }
          
          @if (!auth.isAuthenticated()) {
            <a routerLink="/enterprise" (click)="toggleMobileMenu()" class="text-lg font-black text-white py-3 border-b border-white/10">For Business</a>
            <a routerLink="/solutions" (click)="toggleMobileMenu()" class="text-lg font-black text-white py-3 border-b border-white/10">How it Works</a>
            <a routerLink="/login" (click)="toggleMobileMenu()" class="text-lg font-black text-white py-3 border-b border-white/10">Log In</a>
            <a routerLink="/register" (click)="toggleMobileMenu()" class="text-lg font-black text-white py-3 border-b border-white/10">Sign Up</a>
          }

          @if (auth.userRole() === 'Client') {
            <a routerLink="/client/bookings" (click)="toggleMobileMenu()" class="text-lg font-black text-white py-3 border-b border-white/10">My Bookings</a>
          }
          @if (auth.userRole() === 'Worker') {
            <a routerLink="/worker/history" (click)="toggleMobileMenu()" class="text-lg font-black text-white py-3 border-b border-white/10">My Jobs</a>
          }

          @if (auth.isAuthenticated()) {
            <button (click)="auth.logout(); toggleMobileMenu()" class="text-lg font-black text-rose-600 py-3 text-left">Log Out</button>
          }
        </nav>
      </div>
    }
  `,
  styles: [`
    .active-link { color: var(--brand-teal) !important; border-bottom-color: var(--brand-teal) !important; }
    :host { display: block; width: 100%; }
  `]
})
export class NavbarComponent {
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

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(v => !v);
  }

  getSettingsPath(): string {
    const role = this.auth.userRole();
    if (role === 'Admin') return '/admin/settings';
    if (role === 'Worker') return '/worker/settings';
    return '/client/settings';
  }
}










