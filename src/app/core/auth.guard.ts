import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService, UserRole } from './services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);


  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  if (auth.isAuthenticated()) {
    const requiredRole = route.data['role'] as UserRole;
    const userRole = auth.userRole();

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
};
