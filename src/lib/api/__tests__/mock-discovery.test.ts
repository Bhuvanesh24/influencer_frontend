import { replaceDb } from '@/lib/api/mock/db';
import * as discovery from '@/lib/api/mock/discovery';
import { DEMO_ACCOUNTS, DEMO_PASSWORD, seedDb } from '@/lib/api/mock/seed';
import { mockLogin } from '@/lib/api/mock/session';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

beforeEach(() => {
  replaceDb(seedDb());
  mockLogin(DEMO_ACCOUNTS.brand.email, DEMO_PASSWORD);
});

describe('mock discovery', () => {
  it('filters by niche, trust score and price', () => {
    const food = discovery.listCreators({ sort: 'newest', niche: ['Food'] }, 1, 20).items;
    expect(food.map((c) => c.displayName).sort()).toEqual(['Aanya Rao', 'Kabir Sethi']);

    const high = discovery.listCreators({ sort: 'newest', trustScore: 'high' }, 1, 20).items;
    expect(high.every((c) => c.trustScore === 'high')).toBe(true);

    const cheap = discovery.listCreators({ sort: 'price_asc', priceMax: 7000 }, 1, 20).items;
    expect(cheap.map((c) => Number(c.startingPrice))).toEqual([...cheap.map((c) => Number(c.startingPrice))].sort((a, b) => a - b));
    expect(cheap.every((c) => Number(c.startingPrice) <= 7000)).toBe(true);
  });

  it('shows a follower range, never a count', () => {
    const [card] = discovery.listCreators({ sort: 'newest' }, 1, 1).items;
    expect(card.followerRange).toMatch(/^(under_1k|range_)/);
    expect(card).not.toHaveProperty('instagramFollowers');
  });

  it('builds a public profile with reviews from brands only', () => {
    const profile = discovery.getCreatorPublicProfile(DEMO_ACCOUNTS.creator.userId);
    expect(profile.packages.every((p) => p.id.startsWith('pk-aanya'))).toBe(true);
    expect(profile.packages.some((p) => p.title === 'Reel + stories bundle')).toBe(false);
    const reviews = discovery.getCreatorReviews(profile.id);
    expect(reviews.totalReviews).toBe(2);
  });

  it('creates a list, adds and removes a creator, and rejects duplicates', () => {
    const { id } = discovery.createSavedList('Trial');
    discovery.addToSavedList(id, 'cr-rohan');
    expect(() => discovery.addToSavedList(id, 'cr-rohan')).toThrow(/already/);
    expect(discovery.getSavedLists().find((l) => l.id === id)?._count.items).toBe(1);
    discovery.removeFromSavedList(id, 'cr-rohan');
    expect(discovery.getSavedLists().find((l) => l.id === id)?._count.items).toBe(0);
  });
});
