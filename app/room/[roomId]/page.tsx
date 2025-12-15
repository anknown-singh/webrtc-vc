"use client";

import { use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { VideoControls } from "@/components/video/VideoControls";
import { RoomInfo } from "@/components/video/RoomInfo";
import { useMediaStream } from "@/hooks/useMediaStream";
import { useWebRTC } from "@/hooks/useWebRTC";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, Loader2, Home } from "lucide-react";

interface PageProps {
  params: Promise<{ roomId: string }>;
}

export default function RoomPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isInitiator = searchParams.get("initiator") === "true";
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

  const { remoteStreams, connectionStatus, closeConnection } = useWebRTC({
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
        console.error("Failed to get media stream:", error);
        setPermissionError(
          "Unable to access camera and microphone. Please allow permissions and try again."
        );
      }
    };

    initializeMedia();
  }, [getMediaStream]);

  const handleEndCall = () => {
    closeConnection();
    stopMediaStream();
    router.push("/");
  };

  const handleGoHome = () => {
    stopMediaStream();
    router.push("/");
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
            <p className="text-zinc-400">{permissionError || mediaError}</p>
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

  // Calculate grid columns based on participant count
  const participantCount = remoteStreams.size + 1; // +1 for local user
  const getGridClass = () => {
    if (participantCount === 1) return "grid-cols-1";
    if (participantCount === 2) return "lg:grid-cols-2 grid-cols-1";
    if (participantCount <= 4) return "lg:grid-cols-2 grid-cols-1";
    if (participantCount <= 6)
      return "lg:grid-cols-3 md:grid-cols-2 grid-cols-1";
    return "lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 grid-cols-1";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex flex-col p-4">
      <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col gap-4">
        <RoomInfo
          roomId={roomId}
          connectionStatus={connectionStatus}
          participantCount={participantCount}
        />

        <div className={`flex-1 grid gap-4 ${getGridClass()}`}>
          {/* Local stream */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-zinc-400 px-1">
              You {"u28368273".slice(0, 8)}
            </h3>
            <VideoPlayer stream={localStream} isLocal={true} label="You" />
          </div>

          {/* Remote streams */}
          {Array.from(remoteStreams.entries()).map(([peerId, stream]) => (
            <div key={peerId} className="space-y-2">
              <h3 className="text-sm font-medium text-zinc-400 px-1">
                User {peerId.slice(0, 8)}
              </h3>
              <VideoPlayer
                stream={stream}
                label={`User ${peerId.slice(0, 8)}`}
              />
            </div>
          ))}

          {/* Placeholder when waiting for participants */}
          {/* {remoteStreams.size === 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-zinc-400 px-1">
                Waiting for participants...
              </h3>
              <Card className="aspect-video flex items-center justify-center border-zinc-700 bg-zinc-800/50 backdrop-blur">
                <div className="text-center space-y-2">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                  <p className="text-zinc-400">Waiting for others to join</p>
                </div>
              </Card>
            </div>
          )} */}
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
