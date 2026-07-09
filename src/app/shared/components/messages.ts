import {
  Component, inject, computed, signal, effect, HostListener,
  OnDestroy, AfterViewInit, ViewChild, ElementRef, ChangeDetectionStrategy, PLATFORM_ID, SecurityContext
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
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
  image?: string;
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

        <!-- Action Bar -->
        <div class="action-bar">
          @if (!showBulkActions()) {
            <button 
              class="action-btn" 
              [class.active]="showArchive()" 
              (click)="toggleArchiveView()"
              title="Toggle archive">
              <mat-icon>{{ showArchive() ? 'inbox' : 'archive' }}</mat-icon>
              <span>{{ showArchive() ? 'Inbox' : 'Archive' }}</span>
            </button>
            
            <button 
              class="action-btn" 
              [class.active]="showTrash()"
              (click)="toggleTrashView()"
              title="Toggle trash">
              <mat-icon>{{ showTrash() ? 'inbox' : 'delete' }}</mat-icon>
              <span>{{ showTrash() ? 'Inbox' : 'Trash' }}</span>
            </button>
            
            <button 
              class="action-btn" 
              (click)="showBulkActions.set(true)"
              title="Select multiple">
              <mat-icon>checklist</mat-icon>
              <span>Select</span>
            </button>
          } @else {
            <div class="bulk-select-header">
              <button class="action-btn" (click)="toggleSelectAll()" title="Toggle Select All">
                <mat-icon>{{ isAllSelected() ? 'check_box' : 'check_box_outline_blank' }}</mat-icon>
              </button>
              <span class="selected-count">{{ selectedConversations().size }} selected</span>
              
              <div class="bulk-actions-group">
                @if (selectedConversations().size > 0) {
                  @if (showTrash()) {
                    <button class="action-btn pill" (click)="bulkRestore()" title="Restore selected">
                      <mat-icon>restore</mat-icon>
                    </button>
                    <button class="action-btn danger-pill" (click)="bulkPermanentlyDelete()" title="Permanently delete selected">
                      <mat-icon>delete_forever</mat-icon>
                    </button>
                  } @else {
                    <button class="action-btn danger-pill" (click)="bulkDelete()" title="Delete selected">
                      <mat-icon>delete</mat-icon>
                    </button>
                    @if (showArchive()) {
                      <button class="action-btn pill" (click)="bulkUnarchive()" title="Unarchive selected">
                        <mat-icon>unarchive</mat-icon>
                      </button>
                    } @else {
                      <button class="action-btn pill" (click)="bulkArchive()" title="Archive selected">
                        <mat-icon>archive</mat-icon>
                      </button>
                    }
                  }
                }
                <button class="action-btn close-pill" (click)="exitSelectMode()" title="Exit select mode">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            </div>
          }
        </div>
        
        <!-- Search bar - Restricted to Admins for global search, Clients/Workers can filter existing chats -->
        <div class="search-wrap">
          <span class="search-icon">
            <mat-icon>search</mat-icon>
          </span>
          <input
            class="search-input"
            type="text"
            [placeholder]="currentUserRole() === 'Admin' ? 'Search people...' : 'Search your messages...'"
            [value]="searchQuery()"
            (input)="searchQuery.set($any($event.target).value)" />
          @if (searchQuery()) {
            <button class="search-clear" (click)="searchQuery.set('')">
              <mat-icon>close</mat-icon>
            </button>
          }
        </div>

        <div class="contact-list">

          @if (isSearching()) {
            <div class="empty-state">
              <span class="spinner"></span>
              <p>Searching…</p>
            </div>
          } @else if (filteredUsers().length === 0) {
            <div class="empty-state">
              <mat-icon>{{ showTrash() ? 'delete' : (showArchive() ? 'archive' : 'forum') }}</mat-icon>
              <p>{{ searchQuery() ? 'No results' : (showTrash() ? 'Trash is empty' : (showArchive() ? 'No archived conversations' : 'No conversations yet')) }}</p>
            </div>
          }

          @for (user of filteredUsers(); track user.id + '_' + $index) {
            <div class="contact-item-wrapper">
              @if (showBulkActions() && !isSearching()) {
                <div class="contact-checkbox">
                  <input 
                    type="checkbox" 
                    [checked]="selectedConversations().has(user.id)"
                    (change)="toggleSelectConversation(user.id)" />
                </div>
              }
              <button
                class="contact-item"
                [class.contact-item--active]="selectedUser()?.id === user.id"
                [class.contact-item--unread]="(user.unread || 0) > 0"
                (click)="!showBulkActions() ? selectUser(user) : toggleSelectConversation(user.id)">
                <div class="avatar" [attr.data-initials]="initials(user.username)">
                  <span class="online-dot"></span>
                </div>
                <div class="contact-meta">
                  <span class="contact-name">{{ user.username }}</span>
                  @if (showTrash() && 'daysRemaining' in user) {
                    <span class="contact-preview">{{ user.daysRemaining }} days remaining</span>
                  } @else {
                    <span class="contact-preview">{{ (user.unread || 0) > 0 ? 'New message' : (user.role || 'Participant') }}</span>
                  }
                </div>
                <div class="contact-actions">
                  @if ((user.unread || 0) > 0) {
                    <span class="contact-unread-indicator"></span>
                  }
                  @if (!showBulkActions()) {
                    <button 
                      class="contact-menu-btn" 
                      (click)="$event.stopPropagation(); toggleMenu(user.id)"
                      title="More options">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                  }
                </div>
              </button>
              
              <!-- Context Menu -->
              @if (activeMenu() === user.id) {
                <div class="context-menu" (click)="$event.stopPropagation()">
                  @if (showTrash()) {
                    <button (click)="restoreConversation(user.id); closeMenu()">
                      <mat-icon>restore</mat-icon>
                      Restore
                    </button>
                    <button class="danger" (click)="permanentlyDeleteConversation(user.id); closeMenu()">
                      <mat-icon>delete_forever</mat-icon>
                      Delete Forever
                    </button>
                  } @else {
                    <button (click)="markConversationAsRead(user.id); closeMenu()">
                      <mat-icon>mark_email_read</mat-icon>
                      Mark as read
                    </button>
                    @if (showArchive()) {
                      <button (click)="unarchiveConversation(user.id); closeMenu()">
                        <mat-icon>unarchive</mat-icon>
                        Unarchive
                      </button>
                    } @else {
                      <button (click)="archiveConversation(user.id); closeMenu()">
                        <mat-icon>archive</mat-icon>
                        Archive
                      </button>
                    }
                    <button class="danger" (click)="deleteConversation(user.id); closeMenu()">
                      <mat-icon>delete</mat-icon>
                      Delete
                    </button>
                  }
                </div>
              }
            </div>
          }
        </div>
      </aside>

      <!-- Delete Confirmation Modal -->
      @if (showDeleteConfirm()) {
        <div class="modal-overlay" (click)="cancelDelete()">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3>Delete Conversation</h3>
            <p>Are you sure you want to delete this conversation? This action cannot be undone.</p>
            <div class="modal-actions">
              <button class="btn-secondary" (click)="cancelDelete()">Cancel</button>
              <button class="btn-danger" (click)="confirmDelete(showDeleteConfirm()!)">Delete</button>
            </div>
          </div>
        </div>
      }

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
              @for (msg of displayedMessages(); track msg.id; let i = $index) {
                
                @if (shouldShowDateHeader(msg, displayedMessages()[i-1])) {
                  <div class="date-header">
                    <span>{{ getDateLabel(msg.rawDate) }}</span>
                  </div>
                }

                <div class="msg-row" [class.msg-row--sent]="msg.sent">
                  @if (!msg.sent) {
                    <div class="msg-avatar">
                      @if (selectedUser()?.image) {
                        <img [src]="selectedUser()?.image" alt="User">
                      } @else {
                        {{ initials(selectedUser()?.username || 'U') }}
                      }
                    </div>
                  }
                  <div class="bubble" [class.bubble--sent]="msg.sent" [class.bubble--recv]="!msg.sent">
                    @if (msg.attachment) {
                      @if (isImage($any(msg.attachment).url)) {
                        <div class="bubble__image-preview">
                          <img [src]="$any(msg.attachment).url" alt="Attachment" (click)="openFullImage($any(msg.attachment).url)">
                        </div>
                      } @else {
                        <div class="bubble__attachment">
                          <mat-icon>insert_drive_file</mat-icon>
                          <span class="attachment-name">{{ getFileName($any(msg.attachment).url) }}</span>
                          <a [href]="$any(msg.attachment).url" target="_blank" class="attachment-download">
                            <mat-icon>download</mat-icon>
                          </a>
                        </div>
                      }
                    }
                    <p class="bubble__text" [innerHTML]="highlightText(msg.text)"></p>
                    <div class="bubble__footer">
                      <span class="bubble__time">{{ msg.time }}</span>
                      @if (msg.sent) {
                        <mat-icon class="read-status" [class.read-status--seen]="msg.isRead">
                          {{ msg.isRead ? 'done_all' : 'done' }}
                        </mat-icon>
                      }
                    </div>
                  </div>
                </div>
              }
            }
            
            @if (isPartnerTyping()) {
              <div class="typing-indicator animate-in fade-in zoom-in-95">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <span>typing...</span>
              </div>
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
      align-items: flex-end;
    }
    .msg-row--sent { justify-content: flex-end; }

    .msg-avatar {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      background: #f1f5f9;
      color: #64748b;
      font-size: 10px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 8px;
      flex-shrink: 0;
      overflow: hidden;
      margin-bottom: 4px;
    }
    .msg-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

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
    .bubble__image-preview {
      margin-bottom: 8px;
      border-radius: 12px;
      overflow: hidden;
      cursor: pointer;
      max-width: 260px;
    }
    .bubble__image-preview img {
      width: 100%;
      height: auto;
      display: block;
      transition: transform .2s;
    }
    .bubble__image-preview:hover img { transform: scale(1.02); }

    .bubble__text {
      font-size: 13.5px;
      line-height: 1.5;
      margin: 0;
    }
    .bubble__time {
      font-size: 10px;
      opacity: .7;
      margin-top: 4px;
      display: block;
    }
    .bubble__footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 4px;
      margin-top: 2px;
    }
    .bubble--recv .bubble__footer {
      justify-content: flex-start;
    }
    .read-status {
      font-size: 14px;
      width: 14px;
      height: 14px;
      color: rgba(255, 255, 255, 0.6);
    }
    .read-status--seen {
      color: #fff;
    }
    .bubble--recv .read-status {
      display: none;
    }

    .date-header {
      display: flex;
      justify-content: center;
      margin: 20px 0;
      position: relative;
    }
    .date-header::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background: #f1f5f9;
      z-index: 0;
    }
    .date-header span {
      position: relative;
      background: #fff;
      padding: 4px 12px;
      border-radius: 99px;
      font-size: 10px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: .5px;
      z-index: 1;
      border: 1px solid #f1f5f9;
    }

    .typing-indicator {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 8px 16px;
      background: #f8fafc;
      border-radius: 12px;
      width: fit-content;
      margin-bottom: 8px;
    }
    .typing-dot {
      width: 4px;
      height: 4px;
      background: #94a3b8;
      border-radius: 50%;
      animation: typingAnimation 1.4s infinite ease-in-out;
    }
    .typing-dot:nth-child(2) { animation-delay: .2s; }
    .typing-dot:nth-child(3) { animation-delay: .4s; }
    .typing-indicator span {
      font-size: 10px;
      font-weight: 600;
      color: #94a3b8;
      margin-left: 4px;
    }
    @keyframes typingAnimation {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
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

    /* Action Bar */
    .action-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      border-bottom: 1px solid #f1f5f9;
      background: #fff;
      min-height: 58px;
      box-sizing: border-box;
    }

    .action-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 6px 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      color: #475569;
      cursor: pointer;
      transition: all .2s;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .action-btn mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      line-height: 16px;
      flex-shrink: 0;
    }

    .action-btn:hover {
      background: #f1f5f9;
      color: #4f46e5;
    }

    .action-btn.active {
      background: #eef2ff;
      color: #4f46e5;
      border-color: #4f46e5;
    }

    .bulk-select-header {
      display: flex;
      align-items: center;
      width: 100%;
      gap: 8px;
      animation: fadeIn 0.2s ease-in-out;
    }

    .bulk-actions-group {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-left: auto;
    }

    .action-btn.pill {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 20px;
    }
    .action-btn.pill:hover {
      background: #e2e8f0;
    }
    
    .action-btn.danger-pill {
      background: #fee2e2;
      border: 1px solid #fca5a5;
      color: #dc2626;
      border-radius: 20px;
    }
    .action-btn.danger-pill:hover {
      background: #fecaca;
      color: #b91c1c;
    }

    .action-btn.close-pill {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 20px;
      color: #64748b;
    }
    .action-btn.close-pill:hover {
      background: #e2e8f0;
      color: #334155;
    }

    .selected-count {
      font-size: 12px;
      font-weight: 600;
      color: #4f46e5;
      background: #eef2ff;
      padding: 4px 8px;
      border-radius: 20px;
      white-space: nowrap;
    }

    .contact-item-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
    }

    .contact-checkbox {
      padding-left: 12px;
      flex-shrink: 0;
    }

    .contact-checkbox input {
      cursor: pointer;
      width: 18px;
      height: 18px;
    }

    .contact-actions {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }

    .contact-menu-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: #94a3b8;
      display: flex;
      padding: 4px;
      border-radius: 4px;
      opacity: 0;
      transition: all .2s;
    }

    .contact-item-wrapper:hover .contact-menu-btn {
      opacity: 1;
    }

    .contact-menu-btn:hover {
      background: #e2e8f0;
      color: #475569;
    }

    /* Context Menu */
    .context-menu {
      position: absolute;
      right: 20px;
      top: 45px;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,.1);
      z-index: 1000;
      min-width: 160px;
      overflow: hidden;
      animation: fadeIn 0.15s ease-in-out;
    }

    .context-menu button {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 10px 16px;
      background: none;
      border: none;
      text-align: left;
      font-size: 13px;
      color: #475569;
      cursor: pointer;
      transition: background .2s;
    }

    .context-menu button:hover {
      background: #f1f5f9;
    }

    .context-menu button.danger {
      color: #dc2626;
    }

    .context-menu button.danger:hover {
      background: #fee2e2;
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      animation: fadeIn 0.2s ease-in-out;
    }

    .modal {
      background: #fff;
      border-radius: 12px;
      padding: 24px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,.1);
    }

    .modal h3 {
      margin: 0 0 12px 0;
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
    }

    .modal p {
      margin: 0 0 20px 0;
      font-size: 14px;
      color: #475569;
    }

    .modal-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .btn-secondary, .btn-danger {
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all .2s;
    }

    .btn-secondary {
      background: #f1f5f9;
      color: #475569;
    }

    .btn-secondary:hover {
      background: #e2e8f0;
    }

    .btn-danger {
      background: #dc2626;
      color: #fff;
    }

    .btn-danger:hover {
      background: #b91c1c;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
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
  private route = inject(ActivatedRoute);

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

  // New signals for Archive, Delete and Bulk actions
  showArchive = signal(false);
  showTrash = signal(false);
  showDeleteConfirm = signal<string | null>(null); // Stores ID of conversation to delete
  showBulkActions = signal(false);
  selectedConversations = signal<Set<string>>(new Set());
  activeMenu = signal<string | null>(null);
  deletedChats = signal<Map<string, number>>(new Map()); // userId -> deletion timestamp

  // FIX BUG 1: track whether the initial user load has been started
  // to prevent the search effect from triggering a duplicate/cancelled request
  private usersLoadStarted = false;

  // ── Derived ─────────────────────────────────────────────────────
  currentUserId = computed(() => this.auth.currentUser()?.id || '');
  currentUserRole = computed(() => this.auth.currentUser()?.role || '');
  unreadTotal = computed(() => this.state.unreadMessagesCount());
  isPartnerTyping = computed(() => {
    const sel = this.selectedUser();
    return sel ? !!this.state.typingUsers()[sel.id] : false;
  });

  // FIXED: Deduplicate users to prevent duplicate IDs in the list
  recentUsers = computed<UserContact[]>(() => {
    const allU = this.allUsers();
    const chats = this.state.chats();

    // Use Map to ensure unique IDs
    const uniqueUsers = new Map<string, UserContact>();

    chats.forEach(chat => {
      const found = allU.find(u => u.id === chat.id);
      const email = chat.email || found?.email || '';
      const role = chat.role || found?.role || '';

      uniqueUsers.set(chat.id, {
        id: chat.id,
        username: chat.name,
        email: email,
        role: role,
        unread: chat.unread || 0,
        image: chat.image || found?.image
      });
    });

    return Array.from(uniqueUsers.values());
  });

  archivedUsers = computed<UserContact[]>(() => {
    const allU = this.allUsers();
    const archivedChats = this.state.chats().filter(c => c.archived);
    
    const uniqueArchived = new Map<string, UserContact>();
    
    archivedChats.forEach(chat => {
      const found = allU.find(u => u.id === chat.id);
      const email = chat.email || found?.email || '';
      const role = chat.role || found?.role || '';
      
      uniqueArchived.set(chat.id, {
        id: chat.id,
        username: chat.name,
        email: email,
        role: role,
        unread: chat.unread || 0,
        image: chat.image || found?.image
      });
    });
    
    return Array.from(uniqueArchived.values());
  });

  trashUsers = computed<UserContact[]>(() => {
    const allU = this.allUsers();
    const deleted = this.deletedChats();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    const uniqueTrash = new Map<string, UserContact & { deletionDate: number; daysRemaining: number }>();
    
    deleted.forEach((timestamp, userId) => {
      // Skip expired items
      if (now - timestamp > thirtyDaysMs) return;
      
      const found = allU.find(u => u.id === userId);
      const chat = this.state.chats().find(c => c.id === userId);
      const name = chat?.name || found?.username || 'Unknown User';
      const email = chat?.email || found?.email || '';
      const role = chat?.role || found?.role || '';
      const image = chat?.image || found?.image;
      
      const daysRemaining = Math.ceil((thirtyDaysMs - (now - timestamp)) / (24 * 60 * 60 * 1000));
      
      uniqueTrash.set(userId, {
        id: userId,
        username: name,
        email: email,
        role: role,
        unread: 0,
        image: image,
        deletionDate: timestamp,
        daysRemaining: daysRemaining
      } as UserContact & { deletionDate: number; daysRemaining: number });
    });
    
    return Array.from(uniqueTrash.values()).sort((a, b) => b.deletionDate - a.deletionDate);
  });

  activeUsers = computed<UserContact[]>(() => {
    return this.recentUsers().filter(u => {
      const chat = this.state.chats().find(c => c.id === u.id);
      return !chat?.archived;
    });
  });

  filteredUsers = computed<UserContact[]>(() => {
    const q = this.searchQuery().trim();
    const all = this.allUsers();
    
    let source: UserContact[];
    if (this.showTrash()) {
      source = this.trashUsers();
    } else if (this.showArchive()) {
      source = this.archivedUsers();
    } else {
      source = this.activeUsers();
    }

    if (!q) {
      return source;
    }

    // SEARCH ACTIVE: Only Admins can search the global directory.
    // Clients and Workers can only filter their existing recent/archived chats.
    const qLower = q.toLowerCase();
    const filteredSource = source.filter(u => {
      const name = (u.username || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      return name.includes(qLower) || email.includes(qLower);
    });

    if (this.currentUserRole() !== 'Admin') {
      return filteredSource;
    }

    // Admins: search across the entire directory (Fallbacks included)
    const directory = all.length > 0 ? all : [
      ...this.state.workers().map(w => ({ id: w.id, username: w.name, email: w.email, role: 'Worker' })),
      ...this.state.clients().map(c => ({ id: c.id, username: c.name, email: c.email, role: 'Client' }))
    ];

    // Also deduplicate directory results
    const uniqueDirectory = Array.from(
      new Map(directory.map(u => [u.id, u])).values()
    );

    return uniqueDirectory.filter(u => {
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

    // Handle clientId from query params for direct navigation to conversation
    effect(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      const clientId = this.route.snapshot.queryParamMap.get('clientId');
      console.log('Messages component - clientId from query:', clientId);
      if (clientId) {
        // Find the user in the contact list
        const user = this.allUsers().find(u => u.id === clientId);
        console.log('Found user in allUsers:', user);
        if (user) {
          this.selectUser(user);
        } else {
          // If not in recent users, try to load them
          this.loadUsers();
          // Wait a bit and try again
          setTimeout(() => {
            const found = this.allUsers().find(u => u.id === clientId);
            console.log('Found user after reload:', found);
            if (found) {
              this.selectUser(found);
            }
          }, 500);
        }
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

    // SYNC: Auto-select chat if PlatformState has an active one
    effect(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      const chats = this.state.chats();
      const active = chats.find(c => c.active);
      if (active) {
        const current = this.selectedUser();
        if (!current || current.id !== active.id) {
          this.selectedUser.set({
            id: active.id,
            username: active.name,
            email: active.email || '',
            role: active.role || '',
            unread: 0,
            image: active.image
          });
        }
      }
    });

    this.state.isMessagingActive.set(true);
  }

  @HostListener('window:resize')
  onResize() {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobile.set(window.innerWidth < 768);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    this.closeMenu();
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

    // if (user.role === 'Worker') return; // REMOVED: Workers need to load their contacts too!

    if (this.userLoadSubscription) {
      this.userLoadSubscription.unsubscribe();
    }

    if (user.role === 'Admin') {
      // Use cached users if available to prevent redundant heavy requests
      if (this.state.allUsers().length > 0) {
        console.log('[Messages] Using cached admin users:', this.state.allUsers().length);
        this.isSearching.set(false);
        return;
      }

      // FIX NG0506: Add timeout to prevent hanging during hydration
      this.userLoadSubscription = this.http.get<any>(`${this.apiUrl}/admin/users`).pipe(
        timeout(30000)  // Increased timeout to 30s
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
              unread: 0,
              image: u.profileImage || u.image
            }));

          this.state.allUsers.set(mapped);
          this.isSearching.set(false);
        },
        error: (err: HttpErrorResponse) => {
          console.error('Failed to load users:', err);
          this.usersLoadStarted = false;
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


    this.userLoadSubscription = this.http.get<any>(
      `${this.apiUrl}/messages/contacts?page=0&size=50`
    ).pipe(
      timeout(30000)
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
                : 'Participant',
              image: u.image || u.profileImage
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
        { timeout: 20000 }
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
    ).pipe(timeout(20000)).subscribe({
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
    this.selectedUser.set(user);
    this.messageInput.set('');

    // Update state service so it knows which chat is active
    this.state.setActiveChat(user.id);

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
    const user = this.auth.currentUser();
    if (!user) return;
    
    this.state.markAllConversationsAsRead(user.id).subscribe();
  }

  toggleArchiveView() {
    this.showArchive.update(v => !v);
    this.showTrash.set(false); // Close trash when opening archive
    this.selectedUser.set(null); // Clear selected user when switching views
    this.selectedConversations.set(new Set()); // Clear selections
    this.showBulkActions.set(false);
    
    if (this.showArchive()) {
      const user = this.auth.currentUser();
      if (user) {
        this.state.fetchArchivedConversations(user.id).subscribe();
      }
    }
  }

  toggleTrashView() {
    this.showTrash.update(v => !v);
    this.showArchive.set(false); // Close archive when opening trash
    this.selectedUser.set(null); // Clear selected user when switching views
    this.selectedConversations.set(new Set()); // Clear selections
    this.showBulkActions.set(false);
    
    if (this.showTrash()) {
      this.loadDeletedChats();
    }
  }

  loadDeletedChats() {
    const user = this.auth.currentUser();
    if (!user) return;
    
    const deletedKey = `deleted_chats_${user.id}`;
    const deletedData = JSON.parse(localStorage.getItem(deletedKey) || '[]');
    
    const deletedMap = new Map<string, number>();
    for (const item of deletedData) {
      if (typeof item === 'string') {
        deletedMap.set(item, Date.now() - 30 * 24 * 60 * 60 * 1000 + 1);
      } else if (item && item.id && item.timestamp) {
        deletedMap.set(item.id, item.timestamp);
      }
    }
    
    this.deletedChats.set(deletedMap);
  }

  toggleSelectConversation(userId: string) {
    this.selectedConversations.update(selected => {
      const newSet = new Set(selected);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  }

  isAllSelected(): boolean {
    let currentList: UserContact[];
    if (this.showTrash()) {
      currentList = this.trashUsers();
    } else if (this.showArchive()) {
      currentList = this.archivedUsers();
    } else {
      currentList = this.activeUsers();
    }
    return currentList.length > 0 && 
           currentList.every(u => this.selectedConversations().has(u.id));
  }

  toggleSelectAll() {
    if (this.isAllSelected()) {
      this.selectedConversations.set(new Set());
    } else {
      let currentList: UserContact[];
      if (this.showTrash()) {
        currentList = this.trashUsers();
      } else if (this.showArchive()) {
        currentList = this.archivedUsers();
      } else {
        currentList = this.activeUsers();
      }
      this.selectedConversations.set(new Set(currentList.map(u => u.id)));
    }
  }

  bulkDelete() {
    const conversationIds = Array.from(this.selectedConversations());
    if (conversationIds.length === 0) return;
    
    if (confirm(`Delete ${conversationIds.length} conversation(s)? This action cannot be undone.`)) {
      const user = this.auth.currentUser();
      if (!user) return;
      
      const deletePromises = conversationIds.map(id => 
        new Promise((resolve, reject) => {
          this.state.deleteConversation(user.id, id).subscribe({
            next: resolve,
            error: reject
          });
        })
      );
      
      Promise.all(deletePromises).then(() => {
        this.selectedConversations.set(new Set());
        this.showBulkActions.set(false);
        this.notification.success(`${conversationIds.length} conversation(s) deleted`);
      }).catch(err => {
        console.error('Bulk delete failed', err);
        this.notification.error('Failed to delete some conversations');
      });
    }
  }

  bulkArchive() {
    const conversationIds = Array.from(this.selectedConversations());
    if (conversationIds.length === 0) return;
    
    const user = this.auth.currentUser();
    if (!user) return;
    
    const archivePromises = conversationIds.map(id => 
      new Promise((resolve, reject) => {
        this.state.archiveConversation(user.id, id).subscribe({
          next: resolve,
          error: reject
        });
      })
    );
    
    Promise.all(archivePromises).then(() => {
      this.selectedConversations.set(new Set());
      this.showBulkActions.set(false);
      this.notification.success(`${conversationIds.length} conversation(s) archived`);
    }).catch(err => {
      console.error('Bulk archive failed', err);
      this.notification.error('Failed to archive some conversations');
    });
  }

  bulkUnarchive() {
    const conversationIds = Array.from(this.selectedConversations());
    if (conversationIds.length === 0) return;
    
    const user = this.auth.currentUser();
    if (!user) return;
    
    const unarchivePromises = conversationIds.map(id => 
      new Promise((resolve, reject) => {
        this.state.unarchiveConversation(user.id, id).subscribe({
          next: resolve,
          error: reject
        });
      })
    );
    
    Promise.all(unarchivePromises).then(() => {
      this.selectedConversations.set(new Set());
      this.showBulkActions.set(false);
      this.notification.success(`${conversationIds.length} conversation(s) unarchived`);
    }).catch(err => {
      console.error('Bulk unarchive failed', err);
      this.notification.error('Failed to unarchive some conversations');
    });
  }

  bulkRestore() {
    const conversationIds = Array.from(this.selectedConversations());
    if (conversationIds.length === 0) return;
    
    const user = this.auth.currentUser();
    if (!user) return;
    
    const restorePromises = conversationIds.map(id => 
      new Promise((resolve, reject) => {
        this.state.restoreConversation(user.id, id).subscribe({
          next: resolve,
          error: reject
        });
      })
    );
    
    Promise.all(restorePromises).then(() => {
      this.selectedConversations.set(new Set());
      this.showBulkActions.set(false);
      this.loadDeletedChats(); // Reload trash
      this.notification.success(`${conversationIds.length} conversation(s) restored`);
    }).catch(err => {
      console.error('Bulk restore failed', err);
      this.notification.error('Failed to restore some conversations');
    });
  }

  bulkPermanentlyDelete() {
    const conversationIds = Array.from(this.selectedConversations());
    if (conversationIds.length === 0) return;
    
    if (confirm(`Permanently delete ${conversationIds.length} conversation(s)? This action cannot be undone.`)) {
      const user = this.auth.currentUser();
      if (!user) return;
      
      const deletePromises = conversationIds.map(id => 
        new Promise((resolve, reject) => {
          this.state.permanentlyDeleteConversation(user.id, id).subscribe({
            next: resolve,
            error: reject
          });
        })
      );
      
      Promise.all(deletePromises).then(() => {
        this.selectedConversations.set(new Set());
        this.showBulkActions.set(false);
        this.loadDeletedChats(); // Reload trash
        this.notification.success(`${conversationIds.length} conversation(s) permanently deleted`);
      }).catch(err => {
        console.error('Bulk permanent delete failed', err);
        this.notification.error('Failed to permanently delete some conversations');
      });
    }
  }

  deleteConversation(userId: string) {
    this.showDeleteConfirm.set(userId);
  }

  confirmDelete(userId: string) {
    const user = this.auth.currentUser();
    if (!user) return;
    
    this.state.deleteConversation(user.id, userId).subscribe({
      next: () => {
        if (this.selectedUser()?.id === userId) {
          this.selectedUser.set(null);
        }
        this.showDeleteConfirm.set(null);
      },
      error: (err) => {
        console.error('Delete failed', err);
        this.showDeleteConfirm.set(null);
      }
    });
  }

  cancelDelete() {
    this.showDeleteConfirm.set(null);
  }

  restoreConversation(userId: string) {
    const user = this.auth.currentUser();
    if (!user) return;
    
    this.state.restoreConversation(user.id, userId).subscribe({
      next: () => {
        this.loadDeletedChats();
      },
      error: (err) => {
        console.error('Error restoring conversation', err);
        this.notification.error('Failed to restore conversation');
      }
    });
  }

  permanentlyDeleteConversation(userId: string) {
    if (confirm('Permanently delete this conversation? This action cannot be undone.')) {
      const user = this.auth.currentUser();
      if (!user) return;
      
      this.state.permanentlyDeleteConversation(user.id, userId).subscribe({
        next: () => {
          this.loadDeletedChats();
          this.notification.success('Conversation permanently deleted');
        },
        error: (err) => {
          console.error('Error permanently deleting conversation', err);
          this.notification.error('Failed to permanently delete conversation');
        }
      });
    }
  }

  archiveConversation(userId: string) {
    const user = this.auth.currentUser();
    if (!user) return;
    
    this.state.archiveConversation(user.id, userId).subscribe({
      next: () => {
        if (this.selectedUser()?.id === userId) {
          this.selectedUser.set(null);
        }
      }
    });
  }

  unarchiveConversation(userId: string) {
    const user = this.auth.currentUser();
    if (!user) return;
    
    this.state.unarchiveConversation(user.id, userId).subscribe({
      next: () => {
        if (this.selectedUser()?.id === userId) {
          this.selectedUser.set(null);
        }
      }
    });
  }

  toggleMenu(userId: string) {
    this.activeMenu.set(this.activeMenu() === userId ? null : userId);
  }

  closeMenu() {
    this.activeMenu.set(null);
  }

  markConversationAsRead(userId: string) {
    this.state.markConversationAsRead(userId);
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
      // Clear typing status immediately on send
      const sel = this.selectedUser();
      if (sel) this.state.sendTypingStatus(sel.id, false);
    } else {
      // Send typing status
      const sel = this.selectedUser();
      if (sel) this.state.sendTypingStatus(sel.id, true);
      // Optional: Add a debounce/timeout to stop typing after 3 seconds of inactivity
    }
    const el = event.target as HTMLTextAreaElement;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }

  exitSelectMode() {
    this.showBulkActions.set(false);
    this.selectedConversations.set(new Set());
  }

  isImage(url: string): boolean {
    if (!url) return false;
    const lower = url.toLowerCase();
    const isImageExt = lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.gif') || lower.endsWith('.webp') || lower.endsWith('.svg');
    if (isImageExt) return true;
    if (url.includes('cloudinary')) {
      return url.includes('/image/upload/') && !lower.endsWith('.pdf') && !lower.endsWith('.docx') && !lower.endsWith('.doc');
    }
    return false;
  }

  getFileName(url: string): string {
    if (!url) return 'Document';
    try {
      const decoded = decodeURIComponent(url);
      const parts = decoded.split('/');
      const lastPart = parts[parts.length - 1];
      const filename = lastPart.split('?')[0];
      return filename || 'Document';
    } catch {
      return 'Document';
    }
  }

  openFullImage(url: string) {
    window.open(url, '_blank');
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

  shouldShowDateHeader(msg: ChatMessage, prevMsg?: ChatMessage): boolean {
    if (!prevMsg) return true;
    const d1 = new Date(msg.rawDate || 0);
    const d2 = new Date(prevMsg.rawDate || 0);
    return d1.toDateString() !== d2.toDateString();
  }

  getDateLabel(timestamp?: number): string {
    if (!timestamp) return 'Today';
    const date = new Date(timestamp);
    const now = new Date();

    if (date.toDateString() === now.toDateString()) return 'Today';

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
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