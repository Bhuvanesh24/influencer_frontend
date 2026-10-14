import { apiClient } from '@/lib/api/client';
import type { Page, Pagination } from '@/lib/api/collabs';
import * as mock from '@/lib/api/mock/billing';
import { IS_MOCK_API, mockDelay } from '@/lib/api/mock-mode';
import type { ContentType } from '@/lib/constants';

/**
 * Brand billing (escrow transactions) and analytics — `/brands/me/billing*` and
 * `/brands/me/analytics`, reconciled against influencer_backend on 2026-10-14.
 */

interface ApiEnvelope<T> {
  success: true;
  data: T;
  pagination?: Pagination;
}

export interface EscrowTransaction {
  id: string;
  offeredAmount: string;
  brandSideFee: string;
  creatorSideFee: string;
  amount: string;
  status: 'held' | 'released' | 'refunded' | 'partial_release' | 'disputed';
  paymentMethod: string | null;
  paymentGatewayTxnId: string | null;
  lockedAt: string;
  releasedAt: string | null;
  refundedAt: string | null;
  createdAt: string;
  deal: {
    id: string;
    dealNumber: string;
    status: string;
    contentType: ContentType;
    creatorProfile: { user: { displayName: string | null; profilePhotoUrl: string | null } };
  };
}

export interface BrandAnalytics {
  summary: {
    totalSpend: string;
    totalCollabs: number;
    totalCampaigns: number;
    completedDeals: number;
    acceptedDeals: number;
    totalDeals: number;
    conversionRate: number;
    acceptanceRate: number;
  };
  funnel: { sent: number; accepted: number; completed: number };
  byContentType: { contentType: ContentType; count: number; totalAmount: string }[];
  monthlySpend: { month: string; amount: string }[];
  topCreators: { creatorProfileId: string; displayName: string | null; profilePhotoUrl: string | null; niches: string[]; dealCount: number; totalPaid: string }[];
  /** Mock extra derived from the same deals: spend per creator niche (prompt.md §6.5 "Spend by Niche"). */
  byNiche?: { niche: string; amount: string }[];
}

export async function getBillingHistory(page = 1): Promise<Page<EscrowTransaction>> {
  if (IS_MOCK_API) return mockDelay(mock.getBillingHistory(page, 20));
  const { data } = await apiClient.get<ApiEnvelope<EscrowTransaction[]>>('/brands/me/billing', { params: { page, limit: 20 } });
  return { items: data.data, pagination: data.pagination! };
}

export async function getBillingTransaction(id: string): Promise<EscrowTransaction> {
  if (IS_MOCK_API) return mockDelay(mock.getBillingTransaction(id));
  const { data } = await apiClient.get<ApiEnvelope<EscrowTransaction>>(`/brands/me/billing/${id}`);
  return data.data;
}

export async function getBrandAnalytics(): Promise<BrandAnalytics> {
  if (IS_MOCK_API) return mockDelay(mock.getBrandAnalytics());
  const { data } = await apiClient.get<ApiEnvelope<BrandAnalytics>>('/brands/me/analytics');
  return data.data;
}
