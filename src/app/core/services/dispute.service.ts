import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DisputeService {
  private apiUrl = `${environment.apiUrl}/disputes`;
  
  private disputeUpdated$ = new BehaviorSubject<any>(null);
  public disputeUpdated = this.disputeUpdated$.asObservable();

  constructor(private http: HttpClient) {}

  // ─────────────────────────────────────────────────────────────────────────
  // FILE DISPUTE
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * File a new dispute
   */
  fileDispute(request: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/file`, request);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EVIDENCE MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Add evidence to a dispute
   */
  addEvidence(disputeId: string, evidence: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/${disputeId}/evidence`, evidence);
  }

  /**
   * Request evidence from a party
   */
  requestEvidence(disputeId: string, request: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${disputeId}/request-evidence`, request);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MESSAGING & COMMUNICATION
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Add a message to a dispute
   */
  addMessage(disputeId: string, message: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${disputeId}/messages`, message);
  }

  /**
   * Get all messages for a dispute
   */
  getMessages(disputeId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${disputeId}/messages`);
  }

  /**
   * Mark message as read
   */
  markMessageAsRead(messageId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/messages/${messageId}/read`, {});
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DISPUTE RESOLUTION
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Resolve a dispute
   */
  resolveDispute(disputeId: string, resolution: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${disputeId}/resolve`, resolution);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Assign dispute to an admin
   */
  assignDispute(disputeId: string, adminId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${disputeId}/assign`, { adminId });
  }

  /**
   * Change dispute priority
   */
  changePriority(disputeId: string, priority: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${disputeId}/priority`, { priority });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RETRIEVE DATA
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get dispute details
   */
  getDisputeDetail(disputeId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${disputeId}`);
  }

  /**
   * Get user's disputes
   */
  getUserDisputes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/my`);
  }

  /**
   * Get admin assigned disputes
   */
  getAdminDisputes(adminId: string, page: number = 0, size: number = 20): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/${adminId}`, {
      params: { page: page.toString(), size: size.toString() }
    });
  }

  /**
   * Get unassigned disputes
   */
  getUnassignedDisputes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/unassigned`);
  }

  /**
   * Get audit trail
   */
  getAuditTrail(disputeId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${disputeId}/audit-trail`);
  }

  /**
   * Notify about dispute update
   */
  notifyDisputeUpdated(dispute: any): void {
    this.disputeUpdated$.next(dispute);
  }
}
