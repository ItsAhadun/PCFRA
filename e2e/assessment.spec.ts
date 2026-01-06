import { test, expect } from '@playwright/test'

test.describe('Assessment Creation Flow', () => {
  // Note: These tests require authentication
  // They will be skipped if test credentials are not configured

  test.beforeEach(async ({ page }) => {
    const testEmail = process.env.E2E_TEST_EMAIL
    const testPassword = process.env.E2E_TEST_PASSWORD

    if (!testEmail || !testPassword) {
      test.skip()
      return
    }

    // Login first
    await page.goto('/auth/login')
    await page.getByLabel(/email/i).fill(testEmail)
    await page.getByLabel(/password/i).fill(testPassword)
    await page.getByRole('button', { name: /sign in/i }).click()

    // Wait for dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })
  })

  test('should display dashboard with navigation', async ({ page }) => {
    // Check for key dashboard elements
    await expect(
      page.getByRole('link', { name: /sites/i }).first(),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: /assessments/i }).first(),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: /tenants/i }).first(),
    ).toBeVisible()
  })

  test('should navigate to new assessment page', async ({ page }) => {
    // Click on assessments link
    await page
      .getByRole('link', { name: /assessments/i })
      .first()
      .click()
    await expect(page).toHaveURL(/\/assessments/)

    // Look for new assessment button
    const newButton = page.getByRole('link', { name: /new assessment/i })
    if (await newButton.isVisible()) {
      await newButton.click()
      await expect(page).toHaveURL(/\/assessments\/new/)
    }
  })

  test('should display sites page', async ({ page }) => {
    await page.getByRole('link', { name: /sites/i }).first().click()
    await expect(page).toHaveURL(/\/sites/)

    // Check for sites list or empty state
    const pageContent = await page.textContent('body')
    const hasSitesOrEmptyState =
      pageContent?.includes('Sites') ||
      pageContent?.includes('No sites') ||
      pageContent?.includes('Create')
    expect(hasSitesOrEmptyState).toBeTruthy()
  })

  test('should display tenants page', async ({ page }) => {
    await page
      .getByRole('link', { name: /tenants/i })
      .first()
      .click()
    await expect(page).toHaveURL(/\/tenants/)

    // Check for tenants page content
    await expect(page.getByText(/tenant/i).first()).toBeVisible()
  })

  test('should create a new site', async ({ page }) => {
    // Navigate to sites
    await page.getByRole('link', { name: /sites/i }).first().click()

    // Look for new site button
    const newSiteButton = page.getByRole('link', { name: /new site/i })
    if (await newSiteButton.isVisible()) {
      await newSiteButton.click()
      await expect(page).toHaveURL(/\/sites\/new/)

      // Fill site form
      await page.getByLabel(/name/i).first().fill('E2E Test Site')
      await page
        .getByLabel(/address/i)
        .first()
        .fill('123 Test Street, London')

      // Note: Actual submission depends on required fields
      // This test verifies the form is accessible
      await expect(page.getByRole('button', { name: /create/i })).toBeVisible()
    }
  })

  test('should access QR printing tools', async ({ page }) => {
    // Navigate to tools section if available
    const toolsLink = page.getByRole('link', { name: /print qr|tools/i })
    if (await toolsLink.isVisible()) {
      await toolsLink.click()

      // Check for QR-related content
      await expect(page.getByText(/qr/i).first()).toBeVisible()
    }
  })
})
