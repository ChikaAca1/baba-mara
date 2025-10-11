# AI Reading Engine

Complete AI-powered fortune reading system with text-to-speech support.

## Overview

The AI Reading Engine generates mystical, personalized readings using:
- **Claude 3.5 Sonnet** for high-quality, creative reading generation
- **OpenAI TTS** for affordable text-to-speech (alternative: ElevenLabs)
- **Real-time status polling** for seamless user experience

## Features

### ✨ AI-Powered Readings

**Reading Types**:
- **Coffee Cup Reading** (Tasseography): Traditional Turkish coffee fortune telling
- **Tarot Reading**: Ancient wisdom through tarot card interpretations

**Multi-language Support**:
- English (en)
- Turkish (tr)
- Serbian (sr)

**Quality Features**:
- Mystical and atmospheric language
- Culturally appropriate responses
- Personalized to user's specific question
- 200-400 word responses
- Balanced tone (hope + caution)

### 🎙️ Text-to-Speech

**Provider Options**:

1. **OpenAI TTS** (Recommended)
   - Cost: $0.015 per 1,000 characters (~$0.003-0.006 per reading)
   - Quality: Good, natural-sounding
   - Voices: `nova` (warm, female voice)
   - Setup: Use existing `OPENAI_API_KEY`

2. **ElevenLabs** (Premium)
   - Cost: $0.30+ per 1,000 characters (~$0.06-0.12 per reading)
   - Quality: Excellent, highly realistic
   - Voices: Customizable per language
   - Setup: Requires `ELEVENLABS_API_KEY` + voice IDs

**Cost Comparison**:
```
Reading length: 200-400 characters
OpenAI:     $0.003 - $0.006 per reading
ElevenLabs: $0.060 - $0.120 per reading
```

**Recommendation**: Start with OpenAI TTS. Upgrade to ElevenLabs if audio quality is crucial.

### 🔄 Real-time Processing

**Flow**:
1. User submits question → Reading created (status: `pending`)
2. Background job triggers → Status: `processing`
3. AI generates text → TTS creates audio (optional)
4. Update database → Status: `completed`
5. Client polls every 3s → UI updates automatically

**Polling System**:
- Automatic status checking every 3 seconds
- Stops when reading completes or fails
- User-friendly loading states
- Smooth transition to completed state

## Setup

### 1. Environment Variables

Add to `.env.local`:

```bash
# Claude API (required)
ANTHROPIC_API_KEY=sk-ant-your-api-key

# OpenAI API (required for TTS, optional for alternative AI)
OPENAI_API_KEY=sk-your-openai-api-key

# TTS Configuration
ENABLE_TTS=true # Set to 'false' to disable and save costs
TTS_PROVIDER=openai # 'openai' or 'elevenlabs'

# Optional: ElevenLabs (only if TTS_PROVIDER=elevenlabs)
ELEVENLABS_API_KEY=your-elevenlabs-key
ELEVENLABS_VOICE_ID_EN=your-english-voice-id
ELEVENLABS_VOICE_ID_TR=your-turkish-voice-id
ELEVENLABS_VOICE_ID_SR=your-serbian-voice-id
```

### 2. Supabase Storage

Create a storage bucket for audio files:

```sql
-- In Supabase dashboard: Storage > Create bucket
-- Bucket name: readings-audio
-- Public: true (for audio playback)
```

Set bucket policies:
```sql
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'readings-audio');

-- Allow public access for playback
CREATE POLICY "Allow public downloads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'readings-audio');
```

### 3. Cost Optimization

**Disable TTS to save costs**:
```bash
ENABLE_TTS=false
```

**Use OpenAI instead of Claude** (if needed):
- Edit `lib/ai/claude.ts`
- Use `generateReadingWithOpenAI()` function
- OpenAI GPT-4: ~$0.03 per reading vs Claude: ~$0.02 per reading

## API Endpoints

### `POST /api/readings/create`
Create a new reading request.

**Request**:
```json
{
  "reading_type": "coffee" | "tarot",
  "question": "User's question",
  "locale": "en" | "tr" | "sr"
}
```

**Response**:
```json
{
  "success": true,
  "reading": {
    "id": "uuid",
    "status": "pending",
    ...
  },
  "message": "Reading created successfully. Processing has started."
}
```

### `POST /api/readings/process/[id]`
Process a pending reading (triggered automatically).

**Response**:
```json
{
  "success": true,
  "reading": {
    "id": "uuid",
    "status": "completed",
    "response_text": "Reading text...",
    "response_audio_url": "https://..."
  }
}
```

### `GET /api/readings/status/[id]`
Check reading status (for polling).

**Response**:
```json
{
  "success": true,
  "reading": {
    "id": "uuid",
    "status": "processing" | "completed" | "failed",
    "response_text": "...",
    "response_audio_url": "...",
    "error_message": "..."
  }
}
```

## Cost Estimation

**Per Reading**:
- AI Generation (Claude): ~$0.020
- TTS (OpenAI): ~$0.004
- Storage (Supabase): ~$0.001
- **Total**: ~$0.025 per reading

**Monthly (1000 readings)**:
- AI: $20
- TTS: $4
- Storage: $1
- **Total**: ~$25/month

**Without TTS**:
- AI: $20
- **Total**: ~$20/month

## Usage in Code

### Generate a reading:
```typescript
import { generateReading } from '@/lib/ai/claude'

const text = await generateReading(
  'coffee', // or 'tarot'
  'What does my future hold?',
  'en'
)
```

### Generate audio:
```typescript
import { generateAudio, uploadAudio } from '@/lib/tts'

const audioBuffer = await generateAudio(text, 'en')
const audioUrl = await uploadAudio(audioBuffer, 'filename.mp3')
```

### Client-side polling:
```typescript
import { useReadingStatus } from '@/hooks/useReadingStatus'

const { status, reading, isPolling } = useReadingStatus({
  readingId: 'uuid',
  initialStatus: 'pending',
  onComplete: (reading) => {
    console.log('Reading completed!', reading)
  }
})
```

## Production Considerations

### Background Jobs

Current implementation uses immediate fetch() for processing. In production, use a proper job queue:

**Options**:
1. **Vercel Cron** (built-in, but limited)
2. **Inngest** (recommended, great DX)
3. **Trigger.dev** (code-first jobs)
4. **BullMQ** (if self-hosting)

**Implementation**:
```typescript
// Instead of immediate fetch:
await jobQueue.enqueue('process-reading', { readingId })
```

### Monitoring

Add monitoring for:
- AI generation failures
- TTS errors
- Processing time metrics
- Cost tracking

### Scaling

**Horizontal scaling**:
- Stateless API design ✅
- No long-running processes ✅
- Database connection pooling ✅

**Optimization**:
- Cache AI prompts
- Batch TTS requests
- CDN for audio files
- Rate limiting

## Troubleshooting

**"ANTHROPIC_API_KEY is not set"**
- Add key to `.env.local`
- Restart dev server

**"Reading status stuck on 'processing'"**
- Check server logs for errors
- Verify API keys are valid
- Check Supabase connection

**"Audio not generating"**
- Verify `ENABLE_TTS=true`
- Check `OPENAI_API_KEY` is set
- Verify Supabase storage bucket exists

**"TTS generation failed (non-fatal)"**
- Check OpenAI API quota
- Verify audio permissions on bucket
- Reading will still work without audio

## Future Enhancements

- [ ] Voice call integration with LiveKit
- [ ] Streaming responses for real-time generation
- [ ] Multiple AI providers (fallback system)
- [ ] Advanced voice cloning
- [ ] Reading history export
- [ ] Share reading with friends
