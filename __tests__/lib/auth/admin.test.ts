import { isUserAdmin } from '@/lib/auth/admin'
import { createClient } from '@/lib/supabase/server'

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

describe('Admin Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('isUserAdmin', () => {
    it('should return true for admin user', async () => {
      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() =>
                Promise.resolve({
                  data: { is_admin: true },
                  error: null,
                })
              ),
            })),
          })),
        })),
      }

      ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)

      const result = await isUserAdmin('test-user-id')
      expect(result).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith('users')
    })

    it('should return false for non-admin user', async () => {
      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() =>
                Promise.resolve({
                  data: { is_admin: false },
                  error: null,
                })
              ),
            })),
          })),
        })),
      }

      ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)

      const result = await isUserAdmin('test-user-id')
      expect(result).toBe(false)
    })

    it('should return false when user not found', async () => {
      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() =>
                Promise.resolve({
                  data: null,
                  error: { message: 'User not found' },
                })
              ),
            })),
          })),
        })),
      }

      ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)

      const result = await isUserAdmin('non-existent-user')
      expect(result).toBe(false)
    })

    it('should handle database errors gracefully', async () => {
      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() =>
                Promise.resolve({
                  data: null,
                  error: { message: 'Database connection error', code: 'CONNECTION_ERROR' },
                })
              ),
            })),
          })),
        })),
      }

      ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)

      const result = await isUserAdmin('test-user-id')
      expect(result).toBe(false)
    })
  })
})
