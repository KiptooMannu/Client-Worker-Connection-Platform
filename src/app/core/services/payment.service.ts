import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, switchMap, takeWhile, timeout, catchError, of, throwError, TimeoutError } from 'rxjs';

export interface PaymentStatusResponse {
  status: 'PENDING' | 'PAID' | 'FAILED' | 'NO_PAYMENT';
  id?: string;
  jobId?: string;
  amount?: number;
  phoneNumber?: string;
  checkoutRequestId?: string;
  mpesaReceiptNumber?: string;
  // FIX: failureReason is now included to map to user-friendly messages
  failureReason?: string;
  message?: string;
  createdAt?: string;
  timeoutAt?: string;
}

export interface StkPushResponse {
  status: string;
  checkoutRequestId: string;
  message: string;
}

// FIX: Exported so booking page can use it for display
export const PAYMENT_FAILURE_MESSAGES: Record<string, string> = {
  'WRONG_PIN':          'Incorrect M-Pesa PIN. Please try again.',
  'INSUFFICIENT_FUNDS': 'Insufficient funds in your M-Pesa account.',
  'USER_CANCELLED':     'Payment was cancelled.',
  'REQUEST_CANCELLED':  'Payment request was cancelled.',
  'TIMEOUT':            'Payment request timed out. Please try again.',
  'NETWORK_FAILURE':    'Unable to communicate with M-Pesa. Please try again.',
  'MPESA_ERROR_1037':   'Incorrect M-Pesa PIN. Please try again.',
  'MPESA_ERROR_1034':   'Incorrect M-Pesa PIN. Please try again.',
  'MPESA_ERROR_1032':   'Payment was cancelled by user.',
  'MPESA_ERROR_1031':   'Payment request timed out. Please try again.',
  'MPESA_ERROR_1030':   'Payment request was cancelled.',
  'MPESA_ERROR_1001':   'Payment request timed out. Please try again.',
  'MPESA_ERROR_1':      'Insufficient funds in your M-Pesa account.',
  'MPESA_ERROR_2001':   'Unable to communicate with M-Pesa. Please try again.',
};

@Injectable({ providedIn: 'root' })
export class PaymentService {

  private http = inject(HttpClient);
  private readonly BASE = '/api/payments';

  initiateStkPush(jobId: string, phoneNumber: string): Observable<StkPushResponse> {
    return this.http.post<StkPushResponse>(`${this.BASE}/mpesa/stkpush`, { jobId, phoneNumber });
  }

  /**
   * FIX: Polls payment status every 3 seconds.
   * - Hard timeout at 65 seconds (STK push expires at 60s on Safaricom's side).
   * - On TimeoutError, emits a synthetic FAILED response with reason TIMEOUT
   *   so the UI always receives a terminal event and never stays stuck.
   * - Stops polling when status is PAID, FAILED, or NO_PAYMENT.
   */
  pollPaymentStatus(jobId: string): Observable<PaymentStatusResponse> {
    const terminal = new Set<string>(['PAID', 'FAILED', 'NO_PAYMENT']);

    return interval(3000).pipe(
      switchMap(() => this.getPaymentStatus(jobId)),
      takeWhile(resp => !terminal.has(resp.status), /* inclusive = */ true),
      // FIX: 65 second hard cap — STK push expires at 60s on Safaricom side
      timeout(65_000),
      catchError(err => {
        if (err instanceof TimeoutError) {
          // Emit a synthetic terminal FAILED status so the UI stops waiting
          return of<PaymentStatusResponse>({
            status: 'FAILED',
            failureReason: 'TIMEOUT',
            message: 'Payment request timed out. Please try again.',
          });
        }
        return throwError(() => err);
      })
    );
  }

  getPaymentStatus(jobId: string): Observable<PaymentStatusResponse> {
    return this.http.get<PaymentStatusResponse>(`${this.BASE}/status/${jobId}`).pipe(
      // FIX: On network error, return PENDING (not FAILED) to keep retrying
      // On a confirmed error code, let it propagate
      catchError(err => {
        if (err?.status >= 500 || err?.status === 0) {
          // Transient — keep polling
          return of({ status: 'PENDING' } as PaymentStatusResponse);
        }
        // 4xx or unexpected — bubble up to the catchError in pollPaymentStatus
        return throwError(() => err);
      })
    );
  }

  /**
   * FIX: Maps backend failureReason codes to human-readable messages.
   */
  getFailureMessage(failureReason?: string, fallbackMessage?: string): string {
    if (!failureReason) {
      return fallbackMessage || 'Payment failed. Please try again.';
    }
    return PAYMENT_FAILURE_MESSAGES[failureReason]
      ?? fallbackMessage
      ?? 'Payment failed. Please try again.';
  }

  /**
   * FIX: Initiating a new STK push is allowed after a FAILED payment.
   * The backend blocks duplicate PENDING/ESCROWED/SUCCESS payments but
   * allows a fresh attempt after failure. This method is the same as
   * initiateStkPush — it exists as an alias for clarity in the UI.
   */
  retryPayment(jobId: string, phoneNumber: string): Observable<StkPushResponse> {
    return this.initiateStkPush(jobId, phoneNumber);
  }

  releaseEscrow(jobId: string): Observable<any> {
    return this.http.post(`${this.BASE}/escrow/release/${jobId}`, {});
  }

  refundEscrow(jobId: string): Observable<any> {
    return this.http.post(`${this.BASE}/escrow/refund/${jobId}`, {});
  }

  getWalletBalance(): Observable<any> {
    return this.http.get('/api/wallet/balance');
  }

  getPaymentReceipt(jobId: string): Observable<any> {
    return this.http.get(`${this.BASE}/receipt/${jobId}`);
  }
}