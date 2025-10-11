import type { Locale } from '@/lib/supabase/types'

// Voice configuration for different locales
const OPENAI_VOICES: Record<Locale, string> = {
  en: 'nova', // Female, warm voice
  tr: 'nova', // OpenAI voices work well across languages
  sr: 'nova',
}

const ELEVENLABS_VOICES: Record<Locale, string> = {
  en: process.env.ELEVENLABS_VOICE_ID_EN || 'default',
  tr: process.env.ELEVENLABS_VOICE_ID_TR || 'default',
  sr: process.env.ELEVENLABS_VOICE_ID_SR || 'default',
}

// Determine which TTS provider to use
const TTS_PROVIDER = process.env.TTS_PROVIDER || 'openai' // 'openai' or 'elevenlabs'

/**
 * Generate audio from text using OpenAI TTS
 * Cost: $0.015 per 1,000 characters
 */
export async function generateAudioWithOpenAI(
  text: string,
  locale: Locale
): Promise<Buffer> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set')
  }

  const voice = OPENAI_VOICES[locale]

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'tts-1', // or 'tts-1-hd' for higher quality
      input: text,
      voice: voice,
      speed: 0.95, // Slightly slower for mystical effect
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`OpenAI TTS failed: ${error.error?.message || 'Unknown error'}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Generate audio from text using ElevenLabs
 * Cost: Variable, typically $0.30+ per 1,000 characters
 */
export async function generateAudioWithElevenLabs(
  text: string,
  locale: Locale
): Promise<Buffer> {
  if (!process.env.ELEVENLABS_API_KEY) {
    throw new Error('ELEVENLABS_API_KEY is not set')
  }

  const voiceId = ELEVENLABS_VOICES[locale]

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.6,
          similarity_boost: 0.8,
          style: 0.4,
          use_speaker_boost: true,
        },
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`ElevenLabs TTS failed: ${error}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Main TTS function - automatically uses configured provider
 */
export async function generateAudio(text: string, locale: Locale): Promise<Buffer> {
  try {
    if (TTS_PROVIDER === 'elevenlabs') {
      return await generateAudioWithElevenLabs(text, locale)
    } else {
      // Default to OpenAI (cheaper and simpler)
      return await generateAudioWithOpenAI(text, locale)
    }
  } catch (error) {
    console.error('TTS generation failed:', error)
    throw error
  }
}

/**
 * Upload audio buffer to storage (Supabase Storage or similar)
 */
export async function uploadAudio(
  audioBuffer: Buffer,
  fileName: string
): Promise<string> {
  // For now, we'll use Supabase storage
  // In production, you might want to use a CDN or S3

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  // Upload to Supabase storage
  const { data, error } = await supabase.storage
    .from('readings-audio')
    .upload(`audio/${fileName}`, audioBuffer, {
      contentType: 'audio/mpeg',
      upsert: false,
    })

  if (error) {
    throw new Error(`Failed to upload audio: ${error.message}`)
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from('readings-audio').getPublicUrl(data.path)

  return publicUrl
}
