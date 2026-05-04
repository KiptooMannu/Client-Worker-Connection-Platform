import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map, Observable, shareReplay } from 'rxjs';
import { NavbarComponent } from '../../shared/components/navbar';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatListModule, MatIconModule, MatButtonModule, NavbarComponent
  ],
  template: `
    <div class="h-screen bg-slate-50 flex flex-col overflow-hidden font-sans">
      <app-navbar></app-navbar>

      <mat-sidenav-container class="flex-grow !bg-transparent" autosize>
        <mat-sidenav #sidenav 
                     [mode]="(isHandset$ | async) ? 'over' : 'side'" 
                     [opened]="(isHandset$ | async) === false"
                     class="admin-sidenav">
          
          <div class="flex flex-col h-full p-8 overflow-x-hidden">
            <!-- Branding -->
            <div class="flex items-center gap-3 mb-10">
               <div class="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                  <mat-icon class="!text-lg">shield</mat-icon>
               </div>
               <span class="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Authority Suite</span>
            </div>
            
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Management Modules</p>
            
            <!-- Navigation -->
            <mat-nav-list class="!p-0 space-y-3">
              @for (item of menuItems; track item.path) {
                <a mat-list-item 
                   [routerLink]="item.path" 
                   routerLinkActive="active-link" 
                   class="!rounded-[20px] group h-14 transition-all duration-200">
                  <div class="flex items-center gap-4">
                    <mat-icon matListItemIcon 
                      class="group-[.active-link]:!text-indigo-600 !text-slate-400 transition-colors">
                      {{ item.icon }}
                    </mat-icon>
                    <span matListItemTitle 
                      class="text-xs font-bold text-slate-600 group-[.active-link]:!text-indigo-700">
                      {{ item.label }}
                    </span>
                  </div>
                </a>
              }
            </mat-nav-list>


          </div>
        </mat-sidenav>

        <mat-sidenav-content class="!bg-slate-50 relative">
          <!-- Background Decoration -->
          <div class="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-indigo-50/50 to-transparent -z-10 pointer-events-none"></div>
          
          <div class="p-6 md:p-10 lg:p-12 max-w-[1600px] mx-auto">
            <!-- Dynamic Header -->
            <header class="flex justify-between items-center mb-12">
              <div class="flex items-center gap-6">
                @if (isHandset$ | async) {
                  <button (click)="sidenav.toggle()" class="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                    <mat-icon>menu</mat-icon>
                  </button>
                }
                <div class="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white border border-slate-200/60 shadow-sm">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span class="text-[10px] font-black text-slate-600 uppercase tracking-widest">Active Session</span>
                </div>
              </div>
              
              <div class="flex items-center gap-4">
                 <button class="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 relative">
                    <mat-icon>notifications</mat-icon>
                    <span class="absolute top-3 right-3 w-2 h-2 rounded-full bg-rose-500 border-2 border-white"></span>
                 </button>
                 <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-white shadow-xl flex items-center justify-center text-white font-black">A</div>
              </div>
            </header>

            <main class="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <router-outlet></router-outlet>
            </main>
          </div>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; overflow: hidden; }
    
    .admin-sidenav {
      width: 320px !important;
      border-right: 1px solid rgba(226, 232, 240, 0.6) !important;
      background-color: rgba(255, 255, 255, 0.8) !important;
      backdrop-filter: blur(20px);
    }

    ::ng-deep .mat-drawer-inner-container {
      overflow-x: hidden !important;
      display: flex !important;
      flex-direction: column !important;
    }

    .active-link { 
      background: white !important; 
      box-shadow: 0 10px 30px -10px rgba(0,0,0,0.08) !important;
      border: 1px solid rgba(226, 232, 240, 0.8) !important;
    }

    ::ng-deep .mat-mdc-list-item {
      border-radius: 20px !important;
      margin-bottom: 8px !important;
    }

    /* Custom backdrop style */
    ::ng-deep .mat-drawer-backdrop.mat-drawer-shown { 
      background-color: rgba(15, 23, 42, 0.4) !important; 
      backdrop-filter: blur(4px); 
    }
  `]
})
export class AdminLayout {
  private breakpointObserver = inject(BreakpointObserver);

  menuItems = [
    { path: 'dashboard', label: 'Executive Overview', icon: 'grid_view' },
    { path: 'verification', label: 'Verification Queue', icon: 'fact_check' },
    { path: 'users', label: 'Participant Directory', icon: 'people_alt' },
    { path: 'activity', label: 'System Audit', icon: 'history_edu' }
  ];

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );
}