import { apiClient } from '@/lib/api/client';
import type { Page, Pagination } from '@/lib/api/collabs';
import * as mock from '@/lib/api/mock/wallet';
import { IS_MOCK_API, mockDelay } from '@/lib/api/mock-mode';
import type { ContentType } from '@/lib/constants';

/**
 * Creator wallet — `/wallet/*` (creator-only routes), reconciled against influencer_backend's
 * wallet service on 2026-10-14. `totalEarned` is paid-out money only.
 */

interface ApiEnvelope<T> {
  success: true;
  data: T;
  pagination?: Pagination;
}

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface PayoutAccount {
  id: string;
  accountType: 'upi' | 'bank_account';
  upiId: string | null;
  bankName: string | null;
  accountNumber: string | null;
  ifscCode?: string | null;
  accountHolderName: string | null;
  isPrimary: boolean;
  isVerified: boolean;
  createdAt?: string;
}

export interface WalletSummary {
  totalEarned: string;
  totalFeesPaid: string;
  totalCompletedPayouts: number;
  pending: { amount: string; count: number };
  processing: { amount: string; count: number };
  failed: { amount: string; count: number };
  onHold: { amount: string; count: number };
  primaryAccount: PayoutAccount | null;
}

export interface Payout {
  id: string;
  offeredAmount: string;
  creatorSideFee: string;
  amount: string;
  status: PayoutStatus;
  isOnHold: boolean;
  holdReason: string | null;
  payoutMethod: string | null;
  completedAt: string | null;
  failedReason: string | null;
  createdAt: string;
  deal: {
    id: string;
    dealNumber: string;
    contentType: ContentType;
    brandProfile: { companyName: string | null; logoUrl: string | null };
    package?: { title: string } | null;
  };
}

export type NewPayoutAccount =
  | { accountType: 'upi'; upiId: string }
  | { accountType: 'bank_account'; accountNumber: string; ifscCode: string; bankName: string; accountHolderName: string };

export async function getWalletSummary(): Promise<WalletSummary> {
  if (IS_MOCK_API) return mockDelay(mock.getWalletSummary());
  const { data } = await apiClient.get<ApiEnvelope<WalletSummary>>('/wallet/summary');
  return data.data;
}

/** `status` filters the list; `'on_hold'` is a client-side filter over the loaded page. */
export async function getPayouts(page = 1, status?: PayoutStatus): Promise<Page<Payout>> {
  if (IS_MOCK_API) return mockDelay(mock.getPayouts(page, 20, status));
  const { data } = await apiClient.get<ApiEnvelope<Payout[]>>('/wallet/payouts', { params: { page, limit: 20, status } });
  return { items: data.data, pagination: data.pagination! };
}

export async function getMonthlyEarnings(months = 6): Promise<{ month: string; amount: string }[]> {
  if (IS_MOCK_API) return mockDelay(mock.getMonthlyEarnings(months));
  const { data } = await apiClient.get<ApiEnvelope<{ month: string; amount: string }[]>>('/wallet/earnings/monthly', {
    params: { months },
  });
  return data.data;
}

export async function listPayoutAccounts(): Promise<PayoutAccount[]> {
  if (IS_MOCK_API) return mockDelay(mock.listPayoutAccounts());
  const { data } = await apiClient.get<ApiEnvelope<PayoutAccount[]>>('/wallet/payout-accounts');
  return data.data;
}

export async function addPayoutAccount(input: NewPayoutAccount): Promise<PayoutAccount> {
  if (IS_MOCK_API) return mockDelay(mock.addPayoutAccount(input));
  const { data } = await apiClient.post<ApiEnvelope<PayoutAccount>>('/wallet/payout-accounts', input);
  return data.data;
}

export async function setPrimaryPayoutAccount(id: string): Promise<void> {
  if (IS_MOCK_API) {
    await mockDelay(undefined, 250);
    mock.setPrimary(id);
    return;
  }
  await apiClient.patch(`/wallet/payout-accounts/${id}/set-primary`);
}

export async function deletePayoutAccount(id: string): Promise<void> {
  if (IS_MOCK_API) {
    await mockDelay(undefined, 250);
    mock.deleteAccount(id);
    return;
  }
  await apiClient.delete(`/wallet/payout-accounts/${id}`);
}
