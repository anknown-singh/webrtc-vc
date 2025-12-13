import { io, Socket } from 'socket.io-client';
import type { SignalingMessage } from '@/types/webrtc';

class SignalingService {
  private socket: Socket | null = null;
  private serverUrl: string;

  constructor() {
    this.serverUrl = process.env.NEXT_PUBLIC_SIGNALING_SERVER_URL || 'http://localhost:3001';
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(this.serverUrl, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        this.socket.on('connect', () => {
          console.log('Connected to signaling server');
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('Connection error:', error);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (data: any) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event: string, data: any): void {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  createRoom(roomId: string): void {
    this.emit('create-room', { roomId });
  }

  joinRoom(roomId: string): void {
    this.emit('join-room', { roomId });
  }

  leaveRoom(roomId: string): void {
    this.emit('leave-room', { roomId });
  }

  sendOffer(roomId: string, offer: RTCSessionDescriptionInit): void {
    this.emit('offer', { roomId, offer });
  }

  sendAnswer(roomId: string, answer: RTCSessionDescriptionInit): void {
    this.emit('answer', { roomId, answer });
  }

  sendIceCandidate(roomId: string, candidate: RTCIceCandidateInit): void {
    this.emit('ice-candidate', { roomId, candidate });
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const signalingService = new SignalingService();
