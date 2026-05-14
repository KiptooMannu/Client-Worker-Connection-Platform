import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PlatformStateService } from '../../core/services/platform-state.service';
import { AuthService } from '../../core/services/auth.service';
import { NavbarComponent } from '../../shared/components/navbar';

@Component({
  selector: 'app-worker-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatButtonModule,
    NavbarComponent
  ],
  template: `
    <div class="min-h-screen bg-surface flex flex-col font-manrope">
      <!-- Standard Navbar at Top -->
      <app-navbar 
        [showHireTalent]="false" 
        pageTitle="Dashboard" 
        [badge]="worker().status">
      </app-navbar>

      <div class="flex flex-1 overflow-hidden">
        <!-- Minimalist Sidebar -->
        <aside class="hidden lg:flex flex-col w-72 border-r border-outline-variant/30 bg-surface px-4 py-8 space-y-6 shrink-0">
          <nav class="space-y-1">
            <a routerLink="dashboard" routerLinkActive="active-tab" class="flex items-center gap-4 px-5 py-4 rounded-xl text-on-surface-variant font-black text-xs uppercase tracking-widest hover:bg-surface-container-low transition-all group">
              <mat-icon class="group-[.active-tab]:text-primary transition-colors">grid_view</mat-icon>
              Dashboard
            </a>
            <a routerLink="history" routerLinkActive="active-tab" class="flex items-center gap-4 px-5 py-4 rounded-xl text-on-surface-variant font-black text-xs uppercase tracking-widest hover:bg-surface-container-low transition-all group">
              <mat-icon class="group-[.active-tab]:text-primary transition-colors">receipt_long</mat-icon>
              My Jobs
            </a>
            <a routerLink="verification" routerLinkActive="active-tab" class="flex items-center gap-4 px-5 py-4 rounded-xl text-on-surface-variant font-black text-xs uppercase tracking-widest hover:bg-surface-container-low transition-all group">
              <mat-icon class="group-[.active-tab]:text-primary transition-colors">verified_user</mat-icon>
              Documents
            </a>
            <a routerLink="profile" routerLinkActive="active-tab" class="flex items-center gap-4 px-5 py-4 rounded-xl text-on-surface-variant font-black text-xs uppercase tracking-widest hover:bg-surface-container-low transition-all group">
              <mat-icon class="group-[.active-tab]:text-primary transition-colors">person_edit</mat-icon>
              Profile
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
        <main class="flex-1 overflow-y-auto bg-surface-container-lowest/30">
          <div class="max-w-[1400px] mx-auto p-6 md:p-10 lg:p-12">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>

      <!-- Mobile Navigation Overlay (Drawer) -->
      @if (isHandsetMenuOpen()) {
        <div class="lg:hidden fixed inset-0 z-[100] flex">
          <div class="fixed inset-0 bg-on-surface/40 backdrop-blur-sm" (click)="isHandsetMenuOpen.set(false)"></div>
          <div class="relative w-80 bg-surface h-full shadow-2xl p-8 flex flex-col animate-in slide-in-from-left duration-300">
            <div class="flex items-center gap-3 mb-12">
              <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
                <mat-icon>corporate_fare</mat-icon>
              </div>
              <span class="text-xl font-black tracking-tighter text-primary uppercase">KaziKonnect</span>
            </div>
            <nav class="space-y-2 flex-1">
              <a routerLink="dashboard" (click)="isHandsetMenuOpen.set(false)" class="flex items-center gap-4 px-6 py-4 rounded-xl text-on-surface-variant font-black text-xs uppercase tracking-widest hover:bg-surface-container-low">
                <mat-icon>grid_view</mat-icon> Dashboard
              </a>
              <a routerLink="history" (click)="isHandsetMenuOpen.set(false)" class="flex items-center gap-4 px-6 py-4 rounded-xl text-on-surface-variant font-black text-xs uppercase tracking-widest hover:bg-surface-container-low">
                <mat-icon>receipt_long</mat-icon> My Jobs
              </a>
              <a routerLink="verification" (click)="isHandsetMenuOpen.set(false)" class="flex items-center gap-4 px-6 py-4 rounded-xl text-on-surface-variant font-black text-xs uppercase tracking-widest hover:bg-surface-container-low">
                <mat-icon>verified_user</mat-icon> Documents
              </a>
              <a routerLink="profile" (click)="isHandsetMenuOpen.set(false)" class="flex items-center gap-4 px-6 py-4 rounded-xl text-on-surface-variant font-black text-xs uppercase tracking-widest hover:bg-surface-container-low">
                <mat-icon>person_edit</mat-icon> Profile
              </a>
            </nav>
            <button (click)="auth.logout()" class="flex items-center gap-4 px-6 py-4 text-error font-black text-xs uppercase tracking-widest">
              <mat-icon>logout</mat-icon> Log Out
            </button>
          </div>
        </div>
      }

      <!-- Floating Mobile Trigger -->
      <button (click)="isHandsetMenuOpen.set(true)" 
              class="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl z-50 active:scale-90 transition-all">
         <mat-icon>menu</mat-icon>
      </button>
    </div>
  `,
  styles: [`
    .active-tab {
      background-color: var(--color-surface-container-low) !important;
      color: var(--color-primary) !important;
    }
    :host { display: block; height: 100vh; }
  `]
})
export class WorkerLayout {
  state = inject(PlatformStateService);
  auth = inject(AuthService);
  
  worker = this.state.currentWorker;
  isHandsetMenuOpen = signal(false);
}
