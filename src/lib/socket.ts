"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const initializeSocket = (username?: string): Socket | null => {
  // If socket already exists and is connected, return it
  if (socket?.connected) {
    return socket;
  }

  // Only create new socket if we have a username or if we're just reconnecting
  if (username || socket) {
    try {
      // Disconnect existing socket if any
      if (socket) {
        socket.disconnect();
      }

      // Create new socket connection
      socket = io(process.env.NODE_ENV === 'production' 
        ? window.location.origin 
        : 'http://localhost:3000', {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true,
      });

      // Join the chat if username is provided
      if (username) {
        socket.emit('join', { username });
      }

      // Connection event handlers
      socket.on('connect', () => {
        console.log('Socket connected:', socket?.id);
      });

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      return socket;
    } catch (error) {
      console.error('Failed to initialize socket:', error);
      return null;
    }
  }

  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = (): Socket | null => {
  return socket;
};

// Fallback WebSocket implementation for environments without socket.io
export class FallbackSocket {
  private ws: WebSocket | null = null;
  private listeners: { [key: string]: Function[] } = {};
  private username: string = '';

  constructor(username: string) {
    this.username = username;
    this.connect();
  }

  private connect() {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/ws`;
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('Fallback WebSocket connected');
        this.emit('join', { username: this.username });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.trigger(data.type, data.payload);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('Fallback WebSocket disconnected');
        // Attempt to reconnect after 3 seconds
        setTimeout(() => this.connect(), 3000);
      };

      this.ws.onerror = (error) => {
        console.error('Fallback WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to create fallback WebSocket:', error);
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  emit(event: string, data?: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: event, payload: data }));
    }
  }

  private trigger(event: string, data?: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  get connected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}