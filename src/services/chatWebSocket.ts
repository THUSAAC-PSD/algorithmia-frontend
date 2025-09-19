import { v4 as uuidv4 } from 'uuid';

import { API_BASE_URL } from '../config';

// Types for WebSocket messages
export interface WebSocketRequest {
  action: string;
  payload: unknown;
  request_id: string;
}

export interface WebSocketResponse {
  type: string;
  payload: unknown;
  request_id: string;
}

export interface SetActiveProblemPayload {
  problem_id: string;
}

export interface SendMessagePayload {
  problem_id: string;
  content: string;
  attachment_media_ids: string[];
}

export interface MessagePayload {
  id: string;
  problem_id: string;
  sender: {
    id: string;
    username: string;
  };
  content: string;
  attachments: unknown[];
  timestamp: string;
}

export interface UserMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  isCurrentUser: boolean;
}

export interface AckPayload {
  message: string;
}

// WebSocket client class
class ChatWebSocketClient {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;
  private eventListeners: Map<string, Set<(data: unknown) => void>> = new Map();
  private isConnecting = false;

  private generateRequestId(): string {
    return uuidv4();
  }

  public connect(): Promise<void> {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    if (this.isConnecting) {
      return new Promise((resolve, reject) => {
        const checkConnection = () => {
          if (this.socket?.readyState === WebSocket.OPEN) {
            resolve();
          } else if (!this.isConnecting) {
            reject(new Error('Connection attempt failed'));
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
      });
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const normalizedBase = API_BASE_URL.replace(/\/$/, '');
        const wsUrl = `${protocol}//${window.location.host}${normalizedBase}/ws/chat`;
        console.log('[ChatWebSocket] connecting to', wsUrl);
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
          console.log('WebSocket connection established');
          this.reconnectAttempts = 0;
          this.isConnecting = false;
          this.emit('connected', null);
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            const data: WebSocketResponse = JSON.parse(event.data);
            console.log('WebSocket message received:', data);

            // Emit event based on message type
            this.emit(data.type, data);

            // Also emit a 'message' event for all messages
            this.emit('message', data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.socket.onclose = (event) => {
          this.isConnecting = false;
          console.log('WebSocket connection closed:', event);
          this.socket = null;

          // Only attempt to reconnect if it wasn't a normal closure
          if (event.code !== 1000 && event.code !== 1001) {
            this.tryReconnect();
          }

          this.emit('disconnected', event);
        };

        this.socket.onerror = (error) => {
          this.isConnecting = false;
          console.error('WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        };
      } catch (error) {
        this.isConnecting = false;
        console.error('Error creating WebSocket:', error);
        reject(error);
      }
    });
  }

  private tryReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached. Giving up.');
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`,
    );

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error('Reconnection attempt failed:', error);
      });
    }, this.reconnectInterval);
  }

  public disconnect(): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.close();
    }
  }

  public send(action: string, payload: unknown): string {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    const requestId = this.generateRequestId();
    const message: WebSocketRequest = {
      action,
      payload,
      request_id: requestId,
    };

    this.socket.send(JSON.stringify(message));
    return requestId;
  }

  public setActiveProblem(problemId: string): string {
    const payload: SetActiveProblemPayload = {
      problem_id: problemId,
    };
    return this.send('set-active-problem-chat', payload);
  }

  public sendMessage(
    problemId: string,
    content: string,
    attachmentMediaIds: string[] = [],
  ): string {
    const payload: SendMessagePayload = {
      problem_id: problemId,
      content,
      attachment_media_ids: attachmentMediaIds,
    };
    return this.send('send-message', payload);
  }

  public on(eventName: string, callback: (data: unknown) => void): void {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, new Set());
    }
    this.eventListeners.get(eventName)?.add(callback);
  }

  public off(eventName: string, callback: (data: unknown) => void): void {
    this.eventListeners.get(eventName)?.delete(callback);
  }

  private emit(eventName: string, data: unknown): void {
    this.eventListeners.get(eventName)?.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${eventName} event handler:`, error);
      }
    });
  }
}

// Create a singleton instance
export const chatWebSocket = new ChatWebSocketClient();

export default chatWebSocket;
