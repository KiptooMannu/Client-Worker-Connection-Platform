import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthShellComponent } from '../auth-shell/auth-shell';
import { AuthService, UserRole } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AuthShellComponent],
  template: `
    <app-auth-shell
      mode="register"
      [heading]="registrationComplete() ? 'Verify your email' : 'Create your account'"
      [subheading]="
        registrationComplete()
          ? ''
          : 'Join Kazi Konnect in a minute. Choose how you want to use the platform.'
      "
      [wide]="!registrationComplete()"
      [showTabs]="!registrationComplete()"
    >
      @if (registrationComplete()) {
        <!-- ── Step 2: e-mail verification ──────────────────────────────── -->
        <div class="auth-center">
          <div class="auth-step-icon">
            <span class="material-symbols-outlined" aria-hidden="true">mark_email_unread</span>
          </div>
          <p class="auth-subheading">
            We sent a 6-digit code to <strong>{{ email }}</strong>
          </p>
        </div>

        <form class="auth-form" (ngSubmit)="onVerifyOtp()" novalidate>
          @if (otpError()) {
            <div class="auth-alert auth-alert--error" role="alert">
              <span class="material-symbols-outlined" aria-hidden="true">error</span>
              <span>{{ otpError() }}</span>
            </div>
          }
          @if (otpSuccess()) {
            <div class="auth-alert auth-alert--success" role="status">
              <span class="material-symbols-outlined" aria-hidden="true">check_circle</span>
              <span>{{ otpSuccess() }}</span>
            </div>
          }

          <div class="auth-field">
            <label class="auth-label auth-center" for="otpCode">Verification code</label>
            <input
              class="auth-otp"
              id="otpCode"
              name="otpCode"
              type="text"
              inputmode="numeric"
              autocomplete="one-time-code"
              maxlength="6"
              placeholder="000000"
              [(ngModel)]="otpCode"
              required
            />
          </div>

          <button class="auth-submit" type="submit" [disabled]="otpLoading()">
            @if (otpLoading()) {
              <span class="auth-submit-spinner" aria-hidden="true"></span>
              Verifying…
            } @else {
              Verify code
            }
          </button>
        </form>

        <p class="auth-swap">
          Didn't get it?
          <button class="auth-text-button" type="button" (click)="resendOtp()" [disabled]="resendLoading()">
            {{ resendLoading() ? 'Sending…' : 'Resend code' }}
          </button>
        </p>

        <hr class="auth-divider-rule" />

        <p class="auth-center">
          <button class="auth-text-button auth-text-button--muted" type="button" (click)="backToRegister()">
            Back to registration
          </button>
        </p>
      } @else {
        <!-- ── Step 1: account details ──────────────────────────────────── -->
        <form class="auth-form" (ngSubmit)="onSubmit()" novalidate>
          @if (formError()) {
            <div class="auth-alert auth-alert--error" role="alert">
              <span class="material-symbols-outlined" aria-hidden="true">error</span>
              <span>
                <strong>We couldn't create your account</strong>
                {{ formError() }}
              </span>
            </div>
          }

          <div class="auth-grid auth-grid--2">
            <div class="auth-field">
              <label class="auth-label" for="firstName">
                <span>First name <span class="auth-required">*</span></span>
              </label>
              <div class="auth-input-wrap">
                <span class="material-symbols-outlined auth-input-icon" aria-hidden="true">person</span>
                <input
                  class="auth-input"
                  id="firstName"
                  name="firstName"
                  type="text"
                  autocomplete="given-name"
                  placeholder="John"
                  [(ngModel)]="firstName"
                  required
                />
              </div>
            </div>

            <div class="auth-field">
              <label class="auth-label" for="secondName">
                <span>Second name <span class="auth-required">*</span></span>
              </label>
              <div class="auth-input-wrap">
                <span class="material-symbols-outlined auth-input-icon" aria-hidden="true">person</span>
                <input
                  class="auth-input"
                  id="secondName"
                  name="secondName"
                  type="text"
                  autocomplete="family-name"
                  placeholder="Doe"
                  [(ngModel)]="secondName"
                  required
                />
              </div>
            </div>
          </div>

          <div class="auth-grid auth-grid--2">
            <div class="auth-field">
              <label class="auth-label" for="regEmail">
                <span>Email <span class="auth-required">*</span></span>
              </label>
              <div class="auth-input-wrap">
                <span class="material-symbols-outlined auth-input-icon" aria-hidden="true">mail</span>
                <input
                  class="auth-input"
                  [class.is-invalid]="validationErrors()['email']"
                  id="regEmail"
                  name="email"
                  type="email"
                  autocomplete="email"
                  placeholder="john@example.com"
                  [(ngModel)]="email"
                  required
                />
              </div>
              @if (validationErrors()['email']) {
                <p class="auth-error">{{ validationErrors()['email'] }}</p>
              }
            </div>

            <div class="auth-field">
              <label class="auth-label" for="username">
                <span>Username <span class="auth-required">*</span></span>
              </label>
              <div class="auth-input-wrap">
                <span class="material-symbols-outlined auth-input-icon" aria-hidden="true">alternate_email</span>
                <input
                  class="auth-input"
                  [class.is-invalid]="validationErrors()['username']"
                  id="username"
                  name="username"
                  type="text"
                  autocomplete="username"
                  placeholder="johndoe"
                  [(ngModel)]="username"
                  required
                />
              </div>
              @if (validationErrors()['username']) {
                <p class="auth-error">{{ validationErrors()['username'] }}</p>
              }
            </div>
          </div>

          <!-- Given its own full-width row rather than being wedged into a
               two-column grid: it is the one choice that changes what the rest
               of the product looks like, so it should read as a decision. -->
          <div class="auth-field">
            <label class="auth-label" id="roleLabel">
              <span>I want to <span class="auth-required">*</span></span>
            </label>
            <div class="auth-segment" role="group" aria-labelledby="roleLabel">
              <button
                class="auth-segment-option"
                [class.is-active]="role === 'Client'"
                type="button"
                (click)="role = 'Client'"
                [attr.aria-pressed]="role === 'Client'"
              >
                <span class="material-symbols-outlined" aria-hidden="true">work</span>
                Hire people
              </button>
              <button
                class="auth-segment-option"
                [class.is-active]="role === 'Worker'"
                type="button"
                (click)="role = 'Worker'"
                [attr.aria-pressed]="role === 'Worker'"
              >
                <span class="material-symbols-outlined" aria-hidden="true">construction</span>
                Find work
              </button>
            </div>
            <p class="auth-hint">
              {{
                role === 'Client'
                  ? 'Post jobs and hire verified professionals near you.'
                  : 'Build a profile, get verified, and start accepting jobs.'
              }}
            </p>
          </div>

          <div class="auth-grid auth-grid--2">
            <div class="auth-field">
              <label class="auth-label" for="regPassword">
                <span>Password <span class="auth-required">*</span></span>
              </label>
              <div class="auth-input-wrap">
                <span class="material-symbols-outlined auth-input-icon" aria-hidden="true">lock</span>
                <input
                  class="auth-input auth-input--revealable"
                  [class.is-invalid]="validationErrors()['password']"
                  id="regPassword"
                  name="password"
                  [type]="showPassword() ? 'text' : 'password'"
                  autocomplete="new-password"
                  placeholder="At least 8 characters"
                  [(ngModel)]="password"
                  required
                />
                <button
                  class="auth-reveal"
                  type="button"
                  (click)="showPassword.set(!showPassword())"
                  [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
                  [attr.aria-pressed]="showPassword()"
                >
                  <span class="material-symbols-outlined" aria-hidden="true">{{
                    showPassword() ? 'visibility_off' : 'visibility'
                  }}</span>
                </button>
              </div>
              @if (validationErrors()['password']) {
                <p class="auth-error">{{ validationErrors()['password'] }}</p>
              }
            </div>

            <div class="auth-field">
              <label class="auth-label" for="confirmPassword">
                <span>Confirm password <span class="auth-required">*</span></span>
              </label>
              <div class="auth-input-wrap">
                <span class="material-symbols-outlined auth-input-icon" aria-hidden="true">shield</span>
                <input
                  class="auth-input"
                  [class.is-invalid]="confirmPassword.length > 0 && confirmPassword !== password"
                  id="confirmPassword"
                  name="confirmPassword"
                  [type]="showPassword() ? 'text' : 'password'"
                  autocomplete="new-password"
                  placeholder="Re-enter your password"
                  [(ngModel)]="confirmPassword"
                  required
                />
              </div>
              @if (confirmPassword.length > 0 && confirmPassword !== password) {
                <p class="auth-error">Passwords do not match.</p>
              }
            </div>
          </div>

          <button class="auth-submit" type="submit" [disabled]="loading()">
            @if (loading()) {
              <span class="auth-submit-spinner" aria-hidden="true"></span>
              Creating account…
            } @else {
              Create account
            }
          </button>
        </form>

        <p class="auth-swap">
          Already have an account?
          <a routerLink="/login" queryParamsHandling="preserve">Sign in</a>
        </p>

        <p class="auth-legal">
          By creating an account you agree to our
          <a routerLink="/">Terms of Service</a> and <a routerLink="/">Privacy Policy</a>.
        </p>
      }
    </app-auth-shell>
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
  showPassword = signal(false);
  registrationComplete = signal(false);
  validationErrors = signal<Record<string, string>>({});
  formError = signal('');

  otpCode = '';
  otpLoading = signal(false);
  otpError = signal('');
  otpSuccess = signal('');
  resendLoading = signal(false);

  ngOnInit(): void {
    // The landing page links here as /register?role=worker|client.
    const roleParam = this.route.snapshot.queryParamMap.get('role');
    if (roleParam === 'worker') {
      this.role = 'Worker';
    } else if (roleParam === 'client') {
      this.role = 'Client';
    }
  }

  onSubmit(): void {
    const problem = this.firstProblem();
    if (problem) {
      // Shown inline beside the fields rather than only as a toast, so the
      // message stays on screen while the visitor fixes the input.
      this.formError.set(problem);
      return;
    }

    this.loading.set(true);
    this.formError.set('');
    this.validationErrors.set({});

    this.auth
      .register(this.firstName.trim(), this.secondName.trim(), this.email.trim(), this.role, this.password, this.username.trim())
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.registrationComplete.set(true);
        },
        error: (error: any) => {
          this.loading.set(false);

          const validationErrors = error?.error?.validationErrors;
          if (validationErrors && typeof validationErrors === 'object') {
            this.validationErrors.set(validationErrors as Record<string, string>);
            this.formError.set('Please correct the highlighted fields.');
            return;
          }

          // AuthService already raises the toast for this branch; setting the
          // inline message here would otherwise double-report the same error.
          this.formError.set(readErrorMessage(error));
        }
      });
  }

  /** Returns the first failing rule, or null when the form is ready to submit. */
  private firstProblem(): string | null {
    if (
      !this.firstName.trim() ||
      !this.secondName.trim() ||
      !this.email.trim() ||
      !this.username.trim() ||
      !this.password
    ) {
      return 'Please fill in all required fields.';
    }
    if (this.firstName.trim().length < 2 || this.firstName.trim().length > 50) {
      return 'First name must be 2–50 characters.';
    }
    if (this.secondName.trim().length < 2 || this.secondName.trim().length > 50) {
      return 'Second name must be 2–50 characters.';
    }
    if (this.username.trim().length < 3 || this.username.trim().length > 50) {
      return 'Username must be 3–50 characters.';
    }
    if (this.password.length < 8) {
      return 'Password must be at least 8 characters.';
    }
    if (this.password !== this.confirmPassword) {
      return 'Passwords do not match.';
    }
    return null;
  }

  backToRegister(): void {
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

  onVerifyOtp(): void {
    if (this.otpCode.trim().length !== 6) {
      this.otpError.set('Please enter the 6-digit code from your email.');
      return;
    }

    this.otpLoading.set(true);
    this.otpError.set('');
    this.otpSuccess.set('');

    this.auth.verifyEmail(this.otpCode.trim(), this.email.trim()).subscribe({
      next: () => {
        this.otpLoading.set(false);
        this.otpSuccess.set('Email verified. Taking you to sign in…');
        this.notification.success('Email verified successfully!');
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (error: any) => {
        this.otpLoading.set(false);
        const message =
          error?.error?.message || error?.message || 'Verification failed. The code may be incorrect or expired.';
        this.otpError.set(message);
      }
    });
  }

  resendOtp(): void {
    this.resendLoading.set(true);
    this.otpError.set('');
    this.otpSuccess.set('');

    this.auth.resendVerificationEmail(this.email.trim()).subscribe({
      next: (response: any) => {
        this.resendLoading.set(false);
        const msg = typeof response === 'string' ? response : response?.message || 'A new verification code has been sent.';
        this.otpSuccess.set(msg);
      },
      error: (error: any) => {
        this.resendLoading.set(false);
        this.otpError.set(error?.error || error?.message || 'Failed to resend the verification code.');
      }
    });
  }
}

function readErrorMessage(error: any): string {
  const fallback = 'Registration failed. Please try again.';
  if (!error) return fallback;

  if (typeof error.error === 'string') {
    try {
      const parsed = JSON.parse(error.error);
      return parsed?.message || parsed?.error || error.error || fallback;
    } catch {
      return error.error || fallback;
    }
  }
  if (error.error && typeof error.error === 'object') {
    return error.error.message || error.error.error || fallback;
  }
  return error.message || fallback;
}
