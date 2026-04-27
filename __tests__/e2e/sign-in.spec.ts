import { test, expect } from '@playwright/test';

import { signIn, uniqueEmail } from './helpers/sign-in';

test('signs in via OTP and lands on a post-auth route', async ({ page }) => {
  const email = uniqueEmail('signin');
  await signIn(page, email);

  // New users have no dog, so /swipe redirects to /onboarding. Either is proof
  // the auth gate let us through.
  await expect
    .poll(() => new URL(page.url()).pathname, { timeout: 15_000 })
    .toMatch(/^\/(onboarding|swipe)$/);
});
