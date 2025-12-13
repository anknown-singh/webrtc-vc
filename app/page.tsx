"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Video, Users } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState("");

  const handleCreateRoom = () => {
    const newRoomId = uuidv4();
    router.push(`/room/${newRoomId}?initiator=true`);
  };

  const handleJoinRoom = () => {
    if (!roomId.trim()) {
      setError("Please enter a room ID");
      return;
    }
    setError("");
    router.push(`/room/${roomId.trim()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            <Video className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">
            WebRTC Video Call
          </h1>
          <p className="text-zinc-400 text-lg">
            Connect face-to-face with anyone, anywhere
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-zinc-700 bg-zinc-800/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Video className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-white">Create Room</CardTitle>
              </div>
              <CardDescription className="text-zinc-400">
                Start a new video call and invite others
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleCreateRoom} className="w-full" size="lg">
                Create New Room
              </Button>
            </CardContent>
          </Card>

          <Card className="border-zinc-700 bg-zinc-800/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-white">Join Room</CardTitle>
              </div>
              <CardDescription className="text-zinc-400">
                Enter a room ID to join an existing call
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="Enter Room ID"
                  value={roomId}
                  onChange={(e) => {
                    setRoomId(e.target.value);
                    setError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleJoinRoom();
                    }
                  }}
                  className="bg-zinc-900 border-zinc-700 text-white"
                />
                {error && (
                  <p className="text-sm text-destructive mt-2">{error}</p>
                )}
              </div>
              <Button
                onClick={handleJoinRoom}
                className="w-full"
                size="lg"
                variant="secondary"
              >
                Join Room
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8 border-zinc-700 bg-zinc-800/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white text-lg">How to Use</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-zinc-400">
            <div className="flex gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                1
              </span>
              <p>
                <span className="text-white font-medium">Create a room:</span>{" "}
                Click &quot;Create New Room&quot; to start a new video call
              </p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                2
              </span>
              <p>
                <span className="text-white font-medium">
                  Share the Room ID:
                </span>{" "}
                Copy the room ID and send it to the person you want to call
              </p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                3
              </span>
              <p>
                <span className="text-white font-medium">Join the call:</span>{" "}
                The other person enters the room ID and clicks &quot;Join
                Room&quot;
              </p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                4
              </span>
              <p>
                <span className="text-white font-medium">
                  Control your media:
                </span>{" "}
                Use the buttons to mute/unmute or turn video on/off during the
                call
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
