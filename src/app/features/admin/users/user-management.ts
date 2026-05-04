import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { PlatformStateService } from '../../../core/services/platform-state.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';

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
    FormsModule,
    MatDividerModule
  ],
  template: `
    <div class="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-1000 p-4 md:p-0">
      
      <!-- Detailed Profile Panel (Smooth entry) -->
      @if (selectedUser()) {
        <div id="user-profile-anchor"></div>
        <mat-card class="!rounded-[40px] !border !border-slate-200/60 !shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden mb-12 animate-in slide-in-from-top-10 duration-700 bg-white">
          <!-- Premium Header -->
          <div class="p-10 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-50/30">
            <div class="flex items-center gap-6">
              <div class="w-24 h-24 rounded-[32px] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-black text-white shadow-2xl shadow-indigo-100 border-4 border-white overflow-hidden">
                @if (selectedUser().image) { <img [src]="selectedUser().image" class="w-full h-full object-cover"> } @else { {{ selectedUser().initials }} }
              </div>
              <div>
                <div class="flex items-center gap-3 mb-2">
                  <h3 class="text-3xl font-black text-slate-900 tracking-tight">{{ selectedUser().name }}</h3>
                  <span class="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                    {{ selectedUser().role }}
                  </span>
                </div>
                <div class="flex items-center gap-4 text-slate-400 font-medium text-sm">
                  <span class="flex items-center gap-1"><mat-icon class="!text-xs">email</mat-icon> {{ selectedUser().email }}</span>
                  <span class="h-1 w-1 rounded-full bg-slate-300"></span>
                  <span class="flex items-center gap-1"><mat-icon class="!text-xs">verified</mat-icon> {{ selectedUser().tier }}</span>
                </div>
              </div>
            </div>
            <div class="flex gap-3">
              <button (click)="closeProfile()" class="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-all shadow-sm">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          </div>
          
          <div class="p-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
            <!-- Left Side: Information -->
            <div class="lg:col-span-2 space-y-12">
              <section>
                <h4 class="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">Profile Narrative</h4>
                <div class="p-8 bg-slate-50 rounded-[32px] border border-slate-100">
                   <p class="text-slate-600 text-lg leading-relaxed italic border-l-4 border-indigo-500 pl-6">
                     {{ selectedUser().bio || 'No professional biography provided for this profile.' }}
                   </p>
                </div>
              </section>

              @if (selectedUser().role === 'Service Provider') {
                <section>
                   <h4 class="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">Verified Expertise</h4>
                   <div class="flex flex-wrap gap-2">
                      @for (skill of selectedUser().skills; track skill) {
                        <span class="px-5 py-2.5 rounded-2xl bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100 shadow-sm">{{ skill }}</span>
                      }
                      @if (!selectedUser().skills?.length) { <p class="text-slate-400 italic">No skills listed.</p> }
                   </div>
                </section>
              }

              @if (selectedUser().role === 'Enterprise Client') {
                <section>
                  <h4 class="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">Platform Engagement</h4>
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    @for (stat of [
                      { label: 'Total Volume', value: '$14.2k', icon: 'payments', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                      { label: 'Active Hires', value: '12', icon: 'handshake', color: 'text-indigo-600', bg: 'bg-indigo-50' },
                      { label: 'Trust Rating', value: '98%', icon: 'star', color: 'text-amber-600', bg: 'bg-amber-50' }
                    ]; track stat.label) {
                      <div class="p-8 rounded-[32px] border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all text-center">
                        <div class="w-10 h-10 rounded-xl mx-auto mb-4 flex items-center justify-center" [ngClass]="stat.bg">
                          <mat-icon class="!text-lg" [ngClass]="stat.color">{{ stat.icon }}</mat-icon>
                        </div>
                        <p class="text-2xl font-black text-slate-900">{{ stat.value }}</p>
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{{ stat.label }}</p>
                      </div>
                    }
                  </div>
                </section>
              }
            </div>

            <!-- Right Side: Controls -->
            <div class="space-y-8">
              <section>
                <h4 class="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">Governance Controls</h4>
                <div class="p-8 bg-white border border-slate-200/60 rounded-[32px] shadow-xl space-y-8">
                  <div class="flex justify-between items-center">
                    <span class="text-xs font-black text-slate-500 uppercase tracking-widest">Account Status</span>
                    <span class="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest" [ngClass]="selectedUser().statusClass">
                      {{ selectedUser().status || 'Active' }}
                    </span>
                  </div>
                  
                  <div class="space-y-4">
                    <div class="flex justify-between items-end mb-2">
                      <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Profile Health</span>
                      <span class="text-xs font-black text-slate-900">{{ selectedUser().progress }}%</span>
                    </div>
                    <mat-progress-bar mode="determinate" [value]="selectedUser().progress" [ngClass]="selectedUser().progressClass" class="!h-2 rounded-full"></mat-progress-bar>
                  </div>

                  <mat-divider></mat-divider>
                  
                  <div class="flex flex-col gap-3">
                    <button (click)="promoteUser(selectedUser())" 
                            [disabled]="selectedUser().status === 'Verified' || selectedUser().status === 'Active'"
                            class="w-full py-4 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 transition-all">
                      {{ selectedUser().status === 'Verified' ? 'Account Verified' : 'Verify & Promote' }}
                    </button>
                    <button (click)="suspendUser(selectedUser())" class="w-full py-4 rounded-2xl bg-white text-rose-600 border border-rose-100 font-black text-xs uppercase tracking-widest hover:bg-rose-50 transition-all">
                      Suspend Access
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </mat-card>
      }

      <!-- Header & Main Management Section -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-slate-100 pb-10">
        <div>
          <div class="flex items-center gap-3 mb-3">
            <span class="bg-slate-100 text-slate-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-slate-200/50">Directory Oversight</span>
            <span class="h-1 w-1 rounded-full bg-slate-300"></span>
            <span class="text-slate-400 text-[10px] font-medium uppercase tracking-widest">Live Registry</span>
          </div>
          <h1 class="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-2">Participant Registry</h1>
          <p class="text-slate-500 font-medium text-lg">Comprehensive management of platform users and security credentials.</p>
        </div>
        
        <div class="flex items-center gap-3">
          <button (click)="exportData()" class="px-6 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-sm">
             <mat-icon class="!text-sm mr-1">download</mat-icon> Export Data
          </button>
          <button (click)="inviteUser()" class="px-6 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">
             <mat-icon class="!text-sm mr-1">person_add</mat-icon> Invite User
          </button>
        </div>
      </div>

      <!-- Live Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        @for (stat of dynamicStats; track stat.label) {
          <div class="p-8 rounded-[32px] border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{{ stat.label }}</p>
            <h3 class="text-3xl font-black text-slate-900 tracking-tight">{{ stat.value }}</h3>
            <div class="flex items-center gap-1 mt-3 font-bold text-[10px]" [ngClass]="stat.trendClass">
               <mat-icon class="!text-[10px] !w-auto !h-auto">{{ stat.icon }}</mat-icon>
               <span>{{ stat.subtext }}</span>
            </div>
          </div>
        }
      </div>

      <!-- Main Registry Card -->
      <mat-card class="!rounded-[32px] !border !border-slate-200/60 !shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <!-- Filter Header -->
        <div class="p-8 border-b border-slate-100 flex flex-col lg:flex-row gap-6 items-center justify-between bg-slate-50/50">
          <div class="flex flex-wrap gap-4 w-full lg:w-auto">
            <div class="relative group w-full sm:w-72">
              <mat-icon class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 !text-lg">search</mat-icon>
              <input class="w-full pl-12 pr-6 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-medium focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none" 
                     placeholder="Search identities..." 
                     type="text" 
                     [ngModel]="searchQuery()" 
                     (ngModelChange)="searchQuery.set($any($event))"/>
            </div>

            <div class="flex gap-3">
              <mat-form-field appearance="outline" class="!text-xs h-[48px] custom-field">
                <mat-select [value]="selectedRole()" (selectionChange)="selectedRole.set($event.value)">
                  <mat-option value="all">All Roles</mat-option>
                  <mat-option value="worker">Service Providers</mat-option>
                  <mat-option value="client">Enterprise Clients</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="!text-xs h-[48px] custom-field">
                <mat-select [value]="selectedStatus()" (selectionChange)="selectedStatus.set($event.value)">
                  <mat-option value="any">Any Status</mat-option>
                  <mat-option value="verified">Verified</mat-option>
                  <mat-option value="pending">Pending Review</mat-option>
                  <mat-option value="suspended">Suspended</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
          </div>
          
          <div class="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <span>Showing {{ users.length }} active results</span>
            <div class="flex gap-1">
              <button class="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-all"><mat-icon class="!text-sm">chevron_left</mat-icon></button>
              <button class="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-all"><mat-icon class="!text-sm">chevron_right</mat-icon></button>
            </div>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table mat-table [dataSource]="users" class="w-full !bg-transparent">
            <!-- Identity Column -->
            <ng-container matColumnDef="identity">
              <th mat-header-cell *matHeaderCellDef class="!bg-slate-50/50 !border-b !border-slate-100 !text-[11px] !font-bold !text-slate-400 !uppercase !tracking-[0.2em] !py-6 !px-8">User Identity</th>
              <td mat-cell *matCellDef="let user" class="!border-b !border-slate-50 !px-8">
                <div class="flex items-center gap-4 py-6">
                  <div class="w-12 h-12 rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    @if (user.image) { <img [src]="user.image" class="w-full h-full object-cover"> } @else { {{ user.initials }} }
                  </div>
                  <div>
                    <p class="text-sm font-bold text-slate-900 mb-0.5">{{ user.name }}</p>
                    <p class="text-[10px] text-slate-400 font-medium">{{ user.email }}</p>
                  </div>
                </div>
              </td>
            </ng-container>

            <!-- Role Column -->
            <ng-container matColumnDef="role">
              <th mat-header-cell *matHeaderCellDef class="!bg-slate-50/50 !border-b !border-slate-100 !text-[11px] !font-bold !text-slate-400 !uppercase !tracking-[0.2em]">Role & Tier</th>
              <td mat-cell *matCellDef="let user" class="!border-b !border-slate-50">
                <p class="text-sm font-bold text-slate-900">{{ user.role }}</p>
                <p class="text-[10px] text-indigo-500 font-bold uppercase tracking-tighter">{{ user.tier }}</p>
              </td>
            </ng-container>

            <!-- Status Column -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef class="!bg-slate-50/50 !border-b !border-slate-100 !text-[11px] !font-bold !text-slate-400 !uppercase !tracking-[0.2em]">Status</th>
              <td mat-cell *matCellDef="let user" class="!border-b !border-slate-50">
                <span class="inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider" [ngClass]="user.statusClass">
                  {{ user.status }}
                </span>
              </td>
            </ng-container>

            <!-- Health Column -->
            <ng-container matColumnDef="progress">
              <th mat-header-cell *matHeaderCellDef class="!bg-slate-50/50 !border-b !border-slate-100 !text-[11px] !font-bold !text-slate-400 !uppercase !tracking-[0.2em]">Profile Health</th>
              <td mat-cell *matCellDef="let user" class="!border-b !border-slate-50">
                <div class="flex flex-col gap-2 pr-10">
                  <mat-progress-bar mode="determinate" [value]="user.progress" [ngClass]="user.progressClass" class="!h-1.5 rounded-full"></mat-progress-bar>
                  <span class="text-[10px] font-bold text-slate-900 uppercase tracking-tighter">{{ user.progress }}% Accurate</span>
                </div>
              </td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef class="!bg-slate-50/50 !border-b !border-slate-100 !text-[11px] !font-bold !text-slate-400 !uppercase !tracking-[0.2em] text-right !px-8">Governance</th>
              <td mat-cell *matCellDef="let user" class="text-right !px-8 !border-b !border-slate-50">
                <div class="flex justify-end gap-2">
                  <button (click)="viewUser(user)" class="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-all">
                    <mat-icon class="!text-xl">visibility</mat-icon>
                  </button>
                  <button [matMenuTriggerFor]="menu" class="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-all">
                    <mat-icon class="!text-xl">more_vert</mat-icon>
                  </button>
                  <mat-menu #menu="matMenu" class="!rounded-2xl !p-2 !shadow-2xl !border !border-slate-100">
                    <button mat-menu-item (click)="editUser(user)">
                      <mat-icon class="text-slate-400">edit</mat-icon>
                      <span class="font-bold text-xs uppercase text-slate-600">Edit Identity</span>
                    </button>
                    <button mat-menu-item (click)="suspendUser(user)" class="!text-rose-600">
                      <mat-icon class="text-rose-600">block</mat-icon>
                      <span class="font-bold text-xs uppercase">Suspend Access</span>
                    </button>
                  </mat-menu>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="group hover:bg-slate-50/50 transition-colors cursor-pointer"></tr>
          </table>
        </div>
        
        @if (users.length === 0) {
          <div class="py-32 flex flex-col items-center justify-center bg-slate-50/30">
            <div class="w-20 h-20 rounded-[32px] bg-white shadow-xl shadow-slate-100 flex items-center justify-center mb-6 border border-slate-100">
              <mat-icon class="!text-[32px] !w-auto !h-auto text-slate-200">search_off</mat-icon>
            </div>
            <h3 class="text-xl font-black text-slate-900 mb-1">No matches found</h3>
            <p class="text-slate-400 font-medium text-sm">Refine your filters or search terms.</p>
          </div>
        }
      </mat-card>
    </div>
  `,
  styles: [`
    :host { display: block; }
    :ng-deep .custom-field .mat-mdc-form-field-subscript-wrapper { display: none; }
    :ng-deep .custom-field .mat-mdc-text-field-wrapper { border-radius: 16px !important; }
    
    ::ng-deep .mat-mdc-progress-bar.health-teal { --mdc-linear-progress-active-indicator-color: #10b981; }
    ::ng-deep .mat-mdc-progress-bar.health-blue { --mdc-linear-progress-active-indicator-color: #6366f1; }
    ::ng-deep .mat-mdc-progress-bar.health-red { --mdc-linear-progress-active-indicator-color: #f43f5e; }

    @media (max-width: 768px) {
      .text-5xl { font-size: 2.5rem !important; }
      .p-12, .p-10 { padding: 1.5rem !important; }
      .grid-cols-4, .grid-cols-3 { grid-template-columns: 1fr !important; }
      
      .mat-mdc-table { display: block; overflow-x: auto; }
      .mat-mdc-header-row, .mat-mdc-row { min-width: 800px; }
    }
  `]
})
export class AdminUserManagementPage {
  state = inject(PlatformStateService);
  private notification = inject(NotificationService);
  private auth = inject(AuthService);
  
  displayedColumns: string[] = ['identity', 'role', 'status', 'progress', 'actions'];
  selectedRole = signal<string>('all');
  selectedStatus = signal<string>('any');
  searchQuery = signal<string>('');
  selectedUser = signal<any | null>(null);
  
  get dynamicStats() {
    return [
      { label: 'Total Users', value: this.state.workers().length + this.state.clients().length, subtext: 'live', icon: 'group', trendClass: 'text-emerald-500' },
      { label: 'Verified Experts', value: this.state.verifiedWorkers().length, subtext: 'Quality Assured', icon: 'verified', trendClass: 'text-indigo-500' },
      { label: 'Active Clients', value: this.state.clients().length, subtext: 'Registered', icon: 'payments', trendClass: 'text-indigo-500' },
      { label: 'Pending Review', value: this.state.pendingWorkers().length, subtext: 'Priority Queue', icon: 'priority_high', trendClass: 'text-rose-500' }
    ];
  }

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
                                (status === 'pending' && (w.status === 'Pending' || w.status === 'Priority')) ||
                                (status === 'suspended' && w.status === 'Suspended');
           return matchesSearch && matchesStatus;
        })
        .map(w => ({
          ...w,
          identity: w.name,
          role: 'Service Provider',
          tier: w.status === 'Verified' ? 'Tier 3 Platinum' : 'Tier 1 New',
          statusClass: w.status === 'Verified' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 
                       w.status === 'Suspended' ? 'bg-rose-50 text-rose-700 border border-rose-100 animate-pulse' :
                       w.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 
                       'bg-slate-50 text-slate-500 border border-slate-100',
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
          tier: c.tier || 'Standard',
          statusClass: c.status === 'Active' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-rose-50 text-rose-700 border border-rose-100',
          progress: c.progress || 90,
          progressClass: (c.progress || 90) >= 90 ? 'health-teal' : 'health-blue'
        }));
    }

    return [...workers, ...clients];
  }

  viewUser(user: any) {
    this.selectedUser.set(user);
    this.notification.info(`Loading professional dossier for ${user.identity}...`);
    
    // Smooth scroll to the top where the panel appeared
    setTimeout(() => {
      const element = document.getElementById('user-profile-anchor');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
  }

  closeProfile() {
    this.selectedUser.set(null);
  }

  editUser(user: any) {
    const fullName = window.prompt('Enter new full name', user.name || user.identity);
    if (!fullName || !fullName.trim()) return;
    this.state.updateUserName(user.id, fullName.trim()).subscribe({
      next: () => {
        this.notification.success(`Updated ${user.identity}.`);
        this.state.fetchAdminUsers();
        this.state.fetchAdminClients();
      },
      error: () => this.notification.error('Failed to update user.')
    });
  }

  suspendUser(user: any) {
    this.state.suspendUser(user.id).subscribe({
      next: () => {
        this.notification.success(`${user.identity} suspended.`);
        this.state.workers.update(prev => prev.map(w => w.id === user.id ? { ...w, status: 'Suspended' as any } : w));
        this.state.clients.update(prev => prev.map(c => c.id === user.id ? { ...c, status: 'Suspended' as any } : c));
        this.state.fetchAdminUsers();
      },
      error: () => this.notification.error('Failed to suspend user.')
    });
  }

  promoteUser(user: any) {
    if (user.role === 'Service Provider') {
      this.state.approveWorker(user.id);
      this.notification.success(`SUCCESS: ${user.name} is now a Verified Service Provider!`);
    } else {
      this.notification.success(`SUCCESS: ${user.name} has been promoted to VIP Tier!`);
    }
    // Update the selected user reference
    setTimeout(() => {
      const updated = this.users.find(u => u.id === user.id);
      if (updated) this.selectedUser.set(updated);
    }, 500);
  }

  exportData() {
    const rows = this.users.map(u => ({
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      tier: u.tier
    }));
    const header = 'name,email,role,status,tier';
    const csv = [header, ...rows.map(r => `${r.name},${r.email},${r.role},${r.status},${r.tier}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.notification.success('User data exported.');
  }

  inviteUser() {
    const name = window.prompt('Invite user full name');
    const email = window.prompt('Invite user email');
    const roleInput = (window.prompt('Role: Client or Worker', 'Client') || 'Client').toLowerCase();
    if (!name || !email) return;
    const role = roleInput === 'worker' ? 'Worker' : 'Client';
    const tempPassword = `Temp${Math.floor(Math.random() * 900000 + 100000)}!`;
    this.auth.register(name, email, role as any, tempPassword).subscribe({
      next: () => {
        this.notification.success(`Invitation created. Temporary password: ${tempPassword}`);
        this.state.fetchAdminUsers();
        this.state.fetchAdminClients();
      },
      error: () => this.notification.error('Failed to invite user.')
    });
  }
}
