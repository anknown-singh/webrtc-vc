'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check } from 'lucide-react';
import type { ConnectionStatus } from '@/types/webrtc';

interface RoomInfoProps {
  roomId: string;
  connectionStatus: ConnectionStatus;
}

const statusConfig: Record<ConnectionStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  idle: { label: 'Idle', variant: 'secondary' },
  connecting: { label: 'Connecting...', variant: 'outline' },
  connected: { label: 'Connected', variant: 'default' },
  disconnected: { label: 'Disconnected', variant: 'destructive' },
  failed: { label: 'Failed', variant: 'destructive' },
};

export function RoomInfo({ roomId, connectionStatus }: RoomInfoProps) {
  const [copied, setCopied] = useState(false);

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy room ID:', error);
    }
  };

  const status = statusConfig[connectionStatus];

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Room ID</p>
            <p className="font-mono font-semibold text-lg">{roomId}</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={copyRoomId}
            className="h-8"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </>
            )}
          </Button>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>
    </Card>
  );
}
