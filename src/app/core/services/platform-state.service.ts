import { Injectable, signal, computed, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService, User } from './auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, throwError } from 'rxjs';
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
  name: string;
  initials: string;
  email: string;
  category: string;
  status: 'Pending' | 'Priority' | 'Verified' | 'Rejected' | 'Draft';
  image?: string;
  rate: number;
  rating: number;
  reviews: number;
  skills: string[];
  bio: string;
  rejectionReason?: string;
  uploadedDocuments?: { name: string; file?: File; type: string; status: 'uploaded' | 'validating' | 'approved' | 'rejected'; error?: string }[];
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
  status: 'Pending' | 'Approved' | 'Completed' | 'Processing';
}

export interface ClientProfile {
  id: string;
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

  chats = signal<Chat[]>([]);

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
  private platformId = inject(PLATFORM_ID);
  private apiUrl = environment.apiUrl;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadState();
      this.fetchMarketplaceWorkers();
    }

    // Automatic State Persistence
    effect(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      this.saveState();
    });

    // Sync with Backend on Auth session
    effect(() => {
      if (!isPlatformBrowser(this.platformId)) return;

      const user = this.auth.currentUser();
      if (user) {
        if (user.role === 'Worker') {
          this.fetchWorkerProfile(user.id);
        } else if (user.role === 'Client') {
          this.fetchClientProfile(user.id);
        }
        this.fetchNotifications(user.id);
        this.fetchChats(user.id);
      }
    });
  }

  public fetchWorkerProfile(userId: string) {
    this.http.get<any>(`${this.apiUrl}/workers/profile/${userId}`).subscribe({
      next: (data) => {
        const mapped = this.mapWorkerProfile(data);
        this.currentWorker.set(mapped);
      },
      error: (err) => console.error('Error fetching worker profile', err)
    });
  }

  fetchMarketplaceWorkers(skill?: string, location?: string, minExp?: number) {
    let url = `${this.apiUrl}/marketplace/search`;
    const params: string[] = [];
    if (skill) params.push(`skill=${skill}`);
    if (location) params.push(`location=${location}`);
    if (minExp) params.push(`minExp=${minExp}`);

    if (params.length > 0) url += `?${params.join('&')}`;

    this.http.get<any[]>(url).subscribe({
      next: (data) => {
        const mapped = data.map(w => this.mapWorkerProfile(w));
        // We merge with existing workers to keep current worker if present
        const currentId = this.currentWorker().id;
        const filtered = mapped.filter(w => w.id !== currentId);
        this.workers.set([...filtered, this.currentWorker()]);
      },
      error: (err) => console.error('Error fetching marketplace workers', err)
    });
  }

  updateWorkerProfile(profileId: string, updates: any): Observable<any> {
    const backendPayload = {
      ...updates,
      // Ensure skills are strings if they aren't already
      skills: updates.skills?.map((s: any) => typeof s === 'string' ? s : s.name)
    };

    return this.http.put<any>(`${this.apiUrl}/workers/profile/${profileId}`, backendPayload).pipe(
      tap(res => {
        if (res.workerProfile) {
          const mapped = this.mapWorkerProfile(res.workerProfile);
          this.currentWorker.set(mapped);
        }
      }),
      catchError(err => {
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

  private fetchClientProfile(userId: string) {
    this.http.get<any>(`${this.apiUrl}/clients/profile/${userId}`).subscribe({
      next: (data) => {
        const mapped = this.mapClientProfile(data);
        this.currentClient.set(mapped);
      },
      error: (err) => console.error('Error fetching client profile', err)
    });
  }

  updateClientProfile(profileId: string, updates: Partial<ClientProfile>): Observable<any> {
    const backendPayload = {
      fullName: updates.name,
      phoneNumber: (updates as any).phoneNumber
    };

    return this.http.put(`${this.apiUrl}/clients/profile/${profileId}`, backendPayload).pipe(
      tap(() => this.notification.success('Profile updated successfully!')),
      catchError(err => {
        this.notification.error('Failed to update profile.');
        return throwError(() => err);
      })
    );
  }

  fetchNotifications(userId: string) {
    this.http.get<any[]>(`${this.apiUrl}/notifications/user/${userId}`).subscribe({
      next: (data) => {
        const mapped = data.map(n => ({
          id: n.id,
          userId: n.userId,
          title: n.title,
          message: n.message,
          time: this.formatNotificationTime(n.createdAt),
          isRead: n.read,
          type: n.type.toLowerCase() as any
        }));
        this.notifications.set(mapped);
      },
      error: (err) => console.error('Error fetching notifications', err)
    });
  }

  markNotificationAsRead(notificationId: string) {
    this.http.put(`${this.apiUrl}/notifications/${notificationId}/read`, {}).subscribe({
      next: () => {
        this.notifications.update(prev => prev.map(n =>
          n.id === notificationId ? { ...n, isRead: true } : n
        ));
      },
      error: (err) => console.error('Error marking notification as read', err)
    });
  }

  markAllNotificationsAsRead() {
    const user = this.auth.currentUser();
    if (!user) return;

    this.http.put(`${this.apiUrl}/notifications/user/${user.id}/read-all`, {}).subscribe({
      next: () => {
        this.notifications.update(prev => prev.map(n => ({ ...n, isRead: true })));
      },
      error: (err) => console.error('Error marking all notifications as read', err)
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
      name: fullName,
      initials: fullName ? fullName.split(' ').filter((n: string) => n).map((n: string) => n[0]).join('').toUpperCase() : '??',
      email: data.email,
      category: data.category || 'General Laborer',
      status: this.mapStatus(data.status),
      image: data.profilePictureUrl,
      rate: data.hourlyRate || 0,
      rating: 4.5,
      reviews: 10,
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
      currentClient: this.currentClient()
    };
    localStorage.setItem('nestfind_state', JSON.stringify(data));
  }

  private loadState() {
    if (!isPlatformBrowser(this.platformId)) return;
    const saved = localStorage.getItem('nestfind_state');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        
        // Identity Check: We load the worker profile if it exists
        // The identity check will be verified against the auth signal later if needed
        // but for instant load we trust the cache temporarily
        if (data.currentWorker && data.currentWorker.id) {
          console.log('Restoring worker profile from cache:', data.currentWorker.name);
          this.currentWorker.set(data.currentWorker);
        }
        
        this.workers.set(data.workers || []);
        this.notifications.set(data.notifications || []);
        this.activityLogs.set(data.activityLogs || []);
        this.bookings.set(data.bookings || []);
        this.currentClient.set(data.currentClient || null);
      } catch (e) {
        console.error('Error parsing cached state', e);
      }
    }
  }

  verifiedWorkers = computed(() => this.workers().filter(w => w.status === 'Verified'));
  pendingWorkers = computed(() => this.workers().filter(w => w.status === 'Pending' || w.status === 'Priority'));
  workerNotifications = computed(() => this.notifications().filter(n => n.userId === this.currentWorker().id));
  workerBookings = computed(() => this.bookings().filter(b => b.workerId === this.currentWorker().id));

  currentWorkerCompletion = computed(() => {
    const w = this.currentWorker();
    let score = 0;

    // Core Identity (40%)
    if (w.name) score += 10;
    if (w.email) score += 10;
    if (w.category) score += 10;
    if (w.location) score += 10;

    // Professional Details (40%)
    if (w.bio) score += 10;
    if (w.skills && w.skills.length > 0) score += 10;
    if (w.workHistory && w.workHistory.length > 0) score += 10;
    if (w.certifications && w.certifications.length > 0) score += 10;

    // Verification Documents (20%)
    const docs = w.uploadedDocuments || [];
    const hasID = docs.some(d => d.type.toLowerCase().includes('identification'));
    if (hasID) score += 20;

    return Math.min(score, 100);
  });

  fetchPendingWorkers() {
    this.http.get<any[]>(`${this.apiUrl}/admin/workers/pending`).subscribe({
      next: (data) => {
        const mapped = data.map(w => this.mapWorkerProfile(w));
        this.workers.set(mapped);
      },
      error: (err) => console.error('Error fetching pending workers', err)
    });
  }

  approveWorker(id: string) {
    const admin = this.auth.currentUser();
    if (!admin || admin.role !== 'Admin') return;

    this.http.put(`${this.apiUrl}/admin/workers/${id}/approve?adminId=${admin.id}`, {}).subscribe({
      next: () => {
        this.workers.update(prev => prev.map(w => w.id === id ? { ...w, status: 'Verified' } : w));
        this.addActivityLog(id, 'approved');
        this.addNotification('Account Verified!', 'Your professional profile is now live in the marketplace.', 'success', id);
        this.notification.success('Worker approved successfully.');
      },
      error: (err) => {
        this.notification.error('Failed to approve worker.');
        console.error('Error approving worker', err);
      }
    });
  }

  rejectWorker(id: string, reason: string = '') {
    const admin = this.auth.currentUser();
    if (!admin || admin.role !== 'Admin') return;

    this.http.put(`${this.apiUrl}/admin/workers/${id}/reject?adminId=${admin.id}&reason=${reason}`, {}).subscribe({
      next: () => {
        this.workers.update(prev => prev.map(w => w.id === id ? { ...w, status: 'Rejected', rejectionReason: reason } : w));
        this.addActivityLog(id, 'rejected', reason);
        this.addNotification('Action Required', `Your verification was rejected: ${reason || 'Please review and resubmit.'}`, 'warning', id);
        this.notification.info('Worker rejected.');
      },
      error: (err) => {
        this.notification.error('Failed to reject worker.');
        console.error('Error rejecting worker', err);
      }
    });
  }

  resubmitWorker(id: string) {
    this.http.put(`${this.apiUrl}/workers/profile/${id}/submit`, {}).subscribe({
      next: (data: any) => {
        const mapped = this.mapWorkerProfile(data);
        if (id === this.currentWorker().id) {
          this.currentWorker.set(mapped);
          this.addNotification('Application Resubmitted', 'Your updated profile is now being reviewed by our administrators.', 'info', id);
        }
        this.workers.update(prev => prev.map(w => w.id === id ? mapped : w));
        this.addActivityLog(id, 'resubmitted');
        this.notification.success('Profile resubmitted for verification.');
      },
      error: (err) => {
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

        // Ensure worker is in the global list for Admins to see
        this.workers.update(prev => {
          const exists = prev.find(w => w.id === workerId);
          if (exists) {
            return prev.map(w => w.id === workerId ? mapped : w);
          }
          return [mapped, ...prev];
        });

        this.addNotification('Application Submitted', 'Your profile is now being reviewed by our administrators.', 'info', workerId);
        this.addActivityLog(workerId, 'submitted');
        this.notification.success('Profile submitted for verification!');
      },
      error: (err) => {
        this.notification.error('Failed to submit profile for verification.');
        console.error('Error submitting worker for verification', err);
      }
    });
  }

  hireWorker(workerId: string) {
    const worker = this.workers().find(w => w.id === workerId);
    if (!worker) return;

    const newBooking: Booking = {
      id: Math.random().toString(36).substring(7),
      clientId: 'c_current',
      clientName: 'Infrastructure Client',
      clientInitials: 'IC',
      workerId: worker.id,
      workerName: worker.name,
      workerInitials: worker.initials,
      service: worker.category,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      earnings: worker.rate * 4,
      status: 'Pending'
    };

    this.bookings.update(prev => [newBooking, ...prev]);
    this.addNotification('Hire Request Sent', `You have successfully sent a hire request to ${worker.name}.`, 'success', 'c_current');
  }

  acceptBooking(bookingId: string) {
    this.bookings.update(prev => prev.map(b =>
      b.id === bookingId ? { ...b, status: 'Approved' } : b
    ));
    const booking = this.bookings().find(b => b.id === bookingId);
    if (booking) {
      this.addNotification('Booking Accepted', `You have accepted the project for ${booking.clientName}.`, 'success', booking.workerId);
      // In a real app, we'd also notify the client.
    }
  }

  declineBooking(bookingId: string) {
    const booking = this.bookings().find(b => b.id === bookingId);
    this.bookings.update(prev => prev.filter(b => b.id !== bookingId));
    if (booking) {
      this.addNotification('Booking Declined', `You have declined the request.`, 'info', booking.workerId);
    }
  }

  toggleAvailability(workerId: string) {
    this.workers.update(prev => prev.map(w =>
      w.id === workerId ? { ...w, isAvailable: !w.isAvailable } : w
    ));
  }

  sendMessage(chatId: string, text: string) {
    const user = this.auth.currentUser();
    if (!user) return;

    const chat = this.chats().find(c => c.id === chatId);
    if (!chat) return;

    const backendPayload = {
      content: text
    };

    this.http.post(`${this.apiUrl}/messages?senderId=${user.id}&receiverId=${chat.workerId}`, backendPayload).subscribe({
      next: (data: any) => {
        const time = new Date(data.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const newMsg: ChatMessage = { id: data.id, text: data.content, time, sent: true };
        this.chats.update(chats => chats.map(c => {
          if (c.id === chatId) {
            return { ...c, lastMessage: text, time, messages: [...c.messages, newMsg] };
          }
          return c;
        }));
      },
      error: (err) => console.error('Error sending message', err)
    });
  }

  fetchChats(userId: string) {
    this.http.get<any[]>(`${this.apiUrl}/messages/user/${userId}/recent`).subscribe({
      next: (data) => {
        const mapped = data.map(m => {
          const isSender = m.senderId === userId;
          const otherId = isSender ? m.receiverId : m.senderId;
          const otherName = isSender ? m.receiverName : m.senderName;
          return {
            id: otherId,
            workerId: otherId,
            name: otherName,
            initials: otherName.split(' ').map((n: any) => n[0]).join('').toUpperCase(),
            lastMessage: m.content,
            time: this.formatNotificationTime(m.sentAt),
            active: false,
            online: true,
            messages: []
          };
        });
        this.chats.set(mapped);
      },
      error: (err) => console.error('Error fetching chats', err)
    });
  }

  fetchConversation(otherId: string) {
    const user = this.auth.currentUser();
    if (!user) return;

    this.http.get<any[]>(`${this.apiUrl}/messages/conversation?user1Id=${user.id}&user2Id=${otherId}`).subscribe({
      next: (data) => {
        const messages: ChatMessage[] = data.map(m => ({
          id: m.id,
          text: m.content,
          time: new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sent: m.senderId === user.id
        }));

        this.chats.update(chats => chats.map(c => {
          if (c.workerId === otherId) {
            return { ...c, messages };
          }
          return c;
        }));
      },
      error: (err) => console.error('Error fetching conversation', err)
    });
  }

  startChat(workerId: string) {
    const worker = this.workers().find(w => w.id === workerId);
    if (!worker) return;

    // Check if chat already exists
    const existing = this.chats().find(c => c.workerId === workerId);
    if (existing) {
      this.setActiveChat(existing.id);
      return;
    }

    // Create new chat
    const newChat: Chat = {
      id: Math.random().toString(),
      workerId: worker.id,
      name: worker.name,
      initials: worker.initials,
      image: worker.image,
      lastMessage: 'Chat started',
      time: 'Just now',
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
    this.chats.update(chats => chats.map(c => ({ ...c, active: c.id === chatId })));
    const chat = this.chats().find(c => c.id === chatId);
    if (chat && chat.messages.length === 0) {
      this.fetchConversation(chat.workerId);
    }
  }

  private addActivityLog(workerId: string, action: 'approved' | 'rejected' | 'submitted' | 'resubmitted', reason?: string) {
    const worker = this.workers().find(w => w.id === workerId);
    const log: ActivityLog = {
      id: Math.random().toString(36).substring(7),
      workerId,
      workerName: worker?.name || 'Unknown',
      action,
      reason,
      timestamp: new Date(),
      adminName: 'System Admin'
    };
    this.activityLogs.update(prev => [log, ...prev]);
  }

  private addNotification(title: string, message: string, type: 'success' | 'info' | 'warning' = 'info', userId?: string) {
    const n: Notification = {
      id: Math.random().toString(36).substring(7),
      userId,
      title,
      message,
      time: 'Just now',
      isRead: false,
      type
    };
    this.notifications.update(prev => [n, ...prev]);
  }
}
