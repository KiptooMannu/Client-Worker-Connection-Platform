import { Component, inject, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { HttpClient } from '@angular/common/http';
import { PlatformStateService } from '../../core/services/platform-state.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

interface MessageData {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  content: string;
  sentAt: string;
  isRead: boolean;
}

interface UserContact {
  id: string;
  username: string;
  email: string;
  role: string;
  unread?: number;
}

@Component({
  selector: 'app-shared-messages',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatSelectModule
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-black text-slate-900 tracking-tighter mb-2">Messages</h1>
        <p class="text-slate-500">Communicate with users on the platform</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Users List -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="p-6 border-b border-slate-100">
              <h2 class="text-lg font-bold text-slate-900 mb-4">Contacts</h2>
              @if (currentUserRole() !== 'Worker') {
                <input 
                  type="text" 
                  placeholder="Search users..." 
                  [(ngModel)]="searchQuery"
                  class="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              }
            </div>

            <div class="overflow-y-auto max-h-[600px]">
              <div class="px-6 py-2 bg-slate-50 border-b border-slate-100">
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  @if (searchQuery()) { Search Results } @else { Recent Chats }
                </span>
              </div>
              
              @if (filteredUsers().length === 0) {
                <div class="p-8 text-center">
                  <mat-icon class="text-slate-200 !text-4xl mb-2">forum</mat-icon>
                  <p class="text-slate-500 text-xs">No conversations found</p>
                </div>
              }
              @for (user of filteredUsers(); track user.id) {
                <div 
                  (click)="selectUser(user)"
                  [class.bg-indigo-50]="selectedUser()?.id === user.id"
                  class="px-6 py-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors relative group">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-black text-xs uppercase group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                        {{ user.username.substring(0, 2) }}
                      </div>
                      <div>
                        <p class="font-bold text-slate-900 text-sm">{{ user.username }}</p>
                        <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest">{{ user.role || 'Participant' }}</p>
                      </div>
                    </div>
                    <div class="flex flex-col items-end gap-2">
                      @if (selectedUser()?.id === user.id) {
                        <span class="w-2 h-2 bg-indigo-600 rounded-full"></span>
                      }
                      @if (user.unread && user.unread > 0) {
                        <span class="px-2 py-0.5 bg-indigo-600 text-white text-[9px] font-black rounded-full shadow-lg shadow-indigo-600/20 animate-pulse">
                          {{ user.unread }}
                        </span>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Messaging Area -->
        <div class="lg:col-span-2">
          @if (selectedUser()) {
            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
              <!-- Chat Header -->
              <div class="p-6 border-b border-slate-100 bg-slate-50">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="font-bold text-slate-900">{{ selectedUser()?.username }}</h3>
                    <p class="text-xs text-slate-500">{{ selectedUser()?.email }}</p>
                  </div>
                  <span class="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                    {{ selectedUser()?.role }}
                  </span>
                </div>
              </div>

              <!-- Messages Area -->
              <div class="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
                @if (currentMessages().length === 0) {
                  <div class="flex items-center justify-center h-full text-slate-400 text-sm">
                    <p>No messages yet. Start a conversation!</p>
                  </div>
                }
                @for (msg of currentMessages(); track msg.id) {
                  <div class="flex mb-4" [class.flex-row-reverse]="msg.senderId === currentUserId()">
                    <div 
                      [class.bg-indigo-600]="msg.senderId === currentUserId()"
                      [class.bg-slate-100]="msg.senderId !== currentUserId()"
                      [class.text-white]="msg.senderId === currentUserId()"
                      [class.text-slate-700]="msg.senderId !== currentUserId()"
                      [class.rounded-br-none]="msg.senderId === currentUserId()"
                      [class.rounded-bl-none]="msg.senderId !== currentUserId()"
                      class="max-w-[70%] px-4 py-2.5 rounded-2xl shadow-sm">
                      <p class="text-sm leading-relaxed">{{ msg.content }}</p>
                      <p class="text-[9px] mt-1 font-bold uppercase tracking-wider" 
                         [class.text-indigo-200]="msg.senderId === currentUserId()" 
                         [class.text-slate-400]="msg.senderId !== currentUserId()">
                        {{ formatTime(msg.sentAt) }}
                      </p>
                    </div>
                  </div>
                }
              </div>

              <!-- Input Area -->
              <div class="p-6 border-t border-slate-100 bg-slate-50">
                <div class="flex gap-3">
                  <textarea 
                    [(ngModel)]="messageInput"
                    (keyup.enter)="messageInput().length > 0 && !($any($event).shiftKey) && sendMessage()"
                    placeholder="Type your message..." 
                    class="flex-1 px-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    rows="2"></textarea>
                  <button 
                    (click)="sendMessage()"
                    [disabled]="messageInput().trim().length === 0 || sendingMessage()"
                    class="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-semibold text-sm flex items-center gap-2">
                    @if (sendingMessage()) {
                      <span class="animate-spin"><mat-icon class="!text-lg">hourglass_top</mat-icon></span>
                    } @else {
                      <mat-icon class="!text-lg">send</mat-icon>
                    }
                    Send
                  </button>
                </div>
              </div>
            </div>
          } @else {
            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm h-[600px] flex items-center justify-center">
              <div class="text-center text-slate-400">
                <mat-icon class="!text-5xl mb-4 opacity-50">mail_outline</mat-icon>
                <p class="text-lg font-semibold">Select a contact to message</p>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class SharedMessagesComponent {
  private http = inject(HttpClient);
  private state = inject(PlatformStateService);
  private notification = inject(NotificationService);
  private auth = inject(AuthService);

  private apiUrl = environment.apiUrl;
  
  searchQuery = signal('');
  selectedUser = signal<UserContact | null>(null);
  messageInput = signal('');
  sendingMessage = signal(false);
  currentMessages = signal<MessageData[]>([]);

  allUsers = signal<UserContact[]>([]);
  currentUserId = computed(() => this.auth.currentUser()?.id || '');
  currentUserRole = computed(() => this.auth.currentUser()?.role || '');

  // Derived from global state to ensure consistency across the app
  recentUsers = computed(() => {
    return this.state.chats().map(chat => ({
      id: chat.id,
      username: chat.name,
      email: '', // Not provided in Chat object, but okay for display
      role: '',   // Not provided in Chat object
      unread: chat.unread
    }));
  });

  filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const recent = this.recentUsers();
    const all = this.allUsers();

    if (!query) {
      // If no recent chats, suggest a few users to start chatting
      if (recent.length === 0 && all.length > 0) {
        return all.slice(0, 5);
      }
      return recent;
    }
    
    return all.filter(u => 
      u.username?.toLowerCase().includes(query) || 
      u.email?.toLowerCase().includes(query)
    );
  });

  constructor() {
    this.loadUsers();
    
    // Reload messages when selected user changes
    effect(() => {
      const selected = this.selectedUser();
      if (selected) {
        this.loadConversation();
      }
    });
  }

  loadUsers() {
    // Only fetch all users if allowed to search (Admins and Clients)
    if (this.currentUserRole() === 'Worker') return;

    this.http.get<any[]>(`${this.apiUrl}/messages/users`).subscribe({
      next: (users) => {
        console.log('[Messages] Loaded search index:', users.length);
        const filtered = users
          .filter(u => u.id !== this.currentUserId())
          .map(u => ({
            ...u,
            role: u.role ? u.role.charAt(0) + u.role.slice(1).toLowerCase() : 'Participant'
          }));
        this.allUsers.set(filtered);
      },
      error: (err) => {
        console.error('[Messages] Error loading users:', err);
        // Fallback: if search fails, we still have recentUsers from signals
      }
    });
  }

  selectUser(user: UserContact) {
    this.selectedUser.set(user);
    this.messageInput.set('');
    
    // Mark as read when selected
    if (user.unread && user.unread > 0) {
      this.state.markConversationAsRead(user.id);
    }
  }

  loadConversation() {
    const selectedUser = this.selectedUser();
    if (!selectedUser) return;

    this.http.get<MessageData[]>(
      `${this.apiUrl}/messages/conversation?user1Id=${this.currentUserId()}&user2Id=${selectedUser.id}`
    ).subscribe({
      next: (messages) => {
        this.currentMessages.set(messages);
        // Auto-scroll to bottom
        setTimeout(() => {
          const messagesContainer = document.querySelector('.overflow-y-auto:has(.space-y-4)');
          if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
          }
        }, 100);
      },
      error: (err) => {
        console.error('Error loading conversation:', err);
        this.notification.error('Failed to load messages');
      }
    });
  }

  sendMessage() {
    const content = this.messageInput().trim();
    const selectedUser = this.selectedUser();
    
    if (!content || !selectedUser || this.sendingMessage()) return;

    this.sendingMessage.set(true);

    const payload = {
      senderId: this.currentUserId(),
      receiverId: selectedUser.id,
      content: content
    };

    this.http.post<MessageData>(`${this.apiUrl}/messages`, payload).subscribe({
      next: (response) => {
        this.currentMessages.update(msgs => [...msgs, response]);
        this.messageInput.set('');
        this.sendingMessage.set(false);
        this.notification.success('Message sent!');
        
        // Auto-scroll to bottom
        setTimeout(() => {
          const messagesContainer = document.querySelector('.overflow-y-auto:has(.space-y-4)');
          if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
          }
        }, 100);
      },
      error: (err) => {
        console.error('Error sending message:', err);
        this.sendingMessage.set(false);
        this.notification.error('Failed to send message');
      }
    });
  }

  formatTime(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }
}
