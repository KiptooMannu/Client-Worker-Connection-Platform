import { Injectable, signal, computed, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from './auth.service';

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
  uploadedDocuments?: { name: string; file: File; type: string; status: 'uploaded' | 'validating' | 'approved' | 'rejected'; error?: string }[];
  isAvailable: boolean;
}

export interface Notification {
  id: string;
  userId?: string; // Target specific user
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
  private initialWorkers: WorkerProfile[] = [
    { 
      id: 'w1', 
      name: 'Alexander Wright', 
      initials: 'AW', 
      email: 'alex.w@pro.com', 
      category: 'Senior Systems Architect', 
      status: 'Verified',
      rate: 125,
      rating: 4.9,
      reviews: 142,
      skills: ['Cloud Arch', 'Kubernetes', 'AWS'],
      bio: 'Certified Master Architect with focused expertise in high-availability systems.',
      isAvailable: true,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBy6YijrrB8egg9iMON59IDboaSCReeUM0Fa28M7fV4jQkotoOslkEbG9OQL0y3naIpx5BTH4RDt61poe8DeTTmeyCaZcYcmFfy1KfhL2I7Zt5j77uagFT17SoCQE9gImOffHTwTNEb6fIEpQiO5skgZIHOC3AxwJLLTXkX27j6Ker8RQOzU7-oNMRj9X4EJS4q4jKlIE9dhppMrysfEql05J_CYnqq8h8GGF03egVGwuby7a3awL0SuF42o0CFwI5AEyvhbe8LLEY'
    },
    { 
      id: 'w2', 
      name: 'Elena Rodriguez', 
      initials: 'ER', 
      email: 'elena.r@design.io', 
      category: 'Interior Architect', 
      status: 'Verified',
      rate: 120,
      rating: 5.0,
      reviews: 94,
      skills: ['3D Modeling', 'Lighting', 'Interiors'],
      bio: 'Transforming spaces with precision and artistic vision.',
      isAvailable: true,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA2YGDYTRVcemqvUjwv6-GmO7OMaPmPEohT4Akg3ahLE7Svv-5pyo19Swyr8v-ug7lyDfhiPgj_2ejPNs3leZKz3jDBE9vH98kypN2ec2eOkthFJyJX0mKKqR35WBZI5O5X7EVQclGgHbg-yqo2lggxm1vpd-h8Z6jZPCwOyg1sVhgeKwd6ZMbV5LvH_n6PwosJh_sibBuJetvuYeZVVc5zRpX_vKQD8uOvSrD4KtZwF5wmNbk4XzN0vrwIExhs4WDBMT3IyLIQto4'
    },
    { 
      id: 'w3', 
      name: 'Sarah Jenkins', 
      initials: 'SJ', 
      email: 'sarah.j@security.io', 
      category: 'Enterprise Security Lead', 
      status: 'Verified',
      rate: 195,
      rating: 4.9,
      reviews: 215,
      skills: ['Cybersecurity', 'SOC2', 'Azure'],
      bio: 'Enterprise security specialist with over 15 years of infrastructure hardening experience.',
      isAvailable: true,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAcuq8zz7T8AZVH5TUwgdKehTUJSSyK9AWXGyv-jPQDhzm-bkZwDvfewYuXfl_xGiiwZ7PEZESBpj9yrfCxL_rEGlEUVPGG8cCn3wXtYxM0C75JWAlipyFH3ufJXIgi1WvcW0sMTN5BRDI9xvnSjdncLYle9zQNe3CNoMlqwOAIfyAyFVDuFXvuOlZjEmN0P4VKGaaarZsOW3B0zhWuqvE1mtfjbj95EEvgu8ly7IpOFDnPZnHi5d0_1AclqEhGVz8bJdEdLN8vyTs'
    },
    { id: 'p1', name: 'Julianne Devis', initials: 'JD', email: 'j.devis@enterprise.com', category: 'Senior Architect', status: 'Priority', rate: 95, rating: 0, reviews: 0, skills: ['AutoCAD'], bio: 'Structural expert.', isAvailable: true, 
      uploadedDocuments: [
        { name: 'Architecture License', status: 'uploaded' } as any,
        { name: 'ID Proof', status: 'uploaded' } as any
      ] 
    },
    { id: 'p2', name: 'Marcus Thorne', initials: 'MT', email: 'm.thorne@design.io', category: 'UI Specialist', status: 'Pending', rate: 85, rating: 0, reviews: 0, skills: ['Figma'], bio: 'UI designer.', isAvailable: true, 
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6joI_sdN7x2Lo6qyBXTuI22FNUFx5x1HZ9F64P1NBebadVOZPnQYVUoatMXbMmbdZWWC6wvjUL0R9icy8SQcAVNNILc1t2YH30fH_9xlqh2kJ5WBF2HVfHpWHqJ-2WXAo90c_Eqjlls7K7vE6rUREM9qBCXgnozUpGkd36-OrakUOWle1qxF6OjzdD5I3ntExrUuA-ckIH9JwaEWl2EQUbwgGbMoMjnhjf-WbZFR0AfF1X9WzgwqTtc2F-gjsDg-76uUeXgdbDlc',
      uploadedDocuments: [
        { name: 'Portfolio Link', status: 'uploaded' } as any,
        { name: 'ID Proof', status: 'uploaded' } as any
      ]
    }
  ];

  workers = signal<WorkerProfile[]>(this.initialWorkers);
  clients = signal<ClientProfile[]>([
    { id: 'c1', name: 'Jonathan Davis', email: 'j.davis@enterprise.com', status: 'Active', tier: 'VIP Account', progress: 100 },
    { id: 'c2', name: 'Elena Lundberg', email: 'elena@creativehub.es', status: 'Active', tier: 'Standard', progress: 85 }
  ]);
  notifications = signal<Notification[]>([]);
  activityLogs = signal<ActivityLog[]>([]);
  bookings = signal<Booking[]>([
    { id: 'b1', clientId: 'c1', clientName: 'Jonathan Davis', clientInitials: 'JD', workerId: 'w1', workerName: 'Alexander Wright', workerInitials: 'AW', service: 'Cloud Architecture', date: 'Oct 24, 2026', earnings: 450, rating: 5, status: 'Approved' }
  ]);
  
  chats = signal<Chat[]>([
    {
      id: 'c1',
      workerId: 'w1',
      name: 'Alexander Wright',
      initials: 'AW',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBy6YijrrB8egg9iMON59IDboaSCReeUM0Fa28M7fV4jQkotoOslkEbG9OQL0y3naIpx5BTH4RDt61poe8DeTTmeyCaZcYcmFfy1KfhL2I7Zt5j77uagFT17SoCQE9gImOffHTwTNEb6fIEpQiO5skgZIHOC3AxwJLLTXkX27j6Ker8RQOzU7-oNMRj9X4EJS4q4jKlIE9dhppMrysfEql05J_CYnqq8h8GGF03egVGwuby7a3awL0SuF42o0CFwI5AEyvhbe8LLEY',
      lastMessage: 'The API documentation is ready...',
      time: '10:45 AM',
      active: true,
      online: true,
      messages: [
        { id: 'm1', text: "Hello! I've completed the initial design sprint for the dashboard UI. I wanted to share the project brief with you for feedback.", time: '10:42 AM', sent: false },
        { id: 'm2', text: "That sounds great, Alexander. Looking forward to seeing the progress. Did you include the dark mode variants?", time: '10:44 AM', sent: true },
        { id: 'm3', text: "Yes, I've added a separate section for the dark mode themes. You can see how the elevation levels translate between the modes.", time: '10:45 AM', sent: false, attachment: { name: 'Project_Brief_v2.pdf', size: '4.2 MB' } }
      ]
    }
  ]);
  
  currentWorker = signal<WorkerProfile>({
    id: 'dw1',
    name: 'David Harrison',
    initials: 'DH',
    email: 'david.h@pro.com',
    category: 'Master Electrician',
    status: 'Draft',
    rate: 85,
    rating: 0,
    reviews: 0,
    isAvailable: true,
    skills: ['Panel Upgrades'],
    bio: 'Professional electrician.'
  });

  currentClient = signal<ClientProfile | null>(null);

  private auth = inject(AuthService);
  private platformId = inject(PLATFORM_ID);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadState();
    }
    
    // Sync with Auth session
    effect(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      
      const user = this.auth.currentUser();
      if (user) {
        if (user.role === 'Worker') {
          const current = this.currentWorker();
          if (current.email !== user.email) {
            const existing = this.workers().find(w => w.email === user.email);
            if (existing) {
              this.currentWorker.set(existing);
            } else {
              this.currentWorker.set({
                id: 'w_' + Math.random().toString(36).substring(7),
                name: user.name,
                initials: user.name.split(' ').map(n => n[0]).join('').toUpperCase(),
                email: user.email,
                category: 'New Professional',
                status: 'Draft',
                rate: 0,
                rating: 0,
                reviews: 0,
                isAvailable: true,
                skills: [],
                bio: ''
              });
            }
          }
        } else if (user.role === 'Client') {
          const current = this.currentClient();
          if (!current || current.email !== user.email) {
            const existing = this.clients().find(c => c.email === user.email);
            if (existing) {
              this.currentClient.set(existing);
            } else {
              const newClient: ClientProfile = {
                id: 'c_' + Math.random().toString(36).substring(7),
                name: user.name,
                email: user.email,
                status: 'Active',
                tier: 'Standard',
                progress: 0
              };
              this.currentClient.set(newClient);
              this.clients.update(prev => [newClient, ...prev]);
            }
          }
        }
      }
    }, { allowSignalWrites: true });

    // Auto-save whenever signals change
    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        this.saveState();
      }
    });
  }

  private saveState() {
    const data = {
      workers: this.workers(),
      clients: this.clients(),
      notifications: this.notifications(),
      activityLogs: this.activityLogs(),
      bookings: this.bookings(),
      currentWorker: this.currentWorker(),
      currentClient: this.currentClient()
    };
    // Note: We strip 'file' objects as they can't be JSON serialized
    const serialized = JSON.parse(JSON.stringify(data, (key, value) => key === 'file' ? undefined : value));
    localStorage.setItem('nestfind_state', JSON.stringify(serialized));
  }

  private loadState() {
    const saved = localStorage.getItem('nestfind_state');
    if (saved) {
      const data = JSON.parse(saved);
      this.workers.set(data.workers || []);
      this.clients.set(data.clients || []);
      // Filter out notifications without a userId (legacy global ones)
      const filteredNotifs = (data.notifications || []).filter((n: any) => !!n.userId);
      this.notifications.set(filteredNotifs);
      this.activityLogs.set(data.activityLogs || []);
      this.bookings.set(data.bookings || []);
      if (data.currentWorker) {
        this.currentWorker.set(data.currentWorker);
      }
      if (data.currentClient) {
        this.currentClient.set(data.currentClient);
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
    if (w.name) score += 20;
    if (w.email) score += 20;
    if (w.category) score += 20;
    if (w.bio) score += 20;
    if (w.skills && w.skills.length > 0) score += 20;
    return score;
  });

  approveWorker(id: string) {
    if (id === this.currentWorker().id) {
       this.currentWorker.update(w => ({ ...w, status: 'Verified' }));
       this.addNotification('Account Verified!', 'Your professional profile is now live in the marketplace.', 'success', id);
    }
    this.workers.update(prev => prev.map(w => w.id === id ? { ...w, status: 'Verified' } : w));
    this.addActivityLog(id, 'approved');
  }

  rejectWorker(id: string, reason: string = '') {
    if (id === this.currentWorker().id) {
       this.currentWorker.update(w => ({ ...w, status: 'Rejected', rejectionReason: reason }));
       this.addNotification('Action Required', `Your verification was rejected: ${reason || 'Please review and resubmit.'}`, 'warning', id);
    }
    this.workers.update(prev => prev.map(w => w.id === id ? { ...w, status: 'Rejected', rejectionReason: reason } : w));
    this.addActivityLog(id, 'rejected', reason);
  }

  resubmitWorker(id: string) {
    if (id === this.currentWorker().id) {
       this.currentWorker.update(w => ({ ...w, status: 'Pending', rejectionReason: undefined }));
       this.addNotification('Application Resubmitted', 'Your updated profile is now being reviewed by our administrators.', 'info', id);
    }
    this.workers.update(prev => prev.map(w => w.id === id ? { ...w, status: 'Pending', rejectionReason: undefined } : w));
    this.addActivityLog(id, 'resubmitted');
  }

  submitForVerification() {
    const worker = this.currentWorker();
    this.currentWorker.update(w => ({ ...w, status: 'Pending' }));
    
    // Ensure worker is in the global list for Admins to see
    this.workers.update(prev => {
      const exists = prev.find(w => w.id === worker.id);
      if (exists) {
        return prev.map(w => w.id === worker.id ? { ...w, status: 'Pending' } : w);
      }
      return [{ ...worker, status: 'Pending' }, ...prev];
    });

    this.addNotification('Application Submitted', 'Your profile is now being reviewed by our administrators.', 'info', this.currentWorker().id);
    this.addActivityLog(this.currentWorker().id, 'submitted');
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
      earnings: worker.rate * 4, // Mock 4 hours
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
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg: ChatMessage = { id: Math.random().toString(), text, time, sent: true };
    this.chats.update(chats => chats.map(c => {
      if (c.id === chatId) {
        return { ...c, lastMessage: text, time, messages: [...c.messages, newMsg] };
      }
      return c;
    }));
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
