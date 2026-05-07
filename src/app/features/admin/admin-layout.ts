import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
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
    <div class="min-h-screen bg-slate-50 flex flex-col font-sans">
      <app-navbar></app-navbar>
      <mat-sidenav-container class="flex-grow !bg-transparent min-h-0" autosize [hasBackdrop]="(isHandset$ | async) === true">
        <mat-sidenav #sidenav 
                     [mode]="(isHandset$ | async) ? 'over' : 'side'" 
                     [opened]="(isHandset$ | async) === false"
                     class="admin-sidenav">
          
          <div class="flex flex-col h-full p-8 overflow-x-hidden">
            <!-- Branding -->
            <div class="flex items-center gap-3 mb-10">
            </div>
            
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Management Modules</p>
            
            <!-- Navigation -->
             <mat-nav-list class="!p-0 space-y-2">
               @for (item of menuItems; track item.path) {
                 <a mat-list-item 
                    [routerLink]="item.path" 
                    routerLinkActive="active-link" 
                    class="admin-nav-item group transition-all duration-200">
                   <mat-icon matListItemIcon 
                     class="group-[.active-link]:!text-indigo-600 !text-slate-400 transition-colors">
                     {{ item.icon }}
                   </mat-icon>
                   <span matListItemTitle 
                     class="text-[11px] font-bold text-slate-600 group-[.active-link]:!text-indigo-700">
                     {{ item.label }}
                   </span>
                 </a>
               }
             </mat-nav-list>


          </div>
        </mat-sidenav>

        <mat-sidenav-content class="!bg-slate-50 relative overflow-y-auto overflow-x-hidden">
          <!-- Background Decoration -->
          <div class="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-indigo-50/50 to-transparent -z-10 pointer-events-none"></div>
          
          <div class="p-4 sm:p-6 md:p-8 lg:p-10 max-w-[1600px] mx-auto">
            <!-- Dynamic Header -->
            <header class="admin-content-header mb-8 md:mb-10">
              <div class="flex items-center gap-3 sm:gap-4 md:gap-6">
                @if (isHandset$ | async) {
                  <button (click)="sidenav.toggle()" class="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                    <mat-icon class="!text-lg">menu</mat-icon>
                  </button>
                }

              </div>
            </header>

            <main class="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <router-outlet></router-outlet>
            </main>

            <footer class="py-12 flex justify-center items-center">
              <p class="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                &copy; 2024 Kazi Konnect. All rights reserved.
              </p>
            </footer>
          </div>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; }
    
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

    ::ng-deep .admin-nav-item {
      --mdc-list-item-container-shape: 16px;
      --mdc-list-item-leading-icon-size: 20px;
      border-radius: 16px !important;
      margin-bottom: 8px !important;
      height: 56px !important;
    }

    ::ng-deep .admin-nav-item .mdc-list-item__content {
      display: flex !important;
      align-items: center !important;
    }

    ::ng-deep .admin-nav-item .mat-mdc-list-item-icon {
      margin-right: 16px !important;
    }

    .active-link { 
      background: white !important; 
      box-shadow: 0 4px 20px -5px rgba(0,0,0,0.05) !important;
      border: 1px solid rgba(226, 232, 240, 0.8) !important;
    }

    /* Guard against accidentally duplicated top-right admin header controls. */
    .admin-content-header > div + div {
      display: none !important;
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
    { path: 'messages', label: 'Messages', icon: 'mail' },
    { path: 'activity', label: 'System Audit', icon: 'history_edu' }
  ];

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );
}