import { Component, inject, signal, computed, effect, AfterViewInit, OnDestroy, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { PlatformStateService } from '../../core/services/platform-state.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

@Component({
  selector: 'app-shared-messages',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="messages-shell">
      <aside class="sidebar" [class.sidebar--hidden]="selectedUser() && isMobile">
        <div class="sidebar__header">
          <h2 class="sidebar__title">Messages</h2>
        </div>
        <div class="sidebar__search">
          <mat-icon class="sidebar__search-icon">search</mat-icon>
          <input class="sidebar__search-input" type="text" placeholder="Search conversations..." [(ngModel)]="searchQuery" />
        </div>
        <div class="contact-list">
          <button *ngFor="let c of filteredContacts()" class="contact-item" (click)="selectUser(c)" [class.contact-item--active]="selectedUser()?.id === c.id">
            <div class="avatar" [attr.data-initials]="initials(c.username)"></div>
            <div class="contact-meta">
              <div class="contact-name">{{ c.username }}</div>
              <div class="contact-preview">{{ c.preview }}</div>
            </div>
            <span *ngIf="c.unread" class="contact-unread-indicator">{{ c.unread }}</span>
          </button>
        </div>
      </aside>

      <section class="chat-pane" [class.chat-pane--visible]="selectedUser() || !isMobile">
        <header class="chat-header" *ngIf="selectedUser()">
          <button *ngIf="isMobile" class="back-btn" (click)="selectedUser.set(null)">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="chat-header__meta">
            <div class="avatar avatar--sm" [attr.data-initials]="initials(selectedUser()!.username)"></div>
            <div>
              <div class="chat-header__name">{{ selectedUser()!.username }}</div>
              <div class="chat-header__sub">{{ selectedUser()!.email }}</div>
            </div>
          </div>
          <button class="header-action-btn" (click)="toggleMessageSearch()" [class.active]="isSearchingMessages()">
            <mat-icon>search</mat-icon>
          </button>
        </header>

        <div *ngIf="isSearchingMessages()" class="message-search-bar">
          <mat-icon>manage_search</mat-icon>
          <input type="text" class="message-search-input" placeholder="Search in conversation..." [(ngModel)]="messageSearchQuery" />
          <button (click)="toggleMessageSearch()"><mat-icon>close</mat-icon></button>
        </div>

        <div class="messages-area" #messagesContainer>
          <div *ngIf="!selectedUser()" class="messages-empty">
            <mat-icon>chat_bubble_outline</mat-icon>
            <p>Select a conversation</p>
          </div>

          <div *ngFor="let m of displayedMessages()" class="msg-row" [class.msg-row--sent]="m.sent">
            <div *ngIf="!m.sent" class="msg-avatar">
              <div class="avatar avatar--sm" [attr.data-initials]="initials(selectedUser()?.username || 'U')"></div>
            </div>
            <div class="bubble" [class.bubble--sent]="m.sent">
              <div *ngIf="dateHeaders()[m.id]" class="date-header">{{ dateHeaders()[m.id] }}</div>
              <div class="bubble__text">{{ m.text }}</div>
              <div class="bubble__footer">
                <span class="bubble__time">{{ formatTime(m.time) }}</span>
                <mat-icon *ngIf="m.sent" class="read-status">{{ m.isRead ? 'done_all' : 'done' }}</mat-icon>
              </div>
            </div>
          </div>
          <div *ngIf="isPartnerTyping()" class="typing-indicator">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span>typing...</span>
          </div>
        </div>

        <footer class="input-bar" [style.paddingBottom]="bottomNavGap">
          <div class="input-container">
            <textarea class="input-bar__field" rows="1" [(ngModel)]="messageInput" placeholder="Type a message…"></textarea>
          </div>
          <button class="send-btn" (click)="sendMessage()"><mat-icon>send</mat-icon></button>
        </footer>
      </section>
    </div>
  `,
  styles: [``]
})
export class SharedMessagesComponent implements AfterViewInit, OnDestroy {
  @ViewChild('messagesContainer') private messagesContainerRef!: ElementRef<HTMLElement>;

  private state = inject(PlatformStateService);
  private auth = inject(AuthService);
  private notify = inject(NotificationService);
  private bp = inject(BreakpointObserver);

  searchQuery = signal('');
  messageSearchQuery = signal('');
  isSearchingMessages = signal(false);
  selectedUser = signal<any | null>(null);
  messages = signal<Array<any>>([]);
  messageInput = signal('');
  sendingMessage = signal(false);

  isMobile = false;
  private bpSub: any;

  contacts = computed(() => {
    return this.state.chats().map((c: any) => ({
      id: c.id,
      username: c.name || c.username || 'User',
      email: c.email || '',
      preview: c.lastMessage || '',
      unread: c.unread || 0,
      role: c.role || 'Member',
      image: c.image,
      messages: c.messages || []
    }));
  });

  filteredContacts = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return this.contacts();
    return this.contacts().filter((contact: any) => {
      return contact.username.toLowerCase().includes(query) || contact.email.toLowerCase().includes(query) || contact.preview.toLowerCase().includes(query);
    });
  });

  isPartnerTyping = computed(() => {
    const sel = this.selectedUser();
    return sel ? !!this.state.typingUsers()[sel.id] : false;
  });

  currentMessages = computed(() => {
    return this.messages().filter(m => m.convId === this.selectedUser()?.id);
  });

  displayedMessages = computed(() => {
    const query = this.messageSearchQuery().trim().toLowerCase();
    const messages = this.currentMessages();
    if (!query) return messages;
    return messages.filter((m: any) => m.text.toLowerCase().includes(query));
  });

  dateHeaders = computed(() => {
    const messages = this.displayedMessages();
    const headers: Record<number, string> = {};
    messages.forEach((m: any, i: number) => {
      if (this.shouldShowDateHeader(m, messages[i - 1])) {
        headers[m.id] = this.getDateLabel(m.rawDate || m.time);
      }
    });
    return headers;
  });

  // read bottom-nav height from CSS variable
  get bottomNavGap() {
    try {
      const val = getComputedStyle(document.documentElement).getPropertyValue('--bottom-nav-height');
      return val ? `calc(${val} + 12px)` : '12px';
    } catch {
      return '12px';
    }
  }

  toggleMessageSearch() {
    const next = !this.isSearchingMessages();
    this.isSearchingMessages.set(next);
    if (!next) {
      this.messageSearchQuery.set('');
    }
  }

  shouldShowDateHeader(current: any, previous?: any) {
    if (!current) return false;
    if (!previous) return true;
    const currentDate = new Date(current.rawDate || current.time).toDateString();
    const previousDate = new Date(previous.rawDate || previous.time).toDateString();
    return currentDate !== previousDate;
  }

  getDateLabel(value: any) {
    const date = new Date(value);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  formatTime(value: any) {
    const date = new Date(value);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  ngAfterViewInit(): void {
    this.bpSub = this.bp.observe([Breakpoints.Handset]).subscribe(r => this.isMobile = r.matches);
    setTimeout(() => this.scrollToBottom(), 50);
  }

  ngOnDestroy(): void {
    try { this.bpSub.unsubscribe(); } catch {}
  }

  selectUser(u: any) {
    this.selectedUser.set(u);
    // fetch messages from state.chats if available
    try {
      const chat = (this.state && this.state.chats) ? this.state.chats().find((c: any) => c.id === u.id) : null;
      const msgs = chat && chat.messages ? chat.messages : [];
      this.messages.set(msgs.map((m: any) => ({ ...m, convId: u.id })));
    } catch {
      this.messages.set([]);
    }
    setTimeout(() => this.scrollToBottom(), 40);
  }

  initials(name?: string) {
    if (!name) return 'U';
    return name.split(' ').map(s => s.charAt(0)).slice(0,2).join('').toUpperCase();
  }

  sendMessage() {
    const txt = this.messageInput().trim();
    if (!txt || !this.selectedUser()) return;
    this.sendingMessage.set(true);
    const msg = { id: Date.now(), text: txt, sent: true, convId: this.selectedUser()!.id, time: new Date().toISOString() };
    this.messages.update(arr => [...arr, msg]);
    this.messageInput.set('');
    setTimeout(()=>{ this.sendingMessage.set(false); this.scrollToBottom(); }, 30);
  }

  private scrollToBottom() {
    try { const el = this.messagesContainerRef?.nativeElement; if (el) el.scrollTop = el.scrollHeight; } catch {}
  }
}
