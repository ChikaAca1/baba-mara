export interface ErrorLogData {
  error_type: string
  error_message: string
  stack_trace?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  endpoint?: string
  user_id?: string
}

/**
 * Handle API route errors
 * Returns standardized error response
 * Note: Logging should be done separately in API routes using server-side logError
 */
export function handleAPIError(error: unknown): Response {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error'
  const errorType = error instanceof Error ? error.name : 'UnknownError'

  // Return error response
  return new Response(
    JSON.stringify({
      error: errorMessage,
      type: errorType,
    }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}

/**
 * Client-side error logger
 * Send errors to API endpoint
 */
export async function logClientError(
  error: Error,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): Promise<void> {
  try {
    await fetch('/api/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error_type: error.name,
        error_message: error.message,
        stack_trace: error.stack,
        severity,
        endpoint: window.location.pathname,
      }),
    })
  } catch (logError) {
    console.error('Failed to log error:', logError)
  }
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Map specific errors to user-friendly messages
    const errorMappings: Record<string, string> = {
      'insufficient credits': 'You don\'t have enough credits for this action. Please purchase more credits.',
      'authentication required': 'Please sign in to continue.',
      'payment failed': 'Payment processing failed. Please try again or use a different payment method.',
      'network error': 'Connection error. Please check your internet connection and try again.',
      'timeout': 'Request timed out. Please try again.',
    }

    const lowerMessage = error.message.toLowerCase()
    for (const [key, message] of Object.entries(errorMappings)) {
      if (lowerMessage.includes(key)) {
        return message
      }
    }

    // Return original message if no mapping found
    return error.message
  }

  return 'An unexpected error occurred. Please try again.'
}

/**
 * Determine error severity
 */
export function determineErrorSeverity(error: unknown): 'low' | 'medium' | 'high' | 'critical' {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    if (message.includes('payment') || message.includes('transaction')) {
      return 'critical'
    }

    if (message.includes('auth') || message.includes('permission')) {
      return 'high'
    }

    if (message.includes('validation') || message.includes('invalid')) {
      return 'medium'
    }
  }

  return 'medium'
}
