import type { Page } from '@playwright/test';

const MAILPIT_BASE = 'http://localhost:54324';

export function uniqueEmail(label: string): string {
  return `demo+${label}-${Date.now()}@example.local`;
}

// Mailpit's snippet looks like: "...Alternatively, enter the code: 578960".
// The match is intentionally loose so a small template tweak doesn't break us.
async function fetchOtp(email: string): Promise<string> {
  const deadline = Date.now() + 8_000;
  const query = encodeURIComponent(`to:${email}`);
  while (Date.now() < deadline) {
    const res = await fetch(`${MAILPIT_BASE}/api/v1/search?query=${query}&limit=1`);
    if (res.ok) {
      const body = (await res.json()) as { messages?: Array<{ Snippet?: string }> };
      const snippet = body.messages?.[0]?.Snippet ?? '';
      const match = snippet.match(/(\d{6})/);
      if (match) return match[1];
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No OTP for ${email} within 8s`);
}

export async function signIn(page: Page, email: string): Promise<void> {
  await page.goto('/');
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByText('Send sign-in code').click();
  await page.getByPlaceholder('123456').waitFor({ state: 'visible' });

  const code = await fetchOtp(email);
  await page.getByPlaceholder('123456').fill(code);
  await page.getByText('Sign in', { exact: true }).click();
}
