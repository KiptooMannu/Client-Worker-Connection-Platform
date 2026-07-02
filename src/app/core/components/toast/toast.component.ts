import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ToastService, ToastType, Toast } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="fixed top-4 right-4 z-[2147483647] flex flex-col items-end gap-3 px-4 pointer-events-auto">
      <div *ngFor="let toast of toastService.activeToasts(); trackBy: trackByToast" class="w-full max-w-md pointer-events-auto toast-animate" [attr.data-toast-id]="toast.id">
        <div class="relative rounded-2xl border px-5 py-4 shadow-lg backdrop-blur-sm overflow-hidden transition-all duration-300 bg-white/95" [ngClass]="getToastClasses(toast.type)">
          <div class="flex items-start gap-3">
            <mat-icon class="shrink-0 !text-xl mt-0.5" [ngClass]="getIconClass(toast.type)">{{ getIcon(toast.type) }}</mat-icon>
            <p class="text-sm font-medium text-slate-800 flex-1 leading-relaxed">{{ toast.message }}</p>
            <button *ngIf="toast.dismissible" (click)="dismiss(toast.id)" class="shrink-0 text-slate-400 hover:text-slate-600 transition-colors" aria-label="Close notification">
              <mat-icon class="!text-lg">close</mat-icon>
            </button>
          </div>
          <div *ngIf="toast.actionLabel" class="mt-3 flex justify-end">
            <button type="button" (click)="triggerAction(toast)" class="rounded-full px-3 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">
              {{ toast.actionLabel }}
            </button>
          </div>
          <div *ngIf="toast.duration && toast.duration > 0" class="absolute bottom-0 left-0 h-1 progress-bar" [ngClass]="getProgressClass(toast.type)" [style.width.%]="getProgress(toast.id, toast.duration)"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    .toast-animate {
      animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
    
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    
    .progress-bar {
      transition: width 16ms linear;
      width: 100%;
    }
    
    .backdrop-blur-sm {
      backdrop-filter: blur(4px);
    }
  `]
})
export class ToastComponent {
  toastService = inject(ToastService);
  private progressMap = signal<Record<string, number>>({});
  private startTimeMap = signal<Record<string, number>>({});

  constructor() {
    effect(() => {
      const toasts = this.toastService.activeToasts();
      const currentProgress = this.progressMap();
      const currentStartTimes = this.startTimeMap();
      
      // Initialize progress for new toasts
      const newProgress = { ...currentProgress };
      const newStartTimes = { ...currentStartTimes };
      let hasChanges = false;
      
      for (const toast of toasts) {
        if (!(toast.id in currentStartTimes) && toast.duration && toast.duration > 0) {
          newStartTimes[toast.id] = Date.now();
          newProgress[toast.id] = 100;
          hasChanges = true;
        }
      }
      
      // Remove dismissed toasts
      for (const id in currentStartTimes) {
        if (!toasts.find(t => t.id === id)) {
          delete newStartTimes[id];
          delete newProgress[id];
          hasChanges = true;
        }
      }
      
      if (hasChanges) {
        this.startTimeMap.set(newStartTimes);
        this.progressMap.set(newProgress);
      }
      
      // Update progress for active toasts
      if (Object.keys(newStartTimes).length > 0) {
        this.updateProgress(toasts, newStartTimes);
      }
    });
  }

  private updateProgress(toasts: Toast[], startTimes: Record<string, number>): void {
    const currentProgress = this.progressMap();
    const newProgress = { ...currentProgress };
    let hasChanges = false;
    
    for (const toast of toasts) {
      if (toast.duration && toast.duration > 0 && toast.id in startTimes) {
        const elapsed = Date.now() - startTimes[toast.id];
        const remaining = Math.max(0, toast.duration - elapsed);
        const progress = (remaining / toast.duration) * 100;
        
        if (newProgress[toast.id] !== progress) {
          newProgress[toast.id] = progress;
          hasChanges = true;
        }
      }
    }
    
    if (hasChanges) {
      this.progressMap.set(newProgress);
    }
  }

  getProgress(toastId: string, duration: number): number {
    return this.progressMap()[toastId] ?? 100;
  }

  dismiss(id: string): void {
    this.toastService.dismiss(id);
  }

  triggerAction(toast: Toast): void {
    if (toast.action) {
      toast.action();
    }
    this.dismiss(toast.id);
  }

  trackByToast(index: number, toast: { id: string }): string {
    return toast.id;
  }

  getIcon(type: ToastType): string {
    switch (type) {
      case 'success': return 'check_circle';
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
    }
  }

  getToastClasses(type: ToastType): string {
    switch (type) {
      case 'success': return 'bg-emerald-50/95 border-emerald-200';
      case 'error': return 'bg-rose-50/95 border-rose-200';
      case 'warning': return 'bg-amber-50/95 border-amber-200';
      case 'info': return 'bg-sky-50/95 border-sky-200';
    }
  }

  getIconClass(type: ToastType): string {
    switch (type) {
      case 'success': return 'text-emerald-600';
      case 'error': return 'text-rose-600';
      case 'warning': return 'text-amber-600';
      case 'info': return 'text-sky-600';
    }
  }

  getProgressClass(type: ToastType): string {
    switch (type) {
      case 'success': return 'bg-emerald-500';
      case 'error': return 'bg-rose-500';
      case 'warning': return 'bg-amber-500';
      case 'info': return 'bg-sky-500';
    }
  }
}