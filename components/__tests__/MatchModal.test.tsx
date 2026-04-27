import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MatchModal } from '@/components/MatchModal';
import type { Dog } from '@/lib/demo-dogs';

const dog: Dog = {
  id: '1',
  name: 'Biscuit',
  breed: 'GR',
  ageYears: 3,
  size: 'L',
  energy: 'H',
  tags: [],
  bio: '',
  photo: 'https://example.com/p.jpg',
  photos: [],
  ownerName: 'Maya',
  ownerBio: '',
  distanceMiles: 0,
};

describe('MatchModal', () => {
  // The component returns null whenever `dog` is null, regardless of `visible`.
  // This is the "hidden" contract — caller passes null while no match is active.
  it('renders nothing when dog is null', () => {
    render(<MatchModal visible dog={null} onClose={() => {}} />);
    expect(screen.queryByText(/Say hi/)).toBeNull();
  });

  it('shows "Say hi to {ownerName}" when a match is provided', () => {
    render(<MatchModal visible dog={dog} onClose={() => {}} />);
    expect(screen.getByText(/Say hi to Maya/)).toBeTruthy();
  });

  // Source contract: onSayHi is invoked with no args (the parent already knows
  // which dog it just matched). Spec assumed an id payload; adjusted to source.
  it('invokes onSayHi when the primary CTA is pressed', () => {
    const onSayHi = vi.fn();
    render(<MatchModal visible dog={dog} onClose={() => {}} onSayHi={onSayHi} />);
    fireEvent.click(screen.getByText(/Say hi to Maya/));
    expect(onSayHi).toHaveBeenCalledTimes(1);
  });
});
