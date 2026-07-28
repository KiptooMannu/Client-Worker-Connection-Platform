import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface WalletSummary {
  availableBalance: number;
  pendingCredits: number;
  totalRefunded: number;
  totalWithdrawn: number;
  totalSettlementCredits: number;
  isFrozen: boolean;
  freezeReason?: string;
  refundedToday: number;
  refundedThisWeek: number;
  refundedThisMonth: number;
  withdrawnToday: number;
  withdrawnThisWeek: number;
  withdrawnThisMonth: number;
}

export interface WalletTransaction {
  id: string;
  transactionReference: string;
  bookingId?: string;
  escrowId?: string;
  transactionType: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  status: string;
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

export interface ClientSettlementWallet {
  id: string;
  userId: string;
  availableBalance: number;
  pendingCredits: number;
  totalRefunded: number;
  totalWithdrawn: number;
  totalSettlementCredits: number;
  isFrozen: boolean;
  freezeReason?: string;
  frozenAt?: string;
  unfrozenAt?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class SettlementWalletService {
  private apiUrl = `${environment.apiUrl}/settlement-wallet`;

  constructor(private http: HttpClient) {}

  getWalletSummary(): Observable<WalletSummary> {
    return this.http.get<WalletSummary>(`${this.apiUrl}/summary`);
  }

  getTransactions(page: number = 0, size: number = 20): Observable<WalletTransaction[]> {
    return this.http.get<WalletTransaction[]>(`${this.apiUrl}/transactions`, {
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

  cancelWithdrawal(withdrawalId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/withdrawals/${withdrawalId}/cancel`, {});
  }

  getWallet(): Observable<ClientSettlementWallet> {
    return this.http.get<ClientSettlementWallet>(`${this.apiUrl}/wallet`);
  }

  // Admin endpoints
  getAllWallets(): Observable<ClientSettlementWallet[]> {
    return this.http.get<ClientSettlementWallet[]>(`${this.apiUrl}/admin/wallets`);
  }

  freezeWallet(walletId: string, request: FreezeWalletRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/wallets/${walletId}/freeze`, request);
  }

  unfreezeWallet(walletId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/wallets/${walletId}/unfreeze`, {});
  }

  adminCredit(userId: string, request: AdminAdjustmentRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/wallets/${userId}/credit`, request);
  }

  adminDebit(userId: string, request: AdminAdjustmentRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/wallets/${userId}/debit`, request);
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

export interface FreezeWalletRequest {
  reason: string;
}

export interface AdminAdjustmentRequest {
  amount: number;
  reason: string;
}
