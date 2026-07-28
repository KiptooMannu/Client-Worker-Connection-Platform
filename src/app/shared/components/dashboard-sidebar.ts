import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AppNavSection } from './nav-model';

/**
 * The desktop rail for client, worker and admin.
 *
 * All three previously hand-wrote this markup, which is why they had drifted
 * into three different active-state treatments and three different ideas of
 * how a gated item should look. Rendering one `AppNavSection[]` keeps them in
 * step and — more to the point here — keeps the desktop rail and the mobile
 * drawer showing the same destinations.
 *
 * Hidden below 1024px: a 280px rail on a 768px tablet leaves 488px of content,
 * which is not enough for the wider data tables. Tablets get the drawer.
 */
@Component({
  selector: 'app-dashboard-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule],
  template: `
    <nav class="side-nav" [attr.aria-label]="ariaLabel">
      @for (section of sections; track section.label) {
        @if (section.label) {
          <p class="side-section">{{ section.label }}</p>
        }
        @for (item of section.items; track item.path) {
          @if (item.locked) {
            <div class="side-row is-locked" [attr.title]="item.lockReason || null">
              <mat-icon class="side-icon">{{ item.icon }}</mat-icon>
              <span class="side-label">{{ item.label }}</span>
              <mat-icon class="side-lock">lock</mat-icon>
            </div>
          } @else {
            <a class="side-row"
               [routerLink]="item.path"
               routerLinkActive="is-active"
               [routerLinkActiveOptions]="{ exact: !!item.exact }">
              <mat-icon class="side-icon">{{ item.icon }}</mat-icon>
              <span class="side-label">{{ item.label }}</span>
              @if (item.badge) {
                <span class="side-badge" [ngClass]="'tone-' + (item.badgeTone || 'brand')">{{ item.badge }}</span>
              }
            </a>
          }
        }
      }
    </nav>

    <!-- Layout-specific extras, e.g. the worker onboarding checklist. -->
    <div class="side-extra">
      <ng-content></ng-content>
    </div>

    @if (showLogout) {
      <div class="side-foot">
        <button type="button" class="side-logout" (click)="logout.emit()">
          <mat-icon class="side-icon">logout</mat-icon>
          Log Out
        </button>
      </div>
    }
  `,
  styles: [`
    :host { display: none; }

    /*
      Sticky rather than a nested scroll container. The layouts used to wrap the
      rail and the content in "overflow-hidden" and scroll main internally,
      which stacked a second scrollbar under the fixed header and stopped
      "position: sticky" working anywhere inside the page.

      "top" clears the 5rem fixed header, and "max-height" lets an 11-item admin
      nav scroll on a short laptop screen without scrolling the page.
    */
    @media (min-width: 1024px) {
      :host {
        display: flex;
        position: sticky;
        top: 5rem;
        align-self: flex-start;
        flex-direction: column;
        flex: none;
        width: 17.5rem;
        max-height: calc(100vh - 5rem);
        padding: 1.5rem 0.9rem;
        background: var(--color-surface, #f8f9fa);
        border-right: 1px solid rgba(195, 199, 200, 0.3);
        overflow-y: auto;
        overscroll-behavior: contain;
      }
    }

    /* Wider rail once there is room to spare, so long labels such as
       "Revenue Wallet" stop wrapping on the admin sidebar. */
    @media (min-width: 1800px) { :host { width: 19rem; } }

    .side-nav { display: flex; flex-direction: column; gap: 0.15rem; }

    .side-section {
      margin: 1rem 0 0.35rem;
      padding: 0 0.85rem;
      font-size: 0.6rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: #a8b4c4;
    }
    .side-section:first-child { margin-top: 0; }

    .side-row {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding: 0.8rem 0.9rem;
      border-radius: 0.85rem;
      color: var(--color-on-surface-variant, #434749);
      font-size: 0.7rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      text-decoration: none;
      transition: background 0.16s ease, color 0.16s ease;
    }
    .side-row:hover { background: var(--color-surface-container-low, #f3f4f5); }
    .side-row.is-active {
      background: var(--side-accent-soft, #eaf7f9);
      color: var(--side-accent, #29b2c7);
      box-shadow: inset 3px 0 0 var(--side-accent, #29b2c7);
    }
    .side-row.is-active .side-icon { color: var(--side-accent, #29b2c7); }
    .side-row.is-locked { opacity: 0.5; cursor: not-allowed; }
    .side-row.is-locked:hover { background: transparent; }

    /* The label wraps rather than overflowing the rail — an 11-item admin nav
       has entries too long for 280px at this letter spacing. */
    .side-label {
      flex: 1;
      min-width: 0;
      line-height: 1.35;
      overflow-wrap: anywhere;
    }

    .side-icon { flex: none; color: #94a3b8; }
    .side-lock { flex: none; color: #f59e0b; font-size: 1rem !important; width: 1rem !important; height: 1rem !important; }

    .side-badge {
      flex: none;
      min-width: 1.25rem;
      padding: 0.1rem 0.4rem;
      border-radius: 999px;
      background: var(--brand-teal, #29b2c7);
      color: #fff;
      font-size: 0.6rem;
      font-weight: 900;
      letter-spacing: 0;
      text-align: center;
    }
    .side-badge.tone-warn { background: #f59e0b; }
    .side-badge.tone-ok { background: #16a34a; }
    .side-badge.tone-danger { background: #e11d48; }

    .side-extra { margin-top: 1rem; }

    .side-foot {
      margin-top: auto;
      padding-top: 1.5rem;
      border-top: 1px solid rgba(195, 199, 200, 0.3);
    }

    .side-logout {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      width: 100%;
      padding: 0.8rem 0.9rem;
      border: 0;
      border-radius: 0.85rem;
      background: none;
      color: var(--color-error, #ba1a1a);
      font-family: inherit;
      font-size: 0.65rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      cursor: pointer;
      transition: background 0.16s ease;
    }
    .side-logout:hover { background: rgba(186, 26, 26, 0.05); }
    .side-logout .side-icon { color: var(--color-error, #ba1a1a); }

    :host(.accent-indigo) {
      --side-accent: #4f46e5;
      --side-accent-soft: #eef2ff;
    }
  `]
})
export class DashboardSidebarComponent {
  @Input() sections: AppNavSection[] = [];
  @Input() showLogout = true;
  @Input() ariaLabel = 'Dashboard navigation';

  /** Emitted rather than injecting AuthService, so the rail stays presentational. */
  @Output() logout = new EventEmitter<void>();
}
