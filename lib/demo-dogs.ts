export type Dog = {
  id: string;
  name: string;
  breed: string;
  ageYears: number;
  size: 'Small' | 'Medium' | 'Large';
  energy: 'Chill' | 'Medium' | 'High';
  tags: string[];
  bio: string;
  photo: string;
  /** AI-generated signature video. When set, the card auto-plays this loop instead of `photo`. */
  videoUrl?: string;
  ownerName: string;
  ownerBio: string;
  distanceMiles: number;
  isMatch?: boolean;
};

export const demoDogs: Dog[] = [
  {
    id: '1',
    name: 'Biscuit',
    breed: 'Golden Retriever',
    ageYears: 3,
    size: 'Large',
    energy: 'High',
    tags: ['fetch-obsessed', 'loves water', 'gentle'],
    bio: 'Will trade any object in the world for a tennis ball. Afraid of vacuum cleaners.',
    photo: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&q=80',
    ownerName: 'Maya',
    ownerBio: 'Morning walker, early-30s, south end.',
    distanceMiles: 0.8,
  },
  {
    id: '2',
    name: 'Pickle',
    breed: 'French Bulldog',
    ageYears: 2,
    size: 'Small',
    energy: 'Medium',
    tags: ['snores', 'toddler-tested', 'loves treats'],
    bio: 'Half dog, half potato. Will sit on your feet until you move.',
    photo: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&q=80',
    ownerName: 'Jordan',
    ownerBio: 'Dad of two humans + one frog-shaped dog.',
    distanceMiles: 1.2,
    isMatch: true,
  },
  {
    id: '3',
    name: 'Juno',
    breed: 'Australian Shepherd',
    ageYears: 4,
    size: 'Medium',
    energy: 'High',
    tags: ['off-leash trained', 'agility', 'smart'],
    bio: 'Knows 14 tricks, invented 3 more. Will herd your children if asked nicely.',
    photo: 'https://images.unsplash.com/photo-1568572933382-74d440642117?w=800&q=80',
    ownerName: 'Sam',
    ownerBio: 'Trail runner, hates small talk, loves dog talk.',
    distanceMiles: 2.1,
  },
  {
    id: '4',
    name: 'Moose',
    breed: 'Bernese Mountain Dog',
    ageYears: 5,
    size: 'Large',
    energy: 'Chill',
    tags: ['gentle giant', 'kid-friendly', 'slow walks'],
    bio: 'Built like a couch, moves like a glacier. Ideal brunch companion.',
    photo: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=800&q=80',
    ownerName: 'Priya',
    ownerBio: 'Weekend hiker with a retired pup.',
    distanceMiles: 0.5,
  },
  {
    id: '5',
    name: 'Scout',
    breed: 'Border Collie Mix',
    ageYears: 1,
    size: 'Medium',
    energy: 'High',
    tags: ['puppy energy', 'still learning', 'park-obsessed'],
    bio: 'Newly adopted from the shelter. Zoomies at 7am sharp, every day.',
    photo: 'https://images.unsplash.com/photo-1567752881298-894bb81f9379?w=800&q=80',
    ownerName: 'Alex',
    ownerBio: 'First-time dog owner, taking it slow.',
    distanceMiles: 3.4,
  },
  {
    id: '6',
    name: 'Ruby',
    breed: 'Dachshund',
    ageYears: 6,
    size: 'Small',
    energy: 'Medium',
    tags: ['bossy', 'anti-squirrel', 'sweaters required'],
    bio: 'Tiny body, enormous opinions. Will tell you how she feels.',
    photo: 'https://images.unsplash.com/photo-1612774412771-005ed8e861d2?w=800&q=80',
    ownerName: 'Dani',
    ownerBio: 'Writer, plant person, loud laugher.',
    distanceMiles: 1.7,
  },
  {
    id: '7',
    name: 'Kobe',
    breed: 'Shiba Inu',
    ageYears: 3,
    size: 'Medium',
    energy: 'Medium',
    tags: ['cat-like', 'screams sometimes', 'photogenic'],
    bio: 'Acts like he owns the park. Possibly does. Will pose for photos.',
    photo: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&q=80',
    ownerName: 'Kenji',
    ownerBio: 'Designer, morning person, quiet walker.',
    distanceMiles: 2.9,
  },
  {
    id: '8',
    name: 'Waffles',
    breed: 'Corgi',
    ageYears: 2,
    size: 'Small',
    energy: 'High',
    tags: ['short king', 'sprint specialist', 'food motivated'],
    bio: 'Legs short, ambitions enormous. Runs faster than you expect.',
    photo: 'https://images.unsplash.com/photo-1612536057832-2ff7ead58194?w=800&q=80',
    ownerName: 'Riley',
    ownerBio: 'Cyclist with a dog-shaped sidecar.',
    distanceMiles: 4.2,
    isMatch: true,
  },
];
