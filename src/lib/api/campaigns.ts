import { apiClient } from '@/lib/api/client';
import type { Page, Pagination } from '@/lib/api/collabs';
import * as mock from '@/lib/api/mock/campaigns';
import { IS_MOCK_API, mockDelay } from '@/lib/api/mock-mode';
import type { ContentType } from '@/lib/constants';

/**
 * Campaigns — `/campaigns/*` and `/creators/me/campaign-applications`, reconciled against
 * influencer_backend's campaign and campaignApplication services on 2026-10-14.
 * Brand-Invite: the brand invites chosen creators (each invite is a deal). Open Application:
 * creators apply with one of their packages; approving creates the deal.
 */

interface ApiEnvelope<T> {
  success: true;
  data: T;
  pagination?: Pagination;
}

export type CampaignType = 'BrandInvite' | 'OpenApplication';
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';

export interface Campaign {
  id: string;
  campaignNumber: string;
  type: CampaignType;
  status: CampaignStatus;
  name: string;
  productDescription: string | null;
  brief: string;
  contentType: ContentType;
  hashtags: string[];
  targetLanguages: string[];
  targetNiches: string[];
  targetInfluencerCount: number;
  totalBudget: string;
  spentAmount: string;
  refundedAmount: string;
  postingDeadline: string;
  minFollowerCount: number | null;
  minEngagementRate: string | null;
  budgetPerCreator: string | null;
  maxCreators: number | null;
  applicationDeadline: string | null;
  autoAccept: boolean;
  usedSlots: number;
  negotiationAllowed: boolean;
  requiresDraftApproval: boolean;
  createdAt: string;
  brandProfile?: { companyName: string | null; logoUrl: string | null };
  _count?: { campaignCreators: number; applications?: number };
}

export interface OpenCampaign {
  id: string;
  name: string;
  type: CampaignType;
  contentType: ContentType;
  targetNiches: string[];
  budgetPerCreator: string | null;
  maxCreators: number | null;
  usedSlots: number;
  slotsRemaining: number | null;
  applicationDeadline: string;
  minFollowerCount: number | null;
  minEngagementRate: string | null;
  autoAccept: boolean;
  createdAt: string;
  brandProfile: { companyName: string | null; logoUrl: string | null };
}

export interface TrackerCreator {
  id: string;
  campaignCreatorId: string;
  status: string;
  offeredAmount: string | null;
  dealNumber: string | null;
  creatorProfile: { id?: string; user: { displayName: string | null; profilePhotoUrl: string | null } };
}

export interface CampaignTracker {
  creators: TrackerCreator[];
  summary: {
    totalCreators: number;
    targetCount: number;
    totalBudget: string;
    spentAmount: string;
    refundedAmount: string;
  };
}

export interface CampaignApplication {
  id: string;
  status: 'pending' | 'approved' | 'declined';
  pitchNote: string | null;
  reviewNote: string | null;
  appliedAt: string;
  reviewedAt: string | null;
  creatorProfile: {
    id: string;
    trustScore?: string;
    followerRange?: string | null;
    user: { id: string; displayName: string | null; profilePhotoUrl: string | null };
    niches: { niche: string }[];
  };
  package: { id: string; title: string; contentType: ContentType; price: string };
  deal: { id: string; dealNumber: string; status: string } | null;
}

export interface MyApplication {
  id: string;
  status: 'pending' | 'approved' | 'declined';
  pitchNote: string | null;
  reviewNote: string | null;
  appliedAt: string;
  campaign: {
    id: string;
    name: string;
    contentType: ContentType;
    budgetPerCreator: string | null;
    applicationDeadline: string | null;
    brandProfile: { companyName: string | null; logoUrl: string | null };
  };
  package: { id: string; title: string; price: string };
  deal: { id: string; dealNumber: string; status: string } | null;
}

interface BaseCampaignInput {
  name: string;
  productDescription?: string;
  brief: string;
  contentType: ContentType;
  hashtags: string[];
  targetLanguages: string[];
  targetNiches: string[];
  postingDeadline: string;
  negotiationAllowed: boolean;
  requiresDraftApproval: boolean;
}

export type CreateCampaignInput =
  | (BaseCampaignInput & { type: 'BrandInvite'; totalBudget: number; targetInfluencerCount: number })
  | (BaseCampaignInput & {
      type: 'OpenApplication';
      budgetPerCreator: number;
      maxCreators: number;
      applicationDeadline: string;
      minFollowerCount?: number;
      minEngagementRate?: number;
      autoAccept: boolean;
    });

// ---- Brand ------------------------------------------------------------------------------------

export async function listCampaigns(page = 1, status?: CampaignStatus): Promise<Page<Campaign>> {
  if (IS_MOCK_API) return mockDelay(mock.listCampaigns(page, 20, status));
  const { data } = await apiClient.get<ApiEnvelope<Campaign[]>>('/campaigns', { params: { page, limit: 20, status } });
  return { items: data.data, pagination: data.pagination! };
}

export async function getCampaign(id: string): Promise<Campaign> {
  if (IS_MOCK_API) return mockDelay(mock.getCampaign(id));
  const { data } = await apiClient.get<ApiEnvelope<Campaign>>(`/campaigns/${id}`);
  return data.data;
}

export async function createCampaign(input: CreateCampaignInput): Promise<{ id: string }> {
  if (IS_MOCK_API) return mockDelay(mock.createCampaign(input), 700);
  const { data } = await apiClient.post<ApiEnvelope<{ id: string }>>('/campaigns', input);
  return data.data;
}

/** `PUT /campaigns/:id` — used for pause/resume here. */
export async function setCampaignStatus(id: string, status: 'active' | 'paused'): Promise<void> {
  if (IS_MOCK_API) {
    await mockDelay(undefined);
    mock.setCampaignStatus(id, status);
    return;
  }
  await apiClient.put(`/campaigns/${id}`, { status });
}

/** `DELETE /campaigns/:id` — cancels open deals and refunds held escrow. */
export async function cancelCampaign(id: string): Promise<{ dealsCancelled: number; escrowRefunded: number }> {
  if (IS_MOCK_API) return mockDelay(mock.cancelCampaign(id), 700);
  const { data } = await apiClient.delete<ApiEnvelope<{ dealsCancelled: number; escrowRefunded: number }>>(`/campaigns/${id}`);
  return data.data;
}

export async function getCampaignTracker(id: string): Promise<CampaignTracker> {
  if (IS_MOCK_API) return mockDelay(mock.getTracker(id), 250);
  const { data } = await apiClient.get<ApiEnvelope<CampaignTracker>>(`/campaigns/${id}/tracker`);
  return data.data;
}

export async function inviteCreators(
  id: string,
  creators: { creatorProfileId: string; packageId: string; offeredAmount?: number }[],
): Promise<void> {
  if (IS_MOCK_API) {
    await mockDelay(undefined, 600);
    mock.inviteCreators(id, creators);
    return;
  }
  await apiClient.post(`/campaigns/${id}/creators`, { creators });
}

export async function listApplications(id: string, status?: CampaignApplication['status']): Promise<CampaignApplication[]> {
  if (IS_MOCK_API) return mockDelay(mock.listApplications(id, status), 250);
  const { data } = await apiClient.get<ApiEnvelope<CampaignApplication[]>>(`/campaigns/${id}/applications`, {
    params: { status, limit: 50 },
  });
  return data.data;
}

export async function reviewApplication(campaignId: string, appId: string, action: 'approve' | 'decline', reviewNote?: string) {
  if (IS_MOCK_API) return mockDelay(mock.reviewApplication(campaignId, appId, action, reviewNote));
  const { data } = await apiClient.post<ApiEnvelope<unknown>>(`/campaigns/${campaignId}/applications/${appId}/${action}`, { reviewNote });
  return data.data;
}

// ---- Creator ----------------------------------------------------------------------------------

export async function listOpenCampaigns(filters: { contentType?: ContentType; niche?: string }, page = 1): Promise<Page<OpenCampaign>> {
  if (IS_MOCK_API) return mockDelay(mock.listOpenCampaigns(filters, page, 20));
  const { data } = await apiClient.get<ApiEnvelope<OpenCampaign[]>>('/campaigns/open-applications', {
    params: { ...filters, page, limit: 20 },
  });
  return { items: data.data, pagination: data.pagination! };
}

export async function applyToCampaign(id: string, input: { packageId: string; pitchNote?: string }) {
  if (IS_MOCK_API) return mockDelay(mock.apply(id, input), 600);
  const { data } = await apiClient.post<ApiEnvelope<unknown>>(`/campaigns/${id}/apply`, input);
  return data.data;
}

export async function getMyApplications(): Promise<MyApplication[]> {
  if (IS_MOCK_API) return mockDelay(mock.getMyApplications());
  const { data } = await apiClient.get<ApiEnvelope<MyApplication[]>>('/creators/me/campaign-applications', { params: { limit: 50 } });
  return data.data;
}
