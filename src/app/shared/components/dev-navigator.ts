import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dev-navigator',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  template: `
    <div class="fixed bottom-6 left-6 z-[100] flex flex-col gap-2">
      <button (click)="isOpen = !isOpen" 
              class="w-14 h-14 bg-slate-900 text-white rounded-2xl shadow-2xl flex items-center justify-center hover:scale-105 transition-all">
        <mat-icon>{{ isOpen ? 'close' : 'navigation' }}</mat-icon>
      </button>

      @if (isOpen) {
        <div class="bg-white/80 backdrop-blur-xl border border-slate-200 p-6 rounded-[2rem] shadow-2xl w-80 animate-in slide-in-from-bottom-4 duration-300">
          <div class="space-y-6">
            @if (auth.isAuthenticated()) {
              <div class="p-4 bg-slate-900 rounded-2xl text-white mb-6">
                <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Logged in as</p>
                <p class="text-sm font-black">{{ auth.currentUser()?.name }}</p>
                <p class="text-[10px] font-bold text-blue-400 uppercase tracking-tighter">{{ auth.userRole() }}</p>
                <button (click)="auth.logout()" class="mt-4 w-full py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors">Sign Out</button>
              </div>
            } @else {
              <div class="p-4 bg-blue-600 rounded-2xl text-white mb-6">
                <p class="text-xs font-black">Not Authenticated</p>
                <p class="text-[10px] font-medium opacity-80 mt-1">Access to dashboards is restricted.</p>
                <button routerLink="/login" class="mt-4 w-full py-2 bg-white text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors">Sign In</button>
              </div>
            }

            <div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Quick Navigation (Bypass Guards)</p>
              <div class="space-y-4">
                <div class="grid grid-cols-2 gap-2">
                  <a routerLink="/admin/dashboard" class="px-4 py-2 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-xl text-xs font-black transition-colors text-center border border-slate-100">Admin</a>
                  <a routerLink="/worker/dashboard" class="px-4 py-2 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-xl text-xs font-black transition-colors text-center border border-slate-100">Worker</a>
                  <a routerLink="/client/marketplace" class="px-4 py-2 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-xl text-xs font-black transition-colors text-center border border-slate-100 col-span-2">Client Marketplace</a>
                </div>
              </div>
            </div>

            <div class="pt-4 border-t border-slate-100">
              <a routerLink="/" class="flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">
                <mat-icon class="!text-sm !w-auto !h-auto">home</mat-icon> Return Home
              </a>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class DevNavigatorComponent {
  public auth = inject(AuthService);
  isOpen = false;
}
