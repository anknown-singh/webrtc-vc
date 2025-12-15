"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Device, types } from "mediasoup-client";
import { signalingService } from "@/services/signaling";
import type { ConnectionStatus } from "@/types/webrtc";

type Transport = types.Transport;
type Producer = types.Producer;
type Consumer = types.Consumer;

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

  const deviceRef = useRef<Device | null>(null);
  const sendTransportRef = useRef<Transport | null>(null);
  const recvTransportRef = useRef<Transport | null>(null);
  const producersRef = useRef<Map<string, Producer>>(new Map());
  const consumersRef = useRef<Map<string, Consumer>>(new Map());
  const peerStreamsRef = useRef<Map<string, MediaStream>>(new Map());

  /**
   * Initialize mediasoup Device
   */
  const initDevice = useCallback(async () => {
    try {
      console.log("Initializing mediasoup Device...");
      const device = new Device();

      const { rtpCapabilities } =
        await signalingService.getRouterRtpCapabilities(roomId);
      await device.load({ routerRtpCapabilities: rtpCapabilities });

      deviceRef.current = device;
      console.log("Device initialized with RTP capabilities");
      return device;
    } catch (error) {
      console.error("Error initializing device:", error);
      throw error;
    }
  }, [roomId]);

  /**
   * Create send transport
   */
  const createSendTransport = useCallback(
    async (device: Device) => {
      try {
        console.log("Creating send transport...");
        const transportData = await signalingService.createWebRtcTransport(
          roomId
        );

        const transport = device.createSendTransport({
          id: transportData.id,
          iceParameters: transportData.iceParameters,
          iceCandidates: transportData.iceCandidates,
          dtlsParameters: transportData.dtlsParameters,
        });

        // Handle transport connection
        transport.on(
          "connect",
          async ({ dtlsParameters }, callback, errback) => {
            try {
              console.log("Connecting send transport...");
              await signalingService.connectTransport(
                roomId,
                transport.id,
                dtlsParameters
              );
              callback();
            } catch (error) {
              console.error("Error connecting send transport:", error);
              errback(error as Error);
            }
          }
        );

        // Handle produce
        transport.on(
          "produce",
          async ({ kind, rtpParameters }, callback, errback) => {
            try {
              console.log(`Producing ${kind}...`);
              const { id } = await signalingService.produce(
                roomId,
                transport.id,
                kind,
                rtpParameters
              );
              callback({ id });
            } catch (error) {
              console.error("Error producing:", error);
              errback(error as Error);
            }
          }
        );

        transport.on("connectionstatechange", (state) => {
          console.log("Send transport connection state:", state);
          if (state === "connected") {
            setConnectionStatus("connected");
          } else if (state === "failed") {
            setConnectionStatus("failed");
          } else if (state === "disconnected") {
            setConnectionStatus("disconnected");
          }
        });

        sendTransportRef.current = transport;
        console.log("Send transport created:", transport.id);
        return transport;
      } catch (error) {
        console.error("Error creating send transport:", error);
        throw error;
      }
    },
    [roomId]
  );

  /**
   * Create receive transport
   */
  const createRecvTransport = useCallback(
    async (device: Device) => {
      try {
        console.log("Creating receive transport...");
        const transportData = await signalingService.createWebRtcTransport(
          roomId
        );

        const transport = device.createRecvTransport({
          id: transportData.id,
          iceParameters: transportData.iceParameters,
          iceCandidates: transportData.iceCandidates,
          dtlsParameters: transportData.dtlsParameters,
        });

        // Handle transport connection
        transport.on(
          "connect",
          async ({ dtlsParameters }, callback, errback) => {
            try {
              console.log("Connecting receive transport...");
              await signalingService.connectTransport(
                roomId,
                transport.id,
                dtlsParameters
              );
              callback();
            } catch (error) {
              console.error("Error connecting receive transport:", error);
              errback(error as Error);
            }
          }
        );

        transport.on("connectionstatechange", (state) => {
          console.log("Receive transport connection state:", state);
        });

        recvTransportRef.current = transport;
        console.log("Receive transport created:", transport.id);
        return transport;
      } catch (error) {
        console.error("Error creating receive transport:", error);
        throw error;
      }
    },
    [roomId]
  );

  /**
   * Produce media (send local tracks)
   */
  const produceMedia = useCallback(
    async (transport: Transport, stream: MediaStream) => {
      try {
        const tracks = stream.getTracks();
        console.log(`Producing ${tracks.length} tracks...`);

        for (const track of tracks) {
          const producer = await transport.produce({ track });
          producersRef.current.set(producer.id, producer);
          console.log(`Producer created: ${producer.id} (${track.kind})`);

          producer.on("trackended", () => {
            console.log("Track ended:", producer.id);
          });

          producer.on("transportclose", () => {
            console.log("Producer transport closed:", producer.id);
            producersRef.current.delete(producer.id);
          });
        }
      } catch (error) {
        console.error("Error producing media:", error);
        throw error;
      }
    },
    []
  );

  /**
   * Consume media from a producer
   */
  const consumeMedia = useCallback(
    async (producerId: string, peerId: string, kind: string) => {
      try {
        const device = deviceRef.current;
        const transport = recvTransportRef.current;

        if (!device || !transport) {
          console.error("Device or receive transport not ready");
          return;
        }

        console.log(
          `Consuming ${kind} from peer ${peerId}, producer: ${producerId}`
        );

        const consumerData = await signalingService.consume(
          roomId,
          transport.id,
          producerId,
          device.rtpCapabilities
        );

        console.log("Consumer data received:", {
          consumerId: consumerData.id,
          producerId: consumerData.producerId,
          kind: consumerData.kind,
        });

        const consumer = await transport.consume({
          id: consumerData.id,
          producerId: consumerData.producerId,
          kind: consumerData.kind,
          rtpParameters: consumerData.rtpParameters,
        });

        consumersRef.current.set(consumer.id, consumer);

        // Resume consumer
        await signalingService.resumeConsumer(roomId, consumer.id);
        console.log(`Consumer resumed: ${consumer.id}`);

        // Add track to peer's stream
        const stream = peerStreamsRef.current.get(peerId) || new MediaStream();
        const tracksBefore = stream.getTracks().length;
        stream.addTrack(consumer.track);
        const tracksAfter = stream.getTracks().length;

        console.log(`Track added to peer ${peerId}: ${kind} track`, {
          trackId: consumer.track.id,
          trackKind: consumer.track.kind,
          trackEnabled: consumer.track.enabled,
          trackReadyState: consumer.track.readyState,
          tracksBefore,
          tracksAfter,
          totalTracks: stream.getTracks().map((t) => t.kind),
        });

        peerStreamsRef.current.set(peerId, stream);
        setRemoteStreams(new Map(peerStreamsRef.current));

        consumer.on("trackended", () => {
          console.log("Consumer track ended:", consumer.id);
        });

        consumer.on("transportclose", () => {
          console.log("Consumer transport closed:", consumer.id);
          consumersRef.current.delete(consumer.id);
        });
      } catch (error) {
        console.error("Error consuming media:", error);
      }
    },
    [roomId]
  );

  /**
   * Handle new producer notification
   */
  const handleNewProducer = useCallback(
    async (data: { producerId: string; peerId: string; kind: string }) => {
      console.log("New producer notification received:", {
        producerId: data.producerId,
        peerId: data.peerId,
        kind: data.kind,
        currentPeers: Array.from(peerStreamsRef.current.keys()),
        currentConsumers: consumersRef.current.size,
      });
      await consumeMedia(data.producerId, data.peerId, data.kind);
    },
    [consumeMedia]
  );

  /**
   * Handle user left
   */
  const handleUserLeft = useCallback((data: { userId: string }) => {
    console.log("User left:", data.userId);

    // Remove peer's stream
    peerStreamsRef.current.delete(data.userId);
    setRemoteStreams(new Map(peerStreamsRef.current));

    // Close consumers for this peer
    consumersRef.current.forEach((consumer, consumerId) => {
      // Note: We don't have direct peer-consumer mapping,
      // so we rely on server cleanup and transportclose events
    });

    // Update connection status
    if (peerStreamsRef.current.size === 0) {
      setConnectionStatus("disconnected");
    }
  }, []);

  /**
   * Initialize connection
   */
  const initializeConnection = useCallback(async () => {
    try {
      setConnectionStatus("connecting");
      console.log("Initializing SFU connection...");

      // Connect to signaling server
      await signalingService.connect();

      // Join or create room
      if (isInitiator) {
        signalingService.createRoom(roomId);
      } else {
        signalingService.joinRoom(roomId);
      }

      // Initialize device
      const device = await initDevice();

      // Create transports
      const sendTransport = await createSendTransport(device);
      await createRecvTransport(device);

      // Produce local media
      if (localStream) {
        await produceMedia(sendTransport, localStream);
      }

      // Listen for new producers
      signalingService.on("newProducer", handleNewProducer);

      // Listen for user left
      signalingService.on("user-left", handleUserLeft);

      signalingService.on(
        "test-joined",
        async (data: { roomId: string; participants: string[] }) => {
          console.log("Room joined event received:", {
            roomId: data.roomId,
            participants: data.participants,
          });
        }
      );

      // Get existing producers
      signalingService.on(
        "room-joined",
        async (data: { roomId: string; participants: string[] }) => {
          console.log("Room joined event received:", {
            roomId: data.roomId,
            participants: data.participants,
          });

          const { producers } = await signalingService.getProducers(roomId);
          console.log(
            `Found ${producers.length} existing producers:`,
            producers
          );

          for (const producer of producers) {
            console.log(`Processing existing producer:`, {
              producerId: producer.producerId,
              peerId: producer.peerId,
              kind: producer.kind,
            });
            await consumeMedia(
              producer.producerId,
              producer.peerId,
              producer.kind
            );
          }
        }
      );

      signalingService.on("room-created", () => {
        console.log("Room created, waiting for participants...");
      });

      console.log("SFU connection initialized successfully");
    } catch (error) {
      console.error("Error initializing connection:", error);
      setConnectionStatus("failed");
      throw error;
    }
  }, [
    roomId,
    localStream,
    isInitiator,
    initDevice,
    createSendTransport,
    createRecvTransport,
    produceMedia,
    consumeMedia,
    handleNewProducer,
    handleUserLeft,
  ]);

  /**
   * Close connection
   */
  const closeConnection = useCallback(() => {
    console.log("Closing SFU connection...");

    // Close all producers
    producersRef.current.forEach((producer) => {
      try {
        if (!producer.closed) {
          producer.close();
        }
      } catch (error) {
        console.warn("Error closing producer:", error);
      }
    });
    producersRef.current.clear();

    // Close all consumers
    consumersRef.current.forEach((consumer) => {
      try {
        if (!consumer.closed) {
          consumer.close();
        }
      } catch (error) {
        console.warn("Error closing consumer:", error);
      }
    });
    consumersRef.current.clear();

    // Close transports
    if (sendTransportRef.current) {
      try {
        if (!sendTransportRef.current.closed) {
          sendTransportRef.current.close();
        }
      } catch (error) {
        console.warn("Error closing send transport:", error);
      }
      sendTransportRef.current = null;
    }

    if (recvTransportRef.current) {
      try {
        if (!recvTransportRef.current.closed) {
          recvTransportRef.current.close();
        }
      } catch (error) {
        console.warn("Error closing receive transport:", error);
      }
      recvTransportRef.current = null;
    }

    // Clear device
    deviceRef.current = null;

    // Leave room and disconnect
    signalingService.leaveRoom(roomId);
    signalingService.disconnect();

    // Clear state
    peerStreamsRef.current.clear();
    setRemoteStreams(new Map());
    setConnectionStatus("disconnected");

    console.log("SFU connection closed");
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
