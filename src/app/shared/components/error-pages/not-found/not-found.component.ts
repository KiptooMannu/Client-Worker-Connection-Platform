import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  template: `
    <div class="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div class="text-center max-w-md">
        <div class="mb-8">
          <h1 class="text-9xl font-black text-brand-teal">404</h1>
        </div>
        <h2 class="text-2xl font-bold text-slate-900 mb-4">Page Not Found</h2>
        <p class="text-slate-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <button
          (click)="goHome()"
          class="px-8 py-3 bg-brand-teal text-white rounded-lg font-bold text-sm hover:bg-brand-teal/90 transition-all">
          Go Home
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class NotFoundComponent {
  constructor(private router: Router) {}

  goHome() {
    this.router.navigate(['/']);
  }
}
