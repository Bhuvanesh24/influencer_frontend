import type { FollowerRange } from '@/components/ui/Badge';
import { apiClient } from '@/lib/api/client';
import type { Page, Pagination } from '@/lib/api/collabs';
import * as mock from '@/lib/api/mock/discovery';
import { IS_MOCK_API, mockDelay } from '@/lib/api/mock-mode';
import type { ContentType } from '@/lib/constants';
import type { TrustScore } from '@/lib/theme';

/**
 * Brand-side creator discovery and saved lists. Reconciled on 2026-10-14 against the backend's
 * `GET /creators` (creatorListQuerySchema → listCreators), `GET /creators/:userId`
 * (getCreatorById — note it takes the creator's *user* id), `GET /creators/:profileId/reviews`
 * and `/brands/me/saved-lists`.
 */

interface ApiEnvelope<T> {
  success: true;
  data: T;
  pagination?: Pagination;
}

export type DiscoverSort = 'newest' | 'engagement' | 'price_asc' | 'collabs' | 'best_value';

export interface CreatorFilters {
  platform?: 'instagram' | 'youtube';
  contentType?: ContentType;
  niche?: string[];
  language?: string[];
  state?: string[];
  followerRange?: FollowerRange;
  priceMin?: number;
  priceMax?: number;
  trustScore?: TrustScore;
  isAvailable?: boolean;
  sort: DiscoverSort;
}

export const DEFAULT_FILTERS: CreatorFilters = { sort: 'newest' };

/** How many filters (not counting sort) are set — the badge on the Filters button. */
export function activeFilterCount(f: CreatorFilters): number {
  return [
    f.platform,
    f.contentType,
    f.niche?.length,
    f.language?.length,
    f.state?.length,
    f.followerRange,
    f.priceMin !== undefined || f.priceMax !== undefined ? 1 : undefined,
    f.trustScore,
    f.isAvailable,
  ].filter(Boolean).length;
}

/** One card in Discover (listCreators' `cards`). */
export interface CreatorCardData {
  id: string;
  userId: string;
  displayName: string | null;
  profilePhotoUrl: string | null;
  creatorTitle: string | null;
  instagramHandle: string | null;
  followerRange: FollowerRange | null;
  coverPhoto: string | null;
  trustScore: TrustScore;
  niches: string[];
  startingPrice: string | null;
  city: string | null;
  state: string | null;
  isAvailable: boolean;
  totalCompletedCollabs: number;
  /** Which platforms the creator is on (derived; drives the platform icon). */
  platforms?: ('instagram' | 'youtube')[];
}

export interface PublicPackage {
  id: string;
  title: string;
  platform: 'instagram' | 'youtube' | 'both' | null;
  contentType: ContentType;
  description: string | null;
  quantity: number;
  price: string;
  recommendedMin: string | null;
  recommendedMax: string | null;
}

export interface CreatorPublicProfile {
  id: string;
  userId: string;
  displayName: string | null;
  profilePhotoUrl: string | null;
  creatorTitle: string | null;
  bio: string | null;
  instagramHandle: string | null;
  instagramFollowerRange: FollowerRange | null;
  youtubeChannelUrl: string | null;
  youtubeSubscriberRange: FollowerRange | null;
  coverPhotos: string[];
  featuredReelUrl: string | null;
  trustScore: TrustScore;
  totalCompletedCollabs: number;
  avgRating: string | null;
  totalReviews: number;
  isAvailable: boolean;
  state: string | null;
  city: string | null;
  district: string | null;
  country: string | null;
  niches: string[];
  languages: string[];
  packages: PublicPackage[];
}

export interface CreatorReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  brand: { companyName: string | null; logoUrl: string | null };
}

export interface CreatorReviews {
  avgRating: string | null;
  totalReviews: number;
  reviews: CreatorReview[];
}

export interface SavedListCreator {
  id: string;
  isAvailable: boolean;
  user: { id: string; displayName: string | null; profilePhotoUrl: string | null };
  niches: { niche: string }[];
}

export interface SavedList {
  id: string;
  name: string;
  createdAt: string;
  _count: { items: number };
  items: { creatorProfile: SavedListCreator }[];
}

// ---- Creators ---------------------------------------------------------------------------------

export async function listCreators(filters: CreatorFilters, page = 1, limit = 20): Promise<Page<CreatorCardData>> {
  if (IS_MOCK_API) {
    return mockDelay(mock.listCreators(filters, page, limit));
  }
  const { data } = await apiClient.get<ApiEnvelope<{ creators: CreatorCardData[]; pagination: Pagination }>>('/creators', {
    params: { ...filters, page, limit },
    // niche/language/state are arrays: repeat the key (?niche=Food&niche=Travel).
    paramsSerializer: { indexes: null },
  });
  return { items: data.data.creators, pagination: data.data.pagination };
}

/** `GET /creators/:userId`. */
export async function getCreatorPublicProfile(creatorUserId: string): Promise<CreatorPublicProfile> {
  if (IS_MOCK_API) {
    return mockDelay(mock.getCreatorPublicProfile(creatorUserId));
  }
  const { data } = await apiClient.get<ApiEnvelope<CreatorPublicProfile>>(`/creators/${creatorUserId}`);
  return data.data;
}

/** `GET /creators/:creatorProfileId/reviews` — brand reviews of the creator. */
export async function getCreatorReviews(creatorProfileId: string): Promise<CreatorReviews> {
  if (IS_MOCK_API) {
    return mockDelay(mock.getCreatorReviews(creatorProfileId), 250);
  }
  const { data } = await apiClient.get<ApiEnvelope<CreatorReviews>>(`/creators/${creatorProfileId}/reviews`);
  return data.data;
}

// ---- Saved lists ------------------------------------------------------------------------------

export async function getSavedLists(): Promise<SavedList[]> {
  if (IS_MOCK_API) {
    return mockDelay(mock.getSavedLists());
  }
  const { data } = await apiClient.get<ApiEnvelope<SavedList[]>>('/brands/me/saved-lists');
  return data.data;
}

export async function createSavedList(name: string): Promise<{ id: string }> {
  if (IS_MOCK_API) {
    return mockDelay(mock.createSavedList(name));
  }
  const { data } = await apiClient.post<ApiEnvelope<{ id: string }>>('/brands/me/saved-lists', { name });
  return data.data;
}

export async function deleteSavedList(listId: string): Promise<void> {
  if (IS_MOCK_API) {
    await mockDelay(undefined);
    mock.deleteSavedList(listId);
    return;
  }
  await apiClient.delete(`/brands/me/saved-lists/${listId}`);
}

export async function addToSavedList(listId: string, creatorProfileId: string): Promise<void> {
  if (IS_MOCK_API) {
    await mockDelay(undefined, 250);
    mock.addToSavedList(listId, creatorProfileId);
    return;
  }
  await apiClient.post(`/brands/me/saved-lists/${listId}/creators`, { creatorProfileId });
}

export async function removeFromSavedList(listId: string, creatorProfileId: string): Promise<void> {
  if (IS_MOCK_API) {
    await mockDelay(undefined, 250);
    mock.removeFromSavedList(listId, creatorProfileId);
    return;
  }
  await apiClient.delete(`/brands/me/saved-lists/${listId}/creators/${creatorProfileId}`);
}
