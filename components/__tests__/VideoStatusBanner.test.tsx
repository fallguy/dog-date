import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// State stubbed per test. Mocks must be hoisted, so we read these via getters.
let mockDog: { id: string; name: string; ai_video_status: string; ai_video_url: string | null } | null = null;
let mockLastSeen: string | null = null;

vi.mock('@/lib/auth-store', () => ({
  useAuth: (selector: (s: { session: { user: { id: string } } | null }) => unknown) =>
    selector({ session: { user: { id: 'u1' } } }),
}));

vi.mock('@/lib/queries/useMyDog', () => ({
  useMyDog: () => ({ data: mockDog }),
}));

vi.mock('@/lib/hooks/useVideoPoller', () => ({
  useLatestPendingJob: () => ({ data: null }),
}));

vi.mock('@/lib/notifications-store', () => ({
  useNotifications: (selector: (s: { lastSeenVideoUrl: string | null; markSeen: (u: string) => void }) => unknown) =>
    selector({ lastSeenVideoUrl: mockLastSeen, markSeen: vi.fn() }),
}));

vi.mock('@/components/VideoPreviewModal', () => ({
  VideoPreviewModal: () => null,
}));

import { VideoStatusBanner } from '@/components/VideoStatusBanner';

const baseDog = { id: 'd1', name: 'Biscuit', ai_video_status: 'idle', ai_video_url: null as string | null };

describe('VideoStatusBanner', () => {
  beforeEach(() => {
    mockDog = null;
    mockLastSeen = null;
  });

  // No dog row → component returns null (effectively the "idle" path for new users).
  it('renders nothing when there is no dog', () => {
    render(<VideoStatusBanner />);
    expect(screen.queryByText(/star|ready|didn't generate/i)).toBeNull();
  });

  it('renders nothing for idle status (no banner variant matches)', () => {
    mockDog = { ...baseDog, ai_video_status: 'idle' };
    render(<VideoStatusBanner />);
    expect(screen.queryByText(/star|ready|didn't generate/i)).toBeNull();
  });

  it('shows the generating copy when status is pending', () => {
    mockDog = { ...baseDog, ai_video_status: 'pending' };
    render(<VideoStatusBanner />);
    expect(screen.getByText(/Biscuit is becoming a star/)).toBeTruthy();
  });

  it('shows the ready copy when a fresh video is ready', () => {
    mockDog = { ...baseDog, ai_video_status: 'ready', ai_video_url: 'https://example.com/v.mp4' };
    mockLastSeen = null;
    render(<VideoStatusBanner />);
    expect(screen.getByText(/video is ready/)).toBeTruthy();
  });

  it('shows the failed copy when status is failed', () => {
    mockDog = { ...baseDog, ai_video_status: 'failed' };
    render(<VideoStatusBanner />);
    expect(screen.getByText(/didn't generate/)).toBeTruthy();
  });
});
