import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, switchMap, takeWhile, timeout, catchError, of, throwError, TimeoutError } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PaymentStatusResponse {
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'NO_PAYMENT' | 'DISPUTED' | 'PROCESSING_PAYOUT' | 'PAYOUT_FAILED';
  id?: string;
  jobId?: string;
  amount?: number;
  phoneNumber?: string;
  checkoutRequestId?: string;
  mpesaReceiptNumber?: string;
  platformFee?: number;
  workerAmount?: number;
  failureReason?: string;
  message?: string;
  createdAt?: string;
  timeoutAt?: string;
  transactionDate?: string;
}

export interface PlatformFeeRecord {
  jobId: string;
  clientName: string;
  workerName: string;
  service?: string;
  totalAmount: number;
  platformFee: number;
  workerNetAmount: number;
  paymentStatus: string;
  jobStatus: string;
  transactionDate?: string;
  createdAt?: string;
  mpesaReceiptNumber?: string;
}

export interface StkPushResponse {
  status: string;
  checkoutRequestId: string;
  message: string;
}

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
  private readonly BASE = `${environment.apiUrl}/payments`;

  initiateStkPush(jobId: string, phoneNumber: string): Observable<StkPushResponse> {
    return this.http.post<StkPushResponse>(`${this.BASE}/mpesa/stkpush`, { jobId, phoneNumber });
  }

  /**
   * Polls payment status every 3 seconds until a terminal state.
   * Hard timeout at 120 seconds to allow delayed Safaricom callbacks.
   */
  pollPaymentStatus(jobId: string): Observable<PaymentStatusResponse> {
    const terminal = new Set<string>(['PAID', 'FAILED', 'REFUNDED', 'NO_PAYMENT']);

    return interval(3000).pipe(
      switchMap(() => this.getPaymentStatus(jobId)),
      takeWhile(resp => !terminal.has(resp.status), true),
      timeout(120_000),
      catchError(err => {
        if (err instanceof TimeoutError) {
          return of<PaymentStatusResponse>({
            status: 'PENDING',
            message: 'Still waiting for M-Pesa confirmation. You can refresh this page.',
          });
        }
        return throwError(() => err);
      })
    );
  }

  getPaymentStatus(jobId: string): Observable<PaymentStatusResponse> {
    return this.http.get<PaymentStatusResponse>(`${this.BASE}/status/${jobId}`).pipe(
      catchError(err => {
        if (err?.status >= 500 || err?.status === 0) {
          return of({ status: 'PENDING' } as PaymentStatusResponse);
        }
        return throwError(() => err);
      })
    );
  }

  getFailureMessage(failureReason?: string, fallbackMessage?: string): string {
    if (!failureReason) {
      return fallbackMessage || 'Payment failed. Please try again.';
    }
    return PAYMENT_FAILURE_MESSAGES[failureReason]
      ?? fallbackMessage
      ?? 'Payment failed. Please try again.';
  }

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
    return this.http.get(`${environment.apiUrl}/wallet/balance`);
  }

  getPaymentReceipt(jobId: string): Observable<any> {
    return this.http.get(`${this.BASE}/receipt/${jobId}`);
  }

  getPlatformFees(params: { date?: string; status?: string; search?: string } = {}): Observable<PlatformFeeRecord[]> {
    const query = new URLSearchParams();
    if (params.date) query.set('date', params.date);
    if (params.status && params.status !== 'All') query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return this.http.get<PlatformFeeRecord[]>(`${this.BASE}/admin/fees${suffix}`);
  }
}
