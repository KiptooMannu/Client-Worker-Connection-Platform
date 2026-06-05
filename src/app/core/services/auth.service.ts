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
  private authReadySignal = signal<boolean>(false);

  currentUser = computed(() => this.userSignal());
  user$ = toObservable(this.currentUser);
  isAuthenticated = computed(() => !!this.userSignal());
  userRole = computed(() => this.userSignal()?.role || null);
  isAuthReady = computed(() => this.authReadySignal());

  private users: User[] = [];
  private apiUrl = environment.authUrl;

  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  private notification = inject(NotificationService);

  constructor(private router: Router) {
    this.restoreAuthState();
  }

  private restoreAuthState() {
    if (isPlatformBrowser(this.platformId)) {
      // Restore user immediately and synchronously
      const savedUser = sessionStorage.getItem('pro_user');
      const token = sessionStorage.getItem('auth_token');
      
      if (savedUser && token) {
        try {
          const user = JSON.parse(savedUser);
          user.token = token;
          this.userSignal.set(user);
          console.log('[AuthService] User restored from sessionStorage with role:', user.role);
        } catch (e) {
          console.error('[AuthService] Failed to parse saved user:', e);
          this.clearAuthData();
        }
      }

      // Restore users list
      const storedUsers = sessionStorage.getItem('kazi_konnect_users') || sessionStorage.getItem('nestfind_users');
      if (storedUsers) {
        try {
          this.users = [...this.users, ...JSON.parse(storedUsers).filter((su: any) => !this.users.find(u => u.email === su.email))];
        } catch (e) {
          console.error('[AuthService] Failed to parse saved users:', e);
        }
      }
      
      // Mark auth as ready
      this.authReadySignal.set(true);
    } else {
      // Server-side - mark as ready immediately
      this.authReadySignal.set(true);
    }
  }

  private clearAuthData() {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem('pro_user');
      sessionStorage.removeItem('auth_token');
    }
    this.userSignal.set(null);
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(response => {
        // Unwrap ApiResponse<AuthResponse> - response.data contains the actual AuthResponse
        const authData = response.data || response;
        const user: User = {
          id: authData.userId,
          email: authData.email,
          role: this.mapRole(authData.role),
          name: authData.name || authData.username || 'User',
          avatarUrl: authData.profilePictureUrl || authData.image,
          phoneNumber: authData.phoneNumber,
          token: authData.accessToken
        };

        this.userSignal.set(user);
        if (isPlatformBrowser(this.platformId)) {
          // Store token separately for interceptor access
          sessionStorage.setItem('auth_token', authData.accessToken);
          sessionStorage.setItem('pro_user', JSON.stringify(user));
          console.log('[AuthService] User logged in with role:', user.role, 'Token stored');
        }

        this.notification.success('Welcome back, ' + user.name + '!');
        this.redirectByRole(user.role);
      }),
      catchError(error => {
        console.error('[AuthService] Login error:', error);
        const message = typeof error.error === 'string'
          ? error.error
          : error.error?.message || 'Login failed. Please check your credentials.';
        this.notification.error(message);
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

        const errorMsg = this.getErrorMessage(error, 'Registration failed. Please try again.');
        this.notification.error(errorMsg);
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
      }
    }
  }

  private redirectByRole(role: UserRole) {
    switch (role) {
      case 'Admin': this.router.navigate(['/admin']); break;
      case 'Worker': this.router.navigate(['/worker']); break;
      case 'Client': this.router.navigate(['/client']); break;
      default: this.router.navigate(['/']);
    }
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