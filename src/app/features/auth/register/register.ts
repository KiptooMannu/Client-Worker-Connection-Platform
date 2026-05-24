import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService, UserRole } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule, MatButtonModule],
  template: `
    <div class="bg-white text-on-surface font-body-md min-h-screen flex flex-col selection:bg-primary-container selection:text-white">
      <!-- Top Navigation Anchor -->
      <header class="fixed top-0 w-full z-50 bg-white border-b border-slate-100">
        <div class="h-[64px] max-w-[1280px] mx-auto flex items-center justify-between px-6">
          <div class="flex items-center gap-3 cursor-pointer" routerLink="/">
            <svg class="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="3"></circle><circle cx="6" cy="6" r="2"></circle><circle cx="18" cy="6" r="2"></circle><circle cx="18" cy="18" r="2"></circle><circle cx="6" cy="18" r="2"></circle><line x1="8" y1="8" x2="10" y2="10"></line><line x1="16" y1="8" x2="14" y2="10"></line><line x1="16" y1="16" x2="14" y2="14"></line><line x1="8" y1="16" x2="10" y2="14"></line></svg>
            <span class="font-headline-md text-xl font-extrabold text-primary tracking-tighter">Kazi Konnect</span>
          </div>


          <div class="flex items-center">
            <button routerLink="/login" class="font-label-sm text-[11px] font-black text-primary uppercase tracking-[0.1em] hover:underline transition-all">Sign In</button>
          </div>
        </div>
      </header>

      <main class="flex-grow flex items-center justify-center px-4 pt-24 pb-8">
        <!-- Auth Container -->
        <div class="w-full max-w-[500px] bg-white rounded-2xl shadow-[0_20px_60px_rgba(46,49,146,0.05)] border border-slate-200 p-6 md:p-8">
          <!-- Header Section -->
          <div class="text-center mb-6">
            <h1 class="font-headline-lg text-2xl md:text-3xl text-primary mb-1">Create Account</h1>
            <p class="font-body-lg text-sm text-secondary">Join the community</p>
          </div>

          <!-- Form -->
          <form (submit)="onSubmit()" class="space-y-4">
            <!-- Name Row -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="font-label-sm text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block ml-1">First Name <span class="text-rose-500">*</span></label>
                <div class="relative group">
                  <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                  <input class="w-full h-11 pl-11 pr-4 bg-white border border-slate-200 rounded-full focus:ring-4 focus:ring-primary-container/5 focus:border-primary transition-all text-sm font-body-md text-on-surface outline-none"
                         placeholder="John" type="text" name="firstName" [(ngModel)]="firstName" required/>
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="font-label-sm text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block ml-1">Second Name <span class="text-rose-500">*</span></label>
                <div class="relative group">
                  <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                  <input class="w-full h-11 pl-11 pr-4 bg-white border border-slate-200 rounded-full focus:ring-4 focus:ring-primary-container/5 focus:border-primary transition-all text-sm font-body-md text-on-surface outline-none"
                         placeholder="Doe" type="text" name="secondName" [(ngModel)]="secondName" required/>
                </div>
              </div>
            </div>

            <!-- Email & Role Row -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="font-label-sm text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block ml-1">Email <span class="text-rose-500">*</span></label>
                <div class="relative group">
                  <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                  <input class="w-full h-11 pl-11 pr-4 bg-white border border-slate-200 rounded-full focus:ring-4 focus:ring-primary-container/5 focus:border-primary transition-all text-sm font-body-md text-on-surface outline-none"
                         placeholder="john@example.com" type="email" name="email" [(ngModel)]="email" required/>
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="font-label-sm text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block ml-1">Username <span class="text-rose-500">*</span></label>
                <div class="relative group">
                  <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14"></path></svg>
                  <input class="w-full h-11 pl-11 pr-4 bg-white border border-slate-200 rounded-full focus:ring-4 focus:ring-primary-container/5 focus:border-primary transition-all text-sm font-body-md text-on-surface outline-none"
                         placeholder="username" type="text" name="username" [(ngModel)]="username" required/>
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="font-label-sm text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block ml-1">Account Type <span class="text-rose-500">*</span></label>
                <div class="flex p-1 bg-slate-50 border border-slate-100 rounded-full gap-1 h-11">
                  <button (click)="role = 'Client'" 
                          [class.bg-white]="role === 'Client'"
                          [class.text-primary]="role === 'Client'"
                          [class.shadow-sm]="role === 'Client'"
                          [class.text-secondary]="role !== 'Client'"
                          class="flex-1 rounded-full font-label-sm text-[10px] font-bold uppercase tracking-wider transition-all outline-none" type="button">
                    Client
                  </button>
                  <button (click)="role = 'Worker'"
                          [class.bg-white]="role === 'Worker'"
                          [class.text-primary]="role === 'Worker'"
                          [class.shadow-sm]="role === 'Worker'"
                          [class.text-secondary]="role !== 'Worker'"
                          class="flex-1 rounded-full font-label-sm text-[10px] font-bold uppercase tracking-wider transition-all outline-none" type="button">
                    Worker
                  </button>
                </div>
              </div>
            </div>

            <!-- Password Row -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="font-label-sm text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block ml-1">Password <span class="text-rose-500">*</span></label>
                <div class="relative group">
                  <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  <input class="w-full h-11 pl-11 pr-4 bg-white border border-slate-200 rounded-full focus:ring-4 focus:ring-primary-container/5 focus:border-primary transition-all text-sm font-body-md text-on-surface outline-none"
                         placeholder="••••••••" [type]="showPassword ? 'text' : 'password'" name="password" [(ngModel)]="password" required/>
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="font-label-sm text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block ml-1">Confirm <span class="text-rose-500">*</span></label>
                <div class="relative group">
                  <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                  <input class="w-full h-11 pl-11 pr-4 bg-white border border-slate-200 rounded-full focus:ring-4 focus:ring-primary-container/5 focus:border-primary transition-all text-sm font-body-md text-on-surface outline-none"
                         placeholder="••••••••" [type]="showPassword ? 'text' : 'password'" name="confirmPassword" [(ngModel)]="confirmPassword" required/>
                </div>
              </div>
            </div>

            <!-- Action Button -->
            <div class="pt-2">
              <button class="w-full h-12 bg-on-background text-white font-label-caps text-[11px] font-black tracking-[0.2em] rounded-full shadow-lg shadow-on-background/10 hover:bg-primary transition-all active:scale-[0.98] disabled:opacity-50"
                      type="submit" [disabled]="loading()">
                {{ loading() ? 'PLEASE WAIT...' : 'GET STARTED' }}
              </button>
            </div>
          </form>

          <!-- Footer Link -->
          <div class="mt-6 text-center">
            <p class="font-body-md text-sm text-secondary">
              Already have an account? 
              <a routerLink="/login" class="text-primary font-bold hover:underline transition-all cursor-pointer">Sign In</a>
            </p>
          </div>
        </div>
      </main>

      <!-- Minimalist Footer -->
      <footer class="py-6 border-t border-slate-100 bg-white">
        <div class="flex justify-between items-center px-6 max-w-[1280px] mx-auto w-full">
          <span class="text-[10px] font-bold text-secondary uppercase tracking-widest">© 2024 Kazi Konnect. Professional.</span>
          <div class="flex gap-6">
            <a class="text-[10px] font-bold text-secondary uppercase tracking-widest hover:text-primary transition-colors cursor-pointer">Terms</a>
            <a class="text-[10px] font-bold text-secondary uppercase tracking-widest hover:text-primary transition-colors cursor-pointer">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  `
})
export class RegisterPage implements OnInit {
  private auth = inject(AuthService);
  private notification = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  
  firstName = '';
  secondName = '';
  email = '';
  username = '';
  password = '';
  confirmPassword = '';
  role: UserRole = 'Client';
  loading = signal(false);
  showPassword = false;

  ngOnInit() {
    const roleParam = this.route.snapshot.queryParamMap.get('role');
    if (roleParam === 'worker') {
      this.role = 'Worker';
    } else if (roleParam === 'client') {
      this.role = 'Client';
    }
  }

  onSubmit() {
    if (!this.firstName.trim() || !this.secondName.trim() || !this.email.trim() || !this.username.trim() || !this.password.trim()) {
      this.notification.error('Please fill in all mandatory fields.');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.notification.error('Passwords do not match.');
      return;
    }
    
    this.loading.set(true);
    this.auth.register(this.firstName, this.secondName, this.email, this.role, this.password, this.username).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/login']);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
