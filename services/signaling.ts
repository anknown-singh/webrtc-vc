import { io, Socket } from "socket.io-client";
import type { SignalingMessage } from "@/types/webrtc";

class SignalingService {
  private socket: Socket | null = null;
  private serverUrl: string;

  constructor() {
    this.serverUrl =
      process.env.NEXT_PUBLIC_SIGNALING_SERVER_URL || "http://localhost:3001";
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(this.serverUrl, {
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        this.socket.on("connect", () => {
          console.log("Connected to signaling server");
          resolve();
        });

        this.socket.on("connect_error", (error) => {
          console.error("Connection error:", error);
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
    if (this.socket) {
      this.socket.emit("create-room", { roomId }, (response: any) => {
        if (response.error) {
          console.error(response.error);
          return;
        }
        console.log("Room created:", response.roomId);
      });
    }
  }

  joinRoom(roomId: string): void {
    this.emit("join-room", { roomId });
  }

  leaveRoom(roomId: string): void {
    this.emit("leave-room", { roomId });
  }

  sendOffer(
    roomId: string,
    targetUserId: string,
    offer: RTCSessionDescriptionInit
  ): void {
    this.emit("offer", { roomId, targetUserId, offer });
  }

  sendAnswer(
    roomId: string,
    targetUserId: string,
    answer: RTCSessionDescriptionInit
  ): void {
    this.emit("answer", { roomId, targetUserId, answer });
  }

  sendIceCandidate(
    roomId: string,
    targetUserId: string,
    candidate: RTCIceCandidateInit
  ): void {
    this.emit("ice-candidate", { roomId, targetUserId, candidate });
  }

  // SFU Methods

  getRouterRtpCapabilities(roomId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("Socket not connected"));
        return;
      }

      this.socket.emit(
        "getRouterRtpCapabilities",
        { roomId },
        (response: any) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        }
      );
    });
  }

  createWebRtcTransport(roomId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("Socket not connected"));
        return;
      }

      this.socket.emit("createWebRtcTransport", { roomId }, (response: any) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }

  connectTransport(
    roomId: string,
    transportId: string,
    dtlsParameters: any
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("Socket not connected"));
        return;
      }

      this.socket.emit(
        "connectTransport",
        { roomId, transportId, dtlsParameters },
        (response: any) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve();
          }
        }
      );
    });
  }

  produce(
    roomId: string,
    transportId: string,
    kind: string,
    rtpParameters: any
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("Socket not connected"));
        return;
      }

      this.socket.emit(
        "produce",
        { roomId, transportId, kind, rtpParameters },
        (response: any) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        }
      );
    });
  }

  consume(
    roomId: string,
    transportId: string,
    producerId: string,
    rtpCapabilities: any
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("Socket not connected"));
        return;
      }

      this.socket.emit(
        "consume",
        { roomId, transportId, producerId, rtpCapabilities },
        (response: any) => {
          if (response.error) {
            console.log({ error: response.error });
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        }
      );
    });
  }

  resumeConsumer(roomId: string, consumerId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("Socket not connected"));
        return;
      }

      this.socket.emit(
        "resumeConsumer",
        { roomId, consumerId },
        (response: any) => {
          if (response.error) {
            console.log({ error: response.error });
            reject(new Error(response.error));
          } else {
            resolve();
          }
        }
      );
    });
  }

  getProducers(roomId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("Socket not connected"));
        return;
      }

      this.socket.emit("getProducers", { roomId }, (response: any) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const signalingService = new SignalingService();
