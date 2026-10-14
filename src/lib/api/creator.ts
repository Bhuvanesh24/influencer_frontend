import type { FollowerRange } from '@/components/ui/Badge';
import { apiClient } from '@/lib/api/client';
import * as mock from '@/lib/api/mock/creator';
import { IS_MOCK_API, mockDelay } from '@/lib/api/mock-mode';
import type { ContentType } from '@/lib/constants';
import type { TrustScore } from '@/lib/theme';

interface ApiEnvelope<T> {
  success: true;
  data: T;
}

/**
 * `PUT /creators/me/profile` — every field optional. Reconciled against the backend's
 * `updateCreatorProfileSchema` (influencer_backend) on 2026-10-13.
 */
export interface CreatorProfileUpdate {
  creatorTitle?: string;
  bio?: string;
  gender?: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';
  dateOfBirth?: string;
  country?: string;
  state?: string;
  district?: string;
  city?: string;
  languages?: string[];
  niches?: string[];
  instagramHandle?: string;
  instagramFollowerRange?: FollowerRange;
  youtubeChannelUrl?: string;
  youtubeSubscriberRange?: FollowerRange;
  /** `null` clears it. */
  featuredReelUrl?: string | null;
  isAvailable?: boolean;
}

/**
 * The backend validates both URL fields with `.url()`, which rejects an empty string. A blank
 * YouTube URL is therefore left out of the request, and a blank featured reel is sent as `null`
 * (that field is nullable server-side, so it can be cleared).
 */
export function toProfilePayload(input: CreatorProfileUpdate): CreatorProfileUpdate {
  const payload = { ...input };
  if (payload.youtubeChannelUrl !== undefined && payload.youtubeChannelUrl.trim() === '') {
    delete payload.youtubeChannelUrl;
  }
  if (typeof payload.featuredReelUrl === 'string' && payload.featuredReelUrl.trim() === '') {
    payload.featuredReelUrl = null;
  }
  return payload;
}

export async function updateCreatorProfile(input: CreatorProfileUpdate): Promise<void> {
  if (IS_MOCK_API) {
    await mockDelay(undefined);
    mock.updateProfile(toProfilePayload(input));
    return;
  }
  await apiClient.put('/creators/me/profile', toProfilePayload(input));
}

/** The creator's own profile, flattened from `GET /creators/me`. */
export interface CreatorProfile {
  id: string;
  displayName: string | null;
  profilePhotoUrl: string | null;
  creatorTitle: string | null;
  bio: string | null;
  gender: CreatorProfileUpdate['gender'] | null;
  /** ISO date. */
  dateOfBirth: string | null;
  country: string | null;
  state: string | null;
  district: string | null;
  city: string | null;
  languages: string[];
  niches: string[];
  instagramHandle: string | null;
  instagramFollowerRange: FollowerRange | null;
  youtubeChannelUrl: string | null;
  youtubeSubscriberRange: FollowerRange | null;
  featuredReelUrl: string | null;
  coverPhotos: string[];
  /** Stored with the country code, e.g. `+919876543210`. */
  phoneNumber: string | null;
  phoneVerified: boolean;
  isAvailable: boolean;
  trustScore: TrustScore;
  profileCompleteness: number;
}

/** The backend returns the Prisma row: niches/languages are junction rows, user is nested. */
interface CreatorProfileResponse
  extends Omit<CreatorProfile, 'displayName' | 'profilePhotoUrl' | 'languages' | 'niches'> {
  profilePhoto: string | null;
  user: { displayName: string | null; profilePhotoUrl: string | null } | null;
  niches: { niche: string }[];
  languages: { language: string }[];
}

export async function getMyCreatorProfile(): Promise<CreatorProfile> {
  if (IS_MOCK_API) {
    return mockDelay(mock.getMyProfile());
  }
  const { data } = await apiClient.get<ApiEnvelope<CreatorProfileResponse>>('/creators/me');
  const { user, niches, languages, profilePhoto, ...rest } = data.data;
  return {
    ...rest,
    displayName: user?.displayName ?? null,
    profilePhotoUrl: user?.profilePhotoUrl ?? profilePhoto ?? null,
    languages: (languages ?? []).map((l) => l.language),
    niches: (niches ?? []).map((n) => n.niche),
    coverPhotos: rest.coverPhotos ?? [],
  };
}

function toFormFile(uri: string, name: string) {
  const extension = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
  return { uri, name, type: `image/${extension === 'jpg' ? 'jpeg' : extension}` };
}

export async function uploadProfilePhoto(localUri: string): Promise<{ url: string }> {
  if (IS_MOCK_API) {
    await mockDelay(undefined);
    return mock.setProfilePhoto(localUri);
  }
  const formData = new FormData();
  // React Native's FormData accepts {uri,name,type} for file fields — not represented in the DOM
  // FormData types, hence the cast.
  formData.append('profilePhoto', toFormFile(localUri, 'profile.jpg') as unknown as Blob);
  const { data } = await apiClient.post<ApiEnvelope<{ url: string }>>(
    '/creators/me/profile-photo',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data.data;
}

export async function uploadCoverPhotos(localUris: string[]): Promise<{ urls: string[] }> {
  if (IS_MOCK_API) {
    await mockDelay(undefined);
    return mock.setCoverPhotos(localUris);
  }
  const formData = new FormData();
  localUris.forEach((uri, i) => {
    formData.append('coverPhotos', toFormFile(uri, `cover-${i}.jpg`) as unknown as Blob);
  });
  const { data } = await apiClient.post<ApiEnvelope<{ urls: string[] }>>(
    '/creators/me/cover-photos',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data.data;
}

/**
 * A creator's package as the backend returns it (`Package` model). Money fields are Decimal
 * strings; `platform` is derived server-side from the content type (null for UGC).
 */
export interface CreatorPackage {
  id: string;
  title: string;
  contentType: ContentType;
  quantity: number;
  price: string;
  description: string | null;
  inclusions: string[];
  platform: 'instagram' | 'youtube' | 'both' | null;
  /** Server-computed guidance for similar creators; absent until the profile has enough data. */
  recommendedMin: string | null;
  recommendedMax: string | null;
  isActive: boolean;
}

export interface CreatePackageInput {
  title: string;
  contentType: ContentType;
  quantity: number;
  price: number;
  description?: string;
}

export type UpdatePackageInput = Partial<CreatePackageInput> & { isActive?: boolean };

export async function createPackage(input: CreatePackageInput): Promise<CreatorPackage> {
  if (IS_MOCK_API) {
    return mockDelay(mock.createPackage(input));
  }
  const { data } = await apiClient.post<ApiEnvelope<CreatorPackage>>('/creators/me/packages', input);
  return data.data;
}

/** `GET /creators/me/packages` — not paginated; active packages first. */
export async function listMyPackages(): Promise<CreatorPackage[]> {
  if (IS_MOCK_API) {
    return mockDelay(mock.listMyPackages());
  }
  const { data } = await apiClient.get<ApiEnvelope<CreatorPackage[]>>('/creators/me/packages');
  return data.data;
}

export async function updatePackage(id: string, input: UpdatePackageInput): Promise<CreatorPackage> {
  if (IS_MOCK_API) {
    await mockDelay(undefined);
    return mock.updatePackage(id, input);
  }
  const { data } = await apiClient.put<ApiEnvelope<CreatorPackage>>(`/creators/me/packages/${id}`, input);
  return data.data;
}

/** One deal as embedded in the dashboard payload (a subset of the backend's `Deal` model). */
export interface DashboardDeal {
  id: string;
  dealNumber: string;
  status: string;
  offeredAmount: string;
  postingDeadline: string;
  createdAt: string;
  requestExpiresAt?: string | null;
  brandProfile: { companyName: string | null; logoUrl?: string | null } | null;
  package?: { title: string; contentType: ContentType; quantity: number } | null;
}

/** `GET /creators/me/dashboard`, as returned by the backend's `getCreatorDashboard`. */
export interface CreatorDashboard {
  profile: {
    id: string;
    creatorTitle: string | null;
    trustScore: TrustScore;
    isAvailable: boolean;
    niches: string[];
    /** 0–100. */
    profileCompleteness: number;
  };
  stats: {
    /** Paid out only (completed payouts). */
    lifetimeEarnings: string | number;
    /** Creator payout on deals that are active or awaiting verification. */
    pendingPayout: string | number;
    activeCollabs: number;
    newRequests: number;
  };
  recentRequests: DashboardDeal[];
  activeCollabsList: DashboardDeal[];
}

export async function getCreatorDashboard(): Promise<CreatorDashboard> {
  if (IS_MOCK_API) {
    return mockDelay(mock.getDashboard());
  }
  const { data } = await apiClient.get<ApiEnvelope<CreatorDashboard>>('/creators/me/dashboard');
  return data.data;
}

// ---- Stats submission (optional verification evidence) --------------------------------------

export interface StatsSubmission {
  id: string;
  instagramFollowers: number | null;
  instagramEngRate: string | null;
  instagramAvgLikes: number | null;
  instagramAvgComments: number | null;
  youtubeSubscribers: number | null;
  youtubeAvgViews: number | null;
  verificationStatus: 'pending' | 'verified' | 'verified_with_caveat' | 'rejected';
  reviewNotes: string | null;
  submittedAt: string;
  reviewedAt: string | null;
}

export interface StatsSubmissionInput {
  instagramHandle?: string;
  instagramFollowers?: number;
  instagramEngRate?: number;
  instagramAvgLikes?: number;
  instagramAvgComments?: number;
  youtubeChannelUrl?: string;
  youtubeSubscribers?: number;
  youtubeAvgViews?: number;
}

/** The latest submission, from `GET /creators/me`'s `latestSubmission` (null if never submitted). */
export async function getLatestStatsSubmission(): Promise<StatsSubmission | null> {
  if (IS_MOCK_API) {
    return mockDelay(mock.getLatestStatsSubmission());
  }
  const { data } = await apiClient.get<ApiEnvelope<{ latestSubmission: StatsSubmission | null }>>('/creators/me');
  return data.data.latestSubmission ?? null;
}

/**
 * `POST /creators/me/stats/submit` — multipart: the numbers as fields plus at least one of
 * `instagramScreenshot` / `youtubeScreenshot`. Reviewed by the team; never a hard gate.
 */
export async function submitStats(
  input: StatsSubmissionInput,
  screenshots: { instagram?: string | null; youtube?: string | null },
): Promise<void> {
  if (IS_MOCK_API) {
    await mockDelay(undefined, 800);
    mock.submitStats(input, screenshots);
    return;
  }
  const formData = new FormData();
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined && value !== '') formData.append(key, String(value));
  }
  if (screenshots.instagram) {
    formData.append('instagramScreenshot', toFormFile(screenshots.instagram, 'instagram.jpg') as unknown as Blob);
  }
  if (screenshots.youtube) {
    formData.append('youtubeScreenshot', toFormFile(screenshots.youtube, 'youtube.jpg') as unknown as Blob);
  }
  await apiClient.post('/creators/me/stats/submit', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
}
