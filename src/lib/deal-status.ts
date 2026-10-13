/**
 * Deal lifecycle (prompt.md §1; backend `deal_status` enum). The one status → (label, tone) map
 * for every badge in the app — screens must not define their own.
 */
export type DealStatus =
  | 'request_sent'
  | 'accepted'
  | 'payment_pending'
  | 'active'
  | 'post_submitted'
  | 'verified'
  | 'auto_approved'
  | 'completed'
  | 'rejected'
  | 'expired'
  | 'cancelled'
  | 'disputed';

type Tone = 'neutral' | 'accent' | 'positive' | 'held' | 'danger' | 'info';

export const DEAL_STATUS_META: Record<DealStatus, { label: string; tone: Tone }> = {
  request_sent: { label: 'Request sent', tone: 'info' },
  accepted: { label: 'Accepted', tone: 'accent' },
  payment_pending: { label: 'Awaiting payment', tone: 'held' },
  active: { label: 'In progress', tone: 'accent' },
  post_submitted: { label: 'In review', tone: 'held' },
  verified: { label: 'Verified', tone: 'positive' },
  auto_approved: { label: 'Auto-approved', tone: 'positive' },
  completed: { label: 'Completed', tone: 'positive' },
  rejected: { label: 'Declined', tone: 'neutral' },
  expired: { label: 'Expired', tone: 'neutral' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
  disputed: { label: 'Disputed', tone: 'danger' },
};

/** Tolerates a status this build doesn't know yet, rather than crashing a list. */
export function dealStatusMeta(status: string): { label: string; tone: Tone } {
  return DEAL_STATUS_META[status as DealStatus] ?? { label: status.replace(/_/g, ' '), tone: 'neutral' };
}

/** Campaign lifecycle (backend `campaign_status` enum). */
const CAMPAIGN_STATUS_META: Record<string, { label: string; tone: Tone }> = {
  draft: { label: 'Draft', tone: 'neutral' },
  active: { label: 'Active', tone: 'accent' },
  paused: { label: 'Paused', tone: 'held' },
  completed: { label: 'Completed', tone: 'positive' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
};

export function campaignStatusMeta(status: string): { label: string; tone: Tone } {
  return CAMPAIGN_STATUS_META[status] ?? { label: status.replace(/_/g, ' '), tone: 'neutral' };
}
