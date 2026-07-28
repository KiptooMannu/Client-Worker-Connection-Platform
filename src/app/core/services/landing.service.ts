import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Live platform counts shown in the landing page statistics band. */
export interface LandingStats {
  verifiedWorkers: number;
  jobsCompleted: number;
  registeredClients: number;
  volumeProcessed: number;
  averageRating: number;
  totalReviews: number;
}

/** A real client review, surfaced as a testimonial. */
export interface Testimonial {
  reviewerName: string;
  rating: number;
  comment: string;
  workerName: string;
  workerCategory: string;
  createdAt: string | null;
}

/**
 * Public, unauthenticated landing page content.
 *
 * Both calls degrade to empty rather than erroring: the marketing page must
 * still render if the API is down, so the caller shows real figures when they
 * arrive and hides those sections otherwise.
 */
@Injectable({ providedIn: 'root' })
export class LandingService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/public`;

  getStats(): Observable<LandingStats | null> {
    return this.http.get<LandingStats>(`${this.base}/landing-stats`).pipe(
      catchError(() => of(null))
    );
  }

  /** Returns `[]` when the platform has too few qualifying reviews to show a rail. */
  getTestimonials(): Observable<Testimonial[]> {
    return this.http.get<Testimonial[]>(`${this.base}/testimonials`).pipe(
      catchError(() => of([]))
    );
  }
}
