import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NavbarComponent } from '../../../shared/components/navbar';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule, MatButtonModule, NavbarComponent],
  template: `
    <div class="bg-white text-on-surface font-body-md min-h-screen flex flex-col selection:bg-primary-container selection:text-white">
      <app-navbar [showMessages]="false"></app-navbar>

      <!-- Main Content Canvas -->
      <main class="flex-grow flex items-center justify-center px-4 pt-24 pb-8">
        <div class="w-full max-w-[420px]">
          <!-- Login Card -->
          <div class="bg-white border border-slate-200 rounded-2xl p-6 md:p-10 shadow-[0_20px_60px_rgba(46,49,146,0.05)] text-center">
            <!-- Brand Header -->
            <div class="mb-8 flex flex-col items-center">
              <div class="w-14 h-14 bg-primary-container rounded-full flex items-center justify-center mb-4 shadow-lg shadow-brand-teal/20">
                <svg class="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="3"></circle><circle cx="6" cy="6" r="2"></circle><circle cx="18" cy="6" r="2"></circle><circle cx="18" cy="18" r="2"></circle><circle cx="6" cy="18" r="2"></circle><line x1="8" y1="8" x2="10" y2="10"></line><line x1="16" y1="8" x2="14" y2="10"></line><line x1="16" y1="16" x2="14" y2="14"></line><line x1="8" y1="16" x2="10" y2="14"></line></svg>
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
                    <svg class="w-5 h-5 text-slate-400 group-focus-within:text-[#041627] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                  </div>
                  <input class="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-full font-body-md text-sm text-on-surface focus:outline-none focus:ring-4 focus:ring-brand-teal/5 focus:border-brand-teal transition-all outline-none"
                         id="email" name="email" [(ngModel)]="email" placeholder="name@company.com" type="email" required/>
                </div>
              </div>

              <div class="space-y-1.5">
                <div class="flex justify-between items-center px-1">
                  <label class="font-label-sm text-[11px] font-bold text-secondary uppercase tracking-wider" for="password">Password</label>
                  <a routerLink="/reset-password" class="font-label-sm text-[11px] font-bold text-brand-teal hover:underline cursor-pointer">Forgot?</a>
                </div>
                <div class="relative group">
                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg class="w-5 h-5 text-slate-400 group-focus-within:text-[#041627] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  </div>
                  <input class="block w-full pl-11 pr-11 py-3 bg-white border border-slate-200 rounded-full font-body-md text-sm text-on-surface focus:outline-none focus:ring-4 focus:ring-brand-teal/5 focus:border-brand-teal transition-all outline-none"
                         id="password" name="password" [type]="showPassword ? 'text' : 'password'" [(ngModel)]="password" placeholder="••••••••" required/>
                  <div class="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer" (click)="showPassword = !showPassword">
                    @if (showPassword) {
                      <svg class="w-5 h-5 text-slate-400 hover:text-slate-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>
                    } @else {
                      <svg class="w-5 h-5 text-slate-400 hover:text-slate-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                    }
                  </div>
                </div>
              </div>

              <div class="flex items-center px-1">
                <input class="w-3.5 h-3.5 text-brand-teal bg-white border-slate-200 rounded focus:ring-brand-teal focus:ring-offset-0" id="remember" name="remember" type="checkbox"/>
                <label class="ml-2.5 font-label-sm text-[11px] font-bold text-secondary uppercase tracking-wider" for="remember">Stay signed in</label>
              </div>

              <button class="w-full py-4 bg-on-background text-white rounded-full font-label-caps text-[11px] font-black tracking-[0.2em] shadow-lg shadow-on-background/10 hover:bg-brand-teal transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
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
              <a routerLink="/register" class="text-brand-teal font-bold ml-1 hover:underline cursor-pointer">Join Now</a>
            </p>
          </div>
        </div>
      </main>
    </div>
  `
})
export class LoginPage {
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);

  email = '';
  password = '';
  showPassword = false;
  loading = signal(false);
  private returnUrl = '';

  constructor() {
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '';
  }

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
