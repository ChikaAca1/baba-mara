# LiveKit Voice Integration

Real-time voice call system for AI-powered fortune telling with Baba Mara.

## Overview

The LiveKit integration enables users to have real-time voice conversations with Baba Mara AI for coffee cup and tarot readings. This system provides:

- **Real-time Audio**: Crystal-clear voice communication with sub-200ms latency
- **Cross-platform**: Works on web browsers and Capacitor mobile apps
- **Secure**: JWT-based authentication with per-session tokens
- **Reliable**: Automatic reconnection and error recovery
- **Cost-effective**: Pay-per-use pricing model

## Architecture

```
User Browser/App
    ↓ (1) Request token
API Route (/api/livekit/token)
    ↓ (2) Generate JWT
LiveKit Server
    ↓ (3) Establish connection
VoiceCall Component
    ↓ (4) Enable microphone
    ↓ (5) Subscribe to AI agent audio
AI Agent (Future: LiveKit Agent)
```

## Setup

### 1. LiveKit Cloud Account

Sign up at [LiveKit Cloud](https://cloud.livekit.io/):
1. Create a new project
2. Copy your credentials:
   - **API Key**: `APIxxxxxxxxxxxxx`
   - **API Secret**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **WebSocket URL**: `wss://your-project.livekit.cloud`

### 2. Environment Variables

Add to `.env.local`:

```bash
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
LIVEKIT_URL=wss://your-project.livekit.cloud
```

### 3. Database Migration

Run the voice support migration:

```bash
# Apply migration to add voice session columns
psql -h your-supabase-host -U postgres -d postgres -f supabase/migrations/20250109_voice_support.sql
```

Or in Supabase Dashboard: SQL Editor → Run migration file

## Components

### Server-side (`lib/livekit/server.ts`)

**`generateLiveKitToken(roomName, participantName)`**
- Creates JWT access token for LiveKit room
- Grants audio publish/subscribe permissions
- Returns signed token string

**`getLiveKitUrl()`**
- Returns WebSocket URL from environment
- Validates configuration

### API Route (`app/api/livekit/token/route.ts`)

**POST /api/livekit/token**
- Authenticates user via Supabase session
- Generates room-specific access token
- Returns token + WebSocket URL

### Client Component (`components/VoiceCall.tsx`)

**VoiceCall Component**
- Manages LiveKit room connection
- Handles microphone permissions
- Controls audio playback
- Tracks call duration
- Mute/unmute functionality

**Props:**
- `roomName`: Unique room identifier
- `onCallStart`: Callback when call begins
- `onCallEnd`: Callback when call ends
- `onError`: Error handler

### Voice Reading Page (`app/[locale]/voice/`)

**Server Component (`page.tsx`)**
- User authentication
- Credit verification
- Reading type selection UI

**Client Component (`client.tsx`)**
- Call lifecycle management
- Reading session creation
- Navigation after call

## Usage Flow

### 1. User Initiates Call

```typescript
// In client component
const response = await fetch('/api/readings/create', {
  method: 'POST',
  body: JSON.stringify({
    reading_type: 'coffee', // or 'tarot'
    question: 'Voice reading session',
    locale: 'en',
    is_voice_session: true
  })
})

const { reading } = await response.json()
setReadingId(reading.id)
```

### 2. Connect to LiveKit

```typescript
// VoiceCall component automatically:
// 1. Fetches access token from /api/livekit/token
// 2. Creates LiveKit Room instance
// 3. Connects to server
// 4. Enables microphone
// 5. Subscribes to AI agent audio track
```

### 3. Call Management

```typescript
<VoiceCall
  roomName={`voice-${userId}-${readingId}`}
  onCallStart={() => {
    console.log('Call connected')
  }}
  onCallEnd={() => {
    // Navigate to reading detail
    router.push(`/${locale}/dashboard/reading/${readingId}`)
  }}
  onError={(error) => {
    console.error('Call failed:', error)
  }}
/>
```

### 4. End Call & Save

When call ends:
- Session duration saved to `readings.livekit_session_duration`
- AI transcription/summary saved to `response_text`
- User redirected to reading detail page

## Database Schema

### Reading Record with Voice Session

```sql
CREATE TABLE readings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  reading_type TEXT, -- 'coffee' or 'tarot'
  question TEXT,
  locale TEXT,
  status TEXT, -- 'pending', 'processing', 'completed', 'failed'

  -- Voice session fields
  is_voice_session BOOLEAN DEFAULT false,
  livekit_room_name TEXT,
  livekit_session_duration INTEGER, -- seconds

  response_text TEXT,
  response_audio_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
)
```

## Cost Estimation

### LiveKit Cloud Pricing (as of 2025)

**Free Tier:**
- 10,000 participant minutes/month
- Perfect for development and MVP

**Pay-as-you-go:**
- $0.01 per participant minute
- Example: 10-minute call = $0.10

**Monthly Average (1000 readings, 5 min avg):**
- 1000 calls × 5 minutes = 5,000 minutes
- 5,000 × $0.01 = $50/month
- **Per reading**: $0.05

### Total Voice Reading Cost

```
Component                Cost per Reading
─────────────────────────────────────────
LiveKit voice           $0.05
Claude AI generation    $0.02
OpenAI TTS              $0.004
Supabase storage        $0.001
─────────────────────────────────────────
TOTAL                   ~$0.075 per voice reading
```

Compare to text-only: **$0.025**

Voice premium: **+$0.05** (200% increase)

## Features

### ✅ Current Implementation

- Real-time audio communication
- Secure JWT-based authentication
- Call duration tracking
- Automatic reconnection
- Mute/unmute controls
- Cross-browser compatibility
- Mobile-responsive UI

### 🚧 Future Enhancements (Phase 5 Extension)

1. **AI Agent Integration**
   - LiveKit Agents Framework
   - Real-time speech-to-text
   - AI response generation during call
   - Text-to-speech for AI responses

2. **Advanced Features**
   - Call recording (opt-in)
   - Noise cancellation
   - Echo cancellation improvements
   - Background music/ambience

3. **Analytics**
   - Call quality metrics
   - Average call duration
   - Drop rate tracking
   - User satisfaction ratings

4. **UI Enhancements**
   - Heygen avatar integration
   - Visual feedback during AI thinking
   - Waveform visualization
   - Connection quality indicator

## Troubleshooting

### "Failed to get access token"
- Verify LIVEKIT_API_KEY and LIVEKIT_API_SECRET are set
- Check user authentication (Supabase session)
- Inspect network tab for 401/500 errors

### "Connection failed"
- Verify LIVEKIT_URL is correct WebSocket URL
- Check LiveKit Cloud project status
- Ensure firewall allows WebSocket connections
- Test with LiveKit's [connection test](https://livekit.io/connection-test)

### "Microphone access denied"
- User must grant microphone permissions
- HTTPS required in production
- Check browser compatibility (Chrome, Firefox, Safari, Edge)

### "No audio from AI agent"
- Verify AI agent is publishing audio track
- Check audio element attachment in VoiceCall component
- Inspect LiveKit room participants

### "Call quality issues"
- Check network connectivity
- Reduce video quality (if enabled)
- Use LiveKit's adaptive streaming
- Verify LiveKit server region (use closest)

## Security Best Practices

### JWT Token Security
- Tokens expire after room disconnection
- Unique token per session
- Scoped to specific room only
- Never expose API secret in client code

### Room Access Control
- User ID embedded in room name
- Server-side authentication required
- RLS policies enforce ownership

### Audio Privacy
- Calls not recorded by default
- Opt-in recording with user consent
- GDPR compliance considerations

## Testing

### Manual Testing

1. **Local Development:**
```bash
npm run dev
# Navigate to /voice page
# Click "Start Call"
# Grant microphone permissions
# Verify connection status
```

2. **Production Testing:**
- Test on multiple browsers
- Test on mobile devices
- Test with poor network conditions
- Test call reconnection

### Integration Testing

```typescript
// Example test structure
describe('VoiceCall Component', () => {
  it('should connect to LiveKit room', async () => {
    // Mock token generation
    // Render component
    // Click "Start Call"
    // Assert connection status
  })

  it('should track call duration', async () => {
    // Start call
    // Wait 5 seconds
    // Assert duration = 5
  })
})
```

## Production Deployment

### Pre-deployment Checklist

- [ ] LiveKit Cloud project created
- [ ] Environment variables configured
- [ ] Database migration applied
- [ ] SSL/HTTPS enabled
- [ ] Firewall rules allow WebSocket
- [ ] Browser compatibility tested
- [ ] Mobile responsiveness verified
- [ ] Error logging configured

### Monitoring

Monitor these metrics:
- Connection success rate (target: >95%)
- Average call duration (target: 3-10 minutes)
- Error rate (target: <5%)
- Call quality scores
- Token generation latency (target: <100ms)

### Scaling Considerations

**< 1,000 calls/month:**
- LiveKit Cloud free tier sufficient
- Single region deployment

**1,000 - 10,000 calls/month:**
- Pay-as-you-go pricing
- Enable adaptive streaming
- Add call quality monitoring

**> 10,000 calls/month:**
- Consider enterprise plan
- Multi-region deployment
- Dedicated LiveKit instance
- Advanced load balancing

## Support

- **LiveKit Docs**: https://docs.livekit.io
- **LiveKit Community**: https://livekit.io/community
- **LiveKit Cloud Support**: support@livekit.io
- **Baba Mara Issues**: GitHub repository issues

## Next Steps

After completing Phase 5:
1. Test voice calling thoroughly
2. Integrate AI agent (LiveKit Agents SDK)
3. Add call recording (optional)
4. Implement Heygen avatar (Phase 5 extension)
5. Monitor usage and costs
6. Gather user feedback
7. Optimize call quality based on metrics
