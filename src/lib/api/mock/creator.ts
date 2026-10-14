import type {
  CreatePackageInput,
  CreatorDashboard,
  CreatorPackage,
  CreatorProfile,
  CreatorProfileUpdate,
  DashboardDeal,
  StatsSubmission,
  StatsSubmissionInput,
  UpdatePackageInput,
} from '@/lib/api/creator';
import { setupProgress } from '@/lib/profile-setup';

import { db, MockApiError, money, nowIso, persistDb, uid, type MockCreator, type MockDeal, type MockPackage } from './db';
import { brandNameForCreator, tick } from './deal-helpers';
import { currentCreator, currentUser } from './session';

const PLATFORM_OF: Record<string, MockPackage['platform']> = {
  reel: 'instagram',
  post: 'instagram',
  story: 'instagram',
  youtube_video: 'youtube',
  youtube_shorts: 'youtube',
  youtube_live: 'youtube',
};

export function toCreatorProfile(c: MockCreator): CreatorProfile {
  const user = db.users.find((u) => u.id === c.userId);
  const profile: CreatorProfile = {
    id: c.id,
    displayName: user?.displayName ?? null,
    profilePhotoUrl: user?.profilePhotoUrl ?? null,
    creatorTitle: c.creatorTitle,
    bio: c.bio,
    gender: c.gender,
    dateOfBirth: c.dateOfBirth,
    country: c.country,
    state: c.state,
    district: c.district,
    city: c.city,
    languages: c.languages,
    niches: c.niches,
    instagramHandle: c.instagramHandle,
    instagramFollowerRange: c.instagramFollowerRange,
    youtubeChannelUrl: c.youtubeChannelUrl,
    youtubeSubscriberRange: c.youtubeSubscriberRange,
    featuredReelUrl: c.featuredReelUrl,
    coverPhotos: c.coverPhotos,
    phoneNumber: c.phoneNumber,
    phoneVerified: c.phoneVerified,
    isAvailable: c.isAvailable,
    trustScore: c.trustScore,
    profileCompleteness: 0,
  };
  profile.profileCompleteness = setupProgress(profile, activePackages(c.id).length).percent;
  return profile;
}

export function activePackages(creatorProfileId: string) {
  return db.packages.filter((p) => p.creatorProfileId === creatorProfileId && p.isActive);
}

export function toPackage(p: MockPackage): CreatorPackage {
  return {
    id: p.id,
    title: p.title,
    contentType: p.contentType,
    quantity: p.quantity,
    price: p.price,
    description: p.description,
    inclusions: p.inclusions,
    platform: p.platform,
    recommendedMin: p.recommendedMin,
    recommendedMax: p.recommendedMax,
    isActive: p.isActive,
  };
}

export function getMyProfile(): CreatorProfile {
  return toCreatorProfile(currentCreator());
}

export function updateProfile(input: CreatorProfileUpdate) {
  const c = currentCreator();
  const { featuredReelUrl, ...rest } = input;
  for (const [key, value] of Object.entries(rest)) {
    if (value !== undefined) (c as unknown as Record<string, unknown>)[key] = value;
  }
  if (featuredReelUrl !== undefined) c.featuredReelUrl = featuredReelUrl;
  persistDb();
}

export function setProfilePhoto(uri: string) {
  const user = currentUser();
  currentCreator();
  user.profilePhotoUrl = uri;
  persistDb();
  return { url: uri };
}

export function setCoverPhotos(uris: string[]) {
  const c = currentCreator();
  c.coverPhotos = uris.slice(0, 5);
  persistDb();
  return { urls: c.coverPhotos };
}

// ---- Packages ---------------------------------------------------------------------------------

export function createPackage(input: CreatePackageInput): CreatorPackage {
  const c = currentCreator();
  const pkg: MockPackage = {
    id: uid(),
    creatorProfileId: c.id,
    title: input.title,
    contentType: input.contentType,
    quantity: input.quantity,
    price: money(input.price),
    description: input.description || null,
    inclusions: [],
    platform: PLATFORM_OF[input.contentType] ?? null,
    recommendedMin: null,
    recommendedMax: null,
    isActive: true,
    createdAt: nowIso(),
  };
  db.packages.push(pkg);
  persistDb();
  return toPackage(pkg);
}

export function listMyPackages(): CreatorPackage[] {
  const c = currentCreator();
  return db.packages
    .filter((p) => p.creatorProfileId === c.id)
    .sort((a, b) => Number(b.isActive) - Number(a.isActive) || a.createdAt.localeCompare(b.createdAt))
    .map(toPackage);
}

export function updatePackage(id: string, input: UpdatePackageInput): CreatorPackage {
  const c = currentCreator();
  const pkg = db.packages.find((p) => p.id === id && p.creatorProfileId === c.id);
  if (!pkg) throw new MockApiError('Package not found', 404);
  if (input.title !== undefined) pkg.title = input.title;
  if (input.contentType !== undefined) {
    pkg.contentType = input.contentType;
    pkg.platform = PLATFORM_OF[input.contentType] ?? null;
  }
  if (input.quantity !== undefined) pkg.quantity = input.quantity;
  if (input.price !== undefined) pkg.price = money(input.price);
  if (input.description !== undefined) pkg.description = input.description || null;
  if (input.isActive !== undefined) pkg.isActive = input.isActive;
  persistDb();
  return toPackage(pkg);
}

// ---- Dashboard --------------------------------------------------------------------------------

function toDashboardDeal(deal: MockDeal): DashboardDeal {
  const pkg = db.packages.find((p) => p.id === deal.packageId);
  const brand = db.brands.find((b) => b.id === deal.brandProfileId);
  const name = brandNameForCreator(deal);
  return {
    id: deal.id,
    dealNumber: deal.dealNumber,
    status: deal.status,
    offeredAmount: deal.offeredAmount,
    postingDeadline: deal.postingDeadline,
    createdAt: deal.createdAt,
    requestExpiresAt: deal.requestExpiresAt,
    brandProfile: { companyName: name, logoUrl: name ? (brand?.logoUrl ?? null) : null },
    package: pkg ? { title: pkg.title, contentType: pkg.contentType, quantity: pkg.quantity } : null,
  };
}

const ACTIVE = ['accepted', 'payment_pending', 'active', 'post_submitted'];

export function getDashboard(): CreatorDashboard {
  tick();
  const c = currentCreator();
  const profile = toCreatorProfile(c);
  const mine = db.deals.filter((d) => d.creatorProfileId === c.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const requests = mine
    .filter((d) => d.status === 'request_sent')
    .sort((a, b) => (a.requestExpiresAt ?? '').localeCompare(b.requestExpiresAt ?? ''));
  const active = mine.filter((d) => ACTIVE.includes(d.status));
  const paid = db.payouts.filter((p) => p.creatorProfileId === c.id && p.status === 'completed');

  return {
    profile: {
      id: c.id,
      creatorTitle: c.creatorTitle,
      trustScore: c.trustScore,
      isAvailable: c.isAvailable,
      niches: c.niches,
      profileCompleteness: profile.profileCompleteness,
    },
    stats: {
      lifetimeEarnings: money(paid.reduce((sum, p) => sum + Number(p.amount), 0)),
      pendingPayout: money(
        mine
          .filter((d) => ['active', 'post_submitted', 'verified'].includes(d.status))
          .reduce((sum, d) => sum + Number(d.creatorPayout), 0),
      ),
      activeCollabs: active.length,
      newRequests: requests.length,
    },
    recentRequests: requests.slice(0, 5).map(toDashboardDeal),
    activeCollabsList: active.slice(0, 5).map(toDashboardDeal),
  };
}

// ---- Stats submission -------------------------------------------------------------------------

export function getLatestStatsSubmission(): StatsSubmission | null {
  const c = currentCreator();
  const latest = db.statsSubmissions
    .filter((s) => s.creatorProfileId === c.id)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];
  if (!latest) return null;
  // Stands in for the review team: a pending submission is approved a minute after it arrives.
  if (latest.verificationStatus === 'pending' && Date.now() - Date.parse(latest.submittedAt) > 60_000) {
    latest.verificationStatus = 'verified';
    latest.reviewedAt = nowIso();
    c.verificationStatus = 'verified';
    if (latest.instagramEngRate) c.instagramEngagementRate = latest.instagramEngRate;
    persistDb();
  }
  const { screenshotUrls: _urls, creatorProfileId: _id, ...rest } = latest;
  return rest;
}

export function submitStats(input: StatsSubmissionInput, screenshots: { instagram?: string | null; youtube?: string | null }) {
  const c = currentCreator();
  const urls = [screenshots.instagram, screenshots.youtube].filter((u): u is string => !!u);
  if (urls.length === 0) throw new MockApiError('At least one screenshot is required for verification');
  if (input.instagramEngRate !== undefined && (input.instagramEngRate < 0 || input.instagramEngRate > 100)) {
    throw new MockApiError('Engagement rate must be a percentage between 0 and 100');
  }
  if (input.instagramHandle) c.instagramHandle = input.instagramHandle;
  if (input.youtubeChannelUrl) c.youtubeChannelUrl = input.youtubeChannelUrl;
  db.statsSubmissions.push({
    id: uid(),
    creatorProfileId: c.id,
    instagramFollowers: input.instagramFollowers ?? null,
    instagramEngRate: input.instagramEngRate !== undefined ? input.instagramEngRate.toFixed(2) : null,
    instagramAvgLikes: input.instagramAvgLikes ?? null,
    instagramAvgComments: input.instagramAvgComments ?? null,
    youtubeSubscribers: input.youtubeSubscribers ?? null,
    youtubeAvgViews: input.youtubeAvgViews ?? null,
    screenshotUrls: urls,
    verificationStatus: 'pending',
    reviewNotes: null,
    submittedAt: nowIso(),
    reviewedAt: null,
  });
  persistDb();
}
