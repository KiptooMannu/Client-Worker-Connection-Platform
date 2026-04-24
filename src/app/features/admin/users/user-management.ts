import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { PlatformStateService } from '../../../core/services/platform-state.service';
import { inject, signal } from '@angular/core';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule, 
    MatCardModule, 
    MatButtonModule, 
    MatIconModule, 
    MatTableModule, 
    MatChipsModule, 
    MatProgressBarModule,
    MatSelectModule,
    MatFormFieldModule,
    MatMenuModule,
    MatSnackBarModule,
    FormsModule,
    MatDividerModule
  ],
  template: `
    <div class="space-y-8 animate-in fade-in duration-500">
      <!-- Detailed Profile Panel (Sticky at top when open) -->
      @if (selectedUser()) {
        <mat-card class="!rounded-[2.5rem] !border-4 !border-blue-600 !shadow-2xl animate-in slide-in-from-top duration-500 overflow-hidden mb-12">
          <div class="p-8 bg-blue-600 text-white flex justify-between items-center">
            <div class="flex items-center gap-6">
              <div class="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl font-black border border-white/30 shadow-2xl">
                @if (selectedUser().image) { <img [src]="selectedUser().image" class="w-full h-full object-cover rounded-3xl"> } @else { {{ selectedUser().initials }} }
              </div>
              <div>
                <h3 class="text-3xl font-black tracking-tight">{{ selectedUser().name }}</h3>
                <p class="text-blue-100 font-bold text-xs uppercase tracking-widest">{{ selectedUser().role }} • {{ selectedUser().tier }}</p>
              </div>
            </div>
            <button mat-icon-button (click)="closeProfile()" class="!text-white !bg-white/10 !backdrop-blur-sm"><mat-icon>close</mat-icon></button>
          </div>
          
          <div class="p-10 grid grid-cols-1 md:grid-cols-3 gap-10 bg-white">
            <div class="col-span-1 md:col-span-2 space-y-8">
              <div>
                <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Identity & Contact</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="p-5 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                    <p class="text-[9px] font-black text-slate-400 uppercase mb-1">Full Legal Name</p>
                    <p class="text-base font-black text-slate-900">{{ selectedUser().name }}</p>
                  </div>
                  <div class="p-5 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                    <p class="text-[9px] font-black text-slate-400 uppercase mb-1">System Identifier</p>
                    <p class="text-base font-black text-slate-900">{{ selectedUser().email }}</p>
                  </div>
                </div>
              </div>

              @if (selectedUser().role === 'Service Provider') {
                <div class="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Professional Dossier</h4>
                  <div class="p-8 bg-slate-50 rounded-[2rem] border-2 border-slate-100 space-y-6">
                    <p class="text-slate-700 font-bold text-lg leading-relaxed">{{ selectedUser().bio }}</p>
                    <div class="flex flex-wrap gap-3">
                      @for (skill of selectedUser().skills; track skill) {
                        <span class="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20">{{ skill }}</span>
                      }
                    </div>
                  </div>
                </div>
              }

              @if (selectedUser().role === 'Enterprise Client') {
                <div class="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Platform Engagement</h4>
                  <div class="grid grid-cols-3 gap-6">
                    <div class="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 text-center shadow-sm hover:border-blue-200 transition-all">
                      <p class="text-3xl font-black text-slate-900">$14.2k</p>
                      <p class="text-[9px] font-black text-slate-400 uppercase mt-2">Total Volume</p>
                    </div>
                    <div class="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 text-center shadow-sm hover:border-blue-200 transition-all">
                      <p class="text-3xl font-black text-slate-900">12</p>
                      <p class="text-[9px] font-black text-slate-400 uppercase mt-2">Active Hires</p>
                    </div>
                    <div class="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 text-center shadow-sm hover:border-blue-200 transition-all">
                      <p class="text-3xl font-black text-slate-900">98%</p>
                      <p class="text-[9px] font-black text-slate-400 uppercase mt-2">Trust Rating</p>
                    </div>
                  </div>
                </div>
              }
            </div>

            <div class="space-y-8">
              <div>
                <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Compliance Status</h4>
                <div class="p-8 bg-white border-2 border-slate-100 rounded-[2rem] shadow-xl space-y-8">
                  <div class="flex justify-between items-center">
                    <span class="text-xs font-black text-slate-500 uppercase tracking-widest">Profile Status</span>
                    <mat-chip class="!min-h-0 !p-0 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter"
                              [ngClass]="selectedUser().statusClass">{{ selectedUser().status || 'Active' }}</mat-chip>
                  </div>
                  <mat-divider></mat-divider>
                  <div class="flex flex-col gap-4">
                    <button mat-flat-button color="primary" 
                            [disabled]="selectedUser().status === 'Verified' || selectedUser().status === 'Active'"
                            (click)="promoteUser(selectedUser())"
                            class="!py-8 !rounded-2xl !font-black !text-[11px] !uppercase !tracking-widest shadow-xl shadow-blue-600/20">
                      {{ selectedUser().status === 'Verified' ? 'Account Verified' : 'Verify & Promote' }}
                    </button>
                    <button mat-stroked-button color="warn" class="!py-8 !rounded-2xl !font-black !text-[11px] !uppercase !tracking-widest" (click)="suspendUser(selectedUser())">Suspend Access</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </mat-card>
      }
      <!-- Header -->
      <div class="flex justify-between items-end">
        <div>
          <h2 class="text-4xl font-black text-slate-900 tracking-tight">User Management</h2>
          <p class="text-slate-500 font-medium">Global participant oversight and compliance auditing.</p>
        </div>
        <div class="flex gap-3">
          <button mat-flat-button color="primary">
            <mat-icon>person_add</mat-icon> Invite User
          </button>
          <button mat-stroked-button class="!border-slate-300">
            <mat-icon>download</mat-icon> Export List
          </button>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        @for (stat of stats; track stat.label) {
          <mat-card class="!rounded-2xl !border !border-slate-100 !shadow-sm">
            <mat-card-content class="!p-6">
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{{ stat.label }}</p>
              <p class="text-2xl font-black text-slate-900">{{ stat.value }}</p>
              <p class="text-xs mt-2 flex items-center gap-1 font-bold" [ngClass]="stat.trendClass">
                <mat-icon class="!text-sm !w-4 !h-4">{{ stat.icon }}</mat-icon>
                {{ stat.subtext }}
              </p>
            </mat-card-content>
          </mat-card>
        }
      </div>

      <!-- User Table Container -->
      <mat-card class="!rounded-2xl !border !border-slate-100 !shadow-sm !overflow-hidden">
        <div class="p-6 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between bg-slate-50/50">
          <div class="flex flex-wrap gap-4">
            <div class="flex items-center border border-slate-200 rounded-xl px-4 py-2 bg-white focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/10 transition-all w-64">
              <mat-icon class="text-slate-400 mr-2 !text-sm">search</mat-icon>
              <input class="w-full border-none focus:ring-0 bg-transparent text-xs font-bold" placeholder="Search by name or email..." type="text" [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($any($event))"/>
            </div>

            <mat-form-field appearance="outline" class="!text-xs h-[48px] !m-0">
              <mat-select [value]="selectedRole()" (selectionChange)="selectedRole.set($event.value)">
                <mat-option value="all">All Roles</mat-option>
                <mat-option value="worker">Service Providers</mat-option>
                <mat-option value="client">Enterprise Clients</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="!text-xs h-[48px] !m-0">
              <mat-select [value]="selectedStatus()" (selectionChange)="selectedStatus.set($event.value)">
                <mat-option value="any">Any Status</mat-option>
                <mat-option value="verified">Verified</mat-option>
                <mat-option value="pending">Pending Review</mat-option>
                <mat-option value="suspended">Suspended</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
          <div class="flex items-center gap-4 text-xs font-bold text-slate-500">
            <span>Showing 1-4 of 12,842</span>
            <div class="flex border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <button mat-icon-button class="!w-8 !h-8 !leading-none"><mat-icon class="!text-sm">chevron_left</mat-icon></button>
              <button mat-icon-button class="!w-8 !h-8 !leading-none"><mat-icon class="!text-sm">chevron_right</mat-icon></button>
            </div>
          </div>
        </div>

        <table mat-table [dataSource]="users" class="w-full">
          <!-- Identity Column -->
          <ng-container matColumnDef="identity">
            <th mat-header-cell *matHeaderCellDef class="!bg-slate-900 !text-white !font-black !text-[10px] !uppercase !tracking-widest">User Identity</th>
            <td mat-cell *matCellDef="let user">
              <div class="flex items-center gap-3 py-4">
                <div class="w-10 h-10 rounded-full overflow-hidden border border-slate-100 bg-slate-50">
                  @if (user.image) {
                    <img [src]="user.image" class="w-full h-full object-cover">
                  } @else {
                    <div class="w-full h-full flex items-center justify-center text-blue-700 font-black text-sm">{{ user.initials }}</div>
                  }
                </div>
                <div>
                  <p class="text-sm font-black text-slate-900 leading-tight">{{ user.name }}</p>
                  <p class="text-[10px] text-slate-500 font-medium">{{ user.email }}</p>
                </div>
              </div>
            </td>
          </ng-container>

          <!-- Role Column -->
          <ng-container matColumnDef="role">
            <th mat-header-cell *matHeaderCellDef class="!bg-slate-900 !text-white !font-black !text-[10px] !uppercase !tracking-widest">Role & Tier</th>
            <td mat-cell *matCellDef="let user">
              <p class="text-sm font-bold text-slate-900">{{ user.role }}</p>
              <p class="text-[9px] text-slate-400 font-black uppercase tracking-tight">{{ user.tier }}</p>
            </td>
          </ng-container>

          <!-- Status Column -->
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef class="!bg-slate-900 !text-white !font-black !text-[10px] !uppercase !tracking-widest">Status</th>
            <td mat-cell *matCellDef="let user">
              <mat-chip class="!min-h-0 !p-0 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest" [ngClass]="user.statusClass">
                {{ user.status }}
              </mat-chip>
            </td>
          </ng-container>

          <!-- Completion Column -->
          <ng-container matColumnDef="progress">
            <th mat-header-cell *matHeaderCellDef class="!bg-slate-900 !text-white !font-black !text-[10px] !uppercase !tracking-widest">Profile Health</th>
            <td mat-cell *matCellDef="let user">
              <div class="flex flex-col gap-1 pr-8">
                <mat-progress-bar mode="determinate" [value]="user.progress" [ngClass]="user.progressClass" class="!h-1 rounded-full"></mat-progress-bar>
                <span class="text-[9px] font-black text-slate-900">{{ user.progress }}% Complete</span>
              </div>
            </td>
          </ng-container>

          <!-- Actions Column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef class="!bg-slate-900 !text-white !font-black !text-[10px] !uppercase !tracking-widest text-right">Actions</th>
            <td mat-cell *matCellDef="let user" class="text-right">
                <button mat-icon-button class="!text-slate-400" (click)="viewUser(user)"><mat-icon class="!text-lg">visibility</mat-icon></button>
                <button mat-icon-button [matMenuTriggerFor]="menu" class="!text-slate-400"><mat-icon class="!text-lg">more_vert</mat-icon></button>
                <mat-menu #menu="matMenu" class="!rounded-2xl !p-2 !shadow-2xl">
                  <button mat-menu-item (click)="editUser(user)">
                    <mat-icon>edit</mat-icon>
                    <span class="font-bold text-xs uppercase">Edit Identity</span>
                  </button>
                  <button mat-menu-item (click)="suspendUser(user)" class="!text-red-600">
                    <mat-icon class="!text-red-600">block</mat-icon>
                    <span class="font-bold text-xs uppercase">Suspend Access</span>
                  </button>
                </mat-menu>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let user; columns: displayedColumns;" class="hover:bg-slate-50 transition-colors"></tr>
        </table>
        
        @if (users.length === 0) {
          <div class="p-20 text-center bg-slate-50">
            <mat-icon class="!text-[64px] !w-auto !h-auto text-slate-200 mb-4">search_off</mat-icon>
            <p class="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No users match your filters.</p>
          </div>
        }
      </mat-card>
    </div>
  `,
  styles: [`
    :ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }
    ::ng-deep .mat-mdc-progress-bar.health-teal { --mdc-linear-progress-active-indicator-color: #14b8a6; }
    ::ng-deep .mat-mdc-progress-bar.health-blue { --mdc-linear-progress-active-indicator-color: #2563eb; }
    ::ng-deep .mat-mdc-progress-bar.health-red { --mdc-linear-progress-active-indicator-color: #ef4444; }
  `]
})
export class AdminUserManagementPage {
  state = inject(PlatformStateService);
  private snackBar = inject(MatSnackBar);
  displayedColumns: string[] = ['identity', 'role', 'status', 'progress', 'actions'];
  selectedRole = signal<string>('all');
  selectedStatus = signal<string>('any');
  searchQuery = signal<string>('');
  selectedUser = signal<any | null>(null);
  
  stats = [
    { label: 'Total Users', value: '12,842', subtext: '+14% this month', icon: 'trending_up', trendClass: 'text-teal-600' },
    { label: 'Verified Workers', value: '4,310', subtext: '92% completion', icon: 'verified', trendClass: 'text-slate-500' },
    { label: 'Active Clients', value: '8,532', subtext: '$2.4M Volume', icon: 'payments', trendClass: 'text-teal-600' },
    { label: 'Pending Review', value: '158', subtext: '24h target', icon: 'priority_high', trendClass: 'text-red-600' }
  ];

  get users() {
    const role = this.selectedRole();
    const status = this.selectedStatus();
    const query = this.searchQuery().toLowerCase();
    
    let workers: any[] = [];
    let clients: any[] = [];

    if (role === 'all' || role === 'worker') {
      workers = this.state.workers()
        .filter(w => {
           const matchesSearch = !query || w.name.toLowerCase().includes(query) || w.email.toLowerCase().includes(query);
           const matchesStatus = status === 'any' || 
                                (status === 'verified' && w.status === 'Verified') || 
                                (status === 'pending' && (w.status === 'Pending' || w.status === 'Priority'));
           return matchesSearch && matchesStatus;
        })
        .map(w => ({
          ...w,
          identity: w.name,
          role: 'Service Provider',
          tier: w.status === 'Verified' ? 'Tier 3 Platinum' : 'Tier 1 New',
          statusClass: w.status === 'Verified' ? '!bg-teal-50 !text-teal-700' : 
                       w.status === 'Rejected' ? '!bg-red-50 !text-red-700' : '!bg-slate-100 !text-slate-500',
          progress: w.status === 'Verified' ? 100 : 85,
          progressClass: w.status === 'Verified' ? 'health-teal' : 'health-blue'
        }));
    }

    if (role === 'all' || role === 'client') {
      clients = this.state.clients()
        .filter(c => {
           const matchesSearch = !query || c.name.toLowerCase().includes(query) || c.email.toLowerCase().includes(query);
           const matchesStatus = status === 'any' || (status === 'verified' && c.status === 'Active');
           return matchesSearch && matchesStatus;
        })
        .map(c => ({
          ...c,
          identity: c.name,
          role: 'Enterprise Client',
          tier: c.tier,
          statusClass: c.status === 'Active' ? '!bg-blue-50 !text-blue-700' : '!bg-red-50 !text-red-700',
          progress: c.progress,
          progressClass: c.progress === 100 ? 'health-teal' : 'health-blue'
        }));
    }

    return [...workers, ...clients];
  }

  viewUser(user: any) {
    this.selectedUser.set(user);
    this.snackBar.open(`CORE_UPDATE: Loading Profile for ${user.identity}...`, 'Dismiss', { duration: 2000 });
    
    // Instant jump to top
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  closeProfile() {
    this.selectedUser.set(null);
  }

  editUser(user: any) {
    this.snackBar.open(`Edit mode engaged for ${user.identity}`, 'Close', { duration: 3000 });
  }

  suspendUser(user: any) {
    this.snackBar.open(`ALERT: User ${user.identity} has been suspended.`, 'Undo', { duration: 5000 });
  }

  promoteUser(user: any) {
    if (user.role === 'Service Provider') {
      this.state.approveWorker(user.id);
      this.snackBar.open(`SUCCESS: ${user.name} is now a Verified Service Provider!`, 'Great', { duration: 3000 });
    } else {
      // For clients, we just simulate a tier upgrade
      this.snackBar.open(`SUCCESS: ${user.name} has been promoted to VIP Tier!`, 'Great', { duration: 3000 });
    }
    // Refresh the selection to show updated status
    this.selectedUser.set(this.users.find(u => u.id === user.id));
  }
}
