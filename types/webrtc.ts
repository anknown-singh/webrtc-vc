export type ConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "failed";

export interface MediaSettings {
  audio: boolean;
  video: boolean;
}

export interface SignalingMessage {
  type:
    | "offer"
    | "answer"
    | "ice-candidate"
    | "join-room"
    | "leave-room"
    | "room-created"
    | "room-joined"
    | "user-joined"
    | "user-left"
    | "room-full"
    | "error";
  roomId?: string;
  userId?: string;
  targetUserId?: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  message?: string;
  participants?: string[];
}

export interface RoomInfo {
  roomId: string;
  participantCount: number;
}

export interface PeerConnection {
  peerId: string;
  connection: RTCPeerConnection;
  stream?: MediaStream;
}

export interface RoomJoinedEvent {
  roomId: string;
  participants: string[];
}

export interface UserJoinedEvent {
  userId: string;
}

export interface UserLeftEvent {
  userId: string;
}
