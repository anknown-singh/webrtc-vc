'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { MediaSettings } from '@/types/webrtc';

export function useMediaStream() {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [mediaSettings, setMediaSettings] = useState<MediaSettings>({
    audio: true,
    video: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const getMediaStream = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      });

      streamRef.current = stream;
      setLocalStream(stream);
      setIsLoading(false);
      return stream;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to access camera and microphone';
      setError(errorMessage);
      setIsLoading(false);
      throw err;
    }
  }, []);

  const toggleAudio = useCallback(() => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setMediaSettings((prev) => ({ ...prev, audio: audioTracks[0]?.enabled || false }));
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setMediaSettings((prev) => ({ ...prev, video: videoTracks[0]?.enabled || false }));
    }
  }, []);

  const stopMediaStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
      setLocalStream(null);
    }
  }, []);

  useEffect(() => {
    return () => {
      stopMediaStream();
    };
  }, [stopMediaStream]);

  return {
    localStream,
    mediaSettings,
    error,
    isLoading,
    getMediaStream,
    toggleAudio,
    toggleVideo,
    stopMediaStream,
  };
}
