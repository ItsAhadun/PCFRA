import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/auth/login')

    // Check for login form elements
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/auth/login')

    // Click submit without filling form
    await page.getByRole('button', { name: /sign in/i }).click()

    // Should still be on login page (form validation prevents submission)
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/login')

    // Fill with invalid credentials
    await page.getByLabel(/email/i).fill('invalid@example.com')
    await page.getByLabel(/password/i).fill('wrongpassword123')

    // Submit
    await page.getByRole('button', { name: /sign in/i }).click()

    // Wait for error message (Supabase returns error)
    await expect(
      page.getByText(/invalid|error|incorrect/i).first(),
    ).toBeVisible({ timeout: 10000 })
  })

  test('should redirect to dashboard after successful login', async ({
    page,
  }) => {
    // Skip this test if no test credentials are configured
    const testEmail = process.env.E2E_TEST_EMAIL
    const testPassword = process.env.E2E_TEST_PASSWORD

    if (!testEmail || !testPassword) {
      test.skip()
      return
    }

    await page.goto('/auth/login')

    // Fill with valid test credentials
    await page.getByLabel(/email/i).fill(testEmail)
    await page.getByLabel(/password/i).fill(testPassword)

    // Submit
    await page.getByRole('button', { name: /sign in/i }).click()

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })
  })

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/auth/login')

    // Click sign up link
    await page.getByRole('link', { name: /sign up/i }).click()

    // Should be on signup page
    await expect(page).toHaveURL(/\/auth\/sign-up/)
  })

  test('should navigate to forgot password page', async ({ page }) => {
    await page.goto('/auth/login')

    // Click forgot password link
    await page.getByRole('link', { name: /forgot/i }).click()

    // Should be on forgot password page
    await expect(page).toHaveURL(/\/auth\/forgot-password/)
  })
})
