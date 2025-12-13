'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { signalingService } from '@/services/signaling';
import type { ConnectionStatus } from '@/types/webrtc';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

interface UseWebRTCProps {
  roomId: string;
  localStream: MediaStream | null;
  isInitiator: boolean;
}

export function useWebRTC({ roomId, localStream, isInitiator }: UseWebRTCProps) {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([]);

  const createPeerConnection = useCallback(() => {
    try {
      const peerConnection = new RTCPeerConnection(ICE_SERVERS);

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('Sending ICE candidate');
          signalingService.sendIceCandidate(roomId, event.candidate.toJSON());
        }
      };

      peerConnection.ontrack = (event) => {
        console.log('Received remote track');
        setRemoteStream(event.streams[0]);
      };

      peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection.connectionState);
        setConnectionStatus(peerConnection.connectionState as ConnectionStatus);
      };

      peerConnection.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', peerConnection.iceConnectionState);
      };

      if (localStream) {
        localStream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, localStream);
        });
      }

      peerConnectionRef.current = peerConnection;
      return peerConnection;
    } catch (error) {
      console.error('Error creating peer connection:', error);
      throw error;
    }
  }, [roomId, localStream]);

  const createOffer = useCallback(async () => {
    if (!peerConnectionRef.current) {
      createPeerConnection();
    }

    try {
      const offer = await peerConnectionRef.current!.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      await peerConnectionRef.current!.setLocalDescription(offer);
      signalingService.sendOffer(roomId, offer);
      console.log('Offer sent');
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    }
  }, [roomId, createPeerConnection]);

  const handleOffer = useCallback(
    async (offer: RTCSessionDescriptionInit) => {
      if (!peerConnectionRef.current) {
        createPeerConnection();
      }

      try {
        await peerConnectionRef.current!.setRemoteDescription(
          new RTCSessionDescription(offer)
        );

        const answer = await peerConnectionRef.current!.createAnswer();
        await peerConnectionRef.current!.setLocalDescription(answer);
        signalingService.sendAnswer(roomId, answer);

        iceCandidatesQueue.current.forEach((candidate) => {
          peerConnectionRef.current!.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        });
        iceCandidatesQueue.current = [];

        console.log('Answer sent');
      } catch (error) {
        console.error('Error handling offer:', error);
        throw error;
      }
    },
    [roomId, createPeerConnection]
  );

  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    try {
      await peerConnectionRef.current!.setRemoteDescription(
        new RTCSessionDescription(answer)
      );

      iceCandidatesQueue.current.forEach((candidate) => {
        peerConnectionRef.current!.addIceCandidate(new RTCIceCandidate(candidate));
      });
      iceCandidatesQueue.current = [];

      console.log('Answer received');
    } catch (error) {
      console.error('Error handling answer:', error);
      throw error;
    }
  }, []);

  const handleIceCandidate = useCallback(
    async (candidate: RTCIceCandidateInit) => {
      try {
        if (peerConnectionRef.current?.remoteDescription) {
          await peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        } else {
          iceCandidatesQueue.current.push(candidate);
        }
      } catch (error) {
        console.error('Error handling ICE candidate:', error);
      }
    },
    []
  );

  const initializeConnection = useCallback(async () => {
    try {
      setConnectionStatus('connecting');
      await signalingService.connect();

      if (isInitiator) {
        signalingService.createRoom(roomId);
      } else {
        signalingService.joinRoom(roomId);
      }

      signalingService.on('user-joined', () => {
        console.log('User joined, creating offer');
        createOffer();
      });

      signalingService.on('offer', (data: { offer: RTCSessionDescriptionInit }) => {
        console.log('Received offer');
        handleOffer(data.offer);
      });

      signalingService.on('answer', (data: { answer: RTCSessionDescriptionInit }) => {
        console.log('Received answer');
        handleAnswer(data.answer);
      });

      signalingService.on(
        'ice-candidate',
        (data: { candidate: RTCIceCandidateInit }) => {
          console.log('Received ICE candidate');
          handleIceCandidate(data.candidate);
        }
      );

      signalingService.on('user-left', () => {
        console.log('User left');
        setRemoteStream(null);
        setConnectionStatus('disconnected');
      });

      signalingService.on('room-full', () => {
        console.error('Room is full');
        setConnectionStatus('failed');
      });
    } catch (error) {
      console.error('Error initializing connection:', error);
      setConnectionStatus('failed');
      throw error;
    }
  }, [roomId, isInitiator, createOffer, handleOffer, handleAnswer, handleIceCandidate]);

  const closeConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    signalingService.leaveRoom(roomId);
    signalingService.disconnect();
    setRemoteStream(null);
    setConnectionStatus('disconnected');
  }, [roomId]);

  useEffect(() => {
    if (localStream) {
      initializeConnection();
    }

    return () => {
      closeConnection();
    };
  }, [localStream, initializeConnection, closeConnection]);

  return {
    remoteStream,
    connectionStatus,
    closeConnection,
  };
}
