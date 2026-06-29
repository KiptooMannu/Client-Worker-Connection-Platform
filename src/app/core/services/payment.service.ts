import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timer, switchMap, takeWhile, timeout, catchError, of, throwError, TimeoutError } from 'rxjs';
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
  'USER_CANCELLED':     'Payment was cancelled by you.',
  'REQUEST_CANCELLED':  'Payment request was cancelled.',
  'TIMEOUT':            'Payment request timed out. Please enter your PIN faster next time.',
  'NETWORK_FAILURE':    'Unable to communicate with M-Pesa. Please try again.',
  'INITIATOR_INVALID':  'Incorrect M-Pesa PIN or security credential. Please verify your payment configuration.',
  'PIN_BLOCKED':        'Your M-Pesa PIN has been blocked due to too many wrong attempts. Please reset it or contact Safaricom.',
  'ACCOUNT_INACTIVE':   'Your M-Pesa account is inactive. Please contact Safaricom support.',
  'NOT_STK_CAPABLE':    'Your phone number does not support M-Pesa STK. Please try with a different number.',
  'SYSTEM_ERROR':       'M-Pesa system error. Please try again in a few minutes.',
  'MPESA_ERROR_1037':   'Insufficient funds in your M-Pesa account.',
  'MPESA_ERROR_1034':   'Incorrect M-Pesa PIN. Please try again.',
  'MPESA_ERROR_1032':   'Payment was cancelled by user.',
  'MPESA_ERROR_1031':   'Payment request timed out. Please try again.',
  'MPESA_ERROR_1030':   'Payment request was cancelled.',
  'MPESA_ERROR_1001':   'Payment request timed out. Please enter your PIN faster next time.',
  'MPESA_ERROR_2001':   'Incorrect M-Pesa PIN or security credential. Please verify your payment configuration.',
  'MPESA_ERROR_2002':   'M-Pesa system error. Please try again in a few minutes.',
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
    * Hard timeout at 65 seconds (STK expires at 60s on Safaricom side).
    */
  pollPaymentStatus(jobId: string): Observable<PaymentStatusResponse> {
    const terminal = new Set<string>(['PAID', 'FAILED', 'REFUNDED', 'NO_PAYMENT', 'PAYOUT_FAILED', 'DISPUTED']);

    return timer(0, 3000).pipe(
      switchMap(() => this.getPaymentStatus(jobId)),
      takeWhile(resp => !terminal.has(resp.status), true),
      timeout(65_000),
      catchError(err => {
        if (err instanceof TimeoutError) {
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

    const normalized = failureReason.trim();
    const normalizedKey = normalized
      .toUpperCase()
      .replace(/[\s\.-]+/g, '_')
      .replace(/[^A-Z0-9_]/g, '');

    const mapped = PAYMENT_FAILURE_MESSAGES[normalized] || PAYMENT_FAILURE_MESSAGES[normalizedKey];
    if (mapped) {
      return mapped;
    }

    const lower = normalized.toLowerCase();
    if (lower.includes('insufficient')) {
      return PAYMENT_FAILURE_MESSAGES['INSUFFICIENT_FUNDS'];
    }
    if (lower.includes('wrong pin') || lower.includes('incorrect pin')) {
      return PAYMENT_FAILURE_MESSAGES['WRONG_PIN'];
    }
    if (lower.includes('cancelled') || lower.includes('canceled')) {
      return PAYMENT_FAILURE_MESSAGES['USER_CANCELLED'];
    }
    if (lower.includes('timeout') || lower.includes('timed out')) {
      return PAYMENT_FAILURE_MESSAGES['TIMEOUT'];
    }
    if (lower.includes('inactive')) {
      return PAYMENT_FAILURE_MESSAGES['ACCOUNT_INACTIVE'];
    }
    if (lower.includes('stm') || lower.includes('stk') && lower.includes('capable')) {
      return PAYMENT_FAILURE_MESSAGES['NOT_STK_CAPABLE'];
    }

    return fallbackMessage || normalized;
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
