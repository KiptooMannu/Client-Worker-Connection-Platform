import { Injectable, inject, signal } from '@angular/core';
import { AuthService, User } from './auth.service';
import { environment } from '../../../environments/environment';
import { Client, IMessage, IFrame } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { PlatformStateService } from './platform-state.service';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private auth = inject(AuthService);
  private state = inject(PlatformStateService);
  private stompClient: Client | null = null;
  
  isConnected = signal(false);

  constructor() {
    // Automatically connect when user logs in
    this.auth.user$.subscribe((user: User | null) => {
      if (user) {
        this.connect(user.id);
      } else {
        this.disconnect();
      }
    });
  }

  private connect(userId: string) {
    if (this.stompClient && this.stompClient.active) return;

    // Use SockJS for compatibility
    const socket = new SockJS(`${environment.apiUrl.replace('/api', '')}/ws`);
    this.stompClient = new Client({
      webSocketFactory: () => socket as any,
      debug: () => {}, // suppress noisy internal STOMP frame logs
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.stompClient.onConnect = (_frame: IFrame) => {
      console.log(`[WebSocket] ✅ Connected to ${environment.apiUrl.replace('/api', '')}/ws`);
      this.isConnected.set(true);

      // Subscribe to personal message queue
      this.stompClient?.subscribe(`/user/${userId}/queue/messages`, (message: IMessage) => {
        const data = JSON.parse(message.body);
        console.log('[WebSocket] New message received:', data);
        this.handleIncomingMessage(data);
      });

      // Subscribe to typing indicators
      this.stompClient?.subscribe(`/user/${userId}/queue/typing`, (message: IMessage) => {
        const data = JSON.parse(message.body);
        this.state.setRemoteTyping(data.senderId, data.typing);
      });

      // Subscribe to global notifications
      this.stompClient?.subscribe('/topic/notifications', (message: IMessage) => {
        const data = JSON.parse(message.body);
        this.state.notifications.update(n => [data, ...n]);
      });
    };

    this.stompClient.onDisconnect = () => {
      console.log('[WebSocket] Disconnected');
      this.isConnected.set(false);
    };

    this.stompClient.activate();
  }

  private disconnect() {
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.isConnected.set(false);
    }
  }

  private handleIncomingMessage(data: any) {
    if (data.type === 'READ_RECEIPT') {
      this.state.handleReadReceipt(data);
    } else {
      this.state.addRealTimeMessage(data);
    }
  }
}
