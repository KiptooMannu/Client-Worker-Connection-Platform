import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PlatformStateService, WorkerProfile } from '../../../core/services/platform-state.service';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-negotiation',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule],
  template: '<div class="max-w-3xl mx-auto p-4" *ngIf="worker()">' +
    '<mat-card>' +
    '<mat-card-header>' +
    '<div mat-card-avatar class="rounded-full bg-brand-teal w-12 h-12 flex items-center justify-center">' +
    '<mat-icon>handshake</mat-icon>' +
    '</div>' +
    '<mat-card-title>{{ worker()?.name }}</mat-card-title>' +
    '<mat-card-subtitle>{{ worker()?.category }}</mat-card-subtitle>' +
    '</mat-card-header>' +
    '<mat-card-content>' +
    '<p class="mt-2">Rate: KSh {{ worker()?.rate }}</p>' +
    '<p>Location: {{ worker()?.location }}</p>' +
    '<p>Skills: {{ worker()?.skills?.join(", ") }}</p>' +
    '<p class="mt-4">Do you want to negotiate a contract with this worker?</p>' +
    '</mat-card-content>' +
    '<mat-card-actions class="flex justify-end gap-2">' +
    '<button mat-button color="primary" (click)="accept()">Accept</button>' +
    '<button mat-button color="warn" (click)="decline()">Decline</button>' +
    '</mat-card-actions>' +
    '</mat-card>' +
    '</div>' +
    '<div *ngIf="!worker()" class="text-center py-8">' +
    '<p>Loading negotiation details...</p>' +
    '</div>',
  styles: ['.mat-card { border-radius: 1rem; }']
})
export class NegotiationPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private state = inject(PlatformStateService);

  worker = signal<WorkerProfile | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const foundWorker = this.state.workers().find((worker: WorkerProfile) => worker.id === id);
      if (foundWorker) {
        this.worker.set(foundWorker);
      } else {
        this.router.navigate(['/client/marketplace']);
      }
    }
  }

  accept() {
    alert('Negotiation accepted for ' + (this.worker()?.name || ''));
    this.router.navigate(['/client/marketplace']);
  }

  decline() {
    alert('Negotiation declined.');
    this.router.navigate(['/client/marketplace']);
  }
}