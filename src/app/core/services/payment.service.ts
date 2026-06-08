import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, interval, switchMap, takeWhile, tap, timeout, catchError, of } from 'rxjs';

export interface PaymentStatusResponse {
  status: 'PENDING' | 'PAID' | 'FAILED' | 'NO_PAYMENT';
  id?: string;
  jobId?: string;
  amount?: number;
  phoneNumber?: string;
  checkoutRequestId?: string;
  mpesaReceiptNumber?: string;
  message?: string;
  createdAt?: string;
  timeoutAt?: string;
}

export interface StkPushResponse {
  status: string;
  checkoutRequestId: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {

  private http = inject(HttpClient);
  private readonly BASE = '/api/payments';

  /**
   * Initiates STK push. Idempotent — safe to call twice.
   */
  initiateStkPush(jobId: string, phoneNumber: string): Observable<StkPushResponse> {
    return this.http.post<StkPushResponse>(`${this.BASE}/mpesa/stkpush`, { jobId, phoneNumber });
  }

  /**
   * Polls payment status every 3 seconds.
   * Stops when status reaches a terminal state (PAID, FAILED)
   * or when the caller unsubscribes (e.g. component destroy).
   */
  pollPaymentStatus(jobId: string): Observable<PaymentStatusResponse> {
    const terminal = new Set(['PAID', 'FAILED']);
    return interval(3000).pipe(
      switchMap(() => this.getPaymentStatus(jobId)),
      takeWhile(resp => !terminal.has(resp.status), /* inclusive = */ true)
    );
  }

  getPaymentStatus(jobId: string): Observable<PaymentStatusResponse> {
    return this.http.get<PaymentStatusResponse>(`${this.BASE}/status/${jobId}`).pipe(
      catchError(() => of({ status: 'PENDING' } as PaymentStatusResponse))
    );
  }

  releaseEscrow(jobId: string): Observable<any> {
    // Escrow endpoints deprecated — kept only for compatibility.
    return this.http.post(`${this.BASE}/escrow/release`, {});
  }

  refundEscrow(jobId: string): Observable<any> {
    // Escrow endpoints deprecated — keep stub for compatibility.
    return this.http.post(`${this.BASE}/escrow/refund`, {});
  }

  getWalletBalance(): Observable<any> {
    return this.http.get('/api/wallet/balance');
  }
}