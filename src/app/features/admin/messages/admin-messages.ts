import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedMessagesComponent } from '../../../shared/components/messages';

@Component({
  selector: 'app-admin-messages',
  standalone: true,
  imports: [CommonModule, SharedMessagesComponent],
  template: `
    <div class="p-6">
      <app-shared-messages></app-shared-messages>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class AdminMessagesPage {}
