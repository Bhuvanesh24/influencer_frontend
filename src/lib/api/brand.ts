import { apiClient } from '@/lib/api/client';
import { IS_MOCK_API, mockBrand, mockDelay } from '@/lib/api/mock-mode';
import type { ContentType } from '@/lib/constants';

interface ApiEnvelope<T> {
  success: true;
  data: T;
}

/**
 * Brand profile fields, reconciled against the backend's `BrandProfile` model and
 * `updateBrandProfileSchema` (influencer_backend) on 2026-10-13. Every field is nullable until
 * the brand fills it in — onboarding only collects a name.
 *
 * There is no logo upload endpoint on the backend (`logoUrl` only accepts an already-hosted
 * URL), so the app shows a logo if one exists but cannot set one.
 */
export interface BrandProfile {
  id: string;
  companyName: string | null;
  brandWebsite: string | null;
  industry: string | null;
  description: string | null;
  country: string | null;
  phone: string | null;
  gstin: string | null;
  logoUrl: string | null;
  showBrandNameInCollabs: boolean;
}

export interface BrandProfileUpdate {
  companyName: string;
  /** Omitted when blank — the backend rejects an empty string as "not a URL". */
  brandWebsite?: string;
  industry: string;
  description: string;
  country: string;
  phone: string;
  gstin: string;
  showBrandNameInCollabs: boolean;
}

/** `GET /brands/me`. */
export async function getBrandProfile(): Promise<BrandProfile> {
  if (IS_MOCK_API) {
    return mockDelay({ ...mockBrand.profile });
  }
  const { data } = await apiClient.get<ApiEnvelope<BrandProfile>>('/brands/me');
  return data.data;
}

/** `PUT /brands/me/profile`. */
export async function updateBrandProfile(input: BrandProfileUpdate): Promise<void> {
  if (IS_MOCK_API) {
    Object.assign(mockBrand.profile, { ...input, brandWebsite: input.brandWebsite ?? null });
    await mockDelay(undefined);
    return;
  }
  await apiClient.put('/brands/me/profile', input);
}

/** One deal as embedded in the brand dashboard payload (a subset of the backend's `Deal`). */
export interface BrandDashboardDeal {
  id: string;
  dealNumber: string;
  status: string;
  offeredAmount: string;
  postingDeadline: string;
  creatorProfile: {
    creatorTitle: string | null;
    user: { displayName: string | null; profilePhotoUrl: string | null };
  } | null;
  package: { title: string; contentType: ContentType } | null;
}

export interface BrandDashboardCampaign {
  id: string;
  name: string;
  status: string;
  targetInfluencerCount: number | null;
  createdAt: string;
}

/** `GET /brands/me/dashboard`, as returned by the backend's `getBrandDashboard`. */
export interface BrandDashboard {
  profile: { id: string; companyName: string | null; logoUrl: string | null };
  stats: {
    totalSpent: string | number;
    activeCollabs: number;
    /** Posts submitted by creators and waiting for this brand to verify. */
    pendingApprovals: number;
    openCampaigns: number;
  };
  recentCollabs: BrandDashboardDeal[];
  recentCampaigns: BrandDashboardCampaign[];
}

export async function getBrandDashboard(): Promise<BrandDashboard> {
  if (IS_MOCK_API) {
    // A brand-new account: nothing spent, no collabs, no campaigns. Never seeded with invented
    // creators, deals or amounts.
    return mockDelay({
      profile: {
        id: mockBrand.profile.id,
        companyName: mockBrand.profile.companyName,
        logoUrl: mockBrand.profile.logoUrl,
      },
      stats: { totalSpent: '0.00', activeCollabs: 0, pendingApprovals: 0, openCampaigns: 0 },
      recentCollabs: [],
      recentCampaigns: [],
    });
  }
  const { data } = await apiClient.get<ApiEnvelope<BrandDashboard>>('/brands/me/dashboard');
  return data.data;
}
