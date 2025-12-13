'use client';

import { use, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { VideoPlayer } from '@/components/video/VideoPlayer';
import { VideoControls } from '@/components/video/VideoControls';
import { RoomInfo } from '@/components/video/RoomInfo';
import { useMediaStream } from '@/hooks/useMediaStream';
import { useWebRTC } from '@/hooks/useWebRTC';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, Loader2, Home } from 'lucide-react';

interface PageProps {
  params: Promise<{ roomId: string }>;
}

export default function RoomPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isInitiator = searchParams.get('initiator') === 'true';
  const roomId = resolvedParams.roomId;

  const [isReady, setIsReady] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const {
    localStream,
    mediaSettings,
    error: mediaError,
    isLoading: mediaLoading,
    getMediaStream,
    toggleAudio,
    toggleVideo,
    stopMediaStream,
  } = useMediaStream();

  const {
    remoteStream,
    connectionStatus,
    closeConnection,
  } = useWebRTC({
    roomId,
    localStream,
    isInitiator,
  });

  useEffect(() => {
    const initializeMedia = async () => {
      try {
        await getMediaStream();
        setIsReady(true);
      } catch (error) {
        console.error('Failed to get media stream:', error);
        setPermissionError(
          'Unable to access camera and microphone. Please allow permissions and try again.'
        );
      }
    };

    initializeMedia();
  }, [getMediaStream]);

  const handleEndCall = () => {
    closeConnection();
    stopMediaStream();
    router.push('/');
  };

  const handleGoHome = () => {
    stopMediaStream();
    router.push('/');
  };

  if (permissionError || mediaError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 border-zinc-700 bg-zinc-800/50 backdrop-blur">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-2">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold text-white">
              Permission Required
            </h2>
            <p className="text-zinc-400">
              {permissionError || mediaError}
            </p>
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => window.location.reload()}
                className="flex-1"
              >
                Try Again
              </Button>
              <Button
                onClick={handleGoHome}
                variant="outline"
                className="flex-1"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (mediaLoading || !isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center p-4">
        <Card className="p-8 border-zinc-700 bg-zinc-800/50 backdrop-blur">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <p className="text-white text-lg">Setting up your call...</p>
            <p className="text-zinc-400 text-sm">
              Please allow camera and microphone access
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex flex-col p-4">
      <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col gap-4">
        <RoomInfo roomId={roomId} connectionStatus={connectionStatus} />

        <div className="flex-1 grid lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-zinc-400 px-1">You</h3>
            <VideoPlayer
              stream={localStream}
              isLocal={true}
              label="You"
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-zinc-400 px-1">
              {remoteStream ? 'Remote User' : 'Waiting for participant...'}
            </h3>
            <VideoPlayer
              stream={remoteStream}
              label={remoteStream ? 'Remote User' : undefined}
            />
          </div>
        </div>

        <div className="pb-4">
          <VideoControls
            mediaSettings={mediaSettings}
            onToggleAudio={toggleAudio}
            onToggleVideo={toggleVideo}
            onEndCall={handleEndCall}
          />
        </div>
      </div>
    </div>
  );
}
