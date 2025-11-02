import {
  getUserFriendlyErrorMessage,
  determineErrorSeverity,
} from '@/lib/errors/errorHandler'

describe('lib/errors/errorHandler', () => {
  describe('getUserFriendlyErrorMessage', () => {
    it('should map insufficient credits error', () => {
      const error = new Error('insufficient credits for this action')
      const message = getUserFriendlyErrorMessage(error)

      expect(message).toContain("don't have enough credits")
      expect(message).toContain('purchase more')
    })

    it('should map authentication required error', () => {
      const error = new Error('authentication required to continue')
      const message = getUserFriendlyErrorMessage(error)

      expect(message).toContain('sign in')
    })

    it('should map payment failed error', () => {
      const error = new Error('payment failed to process')
      const message = getUserFriendlyErrorMessage(error)

      expect(message).toContain('Payment processing failed')
      expect(message).toContain('try again')
    })

    it('should map network error', () => {
      const error = new Error('network error occurred')
      const message = getUserFriendlyErrorMessage(error)

      expect(message).toContain('Connection error')
      expect(message).toContain('internet connection')
    })

    it('should map timeout error', () => {
      const error = new Error('request timeout exceeded')
      const message = getUserFriendlyErrorMessage(error)

      expect(message).toContain('timed out')
      expect(message).toContain('try again')
    })

    it('should return original message if no mapping found', () => {
      const error = new Error('Some specific error message')
      const message = getUserFriendlyErrorMessage(error)

      expect(message).toBe('Some specific error message')
    })

    it('should handle non-Error objects', () => {
      const message = getUserFriendlyErrorMessage('string error')
      expect(message).toBe('An unexpected error occurred. Please try again.')
    })

    it('should handle null/undefined', () => {
      expect(getUserFriendlyErrorMessage(null)).toBe(
        'An unexpected error occurred. Please try again.'
      )
      expect(getUserFriendlyErrorMessage(undefined)).toBe(
        'An unexpected error occurred. Please try again.'
      )
    })

    it('should be case-insensitive', () => {
      const error1 = new Error('INSUFFICIENT CREDITS')
      const error2 = new Error('Insufficient Credits')
      const error3 = new Error('insufficient credits')

      const message1 = getUserFriendlyErrorMessage(error1)
      const message2 = getUserFriendlyErrorMessage(error2)
      const message3 = getUserFriendlyErrorMessage(error3)

      expect(message1).toBe(message2)
      expect(message2).toBe(message3)
    })
  })

  describe('determineErrorSeverity', () => {
    it('should classify payment errors as critical', () => {
      const error = new Error('payment processing failed')
      expect(determineErrorSeverity(error)).toBe('critical')
    })

    it('should classify transaction errors as critical', () => {
      const error = new Error('transaction declined')
      expect(determineErrorSeverity(error)).toBe('critical')
    })

    it('should classify auth errors as high', () => {
      const authError = new Error('authentication failed')
      expect(determineErrorSeverity(authError)).toBe('high')
    })

    it('should classify permission errors as high', () => {
      const permError = new Error('permission denied')
      expect(determineErrorSeverity(permError)).toBe('high')
    })

    it('should classify validation errors as medium', () => {
      const valError = new Error('validation failed for input')
      expect(determineErrorSeverity(valError)).toBe('medium')
    })

    it('should classify invalid errors as medium', () => {
      const invError = new Error('invalid request format')
      expect(determineErrorSeverity(invError)).toBe('medium')
    })

    it('should default to medium for unknown errors', () => {
      const unknownError = new Error('something went wrong')
      expect(determineErrorSeverity(unknownError)).toBe('medium')
    })

    it('should handle non-Error objects as medium', () => {
      expect(determineErrorSeverity('error string')).toBe('medium')
      expect(determineErrorSeverity(null)).toBe('medium')
      expect(determineErrorSeverity(undefined)).toBe('medium')
    })

    it('should prioritize critical over high', () => {
      // If error message contains both 'payment' and 'auth'
      const error = new Error('payment authentication failed')
      // Should be critical (payment takes precedence)
      expect(determineErrorSeverity(error)).toBe('critical')
    })

    it('should be case-insensitive', () => {
      const error1 = new Error('PAYMENT FAILED')
      const error2 = new Error('Payment Failed')
      const error3 = new Error('payment failed')

      expect(determineErrorSeverity(error1)).toBe('critical')
      expect(determineErrorSeverity(error2)).toBe('critical')
      expect(determineErrorSeverity(error3)).toBe('critical')
    })
  })

  describe('Error classification integration', () => {
    it('should correctly classify and format insufficient credits error', () => {
      const error = new Error('insufficient credits')

      const severity = determineErrorSeverity(error)
      const message = getUserFriendlyErrorMessage(error)

      expect(severity).toBe('medium') // validation/business logic error
      expect(message).toContain("don't have enough credits")
    })

    it('should correctly classify and format payment errors', () => {
      const error = new Error('payment failed to process')

      const severity = determineErrorSeverity(error)
      const message = getUserFriendlyErrorMessage(error)

      expect(severity).toBe('critical')
      expect(message).toContain('Payment processing failed')
    })

    it('should correctly classify and format auth errors', () => {
      const error = new Error('authentication required to continue')

      const severity = determineErrorSeverity(error)
      const message = getUserFriendlyErrorMessage(error)

      expect(severity).toBe('high')
      expect(message).toContain('sign in')
    })
  })
})
