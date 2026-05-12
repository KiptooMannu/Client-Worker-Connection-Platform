import {
  Component, inject, computed, signal, effect,
  OnDestroy, AfterViewInit, ViewChild, ElementRef, ChangeDetectionStrategy, PLATFORM_ID, SecurityContext
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subscription, timeout } from 'rxjs';
import { PlatformStateService, ChatMessage } from '../../core/services/platform-state.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="messages-shell">

      <!-- ── Sidebar ──────────────────────────────────────────────── -->
      <aside class="sidebar" [class.sidebar--hidden]="selectedUser() && isMobile()">

        <div class="sidebar__header">
          <h1 class="sidebar__title">Messages</h1>
          @if (unreadTotal() > 0) {
            <span class="badge badge--total">{{ unreadTotal() }}</span>
            <button class="mark-all-btn" (click)="markAllAsRead()" title="Mark all as read">
              <mat-icon>done_all</mat-icon>
            </button>
          }
        </div>

        @if (currentUserRole() !== 'Worker') {
          <div class="search-wrap">
            <span class="search-icon">
              <mat-icon>search</mat-icon>
            </span>
            <input
              class="search-input"
              type="text"
              placeholder="Search people…"
              [value]="searchQuery()"
              (input)="searchQuery.set($any($event.target).value)" />
            @if (searchQuery()) {
              <button class="search-clear" (click)="searchQuery.set('')">
                <mat-icon>close</mat-icon>
              </button>
            }
          </div>
        }

        <div class="contact-list">

          @if (isSearching()) {
            <div class="empty-state">
              <span class="spinner"></span>
              <p>Searching…</p>
            </div>
          } @else if (filteredUsers().length === 0) {
            <div class="empty-state">
              <mat-icon>forum</mat-icon>
              <p>{{ searchQuery() ? 'No results' : 'No conversations yet' }}</p>
            </div>
          }

          @for (user of filteredUsers(); track user.id) {
            <button
              class="contact-item"
              [class.contact-item--active]="selectedUser()?.id === user.id"
              [class.contact-item--unread]="(user.unread || 0) > 0"
              (click)="selectUser(user)">
              <div class="avatar" [attr.data-initials]="initials(user.username)">
                <span class="online-dot"></span>
              </div>
              <div class="contact-meta">
                <span class="contact-name">{{ user.username }}</span>
                <span class="contact-preview">{{ (user.unread || 0) > 0 ? 'New message' : (user.role || 'Participant') }}</span>
              </div>
              @if ((user.unread || 0) > 0) {
                <span class="contact-unread-indicator"></span>
              } @else if (selectedUser()?.id === user.id) {
                <span class="contact-active-dot"></span>
              }
            </button>
          }

        </div>
      </aside>

      <!-- ── Chat Pane ─────────────────────────────────────────────── -->
      <section class="chat-pane" [class.chat-pane--visible]="selectedUser() || !isMobile()">

        @if (!selectedUser()) {
          <!-- Empty state -->
          <div class="chat-empty">
            <div class="chat-empty__icon">
              <mat-icon>mark_chat_unread</mat-icon>
            </div>
            <h2>Select a conversation</h2>
            <p>Choose a contact from the left to start messaging</p>
          </div>

        } @else {
          <!-- Chat header -->
          <header class="chat-header">
            @if (isMobile()) {
              <button class="back-btn" (click)="selectedUser.set(null)">
                <mat-icon>arrow_back</mat-icon>
              </button>
            }
            <div class="avatar avatar--sm" [attr.data-initials]="initials(selectedUser()!.username)">
              <span class="online-dot"></span>
            </div>
            <div class="chat-header__meta">
              <span class="chat-header__name">{{ selectedUser()!.username }}</span>
              <span class="chat-header__sub">{{ selectedUser()!.email }}</span>
            </div>
            <div class="chat-header__actions">
              <button class="header-action-btn" (click)="toggleMessageSearch()" [class.active]="isSearchingMessages()">
                <mat-icon>search</mat-icon>
              </button>
            </div>
            <span class="role-pill">{{ selectedUser()!.role }}</span>
          </header>

          @if (isSearchingMessages()) {
            <div class="message-search-bar animate-in slide-in-from-top-2">
              <mat-icon>manage_search</mat-icon>
              <input 
                type="text" 
                placeholder="Search in conversation..." 
                [value]="messageSearchQuery()"
                (input)="messageSearchQuery.set($any($event.target).value)"
                #msgSearchInput>
              <button (click)="toggleMessageSearch()"><mat-icon>close</mat-icon></button>
            </div>
          }

          <!-- Messages scroll area -->
          <div class="messages-area" #messagesContainer>

            @if (isLoadingMessages()) {
              <div class="messages-loading">
                <span class="spinner spinner--dark"></span>
                <p>Loading messages…</p>
              </div>
            } @else if (currentMessages().length === 0) {
              <div class="messages-empty">
                <mat-icon>chat_bubble_outline</mat-icon>
                <p>No messages yet — say hello!</p>
              </div>
            } @else {
              @for (msg of displayedMessages(); track msg.id) {
                <div class="msg-row" [class.msg-row--sent]="msg.sent">
                  <div class="bubble" [class.bubble--sent]="msg.sent" [class.bubble--recv]="!msg.sent">
                    @if (msg.attachment) {
                      <div class="bubble__attachment">
                        <mat-icon>insert_drive_file</mat-icon>
                        <span class="attachment-name">Attachment</span>
                        <a [href]="$any(msg.attachment).url" target="_blank" class="attachment-download">
                          <mat-icon>download</mat-icon>
                        </a>
                      </div>
                    }
                    <p class="bubble__text" [innerHTML]="highlightText(msg.text)"></p>
                    <span class="bubble__time">{{ msg.time }}</span>
                  </div>
                </div>
              }
            }

          </div>

          <!-- Input bar -->
          <footer class="input-bar">
            <input type="file" #fileInput (change)="onFileSelected($event)" style="display: none">
            <button class="attach-btn" (click)="fileInput.click()" [disabled]="sendingMessage()">
              <mat-icon>add_circle_outline</mat-icon>
            </button>
            
            <div class="input-container">
              @if (pendingFile()) {
                <div class="pending-file">
                  <mat-icon>description</mat-icon>
                  <span>{{ pendingFile()!.name }}</span>
                  <button (click)="pendingFile.set(null)"><mat-icon>close</mat-icon></button>
                </div>
              }
              <textarea
                class="input-bar__field"
                rows="1"
                placeholder="Type a message…"
                [value]="messageInput()"
                (input)="messageInput.set($any($event.target).value)"
                (keydown)="onKeydown($event)"></textarea>
            </div>

            <button
              class="send-btn"
              [disabled]="(messageInput().trim().length === 0 && !pendingFile()) || sendingMessage()"
              (click)="sendMessage()">
              @if (sendingMessage()) {
                <span class="spinner spinner--white"></span>
              } @else {
                <mat-icon>send</mat-icon>
              }
            </button>
          </footer>
        }

      </section>
    </div>
  `,
  styles: [`
    /* ── Layout ──────────────────────────────────────────────────── */
    .messages-shell {
      display: grid;
      grid-template-columns: 320px 1fr;
      height: calc(100vh - 120px);
      min-height: 500px;
      border-radius: 20px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 32px rgba(0,0,0,.07);
      background: #fff;
      font-family: 'DM Sans', 'Segoe UI', sans-serif;
    }

    @media (max-width: 768px) {
      .messages-shell { grid-template-columns: 1fr; }
      .sidebar--hidden { display: none; }
      .chat-pane { display: none; }
      .chat-pane--visible { display: flex; }
    }

    /* ── Sidebar ─────────────────────────────────────────────────── */
    .sidebar {
      display: flex;
      flex-direction: column;
      border-right: 1px solid #f1f5f9;
      background: #f8fafc;
      overflow: hidden;
    }

    .sidebar__header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 24px 20px 16px;
    }

    .sidebar__title {
      font-size: 1.25rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      letter-spacing: -0.4px;
    }

    .badge--total {
      background: #4f46e5;
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 99px;
    }

    .mark-all-btn {
      margin-left: auto;
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      display: flex;
      padding: 4px;
      border-radius: 6px;
      transition: all .2s;
    }
    .mark-all-btn:hover {
      background: #eef2ff;
      color: #4f46e5;
    }
    .mark-all-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }

    /* ── Search ──────────────────────────────────────────────────── */
    .search-wrap {
      position: relative;
      padding: 0 16px 12px;
    }
    .search-icon {
      position: absolute;
      left: 28px;
      top: 50%;
      transform: translateY(-60%);
      color: #94a3b8;
      display: flex;
    }
    .search-icon mat-icon { font-size: 18px; }
    .search-input {
      width: 100%;
      padding: 9px 36px 9px 38px;
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      font-size: 13px;
      background: #fff;
      color: #0f172a;
      outline: none;
      transition: border-color .15s, box-shadow .15s;
      box-sizing: border-box;
    }
    .search-input:focus {
      border-color: #4f46e5;
      box-shadow: 0 0 0 3px rgba(79,70,229,.12);
    }
    .search-clear {
      position: absolute;
      right: 28px;
      top: 50%;
      transform: translateY(-60%);
      background: none;
      border: none;
      cursor: pointer;
      color: #94a3b8;
      display: flex;
      padding: 0;
    }
    .search-clear mat-icon { font-size: 16px; }

    /* ── Contact list ────────────────────────────────────────────── */
    .contact-list {
      flex: 1;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: #e2e8f0 transparent;
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 12px 20px;
      background: none;
      border: none;
      cursor: pointer;
      text-align: left;
      border-bottom: 1px solid #f1f5f9;
      transition: background .12s;
      position: relative;
    }
    .contact-item:hover { background: #f1f5f9; }
    .contact-item--active { background: #eef2ff !important; }

    .contact-item--unread {
      background: rgba(79, 70, 229, 0.03);
      border-left: 3px solid #4f46e5;
    }
    .contact-item--unread .contact-name {
      font-weight: 800;
      color: #0f172a;
    }
    .contact-item--unread .contact-preview {
      font-weight: 600;
      color: #334155;
    }

    .contact-meta {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .contact-name {
      font-size: 14px;
      font-weight: 500;
      color: #475569;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .contact-preview {
      font-size: 12px;
      font-weight: 400;
      color: #94a3b8;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 2px;
    }
    .contact-unread-indicator {
      width: 10px;
      height: 10px;
      background: #4f46e5;
      border-radius: 50%;
      flex-shrink: 0;
      box-shadow: 0 0 0 4px rgba(79,70,229,.1);
    }
    .contact-active-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #4f46e5;
      flex-shrink: 0;
    }

    /* ── Avatar ──────────────────────────────────────────────────── */
    .avatar {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: #4f46e5;
      color: #fff;
      font-size: 12px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      position: relative;
    }
    .avatar::after {
      content: attr(data-initials);
    }
    .avatar--sm {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      font-size: 11px;
    }
    .avatar__badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: #ef4444;
      color: #fff;
      font-size: 9px;
      font-weight: 800;
      padding: 1px 5px;
      border-radius: 99px;
      border: 2px solid #f8fafc;
      z-index: 1;
    }
    .online-dot {
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 10px;
      height: 10px;
      background: #22c55e;
      border-radius: 50%;
      border: 2px solid #fff;
    }

    /* ── Empty / loading states ──────────────────────────────────── */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      gap: 8px;
      color: #94a3b8;
    }
    .empty-state mat-icon { font-size: 36px; opacity: .4; }
    .empty-state p { font-size: 12px; margin: 0; }

    /* ── Chat pane ───────────────────────────────────────────────── */
    .chat-pane {
      display: flex;
      flex-direction: column;
      background: #fff;
      overflow: hidden;
    }

    .chat-empty {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      color: #94a3b8;
      padding: 40px;
    }
    .chat-empty__icon {
      width: 72px;
      height: 72px;
      background: #f1f5f9;
      border-radius: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .chat-empty__icon mat-icon { font-size: 36px; color: #cbd5e1; }
    .chat-empty h2 { font-size: 1.1rem; font-weight: 700; color: #475569; margin: 0; }
    .chat-empty p  { font-size: 13px; margin: 0; text-align: center; }

    /* ── Chat header ─────────────────────────────────────────────── */
    .chat-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 24px;
      border-bottom: 1px solid #f1f5f9;
      background: #f8fafc;
    }
    .back-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: #475569;
      display: flex;
      padding: 0;
    }
    .chat-header__meta {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .chat-header__name {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
    }
    .chat-header__sub {
      font-size: 11px;
      color: #94a3b8;
    }
    .role-pill {
      background: #eef2ff;
      color: #4f46e5;
      font-size: 10px;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 99px;
      text-transform: uppercase;
      letter-spacing: .5px;
    }

    /* ── Messages area ───────────────────────────────────────────── */
    .messages-area {
      flex: 1;
      overflow-y: auto;
      padding: 24px 24px 8px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      scrollbar-width: thin;
      scrollbar-color: #e2e8f0 transparent;
      scroll-behavior: smooth;
    }

    .messages-loading,
    .messages-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex: 1;
      gap: 10px;
      color: #94a3b8;
      margin: auto;
      padding: 40px;
    }
    .messages-loading mat-icon,
    .messages-empty mat-icon { font-size: 32px; opacity: .4; }
    .messages-loading p,
    .messages-empty p { font-size: 13px; margin: 0; }

    /* ── Message bubbles ─────────────────────────────────────────── */
    .msg-row {
      display: flex;
      margin-bottom: 6px;
    }
    .msg-row--sent { justify-content: flex-end; }

    .bubble {
      max-width: 68%;
      padding: 10px 14px;
      border-radius: 18px;
      position: relative;
      word-break: break-word;
    }
    .bubble--sent {
      background: #4f46e5;
      color: #fff;
      border-bottom-right-radius: 4px;
    }
    .bubble--recv {
      background: #f1f5f9;
      color: #0f172a;
      border-bottom-left-radius: 4px;
    }
    .bubble__text {
      font-size: 13.5px;
      line-height: 1.5;
      margin: 0;
    }
    .bubble__time {
      display: block;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: .4px;
      text-transform: uppercase;
      margin-top: 4px;
      opacity: .6;
    }

    /* ── Input bar ───────────────────────────────────────────────── */
    .input-bar {
      display: flex;
      align-items: flex-end;
      gap: 10px;
      padding: 16px 20px;
      border-top: 1px solid #f1f5f9;
      background: #f8fafc;
    }
    .input-bar__field {
      flex: 1;
      padding: 10px 14px;
      border: 1.5px solid #e2e8f0;
      border-radius: 14px;
      font-size: 13px;
      color: #0f172a;
      background: #fff;
      resize: none;
      outline: none;
      font-family: inherit;
      line-height: 1.5;
      max-height: 120px;
      overflow-y: auto;
      transition: border-color .15s, box-shadow .15s;
    }
    .input-bar__field:focus {
      border-color: #4f46e5;
      box-shadow: 0 0 0 3px rgba(79,70,229,.12);
    }

    .send-btn {
      width: 44px;
      height: 44px;
      border-radius: 14px;
      background: #4f46e5;
      color: #fff;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background .15s, transform .1s;
    }
    .send-btn:hover:not(:disabled) { background: #4338ca; transform: scale(1.05); }
    .send-btn:active:not(:disabled) { transform: scale(.97); }
    .send-btn:disabled { background: #e2e8f0; cursor: not-allowed; }
    .send-btn mat-icon { font-size: 20px; }

    /* ── Message Search Bar ───────────────────────────────────────── */
    .message-search-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 24px;
      background: #f8fafc;
      border-bottom: 1px solid #eef2ff;
      border-top: 1px solid #eef2ff;
    }
    .message-search-bar mat-icon { font-size: 18px; color: #94a3b8; }
    .message-search-bar input {
      flex: 1;
      border: none;
      background: none;
      font-size: 13px;
      color: #0f172a;
      outline: none;
    }
    .message-search-bar button {
      background: none;
      border: none;
      cursor: pointer;
      color: #94a3b8;
      display: flex;
      padding: 0;
    }

    .header-action-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: #94a3b8;
      display: flex;
      padding: 8px;
      border-radius: 8px;
      transition: all .2s;
    }
    .header-action-btn:hover { background: #f1f5f9; color: #4f46e5; }
    .header-action-btn.active { background: #eef2ff; color: #4f46e5; }

    /* ── Attachments ─────────────────────────────────────────────── */
    .bubble__attachment {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      background: rgba(255,255,255,0.1);
      border-radius: 12px;
      margin-bottom: 8px;
      border: 1px solid rgba(255,255,255,0.05);
    }
    .bubble--recv .bubble__attachment {
      background: #fff;
      border-color: #e2e8f0;
    }
    .attachment-name { font-size: 12px; font-weight: 600; flex: 1; }
    .attachment-download { color: inherit; display: flex; opacity: .8; transition: opacity .2s; }
    .attachment-download:hover { opacity: 1; }
    .attachment-download mat-icon { font-size: 16px; }

    .attach-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: #94a3b8;
      display: flex;
      padding: 8px;
      border-radius: 50%;
      transition: all .2s;
    }
    .attach-btn:hover { color: #4f46e5; background: #eef2ff; }

    .input-container { flex: 1; display: flex; flex-direction: column; gap: 8px; }
    .pending-file {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 10px;
      background: #eef2ff;
      border-radius: 8px;
      font-size: 11px;
      color: #4f46e5;
      font-weight: 600;
      width: fit-content;
    }
    .pending-file button {
      background: none;
      border: none;
      cursor: pointer;
      color: #4f46e5;
      display: flex;
      padding: 0;
    }
    .pending-file mat-icon { font-size: 14px; width: 14px; height: 14px; }

    /* ── Spinner ─────────────────────────────────────────────────── */
    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(79,70,229,.2);
      border-top-color: #4f46e5;
      border-radius: 50%;
      animation: spin .7s linear infinite;
      display: inline-block;
      flex-shrink: 0;
    }
    .spinner--white {
      border-color: rgba(255,255,255,.3);
      border-top-color: #fff;
    }
    .spinner--dark {
      border-color: rgba(15,23,42,.1);
      border-top-color: #0f172a;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class SharedMessagesComponent implements OnDestroy, AfterViewInit {

  @ViewChild('messagesContainer') private messagesContainerRef!: ElementRef<HTMLElement>;
  @ViewChild('msgSearchInput') private msgSearchInputRef!: ElementRef<HTMLInputElement>;

  private http = inject(HttpClient);
  private state = inject(PlatformStateService);
  private notification = inject(NotificationService);
  private auth = inject(AuthService);
  private sanitizer = inject(DomSanitizer);
  private apiUrl = environment.apiUrl;
  private platformId = inject(PLATFORM_ID);

  // ── UI state ────────────────────────────────────────────────────
  searchQuery = signal('');
  selectedUser = signal<UserContact | null>(null);
  messageInput = signal('');
  sendingMessage = signal(false);
  isLoadingMessages = signal(false);
  searchResults = signal<UserContact[]>([]);
  isSearching = signal(false);
  allUsers = this.state.allUsers; // Use shared signal from state service
  isMobile = signal(false);

  // Message Search
  isSearchingMessages = signal(false);
  messageSearchQuery = signal('');

  // Attachments
  pendingFile = signal<File | null>(null);

  // FIX BUG 1: track whether the initial user load has been started
  // to prevent the search effect from triggering a duplicate/cancelled request
  private usersLoadStarted = false;

  // ── Derived ─────────────────────────────────────────────────────
  currentUserId = computed(() => this.auth.currentUser()?.id || '');
  currentUserRole = computed(() => this.auth.currentUser()?.role || '');
  unreadTotal = computed(() => this.state.unreadMessagesCount());

  recentUsers = computed<UserContact[]>(() => {
    const allU = this.allUsers();
    return this.state.chats().map(chat => {
      // Use email/role from chat if available, otherwise look up in allUsers
      const found = allU.find(u => u.id === chat.id);
      const email = chat.email || found?.email || '';
      const role = chat.role || found?.role || '';
      return {
        id: chat.id,
        username: chat.name,
        email: email,
        role: role,
        unread: chat.unread || 0
      };
    });
  });

  filteredUsers = computed<UserContact[]>(() => {
    const q = this.searchQuery().trim();
    const all = this.allUsers();
    const recent = this.recentUsers();

    if (!q) {
      // DEFAULT: Only show active conversations (Email Inbox style)
      return recent;
    }

    // SEARCH ACTIVE: Search across the entire directory (Fallbacks included)
    const directory = all.length > 0 ? all : [
      ...this.state.workers().map(w => ({ id: w.id, username: w.name, email: w.email, role: 'Worker' })),
      ...this.state.clients().map(c => ({ id: c.id, username: c.name, email: c.email, role: 'Client' }))
    ];

    const qLower = q.toLowerCase();
    return directory.filter(u => {
      const name = (u.username || u.fullName || u.name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const role = (u.role || '').toLowerCase();
      return name.includes(qLower) || email.includes(qLower) || role.includes(qLower);
    });
  });

  currentMessages = computed<ChatMessage[]>(() => {
    const sel = this.selectedUser();
    if (!sel) return [];
    return this.state.chats().find(c => c.id === sel.id)?.messages ?? [];
  });

  displayedMessages = computed<ChatMessage[]>(() => {
    const msgs = this.currentMessages();
    const q = this.messageSearchQuery().trim().toLowerCase();
    if (!q || !this.isSearchingMessages()) return msgs;

    return msgs.filter(m => m.text.toLowerCase().includes(q));
  });

  // ── Subscriptions ────────────────────────────────────────────────
  private searchDebounce: any;
  private userLoadSubscription: Subscription | null = null;
  private searchSubscription: Subscription | null = null;
  private conversationFetchSubscription: Subscription | null = null;

  constructor() {
    // Safely detect mobile in the browser
    if (isPlatformBrowser(this.platformId)) {
      this.isMobile.set(window.innerWidth < 768);
    }

    // Load contacts once when user is authenticated
    // FIX NG0506: Defer loading to avoid blocking hydration
    effect(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      const user = this.auth.currentUser();
      if (user && !this.usersLoadStarted) {
        this.usersLoadStarted = true;
        // Defer user loading to after hydration completes
        setTimeout(() => this.loadUsers(), 200);
      }
    });

    // Handle search with proper state management
    effect(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      const q = this.searchQuery().trim();
      clearTimeout(this.searchDebounce);

      if (q.length === 0) {
        this.searchResults.set([]);
        this.isSearching.set(false);
        return;
      }

      if (q.length >= 2) {
        this.isSearching.set(true);
        this.searchDebounce = setTimeout(() => this.serverSearch(q), 500);
      } else {
        this.searchResults.set([]);
        this.isSearching.set(false);
      }
    });

    // Fetch conversation when user is selected
    effect(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      const sel = this.selectedUser();
      if (!sel) {
        this.isLoadingMessages.set(false);
        return;
      }

      this.isLoadingMessages.set(true);

      if (this.conversationFetchSubscription) {
        this.conversationFetchSubscription.unsubscribe();
      }

      // Add a safety timeout to prevent infinite spinning if the backend hangs
      // FIX NG0506: Increased from 8s to 15s to allow hydration to complete
      const safetyTimer = setTimeout(() => {
        if (this.isLoadingMessages()) {
          console.warn('[Messages] Conversation fetch safety timeout reached');
          this.isLoadingMessages.set(false);
        }
      }, 15000);

      const result = this.state.fetchConversation(sel.id, sel.username);

      if (result && typeof result === 'object' && 'subscribe' in result) {
        this.conversationFetchSubscription = (result as any).subscribe({
          next: () => {
            clearTimeout(safetyTimer);
            this.isLoadingMessages.set(false);
            this.scrollToBottom();
          },
          error: (err: HttpErrorResponse) => {
            clearTimeout(safetyTimer);
            console.error('Failed to fetch conversation:', err);
            this.isLoadingMessages.set(false);
            if (err.status === 0) {
              this.notification.error('Network error - please check your connection');
            } else if (err.status === 504) {
              this.notification.error('Conversation is taking too long to load');
            } else {
              this.notification.error('Failed to load messages');
            }
          }
        });
      } else {
        clearTimeout(safetyTimer);
        setTimeout(() => {
          this.isLoadingMessages.set(false);
        }, 500);
      }
    });

    // Auto-scroll when messages arrive
    effect(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      const msgs = this.currentMessages();
      if (msgs.length > 0 && !this.isLoadingMessages()) {
        this.scrollToBottom();
      }
    });

    this.state.isMessagingActive.set(true);
  }

  ngAfterViewInit() {
    this.scrollToBottom();
  }

  ngOnDestroy() {
    this.state.isMessagingActive.set(false);
    clearTimeout(this.searchDebounce);

    if (this.userLoadSubscription) {
      this.userLoadSubscription.unsubscribe();
    }
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
    if (this.conversationFetchSubscription) {
      this.conversationFetchSubscription.unsubscribe();
    }
  }

  loadUsers() {
    const user = this.auth.currentUser();
    if (!user) return;

    if (user.role === 'Worker') return;

    if (this.userLoadSubscription) {
      this.userLoadSubscription.unsubscribe();
    }

    if (user.role === 'Admin') {
      // FIX NG0506: Add timeout to prevent hanging during hydration
      this.userLoadSubscription = this.http.get<any>(`${this.apiUrl}/admin/users`).pipe(
        timeout(12000)  // Increased timeout to 12s
      ).subscribe({
        next: (res: any) => {
          const data: any[] = res.content || res || [];
          const mapped = data
            .filter(u => u.id !== this.currentUserId())
            .map(u => ({
              id: u.id,
              username: u.fullName || u.username,
              email: u.email,
              role: u.role
                ? u.role.charAt(0) + u.role.slice(1).toLowerCase()
                : 'User',
              unread: 0
            }));
          
          this.state.allUsers.set(mapped);
          this.isSearching.set(false);
        },
        error: (err: HttpErrorResponse) => {
          console.error('Failed to load users:', err);
          this.usersLoadStarted = false; // allow retry on next auth event
          this.isSearching.set(false);
          if (err.status === 401) {
            this.auth.logout();
          } else if (err.status === 0) {
            this.notification.error('Network error - please check your connection');
          } else if (err.status === 504) {
            this.notification.error('Server is not responding - please try again later');
          } else {
            this.notification.error('Failed to load contacts. Please refresh the page.');
          }
        }
      });
      return;
    }

    // FIX NG0506: Add timeout to prevent hanging during hydration
    this.userLoadSubscription = this.http.get<any>(
      `${this.apiUrl}/messages/contacts?page=0&size=50`
    ).pipe(
      timeout(12000)  // Increased timeout to 12s
    ).subscribe({
      next: (res: any) => {
        const list: any[] = res.content ?? res;
        this.allUsers.set(
          list
            .filter(u => u.id !== this.currentUserId())
            .map(u => ({
              ...u,
              role: u.role
                ? u.role.charAt(0) + u.role.slice(1).toLowerCase()
                : 'Participant'
            }))
        );
        this.isSearching.set(false);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Failed to load contacts:', err);
        this.usersLoadStarted = false; // allow retry on next auth event
        this.isSearching.set(false);
        if (err.status === 401) {
          this.auth.logout();
        } else if (err.status === 0) {
          this.notification.error('Network error - please check your connection');
        } else if (err.status === 504) {
          this.notification.error('Server is not responding - please try again later');
        } else {
          this.notification.error('Failed to load conversations. Please refresh the page.');
        }
      }
    });
  }

  private serverSearch(query: string) {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }

    const startTime = Date.now();
    console.log(`[Search] Started at ${new Date(startTime).toLocaleTimeString()}`);

    const localResults = this.allUsers().filter(u =>
      u.username.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase())
    );

    if (localResults.length > 0) {
      console.log(`[Search] Local results found: ${localResults.length} users`);
      this.searchResults.set(localResults);
      this.isSearching.set(false);

      this.searchSubscription = this.http.get<any>(
        `${this.apiUrl}/messages/contacts/search?q=${encodeURIComponent(query)}&page=0&size=20`,
        { timeout: 10000 }
      ).subscribe({
        next: (res: any) => {
          const duration = Date.now() - startTime;
          console.log(`[Search] Server search completed in ${duration}ms`);
          const list: any[] = res.content ?? res;
          const serverResults = list
            .filter(u => u.id !== this.currentUserId())
            .map(u => ({
              ...u,
              role: u.role ? u.role.charAt(0) + u.role.slice(1).toLowerCase() : 'Participant'
            }));

          const merged = [...localResults, ...serverResults.filter(s =>
            !localResults.some(l => l.id === s.id)
          )];
          this.searchResults.set(merged);
          this.isSearching.set(false);
        },
        error: (err: HttpErrorResponse) => {
          const duration = Date.now() - startTime;
          console.error(`[Search] Server search failed or timed out after ${duration}ms`, err);
          this.isSearching.set(false);
          // Fallback to local results if server fails
          this.searchResults.set(localResults);
        }
      });
      return;
    }

    this.searchSubscription = this.http.get<any>(
      `${this.apiUrl}/messages/contacts/search?q=${encodeURIComponent(query)}&page=0&size=20`
    ).pipe(timeout(10000)).subscribe({
      next: (res: any) => {
        const duration = Date.now() - startTime;
        console.log(`[Search] Server search completed in ${duration}ms`);
        const list: any[] = res.content ?? res;
        this.searchResults.set(
          list
            .filter(u => u.id !== this.currentUserId())
            .map(u => ({
              ...u,
              role: u.role ? u.role.charAt(0) + u.role.slice(1).toLowerCase() : 'Participant'
            }))
        );
        this.isSearching.set(false);
      },
      error: (err: any) => {
        const duration = Date.now() - startTime;
        console.error(`[Search] Server search failed or timed out after ${duration}ms`, err);
        this.isSearching.set(false);
        this.searchResults.set([]);

        if (err.status === 0 || err.name === 'TimeoutError') {
          this.notification.error('Network error or timeout - please check your connection');
        } else if (err.status === 504) {
          this.notification.error('Search is taking too long - please try again');
        } else {
          this.notification.error('Search failed - please try again');
        }
      }
    });
  }

  selectUser(user: UserContact) {
    // FIX BUG 4: Do NOT set isLoadingMessages here.
    // The selectedUser effect is the single owner of that state.
    this.selectedUser.set(user);
    this.messageInput.set('');

    if ((user.unread ?? 0) > 0) {
      this.state.markConversationAsRead(user.id);
    }
  }

  sendMessage() {
    const content = this.messageInput().trim();
    const file = this.pendingFile();
    const sel = this.selectedUser();
    if ((!content && !file) || !sel || this.sendingMessage()) return;

    this.sendingMessage.set(true);

    if (file) {
      this.state.uploadMessageAttachment(file).subscribe({
        next: (res) => {
          this.finishSendMessage(sel.id, content, res.url);
          this.pendingFile.set(null);
        },
        error: (err) => {
          console.error('File upload failed', err);
          this.notification.error('Failed to upload file');
          this.sendingMessage.set(false);
        }
      });
    } else {
      this.finishSendMessage(sel.id, content);
    }
  }

  private finishSendMessage(receiverId: string, content: string, attachmentUrl?: string) {
    this.state.sendMessageToUser(receiverId, content, attachmentUrl).subscribe({
      next: () => {
        this.messageInput.set('');
        this.sendingMessage.set(false);
        this.scrollToBottom();
      },
      error: (err: any) => {
        console.error('Failed to send message:', err);
        this.sendingMessage.set(false);
        if (err.status === 0 || err.name === 'TimeoutError') {
          this.notification.error('Network error - message not sent');
        } else {
          this.notification.error('Failed to send message');
        }
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        this.notification.error('File too large (max 10MB)');
        return;
      }
      this.pendingFile.set(file);
    }
  }

  toggleMessageSearch() {
    this.isSearchingMessages.update(v => !v);
    if (this.isSearchingMessages()) {
      setTimeout(() => this.msgSearchInputRef?.nativeElement?.focus(), 100);
    } else {
      this.messageSearchQuery.set('');
    }
  }

  highlightText(text: string): string {
    const q = this.messageSearchQuery().trim();
    if (!q || !this.isSearchingMessages()) {
      return this.sanitizer.sanitize(SecurityContext.HTML, text) || '';
    }
    
    const escapedQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQ})`, 'gi');
    const highlighted = text.replace(regex, '<mark class="bg-amber-200 rounded px-1">$1</mark>');
    return this.sanitizer.sanitize(SecurityContext.HTML, highlighted) || '';
  }

  markAllAsRead() {
    this.state.chats().forEach(chat => {
      if ((chat.unread || 0) > 0) {
        this.state.markConversationAsRead(chat.id);
      }
    });
    this.notification.success('All messages marked as read');
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
    const el = event.target as HTMLTextAreaElement;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }

  initials(name: string): string {
    return (name || 'U')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase();
  }

  private scrollToBottom() {
    setTimeout(() => {
      const el = this.messagesContainerRef?.nativeElement;
      if (el) {
        el.scrollTo({
          top: el.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 100);
  }
}