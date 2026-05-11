import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
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
  token?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSignal = signal<User | null>(null);

  currentUser = computed(() => this.userSignal());
  isAuthenticated = computed(() => !!this.userSignal());
  userRole = computed(() => this.userSignal()?.role || null);

  private users: User[] = []; // No longer needed for logic, but keeping for reference if needed
  private apiUrl = environment.apiUrl + '/auth';

  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  private notification = inject(NotificationService);

  constructor(private router: Router) {
    if (isPlatformBrowser(this.platformId)) {
      const savedUser = localStorage.getItem('pro_user');
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          // Restore token from separate storage if not in user object
          if (!user.token) {
            user.token = localStorage.getItem('auth_token');
          }
          this.userSignal.set(user);
          console.log('[AuthService] User restored from localStorage with role:', user.role);
        } catch (e) {
          console.error('[AuthService] Failed to parse saved user:', e);
        }
      }

      const storedUsers = localStorage.getItem('kazi_konnect_users') || localStorage.getItem('nestfind_users');
      if (storedUsers) {
        this.users = [...this.users, ...JSON.parse(storedUsers).filter((su: any) => !this.users.find(u => u.email === su.email))];
      }
    }
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(response => {
        const user: User = {
          id: response.userId,
          email: response.email,
          role: this.mapRole(response.role),
          name: response.name || response.username || 'User',
          token: response.accessToken
        };
        
        this.userSignal.set(user);
        if (isPlatformBrowser(this.platformId)) {
          // Store token separately for interceptor access
          localStorage.setItem('auth_token', response.accessToken);
          localStorage.setItem('pro_user', JSON.stringify(user));
          console.log('[AuthService] User logged in with role:', user.role, 'Token stored');
        }
        
        this.notification.success('Welcome back, ' + user.name + '!');
        this.redirectByRole(user.role);
      }),
      catchError(error => {
        console.error('[AuthService] Login error:', error);
        this.notification.error('Login failed. Please check your credentials.');
        return throwError(() => error);
      })
    );
  }

  register(name: string, email: string, role: UserRole, password: string, username?: string): Observable<any> {
    const registrationData = {
      username: username || email.split('@')[0],
      email: email,
      password: password,
      name: name,
      role: role?.toUpperCase()
    };

    return this.http.post(`${this.apiUrl}/register`, registrationData, { responseType: 'text' }).pipe(
      tap(() => {
        this.notification.success('Account created successfully! Please login.');
      }),
      catchError(error => {
        this.notification.error('Registration failed. This email may already be in use.');
        return throwError(() => error);
      })
    );
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
      localStorage.removeItem('pro_user');
      localStorage.removeItem('auth_token');
      console.log('[AuthService] User logged out');
    }
    this.notification.success('You have been logged out successfully.');
    this.router.navigate(['/']);
  }

  private redirectByRole(role: UserRole) {
    switch (role) {
      case 'Admin': this.router.navigate(['/admin']); break;
      case 'Worker': this.router.navigate(['/worker']); break;
      case 'Client': this.router.navigate(['/client']); break;
      default: this.router.navigate(['/']);
    }
  }
}
