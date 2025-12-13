'use client';

import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import type { MediaSettings } from '@/types/webrtc';

interface VideoControlsProps {
  mediaSettings: MediaSettings;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onEndCall: () => void;
}

export function VideoControls({
  mediaSettings,
  onToggleAudio,
  onToggleVideo,
  onEndCall,
}: VideoControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <Button
        size="lg"
        variant={mediaSettings.audio ? 'secondary' : 'destructive'}
        onClick={onToggleAudio}
        className="rounded-full w-14 h-14"
      >
        {mediaSettings.audio ? (
          <Mic className="w-6 h-6" />
        ) : (
          <MicOff className="w-6 h-6" />
        )}
      </Button>

      <Button
        size="lg"
        variant={mediaSettings.video ? 'secondary' : 'destructive'}
        onClick={onToggleVideo}
        className="rounded-full w-14 h-14"
      >
        {mediaSettings.video ? (
          <Video className="w-6 h-6" />
        ) : (
          <VideoOff className="w-6 h-6" />
        )}
      </Button>

      <Button
        size="lg"
        variant="destructive"
        onClick={onEndCall}
        className="rounded-full w-14 h-14"
      >
        <PhoneOff className="w-6 h-6" />
      </Button>
    </div>
  );
}
