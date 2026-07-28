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
        this.connect();
      } else {
        this.disconnect();
      }
    });
  }

  private connect() {
    if (this.stompClient && this.stompClient.active) return;

    // Use SockJS for compatibility
    const socket = new SockJS(`${environment.apiUrl.replace('/api', '')}/ws`);
    const token = this.auth.currentUser()?.token;
    
    this.stompClient = new Client({
      webSocketFactory: () => socket as any,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      debug: () => {}, // suppress noisy internal STOMP frame logs
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.stompClient.onConnect = (_frame: IFrame) => {
      console.log(`[WebSocket] ✅ Connected to ${environment.apiUrl.replace('/api', '')}/ws`);
      this.isConnected.set(true);

      // Destinations are deliberately "/user/queue/..." with no id segment. Spring
      // resolves "/user/**" subscriptions against the authenticated session, so adding
      // an explicit id produces a destination the server never publishes to.
      this.stompClient?.subscribe('/user/queue/messages', (message: IMessage) => {
        this.handleIncomingMessage(JSON.parse(message.body));
      });

      this.stompClient?.subscribe('/user/queue/typing', (message: IMessage) => {
        const data = JSON.parse(message.body);
        this.state.setRemoteTyping(data.senderId, data.typing);
      });

      // Per-user queue, not a global topic: /topic/notifications would have fanned
      // every user's notifications out to every connected client.
      this.stompClient?.subscribe('/user/queue/notifications', (message: IMessage) => {
        this.state.addRealTimeNotification(JSON.parse(message.body));
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
