import type { Page } from '@/lib/api/collabs';
import type {
  CreatorCardData,
  CreatorFilters,
  CreatorPublicProfile,
  CreatorReviews,
  SavedList,
} from '@/lib/api/discovery';

import { db, MockApiError, nowIso, paginate, persistDb, uid, type MockCreator } from './db';
import { currentBrand } from './session';

function userOf(c: MockCreator) {
  return db.users.find((u) => u.id === c.userId);
}

function activePackagesOf(c: MockCreator) {
  return db.packages.filter((p) => p.creatorProfileId === c.id && p.isActive);
}

function startingPrice(c: MockCreator): number | null {
  const prices = activePackagesOf(c).map((p) => Number(p.price));
  return prices.length ? Math.min(...prices) : null;
}

function brandReviewsOf(c: MockCreator) {
  return db.deals
    .filter((d) => d.creatorProfileId === c.id)
    .flatMap((d) => d.reviews.filter((r) => r.reviewerRole === 'brand').map((r) => ({ review: r, deal: d })));
}

function toCard(c: MockCreator): CreatorCardData {
  const user = userOf(c);
  const price = startingPrice(c);
  const platforms: ('instagram' | 'youtube')[] = [];
  if (c.instagramHandle) platforms.push('instagram');
  if (c.youtubeChannelUrl) platforms.push('youtube');
  return {
    id: c.id,
    userId: c.userId,
    displayName: user?.displayName ?? null,
    profilePhotoUrl: user?.profilePhotoUrl ?? null,
    creatorTitle: c.creatorTitle,
    instagramHandle: c.instagramHandle,
    followerRange: c.instagramFollowerRange ?? c.youtubeSubscriberRange,
    coverPhoto: c.coverPhotos[0] ?? null,
    trustScore: c.trustScore,
    niches: c.niches,
    startingPrice: price === null ? null : price.toFixed(2),
    city: c.city,
    state: c.state,
    isAvailable: c.isAvailable,
    totalCompletedCollabs: c.totalCompletedCollabs,
    platforms,
  };
}

/** Mirrors listCreators' filters; the price sort is exact here (the backend approximates it). */
export function listCreators(f: CreatorFilters, page: number, limit: number): Page<CreatorCardData> {
  currentBrand();
  let list = db.creators.filter((c) => {
    const user = userOf(c);
    if (!user || user.accountType !== 'creator') return false;
    if (f.platform === 'instagram' && !c.instagramHandle) return false;
    if (f.platform === 'youtube' && !c.youtubeSubscriberRange) return false;
    if (f.niche?.length && !c.niches.some((n) => f.niche!.includes(n))) return false;
    if (f.language?.length && !c.languages.some((l) => f.language!.includes(l))) return false;
    if (f.state?.length && (!c.state || !f.state.includes(c.state))) return false;
    if (f.followerRange && c.instagramFollowerRange !== f.followerRange && c.youtubeSubscriberRange !== f.followerRange) {
      return false;
    }
    if (f.trustScore && c.trustScore !== f.trustScore) return false;
    if (f.isAvailable !== undefined && c.isAvailable !== f.isAvailable) return false;
    const pkgs = activePackagesOf(c);
    if (f.contentType && !pkgs.some((p) => p.contentType === f.contentType)) return false;
    if (
      (f.priceMin !== undefined || f.priceMax !== undefined) &&
      !pkgs.some((p) => Number(p.price) >= (f.priceMin ?? 0) && Number(p.price) <= (f.priceMax ?? Infinity))
    ) {
      return false;
    }
    return true;
  });

  const eng = (c: MockCreator) => Number(c.instagramEngagementRate ?? 0);
  switch (f.sort) {
    case 'collabs':
      list = list.sort((a, b) => b.totalCompletedCollabs - a.totalCompletedCollabs);
      break;
    case 'engagement':
    case 'best_value':
      list = list.sort((a, b) => eng(b) - eng(a));
      break;
    case 'price_asc':
      list = list.sort((a, b) => (startingPrice(a) ?? Infinity) - (startingPrice(b) ?? Infinity));
      break;
    default:
      list = list.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id));
  }

  const { items, pagination } = paginate(list, page, limit);
  return { items: items.map(toCard), pagination };
}

export function getCreatorPublicProfile(creatorUserId: string): CreatorPublicProfile {
  const c = db.creators.find((x) => x.userId === creatorUserId);
  if (!c) throw new MockApiError('Creator not found', 404);
  const user = userOf(c);
  const reviews = brandReviewsOf(c);
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.review.rating, 0) / reviews.length : null;
  return {
    id: c.id,
    userId: c.userId,
    displayName: user?.displayName ?? null,
    profilePhotoUrl: user?.profilePhotoUrl ?? null,
    creatorTitle: c.creatorTitle,
    bio: c.bio,
    instagramHandle: c.instagramHandle,
    instagramFollowerRange: c.instagramFollowerRange,
    youtubeChannelUrl: c.youtubeChannelUrl,
    youtubeSubscriberRange: c.youtubeSubscriberRange,
    coverPhotos: c.coverPhotos,
    featuredReelUrl: c.featuredReelUrl,
    trustScore: c.trustScore,
    totalCompletedCollabs: c.totalCompletedCollabs,
    avgRating: avg === null ? null : avg.toFixed(2),
    totalReviews: reviews.length,
    isAvailable: c.isAvailable,
    state: c.state,
    city: c.city,
    district: c.district,
    country: c.country,
    niches: c.niches,
    languages: c.languages,
    packages: activePackagesOf(c)
      .sort((a, b) => a.contentType.localeCompare(b.contentType) || Number(a.price) - Number(b.price))
      .map((p) => ({
        id: p.id,
        title: p.title,
        platform: p.platform,
        contentType: p.contentType,
        description: p.description,
        quantity: p.quantity,
        price: p.price,
        recommendedMin: p.recommendedMin,
        recommendedMax: p.recommendedMax,
      })),
  };
}

export function getCreatorReviews(creatorProfileId: string): CreatorReviews {
  const c = db.creators.find((x) => x.id === creatorProfileId);
  if (!c) throw new MockApiError('Creator not found', 404);
  const reviews = brandReviewsOf(c).sort((a, b) => b.review.createdAt.localeCompare(a.review.createdAt));
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.review.rating, 0) / reviews.length : null;
  return {
    avgRating: avg === null ? null : avg.toFixed(2),
    totalReviews: reviews.length,
    reviews: reviews.map(({ review, deal }) => {
      const brand = db.brands.find((b) => b.id === deal.brandProfileId);
      return {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        brand: brand?.showBrandNameInCollabs
          ? { companyName: brand.companyName, logoUrl: brand.logoUrl }
          : { companyName: 'Anonymous Brand', logoUrl: null },
      };
    }),
  };
}

// ---- Saved lists ------------------------------------------------------------------------------

function toSavedList(list: (typeof db.savedLists)[number]): SavedList {
  return {
    id: list.id,
    name: list.name,
    createdAt: list.createdAt,
    _count: { items: list.creatorProfileIds.length },
    items: list.creatorProfileIds
      .map((id) => db.creators.find((c) => c.id === id))
      .filter((c): c is MockCreator => !!c)
      .map((c) => {
        const user = userOf(c);
        return {
          creatorProfile: {
            id: c.id,
            isAvailable: c.isAvailable,
            user: { id: c.userId, displayName: user?.displayName ?? null, profilePhotoUrl: user?.profilePhotoUrl ?? null },
            niches: c.niches.map((niche) => ({ niche })),
          },
        };
      }),
  };
}

function ownList(listId: string) {
  const brand = currentBrand();
  const list = db.savedLists.find((l) => l.id === listId);
  if (!list) throw new MockApiError('Saved list not found', 404);
  if (list.brandProfileId !== brand.id) throw new MockApiError('Not your list', 403);
  return list;
}

export function getSavedLists(): SavedList[] {
  const brand = currentBrand();
  return db.savedLists
    .filter((l) => l.brandProfileId === brand.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(toSavedList);
}

export function createSavedList(name: string) {
  const brand = currentBrand();
  const trimmed = name.trim();
  if (!trimmed) throw new MockApiError('Give the list a name');
  if (db.savedLists.filter((l) => l.brandProfileId === brand.id).length >= 20) {
    throw new MockApiError('Maximum 20 saved lists allowed');
  }
  const list = { id: uid(), brandProfileId: brand.id, name: trimmed.slice(0, 128), creatorProfileIds: [], createdAt: nowIso() };
  db.savedLists.push(list);
  persistDb();
  return { id: list.id };
}

export function deleteSavedList(listId: string) {
  const list = ownList(listId);
  db.savedLists.splice(db.savedLists.indexOf(list), 1);
  persistDb();
}

export function addToSavedList(listId: string, creatorProfileId: string) {
  const list = ownList(listId);
  if (!db.creators.some((c) => c.id === creatorProfileId)) throw new MockApiError('Creator not found', 404);
  if (list.creatorProfileIds.includes(creatorProfileId)) throw new MockApiError('Creator is already in this list', 409);
  if (list.creatorProfileIds.length >= 100) throw new MockApiError('Maximum 100 creators per list');
  list.creatorProfileIds.unshift(creatorProfileId);
  persistDb();
}

export function removeFromSavedList(listId: string, creatorProfileId: string) {
  const list = ownList(listId);
  if (!list.creatorProfileIds.includes(creatorProfileId)) throw new MockApiError('Creator not in this list', 404);
  list.creatorProfileIds = list.creatorProfileIds.filter((id) => id !== creatorProfileId);
  persistDb();
}
