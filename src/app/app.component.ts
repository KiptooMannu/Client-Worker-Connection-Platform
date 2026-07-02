import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingComponent } from './shared/components/loading';
import { ToastComponent } from './core/components/toast/toast.component';
import { PlatformStateService } from './core/services/platform-state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LoadingComponent, ToastComponent],
  template: `
    <app-toast-container></app-toast-container>
    <router-outlet></router-outlet>
    <app-loading></app-loading>
  `
})
export class AppComponent implements OnInit {
  private state = inject(PlatformStateService);

  ngOnInit() {
    // Start automatic job expiry check (runs every hour)
    this.state.startJobExpiryCheck();
  }
}
