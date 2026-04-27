import { test, expect } from '@playwright/test';

// Canary: confirms Playwright can reach the running web preview and the
// sign-in page renders. Full demo flow lives in sign-in.spec.ts / onboarding.spec.ts.
test('homepage renders the email input', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByPlaceholder('you@example.com')).toBeVisible({ timeout: 15_000 });
});
