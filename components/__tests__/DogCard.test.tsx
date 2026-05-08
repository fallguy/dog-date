import { describe, it, expect } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DogCard } from '@/components/DogCard';
import type { Dog } from '@/lib/demo-dogs';

const fixture: Dog = {
  id: '1',
  name: 'Biscuit',
  breed: 'Golden Retriever',
  ageYears: 3,
  size: 'Large',
  energy: 'High',
  tags: ['fetch'],
  bio: 'tennis ball',
  photo: 'https://example.com/p.jpg',
  photos: ['https://example.com/p.jpg'],
  ownerName: 'Maya',
  ownerBio: '',
  distanceMiles: 0,
};

describe('DogCard', () => {
  it('renders the dog name', () => {
    render(<DogCard dog={fixture} />);
    expect(screen.getByText('Biscuit')).toBeTruthy();
  });

  it('renders breed in the meta line', () => {
    render(<DogCard dog={fixture} />);
    expect(screen.getByText(/Golden Retriever/)).toBeTruthy();
  });

  it('renders ageYears', () => {
    render(<DogCard dog={fixture} />);
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('hides AI badge when videoUrl is undefined', () => {
    render(<DogCard dog={fixture} />);
    expect(screen.queryByText('AI')).toBeNull();
  });

  it('shows AI badge when videoUrl is set', () => {
    render(<DogCard dog={{ ...fixture, videoUrl: 'v.mp4' }} />);
    expect(screen.getByText('AI')).toBeTruthy();
  });

  it('renders distance pill when distanceMiles > 0', () => {
    render(<DogCard dog={{ ...fixture, distanceMiles: 4 }} />);
    expect(screen.getByText('4mi')).toBeTruthy();
  });

  it('hides distance pill when distanceMiles is 0', () => {
    render(<DogCard dog={fixture} />);
    expect(screen.queryByText(/mi$/)).toBeNull();
  });

  // Regression test for Gotcha 3: web's <img>/<video> default to pointer-events:auto
  // and swallow drag events before the SwipeDeck's GestureDetector sees them.
  // DogCard fixes this by wrapping each media element in <View pointerEvents="none">.
  // RN-web compiles that prop to a generated class (e.g. r-pointerEvents-633pao);
  // asserting on a class containing "pointerEvents" survives RN-web hash changes.
  it('wraps the photo in a pointer-events:none parent', () => {
    const { container } = render(<DogCard dog={fixture} />);
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    const parentClass = img!.parentElement?.className ?? '';
    expect(parentClass).toMatch(/pointerEvents/);
  });

  // Default state: minimal front. Tags/bio/owner are rendered into the
  // off-screen sheet for animation continuity, but the chevron's
  // aria-expanded is the source of truth for state.
  it('starts collapsed (chevron aria-expanded=false)', () => {
    render(<DogCard dog={fixture} />);
    const chevron = screen.getByLabelText('Show details');
    expect(chevron.getAttribute('aria-expanded')).toBe('false');
  });

  it('expands when the chevron is tapped', () => {
    render(<DogCard dog={fixture} />);
    fireEvent.click(screen.getByLabelText('Show details'));
    const chevron = screen.getByLabelText('Hide details');
    expect(chevron.getAttribute('aria-expanded')).toBe('true');
  });

  it('renders tags + bio + owner content (visible only when expanded)', () => {
    render(
      <DogCard
        dog={{
          ...fixture,
          tags: ['fetch-obsessed', 'loves water'],
          bio: 'tennis ball fanatic',
          ownerName: 'Maya',
          ownerBio: 'Morning walker, south end.',
        }}
      />,
    );
    // Sheet content is in the DOM (off-screen) so users tab into it after
    // expanding. The chips/bio/owner all exist regardless of expand state.
    expect(screen.getByText('fetch-obsessed')).toBeTruthy();
    expect(screen.getByText('loves water')).toBeTruthy();
    expect(screen.getByText('tennis ball fanatic')).toBeTruthy();
    expect(screen.getByText('Maya')).toBeTruthy();
    expect(screen.getByText(/Morning walker/)).toBeTruthy();
  });

  it('collapses when the chevron is tapped again', () => {
    render(<DogCard dog={fixture} />);
    fireEvent.click(screen.getByLabelText('Show details'));
    fireEvent.click(screen.getByLabelText('Hide details'));
    expect(screen.getByLabelText('Show details').getAttribute('aria-expanded'))
      .toBe('false');
  });
});
