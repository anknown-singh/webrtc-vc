"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { signalingService } from "@/services/signaling";
import type { ConnectionStatus } from "@/types/webrtc";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

interface UseWebRTCProps {
  roomId: string;
  localStream: MediaStream | null;
  isInitiator: boolean;
}

export function useWebRTC({
  roomId,
  localStream,
  isInitiator,
}: UseWebRTCProps) {
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(
    new Map()
  );
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("idle");

  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const iceCandidatesQueueRef = useRef<Map<string, RTCIceCandidateInit[]>>(
    new Map()
  );

  const createPeerConnection = useCallback(
    (peerId: string) => {
      try {
        console.log(`Creating peer connection for peer: ${peerId}`);
        const peerConnection = new RTCPeerConnection(ICE_SERVERS);

        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            console.log(`Sending ICE candidate to peer: ${peerId}`);
            signalingService.sendIceCandidate(
              roomId,
              peerId,
              event.candidate.toJSON()
            );
          }
        };

        peerConnection.ontrack = (event) => {
          console.log(`Received remote track from peer: ${peerId}`);
          const stream = event.streams[0];
          setRemoteStreams((prev) => {
            const newMap = new Map(prev);
            newMap.set(peerId, stream);
            return newMap;
          });
        };

        peerConnection.onconnectionstatechange = () => {
          console.log(
            `Connection state with ${peerId}:`,
            peerConnection.connectionState
          );

          // Update overall connection status based on all peer connections
          const connections = Array.from(peerConnectionsRef.current.values());
          if (connections.some((pc) => pc.connectionState === "connected")) {
            setConnectionStatus("connected");
          } else if (
            connections.every((pc) => pc.connectionState === "failed")
          ) {
            setConnectionStatus("failed");
          } else if (
            connections.some((pc) => pc.connectionState === "connecting")
          ) {
            setConnectionStatus("connecting");
          }
        };

        peerConnection.oniceconnectionstatechange = () => {
          console.log(
            `ICE connection state with ${peerId}:`,
            peerConnection.iceConnectionState
          );
        };

        if (localStream) {
          localStream.getTracks().forEach((track) => {
            peerConnection.addTrack(track, localStream);
          });
        }

        peerConnectionsRef.current.set(peerId, peerConnection);
        return peerConnection;
      } catch (error) {
        console.error(`Error creating peer connection for ${peerId}:`, error);
        throw error;
      }
    },
    [roomId, localStream]
  );

  const createOffer = useCallback(
    async (peerId: string) => {
      try {
        console.log(`Creating offer for peer: ${peerId}`);
        let peerConnection = peerConnectionsRef.current.get(peerId);

        if (!peerConnection) {
          peerConnection = createPeerConnection(peerId);
        }

        const offer = await peerConnection.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });

        await peerConnection.setLocalDescription(offer);
        signalingService.sendOffer(roomId, peerId, offer);
        console.log(`Offer sent to peer: ${peerId}`);
      } catch (error) {
        console.error(`Error creating offer for ${peerId}:`, error);
        throw error;
      }
    },
    [roomId, createPeerConnection]
  );

  const handleOffer = useCallback(
    async (peerId: string, offer: RTCSessionDescriptionInit) => {
      try {
        console.log(`Handling offer from peer: ${peerId}`);
        let peerConnection = peerConnectionsRef.current.get(peerId);

        if (!peerConnection) {
          peerConnection = createPeerConnection(peerId);
        }

        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(offer)
        );

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        signalingService.sendAnswer(roomId, peerId, answer);

        // Process queued ICE candidates for this peer
        const queue = iceCandidatesQueueRef.current.get(peerId) || [];
        queue.forEach((candidate) => {
          peerConnection!.addIceCandidate(new RTCIceCandidate(candidate));
        });
        iceCandidatesQueueRef.current.delete(peerId);

        console.log(`Answer sent to peer: ${peerId}`);
      } catch (error) {
        console.error(`Error handling offer from ${peerId}:`, error);
        throw error;
      }
    },
    [roomId, createPeerConnection]
  );

  const handleAnswer = useCallback(
    async (peerId: string, answer: RTCSessionDescriptionInit) => {
      try {
        console.log(`Handling answer from peer: ${peerId}`);
        const peerConnection = peerConnectionsRef.current.get(peerId);

        if (!peerConnection) {
          console.error(`No peer connection found for ${peerId}`);
          return;
        }

        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(answer)
        );

        // Process queued ICE candidates for this peer
        const queue = iceCandidatesQueueRef.current.get(peerId) || [];
        queue.forEach((candidate) => {
          peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        });
        iceCandidatesQueueRef.current.delete(peerId);

        console.log(`Answer received from peer: ${peerId}`);
      } catch (error) {
        console.error(`Error handling answer from ${peerId}:`, error);
        throw error;
      }
    },
    []
  );

  const handleIceCandidate = useCallback(
    async (peerId: string, candidate: RTCIceCandidateInit) => {
      try {
        const peerConnection = peerConnectionsRef.current.get(peerId);

        if (peerConnection?.remoteDescription) {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          console.log(`ICE candidate added for peer: ${peerId}`);
        } else {
          // Queue candidate until remote description is set
          const queue = iceCandidatesQueueRef.current.get(peerId) || [];
          queue.push(candidate);
          iceCandidatesQueueRef.current.set(peerId, queue);
          console.log(`ICE candidate queued for peer: ${peerId}`);
        }
      } catch (error) {
        console.error(`Error handling ICE candidate from ${peerId}:`, error);
      }
    },
    []
  );

  const handleParticipantsList = useCallback(
    async (participants: string[]) => {
      console.log("Received participants list:", participants);
      // Create offers to all existing participants
      for (const peerId of participants) {
        await createOffer(peerId);
      }
    },
    [createOffer]
  );

  const handleUserJoined = useCallback(
    async (userId: string) => {
      console.log("User joined:", userId);
      // Only initiator creates offers to newly joined users
      if (isInitiator || peerConnectionsRef.current.size > 0) {
        await createOffer(userId);
      }
    },
    [isInitiator, createOffer]
  );

  const handleUserLeft = useCallback((userId: string) => {
    console.log("User left:", userId);

    // Close and remove peer connection
    const peerConnection = peerConnectionsRef.current.get(userId);
    if (peerConnection) {
      peerConnection.close();
      peerConnectionsRef.current.delete(userId);
    }

    // Remove remote stream
    setRemoteStreams((prev) => {
      const newMap = new Map(prev);
      newMap.delete(userId);
      return newMap;
    });

    // Remove ICE candidates queue
    iceCandidatesQueueRef.current.delete(userId);

    // Update connection status
    if (peerConnectionsRef.current.size === 0) {
      setConnectionStatus("disconnected");
    }
  }, []);

  const initializeConnection = useCallback(async () => {
    try {
      setConnectionStatus("connecting");
      await signalingService.connect();

      if (isInitiator) {
        signalingService.createRoom(roomId);
      } else {
        signalingService.joinRoom(roomId);
      }

      // Listen for room-joined event (for joiners) - receives existing participants
      signalingService.on(
        "room-joined",
        (data: { roomId: string; participants: string[] }) => {
          console.log("Room joined, existing participants:", data.participants);
          handleParticipantsList(data.participants);
        }
      );

      // Listen for user-joined event - a new user joined the room
      signalingService.on("user-joined", (data: { userId: string }) => {
        handleUserJoined(data.userId);
      });

      // Listen for offer from a specific peer
      signalingService.on(
        "offer",
        (data: { offer: RTCSessionDescriptionInit; userId: string }) => {
          console.log("Received offer from:", data.userId);
          handleOffer(data.userId, data.offer);
        }
      );

      // Listen for answer from a specific peer
      signalingService.on(
        "answer",
        (data: { answer: RTCSessionDescriptionInit; userId: string }) => {
          console.log("Received answer from:", data.userId);
          handleAnswer(data.userId, data.answer);
        }
      );

      // Listen for ICE candidate from a specific peer
      signalingService.on(
        "ice-candidate",
        (data: { candidate: RTCIceCandidateInit; userId: string }) => {
          console.log("Received ICE candidate from:", data.userId);
          handleIceCandidate(data.userId, data.candidate);
        }
      );

      // Listen for user-left event
      signalingService.on("user-left", (data: { userId: string }) => {
        handleUserLeft(data.userId);
      });

      signalingService.on("room-full", () => {
        console.error("Room is full");
        setConnectionStatus("failed");
      });
    } catch (error) {
      console.error("Error initializing connection:", error);
      setConnectionStatus("failed");
      throw error;
    }
  }, [
    roomId,
    isInitiator,
    handleParticipantsList,
    handleUserJoined,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    handleUserLeft,
  ]);

  const closeConnection = useCallback(() => {
    // Close all peer connections
    peerConnectionsRef.current.forEach((peerConnection, peerId) => {
      console.log(`Closing connection with peer: ${peerId}`);
      peerConnection.close();
    });
    peerConnectionsRef.current.clear();
    iceCandidatesQueueRef.current.clear();

    signalingService.leaveRoom(roomId);
    signalingService.disconnect();

    setRemoteStreams(new Map());
    setConnectionStatus("disconnected");
  }, [roomId]);

  useEffect(() => {
    if (localStream) {
      initializeConnection();
    }

    return () => {
      closeConnection();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localStream]);

  return {
    remoteStreams,
    connectionStatus,
    closeConnection,
  };
}
