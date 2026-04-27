/**
 * Curated AI video scenarios for the dog signature video.
 *
 * Each scenario produces a short (~5s) image-to-video clip when sent to Fal.ai
 * with the dog's primary photo. The photo IS the seed — Veo animates whatever
 * dog is visible in the image — so we deliberately do NOT substitute the
 * user-typed breed into the prompt. Doing so previously caused two classes of
 * failures: (1) any unusual breed string (e.g. "Catahoula Leopard Dog")
 * occasionally tripped Veo's safety filter, and (2) anything the user typed
 * that wasn't a recognized breed (e.g. "Badass") was rejected outright as
 * `no_media_generated`. Photo-led prompts work for any dog regardless of how
 * the owner described them.
 *
 * To add a scenario: append a new entry. The build randomly picks one with
 * weighted selection. Scenarios with `weight: 0` are disabled but kept for
 * reference.
 */

export type VideoScenario = {
  id: string;
  label: string;
  prompt: string;
  weight: number;
};

export const videoScenarios: VideoScenario[] = [
  {
    id: 'pilot',
    label: 'Flying a tiny airplane',
    prompt:
      'The dog wearing aviator goggles and a leather flight helmet, piloting a tiny vintage propeller airplane through fluffy clouds, cinematic close-up, golden hour lighting, viral social media style, 5 seconds',
    weight: 1,
  },
  {
    id: 'chef',
    label: 'Cooking in a chef hat',
    prompt:
      'The dog wearing a tall white chef hat, busy in a cozy kitchen flipping a small pancake in a pan, steam rising, warm soft lighting, viral social media style, 5 seconds',
    weight: 1,
  },
  {
    id: 'dj',
    label: 'DJ at a club',
    prompt:
      'The dog wearing oversized headphones, paws on a glowing DJ turntable, colorful club lights pulsing, smoke effects, viral social media style, 5 seconds',
    weight: 1,
  },
  {
    id: 'surfer',
    label: 'Surfing a wave',
    prompt:
      'The dog confidently surfing on a small surfboard riding a sunlit ocean wave, salt spray, ears flapping in the wind, cinematic, viral social media style, 5 seconds',
    weight: 1,
  },
  {
    id: 'astronaut',
    label: 'In an astronaut suit',
    prompt:
      'The dog wearing a tiny custom astronaut suit, floating gently inside a spaceship cockpit with stars visible through the window, cinematic, viral social media style, 5 seconds',
    weight: 1,
  },
  {
    id: 'skater',
    label: 'Skateboarding',
    prompt:
      'The dog confidently skateboarding through a sunlit suburban street, paws on the deck, ears flapping, golden hour lighting, viral social media style, 5 seconds',
    weight: 1,
  },
  {
    id: 'pianist',
    label: 'Playing piano',
    prompt:
      'The dog sitting at a grand piano, paws on the keys, gently swaying with the music, warm spotlight in a cozy concert hall, cinematic, viral social media style, 5 seconds',
    weight: 1,
  },
  {
    id: 'lemonade',
    label: 'Running a lemonade stand',
    prompt:
      'The dog behind a small wooden lemonade stand on a sunny suburban sidewalk, a wagging tail, colorful sign, warm cinematic lighting, viral social media style, 5 seconds',
    weight: 1,
  },
  {
    id: 'yoga',
    label: 'Doing yoga',
    prompt:
      'The dog calmly holding a yoga pose on a colorful mat in a sunlit studio, soft natural light from the window, peaceful expression, cinematic, viral social media style, 5 seconds',
    weight: 1,
  },
  {
    id: 'horse-rider',
    label: 'Riding a pony',
    prompt:
      'The dog confidently riding a small pony through a green meadow at sunset, ears flapping in the breeze, cinematic, viral social media style, 5 seconds',
    weight: 1,
  },
  {
    id: 'frisbee',
    label: 'Catching a frisbee',
    prompt:
      'The dog mid-leap catching a frisbee at a sunlit beach, sand spray under paws, ocean in the background, cinematic slow motion, viral social media style, 5 seconds',
    weight: 1,
  },
];

/**
 * Pick a scenario for a dog using weighted random selection.
 * Use a deterministic seed (e.g. dog id) to make picks repeatable in tests.
 */
export function pickScenario(seed?: string): VideoScenario {
  const enabled = videoScenarios.filter((s) => s.weight > 0);
  if (enabled.length === 0) {
    throw new Error('No video scenarios enabled');
  }

  const totalWeight = enabled.reduce((sum, s) => sum + s.weight, 0);
  const rand = seededRandom(seed) * totalWeight;

  let cumulative = 0;
  for (const scenario of enabled) {
    cumulative += scenario.weight;
    if (rand < cumulative) return scenario;
  }
  return enabled[enabled.length - 1];
}

/** Deterministic [0, 1) random from a string seed. Falls back to Math.random. */
function seededRandom(seed?: string): number {
  if (!seed) return Math.random();
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return (hash % 1_000_000) / 1_000_000;
}
