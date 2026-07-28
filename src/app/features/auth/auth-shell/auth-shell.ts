import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

type AuthMode = 'login' | 'register' | 'reset';

interface ShowcaseCopy {
  eyebrow: string;
  title: string;
  lede: string;
  points: string[];
  footnote: string;
  image: string;
}

/**
 * Chrome shared by the sign-in and sign-up routes: a full-height split with an
 * image showcase on one side and the form on the other, plus the segmented
 * switcher that moves between the two.
 *
 * The pages previously carried independent markup — different card widths,
 * different headings, one with a page footer and one without — which is how
 * they ended up looking like two unrelated products. Everything structural now
 * lives here and each page contributes only its own fields via <ng-content>.
 *
 * Form primitives come from the global src/auth.css; see the note at the top of
 * that file for why they are not scoped to this component.
 */
@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="auth-page">
      <!-- Showcase: a full-height column on desktop, a compact banner on mobile
           where the vertical space is better spent on the form itself. -->
      <aside class="auth-showcase">
        <!--
          Decorative, so the alt text is empty rather than descriptive: the
          panel's message is carried by the adjacent copy, and announcing the
          stock photograph would only add noise before the form.
        -->
        <img class="auth-showcase-media" [src]="copy.image" alt="" aria-hidden="true" fetchpriority="low" />
        <div class="auth-showcase-scrim" aria-hidden="true"></div>

        <a class="auth-brand" routerLink="/">
          <span class="auth-brand-mark">
            <span class="material-symbols-outlined" aria-hidden="true">handshake</span>
          </span>
          <span class="auth-brand-name">Kazi Konnect</span>
        </a>

        <div class="auth-showcase-body">
          <span class="auth-showcase-eyebrow">
            <span class="material-symbols-outlined" aria-hidden="true">verified</span>
            {{ copy.eyebrow }}
          </span>
          <h2 class="auth-showcase-title">{{ copy.title }}</h2>
          <p class="auth-showcase-lede">{{ copy.lede }}</p>

          <ul class="auth-points">
            @for (point of copy.points; track point) {
              <li class="auth-point">
                <span class="material-symbols-outlined" aria-hidden="true">check_circle</span>
                <span>{{ point }}</span>
              </li>
            }
          </ul>
        </div>

        <div class="auth-showcase-foot">
          <span class="material-symbols-outlined" aria-hidden="true">lock</span>
          <p>{{ copy.footnote }}</p>
        </div>
      </aside>

      <!-- Form column -->
      <main class="auth-form-col">
        <div class="auth-card" [class.auth-card--wide]="wide">
          <a class="auth-back" routerLink="/">
            <span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>
            Back to Kazi Konnect
          </a>

          @if (showTabs) {
            <!--
              Real links rather than buttons: /login and /register stay
              shareable and the back button keeps working. queryParamsHandling
              preserves the params these routes are entered with — the landing
              page's ?role=worker and the auth guard's ?returnUrl — so switching
              tabs never silently drops the visitor's intent.
            -->
            <nav class="auth-tabs" [attr.data-active]="mode" aria-label="Choose sign in or sign up">
              <span class="auth-tabs-thumb" aria-hidden="true"></span>
              <a
                class="auth-tab"
                [class.is-active]="mode === 'login'"
                routerLink="/login"
                queryParamsHandling="preserve"
                [attr.aria-current]="mode === 'login' ? 'page' : null"
              >Sign in</a>
              <a
                class="auth-tab"
                [class.is-active]="mode === 'register'"
                routerLink="/register"
                queryParamsHandling="preserve"
                [attr.aria-current]="mode === 'register' ? 'page' : null"
              >Create account</a>
            </nav>
          }

          <h1 class="auth-heading">{{ heading }}</h1>
          @if (subheading) {
            <p class="auth-subheading">{{ subheading }}</p>
          }

          <ng-content></ng-content>
        </div>
      </main>
    </div>
  `
})
export class AuthShellComponent {
  /** Drives the active tab, the showcase copy and the showcase image. */
  @Input({ required: true }) mode!: AuthMode;

  @Input({ required: true }) heading = '';

  @Input() subheading = '';

  /** Widens the card for the multi-column register form. */
  @Input() wide = false;

  /** Hidden once a flow has moved past the choice, e.g. the OTP step. */
  @Input() showTabs = true;

  /**
   * Reusing the two photographs the landing page already ships means the
   * preconnect in index.html covers them and they are likely warm in cache by
   * the time a visitor reaches this page.
   */
  private static readonly SHOWCASE: Record<AuthMode, ShowcaseCopy> = {
    login: {
      eyebrow: 'Escrow-protected payments',
      title: 'Welcome back to your workspace.',
      lede:
        'Pick up where you left off — track live jobs, release escrow when work ' +
        'is approved, and message the people you are working with.',
      points: [
        'Every professional is identity-verified before going live',
        'Funds stay in escrow until you approve the work',
        'Settle straight to M-Pesa'
      ],
      footnote: 'Your session is encrypted end to end. We never store your password in plain text.',
      image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=70'
    },
    register: {
      eyebrow: 'Verified professionals',
      title: 'Hire skilled people without the risk.',
      lede:
        'Create an account in a minute. Hire vetted local professionals, or ' +
        'join as one and get paid reliably for every job you complete.',
      points: [
        'Free to join — no listing fees',
        'Document and identity checks on every professional',
        'Dispute resolution backed by a real review team'
      ],
      footnote: 'Verification is manual and usually completes within one business day.',
      image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=70'
    },
    reset: {
      eyebrow: 'Account recovery',
      title: 'Let’s get you back in.',
      lede:
        'We will email you a six-digit code to confirm it is really you, then you ' +
        'can choose a new password.',
      points: [
        'The code expires shortly after it is sent',
        'Your existing sessions stay signed out until you reset',
        'Nobody on our team can see your password'
      ],
      footnote: 'Didn’t request this? You can safely ignore the email — nothing changes until the code is used.',
      image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=70'
    }
  };

  get copy(): ShowcaseCopy {
    return AuthShellComponent.SHOWCASE[this.mode];
  }
}
