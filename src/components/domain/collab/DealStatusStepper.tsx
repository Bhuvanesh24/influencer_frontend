import dayjs from 'dayjs';
import { Check, X } from 'lucide-react-native';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { DealStatusLogEntry } from '@/lib/api/collabs';
import { cn } from '@/lib/cn';
import type { DealStatus } from '@/lib/deal-status';

type StepKey = 'requested' | 'accepted' | 'paid' | 'draft' | 'posted' | 'verified' | 'completed';

const LABELS: Record<StepKey, string> = {
  requested: 'Requested',
  accepted: 'Accepted',
  paid: 'Payment in escrow',
  draft: 'Draft approved',
  posted: 'Posted',
  verified: 'Verified',
  completed: 'Completed — paid out',
};

const STEP_OF_STATUS: Partial<Record<DealStatus, StepKey>> = {
  request_sent: 'requested',
  accepted: 'accepted',
  payment_pending: 'accepted',
  active: 'paid',
  post_submitted: 'posted',
  verified: 'verified',
  auto_approved: 'verified',
  completed: 'completed',
};

const NEGATIVE: Partial<Record<DealStatus, string>> = {
  rejected: 'Declined',
  expired: 'Expired',
  cancelled: 'Cancelled',
  disputed: 'Disputed',
};

interface DealStatusStepperProps {
  status: DealStatus;
  requiresDraftApproval: boolean;
  hasApprovedDraft: boolean;
  statusLog: DealStatusLogEntry[];
}

/**
 * Vertical deal timeline (prompt.md §8): the happy path with timestamps for the steps already
 * reached. A rejected/expired/cancelled/disputed deal ends in a red step that replaces the rest of
 * the path rather than being appended after it.
 */
export function DealStatusStepper({ status, requiresDraftApproval, hasApprovedDraft, statusLog }: DealStatusStepperProps) {
  const { colors } = useAppTheme();
  const steps: StepKey[] = requiresDraftApproval
    ? ['requested', 'accepted', 'paid', 'draft', 'posted', 'verified', 'completed']
    : ['requested', 'accepted', 'paid', 'posted', 'verified', 'completed'];

  // When each happy-path step was first reached, from the oldest log entry forward.
  const reachedAt: Partial<Record<StepKey, string>> = {};
  for (const entry of [...statusLog].reverse()) {
    const key = STEP_OF_STATUS[entry.toStatus];
    if (key && !reachedAt[key]) reachedAt[key] = entry.createdAt;
  }
  if (hasApprovedDraft) reachedAt.draft = reachedAt.draft ?? reachedAt.paid;

  // Steps strictly before `doneThrough` are complete; the one at it is "now" (unless finished).
  let doneThrough = 0;
  steps.forEach((key, i) => {
    if (reachedAt[key]) doneThrough = i + 1;
  });
  // A deal waiting on a draft is past "paid" but hasn't reached "posted" yet.
  if (requiresDraftApproval && !hasApprovedDraft) doneThrough = Math.min(doneThrough, steps.indexOf('draft'));

  const negativeLabel = NEGATIVE[status];
  const visible = negativeLabel ? steps.slice(0, Math.max(doneThrough, 1)) : steps;
  const negativeAt = negativeLabel ? statusLog.find((e) => e.toStatus === status)?.createdAt : undefined;
  const isFinished = status === 'completed';

  const rows = visible.map((key, i) => {
    const done = i < doneThrough || isFinished;
    const current = !negativeLabel && !isFinished && i === doneThrough;
    return { key, label: LABELS[key], done, current, at: reachedAt[key] };
  });

  return (
    <View accessibilityRole="list">
      {rows.map((row, i) => {
        const isLast = i === rows.length - 1 && !negativeLabel;
        return (
          <View key={row.key} className="flex-row gap-3">
            <View className="items-center">
              <View
                className={cn(
                  'h-6 w-6 items-center justify-center rounded-full border',
                  row.done ? 'border-accent bg-accent' : row.current ? 'border-ink bg-surface' : 'border-border bg-surface',
                )}
              >
                {row.done && <Check size={13} strokeWidth={3} color={colors.text.inverse} />}
                {row.current && <View className="h-2 w-2 rounded-full bg-action" />}
              </View>
              {!isLast && <View className={cn('w-px flex-1', row.done ? 'bg-accent' : 'bg-border')} style={{ minHeight: 18 }} />}
            </View>
            <View className="flex-1 flex-row items-start justify-between gap-2 pb-4">
              <Text
                variant="bodySm"
                weight={row.current ? 'semibold' : 'regular'}
                color={row.done || row.current ? 'primary' : 'muted'}
              >
                {row.label}
              </Text>
              {row.at && (row.done || row.current) && (
                <Text variant="caption" color="muted">
                  {dayjs(row.at).format('D MMM, h:mm a')}
                </Text>
              )}
            </View>
          </View>
        );
      })}
      {negativeLabel && (
        <View className="flex-row gap-3">
          <View className="h-6 w-6 items-center justify-center rounded-full bg-danger">
            <X size={13} strokeWidth={3} color={colors.text.inverse} />
          </View>
          <View className="flex-1 flex-row items-start justify-between gap-2">
            <Text variant="bodySm" weight="semibold" color="danger">
              {negativeLabel}
            </Text>
            {negativeAt && (
              <Text variant="caption" color="muted">
                {dayjs(negativeAt).format('D MMM, h:mm a')}
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
}
