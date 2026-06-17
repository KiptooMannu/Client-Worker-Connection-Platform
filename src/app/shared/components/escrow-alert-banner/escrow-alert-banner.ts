import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-escrow-alert-banner',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 mb-6 animate-in slide-in-from-top duration-500">
      <div class="flex items-start gap-4">
        <div class="shrink-0">
          <div class="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center">
            <mat-icon class="!text-2xl !w-auto !h-auto text-white">warning</mat-icon>
          </div>
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2">
            <h3 class="text-lg font-black text-amber-900 uppercase tracking-wider">⚠ Action Required</h3>
          </div>
          <p class="text-sm text-amber-800 font-medium mb-3">
            Your worker has accepted the offer.
          </p>
          <p class="text-sm text-amber-700 mb-4">
            To start work securely, please fund escrow. Your payment remains protected until work is delivered.
          </p>
          <button 
            (click)="fundEscrow.emit()"
            class="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center gap-2">
            <mat-icon class="!text-sm !w-auto !h-auto">account_balance_wallet</mat-icon>
            Fund Escrow
          </button>
        </div>
        <button 
          (click)="dismiss.emit()"
          class="shrink-0 text-amber-400 hover:text-amber-600 transition-colors">
          <mat-icon class="!text-xl !w-auto !h-auto">close</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class EscrowAlertBanner {
  fundEscrow = output<void>();
  dismiss = output<void>();
}
