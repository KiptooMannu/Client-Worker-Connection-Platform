import { Injectable, signal, computed, effect, inject, PLATFORM_ID, NgZone, ApplicationRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService, User } from './auth.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, throwError, filter, take } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { NotificationService } from './notification.service';

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
  status: 'Pending' | 'Priority' | 'Verified' | 'Rejected' | 'Draft' | 'Suspended' | 'APPROVED' | 'PENDING' | 'REJECTED' | 'DRAFT';
  image?: string;
  phoneNumber?: string;
  rate: number;
  rating: number;
  reviews: number;
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
  sent: boolean;
  attachment?: { name: string; size: string };
}

export interface Chat {
  id: string;
  workerId: string;
  name: string;
  image?: string;
  initials: string;
  lastMessage: string;
  time: string;
  rawTime?: number; // FIX BUG 2: store numeric timestamp for correct chronological sorting
  active: boolean;
  online: boolean;
  unread?: number;
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
  earnings: number;
  rating?: number;
  status: 'Pending' | 'Approved' | 'Completed' | 'Processing' | 'Accepted' | 'Rejected' | 'Cancelled' | 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'REJECTED';
}

export interface ClientProfile {
  id: string;
  userId?: string;
  name: string;
  email: string;
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

  updateJobStatus(jobId: string, status: string) {
    const user = this.auth.currentUser();
    if (!user) return;

    this.http.put(`${this.apiUrl}/jobs/${jobId}/status?status=${status}`, {}).subscribe({
      next: () => {
        this.notification.success(`Job status updated to ${status}`);
        if (user.role === 'Worker') {
          this.fetchWorkerProfile(user.id);
        } else if (user.role === 'Client') {
          this.fetchClientJobs(user.id);
        } else if (user.role === 'Admin') {
          this.fetchAllJobs();
        }
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error updating job status', err);
        this.notification.error('Failed to update job status');
      }
    });
  }

  private mapBooking(b: any): Booking {
    return {
      id: b.id,
      clientId: b.clientId,
      workerId: b.workerId,
      workerName: b.workerName,
      workerInitials: (b.workerName || 'U').split(' ').map((n: any) => n[0]).join('').toUpperCase(),
      clientName: b.clientName,
      clientInitials: (b.clientName || 'U').split(' ').map((n: any) => n[0]).join('').toUpperCase(),
      service: b.service || b.description || 'General Service',
      date: new Date(b.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      status: b.status.charAt(0) + b.status.slice(1).toLowerCase() as any,
      earnings: b.totalCost || 0,
      rating: b.rating
    };
  }

  isMessagingActive = signal(false);

  currentMessagePage = signal(0);
  private appRef = inject(ApplicationRef);

  currentWorker = signal<WorkerProfile>({
    id: '',
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

  currentClient = signal<ClientProfile | null>(null);

  private auth = inject(AuthService);
  private http = inject(HttpClient);
  private notification = inject(NotificationService);
  private ngZone = inject(NgZone);
  private platformId = inject(PLATFORM_ID);
  private apiUrl = environment.apiUrl;
  private pollingInterval: any;

  clearState() {
    this.notifications.set([]);
    this.chats.set([]);
    this.activityLogs.set([]);
    this.bookings.set([]);
    this.currentClient.set(null);
    this.currentWorker.set({
      id: '',
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
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('pro_state');
    }
  }

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadState();
    }

    effect(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      this.saveState();
    });

    effect(() => {
      if (!isPlatformBrowser(this.platformId)) return;

      const user = this.auth.currentUser();
      if (user) {
        this.appRef.isStable.pipe(
          filter(stable => stable),
          take(1)
        ).subscribe(() => {
          setTimeout(() => {
            if (user.role === 'Worker') {
              this.fetchWorkerProfile(user.id);
            } else if (user.role === 'Admin') {
              this.fetchAdminWorkers();
              this.fetchPendingWorkers();
              this.fetchAdminUsers();
              this.fetchAdminClients();
              this.fetchAdminActivityLogs();
              this.fetchAllJobs();
            } else if (user.role === 'Client') {
              this.fetchClientProfile(user.id);
              this.fetchClientJobs(user.id);
            }
            this.fetchNotifications(user.id);
            this.fetchChats(user.id);

            this.ngZone.runOutsideAngular(() => {
              if (this.pollingInterval) clearInterval(this.pollingInterval);
              this.pollingInterval = setInterval(() => {
                const u = this.auth.currentUser();
                if (u) {
                  this.ngZone.run(() => {
                    // FIX BUG 3: Always fetch notifications and chats for ALL dashboards.
                    // Removed the isMessagingActive() gate that was blocking Admin/Client updates.
                    this.fetchNotifications(u.id);
                    this.fetchChats(u.id);

                    if (u.role === 'Admin') {
                      this.fetchAdminActivityLogs();
                      this.fetchPendingWorkers();
                      this.fetchAdminUsers();
                      this.fetchAllJobs();
                    }
                  });
                }
              }, 10000);
            });
          }, 0);
        });
      } else {
        this.clearState();
      }
    });
  }

  public fetchWorkerProfile(userId: string) {
    this.http.get<any>(`${this.apiUrl}/workers/profile/${userId}`).subscribe({
      next: (data) => {
        const mapped = this.mapWorkerProfile(data);
        this.currentWorker.set(mapped);
        this.fetchWorkerJobs(mapped.id);
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

  fetchMarketplaceWorkers(skill?: string, location?: string, minExp?: number) {
    let url = `${this.apiUrl}/marketplace/search`;
    const params: string[] = [];
    if (skill) params.push(`skill=${encodeURIComponent(skill)}`);
    if (location) params.push(`location=${encodeURIComponent(location)}`);
    if (minExp) params.push(`minExp=${minExp}`);

    if (params.length > 0) url += `?${params.join('&')}`;

    this.http.get<any[]>(url).subscribe({
      next: (data) => {
        const mapped = data.map(w => this.mapWorkerProfile(w));
        this.workers.set(mapped);
      },
      error: (err: HttpErrorResponse) => console.error('Error fetching marketplace workers', err)
    });
  }

  updateWorkerProfile(profileId: string, updates: any): Observable<any> {
    const backendPayload = {
      ...updates,
      skills: updates.skills?.map((s: any) => typeof s === 'string' ? s : s.name)
    };

    return this.http.put<any>(`${this.apiUrl}/workers/profile/${profileId}`, backendPayload).pipe(
      tap(res => {
        if (res.workerProfile) {
          const mapped = this.mapWorkerProfile(res.workerProfile);
          this.currentWorker.set(mapped);
        }
      }),
      catchError((err: HttpErrorResponse) => {
        return throwError(() => err);
      })
    );
  }

  uploadDocument(workerProfileId: string, type: string, name: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('workerProfileId', workerProfileId);
    formData.append('type', type);
    formData.append('name', name);
    formData.append('file', file);

    return this.http.post(`${this.apiUrl}/documents`, formData);
  }

  uploadProfilePicture(workerProfileId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/workers/${workerProfileId}/profile-picture`, formData);
  }

  deleteProfilePicture(workerProfileId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/workers/${workerProfileId}/profile-picture`);
  }

  deleteDocument(documentId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/documents/${documentId}`, { responseType: 'text' });
  }

  private fetchClientProfile(userId: string) {
    this.http.get<any>(`${this.apiUrl}/clients/profile/${userId}`).subscribe({
      next: (data) => {
        const mapped = this.mapClientProfile(data);
        this.currentClient.set(mapped);
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

  updateClientProfile(profileId: string, updates: Partial<ClientProfile>): Observable<any> {
    const backendPayload = {
      fullName: updates.name,
      phoneNumber: (updates as any).phoneNumber
    };

    return this.http.put(`${this.apiUrl}/clients/profile/${profileId}`, backendPayload).pipe(
      tap(() => this.notification.success('Profile updated successfully!')),
      catchError((err: HttpErrorResponse) => {
        this.notification.error('Failed to update profile.');
        return throwError(() => err);
      })
    );
  }

  fetchNotifications(userId: string) {
    console.log('[PlatformState] Fetching notifications for userId:', userId);

    this.http.get<any>(`${this.apiUrl}/notifications/user/${userId}`).subscribe({
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
      allUsers: this.allUsers()
    };
    localStorage.setItem('kazi_konnect_state', JSON.stringify(data));
  }

  private loadState() {
    if (!isPlatformBrowser(this.platformId)) return;
    const saved = localStorage.getItem('kazi_konnect_state') || localStorage.getItem('nestfind_state');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.currentWorker && data.currentWorker.id) {
          console.log('Restoring worker profile from cache:', data.currentWorker.name);
          this.currentWorker.set(data.currentWorker);
        }
        this.workers.set(data.workers || []);
        this.notifications.set(data.notifications || []);
        this.activityLogs.set(data.activityLogs || []);
        this.bookings.set(data.bookings || []);
        this.currentClient.set(data.currentClient || null);
        this.chats.set(data.chats || []);
        this.allUsers.set(data.allUsers || []);
        console.log('[PlatformState] State restored from localStorage (including user directory)');
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

    if (hasIDFront) score += 10;
    if (hasIDBack) score += 10;

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

  resubmitWorker(id: string) {
    this.http.put(`${this.apiUrl}/workers/profile/${id}/submit`, {}).subscribe({
      next: (data: any) => {
        const mapped = this.mapWorkerProfile(data);
        if (id === this.currentWorker().id) {
          this.currentWorker.set(mapped);
        }
        this.workers.update(prev => prev.map(w => w.id === id ? mapped : w));
        this.notification.success('Profile resubmitted for verification.');
      },
      error: (err: HttpErrorResponse) => {
        this.notification.error('Failed to resubmit profile.');
        console.error('Error resubmitting worker', err);
      }
    });
  }

  submitForVerification() {
    const workerId = this.currentWorker().id;
    this.http.put(`${this.apiUrl}/workers/profile/${workerId}/submit`, {}).subscribe({
      next: (data: any) => {
        const mapped = this.mapWorkerProfile(data);
        this.currentWorker.set(mapped);
        this.workers.update(prev => {
          const exists = prev.find(w => w.id === workerId);
          if (exists) {
            return prev.map(w => w.id === workerId ? mapped : w);
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

  hireWorker(workerId: string) {
    const worker = this.workers().find(w => w.id === workerId);
    const user = this.auth.currentUser();
    if (!worker || !user || user.role !== 'Client') return;

    const alreadyRequested = this.bookings().some(b =>
      b.workerId === worker.id && (b.status === 'PENDING' || b.status === 'ACCEPTED')
    );

    if (alreadyRequested) {
      this.notification.info(`You already have an active request with ${worker.name}.`);
      return;
    }

    const payload = {
      description: `Hire request for ${worker.category} service`
    };
    this.http.post<any>(`${this.apiUrl}/jobs/request?clientId=${user.id}&workerProfileId=${worker.id}`, payload).subscribe({
      next: () => {
        this.fetchClientJobs(user.id);
        this.notification.success(`Hire request sent to ${worker.name}.`);
      },
      error: (err: HttpErrorResponse) => {
        this.notification.error('Failed to create hire request.');
        console.error('Error creating hire request', err);
      }
    });
  }

  acceptBooking(bookingId: string) {
    this.http.put<any>(`${this.apiUrl}/jobs/${bookingId}/status?status=ACCEPTED`, {}).subscribe({
      next: () => {
        const user = this.auth.currentUser();
        if (user?.role === 'Worker') this.fetchWorkerJobs(this.currentWorker().id);
        if (user?.role === 'Client') this.fetchClientJobs(user.id);
      },
      error: (err: HttpErrorResponse) => console.error('Error accepting booking', err)
    });
  }

  declineBooking(bookingId: string) {
    this.http.put<any>(`${this.apiUrl}/jobs/${bookingId}/status?status=REJECTED`, {}).subscribe({
      next: () => {
        const user = this.auth.currentUser();
        if (user?.role === 'Worker') this.fetchWorkerJobs(this.currentWorker().id);
        if (user?.role === 'Client') this.fetchClientJobs(user.id);
      },
      error: (err: HttpErrorResponse) => console.error('Error declining booking', err)
    });
  }

  toggleAvailability(workerId: string) {
    this.workers.update(prev => prev.map(w =>
      w.id === workerId ? { ...w, isAvailable: !w.isAvailable } : w
    ));
  }

  sendMessageToUser(receiverId: string, text: string): Observable<any> {
    const user = this.auth.currentUser();
    if (!user) return throwError(() => new Error('Not authenticated'));

    const payload = {
      senderId: user.id,
      receiverId: receiverId,
      content: text
    };

    return this.http.post<any>(`${this.apiUrl}/messages`, payload).pipe(
      tap(data => {
        const sentAt = data.sentAt || new Date().toISOString();
        const time = new Date(sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const rawTime = new Date(sentAt).getTime(); // FIX BUG 2: capture numeric timestamp
        const newMsg: ChatMessage = { id: data.id, text: data.content, time, sent: true };

        this.chats.update(chats => {
          const chat = chats.find(c => c.id === receiverId);
          if (chat) {
            return chats.map(c =>
              c.id === receiverId
                ? { ...c, lastMessage: text, time, rawTime, messages: [...c.messages, newMsg] }
                : c
            );
          } else {
            const newChat: Chat = {
              id: receiverId,
              workerId: receiverId,
              name: data.receiverName || 'User',
              initials: (data.receiverName || 'U').split(' ').map((n: any) => n[0]).join('').toUpperCase(),
              lastMessage: text,
              time: 'Just now',
              rawTime, // FIX BUG 2
              active: true,
              online: true,
              messages: [newMsg]
            };
            return [newChat, ...chats];
          }
        });
      })
    );
  }

  fetchChats(userId: string) {
    console.log('[PlatformState] Fetching chats for userId:', userId);

    this.http.get<any>(`${this.apiUrl}/messages/user/${userId}/recent`).subscribe({
      next: (res) => {
        const data = res.content || res || [];
        console.log(`[PlatformState] Received ${data.length} chats for user ${userId}`);
        const currentUserId = userId.toString();

        const incomingChats = data.map((m: any) => {
          const isSender = m.senderId?.toString() === currentUserId;
          const otherId = isSender ? m.receiverId : m.senderId;
          const otherName = isSender ? m.receiverName : m.senderName || 'Unknown';
          const isUnread = !m.isRead && m.receiverId?.toString() === currentUserId;

          // FIX BUG 2: store rawTime for correct chronological sorting
          const rawTime = m.sentAt ? new Date(m.sentAt).getTime() : 0;

          return {
            id: otherId,
            workerId: otherId,
            name: otherName,
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
                rawTime: inc.rawTime, // FIX BUG 2: update rawTime on merge
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

  fetchConversation(otherId: string, otherName?: string): Observable<any> {
    const user = this.auth.currentUser();
    if (!user) {
      return throwError(() => new Error('Not authenticated'));
    }

    const page = this.currentMessagePage();

    return this.http.get<any>(`${this.apiUrl}/messages/conversation?user1Id=${user.id}&user2Id=${otherId}&page=${page}&size=50`).pipe(
      tap((response) => {
        const data = response.content || response;
        const messages: ChatMessage[] = (data || []).map((m: any) => ({
          id: m.id,
          text: m.content || m.text || '',
          time: this.parseMessageDate(m.sentAt),
          sent: m.senderId?.toString() === user.id?.toString()
        }));

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
      if (Array.isArray(dateSource)) {
        const d = new Date(
          dateSource[0],
          dateSource[1] - 1,
          dateSource[2],
          dateSource[3],
          dateSource[4],
          dateSource[5] || 0
        );
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      const date = new Date(dateSource);
      if (isNaN(date.getTime())) return 'Just now';
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
      id: Math.random().toString(),
      workerId: worker.id,
      name: worker.name,
      initials: worker.initials,
      image: worker.image,
      lastMessage: 'Chat started',
      time: 'Just now',
      rawTime: Date.now(), // FIX BUG 2
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
    const chat = this.chats().find(c => c.id === chatId);
    if (chat && chat.messages.length === 0) {
      this.fetchConversation(chat.workerId, chat.name).subscribe();
    }
  }

  fetchClientJobs(clientUserId: string) {
    this.http.get<any[]>(`${this.apiUrl}/jobs/client/${clientUserId}`).subscribe({
      next: (jobs) => this.bookings.set(jobs.map(j => this.mapJobToBooking(j))),
      error: (err: HttpErrorResponse) => console.error('Error fetching client jobs', err)
    });
  }

  fetchWorkerJobs(workerProfileId: string) {
    if (!workerProfileId) return;
    this.http.get<any[]>(`${this.apiUrl}/jobs/worker/${workerProfileId}`).subscribe({
      next: (jobs) => this.bookings.set(jobs.map(j => this.mapJobToBooking(j))),
      error: (err: HttpErrorResponse) => console.error('Error fetching worker jobs', err)
    });
  }

  private mapJobToBooking(job: any): Booking {
    const clientName = job.clientName || 'Client';
    const workerName = job.workerName || 'Worker';
    return {
      id: job.id,
      clientId: job.clientId,
      clientName,
      clientInitials: clientName.split(' ').map((p: string) => p[0]).join('').toUpperCase().slice(0, 2) || 'CL',
      workerId: job.workerId,
      workerName,
      workerInitials: workerName.split(' ').map((p: string) => p[0]).join('').toUpperCase().slice(0, 2) || 'WK',
      service: 'Service Request',
      date: new Date(job.createdAt).toLocaleDateString(),
      earnings: job.totalCost || 0,
      status: job.status === 'ACCEPTED' ? 'Approved' :
        job.status === 'REJECTED' ? 'Processing' :
          job.status === 'COMPLETED' ? 'Completed' : 'Pending'
    };
  }

  fetchMarketplaceMetadata() {
    this.http.get<any[]>(`${this.apiUrl}/marketplace/skills`).subscribe({
      next: (skills) => this.availableSkills.set(skills.map(s => s.name)),
      error: (err: HttpErrorResponse) => console.error('Error fetching skills', err)
    });
    this.http.get<String[]>(`${this.apiUrl}/marketplace/locations`).subscribe({
      next: (locs) => this.availableLocations.set(locs as string[]),
      error: (err: HttpErrorResponse) => console.error('Error fetching locations', err)
    });
  }
}