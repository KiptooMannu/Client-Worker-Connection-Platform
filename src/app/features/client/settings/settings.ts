import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PlatformStateService } from '../../../core/services/platform-state.service';

@Component({
  selector: 'app-client-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule
  ],
  template: `
    <div class="max-w-4xl mx-auto space-y-8 pb-24 font-manrope animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <!-- Profile Hero (Premium Glassmorphism) -->
      <section class="flex flex-col items-center pt-12 relative overflow-hidden rounded-[2rem] bg-slate-900 p-12 text-white mb-12">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent"></div>
        
        <div class="relative group z-10">
          <div class="w-32 h-32 rounded-[2.5rem] border-4 border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden shadow-2xl transition-transform group-hover:scale-105 duration-500 flex items-center justify-center">
            @if (auth.currentUser()?.avatarUrl) {
              <img [src]="auth.currentUser()?.avatarUrl" alt="Profile" class="w-full h-full object-cover">
            } @else {
              <div class="text-4xl font-black text-white/40 uppercase">
                {{ auth.currentUser()?.name?.charAt(0) }}
              </div>
            }
          </div>
          <button (click)="avatarInput.click()" class="absolute -bottom-2 -right-2 bg-white text-slate-950 p-3 rounded-2xl shadow-xl active:scale-95 transition-all hover:bg-primary hover:text-white">
            <mat-icon class="!text-[20px]">photo_camera</mat-icon>
          </button>
          <input #avatarInput type="file" accept="image/*" class="hidden">
        </div>

        <div class="text-center mt-8 z-10">
          <h1 class="text-3xl font-black text-white tracking-tighter mb-2">{{ auth.currentUser()?.name }}</h1>
          <p class="text-white/50 text-xs font-black uppercase tracking-widest">{{ auth.currentUser()?.email }}</p>
        </div>
      </section>

      <div class="grid gap-8">
        <!-- Identity Section -->
        <mat-card class="!rounded-[2rem] !border !border-slate-100 !bg-white !shadow-sm !p-8 md:p-10">
          <h2 class="text-xs font-black text-slate-400 mb-10 uppercase tracking-[0.2em] flex items-center gap-3">
            <div class="w-2 h-2 rounded-full bg-blue-600"></div>
            Account Info
          </h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="space-y-3">
              <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
              <input [(ngModel)]="form.name" class="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-4 text-sm font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all outline-none" placeholder="Enter your full name">
            </div>
            <div class="space-y-3">
              <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
              <div class="w-full bg-slate-100/50 border border-slate-100 rounded-xl px-5 py-4 text-sm font-bold text-slate-400 flex items-center justify-between">
                {{ auth.currentUser()?.email }}
                <mat-icon class="!text-sm">lock</mat-icon>
              </div>
            </div>
          </div>
        </mat-card>

        <!-- Security Section -->
        <mat-card class="!rounded-[2rem] !border !border-slate-100 !bg-white !shadow-sm !p-8 md:p-10">
          <h2 class="text-xs font-black text-slate-400 mb-10 uppercase tracking-[0.2em] flex items-center gap-3">
            <div class="w-2 h-2 rounded-full bg-amber-500"></div>
            Password Security
          </h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="space-y-3">
              <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">New Password</label>
              <input type="password" [(ngModel)]="form.newPassword" class="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-4 text-sm font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all outline-none" placeholder="••••••••">
            </div>
            <div class="space-y-3">
              <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirm Password</label>
              <input type="password" [(ngModel)]="form.confirmPassword" class="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-4 text-sm font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all outline-none" placeholder="••••••••">
            </div>
          </div>
        </mat-card>

        <!-- Danger Zone -->
        <mat-card class="!rounded-[2rem] !border !border-rose-100 !bg-rose-50/20 !p-8 md:p-10">
          <div class="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h2 class="text-xs font-black text-rose-600 mb-2 uppercase tracking-[0.2em]">Account Liquidation</h2>
              <p class="text-[11px] text-rose-900/60 font-bold uppercase tracking-tight">Permanently remove your identity and data from the platform.</p>
            </div>
            <button class="px-6 py-3 border border-rose-200 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all">
              Liquidate Account
            </button>
          </div>
        </mat-card>

        <!-- Global Actions -->
        <div class="flex flex-col sm:flex-row justify-end gap-4 pt-4">
          <button class="px-10 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-900 transition-all">Discard Changes</button>
          <button (click)="saveSettings()" [disabled]="isSaving()" 
                  class="bg-slate-950 text-white px-12 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-2xl shadow-slate-950/20 disabled:opacity-50">
            {{ isSaving() ? 'Synchronizing...' : 'Update Repository' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class ClientSettingsPage {
  auth = inject(AuthService);
  notification = inject(NotificationService);
  state = inject(PlatformStateService);

  isSaving = signal(false);
  form = {
    name: this.auth.currentUser()?.name || '',
    newPassword: '',
    confirmPassword: ''
  };

  saveSettings() {
    if (this.form.newPassword && this.form.newPassword !== this.form.confirmPassword) {
      this.notification.error('Passwords do not match');
      return;
    }

    this.isSaving.set(true);
    // Simulate API call
    setTimeout(() => {
      this.isSaving.set(false);
      this.notification.success('Settings updated successfully!');
    }, 1500);
  }
}
