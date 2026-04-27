import { Injectable, signal, computed, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from './auth.service';

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
  private initialWorkers: WorkerProfile[] = [
    {
      id: 'w1',
      name: 'John Kamau',
      initials: 'JK',
      email: 'john.k@worker.com',
      category: 'Plumber',
      status: 'Verified',
      rate: 15,
      rating: 4.8,
      reviews: 32,
      skills: ['Pipe Fitting', 'Water Heater Repair', 'Drain Cleaning'],
      bio: 'Experienced plumber serving the local community for over 10 years. Fast, reliable, and affordable.',
      isAvailable: true,
      image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=200&auto=format&fit=crop',
      location: 'Nairobi',
      preferredLocations: ['Westlands', 'Kilimani'],
      workHistory: [{ company: 'City Plumbers', role: 'Lead Plumber', period: '2015 - 2022', description: 'Handled residential and commercial repairs.' }],
      certifications: [{ name: 'Master Plumbing License', issuer: 'NCA', year: '2014' }],
      availabilityDetails: { weekdays: true, weekends: true, evenings: false }
    },
    {
      id: 'w2',
      name: 'Grace Wanjiku',
      initials: 'GW',
      email: 'grace.w@worker.com',
      category: 'Cleaner',
      status: 'Verified',
      rate: 10,
      rating: 5.0,
      reviews: 84,
      skills: ['Deep Cleaning', 'Office Cleaning', 'Laundry'],
      bio: 'Detail-oriented cleaner providing spotless results for homes and small businesses.',
      isAvailable: true,
      image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=200&auto=format&fit=crop',
      location: 'Mombasa',
      preferredLocations: ['Nyali', 'Bamburi'],
      workHistory: [{ company: 'Sparkle Clean', role: 'Cleaning Supervisor', period: '2018 - 2023', description: 'Managed a team of 5 cleaners.' }],
      certifications: [{ name: 'Industrial Cleaning Cert', issuer: 'Kenyatta Univ', year: '2017' }],
      availabilityDetails: { weekdays: true, weekends: false, evenings: true }
    },
    {
      id: 'w3',
      name: 'Samuel Ochieng',
      initials: 'SO',
      email: 'sam.o@worker.com',
      category: 'Electrician',
      status: 'Verified',
      rate: 18,
      rating: 4.9,
      reviews: 45,
      skills: ['Wiring', 'Fault Finding', 'Panel Upgrades'],
      bio: 'Certified electrician specializing in residential wiring and quick emergency repairs.',
      isAvailable: true,
      image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=200&auto=format&fit=crop',
      location: 'Kisumu',
      preferredLocations: ['Milimani', 'Kondele'],
      workHistory: [{ company: 'Power Grid Ltd', role: 'Technician', period: '2010 - 2019', description: 'Maintained substation components.' }],
      certifications: [{ name: 'Class A Electrician', issuer: 'EPRA', year: '2010' }],
      availabilityDetails: { weekdays: true, weekends: true, evenings: true }
    },
    {
      id: 'p1', name: 'Peter Njoroge', initials: 'PN', email: 'peter.n@worker.com', category: 'Mechanic', status: 'Priority', rate: 20, rating: 0, reviews: 0, skills: ['Engine Repair'], bio: 'Specialist in all car models.', isAvailable: true,
      location: 'Nairobi',
      preferredLocations: ['Industrial Area', 'South B'],
      workHistory: [],
      certifications: [],
      availabilityDetails: { weekdays: true, weekends: true, evenings: false },
      uploadedDocuments: [
        { name: 'Mechanic Certificate', status: 'uploaded', type: 'Certification' },
        { name: 'National ID', status: 'uploaded', type: 'Identification' }
      ]
    },
    {
      id: 'p2', name: 'Mary Atieno', initials: 'MA', email: 'mary.a@worker.com', category: 'Farm Worker', status: 'Pending', rate: 8, rating: 0, reviews: 0, skills: ['Harvesting', 'Planting'], bio: 'Hardworking farm assistant.', isAvailable: true,
      image: 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?q=80&w=200&auto=format&fit=crop',
      location: 'Nakuru',
      preferredLocations: ['Njoro', 'Molo'],
      workHistory: [],
      certifications: [],
      availabilityDetails: { weekdays: true, weekends: true, evenings: false },
      uploadedDocuments: [
        { name: 'Reference Letter', status: 'uploaded', type: 'Work History' },
        { name: 'National ID', status: 'uploaded', type: 'Identification' }
      ]
    }
  ];

  workers = signal<WorkerProfile[]>(this.initialWorkers);
  clients = signal<ClientProfile[]>([
    { id: 'c1', name: 'James Mutua', email: 'james@home.com', status: 'Active', tier: 'Homeowner', progress: 100 },
    { id: 'c2', name: 'City Garage', email: 'manager@citygarage.co.ke', status: 'Active', tier: 'Business', progress: 85 }
  ]);
  notifications = signal<Notification[]>([]);
  activityLogs = signal<ActivityLog[]>([]);
  bookings = signal<Booking[]>([
    { id: 'b1', clientId: 'c1', clientName: 'James Mutua', clientInitials: 'JM', workerId: 'w1', workerName: 'John Kamau', workerInitials: 'JK', service: 'Plumbing Repair', date: 'Oct 24, 2026', earnings: 45, rating: 5, status: 'Approved' }
  ]);

  chats = signal<Chat[]>([
    {
      id: 'c1',
      workerId: 'w1',
      name: 'John Kamau',
      initials: 'JK',
      image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=200&auto=format&fit=crop',
      lastMessage: 'I can come tomorrow morning to check the pipes.',
      time: '10:45 AM',
      active: true,
      online: true,
      messages: [
        { id: 'm1', text: "Hello! My kitchen sink is leaking heavily. Are you available today?", time: '10:42 AM', sent: false },
        { id: 'm2', text: "I'm currently on another job, but I can come tomorrow morning at 9 AM.", time: '10:44 AM', sent: true },
        { id: 'm3', text: "That works for me. See you then.", time: '10:45 AM', sent: false }
      ]
    }
  ]);

  currentWorker = signal<WorkerProfile>({
    id: 'dw1',
    name: 'Kevin Omondi',
    initials: 'KO',
    email: 'worker@pro.com',
    category: 'Mechanic',
    status: 'Draft',
    rate: 25,
    rating: 0,
    reviews: 0,
    isAvailable: true,
    skills: ['Brake Replacement'],
    bio: 'Automotive mechanic.',
    location: 'Nairobi',
    preferredLocations: ['Westlands'],
    workHistory: [],
    certifications: [],
    availabilityDetails: { weekdays: true, weekends: false, evenings: false }
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
                category: 'Plumber',
                status: 'Draft',
                rate: 0,
                rating: 0,
                reviews: 0,
                isAvailable: true,
                skills: [],
                bio: '',
                location: '',
                preferredLocations: [],
                workHistory: [],
                certifications: [],
                availabilityDetails: { weekdays: true, weekends: false, evenings: false }
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
