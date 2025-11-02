import { NextResponse } from 'next/server'

/**
 * Standard error codes used across the API
 */
export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_SESSION = 'INVALID_SESSION',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Resources
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',

  // Business Logic
  INSUFFICIENT_CREDITS = 'INSUFFICIENT_CREDITS',
  READING_LIMIT_EXCEEDED = 'READING_LIMIT_EXCEEDED',

  // Payments
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_DECLINED = 'PAYMENT_DECLINED',
  INVALID_PAYMENT = 'INVALID_PAYMENT',

  // Processing
  PROCESSING_ERROR = 'PROCESSING_ERROR',
  READING_TIMEOUT = 'READING_TIMEOUT',
  AI_GENERATION_FAILED = 'AI_GENERATION_FAILED',
  TTS_GENERATION_FAILED = 'TTS_GENERATION_FAILED',
  VOICE_UNAVAILABLE = 'VOICE_UNAVAILABLE',

  // Server
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  DATABASE_ERROR = 'DATABASE_ERROR',

  // Network
  NETWORK_ERROR = 'NETWORK_ERROR',
}

/**
 * Standard error response structure
 */
export interface ApiErrorResponse {
  error: {
    code: ErrorCode
    message: string
    details?: Record<string, unknown>
    timestamp?: string
  }
}

/**
 * HTTP status codes for different error types
 */
const ERROR_STATUS_MAP: Record<ErrorCode, number> = {
  // 400 Bad Request
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INVALID_INPUT]: 400,
  [ErrorCode.MISSING_REQUIRED_FIELD]: 400,
  [ErrorCode.INVALID_PAYMENT]: 400,

  // 401 Unauthorized
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.INVALID_SESSION]: 401,

  // 403 Forbidden
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.INSUFFICIENT_CREDITS]: 403,
  [ErrorCode.READING_LIMIT_EXCEEDED]: 403,

  // 404 Not Found
  [ErrorCode.NOT_FOUND]: 404,

  // 409 Conflict
  [ErrorCode.ALREADY_EXISTS]: 409,

  // 402 Payment Required
  [ErrorCode.PAYMENT_FAILED]: 402,
  [ErrorCode.PAYMENT_DECLINED]: 402,

  // 500 Internal Server Error
  [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.AI_GENERATION_FAILED]: 500,
  [ErrorCode.TTS_GENERATION_FAILED]: 500,

  // 503 Service Unavailable
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  [ErrorCode.VOICE_UNAVAILABLE]: 503,

  // 504 Gateway Timeout
  [ErrorCode.TIMEOUT]: 504,
  [ErrorCode.READING_TIMEOUT]: 504,

  // 500 for processing errors (generic)
  [ErrorCode.PROCESSING_ERROR]: 500,
  [ErrorCode.NETWORK_ERROR]: 500,
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>
): NextResponse<ApiErrorResponse> {
  const status = ERROR_STATUS_MAP[code] || 500

  return NextResponse.json(
    {
      error: {
        code,
        message,
        details,
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  )
}

/**
 * Common error response helpers
 */
export const ApiError = {
  unauthorized: (message = 'Authentication required') =>
    createErrorResponse(ErrorCode.UNAUTHORIZED, message),

  forbidden: (message = 'Access denied') =>
    createErrorResponse(ErrorCode.FORBIDDEN, message),

  notFound: (resource = 'Resource', details?: Record<string, unknown>) =>
    createErrorResponse(ErrorCode.NOT_FOUND, `${resource} not found`, details),

  validation: (message: string, details?: Record<string, unknown>) =>
    createErrorResponse(ErrorCode.VALIDATION_ERROR, message, details),

  insufficientCredits: (required = 1, available = 0) =>
    createErrorResponse(
      ErrorCode.INSUFFICIENT_CREDITS,
      'Insufficient credits to complete this action',
      { required, available }
    ),

  paymentFailed: (message = 'Payment processing failed', details?: Record<string, unknown>) =>
    createErrorResponse(ErrorCode.PAYMENT_FAILED, message, details),

  processingError: (message = 'Failed to process request', details?: Record<string, unknown>) =>
    createErrorResponse(ErrorCode.PROCESSING_ERROR, message, details),

  serverError: (message = 'Internal server error', details?: Record<string, unknown>) =>
    createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR, message, details),

  timeout: (operation = 'Operation') =>
    createErrorResponse(ErrorCode.TIMEOUT, `${operation} timed out`),

  invalidInput: (field: string, issue: string) =>
    createErrorResponse(
      ErrorCode.INVALID_INPUT,
      `Invalid ${field}: ${issue}`,
      { field, issue }
    ),

  alreadyExists: (resource = 'Resource') =>
    createErrorResponse(ErrorCode.ALREADY_EXISTS, `${resource} already exists`),

  serviceUnavailable: (service = 'Service') =>
    createErrorResponse(
      ErrorCode.SERVICE_UNAVAILABLE,
      `${service} is temporarily unavailable`
    ),
}

/**
 * Error response type guard
 */
export function isApiError(response: unknown): response is ApiErrorResponse {
  return Boolean(
    response &&
    typeof response === 'object' &&
    'error' in response &&
    typeof response.error === 'object' &&
    response.error !== null &&
    'code' in response.error &&
    'message' in response.error
  )
}

/**
 * Extract error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  }
  return 'An unknown error occurred'
}

/**
 * Log and return error response
 */
export async function handleApiError(
  error: unknown,
  context?: string
): Promise<NextResponse<ApiErrorResponse>> {
  console.error(`[API Error${context ? ` - ${context}` : ''}]:`, error)

  // Log to error logging service
  try {
    // Error logging can be implemented here if needed
    // const errorMessage = getErrorMessage(error)
    // const stackTrace = error instanceof Error ? error.stack : undefined
    // await logError({ context, message: errorMessage, stack: stackTrace })
  } catch (logError) {
    console.error('Failed to log error:', logError)
  }

  // Return generic error response
  return ApiError.serverError(
    process.env.NODE_ENV === 'development'
      ? getErrorMessage(error)
      : 'An unexpected error occurred'
  )
}
