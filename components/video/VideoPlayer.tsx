'use client';

import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, VideoOff } from 'lucide-react';

interface VideoPlayerProps {
  stream: MediaStream | null;
  isLocal?: boolean;
  isMuted?: boolean;
  label?: string;
}

export function VideoPlayer({ stream, isLocal = false, isMuted = false, label }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const hasVideo = stream?.getVideoTracks().some(track => track.enabled);

  return (
    <Card className="relative overflow-hidden bg-zinc-900 aspect-video">
      {stream && hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal || isMuted}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-zinc-800">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-zinc-700 mb-4">
              {stream && !hasVideo ? (
                <VideoOff className="w-12 h-12 text-zinc-400" />
              ) : (
                <User className="w-12 h-12 text-zinc-400" />
              )}
            </div>
            <p className="text-zinc-400 text-sm">
              {stream && !hasVideo ? 'Video is off' : 'No video'}
            </p>
          </div>
        </div>
      )}
      {label && (
        <Badge
          variant="secondary"
          className="absolute bottom-4 left-4 bg-black/50 text-white border-none"
        >
          {label}
        </Badge>
      )}
    </Card>
  );
}
