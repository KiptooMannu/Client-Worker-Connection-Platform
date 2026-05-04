import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';

export const guestGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    const role = auth.userRole();
    if (role === 'Admin') router.navigate(['/admin']);
    else if (role === 'Worker') router.navigate(['/worker']);
    else if (role === 'Client') router.navigate(['/client']);
    return false;
  }
  return true;
};
