# WebRTC Video Call Application

A real-time peer-to-peer video calling application built with React, Next.js, and WebRTC. Connect with anyone through secure video and audio communication.

![WebRTC Video Call](https://img.shields.io/badge/WebRTC-Video%20Call-blue)
![Next.js](https://img.shields.io/badge/Next.js-16.0-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Socket.io](https://img.shields.io/badge/Socket.io-4.8-green)

## Features

- **Real-time Video & Audio Communication**: High-quality peer-to-peer video and audio streaming
- **Room-based System**: Create unique room IDs or join existing rooms
- **Media Controls**: Toggle audio/video on and off during calls
- **Connection Status**: Real-time connection status indicators
- **Responsive UI**: Modern, dark-themed interface built with Tailwind CSS and shadcn/ui
- **Automatic Reconnection**: Handles network issues gracefully
- **Permission Handling**: Clear error messages for camera/microphone permissions

## Tech Stack

### Frontend

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - High-quality UI components
- **Lucide React** - Beautiful icons

### WebRTC & Real-time Communication

- **WebRTC API** - Peer-to-peer video/audio streaming
- **Socket.io Client** - Real-time signaling

### Backend (Signaling Server)

- **Node.js** - JavaScript runtime
- **Express** - Web server framework
- **Socket.io** - WebSocket server for signaling
- **TypeScript** - Type-safe server code

## Architecture

### WebRTC Flow

```
┌─────────────┐                    ┌──────────────────┐                    ┌─────────────┐
│   Client A  │◄──────Socket.io───►│ Signaling Server │◄────Socket.io─────►│   Client B  │
│  (Initiator)│                    └──────────────────┘                    │   (Joiner)  │
└─────────────┘                                                            └─────────────┘
      │                                                                           │
      │ 1. Create Room                                                            │
      ├──────────────────────────────────────────────────────────────────────────►│
      │                                                                           │
      │                          2. Join Room                                     │
      │◄──────────────────────────────────────────────────────────────────────────┤
      │                                                                           │
      │ 3. Send Offer (SDP)                                                       │
      ├──────────────────────────────────────────────────────────────────────────►│
      │                                                                           │
      │                          4. Send Answer (SDP)                             │
      │◄──────────────────────────────────────────────────────────────────────────┤
      │                                                                           │
      │ 5. Exchange ICE Candidates                                                │
      │◄─────────────────────────────────────────────────────────────────────────►│
      │                                                                           │
      │                    6. Establish P2P Connection                            │
      ╞═══════════════════════════════════════════════════════════════════════════╡
      │                    Direct Media Stream (Video/Audio)                      │
      ╞═══════════════════════════════════════════════════════════════════════════╡
```

### Key Components

1. **Signaling Server** (`server/index.ts`)
   - Manages room creation and joining
   - Facilitates SDP offer/answer exchange
   - Handles ICE candidate exchange
   - Tracks active rooms and participants

2. **WebRTC Hooks**
   - `useWebRTC` - Manages peer connection, SDP exchange, ICE candidates
   - `useMediaStream` - Handles local media stream (camera/microphone)

3. **UI Components**
   - `VideoPlayer` - Displays local and remote video streams
   - `VideoControls` - Audio/video toggle and end call buttons
   - `RoomInfo` - Shows room ID and connection status

4. **Pages**
   - Home Page - Create or join rooms
   - Room Page - Video call interface

## Setup and Installation

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Modern web browser with WebRTC support (Chrome, Firefox, Safari, Edge)

### Installation Steps

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd webrtc-vc-claude
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` if needed:

   ```env
   NEXT_PUBLIC_SIGNALING_SERVER_URL=http://localhost:3001
   ```

4. **Run the application**

   Start both client and server:

   ```bash
   npm run dev
   ```

   Or run them separately:

   ```bash
   # Terminal 1 - Client
   npm run dev:client

   # Terminal 2 - Server
   npm run dev:server
   ```

5. **Open the application**
   - Client: <http://localhost:3000>
   - Server health check: <http://localhost:3001/health>

## Usage Guide

### Creating a Room

1. Open the application in your browser
2. Click "Create New Room"
3. Allow camera and microphone permissions
4. Copy the Room ID and share it with the person you want to call
5. Wait for them to join

### Joining a Room

1. Get the Room ID from the person who created the room
2. Enter the Room ID in the "Join Room" input field
3. Click "Join Room"
4. Allow camera and microphone permissions
5. The call will connect automatically

### During a Call

- **Mute/Unmute**: Click the microphone button to toggle audio
- **Video On/Off**: Click the video button to toggle video
- **End Call**: Click the red phone button to leave the call

## API Documentation

### Socket.io Events

#### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `create-room` | `{ roomId: string }` | Create a new room |
| `join-room` | `{ roomId: string }` | Join an existing room |
| `offer` | `{ roomId: string, offer: RTCSessionDescriptionInit }` | Send WebRTC offer |
| `answer` | `{ roomId: string, answer: RTCSessionDescriptionInit }` | Send WebRTC answer |
| `ice-candidate` | `{ roomId: string, candidate: RTCIceCandidateInit }` | Send ICE candidate |
| `leave-room` | `{ roomId: string }` | Leave a room |

#### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `room-created` | `{ roomId: string }` | Room successfully created |
| `user-joined` | `{ userId: string }` | Another user joined the room |
| `user-left` | `{ userId: string }` | A user left the room |
| `offer` | `{ offer: RTCSessionDescriptionInit, userId: string }` | Received WebRTC offer |
| `answer` | `{ answer: RTCSessionDescriptionInit, userId: string }` | Received WebRTC answer |
| `ice-candidate` | `{ candidate: RTCIceCandidateInit, userId: string }` | Received ICE candidate |
| `room-full` | `{ message: string }` | Room has reached capacity (2 users) |
| `error` | `{ message: string }` | Error occurred |

## Project Structure

```
webrtc-vc-claude/
├── app/                          # Next.js app directory
│   ├── page.tsx                 # Home page (create/join room)
│   ├── room/[roomId]/page.tsx   # Video call page
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Global styles
├── components/
│   ├── ui/                      # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── badge.tsx
│   └── video/                   # Custom video components
│       ├── VideoPlayer.tsx      # Video stream player
│       ├── VideoControls.tsx    # Media control buttons
│       └── RoomInfo.tsx         # Room info display
├── hooks/
│   ├── useMediaStream.ts        # Media stream management
│   └── useWebRTC.ts             # WebRTC peer connection
├── services/
│   └── signaling.ts             # Socket.io client service
├── types/
│   └── webrtc.ts                # TypeScript type definitions
├── server/
│   └── index.ts                 # Signaling server
├── lib/
│   └── utils.ts                 # Utility functions
└── public/                      # Static assets
```

## Configuration

### STUN Servers

The application uses Google's public STUN servers by default:

- `stun:stun.l.google.com:19302`
- `stun:stun1.l.google.com:19302`

You can modify these in `hooks/useWebRTC.ts`.

### Adding TURN Servers

For production use behind restrictive firewalls, add TURN servers:

```typescript
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:your-turn-server.com:3478',
      username: 'username',
      credential: 'password'
    }
  ],
};
```

## Troubleshooting

### Camera/Microphone Not Working

1. Check browser permissions
2. Ensure you're using HTTPS (or localhost)
3. Check if another application is using the camera
4. Try a different browser

### Connection Issues

1. Check if the signaling server is running
2. Verify the `NEXT_PUBLIC_SIGNALING_SERVER_URL` environment variable
3. Check browser console for WebRTC errors
4. Consider adding TURN servers for restrictive networks

### Room Not Found

1. Verify the Room ID is correct
2. Ensure the room creator is still in the room
3. Check signaling server logs

## Production Deployment

### Deploying the Client

1. **Build the Next.js application**

   ```bash
   npm run build
   ```

2. **Deploy to Vercel** (Recommended)

   ```bash
   vercel deploy
   ```

   Or use the Vercel Dashboard to connect your repository.

3. **Update environment variables**
   Set `NEXT_PUBLIC_SIGNALING_SERVER_URL` to your production server URL.

### Deploying the Signaling Server

1. **Deploy to services like:**
   - Railway
   - Render
   - Heroku
   - DigitalOcean

2. **Example: Deploy to Railway**

   ```bash
   # Install Railway CLI
   npm i -g @railway/cli

   # Login
   railway login

   # Initialize project
   railway init

   # Deploy
   railway up
   ```

3. **Set environment variables**

   ```
   PORT=3001
   CLIENT_URL=https://your-frontend-url.vercel.app
   ```

## Testing

### Local Testing with Multiple Users

1. Open the application in two different browser windows/tabs
2. Create a room in one window
3. Copy the Room ID
4. Join the room from the second window
5. Test audio/video controls

### Testing on Different Devices

1. Ensure both devices are on the same network or use a deployed version
2. Share the Room ID via messaging app
3. Join from different devices

## Performance Optimization

- Video quality automatically adapts to network conditions
- ICE candidate gathering is optimized for quick connections
- Media streams are properly disposed when leaving calls
- Socket.io reconnection handles temporary network issues

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 15+
- Opera 76+

## Security Considerations

- All WebRTC connections are encrypted (DTLS-SRTP)
- Room IDs are UUIDs (hard to guess)
- Signaling server validates room capacity
- Consider adding authentication for production use
- Use HTTPS in production

## Future Enhancements

Potential features to add:

- [ ] Screen sharing
- [ ] Chat functionality
- [ ] More than 2 participants (mesh or SFU architecture)
- [ ] Recording capability
- [ ] Virtual backgrounds
- [ ] Network quality indicator
- [ ] Reconnection on connection drop
- [ ] User authentication
- [ ] Persistent room management

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or issues:

- Open an issue on GitHub
- Check existing issues for solutions
- Review the troubleshooting section

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- WebRTC resources from [webrtc.org](https://webrtc.org/)

---

**Happy video calling!**
