import { apiClient } from '@/lib/api/client';
import { IS_MOCK_API, mockDelay, mockCreator, mockUser } from '@/lib/api/mock-mode';
import type { FollowerRange } from '@/components/ui/Badge';
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
function toProfilePayload(input: CreatorProfileUpdate): CreatorProfileUpdate {
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
    if (input.isAvailable !== undefined) mockCreator.isAvailable = input.isAvailable;
    else bumpMockCompleteness(20);
    Object.assign(mockCreator.profile, toProfilePayload(input));
    return;
  }
  await apiClient.put('/creators/me/profile', toProfilePayload(input));
}

/** The creator's own profile, flattened from `GET /creators/me` for the Edit Profile form. */
export interface CreatorProfile {
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
}

/** The backend returns the Prisma row: niches/languages are junction rows, user is nested. */
interface CreatorProfileResponse extends Omit<CreatorProfile, 'displayName' | 'profilePhotoUrl' | 'languages' | 'niches'> {
  user: { displayName: string | null; profilePhotoUrl: string | null } | null;
  niches: { niche: string }[];
  languages: { language: string }[];
}

export async function getMyCreatorProfile(): Promise<CreatorProfile> {
  if (IS_MOCK_API) {
    const p = mockCreator.profile;
    return mockDelay({
      displayName: mockUser.displayName,
      profilePhotoUrl: null,
      creatorTitle: p.creatorTitle ?? null,
      bio: p.bio ?? null,
      gender: p.gender ?? null,
      dateOfBirth: p.dateOfBirth ?? null,
      country: p.country ?? null,
      state: p.state ?? null,
      district: p.district ?? null,
      city: p.city ?? null,
      languages: p.languages ?? [],
      niches: p.niches ?? [],
      instagramHandle: p.instagramHandle ?? null,
      instagramFollowerRange: p.instagramFollowerRange ?? null,
      youtubeChannelUrl: p.youtubeChannelUrl ?? null,
      youtubeSubscriberRange: p.youtubeSubscriberRange ?? null,
      featuredReelUrl: p.featuredReelUrl ?? null,
    });
  }
  const { data } = await apiClient.get<ApiEnvelope<CreatorProfileResponse>>('/creators/me');
  const { user, niches, languages, ...rest } = data.data;
  return {
    displayName: user?.displayName ?? null,
    profilePhotoUrl: user?.profilePhotoUrl ?? null,
    creatorTitle: rest.creatorTitle ?? null,
    bio: rest.bio ?? null,
    gender: rest.gender ?? null,
    dateOfBirth: rest.dateOfBirth ?? null,
    country: rest.country ?? null,
    state: rest.state ?? null,
    district: rest.district ?? null,
    city: rest.city ?? null,
    languages: (languages ?? []).map((l) => l.language),
    niches: (niches ?? []).map((n) => n.niche),
    instagramHandle: rest.instagramHandle ?? null,
    instagramFollowerRange: rest.instagramFollowerRange ?? null,
    youtubeChannelUrl: rest.youtubeChannelUrl ?? null,
    youtubeSubscriberRange: rest.youtubeSubscriberRange ?? null,
    featuredReelUrl: rest.featuredReelUrl ?? null,
  };
}

/** Mock only: a rough stand-in for the server's own completeness calculation. */
function bumpMockCompleteness(by: number) {
  mockCreator.profileCompleteness = Math.min(100, mockCreator.profileCompleteness + by);
}

function toFormFile(uri: string, name: string) {
  const extension = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
  return { uri, name, type: `image/${extension === 'jpg' ? 'jpeg' : extension}` };
}

export async function uploadProfilePhoto(localUri: string): Promise<{ url: string }> {
  if (IS_MOCK_API) {
    bumpMockCompleteness(10);
    return mockDelay({ url: localUri });
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
    return mockDelay({ urls: localUris });
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
    const pkg: CreatorPackage = {
      id: `mock-package-${mockCreator.packages.length + 1}`,
      title: input.title,
      contentType: input.contentType,
      quantity: input.quantity,
      price: input.price.toFixed(2),
      description: input.description ?? null,
      inclusions: [],
      platform: null,
      // The mock has no pricing model, so it offers no guidance rather than inventing a range.
      recommendedMin: null,
      recommendedMax: null,
      isActive: true,
    };
    mockCreator.packages.push(pkg);
    if (mockCreator.packages.length === 1) bumpMockCompleteness(10);
    return mockDelay({ ...pkg });
  }
  const { data } = await apiClient.post<ApiEnvelope<CreatorPackage>>('/creators/me/packages', input);
  return data.data;
}

/** `GET /creators/me/packages` — not paginated; active packages first. */
export async function listMyPackages(): Promise<CreatorPackage[]> {
  if (IS_MOCK_API) {
    return mockDelay(mockCreator.packages.map((p) => ({ ...p })));
  }
  const { data } = await apiClient.get<ApiEnvelope<CreatorPackage[]>>('/creators/me/packages');
  return data.data;
}

export async function updatePackage(id: string, input: UpdatePackageInput): Promise<CreatorPackage> {
  if (IS_MOCK_API) {
    const pkg = mockCreator.packages.find((p) => p.id === id);
    if (!pkg) throw new Error('Package not found');
    const { price, description, ...rest } = input;
    Object.assign(pkg, rest);
    if (price !== undefined) pkg.price = price.toFixed(2);
    if (description !== undefined) pkg.description = description || null;
    return mockDelay({ ...pkg });
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
    // A brand-new account: nothing earned, no requests, no collabs. The mock never invents
    // deals, brands or amounts — the dashboard's empty states are what a first run looks like.
    return mockDelay({
      profile: {
        id: 'mock-creator-profile-1',
        creatorTitle: null,
        trustScore: 'medium',
        isAvailable: mockCreator.isAvailable,
        niches: [],
        profileCompleteness: mockCreator.profileCompleteness,
      },
      stats: { lifetimeEarnings: '0.00', pendingPayout: '0.00', activeCollabs: 0, newRequests: 0 },
      recentRequests: [],
      activeCollabsList: [],
    });
  }
  const { data } = await apiClient.get<ApiEnvelope<CreatorDashboard>>('/creators/me/dashboard');
  return data.data;
}
