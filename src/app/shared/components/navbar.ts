import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../../core/services/auth.service';
import { PlatformStateService } from '../../core/services/platform-state.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    RouterLinkActive, 
    MatIconModule, 
    MatButtonModule, 
    MatMenuModule, 
    MatBadgeModule
  ],
  template: `
    <header class="bg-white text-slate-900 border-b border-slate-100 shadow-sm flex justify-between items-center px-6 md:px-12 h-20 w-full sticky top-0 z-50 backdrop-blur-md bg-white/90">
      <div class="flex items-center gap-12">
        <div class="flex items-center gap-3 cursor-pointer group" routerLink="/">
          <div class="w-10 h-10 bg-[#041627] rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
            <mat-icon>corporate_fare</mat-icon>
          </div>
          <span class="text-2xl font-black tracking-tighter text-[#041627]">ProMarket</span>
        </div>
        
        <nav class="hidden md:flex items-center gap-8">
          @if (auth.userRole() === 'Client' || !auth.isAuthenticated()) {
            <a routerLink="/client/marketplace" routerLinkActive="active-link" 
               class="text-sm font-black text-slate-500 hover:text-[#041627] transition-all py-2 border-b-2 border-transparent hover:border-slate-200 cursor-pointer">
              Find Talent
            </a>
          }
          @if (auth.userRole() === 'Worker') {
            <a routerLink="/worker/dashboard" routerLinkActive="active-link" 
               class="text-sm font-black text-slate-500 hover:text-[#041627] transition-all py-2 border-b-2 border-transparent hover:border-slate-200 cursor-pointer">
              My Dashboard
            </a>
          }
          @if (auth.userRole() === 'Client') {
            <a routerLink="/client/messages" routerLinkActive="active-link"
               class="text-sm font-black text-slate-500 hover:text-[#041627] transition-all py-2 cursor-pointer">
              Messages
            </a>
            <a routerLink="/client/bookings" routerLinkActive="active-link"
               class="text-sm font-black text-slate-500 hover:text-[#041627] transition-all py-2 cursor-pointer">
              My Bookings
            </a>
          }
          @if (auth.userRole() === 'Worker') {
            <a routerLink="/worker/messages" routerLinkActive="active-link"
               class="text-sm font-black text-slate-500 hover:text-[#041627] transition-all py-2 cursor-pointer">
              Messages
            </a>
            <a routerLink="/worker/history" routerLinkActive="active-link"
               class="text-sm font-black text-slate-500 hover:text-[#041627] transition-all py-2 cursor-pointer">
              My Jobs
            </a>
          }
        </nav>
      </div>

      <div class="flex items-center gap-6">
        @if (auth.isAuthenticated()) {
          <div class="flex items-center gap-4">
             <div class="hidden lg:flex flex-col items-end mr-2">
                <span class="text-[10px] font-black text-blue-600 uppercase tracking-widest">{{ auth.userRole() }}</span>
                <span class="text-xs font-bold text-slate-900">{{ auth.currentUser()?.name }}</span>
             </div>
             
             <!-- Notification Bell -->
             <button mat-icon-button [matMenuTriggerFor]="notifMenu" class="!bg-slate-50 !rounded-xl hover:!bg-slate-100 transition-colors cursor-pointer relative">
               <mat-icon [matBadge]="state.workerNotifications().length" 
                         [matBadgeHidden]="state.workerNotifications().length === 0"
                         matBadgeColor="warn"
                         class="!text-slate-500">notifications</mat-icon>
             </button>

             <mat-menu #notifMenu="matMenu" class="!rounded-2xl !mt-4 !shadow-2xl border border-slate-100 overflow-hidden">
               <div class="w-80 max-h-[400px] flex flex-col">
                 <div class="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <span class="text-[10px] font-black uppercase tracking-widest text-slate-900">Notifications</span>
                    <button class="text-[9px] font-black uppercase text-blue-600 hover:underline">Mark all read</button>
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

             <button (click)="auth.logout()" class="bg-[#041627] text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-slate-900/10 cursor-pointer">
                Log Out
             </button>
          </div>
        } @else {
          <div class="flex items-center gap-4">
            <button routerLink="/login" class="text-slate-600 font-black text-xs uppercase tracking-widest px-4 py-2 hover:text-[#041627] transition-colors cursor-pointer">Log In</button>
            <button routerLink="/register" class="bg-[#041627] text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-slate-900/10 cursor-pointer">Sign Up</button>
          </div>
        }
      </div>
    </header>
  `,
  styles: [`
    .active-link { color: #041627 !important; border-bottom-color: #041627 !important; }
    :host { display: block; width: 100%; }
  `]
})
export class NavbarComponent {
  auth = inject(AuthService);
  state = inject(PlatformStateService);
}
