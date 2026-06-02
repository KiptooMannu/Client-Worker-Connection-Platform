import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NavbarComponent } from '../../../shared/components/navbar';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule, MatButtonModule, NavbarComponent],
  template: `
    <div class="bg-white text-on-surface font-body-md min-h-screen flex flex-col selection:bg-primary-container selection:text-white">
      <app-navbar [showMessages]="false"></app-navbar>

      <main class="flex-grow flex items-center justify-center px-4 pt-24 pb-8">
        <!-- Verification Container -->
        <div class="w-full max-w-[500px] bg-white rounded-2xl shadow-[0_20px_60px_rgba(46,49,146,0.05)] border border-slate-200 p-6 md:p-8">
          
          <!-- Success State -->
          <div *ngIf="verificationComplete() && verificationSuccess()">
            <div class="text-center mb-6">
              <div class="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h1 class="font-headline-lg text-2xl md:text-3xl text-primary mb-2">Email Verified!</h1>
              <p class="font-body-lg text-sm text-secondary">Your account is now active</p>
            </div>

            <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
              <p class="text-sm text-emerald-900">Your email has been successfully verified. You can now log in and start using Kazi Konnect.</p>
            </div>

            <div class="space-y-3">
              <button (click)="goToLogin()" class="w-full h-12 bg-primary text-white font-label-caps text-[11px] font-black tracking-[0.2em] rounded-full shadow-lg shadow-primary/10 hover:bg-primary-dark transition-all active:scale-[0.98]">
                GO TO LOGIN
              </button>
              <a routerLink="/" class="w-full h-12 bg-slate-100 text-on-surface font-label-caps text-[11px] font-black tracking-[0.2em] rounded-full shadow-lg shadow-slate-100/10 hover:bg-slate-200 transition-all active:scale-[0.98] flex items-center justify-center">
                BACK TO HOME
              </a>
            </div>
          </div>

          <!-- Error State -->
          <div *ngIf="verificationComplete() && !verificationSuccess()">
            <div class="text-center mb-6">
              <div class="bg-rose-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h1 class="font-headline-lg text-2xl md:text-3xl text-rose-600 mb-2">Verification Failed</h1>
              <p class="font-body-lg text-sm text-secondary">{{ errorMessage }}</p>
            </div>

            <div class="bg-rose-50 border border-rose-200 rounded-lg p-4 mb-6">
              <p class="text-sm text-rose-900 mb-3">{{ errorMessage }}</p>
              <div class="grid gap-3">
                <label class="block text-sm text-slate-700">Enter your email to resend a verification link</label>
                <input
                  type="email"
                  [(ngModel)]="resendEmail"
                  placeholder="Email address"
                  class="w-full px-4 py-3 border rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  class="w-full h-12 bg-primary text-white font-label-caps text-[11px] font-black tracking-[0.2em] rounded-full shadow-lg shadow-primary/10 hover:bg-primary-dark transition-all active:scale-[0.98]"
                  [disabled]="resendLoading() || !resendEmail.trim()"
                  (click)="resendVerification()"
                >
                  {{ resendLoading() ? 'Sending...' : 'Resend Verification Email' }}
                </button>
                <p *ngIf="resendMessage()" class="text-sm text-emerald-900">{{ resendMessage() }}</p>
                <p *ngIf="resendError()" class="text-sm text-rose-900">{{ resendError() }}</p>
              </div>
            </div>

            <div class="space-y-3">
              <a routerLink="/register" class="w-full h-12 bg-primary text-white font-label-caps text-[11px] font-black tracking-[0.2em] rounded-full shadow-lg shadow-primary/10 hover:bg-primary-dark transition-all active:scale-[0.98] flex items-center justify-center">
                TRY AGAIN
              </a>
              <a routerLink="/login" class="w-full h-12 bg-slate-100 text-on-surface font-label-caps text-[11px] font-black tracking-[0.2em] rounded-full shadow-lg shadow-slate-100/10 hover:bg-slate-200 transition-all active:scale-[0.98] flex items-center justify-center">
                GO TO LOGIN
              </a>
            </div>
          </div>

          <!-- Loading State -->
          <div *ngIf="!verificationComplete()" class="text-center">
            <div class="mb-6">
              <div class="inline-block">
                <svg class="animate-spin h-12 w-12 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            </div>
            <h1 class="font-headline-lg text-2xl md:text-3xl text-primary mb-2">Verifying Email</h1>
            <p class="font-body-lg text-sm text-secondary">Please wait while we verify your email address...</p>
          </div>
        </div>
      </main>

      <!-- Minimalist Footer -->
      <footer class="py-6 border-t border-slate-100 bg-white">
        <div class="flex justify-between items-center px-6 max-w-[1280px] mx-auto w-full">
          <span class="text-[10px] font-bold text-secondary uppercase tracking-widest">© 2024 Kazi Konnect. Professional.</span>
          <div class="flex gap-6">
            <a class="text-[10px] font-bold text-secondary uppercase tracking-widest hover:text-primary transition-colors cursor-pointer">Terms</a>
            <a class="text-[10px] font-bold text-secondary uppercase tracking-widest hover:text-primary transition-colors cursor-pointer">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  `
})
export class VerifyEmailPage implements OnInit {
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notification = inject(NotificationService);

  verificationComplete = signal(false);
  verificationSuccess = signal(false);
  // Prevent later duplicate responses from overriding the first successful result
  verificationHandled = signal(false);
  errorMessage = '';
  resendEmail = '';
  resendLoading = signal(false);
  resendMessage = signal('');
  resendError = signal('');

  ngOnInit() {
    this.verifyEmailToken();
  }

  verifyEmailToken() {
    const token = this.route.snapshot.queryParamMap.get('token');
    
    if (!token) {
      this.errorMessage = 'No verification token provided. Please check your email link.';
      this.verificationComplete.set(true);
      this.verificationSuccess.set(false);
      return;
    }

    // Call backend to verify the token
    this.authService.verifyEmail(token).subscribe({
      next: () => {
        // Mark handled and show success. Ignore any later responses.
        this.verificationHandled.set(true);
        this.verificationComplete.set(true);
        this.verificationSuccess.set(true);
        this.notification.success('Email verified successfully!');
      },
      error: (error) => {
        // If we already handled a successful verification, ignore this error (duplicate request).
        if (this.verificationHandled()) {
          return;
        }

        this.verificationComplete.set(true);
        this.verificationSuccess.set(false);
        this.errorMessage = error?.error?.message || error?.message || 'Email verification failed. The link may have expired.';
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  resendVerification() {
    if (!this.resendEmail?.trim()) {
      this.resendError.set('Please enter your email address.');
      this.resendMessage.set('');
      return;
    }

    this.resendLoading.set(true);
    this.resendError.set('');
    this.resendMessage.set('');

    this.authService.resendVerificationEmail(this.resendEmail.trim()).subscribe({
      next: (response: any) => {
        this.resendLoading.set(false);
        this.resendMessage.set(typeof response === 'string' ? response : response?.message || 'A new verification link has been sent.');
      },
      error: (error: any) => {
        this.resendLoading.set(false);
        this.resendError.set(error?.error || error?.message || 'Failed to resend verification link.');
      }
    });
  }
}
