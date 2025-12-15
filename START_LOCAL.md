# Local Development Guide

## ✅ Server Status
Your SFU server is already running!
- URL: http://localhost:3001
- Status: OK
- Workers: 8 mediasoup workers initialized
- Health: http://localhost:3001/health

## 🚀 Start Frontend

Open a new terminal and run:

```bash
cd /Users/anknown/development/Octogle/webrtc-vc-claude
npm run dev
```

This will start the Next.js frontend on http://localhost:3000

## 🧪 Test Multi-User Video Call

Once the frontend is running:

### Tab 1 (Room Creator):
1. Open http://localhost:3000
2. Click "Create Room"
3. Allow camera/microphone permissions
4. Copy the Room ID that appears

### Tab 2 (Join Room):
1. Open http://localhost:3000 in a new tab/window
2. Paste the Room ID
3. Click "Join Room"
4. Allow camera/microphone permissions
5. You should see both video streams!

### Tab 3+ (More Participants):
- Repeat Tab 2 steps with the same Room ID
- Each user sends 1 stream to SFU
- Each user receives N-1 streams from SFU

## 🔍 Monitor Console Logs

### Server Console (Current Terminal):
Watch for:
```
Creating new router for room: <roomId>
Creating WebRTC transport for peer: <socketId>
Transport created: <transportId>
Producing audio/video for peer: <socketId>
Consumer created: <consumerId>
```

### Browser Console (F12 → Console):
Watch for:
```
Initializing mediasoup Device...
Device initialized with RTP capabilities
Send transport created: <transportId>
Receive transport created: <transportId>
Producer created: <producerId> (audio/video)
Consuming audio/video from peer <peerId>
Consumer resumed: <consumerId>
```

## 📊 Expected Behavior

### With 2 Users:
- **Bandwidth per user**: 2 streams (1 up, 1 down)
- **Server**: 2 incoming + 2 outgoing = 4 streams total

### With 5 Users:
- **Bandwidth per user**: 5 streams (1 up, 4 down)
- **Server**: 5 incoming + 20 outgoing = 25 streams total
- **Compare to mesh**: Would be 20 streams per user (4 up, 4 down)
- **Savings**: 75% bandwidth reduction per user! 🎉

### With 10 Users:
- **Bandwidth per user**: 10 streams (1 up, 9 down)
- **Server**: 10 incoming + 90 outgoing = 100 streams total
- **Compare to mesh**: Would be 18 streams per user (9 up, 9 down)
- **Savings**: 44% bandwidth reduction per user! 🎉

## ⚠️ Troubleshooting

### Server Not Starting:
- Check if port 3001 is already in use: `lsof -i :3001`
- Kill existing process: `kill -9 <PID>`

### Frontend Not Connecting:
- Verify server is running: `curl http://localhost:3001/health`
- Check `.env.local`: `NEXT_PUBLIC_SIGNALING_SERVER_URL=http://localhost:3001`

### No Video/Audio:
- Check browser console for errors
- Verify camera/microphone permissions granted
- Try Chrome/Firefox (Safari has WebRTC quirks)

### mediasoup Errors:
- UDP ports 10000-10100 must be available
- Check: `lsof -i :10000-10100`
- macOS Firewall: Allow incoming connections for Node.js

## 🛑 Stop Servers

### Stop Frontend:
Press `Ctrl+C` in the terminal running `npm run dev`

### Stop SFU Server:
The server is currently running in the background.
To stop it, I'll need to kill it for you.

## 📝 Architecture Notes

You're now running **mediasoup SFU** instead of mesh topology:

**Old (Mesh):**
- Each user connects to every other user directly
- N users = N×(N-1)/2 peer connections
- Bandwidth: N-1 streams up + N-1 streams down per user

**New (SFU):**
- All users connect to central server
- Server forwards streams
- N users = N connections to server
- Bandwidth: 1 stream up + (N-1) streams down per user

**Result:** Much better scalability and reliability! 🚀
