import { Component, inject, OnInit, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { PlatformStateService } from '../../../core/services/platform-state.service';

@Component({
  selector: 'app-admin-verification-queue',
  standalone: true,
  imports: [
    CommonModule, 
    MatCardModule, 
    MatButtonModule, 
    MatIconModule, 
    MatTableModule, 
    MatChipsModule,
    MatProgressBarModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatCheckboxModule
  ],
  template: `
    <div class="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 p-4 md:p-0">
      <!-- Header Section (Thinner) -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <span class="bg-brand-teal-soft text-brand-teal text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-brand-teal/30">Admin Queue</span>
            <span class="text-slate-400 text-[9px] font-bold uppercase tracking-widest">
              @if (state.isLoadingWorkers() && state.pendingWorkers().length === 0) { Syncing... } @else { {{ state.pendingWorkers().length }} Pending Reviews }
            </span>
          </div>
          <h1 class="text-3xl font-black text-slate-900 tracking-tight">Service Provider Queue</h1>
        </div>
        
        <div class="flex items-center gap-3">
          @if (selectedIds.size > 0) {
            <div class="bg-white border border-slate-200 px-4 py-2 rounded-2xl flex items-center gap-4 shadow-sm animate-in slide-in-from-right-10">
              <span class="text-[10px] font-black text-brand-teal uppercase tracking-widest">{{ selectedIds.size }} Selected</span>
              <div class="h-6 w-[1px] bg-slate-100"></div>
              <div class="flex gap-2">
                <button (click)="openBulkReject()" [disabled]="isProcessing()" class="px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 transition-all border border-red-100 disabled:opacity-50 disabled:cursor-not-allowed">Reject</button>
                <button (click)="bulkApprove()" [disabled]="isProcessing()" class="px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-brand-teal text-white hover:bg-brand-teal-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  @if (isProcessing()) {
                    <span class="inline-block w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  }
                  Approve
                </button>
              </div>
            </div>
          }
          <div class="bg-slate-50 border border-slate-100 px-4 py-2 rounded-2xl flex items-center gap-3">
             <mat-icon class="text-slate-400 !text-lg">search</mat-icon>
             <input type="text" placeholder="Search applicants..." class="bg-transparent border-none text-xs font-medium focus:outline-none w-32 md:w-48">
          </div>
        </div>
      </div>

      <!-- Main Content Card (Thinner Rows) -->
      <mat-card class="!bg-white !border !border-slate-200/60 !shadow-sm !rounded-3xl overflow-hidden relative">
        @if (state.isLoadingWorkers()) {
          <div class="absolute top-0 left-0 right-0 z-10">
            <mat-progress-bar mode="indeterminate" class="!h-0.5"></mat-progress-bar>
          </div>
        }
        
        <div class="overflow-x-auto">
          <table mat-table [dataSource]="pagedPendingWorkers()" class="w-full !bg-transparent">
            <!-- Select Column -->
            <ng-container matColumnDef="select">
              <th mat-header-cell *matHeaderCellDef class="!bg-slate-50/50 !border-b !border-slate-100 !px-6 w-12">
                <mat-checkbox 
                  (change)="$event ? masterToggle() : null"
                  [checked]="isAllSelected()"
                  [indeterminate]="selectedIds.size > 0 && !isAllSelected()"
                  color="primary">
                </mat-checkbox>
              </th>
              <td mat-cell *matCellDef="let user" class="!px-6 !border-b !border-slate-50">
                <mat-checkbox 
                  (click)="$event.stopPropagation()"
                  (change)="$event ? toggleSelection(user.id) : null"
                  [checked]="selectedIds.has(user.id)"
                  color="primary">
                </mat-checkbox>
              </td>
            </ng-container>

            <!-- Applicant Column -->
            <ng-container matColumnDef="applicant">
              <th mat-header-cell *matHeaderCellDef class="!bg-slate-50/50 !border-b !border-slate-100 !text-[10px] !font-black !text-slate-400 !uppercase !tracking-widest !py-4">Applicant</th>
              <td mat-cell *matCellDef="let user" class="!border-b !border-slate-50">
                <div class="flex items-center gap-4 py-3">
                  <div class="relative flex-shrink-0">
                    <div class="w-10 h-10 rounded-xl overflow-hidden border-2 border-white shadow-sm bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs">
                      @if (user.image) { <img [src]="user.image" class="w-full h-full object-cover"> } @else { {{ user.initials }} }
                    </div>
                  </div>
                  <div class="min-w-0">
                    <h3 class="text-sm font-bold text-slate-900 truncate">{{ user.name }}</h3>
                    <p class="text-[10px] text-slate-400 truncate">{{ user.email }} • {{ user.location }}</p>
                  </div>
                </div>
              </td>
            </ng-container>

            <!-- Category Column -->
            <ng-container matColumnDef="category">
              <th mat-header-cell *matHeaderCellDef class="!bg-slate-50/50 !border-b !border-slate-100 !text-[10px] !font-black !text-slate-400 !uppercase !tracking-widest">Category</th>
              <td mat-cell *matCellDef="let user" class="!border-b !border-slate-50">
                <span class="text-xs font-bold text-slate-700">{{ user.category }}</span>
              </td>
            </ng-container>

            <!-- Status Column -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef class="!bg-slate-50/50 !border-b !border-slate-100 !text-[10px] !font-black !text-slate-400 !uppercase !tracking-widest">Priority</th>
              <td mat-cell *matCellDef="let user" class="!border-b !border-slate-50">
                <span class="inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider" 
                      [ngClass]="user.status === 'Priority' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-brand-teal-soft text-brand-teal border border-brand-teal/30'">
                  {{ user.status }}
                </span>
              </td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef class="!bg-slate-50/50 !border-b !border-slate-100 !text-[10px] !font-black !text-slate-400 !uppercase !tracking-widest text-right !px-6">Review</th>
              <td mat-cell *matCellDef="let user" class="text-right !px-6 !border-b !border-slate-50">
                @if (reviewingId === user.id && !detailedReview) {
                  <div class="flex items-center justify-end gap-2 animate-in slide-in-from-right-4">
                    <button (click)="openDetailedReview(user)" class="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 flex items-center justify-center transition-all cursor-pointer" title="View Details">
                      <mat-icon class="!text-lg">visibility</mat-icon>
                    </button>
                    <button (click)="openReject(user)" [disabled]="isProcessing()" class="w-8 h-8 rounded-lg hover:bg-rose-50 text-rose-600 flex items-center justify-center transition-all border border-transparent hover:border-rose-100 disabled:opacity-50 disabled:cursor-not-allowed" title="Reject">
                      <mat-icon class="!text-lg">block</mat-icon>
                    </button>
                    <button (click)="approve(user)" [disabled]="isProcessing()" class="px-4 py-1.5 rounded-lg bg-brand-teal text-white text-[10px] font-black uppercase tracking-widest hover:bg-brand-teal-dark transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                      @if (isProcessing()) {
                        <span class="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Processing...
                      } @else {
                        Approve
                      }
                    </button>
                    <button (click)="reviewingId = null" [disabled]="isProcessing()" class="text-slate-300 hover:text-slate-500 ml-1 disabled:opacity-50" [attr.aria-label]="'Close'"><mat-icon class="!text-lg">close</mat-icon></button>
                  </div>
                } @else if (reviewingId === user.id && detailedReview) {
                  <button (click)="detailedReview = null" class="text-slate-400 hover:text-slate-600"><mat-icon class="!text-lg">close</mat-icon></button>
                } @else {
                  <button (click)="reviewingId = user.id" class="px-5 py-2 rounded-xl text-brand-teal text-[10px] font-black uppercase tracking-widest border border-brand-teal/20 hover:bg-brand-teal-soft transition-all">
                    Start Review
                  </button>
                }
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="group hover:bg-slate-50/50 transition-all cursor-pointer"></tr>
          </table>
        </div>
        
        @if (state.pendingWorkers().length === 0 && !state.isLoadingWorkers()) {
          <div class="py-20 flex flex-col items-center justify-center bg-slate-50/30">
            <div class="w-16 h-16 rounded-3xl bg-white shadow-sm flex items-center justify-center mb-6 border border-slate-100">
              <mat-icon class="!text-3xl text-brand-teal">check_circle</mat-icon>
            </div>
            <h3 class="text-xl font-black text-slate-900 mb-1">Queue is Clear</h3>
            <p class="text-slate-400 text-xs font-medium">No pending applications at the moment.</p>
          </div>
        }
        
        <!-- Paginator (Thinner) -->
        @if (state.pendingWorkers().length > pageSize) {
          <div class="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Page {{ currentPage }} of {{ totalPages }}
            </div>
            <div class="flex items-center gap-1">
              <button (click)="prevPage()" [disabled]="currentPage === 1" class="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-white hover:text-slate-900 disabled:opacity-30 transition-all">
                <mat-icon class="!text-lg">chevron_left</mat-icon>
              </button>
              @for (p of pageNumbers; track p) {
                <button
                  (click)="goToPage(p)"
                  class="w-8 h-8 rounded-lg text-[10px] font-black transition-all"
                  [ngClass]="p === currentPage ? 'bg-brand-teal text-white shadow-md' : 'text-slate-500 hover:bg-white'">
                  {{ p }}
                </button>
              }
              <button (click)="nextPage()" [disabled]="currentPage >= totalPages" class="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-white hover:text-slate-900 disabled:opacity-30 transition-all">
                <mat-icon class="!text-lg">chevron_right</mat-icon>
              </button>
            </div>
          </div>
        }
      </mat-card>

      <!-- Detailed Review Panel -->
      @if (detailedReview) {
        <div id="detailed-review-anchor"></div>
        <mat-card class="!bg-white !border !border-slate-200/60 !shadow-[0_20px_50px_rgba(0,0,0,0.1)] !rounded-[40px] overflow-hidden animate-in zoom-in duration-500 mt-12">
          <div class="flex flex-col md:flex-row">
            <!-- Left Profile Section -->
            <div class="md:w-1/3 bg-slate-50/50 p-10 border-r border-slate-100">
              <div class="flex flex-col items-center text-center">
                <div class="w-32 h-32 rounded-[40px] overflow-hidden border-4 border-white shadow-xl mb-6 bg-slate-900 flex items-center justify-center text-white text-4xl font-black">
                  @if (detailedReview.image) { <img [src]="detailedReview.image" class="w-full h-full object-cover"> } @else { {{ detailedReview.initials }} }
                </div>
                <h2 class="text-2xl font-black text-slate-900 mb-1 leading-tight">{{ detailedReview.name }}</h2>
                <p class="text-brand-teal font-black text-[10px] uppercase tracking-widest mb-6">{{ detailedReview.category }}</p>
                <p class="text-sm font-black text-slate-900">{{ detailedReview.skills?.length || 0 }}</p>
              </div>

              <div class="mt-8 space-y-4">
                <div class="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm text-center">
                  <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">History</span>
                  <p class="text-sm font-black text-slate-900">{{ detailedReview.workHistory?.length || 0 }}</p>
                </div>
                <div class="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm text-center">
                  <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Docs</span>
                  <p class="text-sm font-black text-slate-900">{{ detailedReview.uploadedDocuments?.length || 0 }}</p>
                </div>
                <div class="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm">
                  <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Base Compensation</span>
                  <div class="flex items-baseline gap-1">
                    <span class="text-2xl font-black text-slate-900">\${{ detailedReview.rate }}</span>
                    <span class="text-xs font-bold text-slate-400">/hr</span>
                  </div>
                </div>
                <div class="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm">
                  <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Location Context</span>
                  <p class="text-sm font-bold text-slate-900 mb-1">{{ detailedReview.location }}</p>
                  <p class="text-[11px] text-slate-400 font-medium leading-relaxed">{{ detailedReview.preferredLocations?.join(', ') }}</p>
                </div>
              </div>
            </div>

            <!-- Right Content Section -->
            <div class="md:w-2/3 p-10 flex flex-col">
              <div class="flex justify-between items-center mb-10">
                 <h3 class="text-xl font-black text-slate-900 tracking-tight">Professional Dossier</h3>
                 <button (click)="detailedReview = null" class="w-10 h-10 rounded-2xl hover:bg-slate-100 flex items-center justify-center transition-all">
                   <mat-icon class="text-slate-400">close</mat-icon>
                 </button>
              </div>

              <div class="space-y-12 flex-grow">
                <!-- Bio -->
                <div>
                   <h4 class="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Professional Bio</h4>
                   <p class="text-slate-600 leading-relaxed italic border-l-4 border-brand-teal pl-6 text-sm">"{{ detailedReview.bio || 'No professional bio provided.' }}"</p>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
                   <!-- Experience -->
                   <div>
                      <h4 class="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">Work History</h4>
                      <div class="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-100">
                        @for (work of detailedReview.workHistory; track $index) {
                          <div class="relative pl-10">
                            <div class="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-2 border-brand-teal flex items-center justify-center z-10">
                               <div class="w-2 h-2 rounded-full bg-brand-teal"></div>
                            </div>
                            <p class="font-bold text-slate-900 text-sm mb-1">{{ work.role }} @ {{ work.company }}</p>
                            <p class="text-[10px] text-brand-teal font-bold uppercase mb-2">{{ work.period }}</p>
                            <p class="text-xs text-slate-500 leading-relaxed">{{ work.description }}</p>
                          </div>
                        }
                        @if (detailedReview.workHistory.length === 0) {
                          <p class="text-xs text-slate-400 italic pl-10">No career history provided.</p>
                        }
                      </div>
                   </div>

                   <!-- Certs & Docs -->
                   <div class="space-y-10">
                      <div>
                        <h4 class="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">Certifications</h4>
                        <div class="space-y-4">
                          @for (cert of detailedReview.certifications; track $index) {
                            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                               <div>
                                 <p class="font-bold text-slate-900 text-xs">{{ cert.name }}</p>
                                 <p class="text-[10px] text-slate-400">{{ cert.issuer }}</p>
                               </div>
                               <span class="text-[10px] font-black text-brand-teal bg-white px-2 py-1 rounded-lg border border-brand-teal/20 shadow-sm">{{ cert.year }}</span>
                            </div>
                          }
                        </div>
                      </div>

                      <div>
                        <h4 class="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">Security Documents</h4>
                        <div class="space-y-4">
                          @for (doc of detailedReview.uploadedDocuments; track doc.name) {
                            <div class="p-4 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-brand-teal/30 hover:bg-brand-teal-soft transition-all">
                              <div class="flex items-center gap-4">
                                <div class="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-brand-teal">
                                  <mat-icon class="!text-xl">{{ doc.type.toLowerCase().includes('identification') ? 'badge' : 'verified' }}</mat-icon>
                                </div>
                                <div>
                                  <p class="text-xs font-bold text-slate-900">{{ doc.name }}</p>
                                  <p class="text-[10px] text-slate-400 uppercase">{{ doc.type }}</p>
                                </div>
                              </div>
                              <button class="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-brand-teal group-hover:border-brand-teal/20 shadow-sm transition-all">
                                <mat-icon class="!text-base">download</mat-icon>
                              </button>
                            </div>
                          }
                        </div>
                      </div>
                   </div>
                </div>
              </div>

              <!-- Final Actions -->
               <div class="mt-16 flex justify-end gap-3 items-center">
                  <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-4">Final Determination</span>
                  <button (click)="openReject(detailedReview)" 
                          [disabled]="isProcessing()"
                          class="h-14 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 hover:bg-rose-100 transition-all border border-rose-100 cursor-pointer disabled:cursor-not-allowed">
                     Decline Application
                  </button>
                  <button (click)="approve(detailedReview)" 
                          [disabled]="isProcessing()"
                          class="h-14 px-10 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-slate-200 hover:bg-slate-800 hover:-translate-y-1 transition-all cursor-pointer disabled:cursor-not-allowed">
                     {{ isProcessing() ? 'Processing...' : 'Verify Profile' }}
                  </button>
               </div>
            </div>
          </div>
        </mat-card>
      }

      <!-- Rejection Modal Overaly -->
      @if (rejectingUser || bulkRejecting) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-6 animate-in fade-in duration-300">
          <mat-card class="w-full max-w-lg !rounded-[40px] !bg-white !shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
            <div class="p-10">
              <div class="w-16 h-16 rounded-[24px] bg-rose-50 text-rose-600 flex items-center justify-center mb-8">
                <mat-icon class="!text-3xl">report_problem</mat-icon>
              </div>
              <h3 class="text-2xl font-black text-slate-900 mb-2">Rejection Feedback</h3>
              <p class="text-slate-500 text-sm mb-10 leading-relaxed">
                Provide a clear reason for rejecting {{ bulkRejecting ? selectedIds.size + ' profiles' : rejectingUser.name }}. This feedback will be shared with the applicant to help them improve their submission.
              </p>
              
              <mat-form-field appearance="outline" class="w-full mb-8">
                <mat-label>Submission Issues</mat-label>
                <textarea matInput rows="4" [(ngModel)]="rejectionReason" placeholder="e.g. Identity document is unclear, please provide a high-resolution scan."></textarea>
              </mat-form-field>
              
              <div class="flex flex-col gap-3">
                <button (click)="confirmReject()" 
                        [disabled]="!rejectionReason || isProcessing()" 
                        class="w-full py-4 rounded-2xl bg-rose-600 text-white text-xs font-bold uppercase tracking-widest shadow-xl shadow-rose-200 hover:bg-rose-700 disabled:opacity-50 disabled:shadow-none transition-all cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  @if (isProcessing()) {
                    <span class="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Rejecting...
                  } @else {
                    Confirm Rejection
                  }
                </button>
                <button (click)="cancelReject()" [disabled]="isProcessing()" class="w-full py-4 rounded-2xl text-xs font-bold uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  Go Back
                </button>
              </div>
            </div>
          </mat-card>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; } 
    :ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }
    
    .animate-bounce-slow {
      animation: bounce 3s infinite;
    }

    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-15px); }
    }

    @media (max-width: 768px) {
      .text-5xl { font-size: 2.25rem !important; }
      .p-10 { padding: 1.5rem !important; }
      .grid-cols-2 { grid-template-columns: 1fr !important; }
      
      /* Table Handling */
      .mat-mdc-table { display: block; overflow-x: auto; }
      .mat-mdc-header-row, .mat-mdc-row { min-width: 800px; }
    }
  `]
})
export class AdminVerificationPage implements OnInit {
  state = inject(PlatformStateService);
  private platformId = inject(PLATFORM_ID);
  isProcessing = signal(false);
  displayedColumns: string[] = ['select', 'applicant', 'category', 'status', 'actions'];
  currentPage = 1;
  readonly pageSize = 8;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.state.fetchPendingWorkers();
    }
  }
  reviewingId: string | null = null;
  detailedReview: any = null;
  
  rejectingUser: any = null;
  bulkRejecting = false;
  rejectionReason: string = '';
  
  selectedIds = new Set<string>();

  get totalPages() {
    return Math.max(1, Math.ceil(this.state.pendingWorkers().length / this.pageSize));
  }

  get pageNumbers() {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  pagedPendingWorkers() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.state.pendingWorkers().slice(start, start + this.pageSize);
  }

  isAllSelected() {
    const pending = this.state.pendingWorkers();
    return pending.length > 0 && this.selectedIds.size === pending.length;
  }

  masterToggle() {
    if (this.isAllSelected()) {
      this.selectedIds.clear();
    } else {
      this.state.pendingWorkers().forEach(w => this.selectedIds.add(w.id));
    }
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  prevPage() {
    this.goToPage(this.currentPage - 1);
  }

  nextPage() {
    this.goToPage(this.currentPage + 1);
  }

  toggleSelection(id: string) {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  }

  bulkApprove() {
    this.selectedIds.forEach(id => this.state.approveWorker(id).subscribe());
    this.selectedIds.clear();
  }

  openBulkReject() {
    this.bulkRejecting = true;
    this.rejectionReason = '';
    this.rejectingUser = null;
  }

  openDetailedReview(user: any) {
    this.reviewingId = user.id;
    this.detailedReview = user;
    this.rejectingUser = null;
    
    // Smooth scroll to the details panel after a short delay to allow DOM to update
    setTimeout(() => {
      const element = document.getElementById('detailed-review-anchor');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  approve(user: any) {
    if (this.isProcessing()) return;
    this.isProcessing.set(true);
    
    this.state.approveWorker(user.id).subscribe({
      next: () => {
        // Keep processing state for 500ms to show spinner
        setTimeout(() => {
          this.isProcessing.set(false);
          this.reviewingId = null;
          this.detailedReview = null;
          // Delay re-fetch to let backend state settle
          setTimeout(() => this.state.fetchPendingWorkers(), 300);
        }, 500);
      },
      error: (err) => {
        this.isProcessing.set(false);
        console.error('Error approving worker:', err);
        // Show error notification via notification service
      }
    });
  }

  openReject(user: any) {
    this.rejectingUser = user;
    this.rejectionReason = '';
  }

  cancelReject() {
    this.rejectingUser = null;
    this.bulkRejecting = false;
  }

  confirmReject() {
    if (this.isProcessing() || !this.rejectionReason.trim()) return;
    this.isProcessing.set(true);

    if (this.bulkRejecting) {
      // Process each rejection
      this.selectedIds.forEach(id => {
        this.state.rejectWorker(id, this.rejectionReason).subscribe({
          next: () => {
            // Keep processing state until all are done or timeout
          },
          error: (err) => {
            console.error('Error rejecting worker:', err);
          }
        });
      });
      
      // After a reasonable timeout, close the dialog and refresh
      setTimeout(() => {
        this.isProcessing.set(false);
        this.cancelReject();
        this.selectedIds.clear();
        setTimeout(() => this.state.fetchPendingWorkers(), 300);
      }, 800);
    } else if (this.rejectingUser) {
      this.state.rejectWorker(this.rejectingUser.id, this.rejectionReason).subscribe({
        next: () => {
          setTimeout(() => {
            this.isProcessing.set(false);
            this.cancelReject();
            this.reviewingId = null;
            this.detailedReview = null;
            setTimeout(() => this.state.fetchPendingWorkers(), 300);
          }, 500);
        },
        error: (err) => {
          this.isProcessing.set(false);
          console.error('Error rejecting worker:', err);
          // Show error notification
        }
      });
    }
  }
}
