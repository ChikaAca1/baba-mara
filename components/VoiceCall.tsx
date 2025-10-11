'use client'

import { useEffect, useState, useRef } from 'react'
import {
  Room,
  RoomEvent,
  Track,
  RemoteTrack,
  RemoteAudioTrack,
} from 'livekit-client'

interface VoiceCallProps {
  roomName: string
  onCallStart?: () => void
  onCallEnd?: () => void
  onError?: (error: Error) => void
}

export default function VoiceCall({
  roomName,
  onCallStart,
  onCallEnd,
  onError,
}: VoiceCallProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [callDuration, setCallDuration] = useState(0)

  const roomRef = useRef<Room | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)

  // Initialize audio element
  useEffect(() => {
    audioElementRef.current = new Audio()
    return () => {
      if (audioElementRef.current) {
        audioElementRef.current.pause()
        audioElementRef.current = null
      }
    }
  }, [])

  // Connect to LiveKit room
  const connect = async () => {
    try {
      setIsConnecting(true)

      // Get access token from API
      const response = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName }),
      })

      if (!response.ok) {
        throw new Error('Failed to get access token')
      }

      const { token, url } = await response.json()

      // Create room
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true,
        },
      })

      roomRef.current = room

      // Set up event listeners
      room.on(RoomEvent.Connected, () => {
        console.log('Connected to room:', room.name)
        setIsConnected(true)
        setIsConnecting(false)
        onCallStart?.()

        // Start duration timer
        intervalRef.current = setInterval(() => {
          setCallDuration((prev) => prev + 1)
        }, 1000)
      })

      room.on(RoomEvent.Disconnected, () => {
        console.log('Disconnected from room')
        setIsConnected(false)
        onCallEnd?.()

        // Stop duration timer
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      })

      room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
        if (track.kind === Track.Kind.Audio) {
          const audioTrack = track as RemoteAudioTrack
          const element = audioTrack.attach()
          if (audioElementRef.current) {
            audioElementRef.current.srcObject = element.srcObject
            audioElementRef.current.play()
          }
        }
      })

      room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
        if (track.kind === Track.Kind.Audio) {
          track.detach()
        }
      })

      // Connect to room
      await room.connect(url, token)

      // Enable local audio
      await room.localParticipant.setMicrophoneEnabled(true)
    } catch (error) {
      console.error('Connection error:', error)
      setIsConnecting(false)
      onError?.(error as Error)
    }
  }

  // Disconnect from room
  const disconnect = async () => {
    if (roomRef.current) {
      await roomRef.current.disconnect()
      roomRef.current = null
    }
    setIsConnected(false)
    setCallDuration(0)
  }

  // Toggle microphone mute
  const toggleMute = async () => {
    if (roomRef.current) {
      const enabled = !isMuted
      await roomRef.current.localParticipant.setMicrophoneEnabled(enabled)
      setIsMuted(!enabled)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
      <div className="text-center">
        {/* Status indicator */}
        <div className="mb-6">
          {isConnecting && (
            <div className="flex items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
              <span className="text-gray-600 dark:text-gray-300">Connecting...</span>
            </div>
          )}

          {isConnected && (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2">
                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-600 dark:text-green-400 font-medium">
                  Connected
                </span>
              </div>
              <div className="text-2xl font-mono text-purple-600 dark:text-purple-400">
                {formatDuration(callDuration)}
              </div>
            </div>
          )}

          {!isConnecting && !isConnected && (
            <div className="text-gray-500 dark:text-gray-400">Ready to connect</div>
          )}
        </div>

        {/* Call controls */}
        <div className="flex items-center justify-center gap-4">
          {!isConnected ? (
            <button
              onClick={connect}
              disabled={isConnecting}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-full font-medium transition-colors flex items-center gap-2"
            >
              <span className="text-xl">📞</span>
              {isConnecting ? 'Connecting...' : 'Start Call'}
            </button>
          ) : (
            <>
              <button
                onClick={toggleMute}
                className={`${
                  isMuted
                    ? 'bg-yellow-600 hover:bg-yellow-700'
                    : 'bg-gray-600 hover:bg-gray-700'
                } text-white px-6 py-3 rounded-full font-medium transition-colors flex items-center gap-2`}
              >
                <span className="text-xl">{isMuted ? '🔇' : '🎤'}</span>
                {isMuted ? 'Unmute' : 'Mute'}
              </button>

              <button
                onClick={disconnect}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full font-medium transition-colors flex items-center gap-2"
              >
                <span className="text-xl">📵</span>
                End Call
              </button>
            </>
          )}
        </div>

        {/* Instructions */}
        {!isConnected && (
          <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            <p>Click &quot;Start Call&quot; to begin your voice reading with Baba Mara</p>
            <p className="mt-1">Make sure your microphone is enabled</p>
          </div>
        )}
      </div>
    </div>
  )
}
