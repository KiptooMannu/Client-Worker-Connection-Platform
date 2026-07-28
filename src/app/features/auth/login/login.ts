import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthShellComponent } from '../auth-shell/auth-shell';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AuthShellComponent],
  template: `
    <app-auth-shell
      mode="login"
      heading="Sign in"
      subheading="Welcome back. Enter your details to reach your dashboard."
    >
      <form class="auth-form" (ngSubmit)="onSubmit()" novalidate>
        @if (formError()) {
          <div class="auth-alert auth-alert--error" role="alert">
            <span class="material-symbols-outlined" aria-hidden="true">error</span>
            <span>{{ formError() }}</span>
          </div>
        }

        <div class="auth-field">
          <label class="auth-label" for="email">Email address</label>
          <div class="auth-input-wrap">
            <span class="material-symbols-outlined auth-input-icon" aria-hidden="true">mail</span>
            <input
              class="auth-input"
              id="email"
              name="email"
              type="email"
              autocomplete="email"
              placeholder="name@company.com"
              [(ngModel)]="email"
              required
            />
          </div>
        </div>

        <div class="auth-field">
          <label class="auth-label" for="password">
            <span>Password</span>
            <a class="auth-label-link" routerLink="/reset-password">Forgot?</a>
          </label>
          <div class="auth-input-wrap">
            <span class="material-symbols-outlined auth-input-icon" aria-hidden="true">lock</span>
            <input
              class="auth-input auth-input--revealable"
              id="password"
              name="password"
              [type]="showPassword() ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="Enter your password"
              [(ngModel)]="password"
              required
            />
            <!-- A real button, so the reveal is reachable by keyboard and
                 announces its state rather than being a bare click handler. -->
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
        </div>

        <button class="auth-submit" type="submit" [disabled]="loading()">
          @if (loading()) {
            <span class="auth-submit-spinner" aria-hidden="true"></span>
            Signing in…
          } @else {
            Sign in
          }
        </button>
      </form>

      <div class="auth-divider">or continue with</div>

      <div class="auth-social">
        <button class="auth-social-btn" type="button" (click)="notAvailable()">
          <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="" aria-hidden="true" />
          Google
        </button>
        <button class="auth-social-btn" type="button" (click)="notAvailable()">
          <span class="material-symbols-outlined" aria-hidden="true">business_center</span>
          SSO
        </button>
      </div>

      <p class="auth-swap">
        New to Kazi Konnect?
        <a routerLink="/register" queryParamsHandling="preserve">Create an account</a>
      </p>
    </app-auth-shell>
  `
})
export class LoginPage {
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  email = '';
  password = '';
  showPassword = signal(false);
  loading = signal(false);
  formError = signal('');

  private returnUrl = '';

  constructor() {
    this.returnUrl = safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
  }

  onSubmit(): void {
    if (!this.email.trim() || !this.password) {
      this.formError.set('Enter your email and password to continue.');
      return;
    }

    this.loading.set(true);
    this.formError.set('');

    this.auth.login(this.email.trim(), this.password).subscribe({
      next: () => {
        this.loading.set(false);
        // AuthService already routes by role; honour an explicit returnUrl over
        // that default so a guard-interrupted deep link resumes where it left
        // off. Previously this param was read and then never used.
        if (this.returnUrl) {
          this.router.navigateByUrl(this.returnUrl);
        }
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.formError.set(messageFrom(error));
      }
    });
  }

  notAvailable(): void {
    this.formError.set('Social sign-in is not connected yet. Please use your email and password.');
  }
}

/**
 * Only same-site absolute paths are accepted. Without this an attacker could
 * craft /login?returnUrl=https://evil.example and have a successful sign-in
 * hand the visitor straight to them; `//host` is rejected for the same reason,
 * since a protocol-relative URL leaves the site too.
 */
function safeReturnUrl(raw: string | null): string {
  if (!raw) return '';
  if (!raw.startsWith('/') || raw.startsWith('//')) return '';
  return raw;
}

function messageFrom(error: unknown): string {
  const err = error as { error?: unknown; message?: string } | null;
  if (typeof err?.error === 'string' && err.error.trim()) return err.error;
  const nested = err?.error as { message?: string } | undefined;
  if (nested?.message) return nested.message;
  if (err?.message) return err.message;
  return 'Sign in failed. Please check your credentials and try again.';
}
