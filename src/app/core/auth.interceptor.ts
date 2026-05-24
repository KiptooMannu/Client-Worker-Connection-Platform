import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';
import { catchError, throwError } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const platformId = inject(PLATFORM_ID);
  
  let token: string | null = null;
  let userRole: string | null = null;
  
  // Try to get token and role from auth service signal
  const user = authService.currentUser();
  if (user?.token) {
    token = user.token;
    userRole = user.role;
  }
  
  // Fallback: try to get token from localStorage for cases where signal isn't updated yet
  if (!token && isPlatformBrowser(platformId)) {
    token = sessionStorage.getItem('auth_token');
    const savedUser = sessionStorage.getItem('pro_user');
    if (savedUser && !userRole) {
      try {
        const parsedUser = JSON.parse(savedUser);
        userRole = parsedUser.role;
      } catch (e) {
        console.error('[AuthInterceptor] Failed to parse saved user:', e);
      }
    }
  }

  const handleAuthError = (error: HttpErrorResponse) => {
    if (error.status === 401 && !req.url.includes('/auth/login') && !req.url.includes('/auth/register')) {
      console.warn('[AuthInterceptor] 401 Unauthorized, logging out');
      authService.logout();
    } else if (error.status === 404 && req.url.includes('/profile/')) {
      console.warn('[AuthInterceptor] 404 Profile not found, logging out to clear invalid session');
      authService.logout();
    } else if (error.status === 403) {
      console.warn('[AuthInterceptor] 403 Forbidden - Access denied', {
        url: req.url,
        userRole: userRole || 'unknown',
        hasToken: !!token,
        endpoint: req.url.split('/').pop()
      });
    }
    return throwError(() => error);
  };

  if (token) {
    const isFormData = req.body instanceof FormData;
    const isGetOrDelete = req.method === 'GET' || req.method === 'DELETE';
    
    let headers: { [header: string]: string } = {
      Authorization: `Bearer ${token}`
    };

    // Only add JSON content type if not sending FormData and not a GET/DELETE request
    if (!isFormData && !isGetOrDelete) {
      headers['Content-Type'] = 'application/json';
    }
    
    const cloned = req.clone({ setHeaders: headers });
    
    return next(cloned).pipe(catchError(handleAuthError));
  }
  
  // No token - still pass request through (for public endpoints like login, register)
  return next(req).pipe(catchError(handleAuthError));
};
