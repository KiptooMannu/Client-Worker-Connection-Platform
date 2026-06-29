import { Injectable, inject } from '@angular/core';
import { ToastService, ToastOptions } from './toast.service';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private toastService = inject(ToastService);

  success(message: string, options: ToastOptions = {}): void {
    this.toastService.success(message, options);
  }

  error(message: string, options: ToastOptions = {}): void {
    this.toastService.error(message, options);
  }

  info(message: string, options: ToastOptions = {}): void {
    this.toastService.info(message, options);
  }

  warning(message: string, options: ToastOptions = {}): void {
    this.toastService.warning(message, options);
  }
}
