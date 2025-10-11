import { AccessToken } from 'livekit-server-sdk'

/**
 * Generate LiveKit access token for voice call
 * @param roomName - Unique room identifier (e.g., reading ID)
 * @param participantName - User identifier
 * @returns Access token string
 */
export async function generateLiveKitToken(
  roomName: string,
  participantName: string
): Promise<string> {
  if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
    throw new Error('LiveKit credentials not configured')
  }

  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    {
      identity: participantName,
      name: participantName,
    }
  )

  // Grant permissions for audio-only call
  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  })

  return await at.toJwt()
}

/**
 * Get LiveKit server URL from environment
 */
export function getLiveKitUrl(): string {
  const url = process.env.LIVEKIT_URL
  if (!url) {
    throw new Error('LIVEKIT_URL not configured')
  }
  return url
}
