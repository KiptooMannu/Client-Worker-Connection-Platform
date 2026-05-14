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
    <div class="bg-white text-on-surface font-body-md min-h-screen flex flex-col selection:bg-primary-container selection:text-white">
      <!-- TopAppBar -->
      <nav class="fixed top-0 w-full z-50 bg-white border-b border-slate-100">
        <div class="h-[64px] max-w-[1280px] mx-auto flex items-center justify-between px-6">
          <!-- Logo -->
          <div class="flex items-center gap-3 cursor-pointer" routerLink="/">
            <span class="material-symbols-outlined text-primary text-3xl">hub</span>
            <span class="font-headline-md text-xl font-extrabold text-primary tracking-tighter">Kazi Konnect</span>
          </div>

          <!-- Mid Links -->
          <div class="hidden md:flex gap-8 items-center absolute left-1/2 -translate-x-1/2">
            <a routerLink="/solutions" class="font-label-sm text-[11px] font-bold text-secondary hover:text-primary transition-colors cursor-pointer uppercase tracking-wider">Solutions</a>
            <a routerLink="/" class="font-label-sm text-[11px] font-bold text-secondary hover:text-primary transition-colors cursor-pointer uppercase tracking-wider">Resources</a>
            <a routerLink="/enterprise" class="font-label-sm text-[11px] font-bold text-secondary hover:text-primary transition-colors cursor-pointer uppercase tracking-wider">Enterprise</a>
          </div>

          <!-- Action -->
          <div class="flex items-center">
            <button routerLink="/register" class="font-label-sm text-[11px] font-black text-primary uppercase tracking-[0.1em] hover:underline transition-all">Join Now</button>
          </div>
        </div>
      </nav>

      <!-- Main Content Canvas -->
      <main class="flex-grow flex items-center justify-center px-4 pt-24 pb-8">
        <div class="w-full max-w-[420px]">
          <!-- Login Card -->
          <div class="bg-white border border-slate-200 rounded-2xl p-6 md:p-10 shadow-[0_20px_60px_rgba(46,49,146,0.05)] text-center">
            <!-- Brand Header -->
            <div class="mb-8 flex flex-col items-center">
              <div class="w-14 h-14 bg-primary-container rounded-full flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
                <span class="material-symbols-outlined text-white text-2xl material-fill">hub</span>
              </div>
              <h1 class="font-headline-md text-xl md:text-2xl text-on-surface mb-1 leading-tight">Welcome Back</h1>
              <p class="font-body-md text-sm text-secondary">Access your dashboard</p>
            </div>

            <!-- Form -->
            <form (submit)="onSubmit()" class="space-y-4 text-left">
              <div class="space-y-1.5">
                <label class="font-label-sm text-[11px] font-bold text-secondary uppercase tracking-wider ml-1" for="email">Email Address</label>
                <div class="relative group">
                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span class="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors !text-xl">mail</span>
                  </div>
                  <input class="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-full font-body-md text-sm text-on-surface focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none"
                         id="email" name="email" [(ngModel)]="email" placeholder="name@company.com" type="email" required/>
                </div>
              </div>

              <div class="space-y-1.5">
                <div class="flex justify-between items-center px-1">
                  <label class="font-label-sm text-[11px] font-bold text-secondary uppercase tracking-wider" for="password">Password</label>
                  <a class="font-label-sm text-[11px] font-bold text-primary hover:underline cursor-pointer">Forgot?</a>
                </div>
                <div class="relative group">
                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span class="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors !text-xl">lock</span>
                  </div>
                  <input class="block w-full pl-11 pr-11 py-3 bg-white border border-slate-200 rounded-full font-body-md text-sm text-on-surface focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none"
                         id="password" name="password" [type]="showPassword ? 'text' : 'password'" [(ngModel)]="password" placeholder="••••••••" required/>
                  <div class="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer" (click)="showPassword = !showPassword">
                    <span class="material-symbols-outlined text-outline hover:text-secondary transition-colors !text-xl">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
                  </div>
                </div>
              </div>

              <div class="flex items-center px-1">
                <input class="w-3.5 h-3.5 text-primary bg-white border-slate-200 rounded focus:ring-primary focus:ring-offset-0" id="remember" name="remember" type="checkbox"/>
                <label class="ml-2.5 font-label-sm text-[11px] font-bold text-secondary uppercase tracking-wider" for="remember">Stay signed in</label>
              </div>

              <button class="w-full py-4 bg-on-background text-white rounded-full font-label-caps text-[11px] font-black tracking-[0.2em] shadow-lg shadow-on-background/10 hover:bg-primary transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
                      type="submit" [disabled]="loading()">
                {{ loading() ? 'AUTHENTICATING...' : 'SIGN IN' }}
              </button>
            </form>

            <div class="mt-8 flex items-center gap-4 py-2">
              <div class="h-px bg-slate-100 flex-grow"></div>
              <span class="font-label-sm text-[9px] font-bold text-outline uppercase tracking-widest">OR</span>
              <div class="h-px bg-slate-100 flex-grow"></div>
            </div>

            <div class="flex gap-3 mt-4">
              <button class="flex-1 flex items-center justify-center py-2.5 border border-slate-200 rounded-full hover:bg-slate-50 transition-colors">
                <img alt="Google Logo" class="w-4 h-4 mr-2" src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png"/>
                <span class="text-[11px] font-bold text-secondary uppercase tracking-wider">Google</span>
              </button>
              <button class="flex-1 flex items-center justify-center py-2.5 border border-slate-200 rounded-full hover:bg-slate-50 transition-colors">
                <span class="material-symbols-outlined text-secondary mr-2 !text-lg material-fill">business_center</span>
                <span class="text-[11px] font-bold text-secondary uppercase tracking-wider">SSO</span>
              </button>
            </div>
          </div>

          <!-- Footer Link -->
          <div class="mt-8 text-center">
            <p class="font-body-md text-sm text-secondary">
              New to Kazi Konnect? 
              <a routerLink="/register" class="text-primary font-bold ml-1 hover:underline cursor-pointer">Join Now</a>
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
