import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule, MatButtonModule],
  template: `
    <div class="min-h-screen bg-[#f7f9fb] flex flex-col">
      <!-- Simple Header -->
      <header class="h-20 flex items-center px-12 border-b border-slate-100 bg-white shadow-sm">
        <div class="flex items-center gap-3 cursor-pointer" routerLink="/">
          <div class="w-10 h-10 bg-[#0f172a] rounded-xl flex items-center justify-center text-white shadow-lg">
            <mat-icon>corporate_fare</mat-icon>
          </div>
          <span class="text-2xl font-black tracking-tighter text-[#0f172a]">Kazi Konnect</span>
        </div>
      </header>

      <main class="flex-grow flex items-center justify-center p-6">
        <div class="w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-[0_8px_48px_rgba(4,22,39,0.08)] border border-slate-100">
          <div class="text-center mb-10">
            <h1 class="text-3xl font-black text-[#0f172a] tracking-tight mb-2">Welcome Back</h1>
            <p class="text-slate-400 font-medium text-sm">Access your secure professional dashboard.</p>
          </div>

          <form (submit)="onSubmit()" class="space-y-6">
            <div class="space-y-2">
              <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <div class="relative flex items-center">
                <mat-icon class="absolute left-4 text-slate-400 !text-lg pointer-events-none">mail</mat-icon>
                <input type="email" [(ngModel)]="email" name="email" required
                       class="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 focus:bg-white transition-all text-sm font-medium"
                       placeholder="e.g. abc@gmail.com">
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Password</label>
              <div class="relative flex items-center">
                <mat-icon class="absolute left-4 text-slate-400 !text-lg pointer-events-none">lock</mat-icon>
                <input [type]="showPassword ? 'text' : 'password'" [(ngModel)]="password" name="password" required
                       class="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 focus:bg-white transition-all text-sm font-medium"
                       placeholder="Enter your password">
                <button type="button" (click)="showPassword = !showPassword" 
                        class="absolute right-4 text-slate-400 hover:text-blue-600 transition-colors flex items-center justify-center">
                  <mat-icon class="!text-lg">{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </div>
            </div>

            <div class="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
              <label class="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-blue-600 transition-colors">
                <input type="checkbox" class="rounded border-slate-200 text-blue-600 focus:ring-blue-600/10">
                Remember Me
              </label>
              <a class="text-blue-600 hover:underline">Forgot Password?</a>
            </div>

            <button type="submit" [disabled]="loading()"
                    class="w-full bg-[#0f172a] text-white py-4 rounded-xl font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-slate-900/10 hover:shadow-2xl disabled:opacity-50 cursor-pointer">
              {{ loading() ? 'Verifying Credentials...' : 'Sign In' }}
            </button>
          </form>

          <div class="mt-10 pt-8 border-t border-slate-100 text-center">
            <p class="text-sm text-slate-400 font-medium">
              Don't have an account? 
              <a routerLink="/register" class="text-blue-600 font-black uppercase text-[10px] tracking-widest ml-1 hover:underline cursor-pointer">Create Account</a>
            </p>
          </div>
        </div>
      </main>
    </div>
  `
})
export class LoginPage {
  private auth = inject(AuthService);

  email = '';
  password = '';
  showPassword = false;
  loading = signal(false);

  onSubmit() {
    this.loading.set(true);
    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
