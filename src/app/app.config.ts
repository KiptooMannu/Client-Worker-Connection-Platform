import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { PreloadAllModules, provideRouter, withInMemoryScrolling, withPreloading } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay, withNoHttpTransferCache } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { authInterceptor } from './core/auth.interceptor';
import { loadingInterceptor } from './core/loading.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // anchorScrolling makes `fragment` on a routerLink actually do something —
    // without it Angular navigates and ignores the fragment, which is why the
    // menu's in-page links (#faq and friends) went nowhere. The smooth easing
    // and the fixed-header offset come from `scroll-behavior` /
    // `scroll-padding-top` on html in landing.css.
    provideRouter(
      routes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled'
      }),
      // Every dashboard route is lazy, and logging in navigates through two of
      // them in sequence (/worker -> /worker/dashboard), each needing its own
      // chunk fetched over the network. That is the blank screen after sign-in.
      // Preloading pulls those chunks in the background once the first screen is
      // interactive, so the post-login navigation is served from memory.
      withPreloading(PreloadAllModules)
    ),
    provideClientHydration(withEventReplay(), withNoHttpTransferCache()),
    provideAnimationsAsync(),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, loadingInterceptor]))
  ]
};
