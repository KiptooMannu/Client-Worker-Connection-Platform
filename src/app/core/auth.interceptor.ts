import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const user = authService.currentUser();
  
  const handleAuthError = (error: HttpErrorResponse) => {
    if (error.status === 401 || error.status === 403) {
      authService.logout();
    }
    return throwError(() => error);
  };

  if (user?.token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${user.token}`
      }
    });
    return next(cloned).pipe(catchError(handleAuthError));
  }
  
  return next(req).pipe(catchError(handleAuthError));
};
