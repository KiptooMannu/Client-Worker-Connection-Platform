import { Injectable, signal, computed, effect } from '@angular/core';
import { take } from 'rxjs';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  duration?: number;
  actionLabel?: string;
  action?: () => void;
}

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  dismissible?: boolean;
  actionLabel?: string;
  action?: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toasts = signal<Toast[]>([]);
  private counter = 0;

  readonly activeToasts = computed(() => this.toasts());

  show(type: ToastType, message: string, duration = 4000, options: ToastOptions = {}): void {
    console.debug('[ToastService] show', { type, message, duration, options });
    // Prevent exact duplicate toasts from stacking (same type + message + action label)
    const existing = this.toasts().some(t =>
      t.type === type && t.message === message && t.actionLabel === options.actionLabel
    );
    if (existing) {
      console.debug('[ToastService] duplicate toast suppressed', { type, message, options });
      return;
    }

    const id = `toast-${++this.counter}`;
    const toast: Toast = {
      id,
      type,
      message,
      duration,
      dismissible: true,
      actionLabel: options.actionLabel,
      action: options.action
    };

    this.toasts.update(list => [...list, toast]);

    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }

  success(message: string, options: ToastOptions = {}): void {
    this.show('success', message, options.duration ?? 4000, options);
  }

  error(message: string, options: ToastOptions = {}): void {
    this.show('error', message, options.duration ?? 7000, options);
  }

  warning(message: string, options: ToastOptions = {}): void {
    this.show('warning', message, options.duration ?? 5000, options);
  }

  info(message: string, options: ToastOptions = {}): void {
    this.show('info', message, options.duration ?? 4000, options);
  }

  dismiss(id: string): void {
    console.debug('[ToastService] dismiss', { id });
    this.toasts.update(list => list.filter(t => t.id !== id));
  }

  dismissAll(): void {
    this.toasts.set([]);
  }

  private getIcon(type: ToastType): string {
    switch (type) {
      case 'success': return 'check_circle';
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
    }
  }

  private getStyles(type: ToastType): { bg: string; border: string; icon: string; progress: string } {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          icon: 'text-emerald-600',
          progress: 'bg-emerald-500'
        };
      case 'error':
        return {
          bg: 'bg-rose-50',
          border: 'border-rose-200',
          icon: 'text-rose-600',
          progress: 'bg-rose-500'
        };
      case 'warning':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          icon: 'text-amber-600',
          progress: 'bg-amber-500'
        };
      case 'info':
        return {
          bg: 'bg-sky-50',
          border: 'border-sky-200',
          icon: 'text-sky-600',
          progress: 'bg-sky-500'
        };
    }
  }
}