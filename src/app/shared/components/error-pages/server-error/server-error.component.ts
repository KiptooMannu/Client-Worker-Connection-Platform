import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-server-error',
  standalone: true,
  template: `
    <div class="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div class="text-center max-w-md">
        <div class="mb-8">
          <h1 class="text-9xl font-black text-rose-500">500</h1>
        </div>
        <h2 class="text-2xl font-bold text-slate-900 mb-4">Server Error</h2>
        <p class="text-slate-600 mb-8">
          Something went wrong on our end. Our team has been notified and is working to fix it.
        </p>
        <div class="flex gap-4 justify-center">
          <button
            (click)="goHome()"
            class="px-6 py-3 bg-brand-teal text-white rounded-lg font-bold text-sm hover:bg-brand-teal/90 transition-all">
            Go Home
          </button>
          <button
            (click)="refresh()"
            class="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-bold text-sm hover:bg-slate-100 transition-all">
            Try Again
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class ServerErrorComponent {
  constructor(private router: Router) {}

  goHome() {
    this.router.navigate(['/']);
  }

  refresh() {
    window.location.reload();
  }
}
