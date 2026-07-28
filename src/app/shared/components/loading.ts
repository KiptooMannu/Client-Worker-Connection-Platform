import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../core/services/loading.service';

/**
 * Route-transition indicator.
 *
 * The overlay is deliberately delayed by 150ms via `animation-delay`: most
 * navigations resolve faster than that now that lazy chunks are preloaded, and
 * an indicator that flashes on every tap is worse than none. If the navigation
 * does take longer, a progress bar and a branded spinner appear instead of the
 * blank page users were seeing after login.
 */
@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (loadingService.loading$ | async) {
      <div class="route-progress" role="status" aria-live="polite">
        <span class="sr-only">Loading</span>
      </div>
      <div class="loading-overlay" aria-hidden="true">
        <span class="loading-ring"></span>
      </div>
    }
  `,
  styles: [`
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    /* Sits above the fixed navbar (z-index 99999) but below the nav drawer. */
    .route-progress {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      z-index: 99998;
      overflow: hidden;
      background: transparent;
    }

    .route-progress::after {
      content: '';
      position: absolute;
      inset: 0;
      width: 40%;
      border-radius: 999px;
      background: linear-gradient(90deg, transparent, var(--brand-teal, #29b2c7), transparent);
      animation: route-slide 1.1s ease-in-out infinite;
    }

    .loading-overlay {
      position: fixed;
      inset: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 99997;
      background: rgba(248, 250, 252, 0.72);
      backdrop-filter: blur(2px);
      pointer-events: none;
      opacity: 0;
      animation: overlay-in 0.2s ease 0.15s forwards;
    }

    .loading-ring {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      border: 3px solid rgba(41, 178, 199, 0.2);
      border-top-color: var(--brand-teal, #29b2c7);
      animation: ring-spin 0.7s linear infinite;
    }

    @keyframes route-slide {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(350%); }
    }

    @keyframes overlay-in {
      to { opacity: 1; }
    }

    @keyframes ring-spin {
      to { transform: rotate(360deg); }
    }

    @media (prefers-reduced-motion: reduce) {
      .route-progress::after { animation-duration: 3s; }
      .loading-ring { animation-duration: 2s; }
    }
  `]
})
export class LoadingComponent {
  public loadingService = inject(LoadingService);
}
