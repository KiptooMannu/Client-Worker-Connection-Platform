import { Component, inject, signal } from '@angular/core';
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
    <header class="bg-white text-slate-900 border-b border-slate-100 shadow-sm flex justify-between items-center px-4 sm:px-6 md:px-12 h-20 w-full sticky top-0 z-50 backdrop-blur-md bg-white/90 gap-4">
      <div class="flex items-center gap-6 md:gap-12 min-w-0">
        <div class="flex items-center gap-3 cursor-pointer group" routerLink="/">
          <div class="w-10 h-10 bg-[#0f172a] rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
            <mat-icon>corporate_fare</mat-icon>
          </div>
          <span class="text-2xl font-black tracking-tighter text-[#0f172a] hidden sm:block">Kazi Konnect</span>
        </div>
        
        <!-- Desktop Nav -->
        <nav class="hidden lg:flex items-center gap-8">
          @if (auth.userRole() === 'Worker') {
            <a routerLink="/worker/dashboard" routerLinkActive="active-link" 
               class="text-sm font-black text-slate-500 hover:text-[#041627] transition-all py-2 border-b-2 border-transparent hover:border-slate-200 cursor-pointer">
              Find Work
            </a>
          }
          <a routerLink="/client/marketplace" routerLinkActive="active-link" 
             class="text-sm font-black text-slate-500 hover:text-[#041627] transition-all py-2 border-b-2 border-transparent hover:border-slate-200 cursor-pointer">
            Hire Talent
          </a>
          @if (router.url === '/' && !auth.isAuthenticated()) {
            <a routerLink="/enterprise" routerLinkActive="active-link" 
               class="text-sm font-black text-slate-500 hover:text-[#041627] transition-all py-2 border-b-2 border-transparent hover:border-slate-200 cursor-pointer">
              Enterprise
            </a>
            <a routerLink="/solutions" routerLinkActive="active-link" 
               class="text-sm font-black text-slate-500 hover:text-[#041627] transition-all py-2 border-b-2 border-transparent hover:border-slate-200 cursor-pointer">
              Solutions
            </a>
          }
          <a [routerLink]="auth.isAuthenticated() ? (auth.userRole() === 'Admin' ? '/admin/messages' : (auth.userRole() === 'Worker' ? '/worker/messages' : '/client/messages')) : '/login'"
             routerLinkActive="active-link"
             class="text-sm font-black text-slate-500 hover:text-[#041627] transition-all py-2 border-b-2 border-transparent hover:border-slate-200 cursor-pointer flex items-center gap-2">
            Messages
            @if (state.unreadMessagesCount() > 0) {
              <span class="px-2 py-0.5 bg-blue-600 text-white text-[9px] rounded-full">{{ state.unreadMessagesCount() }}</span>
            }
          </a>
          
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
      </div>

      <div class="flex items-center gap-2 sm:gap-3 md:gap-6 shrink-0">
        @if (auth.isAuthenticated()) {
          <div class="flex items-center gap-2 sm:gap-4">
             <div class="hidden xl:flex flex-col items-end mr-2">
                <span class="text-[10px] font-black text-blue-600 uppercase tracking-widest">{{ auth.userRole() }}</span>
                <span class="text-xs font-bold text-slate-900">{{ auth.currentUser()?.name }}</span>
             </div>
             
             <!-- Notification Bell -->
             <button mat-icon-button [matMenuTriggerFor]="notifMenu" class="!bg-slate-50 !rounded-xl hover:!bg-slate-100 transition-colors cursor-pointer relative !w-10 !h-10">
               <span class="text-base leading-none">🔔</span>
               @if (state.unreadNotificationsCount() > 0) {
                 <span class="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black leading-4 text-center">
                   {{ state.unreadNotificationsCount() > 99 ? '99+' : state.unreadNotificationsCount() }}
                 </span>
               }
             </button>

             <mat-menu #notifMenu="matMenu" class="!rounded-2xl !mt-4 !shadow-2xl border border-slate-100 overflow-hidden">
               <div class="w-80 max-h-[400px] flex flex-col">
                 <div class="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <span class="text-[10px] font-black uppercase tracking-widest text-slate-900">Notifications</span>
                   <button (click)="state.markAllNotificationsAsRead()" class="text-[9px] font-black uppercase text-blue-600 hover:underline">Mark all read</button>
                 </div>
                 
                 <div class="overflow-y-auto">
                   @if (state.workerNotifications().length === 0) {
                     <div class="p-10 text-center">
                        <mat-icon class="text-slate-200 !text-4xl !w-auto !h-auto mb-2">notifications_off</mat-icon>
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">No new alerts</p>
                     </div>
                   } @else {
                     @for (n of state.workerNotifications(); track n.id) {
                       <button mat-menu-item class="!h-auto !py-4 !px-6 hover:!bg-slate-50 border-b border-slate-50 last:border-0">
                         <div class="flex items-start gap-4">
                           <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                [ngClass]="{
                                  'bg-teal-50 text-teal-600': n.type === 'success',
                                  'bg-blue-50 text-blue-600': n.type === 'info',
                                  'bg-amber-50 text-amber-600': n.type === 'warning'
                                }">
                             <mat-icon class="!text-sm">{{ n.type === 'success' ? 'check_circle' : (n.type === 'warning' ? 'warning' : 'info') }}</mat-icon>
                           </div>
                           <div class="flex-1 min-w-0">
                             <p class="text-xs font-black text-slate-900 truncate">{{ n.title }}</p>
                             <p class="text-[10px] text-slate-500 font-medium line-clamp-2 mt-1">{{ n.message }}</p>
                             <span class="text-[8px] font-black text-slate-400 uppercase mt-2 block">{{ n.time }}</span>
                           </div>
                         </div>
                       </button>
                     }
                   }
                 </div>
               </div>
             </mat-menu>

            <button (click)="auth.logout()" class="hidden sm:block text-slate-600 hover:text-rose-600 transition-colors px-4 py-2 text-sm font-semibold active:scale-95 duration-150 cursor-pointer">
              Log Out
            </button>
            <button [routerLink]="auth.userRole() === 'Admin' ? '/admin' : (auth.userRole() === 'Worker' ? '/worker/dashboard' : '/client/marketplace')" 
                    class="bg-slate-900 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all active:scale-95 duration-150 cursor-pointer shadow-lg shadow-slate-200">
              Dashboard
            </button>
          </div>
        } @else {
          <div class="flex items-center gap-2 sm:gap-4">
            <button routerLink="/login" class="text-slate-600 font-black text-[10px] uppercase tracking-widest px-4 py-2 hover:text-[#041627] transition-colors cursor-pointer">Log In</button>
            <button routerLink="/register" class="bg-[#0f172a] text-white px-6 sm:px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-slate-900/10 cursor-pointer">Sign Up</button>
          </div>
        }

        <!-- Mobile Menu Toggle -->
        <button (click)="toggleMobileMenu()" class="lg:hidden p-2 text-slate-600 hover:text-slate-900 transition-colors">
          <mat-icon>{{ isMobileMenuOpen() ? 'close' : 'menu' }}</mat-icon>
        </button>
      </div>
    </header>

    <!-- Mobile Menu Overlay -->
    @if (isMobileMenuOpen()) {
      <div class="fixed inset-0 top-20 z-40 lg:hidden animate-in slide-in-from-top duration-300">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" (click)="toggleMobileMenu()"></div>
        <nav class="relative bg-white border-t border-slate-100 flex flex-col p-6 gap-4 shadow-2xl">
          @if (auth.userRole() === 'Worker') {
            <a routerLink="/worker/dashboard" (click)="toggleMobileMenu()" class="text-lg font-black text-slate-900 py-3 border-b border-slate-50">Find Work</a>
          }
          <a routerLink="/client/marketplace" (click)="toggleMobileMenu()" class="text-lg font-black text-slate-900 py-3 border-b border-slate-50">Hire Talent</a>
          
          @if (router.url === '/' && !auth.isAuthenticated()) {
            <a routerLink="/enterprise" (click)="toggleMobileMenu()" class="text-lg font-black text-slate-900 py-3 border-b border-slate-50">Enterprise</a>
            <a routerLink="/solutions" (click)="toggleMobileMenu()" class="text-lg font-black text-slate-900 py-3 border-b border-slate-50">Solutions</a>
          }

          <a [routerLink]="auth.isAuthenticated() ? (auth.userRole() === 'Admin' ? '/admin/messages' : (auth.userRole() === 'Worker' ? '/worker/messages' : '/client/messages')) : '/login'"
             (click)="toggleMobileMenu()"
             class="text-lg font-black text-slate-900 py-3 border-b border-slate-50 flex justify-between items-center">
            Messages
            @if (state.unreadMessagesCount() > 0) {
              <span class="px-3 py-1 bg-blue-600 text-white text-xs rounded-full">{{ state.unreadMessagesCount() }}</span>
            }
          </a>

          @if (auth.userRole() === 'Client') {
            <a routerLink="/client/bookings" (click)="toggleMobileMenu()" class="text-lg font-black text-slate-900 py-3 border-b border-slate-50">My Bookings</a>
          }
          @if (auth.userRole() === 'Worker') {
            <a routerLink="/worker/history" (click)="toggleMobileMenu()" class="text-lg font-black text-slate-900 py-3 border-b border-slate-50">My Jobs</a>
          }

          @if (auth.isAuthenticated()) {
            <button (click)="auth.logout(); toggleMobileMenu()" class="text-lg font-black text-rose-600 py-3 text-left">Log Out</button>
          }
        </nav>
      </div>
    }
  `,
  styles: [`
    .active-link { color: #0f172a !important; border-bottom-color: #0f172a !important; }
    :host { display: block; width: 100%; }
  `]
})
export class NavbarComponent {
  auth = inject(AuthService);
  state = inject(PlatformStateService);
  ws = inject(WebSocketService); // Initialize WebSocket connection
  router = inject(Router);
  
  isMobileMenuOpen = signal(false);

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(v => !v);
  }
}
