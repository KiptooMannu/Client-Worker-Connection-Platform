import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService, UserRole } from './services/auth.service';
import { map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // If we're on the server, we might not have the user state yet
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  // Wait for auth to be ready before checking
  return auth.user$.pipe(
    take(1),
    map(user => {
      if (user) {
        const requiredRole = route.data['role'] as UserRole;
        const userRole = user.role;

        if (requiredRole && userRole !== requiredRole) {
          if (userRole === 'Admin') router.navigate(['/admin']);
          else if (userRole === 'Worker') router.navigate(['/worker']);
          else if (userRole === 'Client') router.navigate(['/client']);
          else router.navigate(['/']);
          return false;
        }
        return true;
      }

      // Not logged in, redirect to login page
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    })
  );
};