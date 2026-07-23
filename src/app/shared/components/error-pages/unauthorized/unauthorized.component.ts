import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  template: `
    <div class="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div class="text-center max-w-md">
        <div class="mb-8">
          <h1 class="text-9xl font-black text-amber-500">403</h1>
        </div>
        <h2 class="text-2xl font-bold text-slate-900 mb-4">Access Denied</h2>
        <p class="text-slate-600 mb-8">
          You don't have permission to access this page. Please log in with the appropriate account.
        </p>
        <div class="flex gap-4 justify-center">
          <button
            (click)="goLogin()"
            class="px-6 py-3 bg-brand-teal text-white rounded-lg font-bold text-sm hover:bg-brand-teal/90 transition-all">
            Log In
          </button>
          <button
            (click)="goHome()"
            class="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-bold text-sm hover:bg-slate-100 transition-all">
            Go Home
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class UnauthorizedComponent {
  constructor(private router: Router) {}

  goLogin() {
    this.router.navigate(['/login']);
  }

  goHome() {
    this.router.navigate(['/']);
  }
}
