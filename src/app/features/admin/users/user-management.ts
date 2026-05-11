import { Component, OnInit, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
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
        <mat-card class="max-w-4xl mx-auto !rounded-[32px] !border !border-slate-200/60 !shadow-2xl overflow-hidden mb-12 animate-in slide-in-from-top-4 duration-500 bg-white">
          <!-- Compact Premium Header -->
          <div class="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div class="flex items-center gap-5">
              <div class="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center text-xl font-black text-white shadow-lg overflow-hidden">
                @if (selectedUser().image) { <img [src]="selectedUser().image" class="w-full h-full object-cover"> } @else { {{ selectedUser().initials }} }
              </div>
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <h3 class="text-xl font-black text-slate-900 tracking-tight">{{ selectedUser().name }}</h3>
                  <span class="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase tracking-widest border border-indigo-100">
                    {{ selectedUser().role }}
                  </span>
                </div>
                <div class="flex items-center gap-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                  <span>{{ selectedUser().email }}</span>
                  <span class="h-1 w-1 rounded-full bg-slate-200"></span>
                  <span>{{ selectedUser().tier }} Membership</span>
                </div>
              </div>
            </div>
            <button (click)="closeProfile()" class="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm">
              <mat-icon class="!text-lg">close</mat-icon>
            </button>
          </div>
          
          <div class="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            <!-- Left Side: Narrative & Competencies -->
            <div class="lg:col-span-7 space-y-6">
              <div class="space-y-2">
                 <h4 class="text-[8px] font-black text-slate-400 uppercase tracking-[0.15em]">Profile Narrative</h4>
                 <div class="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                    <p class="text-slate-600 text-xs font-medium leading-relaxed italic border-l-2 border-indigo-500 pl-4">
                      {{ selectedUser().bio || 'No professional biography provided for this profile.' }}
                    </p>
                 </div>
              </div>

              @if (selectedUser().role === 'Service Provider') {
                <div class="space-y-2">
                   <h4 class="text-[8px] font-black text-slate-400 uppercase tracking-[0.15em]">Core Competencies</h4>
                   <div class="flex flex-wrap gap-1.5">
                      @for (skill of selectedUser().skills; track skill) {
                        <span class="px-3 py-1.5 rounded-lg bg-white text-slate-700 text-[9px] font-bold border border-slate-200 shadow-sm">{{ skill }}</span>
                      }
                   </div>
                </div>
              }

              @if (selectedUser().role === 'Enterprise Client' && selectedUser().totalSpend) {
                <div class="space-y-2">
                  <h4 class="text-[8px] font-black text-slate-400 uppercase tracking-[0.15em]">Platform Engagement</h4>
                  <div class="grid grid-cols-2 gap-3">
                      <div class="p-4 rounded-xl border border-slate-100 bg-white shadow-sm flex items-center gap-4">
                        <div class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                          <mat-icon class="!text-sm">payments</mat-icon>
                        </div>
                        <div>
                          <p class="text-sm font-black text-slate-900 leading-none mb-1">\${{ selectedUser().totalSpend }}</p>
                          <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Volume</p>
                        </div>
                      </div>
                      <div class="p-4 rounded-xl border border-slate-100 bg-white shadow-sm flex items-center gap-4">
                        <div class="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                          <mat-icon class="!text-sm">handshake</mat-icon>
                        </div>
                        <div>
                          <p class="text-sm font-black text-slate-900 leading-none mb-1">{{ selectedUser().activeBookings || 0 }}</p>
                          <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Active Hires</p>
                        </div>
                      </div>
                  </div>
                </div>
              }
            </div>

            <!-- Right Side: Governance -->
            <div class="lg:col-span-5 space-y-4">
               <h4 class="text-[8px] font-black text-slate-400 uppercase tracking-[0.15em]">Governance</h4>
               <div class="p-5 bg-white border border-slate-200/60 rounded-2xl shadow-xl shadow-slate-100/50 space-y-5">
                 <div class="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                   <span class="text-[9px] font-black text-slate-500 uppercase tracking-widest">Account Status</span>
                   <span class="px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest" [ngClass]="selectedUser().statusClass">
                     {{ selectedUser().status || 'Active' }}
                   </span>
                 </div>
                 
                 <div class="space-y-2 px-1">
                   <div class="flex justify-between items-end">
                     <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest">Profile Health</span>
                     <span class="text-[10px] font-black text-slate-900">{{ selectedUser().progress }}%</span>
                   </div>
                   <mat-progress-bar mode="determinate" [value]="selectedUser().progress" [ngClass]="selectedUser().progressClass" class="!h-1 rounded-full"></mat-progress-bar>
                 </div>

                 <div class="flex flex-col gap-2 pt-1">
                    <button (click)="promoteUser(selectedUser())" 
                            [disabled]="selectedUser().status === 'Verified' || selectedUser().status === 'Active' || isProcessing()"
                            class="w-full py-3 rounded-xl bg-slate-900 text-white font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 transition-all cursor-pointer disabled:cursor-not-allowed">
                      {{ isProcessing() ? 'Processing...' : (selectedUser().status === 'Verified' ? 'Verified Expert' : 'Promote Account') }}
                    </button>
                    <button (click)="suspendUser(selectedUser())" 
                            [disabled]="selectedUser().status === 'Suspended' || isProcessing()"
                            class="w-full py-3 rounded-xl bg-white text-rose-600 border border-rose-100 font-black text-[9px] uppercase tracking-widest hover:bg-rose-50 transition-all cursor-pointer disabled:cursor-not-allowed">
                      {{ isProcessing() ? 'Suspending...' : 'Suspend Access' }}
                    </button>
                    @if (selectedUser().status === 'Suspended') {
                      <button (click)="activateUser(selectedUser())" 
                              [disabled]="isProcessing()"
                              class="w-full py-3 rounded-xl bg-emerald-600 text-white font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-emerald-500 transition-all cursor-pointer">
                        {{ isProcessing() ? 'Activating...' : 'Activate Access' }}
                      </button>
                    }
                 </div>
               </div>
            </div>
          </div>
        </mat-card>
      }

      <!-- Header & Main Management Section -->
      <!-- Compact Registry Header -->
      <div class="flex flex-col gap-6 mb-8">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="text-slate-400 text-[8px] font-black uppercase tracking-widest">User Registry</span>
            </div>
            <h1 class="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Participant Oversight</h1>
          </div>
          
          <div class="flex items-center gap-3">
             <!-- Compact Stat Strip -->
             <div class="hidden lg:flex items-center gap-6 px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                @for (stat of dynamicStats; track stat.label) {
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-50 text-slate-400">
                      <mat-icon class="!text-sm">{{ stat.icon }}</mat-icon>
                    </div>
                    <div>
                      <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{{ stat.label }}</p>
                      <p class="text-sm font-black text-slate-900 leading-none">{{ stat.value }}</p>
                    </div>
                    @if (!$last) { <div class="h-6 w-px bg-slate-100 ml-4"></div> }
                  </div>
                }
             </div>
          </div>
        </div>
      </div>

      <!-- Main Registry Card -->
      <mat-card class="!rounded-[32px] !border !border-slate-200/60 !shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <!-- Filter Header -->
        <div class="p-6 border-b border-slate-100 flex flex-col lg:flex-row gap-4 items-center justify-between bg-slate-50/50">
          <div class="flex flex-wrap gap-4 w-full lg:w-auto">
            <div class="relative group w-full sm:w-80">
              <mat-icon class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 !text-base">search</mat-icon>
              <input class="w-full pl-11 pr-12 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none" 
                     placeholder="Search identities..." 
                     type="text" 
                     [ngModel]="searchQuery()" 
                     (ngModelChange)="setSearch($any($event))"/>
              @if (searchQuery()) {
                <button (click)="setSearch('')" class="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
                  <mat-icon class="!text-sm">close</mat-icon>
                </button>
              }
            </div>

            <div class="flex gap-3 items-center">
              <mat-form-field appearance="outline" class="!text-xs h-[48px] custom-field">
                <mat-select [value]="selectedRole()" (selectionChange)="setRole($event.value)">
                  <mat-option value="all">All Roles</mat-option>
                  <mat-option value="worker">Service Providers</mat-option>
                  <mat-option value="client">Enterprise Clients</mat-option>
                </mat-select>
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="!text-xs h-[48px] custom-field">
                <mat-select [value]="selectedStatus()" (selectionChange)="setStatus($event.value)">
                  <mat-option value="any">Any Status</mat-option>
                  <mat-option value="verified">Verified</mat-option>
                  <mat-option value="pending">Pending Review</mat-option>
                  <mat-option value="suspended">Suspended</mat-option>
                </mat-select>
              </mat-form-field>

              @if (selectedRole() !== 'all' || selectedStatus() !== 'any' || searchQuery()) {
                <button (click)="resetFilters()" class="px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all border border-indigo-100">
                  Reset Filters
                </button>
              }
            </div>
          </div>
          
          <div class="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <span>Showing {{ pagedUsers.length }} of {{ users.length }} results</span>
            <div class="flex gap-1">
              <button (click)="prevPage()" [disabled]="currentPage() === 1" class="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-all disabled:opacity-40"><mat-icon class="!text-sm">chevron_left</mat-icon></button>
              <button (click)="nextPage()" [disabled]="currentPage() >= totalPages" class="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-all disabled:opacity-40"><mat-icon class="!text-sm">chevron_right</mat-icon></button>
            </div>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table mat-table [dataSource]="pagedUsers" class="w-full !bg-transparent">
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
                    @if (user.status === 'Suspended') {
                      <button mat-menu-item (click)="activateUser(user)" class="!text-emerald-600">
                        <mat-icon class="text-emerald-600">check_circle</mat-icon>
                        <span class="font-bold text-xs uppercase">Activate Access</span>
                      </button>
                    }
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
        @if (users.length > pageSize) {
          <div class="p-5 bg-slate-50/30 border-t border-slate-100 flex items-center justify-center gap-2">
            @for (p of pageNumbers; track p) {
              <button
                (click)="goToPage(p)"
                class="w-8 h-8 rounded-lg border text-[10px] font-black transition-all"
                [ngClass]="p === currentPage() ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'">
                {{ p }}
              </button>
            }
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
export class AdminUserManagementPage implements OnInit {
  state = inject(PlatformStateService);
  private notification = inject(NotificationService);
  private auth = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  
  isProcessing = signal(false);

  displayedColumns: string[] = ['identity', 'role', 'status', 'progress', 'actions'];
  selectedRole = signal<string>('all');
  selectedStatus = signal<string>('any');
  searchQuery = signal<string>('');
  selectedUser = signal<any | null>(null);
  currentPage = signal<number>(1);
  readonly pageSize = 5;

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
          tier: w.status === 'Verified' ? 'Verified Professional' : 'New Applicant',
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
          const matchesStatus = status === 'any' || 
            (status === 'verified' && c.status === 'Active') ||
            (status === 'suspended' && c.status === 'Suspended');
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

  get totalPages() {
    return Math.max(1, Math.ceil(this.users.length / this.pageSize));
  }

  get pagedUsers() {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.users.slice(start, start + this.pageSize);
  }

  get pageNumbers() {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.state.fetchAdminUsers();
      this.state.fetchAdminClients();
    }
  }

  setRole(value: string) {
    this.selectedRole.set(value);
    this.currentPage.set(1);
  }

  setStatus(value: string) {
    this.selectedStatus.set(value);
    this.currentPage.set(1);
  }

  setSearch(value: string) {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage.set(page);
  }

  resetFilters() {
    this.selectedRole.set('all');
    this.selectedStatus.set('any');
    this.searchQuery.set('');
    this.currentPage.set(1);
  }

  prevPage() {
    this.goToPage(this.currentPage() - 1);
  }

  nextPage() {
    this.goToPage(this.currentPage() + 1);
  }

  viewUser(user: any) {
    this.selectedUser.set(user);

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
    this.state.updateUserName(user.userId || user.id, fullName.trim()).subscribe({
      next: () => {
        this.notification.success(`Updated ${user.identity}.`);
        this.state.fetchAdminUsers();
        this.state.fetchAdminClients();
      },
      error: () => this.notification.error('Failed to update user.')
    });
  }

  suspendUser(user: any) {
    if (this.isProcessing()) return;
    
    this.isProcessing.set(true);
    const originalStatus = user.status;
    user.status = 'Suspended';
    
    this.state.suspendUser(user.userId || user.id).subscribe({
      next: () => {
        this.isProcessing.set(false);
        this.notification.success(`${user.identity} suspended.`);
        this.state.workers.update(prev => prev.map(w => w.id === user.id ? { ...w, status: 'Suspended' as any } : w));
        this.state.clients.update(prev => prev.map(c => c.id === user.id ? { ...c, status: 'Suspended' as any } : c));
        this.state.fetchAdminUsers();
      },
      error: () => {
        this.isProcessing.set(false);
        user.status = originalStatus;
        this.notification.error('Failed to suspend user.');
      }
    });
  }

  activateUser(user: any) {
    if (this.isProcessing()) return;
    this.isProcessing.set(true);
    this.state.activateUser(user.userId || user.id).subscribe({
      next: () => {
        this.isProcessing.set(false);
        this.notification.success(`${user.identity} activated.`);
        this.state.fetchAdminUsers();
        if (this.selectedUser()?.id === user.id) {
          this.selectedUser.update(u => u ? { ...u, status: 'Active' } : null);
        }
      },
      error: () => {
        this.isProcessing.set(false);
        this.notification.error('Failed to activate user.');
      }
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
