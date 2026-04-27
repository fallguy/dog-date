import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import { render } from '@testing-library/react';
import { SwipeDeck, type SwipeDeckHandle } from '@/components/SwipeDeck';
import type { Dog } from '@/lib/demo-dogs';

const dog = (id: string, name: string): Dog => ({
  id,
  name,
  breed: 'Mix',
  ageYears: 2,
  size: 'Medium',
  energy: 'Medium',
  tags: [],
  bio: '',
  photo: 'https://example.com/p.jpg',
  photos: [],
  ownerName: 'O',
  ownerBio: '',
  distanceMiles: 0,
});

describe('SwipeDeck', () => {
  it('imperative swipe("like") fires onSwiped with the top dog and direction "like"', () => {
    const onSwiped = vi.fn();
    const ref = createRef<SwipeDeckHandle>();
    const dogs = [dog('1', 'Top'), dog('2', 'Next')];
    render(<SwipeDeck ref={ref} dogs={dogs} onSwiped={onSwiped} />);
    ref.current!.swipe('like');
    expect(onSwiped).toHaveBeenCalledTimes(1);
    expect(onSwiped).toHaveBeenCalledWith(dogs[0], 'like');
  });

  it('imperative swipe("pass") fires onSwiped with direction "pass"', () => {
    const onSwiped = vi.fn();
    const ref = createRef<SwipeDeckHandle>();
    const dogs = [dog('1', 'Top'), dog('2', 'Next')];
    render(<SwipeDeck ref={ref} dogs={dogs} onSwiped={onSwiped} />);
    ref.current!.swipe('pass');
    expect(onSwiped).toHaveBeenCalledWith(dogs[0], 'pass');
  });

  it('swipe on an empty deck does not call onSwiped', () => {
    const onSwiped = vi.fn();
    const ref = createRef<SwipeDeckHandle>();
    render(<SwipeDeck ref={ref} dogs={[]} onSwiped={onSwiped} />);
    ref.current!.swipe('like');
    expect(onSwiped).not.toHaveBeenCalled();
  });
});
