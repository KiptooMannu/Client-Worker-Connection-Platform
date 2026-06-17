import { Injectable, signal, computed, effect, inject, PLATFORM_ID, NgZone, ApplicationRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService, User } from './auth.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, throwError, filter, take, timeout, of } from 'rxjs';
import { catchError, finalize, tap, retry } from 'rxjs/operators';
import { NotificationService } from './notification.service';
import { Client } from '@stomp/stompjs';

export interface WorkHistory {
  company: string;
  role: string;
  period: string;
  description: string;
}

export interface Certification {
  name: string;
  issuer: string;
  year: string;
}

export interface WorkerProfile {
  id: string;
  userId?: string;
  name: string;
  initials: string;
  email: string;
  category: string;
  status: 'Pending' | 'Priority' | 'Verified' | 'Rejected' | 'Draft' | 'Suspended' | 'Approved' | 'APPROVED' | 'PENDING' | 'REJECTED' | 'DRAFT';
  image?: string;
  phoneNumber?: string;
  experienceYears?: number;
  rate: number;
  rating: number;
  reviews: number;
  completedJobs?: number;
  skills: string[];
  bio: string;
  rejectionReason?: string;
  uploadedDocuments?: { id?: string; name: string; file?: File; type: string; status: 'uploaded' | 'validating' | 'approved' | 'rejected'; error?: string }[];
  isAvailable: boolean;
  location: string;
  preferredLocations: string[];
  workHistory: WorkHistory[];
  certifications: Certification[];
  availabilityDetails: {
    weekdays: boolean;
    weekends: boolean;
    evenings: boolean;
  };
  highlightedReview?: string;
  reviewsList?: any[];
}

export interface Notification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  type: 'success' | 'info' | 'warning';
}

export interface ChatMessage {
  id: string;
  text: string;
  time: string;
  rawDate?: number;
  sent: boolean;
  isRead: boolean;
  attachment?: {
    name: string;
    url: string;
    size: string;
  };
}


export interface Chat {
  id: string;
  workerId: string;
  name: string;
  image?: string;
  initials: string;
  email?: string; // User's email address
  role?: string; // User's role (Worker, Client, Admin, etc.)
  lastMessage: string;
  time: string;
  rawTime?: number;
  active: boolean;
  online: boolean;
  unread?: number;
  archived?: boolean;
  messages: ChatMessage[];
}

export interface ActivityLog {
  id: string;
  workerId: string;
  workerName: string;
  action: 'approved' | 'rejected' | 'submitted' | 'resubmitted';
  reason?: string;
  timestamp: Date;
  adminName?: string;
}

export interface JobOffer {
  id: string;
  jobId: string;
  senderName?: string;
  amount: number;
  message?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED';
  createdAt?: string;
}

export interface JobProgress {
  id: string;
  jobId: string;
  description: string;
  attachmentUrl?: string;
  createdAt?: string;
}

export interface WalletTransaction {
  id: string;
  txnType: 'CREDIT' | 'DEBIT';
  amount: number;
  balanceAfter: number;
  referenceId?: string | null;
  description?: string;
  createdAt?: string;
}

export interface Booking {
  id: string;
  clientId: string;
  clientName: string;
  clientInitials: string;
  workerId: string;
  workerName: string;
  workerInitials: string;
  service: string;
  date: string;
  rawDate: number;
  earnings: number;
  rating?: number;
  hasReview?: boolean;
  status: 'Pending' | 'Approved' | 'Completed' | 'Processing' | 'Accepted' | 'Rejected' | 'Cancelled' | 'Revision Requested' | 'In Progress' | 'Submitted' | 'Disputed' | 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'REJECTED' | 'SUBMITTED' | 'APPROVED' | 'DISPUTED' | 'REVISION_REQUESTED' | 'Assigned' | 'Negotiating' | 'Partially Settled' | 'Force Completed' | 'Refunded';

  startedAt?: string;
  submittedAt?: string;
  approvedAt?: string;
  disputedAt?: string;
  resolvedAt?: string;
  deadline?: string;
  negotiatedPrice?: number;
  escrowFunded?: boolean;
  // Dispute details
  disputeReason?: string;
  disputeEvidence?: string;
  disputeAttachmentUrl?: string;
  // Dispute response
  disputeResponse?: string;
  disputeResponseEvidence?: string;
  disputeResponseAttachmentUrl?: string;
  // Admin decision
  adminDecisionReason?: string;
  adminEvidenceNotes?: string;
  workerPartialAmount?: number;
  clientPartialAmount?: number;
  paymentStatus?: string;
  paymentAmount?: number;
  platformFee?: number;
  workerNetAmount?: number;
  escrowMessage?: string;
  mpesaReceiptNumber?: string;
}

export interface ClientProfile {
  id: string;
  userId?: string;
  name: string;
  email: string;
  phoneNumber?: string;
  status: 'Active' | 'Suspended';
  tier: string;
  progress: number;
}

@Injectable({
  providedIn: 'root'
})
export class PlatformStateService {
  private initialWorkers: WorkerProfile[] = [];

  workers = signal<WorkerProfile[]>(this.initialWorkers);
  clients = signal<ClientProfile[]>([]);
  notifications = signal<Notification[]>([]);
  activityLogs = signal<ActivityLog[]>([]);
  bookings = signal<Booking[]>([]);
  allBookings = signal<Booking[]>([]);

  fetchAllJobs() {
    this.http.get<any[]>(`${this.apiUrl}/jobs/all`).subscribe({
      next: (data) => {
        const mapped = data.map(this.mapBooking.bind(this));
        this.allBookings.set(mapped);
      },
      error: (err: HttpErrorResponse) => console.error('Error fetching all jobs', err)
    });
  }

  chats = signal<Chat[]>([]);
  allUsers = signal<any[]>([]); // Global user directory for messaging cache
  availableSkills = signal<string[]>([]);
  availableLocations = signal<string[]>([]);
  isLoadingWorkers = signal(false);
  updatingJobIds = signal<Set<string>>(new Set());
  walletBalance = signal(0);
  walletTransactions = signal<WalletTransaction[]>([]);
  walletLoading = signal(false);

  updateJobStatus(jobId: string, status: string) {
    this.updateJobStatusRequest(jobId, status).subscribe({
      next: () => this.notification.success(`Job status updated to ${status}`)
    });
  }

  updateJobStatusRequest(jobId: string, status: string): Observable<any> {
    const user = this.auth.currentUser();
    if (!user) return throwError(() => new Error('You must be logged in to update a job.'));

    this.updatingJobIds.update(set => {
      const next = new Set(set);
      next.add(jobId);
      return next;
    });

    return this.http.put(`${this.apiUrl}/jobs/${jobId}/status?status=${status}`, {}).pipe(
      tap(() => {
        if (user.role === 'Worker') {
          this.fetchWorkerJobs(this.currentWorker().userId || user.id);
          this.fetchWalletSummary();
        } else if (user.role === 'Client') {
          this.fetchClientJobs(user.id);
        } else if (user.role === 'Admin') {
          this.fetchAllJobs();
        }
      }),
      catchError((err: HttpErrorResponse) => {
        console.error('Error updating job status', err);
        const body = err.error;
        const message = typeof body === 'string'
          ? body
          : body?.message || body?.error || 'Failed to update job status';
        this.notification.error(message);
        return throwError(() => err);
      }),
      finalize(() => {
        this.updatingJobIds.update(set => {
          const next = new Set(set);
          next.delete(jobId);
          return next;
        });
      })
    );
  }

  fetchWalletSummary() {
    const user = this.auth.currentUser();
    if (!user) return;

    this.walletLoading.set(true);
    this.http.get<{ balance: number }>(`${this.apiUrl}/wallet/balance`).subscribe({
      next: (response) => this.walletBalance.set(Number(response.balance || 0)),
      error: (err: HttpErrorResponse) => console.error('Error fetching wallet balance', err)
    });

    this.http.get<WalletTransaction[]>(`${this.apiUrl}/wallet/transactions`).subscribe({
      next: (transactions) => {
        this.walletTransactions.set(transactions || []);
        this.walletLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error fetching wallet transactions', err);
        this.walletLoading.set(false);
      }
    });
  }

  withdrawWallet(amount: number, destinationPhoneNumber: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/wallet/withdraw`, { amount, destinationPhoneNumber }).pipe(
      tap(() => this.fetchWalletSummary())
    );
  }

  private mapBooking(b: any): Booking {
    let status = b.status || 'PENDING';

    const displayStatus = status.split('_')
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    const createdAtMs = b.createdAt ? new Date(b.createdAt).getTime() : 0;

    return {
      id: b.id,
      clientId: b.clientId,
      workerId: b.workerId,
      workerName: b.workerName,
      workerInitials: (b.workerName || 'U').split(' ').filter((n: string) => n).map((n: any) => n[0]).join('').toUpperCase(),
      clientName: b.clientName,
      clientInitials: (b.clientName || 'U').split(' ').filter((n: string) => n).map((n: any) => n[0]).join('').toUpperCase(),
      service: b.service || b.description || 'General Service',
      date: b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A',
      rawDate: createdAtMs,
      status: displayStatus as any,
      earnings: b.totalCost || 0,
      rating: b.rating,
      hasReview: b.rating !== undefined && b.rating !== null,
      // lifecycle
      startedAt: b.startedAt, submittedAt: b.submittedAt, approvedAt: b.approvedAt,
      disputedAt: b.disputedAt, resolvedAt: b.resolvedAt, deadline: b.deadline,
      // dispute
      disputeReason: b.disputeReason, disputeEvidence: b.disputeEvidence, disputeAttachmentUrl: b.disputeAttachmentUrl,
      disputeResponse: b.disputeResponse, disputeResponseEvidence: b.disputeResponseEvidence,
      disputeResponseAttachmentUrl: b.disputeResponseAttachmentUrl,
      // admin
      adminDecisionReason: b.adminDecisionReason, adminEvidenceNotes: b.adminEvidenceNotes,
      workerPartialAmount: b.workerPartialAmount, clientPartialAmount: b.clientPartialAmount
    };
  }

  isMessagingActive = signal(false);

  currentMessagePage = signal(0);
  private appRef = inject(ApplicationRef);
  private initializedUserId: string | null = null;

  currentWorker = signal<WorkerProfile>(this.getInitialWorkerState());
  currentClient = signal<ClientProfile | null>(this.getInitialClientState());

  private auth = inject(AuthService);
  private http = inject(HttpClient);
  private notification = inject(NotificationService);
  private platformId = inject(PLATFORM_ID);
  private apiUrl = environment.apiUrl;

  private getInitialWorkerState(): WorkerProfile {
    const defaultState: WorkerProfile = {
      id: '',
      userId: '',
      name: '',
      initials: '',
      email: '',
      category: '',
      status: 'Draft',
      rate: 0,
      rating: 0,
      reviews: 0,
      isAvailable: false,
      skills: [],
      bio: '',
      location: '',
      preferredLocations: [],
      workHistory: [],
      certifications: [],
      availabilityDetails: { weekdays: true, weekends: false, evenings: false }
    };

    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      const saved = sessionStorage.getItem('kazi_konnect_state');
      if (saved) {
        try {
          const data = JSON.parse(saved);
          if (data.currentWorker) return data.currentWorker;
        } catch (e) { }
      }
    }
    return defaultState;
  }

  private getInitialClientState(): ClientProfile | null {
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      const saved = sessionStorage.getItem('kazi_konnect_state');
      if (saved) {
        try {
          const data = JSON.parse(saved);
          if (data.currentClient) return data.currentClient;
        } catch (e) { }
      }
    }
    return null;
  }

  // Typing indicators
  typingUsers = signal<Record<string, boolean>>({});

  clearState() {
    this.notifications.set([]);
    this.chats.set([]);
    this.activityLogs.set([]);
    this.bookings.set([]);
    this.currentClient.set(null);
    this.currentWorker.set({
      id: '',
      userId: '',
      name: '',
      initials: '',
      email: '',
      category: '',
      status: 'Draft',
      rate: 0,
      rating: 0,
      reviews: 0,
      isAvailable: false,
      skills: [],
      bio: '',
      location: '',
      preferredLocations: [],
      workHistory: [],
      certifications: [],
      availabilityDetails: { weekdays: true, weekends: false, evenings: false }
    });
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem('kazi_konnect_state');
      localStorage.removeItem('kazi_konnect_state'); // Also clear old localStorage if it exists
    }
  }

  constructor() {
    // State is now partially loaded in signal initializers to prevent flicker
    if (isPlatformBrowser(this.platformId)) {
      this.loadState();
    }

    effect(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      this.saveState();
    });

    // FIX NG0506: Defer data loading until after hydration is complete
    // Instead of waiting for appRef.isStable (which creates a circular dependency),
    // use a simple deferred load that doesn't block stability detection
    effect(() => {
      if (!isPlatformBrowser(this.platformId)) return;

      const user = this.auth.currentUser();
      if (user && user.role) {
        if (this.initializedUserId === user.id) {
          return;
        }
        this.initializedUserId = user.id;

        // Defer initialization to allow hydration to complete first
        // Using multiple setTimeout(0) calls ensures this runs after current event loop
        setTimeout(() => {
          const u = this.auth.currentUser();
          if (u && u.id && u.role) {
            // Start background data fetching without blocking stability
            this.initializeUserData(u.id, u.role);
          }
        }, 500);
      } else {
        this.initializedUserId = null;
        this.clearState();
      }
    });
  }

  private initializeUserData(userId: string, role: string) {
    // Load role-specific data without blocking hydration
    if (role === 'Worker') {
      this.fetchWorkerProfile(userId);
    } else if (role === 'Admin') {
      this.fetchAdminWorkers();
      setTimeout(() => this.fetchPendingWorkers(), 500);
      setTimeout(() => this.fetchAdminUsers(), 1000);
      setTimeout(() => this.fetchAdminClients(), 1500);
      setTimeout(() => this.fetchAdminActivityLogs(), 2000);
      setTimeout(() => this.fetchAllJobs(), 2500);
    } else if (role === 'Client') {
      this.fetchClientProfile(userId);
      setTimeout(() => this.fetchClientJobs(userId), 200);
      setTimeout(() => this.fetchMarketplaceWorkers(), 400);
      setTimeout(() => this.fetchMarketplaceMetadata(), 600);
    }
    // Load common data for all roles
    setTimeout(() => this.fetchNotifications(userId), 800);
    setTimeout(() => this.fetchChats(userId), 1000);
  }

  public fetchWorkerProfile(userId: string) {
    this.http.get<any>(`${this.apiUrl}/workers/profile/${userId}`).subscribe({
      next: (data) => {
        const mapped = this.mapWorkerProfile(data);
        this.currentWorker.set(mapped);
        if (mapped.phoneNumber) {
          this.auth.updateUser({ phoneNumber: mapped.phoneNumber });
        }
        if (mapped.userId) {
          this.fetchWorkerJobs(mapped.userId);
        }
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error fetching worker profile', err);
        if (err.status === 404) {
          this.notification.error('Session invalid: Profile not found. Logging out...');
          this.auth.logout();
        }
      }
    });
  }



  updateWorkerProfile(userId: string, updates: any): Observable<any> {
    const backendPayload = this.mapToBackendUpdate(updates);
    return this.http.put<any>(`${this.apiUrl}/workers/profile/${userId}`, backendPayload).pipe(
      tap(res => {
        const profileData = res.workerProfile || res;
        if (profileData) {
          const mapped = this.mapWorkerProfile(profileData);
          this.currentWorker.set(mapped);
          if (mapped.phoneNumber) {
            this.auth.updateUser({ phoneNumber: mapped.phoneNumber });
          }
        }
      }),
      catchError((err: HttpErrorResponse) => {
        return throwError(() => err);
      })
    );
  }

  uploadDocument(userId: string, type: string, name: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('type', type);
    formData.append('name', name);
    formData.append('file', file);

    return this.http.post(`${this.apiUrl}/documents`, formData);
  }

  uploadProfilePicture(userId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/workers/profile/${userId}/profile-picture`, formData);
  }

  uploadMedia(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/media/upload`, formData);
  }

  updateClientProfile(userId: string, updates: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/clients/profile/user/${userId}`, updates).pipe(
      tap(res => {
        const profileData = res.clientProfile || res;
        if (profileData) {
          const mapped = this.mapClientProfile(profileData);
          this.currentClient.set(mapped);
          if (mapped.phoneNumber) {
            this.auth.updateUser({ phoneNumber: mapped.phoneNumber });
          }
        }
      }),
      catchError((err: HttpErrorResponse) => {
        return throwError(() => err);
      })
    );
  }

  submitProfile(userId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/workers/profile/${userId}/submit`, {}).pipe(
      tap(() => this.notification.success('Profile submitted for review!'))
    );
  }

  deleteProfilePicture(userId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/workers/profile/${userId}/profile-picture`);
  }

  deleteDocument(documentId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/documents/${documentId}`, { responseType: 'text' });
  }

  private fetchClientProfile(userId: string) {
    this.http.get<any>(`${this.apiUrl}/clients/profile/${userId}`).subscribe({
      next: (data) => {
        const mapped = this.mapClientProfile(data);
        this.currentClient.set(mapped);
        if (mapped.phoneNumber) {
          this.auth.updateUser({ phoneNumber: mapped.phoneNumber });
        }
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error fetching client profile', err);
        if (err.status === 404) {
          this.notification.error('Session invalid: Profile not found. Logging out...');
          this.auth.logout();
        }
      }
    });
  }

  fetchAdminUsers() {
    const user = this.auth.currentUser();
    if (!user) {
      console.warn('[PlatformState] fetchAdminUsers: No authenticated user');
      return;
    }

    console.log('[PlatformState] Fetching admin users...');
    this.http.get<any>(`${this.apiUrl}/admin/users`).subscribe({
      next: (res) => {
        const data: any[] = res.content || res || [];
        console.log('[PlatformState] Received admin users:', data.length);
        const currentClients = this.clients();
        const mappedClients = data
          .filter((u: any) => u.role === 'CLIENT')
          .map((u: any) => {
            const existing = currentClients.find(c => c.email === u.email);
            return {
              id: u.id,
              userId: u.id,
              name: u.fullName || u.username,
              email: u.email,
              status: u.active === false ? 'Suspended' : (existing?.status || 'Active'),
              tier: existing?.tier || 'Standard',
              progress: existing?.progress || 100
            } as ClientProfile;
          });
        this.clients.set(mappedClients);
        // Sync global directory for messaging cache
        this.allUsers.set(data.map(u => ({
          id: u.id,
          username: u.fullName || u.username || 'Unknown User',
          email: u.email || '',
          role: u.role ? u.role.charAt(0) + u.role.slice(1).toLowerCase() : 'User',
          unread: 0
        })));
      },
      error: (err: HttpErrorResponse) => {
        console.error('[PlatformState] Error fetching admin users', {
          status: err.status,
          message: err.message,
          error: err.error
        });
        if (err.status === 401) {
          this.auth.logout();
        }
      }
    });
  }

  fetchAdminClients() {
    const user = this.auth.currentUser();
    if (!user) {
      console.warn('[PlatformState] fetchAdminClients: No authenticated user');
      return;
    }

    console.log('[PlatformState] Fetching admin clients...');
    this.http.get<any>(`${this.apiUrl}/admin/clients`).subscribe({
      next: (res) => {
        const data: any[] = res.content || res || [];
        console.log('[PlatformState] Received admin clients:', data.length);
        const mapped = data.map((c: any) => ({
          id: c.id,
          name: c.fullName,
          email: c.email,
          status: 'Active',
          tier: 'Standard',
          progress: 100
        } as ClientProfile));
        this.clients.set(mapped);
      },
      error: (err: HttpErrorResponse) => {
        console.error('[PlatformState] Error fetching clients', {
          status: err.status,
          message: err.message,
          error: err.error
        });
        if (err.status === 401) {
          this.auth.logout();
        }
      }
    });
  }

  fetchAdminActivityLogs() {
    this.http.get<any>(`${this.apiUrl}/admin/logs`).subscribe({
      next: (res) => {
        const data: any[] = res.content || res || [];
        const logs = data.map((l: any) => ({
          id: l.id,
          workerId: l.targetId,
          workerName: l.targetId,
          action: l.action === 'APPROVE_WORKER' ? 'approved' : 'rejected',
          timestamp: new Date(l.createdAt),
          adminName: l.adminId
        })) as ActivityLog[];
        this.activityLogs.set(logs);
      },
      error: (err: HttpErrorResponse) => console.error('Error fetching admin logs', err)
    });
  }

  suspendUser(userId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/users/${userId}/suspend`, {});
  }

  activateUser(userId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/users/${userId}/activate`, {});
  }

  updateUserName(userId: string, fullName: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/users/${userId}/name?fullName=${encodeURIComponent(fullName)}`, {});
  }



  fetchNotifications(userId: string) {
    console.log('[PlatformState] Fetching notifications for userId:', userId);

    this.http.get<any>(`${this.apiUrl}/notifications/user/${userId}`).pipe(timeout(30000)).subscribe({
      next: (res) => {
        const data = res.content || res || [];
        console.log('[PlatformState] Received notifications:', data.length);
        const mapped = data.map((n: any) => ({
          id: n.id,
          userId: n.userId,
          title: n.title,
          message: n.message,
          time: this.formatNotificationTime(n.createdAt),
          isRead: n.isRead,
          type: (n.type || 'info').toLowerCase() as any
        }));
        this.notifications.set(mapped);
      },
      error: (err: HttpErrorResponse) => {
        console.error('[PlatformState] Error fetching notifications', {
          status: err.status,
          message: err.message,
          error: err.error
        });
        if (err.status === 401) {
          this.auth.logout();
        }
      }
    });
  }

  markNotificationAsRead(notificationId: string) {
    this.http.put(`${this.apiUrl}/notifications/${notificationId}/read`, {}, { responseType: 'text' }).subscribe({
      next: () => {
        this.notifications.update(prev => prev.map(n =>
          n.id === notificationId ? { ...n, isRead: true } : n
        ));
      },
      error: (err: HttpErrorResponse) => console.error('Error marking notification as read', err)
    });
  }

  markAllNotificationsAsRead() {
    const user = this.auth.currentUser();
    if (!user) return;

    this.http.put(`${this.apiUrl}/notifications/user/${user.id}/read-all`, {}, { responseType: 'text' }).subscribe({
      next: () => {
        this.notifications.update(prev => prev.map(n => ({ ...n, isRead: true })));
      },
      error: (err: HttpErrorResponse) => console.error('Error marking all notifications as read', err)
    });
  }

  private formatNotificationTime(createdAt: string): string {
    const date = new Date(createdAt);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  public mapClientProfile(data: any): ClientProfile {
    return {
      id: data.id,
      userId: data.userId,
      name: data.fullName,
      email: data.email,
      phoneNumber: data.phoneNumber || data.phone || data.mobileNumber || '',
      status: 'Active',
      tier: 'Standard',
      progress: 0
    };
  }

  public mapWorkerProfile(data: any): WorkerProfile {
    const fullName = data.fullName || '';
    return {
      id: data.id,
      userId: data.userId,
      name: fullName,
      initials: fullName ? fullName.split(' ').filter((n: string) => n).map((n: string) => n[0]).join('').toUpperCase() : '??',
      email: data.email,
      phoneNumber: data.phoneNumber || '',
      category: data.category || 'General Laborer',
      status: this.mapStatus(data.status),
      image: data.profilePictureUrl,
      rate: data.hourlyRate || 0,
      rating: Number(data.averageRating || 0),
      reviews: Number(data.reviewCount || 0),
      skills: Array.from(data.skills || []),
      bio: data.bio || '',
      rejectionReason: data.rejectionReason,
      isAvailable: data.isOnline,
      location: data.location || '',
      preferredLocations: Array.from(data.preferredLocations || []),
      experienceYears: data.experienceYears || 0,
      workHistory: (data.workHistory || []).map((wh: any) => ({
        id: wh.id,
        company: wh.company,
        role: wh.role,
        period: wh.period,
        description: wh.description
      })),
      certifications: (data.certifications || []).map((cert: any) => ({
        id: cert.id,
        name: cert.name,
        issuer: cert.issuer,
        year: cert.year
      })),
      uploadedDocuments: (data.documents || []).map((doc: any) => ({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        status: doc.verifiedAt ? 'approved' : 'uploaded',
        url: doc.documentUrl
      })),
      availabilityDetails: data.availabilityDetails || { weekdays: true, weekends: false, evenings: false }
    };
  }

  private mapStatus(backendStatus: string): any {
    switch (backendStatus) {
      case 'PENDING': return 'Pending';
      case 'APPROVED': return 'Verified';
      case 'REJECTED': return 'Rejected';
      default: return 'Draft';
    }
  }

  private saveState() {
    if (!isPlatformBrowser(this.platformId)) return;
    const data = {
      workers: this.workers(),
      notifications: this.notifications(),
      activityLogs: this.activityLogs(),
      bookings: this.bookings(),
      currentWorker: this.currentWorker(),
      currentClient: this.currentClient(),
      chats: this.chats(),
      allUsers: this.allUsers(),
      allBookings: this.allBookings(),
      clients: this.clients()
    };
    sessionStorage.setItem('kazi_konnect_state', JSON.stringify(data));
  }

  private loadState() {
    if (!isPlatformBrowser(this.platformId)) return;
    const saved = sessionStorage.getItem('kazi_konnect_state') || sessionStorage.getItem('nestfind_state') || localStorage.getItem('kazi_konnect_state');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.currentWorker && (data.currentWorker.id || data.currentWorker.userId)) {
          console.log('Restoring worker profile from cache:', data.currentWorker.name);
          this.currentWorker.set(data.currentWorker);
        }
        this.workers.set(data.workers || []);
        this.notifications.set(data.notifications || []);
        this.activityLogs.set(data.activityLogs || []);
        this.bookings.set(data.bookings || []);
        this.currentClient.set(data.currentClient || null);
        const validChats = (data.chats || []).filter((c: any) =>
          c.id && c.id.length > 10 && c.id.includes('-') // Basic UUID check
        );
        this.chats.set(validChats);
        this.allUsers.set(data.allUsers || []);
        this.allBookings.set(data.allBookings || []);
        this.clients.set(data.clients || []);
        console.log('[PlatformState] State restored from sessionStorage');
      } catch (e) {
        console.error('Error parsing cached state', e);
      }
    }
  }

  verifiedWorkers = computed(() => this.workers().filter(w => w.status === 'Verified'));
  pendingWorkers = computed(() => this.workers().filter(w => w.status === 'Pending' || w.status === 'Priority'));
  workerNotifications = computed(() => {
    return this.notifications();
  });
  unreadNotificationsCount = computed(() => this.workerNotifications().filter(n => !n.isRead).length);

  unreadMessagesCount = computed(() => {
    return this.chats().reduce((acc, chat) => acc + (chat.unread || 0), 0);
  });
  workerBookings = computed(() => this.bookings().filter(b => b.workerId === this.currentWorker().id));

  currentWorkerCompletion = computed(() => {
    const w = this.currentWorker();
    let score = 0;

    if (w.name) score += 5;
    if (w.email) score += 5;
    if (w.phoneNumber) score += 10;
    if (w.category) score += 10;
    if (w.location) score += 10;
    if (w.bio) score += 10;
    if (w.skills && w.skills.length > 0) score += 10;
    if (w.workHistory && w.workHistory.length > 0) score += 10;
    if (w.certifications && w.certifications.length > 0) score += 10;

    const docs = w.uploadedDocuments || [];
    const hasIDFront = docs.some(d => d.type === 'ID-Front');
    const hasIDBack = docs.some(d => d.type === 'ID-Back');
    const hasCertificationDocs = docs.some(d => d.type === 'Certification');

    if (hasIDFront) score += 10;
    if (hasIDBack) score += 10;
    if (hasCertificationDocs) score += 20;

    return Math.min(score, 100);
  });

  fetchAdminWorkers() {
    this.http.get<any>(`${this.apiUrl}/admin/workers`).subscribe({
      next: (res) => {
        const data: any[] = res.content || res || [];
        const mapped = data.map((w: any) => this.mapWorkerProfile(w));
        this.workers.set(mapped);
      },
      error: (err: HttpErrorResponse) => console.error('Error fetching admin workers', err)
    });
  }

  fetchMarketplaceWorkers(
    skill?: string,
    location?: string,
    minExp?: number,
    page: number = 0,
    size: number = 50
  ) {
    const params = new URLSearchParams();
    if (skill) params.append('skill', skill);
    if (location) params.append('location', location);
    if (minExp !== undefined && minExp !== null) params.append('minExp', String(minExp));
    params.append('page', String(page));
    params.append('size', String(size));
    const url = `${this.apiUrl}/marketplace/search?${params.toString()}`;

    // REMOVE THE .pipe(timeout()) COMPLETELY
    this.http.get<any>(url).subscribe({
      next: (res) => {
        const data: any[] = res.content || res || [];
        const mapped = data.map((w) => this.mapWorkerProfile(w));
        this.workers.set(mapped);
      },
      error: (err: HttpErrorResponse) => {
        console.error('[PlatformState] Error fetching marketplace workers', err);
        if (err.status === 401) {
          this.auth.logout();
        }
        this.workers.set([]); // Set empty array on error
      }
    });
  }

  fetchPendingWorkers() {
    const user = this.auth.currentUser();
    if (!user) {
      console.warn('[PlatformState] fetchPendingWorkers: No authenticated user');
      return;
    }

    this.isLoadingWorkers.set(true);
    console.log('[PlatformState] Fetching pending workers...');

    this.http.get<any[]>(`${this.apiUrl}/admin/workers/pending`).subscribe({
      next: (data) => {
        console.log('[PlatformState] Received pending workers:', data?.length);
        const mapped = data.map(w => this.mapWorkerProfile(w));
        this.workers.update(prev => {
          const others = prev.filter(p => p.status !== 'Pending' && p.status !== 'Priority' && p.status !== 'PENDING');
          return [...others, ...mapped];
        });
        this.isLoadingWorkers.set(false);
      },
      error: (err: HttpErrorResponse) => {
        console.error('[PlatformState] Error fetching pending workers', {
          status: err.status,
          message: err.message,
          error: err.error
        });
        this.isLoadingWorkers.set(false);
        if (err.status === 401) {
          this.auth.logout();
        }
      }
    });
  }

  approveWorker(id: string): Observable<any> {
    const admin = this.auth.currentUser();
    if (!admin || admin.role !== 'Admin') return throwError(() => new Error('Unauthorized'));

    return this.http.put<any>(`${this.apiUrl}/admin/workers/${id}/approve?adminId=${admin.id}`, {}).pipe(
      tap((res) => {
        this.workers.update(prev => prev.map(w => w.id === id ? { ...w, status: 'Verified' } : w));
        this.fetchAdminActivityLogs();
        this.fetchPendingWorkers();
        this.notification.success(res.message || 'Worker approved successfully.');
      }),
      catchError((err: HttpErrorResponse) => {
        const errorMsg = err.error?.message || err.error || 'Failed to approve worker.';
        this.notification.error(errorMsg);
        console.error('Error approving worker', err);
        return throwError(() => err);
      })
    );
  }

  rejectWorker(id: string, reason: string = ''): Observable<any> {
    const admin = this.auth.currentUser();
    if (!admin || admin.role !== 'Admin') return throwError(() => new Error('Unauthorized'));

    return this.http.put<any>(`${this.apiUrl}/admin/workers/${id}/reject?adminId=${admin.id}&reason=${encodeURIComponent(reason)}`, {}).pipe(
      tap((res) => {
        this.workers.update(prev => prev.map(w => w.id === id ? { ...w, status: 'Rejected', rejectionReason: reason } : w));
        this.fetchAdminActivityLogs();
        this.fetchPendingWorkers();
        this.notification.info(res.message || 'Worker rejected.');
      }),
      catchError((err: HttpErrorResponse) => {
        const errorMsg = err.error?.message || err.error || 'Failed to reject worker.';
        this.notification.error(errorMsg);
        console.error('Error rejecting worker', err);
        return throwError(() => err);
      })
    );
  }

  resubmitWorker(userId: string) {
    this.http.put(`${this.apiUrl}/workers/profile/${userId}/submit`, {}).subscribe({
      next: (data: any) => {
        const mapped = this.mapWorkerProfile(data);
        if (userId === this.currentWorker().userId) {
          this.currentWorker.set(mapped);
        }
        this.workers.update(prev => prev.map(w => w.userId === userId ? mapped : w));
        this.notification.success('Profile resubmitted for verification.');
      },
      error: (err: HttpErrorResponse) => {
        this.notification.error('Failed to resubmit profile.');
        console.error('Error resubmitting worker', err);
      }
    });
  }

  submitForVerification() {
    const userId = this.currentWorker().userId || this.auth.currentUser()?.id;
    if (!userId) return;

    this.http.put(`${this.apiUrl}/workers/profile/${userId}/submit`, {}).subscribe({
      next: (data: any) => {
        const mapped = this.mapWorkerProfile(data);
        this.currentWorker.set(mapped);
        this.workers.update(prev => {
          const exists = prev.find(w => w.userId === userId);
          if (exists) {
            return prev.map(w => w.userId === userId ? mapped : w);
          }
          return [mapped, ...prev];
        });
        this.notification.success('Profile submitted for verification!');
        this.fetchPendingWorkers();
      },
      error: (err: HttpErrorResponse) => {
        this.notification.error('Failed to submit profile for verification.');
        console.error('Error submitting worker for verification', err);
      }
    });
  }

  hireWorker(workerId: string, description?: string, jobPrice?: number): Observable<any> {
    const worker = this.workers().find(w => w.id === workerId);
    const user = this.auth.currentUser();
    if (!worker || !user || user.role !== 'Client') {
      return throwError(() => new Error('Unauthorized or worker not found'));
    }

    const alreadyRequested = this.bookings().some(b =>
      b.workerId === worker.id && 
      (b.status.toLowerCase() === 'pending' || b.status.toLowerCase() === 'accepted')
    );

    if (alreadyRequested) {
      this.notification.info(`You already have an active request with ${worker.name}.`);
      return throwError(() => new Error('Duplicate request'));
    }

    const payload: any = {
      description: description || `Hire request for ${worker.category} service`,
      requiredExperience: worker.experienceYears ?? undefined
    };
    
    // Include jobPrice if provided, otherwise backend uses worker's hourly rate
    if (jobPrice && jobPrice > 0) {
      payload.jobPrice = jobPrice;
    }
    
    return this.http.post<any>(`${this.apiUrl}/jobs/request?clientId=${user.id}&workerUserId=${worker.userId}`, payload).pipe(
      tap(() => {
        this.fetchClientJobs(user.id);
        this.notification.success(`Hire request sent to ${worker.name}.`);
      }),
      catchError((err: HttpErrorResponse) => {
        const errorMsg = err.error?.message || err.error || 'Failed to create hire request.';
        this.notification.error(errorMsg);
        console.error('Error creating hire request', err);
        return throwError(() => err);
      })
    );
  }

  acceptBooking(bookingId: string) {
    this.http.put<any>(`${this.apiUrl}/jobs/${bookingId}/status?status=ACCEPTED`, {}).subscribe({
      next: () => {
        const user = this.auth.currentUser();
        if (user?.role === 'Worker' && this.currentWorker().userId) {
          this.fetchWorkerJobs(this.currentWorker().userId!);
        }
        if (user?.role === 'Client') this.fetchClientJobs(user.id);
      },
      error: (err: HttpErrorResponse) => console.error('Error accepting booking', err)
    });
  }

  declineBooking(bookingId: string) {
    this.http.put<any>(`${this.apiUrl}/jobs/${bookingId}/status?status=REJECTED`, {}).subscribe({
      next: () => {
        const user = this.auth.currentUser();
        if (user?.role === 'Worker' && this.currentWorker().userId) {
          this.fetchWorkerJobs(this.currentWorker().userId!);
        }
        if (user?.role === 'Client') this.fetchClientJobs(user.id);
      },
      error: (err: HttpErrorResponse) => console.error('Error declining booking', err)
    });
  }

  deleteJobRequest(jobId: string) {
    this.http.delete<any>(`${this.apiUrl}/jobs/${jobId}`).subscribe({
      next: () => {
        const user = this.auth.currentUser();
        if (user?.role === 'Worker' && this.currentWorker().userId) {
          this.fetchWorkerJobs(this.currentWorker().userId!);
        }
        if (user?.role === 'Client') this.fetchClientJobs(user.id);
        this.notification.success('Job request removed.');
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error deleting job', err);
        this.notification.error('Failed to remove job request.');
      }
    });
  }

  toggleAvailability(workerId: string) {
    this.workers.update(prev => prev.map(w =>
      w.id === workerId ? { ...w, isAvailable: !w.isAvailable } : w
    ));
  }

  sendMessageToUser(receiverId: string, text: string, attachmentUrl?: string): Observable<any> {
    const user = this.auth.currentUser();
    if (!user) return throwError(() => new Error('Not authenticated'));

    // ── OPTIMISTIC UPDATE ──────────────────────────────────────────
    const tempId = 'temp-' + Date.now();
    const sentAt = new Date().toISOString();
    const time = new Date(sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const rawTime = new Date(sentAt).getTime();

    const optimisticMsg: ChatMessage = {
      id: tempId,
      text: text,
      time,
      sent: true,
      isRead: false,
      attachment: attachmentUrl ? { name: 'File', url: attachmentUrl, size: '...' } : undefined
    };

    this.chats.update(chats => {
      const chat = chats.find(c => c.id === receiverId);
      if (chat) {
        return chats.map(c =>
          c.id === receiverId
            ? { ...c, lastMessage: text || 'File', time, rawTime, messages: [...c.messages, optimisticMsg] }
            : c
        );
      } else {
        // Try to get user details from allUsers to populate email and role
        const allUsersSnapshot = this.allUsers();
        const userDetails = allUsersSnapshot.find(u => u.id === receiverId);

        const newChat: Chat = {
          id: receiverId,
          workerId: receiverId,
          name: '...', // Will be updated by server
          email: userDetails?.email || '',
          role: userDetails?.role || '',
          initials: '??',
          lastMessage: text || 'File',
          time: 'Just now',
          rawTime,
          active: true,
          online: true,
          messages: [optimisticMsg]
        };
        return [newChat, ...chats];
      }
    });

    const payload = {
      senderId: user.id,
      receiverId: receiverId,
      content: text,
      attachmentUrl: attachmentUrl
    };

    return this.http.post<any>(`${this.apiUrl}/messages`, payload).pipe(
      tap(data => {
        this.chats.update(chats => {
          return chats.map(c => {
            if (c.id === receiverId) {
              const updatedMessages = c.messages.map(m =>
                m.id === tempId ? { ...m, id: data.id, text: data.content, attachment: data.attachmentUrl ? { name: 'File', url: data.attachmentUrl, size: '...' } : undefined } : m
              );
              return {
                ...c,
                messages: updatedMessages,
                name: c.name === '...' ? (data.receiverName || c.name) : c.name,
                email: !c.email && data.receiverEmail ? data.receiverEmail : c.email,
                role: !c.role && data.receiverRole ? data.receiverRole : c.role
              };
            }
            return c;
          });
        });
      }),
      timeout(30000),
      catchError((err: any) => {

        this.chats.update(chats =>
          chats.map(c =>
            c.id === receiverId ? { ...c, messages: c.messages.filter(m => m.id !== tempId) } : c
          )
        );
        if (err.name === 'TimeoutError') {
          console.error('[PlatformState] sendMessageToUser timed out');
        }
        return throwError(() => err);
      })
    );
  }

  setRemoteTyping(senderId: string, typing: boolean) {
    this.typingUsers.update(users => ({ ...users, [senderId]: typing }));
  }

  sendTypingStatus(receiverId: string, typing: boolean): void {
    this.http.post(`${this.apiUrl}/messages/typing?receiverId=${receiverId}&typing=${typing}`, {}).subscribe({
      error: (err) => console.error('Failed to send typing status', err)
    });
  }

  uploadMessageAttachment(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<any>(`${this.apiUrl}/media/upload`, formData);
  }

  fetchChats(userId: string) {
    console.log('[PlatformState] Fetching chats for userId:', userId);

    this.http.get<any>(`${this.apiUrl}/messages/user/${userId}/recent`).pipe(timeout(30000)).subscribe({
      next: (res) => {
        const data = res.content || res || [];
        console.log(`[PlatformState] Received ${data.length} chats for user ${userId}`);
        const currentUserId = userId.toString();

        const incomingChats = data.map((m: any) => {
          const isSender = m.senderId?.toString() === currentUserId;
          const otherId = isSender ? m.receiverId : m.senderId;
          const otherName = isSender ? m.receiverName : m.senderName || 'Unknown';
          const otherEmail = isSender ? m.receiverEmail : m.senderEmail || '';
          const otherRole = isSender ? m.receiverRole : m.senderRole || '';
          const isUnread = !m.isRead && m.receiverId?.toString() === currentUserId;

          // FIX BUG 2: store rawTime for correct chronological sorting
          const rawTime = m.sentAt ? new Date(m.sentAt).getTime() : 0;

          return {
            id: otherId,
            workerId: otherId,
            name: otherName,
            email: otherEmail,
            role: otherRole,
            initials: otherName.split(' ').map((n: any) => n[0]).join('').toUpperCase(),
            lastMessage: m.content,
            time: this.formatNotificationTime(m.sentAt),
            rawTime,
            active: false,
            online: true,
            unread: isUnread ? 1 : 0,
            messages: []
          } as Chat;
        });

        this.chats.update(currentChats => {
          const existingChatMap = new Map(currentChats.map(c => [c.id, c]));

          for (const inc of incomingChats) {
            const existing = existingChatMap.get(inc.id);
            if (existing) {
              existingChatMap.set(inc.id, {
                ...existing,
                lastMessage: inc.lastMessage,
                time: inc.time,
                rawTime: inc.rawTime,
                unread: inc.unread
              });
            } else {
              existingChatMap.set(inc.id, inc);
            }
          }

          const merged = Array.from(existingChatMap.values());
          // FIX BUG 2: sort by numeric rawTime — not by human-readable string
          return merged.sort((a, b) => (b.rawTime ?? 0) - (a.rawTime ?? 0));
        });
      },
      error: (err: HttpErrorResponse) => {
        console.error('[PlatformState] Error fetching chats', {
          status: err.status,
          message: err.message,
          error: err.error
        });
        if (err.status === 401) {
          this.auth.logout();
        }
      }
    });
  }

  markConversationAsRead(otherId: string) {
    const user = this.auth.currentUser();
    if (!user) return;

    this.http.put(`${this.apiUrl}/messages/conversation/read?senderId=${otherId}&receiverId=${user.id}`, {}, { responseType: 'text' }).subscribe({
      next: () => {
        this.chats.update(chats => chats.map(c =>
          c.id === otherId ? { ...c, unread: 0 } : c
        ));
      },
      error: (err: HttpErrorResponse) => console.error('Error marking conversation as read', err)
    });
  }

  /**
   * Delete a conversation (soft delete client-side persistent)
   */
  deleteConversation(userId: string, otherUserId: string): Observable<any> {
    try {
      const deletedKey = `deleted_chats_${userId}`;
      const deletedSet = new Set<string>(JSON.parse(localStorage.getItem(deletedKey) || '[]'));
      deletedSet.add(otherUserId);
      localStorage.setItem(deletedKey, JSON.stringify(Array.from(deletedSet)));

      // Remove the chat from the local state
      this.chats.update(chats => chats.filter(c => c.id !== otherUserId));
      this.notification.success('Conversation deleted');
      return of({ success: true });
    } catch (err) {
      console.error('Error deleting conversation', err);
      this.notification.error('Failed to delete conversation');
      return throwError(() => err);
    }
  }

  /**
   * Archive a conversation (client-side persistent)
   */
  archiveConversation(userId: string, otherUserId: string): Observable<any> {
    try {
      const archivedKey = `archived_chats_${userId}`;
      const archivedSet = new Set<string>(JSON.parse(localStorage.getItem(archivedKey) || '[]'));
      archivedSet.add(otherUserId);
      localStorage.setItem(archivedKey, JSON.stringify(Array.from(archivedSet)));

      // Update local state to mark as archived
      this.chats.update(chats =>
        chats.map(c =>
          c.id === otherUserId
            ? { ...c, archived: true, active: false }
            : c
        )
      );
      this.notification.success('Conversation archived');
      return of({ success: true });
    } catch (err) {
      console.error('Error archiving conversation', err);
      this.notification.error('Failed to archive conversation');
      return throwError(() => err);
    }
  }

  /**
   * Unarchive a conversation (client-side persistent)
   */
  unarchiveConversation(userId: string, otherUserId: string): Observable<any> {
    try {
      const archivedKey = `archived_chats_${userId}`;
      const archivedSet = new Set<string>(JSON.parse(localStorage.getItem(archivedKey) || '[]'));
      archivedSet.delete(otherUserId);
      localStorage.setItem(archivedKey, JSON.stringify(Array.from(archivedSet)));

      this.chats.update(chats =>
        chats.map(c =>
          c.id === otherUserId
            ? { ...c, archived: false }
            : c
        )
      );
      this.notification.success('Conversation restored from archive');
      return of({ success: true });
    } catch (err) {
      console.error('Error unarchiving conversation', err);
      this.notification.error('Failed to restore conversation');
      return throwError(() => err);
    }
  }

  /**
   * Get archived conversations (client-side persistent)
   */
  fetchArchivedConversations(userId: string): Observable<any> {
    try {
      const archivedKey = `archived_chats_${userId}`;
      const archivedSet = new Set<string>(JSON.parse(localStorage.getItem(archivedKey) || '[]'));

      // Update matching chats in our local signal to ensure they have archived: true
      this.chats.update(chats =>
        chats.map(c => ({
          ...c,
          archived: archivedSet.has(c.id)
        }))
      );
      return of({ success: true });
    } catch (err) {
      console.error('Error fetching archived conversations', err);
      return throwError(() => err);
    }
  }

  /**
   * Mark all conversations as read
   */
  markAllConversationsAsRead(userId: string): Observable<any> {
    try {
      const unreadChats = this.chats().filter(c => (c.unread || 0) > 0);
      unreadChats.forEach(chat => {
        this.http.put(`${this.apiUrl}/messages/conversation/read?senderId=${chat.id}&receiverId=${userId}`, {}, { responseType: 'text' }).subscribe({
          error: (err) => console.error('Failed to sync read status for chat: ' + chat.id, err)
        });
      });

      this.chats.update(chats =>
        chats.map(c => ({ ...c, unread: 0 }))
      );
      this.notification.success('All messages marked as read');
      return of({ success: true });
    } catch (err) {
      console.error('Error marking all as read', err);
      this.notification.error('Failed to mark all as read');
      return throwError(() => err);
    }
  }

  fetchConversation(otherId: string, otherName?: string): Observable<any> {
    const user = this.auth.currentUser();
    if (!user) {
      return throwError(() => new Error('Not authenticated'));
    }

    const page = this.currentMessagePage();

    return this.http.get<any>(`${this.apiUrl}/messages/conversation?user1Id=${user.id}&user2Id=${otherId}&page=${page}&size=50`).pipe(
      timeout(30000),
      tap((response) => {
        const data = response.content || response;
        const messages: ChatMessage[] = (data || []).map((m: any) => ({
          id: m.id,
          text: m.content || m.text || '',
          time: this.parseMessageDate(m.sentAt),
          rawDate: m.sentAt ? (Array.isArray(m.sentAt) ? new Date(m.sentAt[0], m.sentAt[1] - 1, m.sentAt[2], m.sentAt[3], m.sentAt[4]).getTime() : new Date(m.sentAt).getTime()) : Date.now(),
          sent: m.senderId?.toString() === user.id?.toString(),
          isRead: m.isRead || false,
          attachment: m.attachmentUrl ? { name: m.attachmentName || 'File', url: m.attachmentUrl, size: m.attachmentSize || '...' } : undefined
        })).reverse();

        this.chats.update(chats => {
          const existing = chats.find(c => c.id === otherId || c.workerId === otherId);
          if (existing) {
            return chats.map(c =>
              (c.id === otherId || c.workerId === otherId)
                ? { ...c, messages, active: true, unread: 0 }
                : c
            );
          } else {
            const displayName = otherName || 'User';
            const lastMsg = messages.length ? messages[messages.length - 1] : null;
            const newChat: Chat = {
              id: otherId,
              workerId: otherId,
              name: displayName,
              initials: displayName.split(' ').map(n => n[0]).join('').toUpperCase(),
              lastMessage: lastMsg?.text ?? '',
              time: lastMsg?.time ?? 'Just now',
              rawTime: Date.now(), // FIX BUG 2: seed rawTime so new chats sort correctly
              active: true,
              online: true,
              unread: 0,
              messages
            };
            return [newChat, ...chats];
          }
        });
      }),
      catchError((err: HttpErrorResponse) => {
        console.error('Error fetching conversation', err);
        return throwError(() => err);
      })
    );
  }

  private parseMessageDate(dateSource: any): string {
    if (!dateSource) return 'Just now';
    try {
      let date: Date;
      if (Array.isArray(dateSource)) {
        date = new Date(
          dateSource[0],
          dateSource[1] - 1,
          dateSource[2],
          dateSource[3],
          dateSource[4],
          dateSource[5] || 0
        );
      } else {
        date = new Date(dateSource);
      }

      if (isNaN(date.getTime())) return 'Just now';

      const now = new Date();
      const isToday = date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (isToday) return timeStr;

      return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} · ${timeStr}`;
    } catch {
      return 'Just now';
    }
  }

  startChat(workerId: string) {
    const worker = this.workers().find(w => w.id === workerId);
    if (!worker) return;

    const existing = this.chats().find(c => c.workerId === workerId);
    if (existing) {
      this.setActiveChat(existing.id);
      return;
    }

    const newChat: Chat = {
      id: worker.userId || worker.id,
      workerId: worker.id,
      name: worker.name,
      initials: worker.initials,
      image: worker.image,
      lastMessage: 'Chat started',
      time: 'Just now',
      rawTime: Date.now(),
      active: true,
      online: true,
      messages: []
    };

    this.chats.update(chats => {
      const deactivated = chats.map(c => ({ ...c, active: false }));
      return [newChat, ...deactivated];
    });
  }

  setActiveChat(chatId: string) {
    this.chats.update(chats =>
      chats.map(c => ({ ...c, active: c.id === chatId, unread: c.id === chatId ? 0 : c.unread }))
    );
  }

  fetchClientJobs(clientUserId: string) {
    this.http.get<any[]>(`${this.apiUrl}/jobs/client/${clientUserId}`).subscribe({
      next: (jobs) => this.bookings.set(jobs.map(j => this.mapJobToBooking(j))),
      error: (err: HttpErrorResponse) => console.error('Error fetching client jobs', err)
    });
  }

  fetchWorkerJobs(userId: string) {
    if (!userId) return;
    this.http.get<any[]>(`${this.apiUrl}/jobs/worker/user/${userId}`).subscribe({
      next: (jobs) => this.bookings.set(jobs.map(j => this.mapJobToBooking(j))),
      error: (err: HttpErrorResponse) => console.error('Error fetching worker jobs', err)
    });
  }

  private mapJobToBooking(job: any): Booking {
    const clientName = job.clientName || 'Client';
    const workerName = job.workerName || 'Worker';
    const status = (job.status || 'PENDING').replace(/_/g, ' ');
    const formattedStatus = status
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
      .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

    return {
      id: job.id,
      clientId: job.clientId,
      clientName,
      clientInitials: clientName.split(' ').filter((n: string) => n).map((p: string) => p[0]).join('').toUpperCase().slice(0, 2) || 'CL',
      workerId: job.workerId,
      workerName,
      workerInitials: workerName.split(' ').filter((n: string) => n).map((p: string) => p[0]).join('').toUpperCase().slice(0, 2) || 'WK',
      service: job.description || 'Service Request',
      date: job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'N/A',
      rawDate: job.createdAt ? new Date(job.createdAt).getTime() : 0,
      earnings: job.totalCost || 0,
      status: formattedStatus as any,
      rating: job.rating,
      hasReview: job.rating !== undefined && job.rating !== null,
      // lifecycle
      startedAt: job.startedAt, submittedAt: job.submittedAt, approvedAt: job.approvedAt,
      disputedAt: job.disputedAt, resolvedAt: job.resolvedAt, deadline: job.deadline,
      negotiatedPrice: job.negotiatedPrice,
      escrowFunded: job.escrowFunded || false,
      // dispute
      disputeReason: job.disputeReason, disputeEvidence: job.disputeEvidence, disputeAttachmentUrl: job.disputeAttachmentUrl,
      disputeResponse: job.disputeResponse, disputeResponseEvidence: job.disputeResponseEvidence,
      disputeResponseAttachmentUrl: job.disputeResponseAttachmentUrl,
      // admin
      adminDecisionReason: job.adminDecisionReason, adminEvidenceNotes: job.adminEvidenceNotes,
      workerPartialAmount: job.workerPartialAmount, clientPartialAmount: job.clientPartialAmount,
      paymentStatus: job.paymentStatus,
      paymentAmount: job.paymentAmount,
      platformFee: job.platformFee,
      workerNetAmount: job.workerNetAmount,
      escrowMessage: job.escrowMessage,
      mpesaReceiptNumber: job.mpesaReceiptNumber
    };
  }

  fetchMarketplaceMetadata() {
    this.http.get<any[]>(`${this.apiUrl}/marketplace/skills`).subscribe({
      next: (skills) => {
        console.log('[PlatformState] Fetched skills:', skills.length);
        this.availableSkills.set(skills.map(s => s.name || s));
      },
      error: (err: HttpErrorResponse) => console.error('Error fetching skills', err)
    });
    this.http.get<any[]>(`${this.apiUrl}/marketplace/locations`).subscribe({
      next: (locs) => {
        console.log('[PlatformState] Fetched locations:', locs.length);
        this.availableLocations.set(locs as string[]);
      },
      error: (err: HttpErrorResponse) => console.error('Error fetching locations', err)
    });
  }

  submitReview(workerId: string, bookingId: string, rating: number, comment: string) {
    const user = this.auth.currentUser();
    if (!user || user.role !== 'Client') return;

    const payload = {
      rating,
      comment
    };

    this.http.post(`${this.apiUrl}/reviews?clientId=${user.id}&workerProfileId=${workerId}&jobId=${bookingId}`, payload).subscribe({
      next: () => {
        this.notification.success('Thank you for your review!');
        // Update job status to ensure it's marked as reviewed
        this.fetchClientJobs(user.id);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error submitting review', err);
        this.notification.error('Failed to submit review.');
      }
    });
  }

  fetchWorkerReviews(workerId: string) {
    this.http.get(`${this.apiUrl}/reviews/worker/${workerId}`).subscribe({
      next: (reviews: any) => {
        this.workers.update(workers => {
          return workers.map(w => {
            if (w.id === workerId) {
              return { ...w, reviewsList: reviews };
            }
            return w;
          });
        });
      },
      error: (err: HttpErrorResponse) => console.error('Error fetching worker reviews', err)
    });
  }

  fetchWorkerRatingSummary(workerId: string) {
    this.http.get(`${this.apiUrl}/reviews/worker/${workerId}/summary`).subscribe({
      next: (summary: any) => {
        this.workers.update(workers => {
          return workers.map(w => {
            if (w.id === workerId) {
              return { 
                ...w, 
                rating: summary.averageRating,
                reviews: summary.reviewCount
              };
            }
            return w;
          });
        });
      },
      error: (err: HttpErrorResponse) => console.error('Error fetching worker rating summary', err)
    });
  }

  addRealTimeMessage(data: any) {
    const currentUserId = this.auth.currentUser()?.id;
    if (!currentUserId) return;

    const isSender = data.senderId?.toString() === currentUserId.toString();
    const otherId = isSender ? data.receiverId : data.senderId;
    const otherName = isSender ? data.receiverName : data.senderName || 'Unknown';

    const sentAt = data.sentAt || new Date().toISOString();
    const time = new Date(sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const rawTime = new Date(sentAt).getTime();

    const newMsg: ChatMessage = {
      id: data.id,
      text: data.content,
      time,
      rawDate: rawTime,
      sent: isSender,
      isRead: data.isRead || false,
      attachment: data.attachmentUrl ? { name: 'File', url: data.attachmentUrl, size: '...' } : undefined
    };

    this.chats.update(chats => {
      const existing = chats.find(c => c.id === otherId);
      if (existing) {
        // If chat is active, we don't increment unread
        const isUnread = !isSender && !existing.active;

        const updated = chats.map(c =>
          c.id === otherId ? {
            ...c,
            lastMessage: data.content || 'File',
            time,
            rawTime,
            unread: isUnread ? (c.unread || 0) + 1 : c.unread,
            messages: [...(c.messages || []), newMsg]
          } : c
        );
        return updated.sort((a, b) => (b.rawTime ?? 0) - (a.rawTime ?? 0));
      } else {
        // New conversation
        const newChat: Chat = {
          id: otherId,
          workerId: otherId,
          name: otherName,
          initials: otherName.split(' ').map((n: any) => n[0]).join('').toUpperCase(),
          lastMessage: data.content || 'File',
          time,
          rawTime,
          active: false,
          online: true,
          unread: isSender ? 0 : 1,
          messages: [newMsg]
        };
        return [newChat, ...chats];
      }
    });

    if (!isSender) {
      this.notification.info(`New message from ${otherName}`);
    }
  }

  handleReadReceipt(data: any) {
    const receiverId = data.receiverId;
    this.chats.update(chats => chats.map(c => {
      if (c.id === receiverId) {
        return {
          ...c,
          messages: c.messages.map(m => m.sent ? { ...m, isRead: true } : m)
        };
      }
      return c;
    }));
  }

  private mapToBackendUpdate(updates: any): any {
    return {
      ...updates,
      skills: updates.skills?.map((s: any) => typeof s === 'string' ? s : s.name)
    };
  }

  // Account Settings
  updateAccountProfile(name: string, phoneNumber?: string, profilePictureUrl?: string) {
    return this.http.put(`${this.apiUrl}/settings/profile`, { name, phoneNumber, profilePictureUrl });
  }

  updateAccountPassword(newPassword: string) {
    return this.http.put(`${this.apiUrl}/settings/password`, { newPassword });
  }

  liquidateAccount() {
    return this.http.delete(`${this.apiUrl}/settings/account`);
  }

  // ─── Offer / Negotiation ───────────────────────────────────────────────────

  submitOffer(jobId: string, amount: number, message: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/jobs/${jobId}/offers`, { amount, message });
  }

  acceptOffer(jobId: string, offerId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/jobs/${jobId}/offers/${offerId}/accept`, {});
  }

  rejectOffer(jobId: string, offerId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/jobs/${jobId}/offers/${offerId}/reject`, {});
  }

  getOffers(jobId: string): Observable<JobOffer[]> {
    return this.http.get<JobOffer[]>(`${this.apiUrl}/jobs/${jobId}/offers`);
  }

  // Counter-offer (direct price negotiation)
  submitCounterOffer(jobId: string, counterPrice: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/jobs/${jobId}/counter-offer?counterPrice=${counterPrice}`, {});
  }

  acceptCounterOffer(jobId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/jobs/${jobId}/accept-counter-offer`, {});
  }

  submitClientCounterOffer(jobId: string, counterPrice: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/jobs/${jobId}/client-counter-offer?counterPrice=${counterPrice}`, {});
  }

  // ─── Progress Updates ─────────────────────────────────────────────────────

  submitProgress(jobId: string, description: string, attachmentUrl?: string): Observable<any> {
    let url = `${this.apiUrl}/jobs/${jobId}/progress?description=${encodeURIComponent(description)}`;
    if (attachmentUrl) url += `&attachmentUrl=${encodeURIComponent(attachmentUrl)}`;
    return this.http.post(url, {});
  }

  getProgress(jobId: string): Observable<JobProgress[]> {
    return this.http.get<JobProgress[]>(`${this.apiUrl}/jobs/${jobId}/progress`);
  }

  // ─── Dispute ──────────────────────────────────────────────────────────────

  openDispute(jobId: string, reason: string, evidence: string, attachmentUrl?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/jobs/${jobId}/dispute`, { reason, evidence, attachmentUrl });
  }

  respondToDispute(jobId: string, response: string, evidence: string, attachmentUrl?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/jobs/${jobId}/dispute/respond`, { response, evidence, attachmentUrl });
  }

  // ─── Admin Dispute Resolution ─────────────────────────────────────────────

  adminResolveDispute(jobId: string, payload: {
    decisionType: string;
    reason: string;
    evidenceNotes: string;
    workerAmount?: number;
    clientRefund?: number;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/jobs/${jobId}/admin/resolve`, payload);
  }
}
