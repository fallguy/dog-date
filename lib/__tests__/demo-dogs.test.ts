import { describe, it, expect } from 'vitest';
import { mapDogRowToCard, type DogRow } from '@/lib/demo-dogs';

const baseRow: DogRow = {
  id: 'd1',
  name: 'Test',
  breed: 'Mix',
  birthdate: null,
  size: 'Medium',
  energy: 'Medium',
  tags: [],
  notes: null,
  primary_photo_url: 'https://example.com/p.jpg',
  photos: null,
  ai_video_url: null,
  ai_video_status: 'idle',
  owner: null,
};

describe('mapDogRowToCard', () => {
  it('falls back to primary_photo_url when photos[] is empty', () => {
    expect(mapDogRowToCard(baseRow).photos).toEqual(['https://example.com/p.jpg']);
  });

  it('videoUrl is undefined when ai_video_status !== ready, even if ai_video_url is set', () => {
    const row = { ...baseRow, ai_video_url: 'https://v.example/x.mp4', ai_video_status: 'pending' };
    expect(mapDogRowToCard(row).videoUrl).toBeUndefined();
  });

  it('videoUrl equals ai_video_url only when ai_video_status === ready', () => {
    const row = { ...baseRow, ai_video_url: 'https://v.example/x.mp4', ai_video_status: 'ready' };
    expect(mapDogRowToCard(row).videoUrl).toBe('https://v.example/x.mp4');
  });

  it('ageYears derives from birthdate', () => {
    const birthdate = '2022-01-01';
    const expected = Math.floor(
      (Date.now() - new Date(birthdate).getTime()) / (365.25 * 24 * 3600 * 1000)
    );
    expect(mapDogRowToCard({ ...baseRow, birthdate }).ageYears).toBe(expected);
  });

  it('ownerName defaults to "Dog Owner" when owner is null', () => {
    expect(mapDogRowToCard(baseRow).ownerName).toBe('Dog Owner');
  });

  it('tags defaults to [] when null', () => {
    expect(mapDogRowToCard({ ...baseRow, tags: null }).tags).toEqual([]);
  });

  it('bio defaults to "" when notes is null', () => {
    expect(mapDogRowToCard({ ...baseRow, notes: null }).bio).toBe('');
  });
});
