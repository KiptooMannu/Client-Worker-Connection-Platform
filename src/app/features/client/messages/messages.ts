import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { PlatformStateService } from '../../../core/services/platform-state.service';

@Component({
  selector: 'app-client-messages',
  standalone: true,
  imports: [
    CommonModule, 
    MatCardModule, 
    MatButtonModule, 
    MatIconModule, 
    MatListModule,
    MatFormFieldModule,
    MatInputModule,
    MatInputModule,
    MatDividerModule,
    FormsModule
  ],
  template: `
    <div class="h-[calc(100vh-200px)] flex bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-700">
      <!-- Conversation List -->
      <aside class="w-96 border-r border-slate-100 flex flex-col shrink-0">
        <div class="p-8 border-b border-slate-50">
          <div class="flex items-center justify-between mb-8">
            <h2 class="text-3xl font-black text-slate-900 tracking-tighter">Messages</h2>
            <button mat-icon-button class="!bg-indigo-50 !text-indigo-600 !rounded-xl"><mat-icon>edit_square</mat-icon></button>
          </div>
          <div class="flex gap-2">
            <span class="px-4 py-1.5 bg-indigo-900 text-white text-[10px] font-black uppercase tracking-widest rounded-full cursor-pointer shadow-lg shadow-indigo-900/20">All</span>
            <span class="px-4 py-1.5 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-full cursor-pointer hover:bg-slate-100 transition-colors">Unread</span>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto">
          @for (chat of state.chats(); track chat.id) {
            <div class="p-6 flex gap-4 cursor-pointer transition-all border-b border-slate-50 relative group"
                 [ngClass]="chat.active ? 'bg-indigo-50/50 border-r-4 border-indigo-600' : 'hover:bg-slate-50/50'"
                 (click)="selectChat(chat.id)">
              <div class="relative shrink-0">
                <div class="w-14 h-14 rounded-2xl overflow-hidden border-2 border-white shadow-sm group-hover:scale-105 transition-transform bg-indigo-50 text-indigo-700 flex items-center justify-center font-black text-xl uppercase">
                  @if (chat.image) {
                    <img [src]="chat.image" class="w-full h-full object-cover">
                  } @else {
                    {{ chat.initials }}
                  }
                </div>
                @if (chat.online) {
                  <div class="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-teal-500 border-2 border-white rounded-full"></div>
                }
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex justify-between items-baseline mb-1">
                  <h3 class="text-sm font-black text-slate-900 truncate">{{ chat.name }}</h3>
                  <span class="text-[9px] font-black uppercase tracking-widest" [ngClass]="chat.active ? 'text-indigo-600' : 'text-slate-400'">{{ chat.time }}</span>
                </div>
                <p class="text-xs text-slate-500 truncate font-medium">{{ chat.lastMessage }}</p>
                @if (chat.unread) {
                  <div class="absolute top-1/2 -translate-y-1/2 right-6 w-5 h-5 bg-indigo-600 text-white text-[9px] font-black flex items-center justify-center rounded-full shadow-lg">
                    {{ chat.unread }}
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </aside>

      <!-- Active Chat Area -->
      <main class="flex-1 flex flex-col bg-slate-50/30">
        @if (activeChat()) {
          <!-- Chat Header -->
          <header class="h-20 px-10 border-b border-slate-50 flex items-center justify-between bg-white/80 backdrop-blur-md">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white shadow-sm bg-indigo-50 flex items-center justify-center font-black text-indigo-700 text-lg uppercase">
                @if (activeChat()?.image) {
                  <img [src]="activeChat()?.image" class="w-full h-full object-cover">
                } @else {
                  {{ activeChat()?.initials }}
                }
              </div>
              <div>
                <h2 class="text-lg font-black text-slate-900 tracking-tight">{{ activeChat()?.name }}</h2>
              <div class="flex items-center gap-1.5">
                <div class="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
                <p class="text-[9px] font-black text-teal-600 uppercase tracking-widest">Active Now</p>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button mat-icon-button class="!text-slate-400 hover:!text-indigo-600"><mat-icon>videocam</mat-icon></button>
            <button mat-icon-button class="!text-slate-400 hover:!text-indigo-600"><mat-icon>call</mat-icon></button>
            <mat-divider vertical class="!h-6 !mx-2"></mat-divider>
            <button mat-icon-button class="!text-slate-400"><mat-icon>more_vert</mat-icon></button>
          </div>
        </header>

        <!-- Message History -->
        <div class="flex-1 overflow-y-auto p-10 space-y-10">
          <div class="flex justify-center">
            <span class="text-[9px] font-black text-slate-400 bg-white px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-sm border border-slate-50">Today, {{ todayDate }}</span>
          </div>

          @for (msg of activeChat()?.messages; track msg.id) {
            <div class="flex gap-4" [ngClass]="msg.sent ? 'flex-row-reverse' : ''">
              @if (!msg.sent) {
                <div class="w-8 h-8 rounded-full overflow-hidden shrink-0 mt-auto shadow-sm bg-blue-50 flex items-center justify-center font-black text-[10px] text-blue-700 uppercase">
                  @if (activeChat()?.image) {
                    <img [src]="activeChat()?.image" class="w-full h-full object-cover">
                  } @else {
                    {{ activeChat()?.initials }}
                  }
                </div>
              }
              <div class="max-w-2xl space-y-2">
                <div class="p-6 rounded-[2rem] shadow-sm font-medium text-lg" 
                     [ngClass]="msg.sent ? 'bg-indigo-900 text-white rounded-br-none shadow-indigo-900/10' : 'bg-white text-slate-700 rounded-bl-none'">
                  <p>{{ msg.text }}</p>
                  @if (msg.attachment) {
                    <div class="mt-6 flex items-center gap-4 p-4 bg-black/10 rounded-2xl border border-white/10 cursor-pointer hover:bg-black/20 transition-all">
                      <mat-icon>description</mat-icon>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-black truncate">{{ msg.attachment.name }}</p>
                        <p class="text-[9px] font-black uppercase opacity-60">{{ msg.attachment.size }}</p>
                      </div>
                      <mat-icon class="!text-sm">download</mat-icon>
                    </div>
                  }
                </div>
                <div class="flex items-center gap-2" [ngClass]="msg.sent ? 'justify-end' : ''">
                  <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">{{ msg.time }}</span>
                  @if (msg.sent) { <mat-icon class="!text-indigo-600 !text-sm !w-auto !h-auto">done_all</mat-icon> }
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Chat Input -->
        <footer class="p-8 bg-white border-t border-slate-50">
          <div class="max-w-5xl mx-auto flex items-center gap-4">
            <button mat-icon-button class="!text-slate-400 hover:!text-blue-600 transition-colors"><mat-icon>add_circle</mat-icon></button>
            <div class="flex-1 relative group">
              <input class="w-full bg-slate-50 border border-slate-100 rounded-3xl px-8 py-5 text-lg font-medium focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all" 
                     [placeholder]="'Type a message to ' + (activeChat()?.name?.split(' ')?.[0] || 'them') + '...'"
                     [(ngModel)]="newMessage"
                     (keyup.enter)="send()">
            </div>
            <button mat-fab color="primary" class="!bg-indigo-900 !rounded-2xl !shadow-2xl shadow-indigo-900/30" (click)="send()" [disabled]="!newMessage.trim()">
              <mat-icon>send</mat-icon>
            </button>
          </div>
        </footer>
        } @else {
          <div class="flex-1 flex flex-col items-center justify-center p-10 text-center">
            <mat-icon class="!text-[64px] !w-auto !h-auto text-slate-200 mb-6">chat_bubble_outline</mat-icon>
            <h3 class="text-2xl font-black text-slate-900 mb-2">No Active Chat</h3>
            <p class="text-slate-500 font-medium max-w-sm">Select a conversation from the left to start messaging, or browse the marketplace to find professionals.</p>
          </div>
        }
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; }

    @media (max-width: 768px) {
      .h-\\[calc\\(100vh-200px\\)\\] { height: calc(100vh - 100px) !important; margin: -1rem !important; border-radius: 0 !important; }
      .w-96 { width: 100% !important; display: none; }
      :host-context(.sidebar-collapsed) .w-96 { display: block; } /* Mock behavior */
      
      .active-chat-open .w-96 { display: none !important; }
      .active-chat-open main { display: flex !important; }
      
      main { width: 100% !important; }
      .p-10 { padding: 1rem !important; }
      .p-8 { padding: 1rem !important; }
    }
  `]
})
export class ClientMessagesPage {
  state = inject(PlatformStateService);
  
  newMessage = '';
  todayDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  activeChat = computed(() => this.state.chats().find(c => c.active));

  selectChat(id: string) {
    this.state.setActiveChat(id);
  }

  send() {
    if (!this.newMessage.trim()) return;
    const chat = this.activeChat();
    if (chat) {
      this.state.sendMessage(chat.id, this.newMessage);
      this.newMessage = '';
      
      // Auto reply mock
      setTimeout(() => {
        this.state.chats.update(chats => chats.map(c => {
          if (c.id === chat.id) {
            const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return {
              ...c,
              lastMessage: 'I received your message.',
              time,
              messages: [...c.messages, { id: Math.random().toString(), text: 'Thanks for the message. I am currently away but will respond soon.', time, sent: false }]
            };
          }
          return c;
        }));
      }, 2000);
    }
  }
}
