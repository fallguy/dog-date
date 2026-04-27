import path from 'node:path';

import { test, expect } from '@playwright/test';

import { signIn, uniqueEmail } from './helpers/sign-in';

const PHOTO_FIXTURE = path.resolve(__dirname, '../../assets/images/icon.png');

test('completes onboarding and routes to /generate-video', async ({ page }) => {
  await signIn(page, uniqueEmail('onboarding'));
  await page.waitForURL(/\/onboarding$/, { timeout: 15_000 });

  // expo-image-picker on web triggers a hidden <input type="file"> on press.
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByText('Add a photo').click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(PHOTO_FIXTURE);

  await page.getByPlaceholder('Biscuit').fill('Testdog');
  await page.getByPlaceholder('Golden Retriever').fill('Mixed');
  await page.getByText('Small', { exact: true }).click();
  await page.getByText('Chill', { exact: true }).click();

  await page.getByText('Continue', { exact: true }).click();

  await page.waitForURL(/\/generate-video$/, { timeout: 20_000 });
  expect(new URL(page.url()).pathname).toBe('/generate-video');
});
