import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-password-reset',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="bg-white text-on-surface font-body-md min-h-screen flex flex-col selection:bg-primary-container selection:text-white">
      <nav class="fixed top-0 w-full z-50 bg-white border-b border-slate-100">
        <div class="h-[64px] max-w-[1280px] mx-auto flex items-center justify-between px-6">
          <div class="flex items-center gap-3 cursor-pointer" routerLink="/">
            <svg class="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="3"></circle><circle cx="6" cy="6" r="2"></circle><circle cx="18" cy="6" r="2"></circle><circle cx="18" cy="18" r="2"></circle><circle cx="6" cy="18" r="2"></circle><line x1="8" y1="8" x2="10" y2="10"></line><line x1="16" y1="8" x2="14" y2="10"></line><line x1="16" y1="16" x2="14" y2="14"></line><line x1="8" y1="16" x2="10" y2="14"></line></svg>
            <span class="font-headline-md text-xl font-extrabold text-primary tracking-tighter">Kazi Konnect</span>
          </div>
          <div class="flex items-center">
            <button routerLink="/login" class="font-label-sm text-[11px] font-black text-primary uppercase tracking-[0.1em] hover:underline transition-all">Sign In</button>
          </div>
        </div>
      </nav>

      <main class="flex-grow flex items-center justify-center px-4 pt-24 pb-8">
        <div class="w-full max-w-[420px]">
          <div class="bg-white border border-slate-200 rounded-2xl p-6 md:p-10 shadow-[0_20px_60px_rgba(46,49,146,0.05)] text-center">
            <div class="mb-8 flex flex-col items-center">
              <div class="w-14 h-14 bg-primary-container rounded-full flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
                <svg class="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="3"></circle><circle cx="6" cy="6" r="2"></circle><circle cx="18" cy="6" r="2"></circle><circle cx="18" cy="18" r="2"></circle><circle cx="6" cy="18" r="2"></circle><line x1="8" y1="8" x2="10" y2="10"></line><line x1="16" y1="8" x2="14" y2="10"></line><line x1="16" y1="16" x2="14" y2="14"></line><line x1="8" y1="16" x2="10" y2="14"></line></svg>
              </div>
              <h1 class="font-headline-md text-xl md:text-2xl text-on-surface mb-1 leading-tight">Reset Password</h1>
              <p class="font-body-md text-sm text-secondary">Enter your email address to receive a reset link</p>
            </div>

            <div *ngIf="!resetToken && !requestSubmitted">
              <form [formGroup]="requestForm" (ngSubmit)="onRequestSubmit()" class="space-y-4 text-left">
                <div class="space-y-1.5">
                  <label class="font-label-sm text-[11px] font-bold text-secondary uppercase tracking-wider ml-1" for="email">Email Address</label>
                  <div class="relative group">
                    <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg class="w-5 h-5 text-slate-400 group-focus-within:text-[#041627] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                    </div>
                    <input id="email" class="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-full font-body-md text-sm text-on-surface focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
                           type="email"
                           formControlName="email"
                           placeholder="name@company.com"
                      />
                  </div>
                  <p *ngIf="requestForm.get('email')?.invalid && requestForm.get('email')?.touched" class="text-sm text-rose-600">Please enter a valid email address.</p>
                </div>

                <div class="space-y-1.5">
                  <label class="font-label-sm text-[11px] font-bold text-secondary uppercase tracking-wider ml-1" for="verification">Security Verification</label>
                  <div class="relative group">
                    <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg class="w-5 h-5 text-slate-400 group-focus-within:text-[#041627] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    </div>
                    <input id="verification" class="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-full font-body-md text-sm text-on-surface focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
                           type="text"
                           formControlName="verification"
                           placeholder="What is 1 + 1?"
                      />
                  </div>
                  <p *ngIf="requestForm.get('verification')?.invalid && requestForm.get('verification')?.touched" class="text-sm text-rose-600">Please answer the security question correctly.</p>
                </div>

                <div class="error-message" *ngIf="requestError">
                  {{ requestError }}
                </div>

                <button class="w-full py-4 bg-on-background text-white rounded-full font-label-caps text-[11px] font-black tracking-[0.2em] shadow-lg shadow-on-background/10 hover:bg-primary transition-all active:scale-[0.98] disabled:opacity-50"
                        type="submit"
                        [disabled]="requestForm.invalid || requestLoading"
                >
                  <span *ngIf="requestLoading" class="spinner-wrapper">
                    <mat-spinner diameter="20"></mat-spinner>
                    Sending...
                  </span>
                  <span *ngIf="!requestLoading">Send Reset Link</span>
                </button>
              </form>

              <div class="mt-8 text-center">
                <p class="font-body-md text-sm text-secondary">
                  Remember your password?
                  <a routerLink="/login" class="text-primary font-bold hover:underline cursor-pointer">Sign In</a>
                </p>
              </div>
            </div>

            <div *ngIf="!resetToken && requestSubmitted" class="space-y-6 text-left">
              <div class="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 text-emerald-900">
                <strong>✅ Reset link sent</strong>
                <p class="mt-2 text-sm">A link has been sent to <strong>{{ requestForm.get('email')?.value }}</strong>.</p>
              </div>
              <p class="text-sm text-secondary">Click the link in your email to reset your password. The link expires in 15 minutes.</p>
              <button class="w-full py-4 bg-on-background text-white rounded-full font-label-caps text-[11px] font-black tracking-[0.2em] shadow-lg shadow-on-background/10 hover:bg-primary transition-all active:scale-[0.98]"
                      type="button"
                      (click)="onBackToRequest()"
              >
                Try Different Email
              </button>
            </div>

            <div *ngIf="resetToken" class="space-y-4 text-left">
              <form [formGroup]="confirmForm" (ngSubmit)="onConfirmSubmit()" class="space-y-4 text-left">
                <div class="space-y-1.5">
                  <label class="font-label-sm text-[11px] font-bold text-secondary uppercase tracking-wider ml-1" for="newPassword">New Password</label>
                  <div class="relative group">
                    <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg class="w-5 h-5 text-slate-400 group-focus-within:text-[#041627] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    </div>
                    <input id="newPassword" class="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-full font-body-md text-sm text-on-surface focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
                           type="password"
                           formControlName="newPassword"
                           placeholder="Enter new password (min 8 characters)"
                      />
                  </div>
                  <p *ngIf="confirmForm.get('newPassword')?.invalid && confirmForm.get('newPassword')?.touched" class="text-sm text-rose-600">Password must be at least 8 characters.</p>
                </div>

              <div class="space-y-1.5">
                <label class="font-label-sm text-[11px] font-bold text-secondary uppercase tracking-wider ml-1" for="confirmPassword">Confirm Password</label>
                <div class="relative group">
                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg class="w-5 h-5 text-slate-400 group-focus-within:text-[#041627] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                  </div>
                  <input id="confirmPassword" class="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-full font-body-md text-sm text-on-surface focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
                         type="password"
                         formControlName="confirmPassword"
                         placeholder="Confirm your password"
                    />
                </div>
                <p *ngIf="confirmForm.hasError('passwordMismatch') && confirmForm.get('confirmPassword')?.touched" class="text-sm text-rose-600">Passwords do not match.</p>
              </div>

              <div class="error-message" *ngIf="confirmError">
                {{ confirmError }}
              </div>

              <button class="w-full py-4 bg-on-background text-white rounded-full font-label-caps text-[11px] font-black tracking-[0.2em] shadow-lg shadow-on-background/10 hover:bg-primary transition-all active:scale-[0.98]"
                      type="submit"
                      [disabled]="confirmForm.invalid || confirmLoading"
              >
                <span *ngIf="confirmLoading" class="spinner-wrapper">
                  <mat-spinner diameter="20"></mat-spinner>
                  Resetting...
                </span>
                <span *ngIf="!confirmLoading">Reset Password</span>
              </button>
              </form>
            </div>

            <div *ngIf="resetSuccess" class="space-y-6 text-left">
              <div class="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 text-emerald-900">
                <strong>✅ Password Reset Successfully!</strong>
                <p class="mt-2 text-sm">Your password has been changed. You can now sign in with your new password.</p>
              </div>
              <button class="w-full py-4 bg-on-background text-white rounded-full font-label-caps text-[11px] font-black tracking-[0.2em] shadow-lg shadow-on-background/10 hover:bg-primary transition-all active:scale-[0.98]"
                      type="button"
                      (click)="onRedirectToLogin()"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .password-reset-layout {
      min-height: 100vh;
      background: #f8fafc;
      color: #0f172a;
    }

    .auth-nav {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #ffffff;
      border-bottom: 1px solid rgba(148, 163, 184, 0.18);
      z-index: 20;
    }

    .nav-inner {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 24px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .brand-link {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: #0f172a;
      font-weight: 800;
      font-size: 1rem;
    }

    .brand-mark {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 12px;
      background: #4338ca;
      color: #ffffff;
      font-size: 0.95rem;
      font-weight: 900;
    }

    .auth-main {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px 20px 40px;
    }

    .auth-card-wrapper {
      width: 100%;
      max-width: 420px;
      margin-top: 64px;
    }

    .reset-card {
      width: 100%;
      box-shadow: 0 20px 60px rgba(46, 49, 146, 0.05);
      border-radius: 24px;
      border: 1px solid rgba(148, 163, 184, 0.18);
      background: #ffffff;
    }

    .reset-phase {
      padding: 20px;
    }

    mat-card-header {
      margin-bottom: 30px;
      text-align: center;
    }

    mat-card-title {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    mat-card-subtitle {
      color: #666;
      font-size: 14px;
    }

    .full-width {
      width: 100%;
    }

    mat-form-field {
      margin-bottom: 20px;
    }

    .error-message {
      background-color: #ffebee;
      border-left: 4px solid #f44336;
      padding: 12px;
      margin: 16px 0;
      border-radius: 4px;
      color: #c62828;
      font-size: 14px;
    }

    .success-message {
      background-color: #e8f5e9;
      border-left: 4px solid #4caf50;
      padding: 16px;
      margin: 16px 0;
      border-radius: 4px;
      color: #2e7d32;
      font-size: 14px;
      line-height: 1.6;
    }

    .info-text {
      color: #666;
      font-size: 14px;
      margin: 16px 0;
      line-height: 1.6;
    }

    button {
      margin-top: 16px;
      height: 44px;
      font-size: 15px;
      text-transform: none;
      font-weight: 500;
    }

    .footer-link {
      margin-top: 18px;
      text-align: center;
      font-size: 14px;
    }

    .nav-link {
      color: #4338ca;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
    }

    .nav-link:hover {
      text-decoration: underline;
    }

    .footer-link a {
      color: #3b82f6;
      font-weight: 600;
      text-decoration: none;
    }

    .footer-link a:hover {
      text-decoration: underline;
    }

    .spinner-wrapper {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    @media (max-width: 768px) {
      .nav-inner {
        padding: 0 16px;
      }

      .brand-link {
        gap: 8px;
      }

      .brand-text {
        display: none;
      }

      .auth-main {
        padding: 16px 12px 32px;
      }

      .auth-card-wrapper {
        margin-top: 56px;
      }

      .reset-card {
        border-radius: 20px;
      }

      .reset-phase {
        padding: 16px;
      }
    }

    mat-spinner {
      display: inline-block;
    }
  `]
})
export class PasswordResetComponent implements OnInit {
  requestForm: FormGroup;
  confirmForm: FormGroup;
  resetToken: string | null = null;
  requestLoading = false;
  confirmLoading = false;
  requestError: string | null = null;
  confirmError: string | null = null;
  requestSubmitted = false;
  resetSuccess = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.requestForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      verification: ['', [Validators.required, Validators.pattern(/^2$/)]]
    });

    this.confirmForm = this.formBuilder.group(
      {
        newPassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required]
      },
      { validators: this.passwordMatchValidator }
    );
  }

  ngOnInit() {
    // Check if token is in URL query params
    this.route.queryParams.subscribe(params => {
      this.resetToken = params['token'] || null;
    });
  }

  // Validator: check if passwords match
  passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('newPassword')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return password === confirm ? null : { passwordMismatch: true };
  }

  onRequestSubmit() {
    if (this.requestForm.invalid) {
      return;
    }

    this.requestLoading = true;
    this.requestError = null;
    const email = this.requestForm.get('email')?.value;

    this.authService.requestPasswordReset(email).subscribe({
      next: () => {
        this.requestLoading = false;
        this.requestSubmitted = true;
      },
      error: (error) => {
        this.requestLoading = false;
        this.requestError = typeof error.error === 'string'
          ? error.error
          : error.error?.message || 'Failed to send reset link. Please try again.';
      }
    });
  }

  onBackToRequest() {
    this.requestSubmitted = false;
    this.requestForm.reset();
    this.requestError = null;
  }

  onConfirmSubmit() {
    if (!this.resetToken || this.confirmForm.invalid) {
      return;
    }

    this.confirmLoading = true;
    this.confirmError = null;
    const newPassword = this.confirmForm.get('newPassword')?.value;

    this.authService.confirmPasswordReset(this.resetToken, newPassword).subscribe({
      next: () => {
        this.confirmLoading = false;
        this.resetSuccess = true;
      },
      error: (error) => {
        this.confirmLoading = false;
        this.confirmError = error.error?.message || 'Failed to reset password. Please try again.';
      }
    });
  }

  onRedirectToLogin() {
    this.router.navigate(['/login']);
  }
}
