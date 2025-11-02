/**
 * @jest-environment node
 */

import {
  ErrorCode,
  ApiError,
  createErrorResponse,
  isApiError,
  getErrorMessage,
} from '@/lib/api/errorResponse'

describe('lib/api/errorResponse', () => {
  describe('createErrorResponse', () => {
    it('should create a standardized error response', async () => {
      const response = createErrorResponse(
        ErrorCode.UNAUTHORIZED,
        'Authentication required'
      )

      const json = await response.json()
      expect(json).toMatchObject({
        error: {
          code: ErrorCode.UNAUTHORIZED,
          message: 'Authentication required',
        },
      })
      expect(response.status).toBe(401)
    })

    it('should include details when provided', async () => {
      const details = { userId: '123', reason: 'expired' }
      const response = createErrorResponse(
        ErrorCode.INVALID_SESSION,
        'Session expired',
        details
      )

      const json = await response.json()
      expect(json).toMatchObject({
        error: {
          code: ErrorCode.INVALID_SESSION,
          message: 'Session expired',
          details,
        },
      })
    })

    it('should include timestamp', async () => {
      const response = createErrorResponse(
        ErrorCode.NOT_FOUND,
        'Resource not found'
      )

      const json = await response.json()
      expect(json.error.timestamp).toBeDefined()
      expect(new Date(json.error.timestamp!).getTime()).toBeGreaterThan(0)
    })
  })

  describe('ApiError helpers', () => {
    it('unauthorized should return 401', () => {
      const response = ApiError.unauthorized()
      expect(response.status).toBe(401)
    })

    it('forbidden should return 403', () => {
      const response = ApiError.forbidden()
      expect(response.status).toBe(403)
    })

    it('notFound should return 404', async () => {
      const response = ApiError.notFound('User')
      const json = await response.json()
      expect(response.status).toBe(404)
      expect(json.error.message).toContain('User not found')
    })

    it('insufficientCredits should return 403 with credit details', async () => {
      const response = ApiError.insufficientCredits(5, 2)
      const json = await response.json()

      expect(response.status).toBe(403)
      expect(json.error.code).toBe(ErrorCode.INSUFFICIENT_CREDITS)
      expect(json.error.details).toEqual({ required: 5, available: 2 })
    })

    it('paymentFailed should return 402', async () => {
      const response = ApiError.paymentFailed('Card declined')
      const json = await response.json()

      expect(response.status).toBe(402)
      expect(json.error.message).toBe('Card declined')
    })

    it('serverError should return 500', () => {
      const response = ApiError.serverError()
      expect(response.status).toBe(500)
    })

    it('timeout should return 504', async () => {
      const response = ApiError.timeout('AI Generation')
      const json = await response.json()

      expect(response.status).toBe(504)
      expect(json.error.message).toContain('AI Generation timed out')
    })

    it('invalidInput should return 400 with field details', async () => {
      const response = ApiError.invalidInput('email', 'Invalid format')
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error.details).toEqual({ field: 'email', issue: 'Invalid format' })
    })
  })

  describe('isApiError', () => {
    it('should return true for valid error response', () => {
      const errorResponse = {
        error: {
          code: ErrorCode.NOT_FOUND,
          message: 'Not found',
        },
      }

      expect(isApiError(errorResponse)).toBe(true)
    })

    it('should return false for invalid structures', () => {
      expect(isApiError(null)).toBe(false)
      expect(isApiError(undefined)).toBe(false)
      expect(isApiError('error')).toBe(false)
      expect(isApiError({})).toBe(false)
      expect(isApiError({ error: 'string' })).toBe(false)
      expect(isApiError({ error: { message: 'test' } })).toBe(false)
      expect(isApiError({ error: { code: 'TEST' } })).toBe(false)
    })
  })

  describe('getErrorMessage', () => {
    it('should extract message from Error instance', () => {
      const error = new Error('Test error')
      expect(getErrorMessage(error)).toBe('Test error')
    })

    it('should return string directly', () => {
      expect(getErrorMessage('Error message')).toBe('Error message')
    })

    it('should extract message from object with message property', () => {
      const obj = { message: 'Object error' }
      expect(getErrorMessage(obj)).toBe('Object error')
    })

    it('should return default message for unknown types', () => {
      expect(getErrorMessage(null)).toBe('An unknown error occurred')
      expect(getErrorMessage(undefined)).toBe('An unknown error occurred')
      expect(getErrorMessage(123)).toBe('An unknown error occurred')
    })
  })
})
