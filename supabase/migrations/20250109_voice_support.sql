-- Add voice session support to readings table

-- Add new columns for LiveKit voice integration
ALTER TABLE public.readings
ADD COLUMN IF NOT EXISTS is_voice_session BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS livekit_room_name TEXT,
ADD COLUMN IF NOT EXISTS livekit_session_duration INTEGER; -- Duration in seconds

-- Add index for voice session queries
CREATE INDEX IF NOT EXISTS idx_readings_voice_session
ON public.readings(is_voice_session, created_at DESC)
WHERE is_voice_session = true;

-- Comment on new columns
COMMENT ON COLUMN public.readings.is_voice_session IS 'Whether this reading was conducted via LiveKit voice call';
COMMENT ON COLUMN public.readings.livekit_room_name IS 'LiveKit room identifier for this voice session';
COMMENT ON COLUMN public.readings.livekit_session_duration IS 'Total voice call duration in seconds';
