import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-escrow-tooltip',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="relative inline-block">
      <button 
        class="flex items-center gap-1.5 text-slate-400 hover:text-brand-teal transition-colors group"
        (mouseenter)="showTooltip.set(true)"
        (mouseleave)="showTooltip.set(false)"
      >
        <mat-icon class="!text-sm !w-auto !h-auto">info</mat-icon>
        <span class="text-[9px] font-black uppercase tracking-wider">What is Escrow?</span>
      </button>
      
      @if (showTooltip()) {
        <div class="absolute left-0 top-full mt-2 w-80 bg-slate-900 text-white rounded-xl p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
          <div class="flex items-start gap-3 mb-3">
            <div class="w-8 h-8 bg-brand-teal rounded-lg flex items-center justify-center shrink-0">
              <mat-icon class="!text-lg !w-auto !h-auto text-white">shield</mat-icon>
            </div>
            <div>
              <h4 class="text-sm font-black mb-1">Secure Payment Protection</h4>
              <p class="text-xs text-slate-300 leading-relaxed">
                Escrow safely holds your payment until the worker delivers work.
              </p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0">
              <mat-icon class="!text-lg !w-auto !h-auto text-white">gavel</mat-icon>
            </div>
            <div>
              <h4 class="text-sm font-black mb-1">Fair Dispute Resolution</h4>
              <p class="text-xs text-slate-300 leading-relaxed">
                If the project is not completed, disputes can be handled fairly.
              </p>
            </div>
          </div>
          <div class="mt-3 pt-3 border-t border-slate-700">
            <p class="text-[10px] text-slate-400 italic">
              This dramatically reduces confusion for both parties.
            </p>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class EscrowTooltip {
  showTooltip = signal(false);
}
