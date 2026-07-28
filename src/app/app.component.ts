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
        } else {
          this.loading.hide();
        }
      });
  }
}
