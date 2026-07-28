import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { AuthShellComponent } from '../auth-shell/auth-shell';

/**
 * Password recovery, presented in the same shell as sign-in and sign-up so the
 * whole authentication flow reads as one product.
 *
 * Three stages — request a code, set a new password, confirm — surfaced through
 * a step indicator rather than the previous design's unlabelled swap between
 * two forms.
 */
@Component({
  selector: 'app-password-reset',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AuthShellComponent],
  template: `
    <app-auth-shell
      mode="reset"
      [showTabs]="false"
      [heading]="headingFor()"
      [subheading]="subheadingFor()"
    >
      <!-- Progress is meaningful only while the reset is still in flight. -->
      @if (!resetSuccess()) {
        <ol class="auth-steps">
          <li class="auth-step" [class.is-current]="!requestSubmitted()" [class.is-done]="requestSubmitted()">
            <span class="auth-step-dot">1</span>
            <span class="auth-step-name">Your email</span>
          </li>
          <li class="auth-step-bar" [class.is-done]="requestSubmitted()" aria-hidden="true"></li>
          <li class="auth-step" [class.is-current]="requestSubmitted()">
            <span class="auth-step-dot">2</span>
            <span class="auth-step-name">New password</span>
          </li>
        </ol>
      }

      <!-- ── Stage 1: request a code ──────────────────────────────────────── -->
      @if (!requestSubmitted()) {
        <form class="auth-form" [formGroup]="requestForm" (ngSubmit)="onRequestSubmit()" novalidate>
          @if (requestError()) {
            <div class="auth-alert auth-alert--error" role="alert">
              <span class="material-symbols-outlined" aria-hidden="true">error</span>
              <span>{{ requestError() }}</span>
            </div>
          }

          <div class="auth-field">
            <label class="auth-label" for="resetEmail">Email address</label>
            <div class="auth-input-wrap">
              <span class="material-symbols-outlined auth-input-icon" aria-hidden="true">mail</span>
              <input
                class="auth-input"
                [class.is-invalid]="showError(requestForm.get('email'))"
                id="resetEmail"
                type="email"
                autocomplete="email"
                formControlName="email"
                placeholder="name@company.com"
              />
            </div>
            @if (showError(requestForm.get('email'))) {
              <p class="auth-error">Please enter a valid email address.</p>
            }
          </div>

          <!--
            A simple arithmetic challenge, carried over from the previous
            implementation: it keeps casual bots from hammering the reset
            endpoint. The question is stated in the label rather than hidden in a
            placeholder so it survives autofill and is read out by screen
            readers.
          -->
          <div class="auth-field">
            <label class="auth-label" for="verification">Quick check — what is 1 + 1?</label>
            <div class="auth-input-wrap">
              <span class="material-symbols-outlined auth-input-icon" aria-hidden="true">shield_person</span>
              <input
                class="auth-input"
                [class.is-invalid]="showError(requestForm.get('verification'))"
                id="verification"
                type="text"
                inputmode="numeric"
                autocomplete="off"
                formControlName="verification"
                placeholder="Type the answer"
              />
            </div>
            @if (showError(requestForm.get('verification'))) {
              <p class="auth-error">Please answer the question to continue.</p>
            }
          </div>

          <button class="auth-submit" type="submit" [disabled]="requestForm.invalid || requestLoading()">
            @if (requestLoading()) {
              <span class="auth-submit-spinner" aria-hidden="true"></span>
              Sending code…
            } @else {
              Send reset code
            }
          </button>
        </form>

        <p class="auth-swap">
          Remember your password?
          <a routerLink="/login">Sign in</a>
        </p>
      }

      <!-- ── Stage 2: choose a new password ───────────────────────────────── -->
      @if (requestSubmitted() && !resetSuccess()) {
        <div class="auth-alert auth-alert--success" role="status">
          <span class="material-symbols-outlined" aria-hidden="true">mark_email_read</span>
          <span>
            <strong>Code sent</strong>
            We emailed a 6-digit code to {{ requestForm.get('email')?.value || 'your address' }}.
          </span>
        </div>

        <form class="auth-form" [formGroup]="confirmForm" (ngSubmit)="onConfirmSubmit()" novalidate>
          @if (confirmError()) {
            <div class="auth-alert auth-alert--error" role="alert">
              <span class="material-symbols-outlined" aria-hidden="true">error</span>
              <span>{{ confirmError() }}</span>
            </div>
          }

          <div class="auth-field">
            <label class="auth-label auth-center" for="token">6-digit reset code</label>
            <input
              class="auth-otp"
              id="token"
              type="text"
              inputmode="numeric"
              autocomplete="one-time-code"
              maxlength="6"
              formControlName="token"
              placeholder="000000"
            />
            @if (showError(confirmForm.get('token'))) {
              <p class="auth-error auth-center">Enter the 6-digit code from your email.</p>
            }
          </div>

          <div class="auth-field">
            <label class="auth-label" for="newPassword">New password</label>
            <div class="auth-input-wrap">
              <span class="material-symbols-outlined auth-input-icon" aria-hidden="true">lock</span>
              <input
                class="auth-input auth-input--revealable"
                [class.is-invalid]="showError(confirmForm.get('newPassword'))"
                id="newPassword"
                [type]="showPassword() ? 'text' : 'password'"
                autocomplete="new-password"
                formControlName="newPassword"
                placeholder="At least 8 characters"
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
            @if (showError(confirmForm.get('newPassword'))) {
              <p class="auth-error">Password must be at least 8 characters.</p>
            }
          </div>

          <div class="auth-field">
            <label class="auth-label" for="confirmPassword">Confirm new password</label>
            <div class="auth-input-wrap">
              <span class="material-symbols-outlined auth-input-icon" aria-hidden="true">shield</span>
              <input
                class="auth-input"
                [class.is-invalid]="mismatch()"
                id="confirmPassword"
                [type]="showPassword() ? 'text' : 'password'"
                autocomplete="new-password"
                formControlName="confirmPassword"
                placeholder="Re-enter your new password"
              />
            </div>
            @if (mismatch()) {
              <p class="auth-error">Passwords do not match.</p>
            }
          </div>

          <button class="auth-submit" type="submit" [disabled]="confirmForm.invalid || confirmLoading()">
            @if (confirmLoading()) {
              <span class="auth-submit-spinner" aria-hidden="true"></span>
              Resetting…
            } @else {
              Reset password
            }
          </button>
        </form>

        <hr class="auth-divider-rule" />

        <p class="auth-center">
          <button class="auth-text-button auth-text-button--muted" type="button" (click)="onBackToRequest()">
            Use a different email
          </button>
        </p>
      }

      <!-- ── Stage 3: done ───────────────────────────────────────────────── -->
      @if (resetSuccess()) {
        <div class="auth-center">
          <div class="auth-step-icon">
            <span class="material-symbols-outlined" aria-hidden="true">check_circle</span>
          </div>
        </div>

        <div class="auth-alert auth-alert--success" role="status">
          <span class="material-symbols-outlined" aria-hidden="true">verified</span>
          <span>
            <strong>Password changed</strong>
            You can now sign in with your new password.
          </span>
        </div>

        <button class="auth-submit" type="button" (click)="onRedirectToLogin()">Go to sign in</button>
      }
    </app-auth-shell>
  `
})
export class PasswordResetComponent implements OnInit {
  private formBuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  requestForm: FormGroup;
  confirmForm: FormGroup;

  requestLoading = signal(false);
  confirmLoading = signal(false);
  requestError = signal<string | null>(null);
  confirmError = signal<string | null>(null);
  requestSubmitted = signal(false);
  resetSuccess = signal(false);
  showPassword = signal(false);

  constructor() {
    this.requestForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      verification: ['', [Validators.required, Validators.pattern(/^2$/)]]
    });

    this.confirmForm = this.formBuilder.group(
      {
        token: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
        newPassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required]
      },
      { validators: passwordMatchValidator }
    );
  }

  ngOnInit(): void {
    // A token in the URL means the visitor followed the emailed link, so skip
    // straight to choosing a new password.
    this.route.queryParams.subscribe(params => {
      const urlToken = params['token'] || null;
      if (urlToken) {
        this.confirmForm.patchValue({ token: urlToken });
        this.requestSubmitted.set(true);
      }
    });
  }

  headingFor(): string {
    if (this.resetSuccess()) return 'All set';
    return this.requestSubmitted() ? 'Choose a new password' : 'Reset your password';
  }

  subheadingFor(): string {
    if (this.resetSuccess()) return '';
    return this.requestSubmitted()
      ? 'Enter the code we emailed you, then pick a new password.'
      : 'Enter your email address and we will send you a verification code.';
  }

  /** Errors are held back until the field has been interacted with. */
  showError(control: AbstractControl | null): boolean {
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  mismatch(): boolean {
    const confirm = this.confirmForm.get('confirmPassword');
    return this.confirmForm.hasError('passwordMismatch') && !!confirm && (confirm.touched || confirm.dirty);
  }

  onRequestSubmit(): void {
    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      return;
    }

    this.requestLoading.set(true);
    this.requestError.set(null);

    this.authService.requestPasswordReset(this.requestForm.get('email')?.value).subscribe({
      next: () => {
        this.requestLoading.set(false);
        this.requestSubmitted.set(true);
      },
      error: error => {
        this.requestLoading.set(false);
        this.requestError.set(
          typeof error?.error === 'string'
            ? error.error
            : error?.error?.message || 'Failed to send the reset code. Please try again.'
        );
      }
    });
  }

  onBackToRequest(): void {
    this.requestSubmitted.set(false);
    this.requestForm.reset();
    this.confirmForm.reset();
    this.requestError.set(null);
    this.confirmError.set(null);
  }

  onConfirmSubmit(): void {
    if (this.confirmForm.invalid) {
      this.confirmForm.markAllAsTouched();
      return;
    }

    this.confirmLoading.set(true);
    this.confirmError.set(null);

    const token = this.confirmForm.get('token')?.value;
    const newPassword = this.confirmForm.get('newPassword')?.value;

    this.authService.confirmPasswordReset(token, newPassword).subscribe({
      next: () => {
        this.confirmLoading.set(false);
        this.resetSuccess.set(true);
      },
      error: error => {
        this.confirmLoading.set(false);
        this.confirmError.set(error?.error?.message || 'Failed to reset the password. Please try again.');
      }
    });
  }

  onRedirectToLogin(): void {
    this.router.navigate(['/login']);
  }
}

function passwordMatchValidator(group: AbstractControl): { [key: string]: boolean } | null {
  const password = group.get('newPassword')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password === confirm ? null : { passwordMismatch: true };
}
