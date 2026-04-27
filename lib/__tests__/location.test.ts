import { describe, it, expect, vi } from 'vitest';

// expo-location's browser entry references the RN-injected `__DEV__` global,
// which doesn't exist in jsdom. Mock the framework boundary so haversineMiles
// (pure) can be imported without dragging in the native module.
vi.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: vi.fn(),
  getCurrentPositionAsync: vi.fn(),
  Accuracy: { Balanced: 3 },
}));

import { haversineMiles } from '@/lib/location';

describe('haversineMiles', () => {
  it('returns 0 for identical points', () => {
    expect(haversineMiles({ lat: 0, lng: 0 }, { lat: 0, lng: 0 })).toBe(0);
  });

  it('Seattle to Bellevue is ~6.0 miles', () => {
    const seattle = { lat: 47.6062, lng: -122.3321 };
    const bellevue = { lat: 47.6101, lng: -122.2015 };
    expect(haversineMiles(seattle, bellevue)).toBeCloseTo(6.0, 0);
  });

  it('is symmetric', () => {
    const a = { lat: 47.6062, lng: -122.3321 };
    const b = { lat: 47.6101, lng: -122.2015 };
    expect(haversineMiles(a, b)).toBeCloseTo(haversineMiles(b, a), 6);
  });
});
