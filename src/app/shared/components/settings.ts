import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { PlatformStateService } from '../../core/services/platform-state.service';

@Component({
  selector: 'app-shared-settings',
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
    <div class="max-w-4xl mx-auto space-y-6 md:space-y-8 pb-24 font-manrope animate-in fade-in slide-in-from-bottom-4 duration-1000 px-4 md:px-0">
      <!-- Profile Hero (Optimized for Small Screens) -->
      <section class="flex flex-col items-center pt-8 md:pt-12 relative overflow-hidden rounded-[1.5rem] md:rounded-[2rem] bg-slate-900 p-6 md:p-12 text-white mb-6 md:mb-12">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent"></div>
        
        <div class="relative group z-10">
          <div class="w-24 h-24 md:w-32 md:h-32 rounded-[2rem] md:rounded-[2.5rem] border-4 border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden shadow-2xl transition-transform group-hover:scale-105 duration-500 flex items-center justify-center">
            @if (isUploadingAvatar()) {
              <div class="w-8 h-8 md:w-10 md:h-10 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
            } @else if (auth.currentUser()?.avatarUrl) {
              <img [src]="auth.currentUser()?.avatarUrl" alt="Profile" class="w-full h-full object-cover">
            } @else {
              <div class="text-3xl md:text-4xl font-black text-white/40 uppercase">
                {{ auth.currentUser()?.name?.charAt(0) }}
              </div>
            }
          </div>
          <button (click)="avatarInput.click()" [disabled]="isUploadingAvatar()" class="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 bg-white text-slate-950 p-2 md:p-3 rounded-xl md:rounded-2xl shadow-xl active:scale-95 transition-all hover:bg-primary hover:text-white disabled:opacity-50">
            <mat-icon class="!text-[16px] md:!text-[20px]">photo_camera</mat-icon>
          </button>
          <input #avatarInput type="file" accept="image/*" class="hidden" (change)="onAvatarSelected($event)">
        </div>

        <div class="text-center mt-6 md:mt-8 z-10">
          <h1 class="text-xl md:text-3xl font-black text-white tracking-tighter mb-1 md:mb-2">{{ auth.currentUser()?.name }}</h1>
          <p class="text-white/50 text-[10px] md:text-xs font-black uppercase tracking-widest">
            {{ auth.currentUser()?.email }} | {{ auth.currentUser()?.role === 'Client' ? 'Employer' : auth.currentUser()?.role }}
          </p>
          <p class="text-white/60 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.3em] mt-2">
            {{ form.phoneNumber || auth.currentUser()?.phoneNumber || state.currentClient()?.phoneNumber || state.currentWorker().phoneNumber || 'Phone not set' }}
          </p>
        </div>
      </section>

      <div class="grid gap-6 md:gap-8">
        <!-- Identity Section -->
        <mat-card class="!rounded-[1.5rem] md:!rounded-[2rem] !border !border-slate-100 !bg-white !shadow-sm !p-6 md:!p-10">
          <h2 class="text-[10px] md:text-xs font-black text-slate-400 mb-6 md:mb-10 uppercase tracking-[0.2em] flex items-center gap-3">
            <div class="w-2 h-2 rounded-full bg-blue-600"></div>
            Account Info
          </h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div class="space-y-3">
              <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
              <input [(ngModel)]="form.name" class="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 md:px-5 md:py-4 text-sm font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all outline-none" placeholder="Enter your full name">
            </div>
            <div class="space-y-3">
              <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
              <div class="w-full bg-slate-100/50 border border-slate-100 rounded-xl px-4 py-3 md:px-5 md:py-4 text-sm font-bold text-slate-400 flex items-center justify-between">
                {{ auth.currentUser()?.email }}
                <mat-icon class="!text-sm">lock</mat-icon>
              </div>
            </div>
            <div class="space-y-3">
              <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
              <input [(ngModel)]="form.phoneNumber" class="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 md:px-5 md:py-4 text-sm font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all outline-none" placeholder="Enter your phone number">
            </div>
          </div>
        </mat-card>

        <!-- Security Section -->
        <mat-card class="!rounded-[1.5rem] md:!rounded-[2rem] !border !border-slate-100 !bg-white !shadow-sm !p-6 md:!p-10">
          <h2 class="text-[10px] md:text-xs font-black text-slate-400 mb-6 md:mb-10 uppercase tracking-[0.2em] flex items-center gap-3">
            <div class="w-2 h-2 rounded-full bg-amber-500"></div>
            Password Security
          </h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div class="space-y-3">
              <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">New Password</label>
              <input type="password" [(ngModel)]="form.newPassword" class="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 md:px-5 md:py-4 text-sm font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all outline-none" placeholder="••••••••">
            </div>
            <div class="space-y-3">
              <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirm Password</label>
              <input type="password" [(ngModel)]="form.confirmPassword" class="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 md:px-5 md:py-4 text-sm font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all outline-none" placeholder="••••••••">
            </div>
          </div>
        </mat-card>

        <!-- Danger Zone -->
        <mat-card class="!rounded-[1.5rem] md:!rounded-[2rem] !border !border-rose-100 !bg-rose-50/20 !p-6 md:!p-10">
          <div class="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
            <div class="text-center md:text-left">
              <h2 class="text-[10px] md:text-xs font-black text-rose-600 mb-1 md:mb-2 uppercase tracking-[0.2em]">Account Liquidation</h2>
              <p class="text-[10px] md:text-[11px] text-rose-900/60 font-bold uppercase tracking-tight">Permanently remove your identity and data.</p>
            </div>
            <button (click)="liquidateAccount()" class="w-full md:w-auto px-6 py-3 border border-rose-200 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all">
              Liquidate Account
            </button>
          </div>
        </mat-card>

        <!-- Global Actions -->
        <div class="flex flex-col sm:flex-row justify-end gap-3 md:gap-4 pt-4">
          <button (click)="resetForm()" class="px-10 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-900 transition-all">Discard Changes</button>
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
export class SharedSettingsPage {
  auth = inject(AuthService);
  notification = inject(NotificationService);
  state = inject(PlatformStateService);

  isSaving = signal(false);
  isUploadingAvatar = signal(false);
  form = {
    name: this.auth.currentUser()?.name || '',
    phoneNumber: this.auth.currentUser()?.phoneNumber || this.state.currentClient()?.phoneNumber || this.state.currentWorker()?.phoneNumber || '',
    newPassword: '',
    confirmPassword: ''
  };

  syncPhone = effect(() => {
    const currentUser = this.auth.currentUser();
    const worker = this.state.currentWorker();

    if (currentUser?.name && !this.form.name) {
      this.form.name = currentUser.name;
    }

    if (!this.form.phoneNumber) {
      this.form.phoneNumber = currentUser?.phoneNumber || this.state.currentClient()?.phoneNumber || worker?.phoneNumber || '';
    }
  });

  onAvatarSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    this.isUploadingAvatar.set(true);
    
    if (this.auth.currentUser()?.role === 'Worker') {
      this.state.uploadProfilePicture(this.auth.currentUser()!.id, file).subscribe({
        next: (res: any) => {
          this.auth.updateUser({ avatarUrl: res.profilePictureUrl });
          this.notification.success('Profile picture updated');
          this.isUploadingAvatar.set(false);
        },
        error: (err) => {
          this.notification.error('Failed to upload profile picture');
          this.isUploadingAvatar.set(false);
        }
      });
    } else {
      // Real upload to Cloudinary and persistence for Admin/Clients
      this.state.uploadMedia(file).subscribe({
        next: (res: any) => {
          const uploadedUrl = res.url;
          this.state.updateAccountProfile(this.form.name, undefined, uploadedUrl).subscribe({
            next: () => {
              this.auth.updateUser({ avatarUrl: uploadedUrl });
              this.notification.success('Profile picture updated');
              this.isUploadingAvatar.set(false);
            },
            error: (err) => {
              this.notification.error('Failed to save profile picture');
              this.isUploadingAvatar.set(false);
            }
          });
        },
        error: (err) => {
          this.notification.error('Failed to upload profile picture');
          this.isUploadingAvatar.set(false);
        }
      });
    }
  }

  resetForm() {
    this.form.name = this.auth.currentUser()?.name || '';
    this.form.phoneNumber = this.auth.currentUser()?.phoneNumber || this.state.currentClient()?.phoneNumber || this.state.currentWorker()?.phoneNumber || '';
    this.form.newPassword = '';
    this.form.confirmPassword = '';
  }

  saveSettings() {
    if (this.form.newPassword && this.form.newPassword !== this.form.confirmPassword) {
      this.notification.error('Passwords do not match');
      return;
    }

    this.isSaving.set(true);
    
    // 1. Update Profile Name / Phone if changed
    const profilePayload = {
      name: this.form.name,
      phoneNumber: this.form.phoneNumber
    };

    if (this.form.name !== this.auth.currentUser()?.name || this.form.phoneNumber !== this.auth.currentUser()?.phoneNumber) {
      this.state.updateAccountProfile(profilePayload.name, profilePayload.phoneNumber).subscribe({
        next: (res: any) => {
          this.auth.updateUser({ name: res.name || profilePayload.name, phoneNumber: res.phoneNumber || profilePayload.phoneNumber });
          this.notification.success('Profile details updated');
          if (!this.form.newPassword) {
            this.isSaving.set(false);
          }
        },
        error: (err) => {
          this.notification.error('Failed to update profile details');
          this.isSaving.set(false);
        }
      });
    }

    // 2. Update Password if provided
    if (this.form.newPassword) {
      this.state.updateAccountPassword(this.form.newPassword).subscribe({
        next: () => {
          this.notification.success('Password updated successfully');
          this.form.newPassword = '';
          this.form.confirmPassword = '';
          this.isSaving.set(false);
        },
        error: () => {
          this.notification.error('Failed to update password');
          this.isSaving.set(false);
        }
      });
    } else {
      setTimeout(() => this.isSaving.set(false), 800);
    }
  }

  liquidateAccount() {
    if (confirm('WARNING: This will permanently delete your account and all associated data. This action CANNOT be undone. Are you absolutely sure?')) {
      this.state.liquidateAccount().subscribe({
        next: () => {
          this.notification.success('Account liquidated. Redirecting...');
          setTimeout(() => this.auth.logout(), 2000);
        },
        error: () => this.notification.error('Failed to liquidate account. Please contact support.')
      });
    }
  }
}
