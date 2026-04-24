import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DevNavigatorComponent } from './shared/components/dev-navigator';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, DevNavigatorComponent],
  template: `
    <router-outlet />
    <app-dev-navigator />
  `
})
export class AppComponent {}
