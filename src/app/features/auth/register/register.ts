import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NavbarComponent } from '../../../shared/components/navbar';
import { AuthService, UserRole } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule, MatButtonModule, NavbarComponent],
  template: `
    <div class="bg-white text-on-surface font-body-md min-h-screen flex flex-col selection:bg-primary-container selection:text-white">
      <app-navbar [showMessages]="false"></app-navbar>

      <main class="flex-grow flex items-center justify-center px-4 pt-24 pb-8">
        <!-- Auth Container -->
        <div class="w-full max-w-[500px] bg-white rounded-2xl shadow-[0_20px_60px_rgba(46,49,146,0.05)] border border-slate-200 p-6 md:p-8">
          <!-- Header Section -->
          <div class="text-center mb-6">
            <h1 class="font-headline-lg text-2xl md:text-3xl text-brand-teal mb-1">Create Account</h1>
            <p class="font-body-lg text-sm text-secondary">Join the community</p>
          </div>

          <!-- Verification Message (shown after registration) -->
          <div *ngIf="registrationComplete()" class="space-y-6">
            <div class="text-center mb-4">
              <div class="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span class="material-symbols-outlined text-emerald-600 text-3xl">mail</span>
              </div>
              <h2 class="font-headline-md text-xl md:text-2xl text-brand-teal mb-1">Verify Your Email</h2>
              <p class="font-body-md text-sm text-secondary">We sent a 6-digit code to <strong>{{ email }}</strong></p>
            </div>

            <!-- OTP Input Form -->
            <form (ngSubmit)="onVerifyOtp()" class="space-y-4">
              <div *ngIf="otpError()" class="rounded-xl border border-rose-200 bg-rose-50 text-rose-900 px-4 py-3 text-sm">
                {{ otpError() }}
              </div>
              <div *ngIf="otpSuccess()" class="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 px-4 py-3 text-sm">
                {{ otpSuccess() }}
              </div>

              <div class="space-y-2">
                <label class="font-label-sm text-[11px] font-bold text-secondary uppercase tracking-wider block text-center">Verification Code</label>
                <div class="flex justify-center gap-2">
                  <input class="w-full max-w-[200px] h-12 text-center text-xl font-bold tracking-[0.5em] border border-slate-200 rounded-xl focus:ring-4 focus:ring-brand-teal/5 focus:border-brand-teal transition-all outline-none"
                         type="text" maxlength="6" placeholder="000000" name="otpCode" [(ngModel)]="otpCode" required />
                </div>
              </div>

              <button class="w-full h-12 bg-brand-teal text-white font-label-caps text-[11px] font-black tracking-[0.2em] rounded-full shadow-lg shadow-brand-teal/10 hover:bg-brand-teal-dark transition-all active:scale-[0.98] disabled:opacity-50"
                      type="submit" [disabled]="otpLoading()">
                {{ otpLoading() ? 'VERIFYING...' : 'VERIFY CODE' }}
              </button>
            </form>

            <div class="text-center pt-2">
              <button (click)="resendOtp()" class="text-brand-teal font-bold hover:underline text-sm outline-none" [disabled]="resendLoading()" type="button">
                {{ resendLoading() ? 'Sending...' : 'Resend Code' }}
              </button>
            </div>
            
            <div class="pt-4 border-t border-slate-100 text-center">
              <button (click)="backToRegister()" class="text-secondary font-bold hover:underline text-sm outline-none" type="button">Back to Registration</button>
            </div>
          </div>

          <!-- Registration Form (shown when not complete) -->
          <form *ngIf="!registrationComplete()" (ngSubmit)="onSubmit()" class="space-y-4">
            <div *ngIf="formError()" class="rounded-xl border border-rose-200 bg-rose-50 text-rose-900 px-4 py-3">
              <p class="font-semibold text-sm">Registration error</p>
              <p class="text-[13px] mt-1">{{ formError() }}</p>
            </div>
            <!-- Name Row -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="font-label-sm text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block ml-1">First Name <span class="text-rose-500">*</span></label>
                <div class="relative group">
                  <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                  <input class="w-full h-11 pl-11 pr-4 bg-white border border-slate-200 rounded-full focus:ring-4 focus:ring-brand-teal/5 focus:border-brand-teal transition-all text-sm font-body-md text-on-surface outline-none"
                         placeholder="John" type="text" name="firstName" [(ngModel)]="firstName" required/>
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="font-label-sm text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block ml-1">Second Name <span class="text-rose-500">*</span></label>
                <div class="relative group">
                  <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                  <input class="w-full h-11 pl-11 pr-4 bg-white border border-slate-200 rounded-full focus:ring-4 focus:ring-brand-teal/5 focus:border-brand-teal transition-all text-sm font-body-md text-on-surface outline-none"
                         placeholder="Doe" type="text" name="secondName" [(ngModel)]="secondName" required/>
                </div>
              </div>
            </div>

            <!-- Email & Role Row -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="font-label-sm text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block ml-1">Email <span class="text-rose-500">*</span></label>
                <div class="relative group">
                  <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                  <input class="w-full h-11 pl-11 pr-4 bg-white border border-slate-200 rounded-full focus:ring-4 focus:ring-brand-teal/5 focus:border-brand-teal transition-all text-sm font-body-md text-on-surface outline-none"
                         placeholder="john@example.com" type="email" name="email" [(ngModel)]="email" required/>
                </div>
                <p *ngIf="validationErrors()['email']" class="text-rose-600 text-[11px] mt-1">{{ validationErrors()['email'] }}</p>
              </div>

              <div class="space-y-1.5">
                <label class="font-label-sm text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block ml-1">Username <span class="text-rose-500">*</span></label>
                <div class="relative group">
                  <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14"></path></svg>
                  <input class="w-full h-11 pl-11 pr-4 bg-white border border-slate-200 rounded-full focus:ring-4 focus:ring-brand-teal/5 focus:border-brand-teal transition-all text-sm font-body-md text-on-surface outline-none"
                         placeholder="username" type="text" name="username" [(ngModel)]="username" required/>
                </div>
                <p *ngIf="validationErrors()['username']" class="text-rose-600 text-[11px] mt-1">{{ validationErrors()['username'] }}</p>
              </div>

              <div class="space-y-1.5">
                <label class="font-label-sm text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block ml-1">Account Type <span class="text-rose-500">*</span></label>
                <div class="flex p-1 bg-slate-50 border border-slate-100 rounded-full gap-1 h-11">
                  <button (click)="role = 'Client'" 
                          [class.bg-white]="role === 'Client'"
                          [class.text-brand-teal]="role === 'Client'"
                          [class.shadow-sm]="role === 'Client'"
                          [class.text-secondary]="role !== 'Client'"
                          class="flex-1 rounded-full font-label-sm text-[10px] font-bold uppercase tracking-wider transition-all outline-none" type="button">
                    Employer
                  </button>
                  <button (click)="role = 'Worker'"
                          [class.bg-white]="role === 'Worker'"
                          [class.text-brand-teal]="role === 'Worker'"
                          [class.shadow-sm]="role === 'Worker'"
                          [class.text-secondary]="role !== 'Worker'"
                          class="flex-1 rounded-full font-label-sm text-[10px] font-bold uppercase tracking-wider transition-all outline-none" type="button">
                    Worker
                  </button>
                </div>
              </div>
            </div>

            <!-- Password Row -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="font-label-sm text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block ml-1">Password <span class="text-rose-500">*</span></label>
                <div class="relative group">
                  <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  <input class="w-full h-11 pl-11 pr-4 bg-white border border-slate-200 rounded-full focus:ring-4 focus:ring-brand-teal/5 focus:border-brand-teal transition-all text-sm font-body-md text-on-surface outline-none"
                         placeholder="••••••••" [type]="showPassword ? 'text' : 'password'" name="password" [(ngModel)]="password" required/>
                </div>
                <p *ngIf="validationErrors()['password']" class="text-rose-600 text-[11px] mt-1">{{ validationErrors()['password'] }}</p>
              </div>

              <div class="space-y-1.5">
                <label class="font-label-sm text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block ml-1">Confirm <span class="text-rose-500">*</span></label>
                <div class="relative group">
                  <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                  <input class="w-full h-11 pl-11 pr-4 bg-white border border-slate-200 rounded-full focus:ring-4 focus:ring-brand-teal/5 focus:border-brand-teal transition-all text-sm font-body-md text-on-surface outline-none"
                         placeholder="••••••••" [type]="showPassword ? 'text' : 'password'" name="confirmPassword" [(ngModel)]="confirmPassword" required/>
                </div>
              </div>
            </div>

            <!-- Action Button -->
            <div class="pt-2">
              <button class="w-full h-12 bg-on-background text-white font-label-caps text-[11px] font-black tracking-[0.2em] rounded-full shadow-lg shadow-on-background/10 hover:bg-brand-teal transition-all active:scale-[0.98] disabled:opacity-50"
                      type="submit" [disabled]="loading()">
                {{ loading() ? 'PLEASE WAIT...' : 'GET STARTED' }}
              </button>
            </div>
          </form>

          <!-- Footer Link -->
          <div class="mt-6 text-center">
            <p class="font-body-md text-sm text-secondary">
              Already have an account? 
              <a routerLink="/login" class="text-brand-teal font-bold hover:underline transition-all cursor-pointer">Sign In</a>
            </p>
          </div>
        </div>
      </main>

      <!-- Minimalist Footer -->
      <footer class="py-6 border-t border-slate-100 bg-white">
        <div class="flex justify-between items-center px-6 max-w-[1280px] mx-auto w-full">
          <span class="text-[10px] font-bold text-secondary uppercase tracking-widest">© 2024 Kazi Konnect. Professional.</span>
          <div class="flex gap-6">
            <a class="text-[10px] font-bold text-secondary uppercase tracking-widest hover:text-brand-teal transition-colors cursor-pointer">Terms</a>
            <a class="text-[10px] font-bold text-secondary uppercase tracking-widest hover:text-brand-teal transition-colors cursor-pointer">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  `
})
export class RegisterPage implements OnInit {
  private auth = inject(AuthService);
  private notification = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  
  firstName = '';
  secondName = '';
  email = '';
  username = '';
  password = '';
  confirmPassword = '';
  role: UserRole = 'Client';
  loading = signal(false);
  showPassword = false;
  registrationComplete = signal(false);
  validationErrors = signal<Record<string, string>>({});
  formError = signal('');
  
  otpCode = '';
  otpLoading = signal(false);
  otpError = signal('');
  otpSuccess = signal('');
  resendLoading = signal(false);

  ngOnInit() {
    const roleParam = this.route.snapshot.queryParamMap.get('role');
    if (roleParam === 'worker') {
      this.role = 'Worker';
    } else if (roleParam === 'client') {
      this.role = 'Client';
    }
  }

  onSubmit() {
    if (!this.firstName.trim() || !this.secondName.trim() || !this.email.trim() || !this.username.trim() || !this.password.trim()) {
      this.notification.error('Please fill in all mandatory fields.');
      return;
    }

    if (this.firstName.trim().length < 2 || this.firstName.trim().length > 50) {
      this.notification.error('First name must be 2-50 characters.');
      return;
    }

    if (this.secondName.trim().length < 2 || this.secondName.trim().length > 50) {
      this.notification.error('Second name must be 2-50 characters.');
      return;
    }

    if (this.username.trim().length < 3 || this.username.trim().length > 50) {
      this.notification.error('Username must be 3-50 characters.');
      return;
    }

    if (this.password.length < 8) {
      this.notification.error('Password must be at least 8 characters.');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.notification.error('Passwords do not match.');
      return;
    }
    
    this.loading.set(true);
    this.formError.set('');
    this.validationErrors.set({});
    this.auth.register(this.firstName, this.secondName, this.email, this.role, this.password, this.username).subscribe({
      next: () => {
        this.loading.set(false);
        this.registrationComplete.set(true);
      },
      error: (error: any) => {
        this.loading.set(false);

        const validationErrors = error?.error?.validationErrors;
        if (validationErrors && typeof validationErrors === 'object') {
          this.validationErrors.set(validationErrors as Record<string, string>);
          return;
        }

        let message = 'Registration failed. Please try again.';
        if (typeof error?.error === 'string') {
          try {
            const parsed = JSON.parse(error.error);
            message = parsed?.message || parsed?.error || error.error || message;
          } catch {
            message = error.error || message;
          }
        } else if (error?.error?.message) {
          message = error.error.message;
        } else if (error?.message) {
          message = error.message;
        }

        this.formError.set(message);
        this.notification.error(message);
      }
    });
  }

  backToRegister() {
    this.registrationComplete.set(false);
    this.firstName = '';
    this.secondName = '';
    this.email = '';
    this.username = '';
    this.password = '';
    this.confirmPassword = '';
    this.validationErrors.set({});
    this.formError.set('');
    this.otpCode = '';
    this.otpError.set('');
    this.otpSuccess.set('');
  }

  onVerifyOtp() {
    if (!this.otpCode.trim() || this.otpCode.trim().length !== 6) {
      this.otpError.set('Please enter a valid 6-digit verification code.');
      return;
    }

    this.otpLoading.set(true);
    this.otpError.set('');
    this.otpSuccess.set('');

    this.auth.verifyEmail(this.otpCode.trim(), this.email.trim()).subscribe({
      next: () => {
        this.otpLoading.set(false);
        this.otpSuccess.set('Email verified successfully! Redirecting to login...');
        this.notification.success('Email verified successfully!');
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error: any) => {
        this.otpLoading.set(false);
        const message = error?.error?.message || error?.message || 'Verification failed. The code may be incorrect or expired.';
        this.otpError.set(message);
        this.notification.error(message);
      }
    });
  }

  resendOtp() {
    this.resendLoading.set(true);
    this.otpError.set('');
    this.otpSuccess.set('');

    this.auth.resendVerificationEmail(this.email.trim()).subscribe({
      next: (response: any) => {
        this.resendLoading.set(false);
        const msg = typeof response === 'string' ? response : response?.message || 'A new verification code has been sent.';
        this.otpSuccess.set(msg);
        this.notification.success(msg);
      },
      error: (error: any) => {
        this.resendLoading.set(false);
        const msg = error?.error || error?.message || 'Failed to resend verification code.';
        this.otpError.set(msg);
      }
    });
  }
}
