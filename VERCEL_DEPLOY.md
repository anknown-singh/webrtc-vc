# Quick Deploy to Vercel

This is a quick guide to get your WebRTC video calling app deployed to Vercel in minutes.

## Prerequisites

- A GitHub account
- A Vercel account (sign up at <https://vercel.com>)
- A Railway account for the signaling server (sign up at <https://railway.app>)

## Step-by-Step Deployment

### Deploy Frontend to Vercel (5 minutes)

#### Option A: Deploy via GitHub (Recommended)

1. **Push your code to GitHub**

   ```bash
   cd ..  # Go back to project root
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Go to Vercel Dashboard**
   - Visit <https://vercel.com/new>
   - Click "Import Project"
   - Select your GitHub repository

3. **Configure the deployment**
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: **./** (leave default)
   - Build Command: `npm run build` (auto-filled)
   - Output Directory: `.next` (auto-filled)

4. **Add Environment Variable**
   - Click "Environment Variables"
   - Name: `NEXT_PUBLIC_SIGNALING_SERVER_URL`
   - Value: Your Railway server URL from Part 1
   - Example: `https://webrtc-signaling-production.up.railway.app`

5. **Click Deploy**
   - Wait 2-3 minutes for deployment
   - Copy your Vercel URL (e.g., `https://your-app.vercel.app`)

#### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**

   ```bash
   npm i -g vercel
   ```

2. **Deploy**

   ```bash
   vercel
   ```

3. **Set environment variable**

   ```bash
   vercel env add NEXT_PUBLIC_SIGNALING_SERVER_URL
   ```

   Paste your Railway server URL when prompted.

4. **Deploy to production**

   ```bash
   vercel --prod
   ```

### Part 3: Update Server Configuration (1 minute)

Now that you have your Vercel URL, update the signaling server:

```bash
cd server
railway variables set CLIENT_URL=https://your-app.vercel.app
```

Replace `https://your-app.vercel.app` with your actual Vercel URL.

### Part 4: Test Your Deployment

1. **Visit your Vercel URL**

2. **Test the signaling server**
   Visit: `https://your-railway-server.railway.app/health`

   You should see:

   ```json
   {
     "status": "ok",
     "rooms": 0,
     "timestamp": "..."
   }
   ```

3. **Test a video call**
   - Click "Create New Room"
   - Allow camera/microphone permissions
   - Copy the Room ID
   - Open your Vercel URL in an incognito/private window
   - Click "Join Room" and paste the Room ID
   - Both windows should connect via video!

## Troubleshooting

### ❌ "Failed to connect to signaling server"

**Check:**

1. Is your Railway server running? Visit the `/health` endpoint
2. Is `NEXT_PUBLIC_SIGNALING_SERVER_URL` set correctly in Vercel?
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
3. Did you include `https://` in the server URL?

**Fix:**

```bash
# Update Vercel environment variable
vercel env rm NEXT_PUBLIC_SIGNALING_SERVER_URL
vercel env add NEXT_PUBLIC_SIGNALING_SERVER_URL
# Paste correct Railway URL
vercel --prod
```

### ❌ "CORS error" in browser console

**Fix:**

```bash
# Update Railway CLIENT_URL
cd server
railway variables set CLIENT_URL=https://your-actual-vercel-url.vercel.app
```

### ❌ Camera/Microphone not working

**Check:**

- Both sites must use HTTPS (Vercel and Railway do this automatically)
- Browser permissions are allowed
- Not already in use by another application

## Update Your App Later

### Update Frontend (Vercel)

1. Push changes to GitHub:

   ```bash
   git add .
   git commit -m "Update frontend"
   git push origin main
   ```

2. Vercel automatically redeploys!

### Update Server (Railway)

1. Make changes to server code
2. Deploy:

   ```bash
   cd server
   railway up
   ```

## Environment Variables Summary

### Vercel (Frontend)

| Variable | Value | Example |
|----------|-------|---------|
| `NEXT_PUBLIC_SIGNALING_SERVER_URL` | Your Railway server URL | `https://webrtc-signaling-production.up.railway.app` |

### Railway (Server)

| Variable | Value | Example |
|----------|-------|---------|
| `PORT` | 3001 | `3001` |
| `CLIENT_URL` | Your Vercel app URL | `https://your-app.vercel.app` |

## Costs

- **Vercel**: Free for personal projects
- **Railway**: $5 free credits/month, then ~$5-10/month
- **Total**: Free to start, ~$5-10/month after free credits

## Alternative: Deploy Server to Render (Free Option)

If you prefer a free option for the server:

1. Go to <https://render.com>
2. Create a new "Web Service"
3. Connect your GitHub repo
4. Root Directory: `server`
5. Build Command: `npm install`
6. Start Command: `npm start`
7. Add environment variables:
   - `PORT`: 3001
   - `CLIENT_URL`: Your Vercel URL

Render's free tier:

- Spins down after 15 minutes of inactivity
- First request may be slow (cold start)
- Good for testing, not ideal for production

## Next Steps

- ✅ Add a custom domain in Vercel
- ✅ Enable Vercel Analytics
- ✅ Monitor Railway logs: `railway logs`
- ✅ Set up error monitoring (Sentry, LogRocket)
- ✅ Add TURN servers for better connectivity

## Need Help?

- Check DEPLOYMENT.md for detailed troubleshooting
- View logs:
  - Railway: `railway logs`
  - Vercel: Dashboard → Your Project → Logs
- Test locally first: `npm run dev`

---

**That's it! Your WebRTC video calling app is now live! 🎉**
