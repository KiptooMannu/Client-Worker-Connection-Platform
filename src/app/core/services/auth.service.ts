import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { tap, catchError, of, Observable, throwError } from 'rxjs';
import { NotificationService } from './notification.service';

export type UserRole = 'Admin' | 'Worker' | 'Client' | null;

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  avatarUrl?: string;
  phoneNumber?: string;
  token?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSignal = signal<User | null>(null);

  currentUser = computed(() => this.userSignal());
  user$ = toObservable(this.currentUser);
  isAuthenticated = computed(() => !!this.userSignal());
  userRole = computed(() => this.userSignal()?.role || null);

  private users: User[] = [];
  private apiUrl = environment.authUrl;

  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  private notification = inject(NotificationService);

  constructor(private router: Router) {
    if (isPlatformBrowser(this.platformId)) {
      const savedUser = sessionStorage.getItem('pro_user') || localStorage.getItem('pro_user');
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          const storedToken = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');

          if (!user.token) {
            user.token = storedToken;
          }
          this.userSignal.set(user);
          console.log('[AuthService] User restored from storage with role:', user.role);
        } catch (error) {
          console.warn('[AuthService] Failed to restore user from storage', error);
        }
      }

      const storedUsers = sessionStorage.getItem('kazi_konnect_users') || sessionStorage.getItem('nestfind_users');
      if (storedUsers) {
        this.users = [...this.users, ...JSON.parse(storedUsers).filter((su: any) => !this.users.find(u => u.email === su.email))];
      }
    }
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(response => {
        // Extract the actual auth data from ApiResponse wrapper
        const authData = response.data || response;
        
        // Extract token from multiple possible field names
        const token = authData.accessToken || authData.token || authData.jwtToken;
        
        if (!token) {
          console.error('[AuthService] Login response missing token field', { response, authData });
          throw new Error('Token should not be null on login - backend did not return accessToken');
        }

        const user: User = {
          id: authData.userId || authData.id,
          email: authData.email,
          role: this.mapRole(authData.role),
          name: authData.name || authData.username || 'User',
          avatarUrl: authData.profilePictureUrl || authData.image,
          phoneNumber: authData.phoneNumber,
          token: token
        };

        if (!user.role) {
          console.warn('[AuthService] Login response has null role', { response });
        }

        this.userSignal.set(user);
        if (isPlatformBrowser(this.platformId)) {
          // Store token separately for interceptor access
          sessionStorage.setItem('auth_token', token);
          sessionStorage.setItem('pro_user', JSON.stringify(user));
          localStorage.setItem('auth_token', token);
          localStorage.setItem('pro_user', JSON.stringify(user));
          console.log('[AuthService] User logged in with role:', user.role, 'Token stored:', token.substring(0, 20) + '...');
        }

        this.notification.success('Welcome back, ' + user.name + '!');
        this.redirectByRole(user.role);
      }),
      catchError(error => {
        console.error('[AuthService] Login error:', error);
        // Error is handled inline in the login component, not via top notification
        return throwError(() => error);
      })
    );
  }

  register(firstName: string, secondName: string, email: string, role: UserRole, password: string, username?: string): Observable<any> {
    const registrationData = {
      username: username || email.split('@')[0] + Math.floor(Math.random() * 1000),
      email: email,
      password: password,
      firstName: firstName,
      secondName: secondName,
      role: role?.toUpperCase()
    };

    return this.http.post<any>(`${this.apiUrl}/register`, registrationData).pipe(
      tap(() => this.notification.success('Account created! Please verify your email before logging in.')),
      catchError(error => {
        const validationErrors = error?.error?.validationErrors;
        if (validationErrors && typeof validationErrors === 'object') {
          return throwError(() => error);
        }
        // Error is handled inline in the register component, not via top notification
        return throwError(() => error);
      })
    );
  }

  private getErrorMessage(error: any, fallback: string): string {
    if (!error) {
      return fallback;
    }

    if (typeof error.error === 'string') {
      try {
        const parsed = JSON.parse(error.error);
        return parsed?.message || parsed?.error || error.error || fallback;
      } catch {
        return error.error || fallback;
      }
    }

    if (error.error && typeof error.error === 'object') {
      return error.error?.message || error.error?.error || fallback;
    }

    return error.message || fallback;
  }

  private mapRole(backendRole: string): UserRole {
    switch (backendRole) {
      case 'ADMIN': return 'Admin';
      case 'WORKER': return 'Worker';
      case 'CLIENT': return 'Client';
      default: return null;
    }
  }

  logout() {
    this.userSignal.set(null);
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem('pro_user');
      sessionStorage.removeItem('auth_token');
      localStorage.removeItem('pro_user');
      localStorage.removeItem('auth_token');
      console.log('[AuthService] User logged out');
    }
    this.notification.success('You have been logged out successfully.');
    this.router.navigate(['/']);
  }

  updateUser(updates: Partial<User>) {
    const current = this.userSignal();
    if (current) {
      const updated = { ...current, ...updates };
      this.userSignal.set(updated);
      if (isPlatformBrowser(this.platformId)) {
        sessionStorage.setItem('pro_user', JSON.stringify(updated));
        localStorage.setItem('pro_user', JSON.stringify(updated));
      }
    }
  }

  private redirectByRole(role: UserRole) {
    const target =
      role === 'Admin' ? '/admin' :
      role === 'Worker' ? '/worker' :
      role === 'Client' ? '/client' :
      '/';

    // This navigation loads a lazy chunk and can genuinely fail — most often when
    // a new version has been deployed and this browser is still running the
    // previous main bundle, so the chunk names it asks for no longer exist. The
    // rejection is caught here to keep it out of the console as an unhandled
    // promise; recovery belongs to AppComponent, which listens for NavigationError
    // and reloads once into the target route.
    this.router.navigate([target]).catch(() => { /* handled via NavigationError */ });
  }

  /**
   * Request a password reset token by email
   */
  requestPasswordReset(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/password-reset/request`, { email }).pipe(
      tap(() => this.notification.success('Password reset link sent to your email!')),
      catchError(error => {
        let errorMsg = 'Failed to send reset link. Please try again.';
        if (error.error) {
          if (typeof error.error === 'string') {
            try {
              const parsed = JSON.parse(error.error);
              errorMsg = parsed?.message || parsed?.error || errorMsg;
            } catch {
              errorMsg = error.error;
            }
          } else {
            errorMsg = error.error?.message || errorMsg;
          }
        }
        this.notification.error(errorMsg);
        return throwError(() => error);
      })
    );
  }

  /**
   * Confirm password reset with token and new password
   */
  confirmPasswordReset(resetToken: string, newPassword: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/password-reset/confirm`, { 
      token: resetToken, 
      newPassword: newPassword 
    }).pipe(
      tap(() => this.notification.success('Password reset successfully! You can now log in with your new password.')),
      catchError(error => {
        let errorMsg = 'Failed to reset password. Please try again.';
        if (error.error) {
          if (typeof error.error === 'string') {
            try {
              const parsed = JSON.parse(error.error);
              errorMsg = parsed?.message || parsed?.error || errorMsg;
            } catch {
              errorMsg = error.error;
            }
          } else {
            errorMsg = error.error?.message || errorMsg;
          }
        }
        this.notification.error(errorMsg);
        return throwError(() => error);
      })
    );
  }

  /**
   * Verify email with verification token
   */
  verifyEmail(token: string, email?: string): Observable<any> {
    const url = email 
      ? `${this.apiUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`
      : `${this.apiUrl}/verify-email?token=${token}`;
    return this.http.post(url, {}).pipe(
      catchError(error => {
        const errorMsg = typeof error.error === 'string'
          ? error.error
          : error.error?.message || error.message || 'Email verification failed. The link or code may have expired.';
        return throwError(() => ({ ...error, message: errorMsg }));
      })
    );
  }

  resendVerificationEmail(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/resend-verification`, { email }, { responseType: 'text' }).pipe(
      tap(() => this.notification.success('Verification link resent. Please check your email.')),
      catchError(error => {
        const errorMsg = typeof error.error === 'string'
          ? error.error
          : error.error?.message || error.message || 'Failed to resend verification link. Please try again.';
        this.notification.error(errorMsg);
        return throwError(() => error);
      })
    );
  }
}

