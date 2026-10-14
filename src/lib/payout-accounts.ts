import type { EscrowTransaction } from '@/lib/api/billing';
import type { Payout, PayoutAccount } from '@/lib/api/wallet';

/** "HDFC Bank ••7812" or the UPI ID — never the full account number. */
export function maskAccount(a: Pick<PayoutAccount, 'accountType' | 'upiId' | 'bankName' | 'accountNumber'>): string {
  if (a.accountType === 'upi') return a.upiId ?? 'UPI';
  return `${a.bankName ?? 'Bank account'} ••${(a.accountNumber ?? '').slice(-4)}`;
}

/** Payout status → badge, per the backend's payout lifecycle. Money-state words, not just "Paid". */
export function payoutBadge(p: Pick<Payout, 'status' | 'isOnHold'>) {
  if (p.isOnHold) return { label: 'On hold', tone: 'held' as const };
  switch (p.status) {
    case 'completed':
      return { label: 'In your account', tone: 'positive' as const };
    case 'processing':
      return { label: 'On its way', tone: 'info' as const };
    case 'failed':
      return { label: 'Failed', tone: 'danger' as const };
    default:
      return { label: 'Queued', tone: 'held' as const };
  }
}

/** Where the brand's money is right now, in words (prompt.md §9). */
export function escrowBadge(status: EscrowTransaction['status']) {
  switch (status) {
    case 'released':
      return { label: 'Released to creator', tone: 'positive' as const };
    case 'refunded':
      return { label: 'Refunded to you', tone: 'neutral' as const };
    case 'partial_release':
      return { label: 'Partly released', tone: 'held' as const };
    case 'disputed':
      return { label: 'Held — disputed', tone: 'danger' as const };
    default:
      return { label: 'Held in escrow', tone: 'held' as const };
  }
}
