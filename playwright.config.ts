import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './__tests__/e2e',
  timeout: 60_000,
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: 'http://localhost:8081',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  // We assume Metro + Supabase are already running locally. The README documents
  // the prereqs; auto-spinning Metro from Playwright fights with the Expo dev
  // server's stdout and tends to hang.
});
