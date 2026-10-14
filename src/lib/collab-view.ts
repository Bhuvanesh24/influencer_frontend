import type { DealListItem } from '@/lib/api/collabs';
import type { AccountType } from '@/lib/auth/types';
import type { DealStatus } from '@/lib/deal-status';

/** The other party's display name, from the viewer's side. A brand can hide its name until paid. */
export function counterpartName(deal: DealListItem, viewer: AccountType): string {
  if (viewer === 'creator') return deal.brandProfile.companyName || 'A Brand';
  return deal.creatorProfile.user.displayName || 'Creator';
}

export function counterpartPhoto(deal: DealListItem, viewer: AccountType): string | null {
  return viewer === 'creator' ? deal.brandProfile.logoUrl : deal.creatorProfile.user.profilePhotoUrl;
}

/** The one deadline that matters right now for this status, if any (for CountdownChip). */
export function activeDeadline(deal: DealListItem): { label: string; at: string } | null {
  switch (deal.status) {
    case 'request_sent':
      return deal.requestExpiresAt ? { label: 'Respond', at: deal.requestExpiresAt } : null;
    case 'accepted':
    case 'payment_pending':
    case 'active':
      return { label: 'Post by', at: deal.postingDeadline };
    case 'post_submitted': {
      const at = deal.submissions[0]?.verificationDeadline;
      return at ? { label: 'Verify by', at } : null;
    }
    default:
      return null;
  }
}

/** My Collabs segments (prompt.md §6.3). */
export const CREATOR_COLLAB_TABS = [
  { value: 'requests', label: 'Requests', statuses: ['request_sent', 'accepted'] },
  { value: 'active', label: 'Active', statuses: ['payment_pending', 'active', 'post_submitted'] },
  {
    value: 'past',
    label: 'Past',
    statuses: ['verified', 'auto_approved', 'completed', 'rejected', 'expired', 'cancelled', 'disputed'],
  },
] as const satisfies readonly { value: string; label: string; statuses: readonly DealStatus[] }[];

export const TERMINAL_STATUSES: DealStatus[] = ['completed', 'rejected', 'expired', 'cancelled'];
