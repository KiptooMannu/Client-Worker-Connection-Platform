import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService, UserRole } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule, MatButtonModule, MatSnackBarModule],
  template: `
    <div class="min-h-screen bg-[#f7f9fb] flex flex-col">
      <header class="h-20 flex items-center px-12 border-b border-slate-100 bg-white shadow-sm">
        <div class="flex items-center gap-3 cursor-pointer" routerLink="/">
          <div class="w-10 h-10 bg-[#0f172a] rounded-xl flex items-center justify-center text-white shadow-lg">
            <mat-icon>corporate_fare</mat-icon>
          </div>
          <span class="text-2xl font-black tracking-tighter text-[#0f172a]">ProMarket</span>
        </div>
      </header>

      <main class="flex-grow flex items-center justify-center p-6">
        <div class="w-full max-w-xl bg-white rounded-[2.5rem] p-12 shadow-[0_8px_48px_rgba(4,22,39,0.08)] border border-slate-100">
          <div class="text-center mb-10">
            <h1 class="text-3xl font-black text-[#0f172a] tracking-tight mb-2">Join the Marketplace</h1>
            <p class="text-slate-400 font-medium text-sm">Create your secure account and get started.</p>
          </div>

          <form (submit)="onSubmit()" class="space-y-8">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                <div class="relative">
                  <mat-icon class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">person</mat-icon>
                  <input type="text" [(ngModel)]="name" name="name" required
                         class="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 focus:bg-white transition-all text-sm font-medium"
                         placeholder="John Doe">
                </div>
              </div>

              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <div class="relative">
                  <mat-icon class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">mail</mat-icon>
                  <input type="email" [(ngModel)]="email" name="email" required
                         class="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 focus:bg-white transition-all text-sm font-medium"
                         placeholder="john@example.com">
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">I want to join as a:</label>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div (click)="role = 'Client'" 
                     [ngClass]="role === 'Client' ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600/10' : 'border-slate-100 bg-white'"
                     class="p-6 rounded-2xl border cursor-pointer transition-all hover:border-indigo-200 flex items-center gap-4">
                  <div class="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                    <mat-icon>person_search</mat-icon>
                  </div>
                  <div>
                    <p class="text-sm font-black text-[#041627]">Client</p>
                    <p class="text-[10px] font-medium text-slate-400">I want to hire talent</p>
                  </div>
                </div>

                <div (click)="role = 'Worker'" 
                     [ngClass]="role === 'Worker' ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600/10' : 'border-slate-100 bg-white'"
                     class="p-6 rounded-2xl border cursor-pointer transition-all hover:border-blue-200 flex items-center gap-4">
                  <div class="w-10 h-10 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center">
                    <mat-icon>construction</mat-icon>
                  </div>
                  <div>
                    <p class="text-sm font-black text-[#0f172a]">Worker</p>
                    <p class="text-[10px] font-medium text-slate-400">I want to provide services</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Choose Password</label>
              <div class="relative">
                <mat-icon class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">lock</mat-icon>
                <input type="password" [(ngModel)]="password" name="password" required
                       class="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 focus:bg-white transition-all text-sm font-medium"
                       placeholder="••••••••">
              </div>
            </div>

            <button type="submit" [disabled]="loading()"
                    class="w-full bg-[#0f172a] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-slate-900/10 hover:shadow-2xl cursor-pointer">
              {{ loading() ? 'Creating Account...' : 'Get Started Now' }}
            </button>
          </form>

          <div class="mt-10 pt-8 border-t border-slate-100 text-center">
            <p class="text-sm text-slate-400 font-medium">
              Already have an account? 
              <a routerLink="/login" class="text-blue-600 font-black uppercase text-[10px] tracking-widest ml-1 hover:underline cursor-pointer">Sign In</a>
            </p>
          </div>
        </div>
      </main>
    </div>
  `
})
export class RegisterPage implements OnInit {
  private auth = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private route = inject(ActivatedRoute);
  
  name = '';
  email = '';
  password = '';
  role: UserRole = 'Client';
  loading = signal(false);

  ngOnInit() {
    // Pre-select role from query param (e.g. ?role=worker from landing CTA)
    const roleParam = this.route.snapshot.queryParamMap.get('role');
    if (roleParam === 'worker') {
      this.role = 'Worker';
    } else if (roleParam === 'client') {
      this.role = 'Client';
    }
  }

  onSubmit() {
    if (!this.name.trim() || !this.email.trim() || !this.password.trim()) {
      this.snackBar.open('Please fill in all fields.', 'Close', {
        duration: 3000,
        panelClass: ['!bg-red-600', '!text-white', '!rounded-2xl']
      });
      return;
    }
    this.loading.set(true);
    setTimeout(() => {
      this.auth.register(this.name, this.email, this.role);
      this.loading.set(false);
      this.snackBar.open('Registration Successful! Welcome aboard.', 'Dismiss', {
        duration: 4000,
        panelClass: ['!bg-slate-900', '!text-white', '!rounded-2xl']
      });
    }, 1000);
  }
}
