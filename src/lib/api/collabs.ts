import { apiClient } from '@/lib/api/client';
import * as mock from '@/lib/api/mock/collabs';
import { IS_MOCK_API, mockDelay } from '@/lib/api/mock-mode';
import type { ContentType } from '@/lib/constants';
import type { DealStatus } from '@/lib/deal-status';

/**
 * Collabs (deals) — `/collabs/*`, reconciled against influencer_backend's collab, draft, review
 * and performance services on 2026-10-14. Shapes follow `listDeals` / `getDealById`.
 */

interface ApiEnvelope<T> {
  success: true;
  data: T;
  pagination?: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Page<T> {
  items: T[];
  pagination: Pagination;
}

interface PartyUser {
  id?: string;
  displayName: string | null;
  profilePhotoUrl: string | null;
}

export interface DealSubmission {
  id: string;
  postUrl: string;
  screenshotUrl: string | null;
  platform: 'instagram' | 'youtube';
  submittedAt: string;
  verificationDeadline: string | null;
  verifiedByBrand: boolean;
  autoApproved: boolean;
  verifiedAt: string | null;
}

export interface DealListItem {
  id: string;
  dealNumber: string;
  brandProfileId: string;
  creatorProfileId: string;
  campaignId: string | null;
  status: DealStatus;
  chatState: 'LOCKED' | 'OPEN' | 'ARCHIVED';
  contentType: ContentType;
  offeredAmount: string;
  creatorPayout: string | null;
  counterOfferAmount: string | null;
  counterOfferRounds: number;
  postingDeadline: string;
  requestExpiresAt: string | null;
  requiresDraftApproval: boolean;
  createdAt: string;
  updatedAt: string;
  /** `companyName` is null while a brand that hides its name is still unpaid (creator view). */
  brandProfile: { companyName: string | null; logoUrl: string | null; user: PartyUser };
  creatorProfile: { creatorTitle?: string | null; user: PartyUser };
  package: { id: string; title: string; platform: string | null; contentType: ContentType; price?: string } | null;
  campaign: { id: string; name: string; requiresDraftApproval: boolean } | null;
  submissions: DealSubmission[];
}

export interface DealStatusLogEntry {
  id: string;
  fromStatus: DealStatus | null;
  toStatus: DealStatus;
  changedBy: string | null;
  reason: string | null;
  createdAt: string;
}

export interface DealDispute {
  id: string;
  status: string;
  reason: string;
  evidenceUrls: string[];
  resolutionNotes: string | null;
  raisedAt: string;
  resolutionDeadline: string | null;
}

export interface DealDetail extends DealListItem {
  brief: string;
  referenceMaterials: string[];
  brandNotes: string | null;
  brandSideFee: string | null;
  creatorSideFee: string | null;
  platformCommission: string | null;
  acceptedAt: string | null;
  postSubmittedAt: string | null;
  verifiedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  statusLog: DealStatusLogEntry[];
  escrowTransaction: {
    status: 'held' | 'released' | 'refunded' | 'partial_release' | 'disputed';
    amount: string;
    lockedAt: string;
    releasedAt: string | null;
    refundedAt: string | null;
  } | null;
  disputes: DealDispute[];
  latestSubmission: DealSubmission | null;
}

export interface FeeBreakdown {
  dealNumber: string;
  offeredAmount: string;
  brandSideFee: string;
  creatorSideFee: string;
  platformCommission: string;
  brandTotalCost: string;
  creatorNetPayout: string;
  platformCommissionRate: string;
}

export interface DealDraft {
  id: string;
  fileUrl: string;
  status: 'pending' | 'approved' | 'changes_requested';
  brandFeedback: string | null;
  round: number;
  submittedAt: string;
  reviewedAt: string | null;
}

export interface DealReviews {
  reviews: { id: string; reviewerRole: 'brand' | 'creator'; rating: number; comment: string | null; createdAt: string }[];
  hasReviewed: { brand: boolean; creator: boolean };
}

export interface PerformanceReport {
  id: string;
  reportType: 'seven_day' | 'thirty_day';
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  reach: number | null;
  submittedAt: string;
}

export interface CreateDealInput {
  creatorProfileId: string;
  packageId: string;
  brief: string;
  offeredAmount?: number;
  postingDeadline?: string;
  referenceMaterials?: string[];
  brandNotes?: string;
  requiresDraftApproval?: boolean;
  campaignId?: string;
}

// ---- Reads ------------------------------------------------------------------------------------

export async function listDeals(params: { page?: number; limit?: number; status?: DealStatus } = {}): Promise<Page<DealListItem>> {
  const { page = 1, limit = 20, status } = params;
  if (IS_MOCK_API) {
    return mockDelay(mock.listDeals(page, limit, status));
  }
  const { data } = await apiClient.get<ApiEnvelope<DealListItem[]>>('/collabs', { params: { page, limit, status } });
  return { items: data.data, pagination: data.pagination! };
}

export async function getDeal(id: string): Promise<DealDetail> {
  if (IS_MOCK_API) {
    return mockDelay(mock.getDeal(id));
  }
  const { data } = await apiClient.get<ApiEnvelope<DealDetail>>(`/collabs/${id}`);
  return data.data;
}

export async function getFeeBreakdown(id: string): Promise<FeeBreakdown> {
  if (IS_MOCK_API) {
    return mockDelay(mock.getFeeBreakdown(id), 250);
  }
  const { data } = await apiClient.get<ApiEnvelope<FeeBreakdown>>(`/collabs/${id}/fee-breakdown`);
  return data.data;
}

export async function listDrafts(id: string): Promise<DealDraft[]> {
  if (IS_MOCK_API) {
    return mockDelay(mock.listDrafts(id), 250);
  }
  const { data } = await apiClient.get<ApiEnvelope<DealDraft[]>>(`/collabs/${id}/drafts`);
  return data.data;
}

export async function getDealReviews(id: string): Promise<DealReviews> {
  if (IS_MOCK_API) {
    return mockDelay(mock.getDealReviews(id), 250);
  }
  const { data } = await apiClient.get<ApiEnvelope<DealReviews>>(`/collabs/${id}/review`);
  return data.data;
}

export async function getPerformanceReports(id: string): Promise<PerformanceReport[]> {
  if (IS_MOCK_API) {
    return mockDelay(mock.getPerformanceReports(id), 250);
  }
  const { data } = await apiClient.get<ApiEnvelope<PerformanceReport[]>>(`/collabs/${id}/performance-reports`);
  return data.data;
}

// ---- Actions ----------------------------------------------------------------------------------

async function post<T>(path: string, body?: unknown): Promise<T> {
  const { data } = await apiClient.post<ApiEnvelope<T>>(path, body);
  return data.data;
}

/** `POST /collabs` (brand). Returns the new deal; open its detail with `getDeal`. */
export async function createDeal(input: CreateDealInput): Promise<{ id: string }> {
  if (IS_MOCK_API) {
    await mockDelay(undefined);
    return mock.createDeal(input);
  }
  return post('/collabs', input);
}

/** Creator. */
export async function acceptDeal(id: string) {
  if (IS_MOCK_API) return mockDelay(mock.acceptDeal(id));
  return post(`/collabs/${id}/accept`);
}

/** Creator. */
export async function rejectDeal(id: string) {
  if (IS_MOCK_API) return mockDelay(mock.rejectDeal(id));
  return post(`/collabs/${id}/reject`);
}

/** Creator — max 2 rounds; the deal stays `request_sent` until the brand answers. */
export async function counterOffer(id: string, counterOfferAmount: number) {
  if (IS_MOCK_API) return mockDelay(mock.counterOffer(id, counterOfferAmount));
  return post(`/collabs/${id}/counter-offer`, { counterOfferAmount });
}

/** Brand. */
export async function acceptCounter(id: string) {
  if (IS_MOCK_API) return mockDelay(mock.acceptCounter(id));
  return post(`/collabs/${id}/accept-counter`);
}

/** Brand. */
export async function rejectCounter(id: string) {
  if (IS_MOCK_API) return mockDelay(mock.rejectCounter(id));
  return post(`/collabs/${id}/reject-counter`);
}

/**
 * Brand pays into escrow. The production flow is `create-order` → Razorpay checkout →
 * `lock-escrow` (SPRINTS.md 4.3, needs a dev build for the native SDK); the mock settles the
 * payment the way `POST /collabs/:id/pay` does.
 */
export async function payIntoEscrow(id: string) {
  if (IS_MOCK_API) return mockDelay(mock.payDeal(id), 900);
  return post(`/collabs/${id}/pay`);
}

/** Creator. `requiresDraftApproval` deals need an approved draft first (403 DRAFT_APPROVAL_REQUIRED). */
export async function submitPost(
  id: string,
  input: { postUrl: string; platform: 'instagram' | 'youtube'; screenshotUri?: string | null },
) {
  if (IS_MOCK_API) return mockDelay(mock.submitPost(id, input));
  const { screenshotUri, ...fields } = input;
  if (!screenshotUri) return post(`/collabs/${id}/submit`, fields);
  // Optional proof screenshot goes up as multipart field `screenshot`.
  const formData = new FormData();
  formData.append('postUrl', fields.postUrl);
  formData.append('platform', fields.platform);
  formData.append('screenshot', { uri: screenshotUri, name: 'screenshot.jpg', type: 'image/jpeg' } as unknown as Blob);
  const { data } = await apiClient.post<ApiEnvelope<unknown>>(`/collabs/${id}/submit`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}

/** Brand: verifies the post, releases escrow and completes the deal. */
export async function verifyPost(id: string) {
  if (IS_MOCK_API) return mockDelay(mock.verifyPost(id), 700);
  return post(`/collabs/${id}/verify`);
}

/** Brand, within 48h of submission. */
export async function raiseDispute(id: string, input: { reason: string; evidenceUrls?: string[] }) {
  if (IS_MOCK_API) return mockDelay(mock.raiseDispute(id, input));
  return post(`/collabs/${id}/dispute`, input);
}

/** Creator. Multipart `draft` field. */
export async function submitDraft(id: string, localUri: string) {
  if (IS_MOCK_API) return mockDelay(mock.submitDraft(id, localUri), 900);
  const formData = new FormData();
  const extension = localUri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const isVideo = ['mp4', 'mov', 'm4v'].includes(extension);
  formData.append('draft', {
    uri: localUri,
    name: `draft.${extension}`,
    type: isVideo ? `video/${extension === 'mov' ? 'quicktime' : extension}` : `image/${extension === 'jpg' ? 'jpeg' : extension}`,
  } as unknown as Blob);
  const { data } = await apiClient.post<ApiEnvelope<DealDraft>>(`/collabs/${id}/submit-draft`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}

/** Brand. */
export async function approveDraft(id: string, draftId: string) {
  if (IS_MOCK_API) return mockDelay(mock.reviewDraft(id, draftId, 'approved'));
  return post(`/collabs/${id}/drafts/${draftId}/approve`);
}

/** Brand. */
export async function requestDraftChanges(id: string, draftId: string, feedback: string) {
  if (IS_MOCK_API) return mockDelay(mock.reviewDraft(id, draftId, 'changes_requested', feedback));
  return post(`/collabs/${id}/drafts/${draftId}/request-changes`, { feedback });
}

/** Either party, once the deal is completed. One review per side. */
export async function submitReview(id: string, input: { rating: number; comment?: string }) {
  if (IS_MOCK_API) return mockDelay(mock.submitReview(id, input));
  return post(`/collabs/${id}/review`, input);
}

/** Creator, from day 6 (7-day) or day 28 (30-day) after completion. */
export async function submitPerformanceReport(
  id: string,
  input: Omit<PerformanceReport, 'id' | 'submittedAt'>,
) {
  if (IS_MOCK_API) return mockDelay(mock.submitPerformanceReport(id, input));
  return post(`/collabs/${id}/performance-report`, input);
}
