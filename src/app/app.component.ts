import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterOutlet
} from '@angular/router';
import { filter } from 'rxjs/operators';
import { LoadingComponent } from './shared/components/loading';
import { ToastComponent } from './core/components/toast/toast.component';
import { PlatformStateService } from './core/services/platform-state.service';
import { LoadingService } from './core/services/loading.service';
import { NotificationService } from './core/services/notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LoadingComponent, ToastComponent],
  template: `
    <app-toast-container></app-toast-container>
    <router-outlet></router-outlet>
    <app-loading></app-loading>
  `
})
export class AppComponent implements OnInit {
  private state = inject(PlatformStateService);
  private router = inject(Router);
  private loading = inject(LoadingService);
  private notification = inject(NotificationService);
  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    // Start automatic job expiry check (runs every hour)
    this.state.startJobExpiryCheck();

    // The loading overlay had no source: the HTTP interceptor's show() call is
    // commented out, so loading$ never became true and route transitions — which
    // is when the app actually has nothing to paint — showed a blank page. Router
    // events are the right signal for that; the overlay itself waits 150ms before
    // becoming visible so quick navigations stay silent.
    this.router.events
      .pipe(
        filter(event =>
          event instanceof NavigationStart ||
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(event => {
        if (event instanceof NavigationStart) {
          this.loading.show();
          return;
        }

        this.loading.hide();

        if (event instanceof NavigationEnd) {
          // A navigation landed, so the retry budget is spent and can be reset —
          // otherwise one recovered failure would leave a later, unrelated one
          // with no retry.
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem(AppComponent.CHUNK_RELOAD_KEY);
          }
          return;
        }

        if (event instanceof NavigationError) {
          this.handleNavigationError(event);
        }
      });
  }

  /**
   * Recovers from a navigation that failed because a lazy chunk could not be
   * fetched.
   *
   * Every dashboard route is lazy. When a new version is deployed, the chunk
   * filenames change, so a browser still running the previous main bundle asks
   * for chunk names that no longer exist on the server. The navigation aborts and
   * the user is left on the page they were on — which after signing in means a
   * success toast and then nothing, with the real cause only visible in the
   * console.
   *
   * Reloading re-fetches index.html and therefore the current chunk names. The
   * reload is recorded in sessionStorage so that a failure with any other cause
   * cannot put the app in a reload loop; the second attempt reports instead.
   */
  private handleNavigationError(event: NavigationError) {
    if (typeof window === 'undefined') return;

    if (!this.isChunkLoadError(event.error)) {
      this.notification.error('Could not open that page. Please try again.');
      return;
    }

    const alreadyRetried = sessionStorage.getItem(AppComponent.CHUNK_RELOAD_KEY);
    if (alreadyRetried) {
      sessionStorage.removeItem(AppComponent.CHUNK_RELOAD_KEY);
      this.notification.error(
        'This page failed to load. Please refresh, or clear your cache if it keeps happening.'
      );
      return;
    }

    sessionStorage.setItem(AppComponent.CHUNK_RELOAD_KEY, event.url || '1');
    // Reload straight into the route that failed, so signing in still lands the
    // user where they were headed.
    window.location.assign(event.url || window.location.pathname);
  }

  /**
   * Matches the several wordings browsers and bundlers use for this. Chrome and
   * Firefox report a failed ESM import; older webpack builds threw ChunkLoadError.
   */
  private isChunkLoadError(error: unknown): boolean {
    const message = typeof error === 'string'
      ? error
      : (error as { message?: string })?.message ?? '';

    return /failed to fetch dynamically imported module|error loading dynamically imported module|chunkloaderror|loading chunk \d+ failed|importing a module script failed/i
      .test(message);
  }

  /** Marks that a reload has already been attempted for a chunk failure. */
  private static readonly CHUNK_RELOAD_KEY = 'kk_chunk_reload_attempt';
}
