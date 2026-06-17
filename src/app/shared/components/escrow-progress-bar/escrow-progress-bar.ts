import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export interface EscrowStep {
  step: number;
  label: string;
  status: 'completed' | 'current' | 'pending' | 'warning';
}

@Component({
  selector: 'app-escrow-progress-bar',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
      <div class="flex items-center justify-between">
        @for (step of steps(); track step.step) {
          <div class="flex items-center flex-1">
            <div class="flex flex-col items-center">
              <div 
                class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all"
                [ngClass]="{
                  'bg-emerald-500 text-white': step.status === 'completed',
                  'bg-amber-500 text-white': step.status === 'warning',
                  'bg-brand-teal text-white': step.status === 'current',
                  'bg-slate-100 text-slate-400': step.status === 'pending'
                }"
              >
                @if (step.status === 'completed') {
                  <mat-icon class="!text-lg !w-auto !h-auto">check</mat-icon>
                } @else if (step.status === 'warning') {
                  <mat-icon class="!text-lg !w-auto !h-auto">warning</mat-icon>
                } @else {
                  {{ step.step }}
                }
              </div>
              <p 
                class="text-[9px] font-black uppercase tracking-wider mt-2 text-center"
                [ngClass]="{
                  'text-emerald-600': step.status === 'completed',
                  'text-amber-600': step.status === 'warning',
                  'text-brand-teal': step.status === 'current',
                  'text-slate-400': step.status === 'pending'
                }"
              >
                {{ step.label }}
              </p>
            </div>
            @if (step.step < 6) {
              <div 
                class="flex-1 h-1 mx-2 rounded-full"
                [ngClass]="{
                  'bg-emerald-500': step.status === 'completed',
                  'bg-slate-100': step.status !== 'completed'
                }"
              ></div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class EscrowProgressBar {
  steps = input.required<EscrowStep[]>();
}
