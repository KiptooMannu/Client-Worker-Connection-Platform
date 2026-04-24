import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

export type UserRole = 'Admin' | 'Worker' | 'Client' | null;

export interface User {
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
  
  private users: User[] = [
    { email: 'admin@pro.com', role: 'Admin', name: 'System Admin', password: 'admin123' } as any,
    { email: 'worker@pro.com', role: 'Worker', name: 'David Harrison', password: 'worker123' } as any,
    { email: 'client@pro.com', role: 'Client', name: 'Infrastructure Client', password: 'client123' } as any
  ];

  private platformId = inject(PLATFORM_ID);

  constructor(private router: Router) {
    if (isPlatformBrowser(this.platformId)) {
      const savedUser = localStorage.getItem('pro_user');
      if (savedUser) {
        this.userSignal.set(JSON.parse(savedUser));
      }

      const storedUsers = localStorage.getItem('nestfind_users');
      if (storedUsers) {
        this.users = [...this.users, ...JSON.parse(storedUsers).filter((su: any) => !this.users.find(u => u.email === su.email))];
      }
    }
  }

  login(email: string, password: string): boolean {
    const foundUser = this.users.find(u => u.email === email && (u as any).password === password);

    if (foundUser) {
      const user: User = { 
        email: foundUser.email, 
        role: foundUser.role, 
        name: foundUser.name,
        token: 'mock-jwt-token-' + btoa(email)
      };
      this.userSignal.set(user);
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('pro_user', JSON.stringify(user));
      }
      
      this.redirectByRole(foundUser.role);
      return true;
    }
    return false;
  }

  register(name: string, email: string, role: UserRole): boolean {
    const newUser: any = { 
      email, 
      role, 
      name,
      password: 'password123' // Mock default password for all registrations
    };
    
    this.users.push(newUser);

    if (isPlatformBrowser(this.platformId)) {
      const stored = JSON.parse(localStorage.getItem('nestfind_users') || '[]');
      stored.push(newUser);
      localStorage.setItem('nestfind_users', JSON.stringify(stored));
      
      const userSession: User = { email, role, name, token: 'mock-jwt-token-' + btoa(email) };
      this.userSignal.set(userSession);
      localStorage.setItem('pro_user', JSON.stringify(userSession));
    }
    
    this.redirectByRole(role);
    return true;
  }

  logout() {
    this.userSignal.set(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('pro_user');
    }
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
