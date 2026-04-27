import { describe, it, expect } from 'vitest';
import { pickScenario, videoScenarios } from '@/lib/video-scenarios';

describe('pickScenario', () => {
  it('is deterministic for the same seed', () => {
    expect(pickScenario('seed-a').id).toBe(pickScenario('seed-a').id);
  });

  it('differs for at least one seed pair (hash-based distribution)', () => {
    // Seeds of varying length so the *31-rolling hash diverges across buckets.
    const ids = ['x', 'foo', 'seed-a', 'much-longer-seed-string'].map((s) => pickScenario(s).id);
    const unique = new Set(ids);
    expect(unique.size).toBeGreaterThan(1);
  });

  it('all scenarios in the registry have weight > 0', () => {
    for (const s of videoScenarios) {
      expect(s.weight).toBeGreaterThan(0);
    }
  });

  // The "all weights zero" branch in pickScenario is unreachable through the public API
  // without mutating the exported `const` array. Verified by code-read in
  // lib/video-scenarios.ts: `if (enabled.length === 0) throw new Error('No video scenarios enabled')`.
  // Skipping rather than mocking the module — the contract is asserted above (every entry > 0)
  // and the throw is one line.
});
