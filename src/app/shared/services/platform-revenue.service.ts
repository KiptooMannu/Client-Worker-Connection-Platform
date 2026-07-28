import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RevenueSummary {
  totalRevenueEarned: number;
  availableBalance: number;
  pendingBalance: number;
  totalWithdrawn: number;
  revenueToday: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
  revenueThisYear: number;
  totalCompletedTransactions: number;
  transactionsToday: number;
  transactionsThisWeek: number;
  transactionsThisMonth: number;
  transactionsThisYear: number;
  averagePlatformFeePerTransaction: number;
}

export interface LedgerEntry {
  id: string;
  transactionReference: string;
  bookingId: string;
  escrowId: string;
  totalJobAmount: number;
  platformFeePercent: number;
  platformFeeAmount: number;
  workerPayout: number;
  balanceBefore: number;
  balanceAfter: number;
  transactionType: string;
  description: string;
  timestamp: string;
}

export interface Withdrawal {
  id: string;
  withdrawalReference: string;
  amount: number;
  withdrawalMethod: string;
  status: string;
  requestedBy: string;
  createdAt: string;
  processedAt?: string;
  receiptNumber?: string;
  failureReason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PlatformRevenueService {
  private apiUrl = `${environment.apiUrl}/admin/platform-wallet`;

  constructor(private http: HttpClient) {}

  getRevenueSummary(): Observable<RevenueSummary> {
    return this.http.get<RevenueSummary>(`${this.apiUrl}/summary`);
  }

  getLedgerEntries(page: number = 0, size: number = 20): Observable<LedgerEntry[]> {
    return this.http.get<LedgerEntry[]>(`${this.apiUrl}/ledger`, {
      params: { page: page.toString(), size: size.toString() }
    });
  }

  getWithdrawals(page: number = 0, size: number = 20): Observable<Withdrawal[]> {
    return this.http.get<Withdrawal[]>(`${this.apiUrl}/withdrawals`, {
      params: { page: page.toString(), size: size.toString() }
    });
  }

  initiateWithdrawal(request: WithdrawalRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/withdrawals/initiate`, request);
  }

  processWithdrawal(withdrawalId: string, request: ProcessWithdrawalRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/withdrawals/${withdrawalId}/process`, request);
  }

  failWithdrawal(withdrawalId: string, request: FailWithdrawalRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/withdrawals/${withdrawalId}/fail`, request);
  }

  cancelWithdrawal(withdrawalId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/withdrawals/${withdrawalId}/cancel`, {});
  }

  getPlatformWallet(): Observable<any> {
    return this.http.get(`${this.apiUrl}/wallet`);
  }
}

export interface WithdrawalRequest {
  amount: number;
  method: string;
  phoneNumber?: string;
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
  bankBranch?: string;
  notes?: string;
}

export interface ProcessWithdrawalRequest {
  receiptNumber: string;
  mpesaConversationId?: string;
  mpesaOriginatorConversationId?: string;
  mpesaTransactionId?: string;
}

export interface FailWithdrawalRequest {
  failureReason: string;
}
