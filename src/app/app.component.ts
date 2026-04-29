import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DevNavigatorComponent } from './shared/components/dev-navigator';
import { LoadingComponent } from './shared/components/loading';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, DevNavigatorComponent, LoadingComponent],
  template: `
    <router-outlet />
    <app-loading />
    <app-dev-navigator />
  `
})
export class AppComponent {}
