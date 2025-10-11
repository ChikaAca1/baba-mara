import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateReading } from '@/lib/ai/claude'
import { generateAudio, uploadAudio } from '@/lib/tts'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get the reading
    const { data: reading, error: readingError } = await supabase
      .from('readings')
      .select('*')
      .eq('id', id)
      .single()

    if (readingError || !reading) {
      return NextResponse.json({ error: 'Reading not found' }, { status: 404 })
    }

    // Check if already processed
    if (reading.status === 'completed') {
      return NextResponse.json({ error: 'Reading already processed' }, { status: 400 })
    }

    // Update status to processing
    await supabase
      .from('readings')
      .update({ status: 'processing' })
      .eq('id', id)

    try {
      // Generate AI reading
      const responseText = await generateReading(
        reading.reading_type,
        reading.question,
        reading.locale
      )

      // Generate audio from text (optional - can be disabled to save costs)
      let audioUrl: string | null = null

      if (process.env.ENABLE_TTS === 'true' && process.env.OPENAI_API_KEY) {
        try {
          console.log('Generating audio for reading:', id)
          const audioBuffer = await generateAudio(responseText, reading.locale)

          // Upload audio to storage
          const fileName = `${id}-${Date.now()}.mp3`
          audioUrl = await uploadAudio(audioBuffer, fileName)

          console.log('Audio generated and uploaded:', audioUrl)
        } catch (audioError) {
          // Don't fail the entire reading if audio generation fails
          console.error('Audio generation failed (non-fatal):', audioError)

          // Log the audio error but continue
          await supabase.from('error_logs').insert({
            user_id: reading.user_id,
            error_type: 'tts_generation_error',
            error_message:
              audioError instanceof Error ? audioError.message : 'TTS failed',
            error_stack: audioError instanceof Error ? audioError.stack : null,
            endpoint: `/api/readings/process/${id}/tts`,
            severity: 'medium', // Not critical
          })
        }
      }

      // Update reading with response and audio
      const { error: updateError } = await supabase
        .from('readings')
        .update({
          status: 'completed',
          response_text: responseText,
          response_audio_url: audioUrl,
          completed_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (updateError) {
        throw new Error('Failed to update reading')
      }

      return NextResponse.json({
        success: true,
        reading: {
          id: reading.id,
          status: 'completed',
          response_text: responseText,
          response_audio_url: audioUrl,
        },
      })
    } catch (aiError) {
      // Mark as failed
      await supabase
        .from('readings')
        .update({
          status: 'failed',
          error_message:
            aiError instanceof Error ? aiError.message : 'AI processing failed',
        })
        .eq('id', id)

      // Log error
      await supabase.from('error_logs').insert({
        user_id: reading.user_id,
        error_type: 'ai_reading_generation_error',
        error_message: aiError instanceof Error ? aiError.message : 'Unknown error',
        error_stack: aiError instanceof Error ? aiError.stack : null,
        endpoint: `/api/readings/process/${id}`,
        severity: 'high',
      })

      throw aiError
    }
  } catch (error) {
    console.error('Error processing reading:', error)
    return NextResponse.json(
      {
        error: 'Failed to process reading',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
