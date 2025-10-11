import { test, expect } from '@playwright/test'

test.describe('User Authentication', () => {
  test('should display signin page with all elements', async ({ page }) => {
    await page.goto('/en/auth/signin')

    // Check page title
    await expect(page).toHaveTitle(/Baba Mara/)

    // Check form elements exist
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()

    // Check links
    await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /guest/i })).toBeVisible()
  })

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/en/auth/signin')

    // Click signin without filling form
    await page.getByRole('button', { name: /sign in/i }).click()

    // Should show HTML5 validation or custom error
    const emailInput = page.getByLabel(/email/i)
    await expect(emailInput).toBeFocused()
  })

  test('should show error for invalid email format', async ({ page }) => {
    await page.goto('/en/auth/signin')

    // Fill invalid email
    await page.getByLabel(/email/i).fill('invalid-email')
    await page.getByLabel(/password/i).fill('password123')
    await page.getByRole('button', { name: /sign in/i }).click()

    // Should show validation error
    const emailInput = page.getByLabel(/email/i)
    const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage)
    expect(validationMessage).toBeTruthy()
  })

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/en/auth/signin')

    // Click signup link
    await page.getByRole('link', { name: /sign up/i }).click()

    // Should navigate to signup page
    await expect(page).toHaveURL(/\/en\/auth\/signup/)
  })

  test('should navigate to guest mode', async ({ page }) => {
    await page.goto('/en/auth/signin')

    // Click guest link
    await page.getByRole('link', { name: /guest/i }).click()

    // Should navigate to guest page
    await expect(page).toHaveURL(/\/en\/auth\/guest/)
  })

  test('should support multi-language navigation', async ({ page }) => {
    // Test English
    await page.goto('/en/auth/signin')
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()

    // Test Turkish (if translations exist)
    await page.goto('/tr/auth/signin')
    await expect(page).toHaveURL(/\/tr\/auth\/signin/)

    // Test Serbian (if translations exist)
    await page.goto('/sr/auth/signin')
    await expect(page).toHaveURL(/\/sr\/auth\/signin/)
  })

  test('should have Google OAuth button', async ({ page }) => {
    await page.goto('/en/auth/signin')

    // Check for Google signin button
    const googleButton = page.getByRole('button', { name: /google/i })
    await expect(googleButton).toBeVisible()
  })
})

test.describe('Signup Flow', () => {
  test('should display signup page with all elements', async ({ page }) => {
    await page.goto('/en/auth/signup')

    // Check form elements exist
    await expect(page.getByLabel(/full name/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/^password$/i)).toBeVisible()
    await expect(page.getByLabel(/confirm password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible()

    // Check signin link
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible()
  })

  test('should validate password confirmation', async ({ page }) => {
    await page.goto('/en/auth/signup')

    await page.getByLabel(/full name/i).fill('Test User')
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/^password$/i).fill('password123')
    await page.getByLabel(/confirm password/i).fill('different-password')

    await page.getByRole('button', { name: /sign up/i }).click()

    // Should show password mismatch error
    // (This depends on implementation - might need to adjust selector)
    await expect(page.locator('text=/password.*match/i')).toBeVisible({
      timeout: 3000,
    })
  })
})

test.describe('Guest Mode', () => {
  test('should display guest mode page', async ({ page }) => {
    await page.goto('/en/auth/guest')

    // Check for continue button or guest access explanation
    await expect(page.getByRole('button', { name: /continue.*guest/i })).toBeVisible()
  })

  test('should have option to create account', async ({ page }) => {
    await page.goto('/en/auth/guest')

    // Should have link to signup
    await expect(page.getByRole('link', { name: /create.*account/i })).toBeVisible()
  })
})
