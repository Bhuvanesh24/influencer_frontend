import { Pressable, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CountdownChip } from '@/components/ui/CountdownChip';
import { MoneyText } from '@/components/ui/MoneyText';
import { Text } from '@/components/ui/Text';
import type { DealListItem } from '@/lib/api/collabs';
import type { AccountType } from '@/lib/auth/types';
import { activeDeadline, counterpartName, counterpartPhoto } from '@/lib/collab-view';
import { contentTypeLabel } from '@/lib/constants';
import { dealStatusMeta } from '@/lib/deal-status';

interface DealCardProps {
  deal: DealListItem;
  viewer: AccountType;
  onPress: () => void;
  /** Creator's incoming requests: accept/decline without opening the deal (prompt.md §6.4). */
  quickActions?: { onAccept: () => void; onDecline: () => void; busy?: boolean };
}

/**
 * One deal in a list (prompt.md §6.3 DealCard): counterpart, package, amount, status, and the
 * deadline that matters for the current status.
 */
export function DealCard({ deal, viewer, onPress, quickActions }: DealCardProps) {
  const name = counterpartName(deal, viewer);
  const status = dealStatusMeta(deal.status);
  const deadline = activeDeadline(deal);
  const hasCounter = deal.status === 'request_sent' && !!deal.counterOfferAmount;

  return (
    <View className="overflow-hidden rounded-md border border-border bg-surface">
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${name}, ${deal.package?.title ?? 'collab'}, ${status.label}`}
        className="gap-3 p-4 active:bg-base"
      >
        <View className="flex-row items-center gap-3">
          <Avatar name={name} uri={counterpartPhoto(deal, viewer)} size="sm" />
          <View className="flex-1 gap-0.5">
            <Text variant="body" weight="semibold" numberOfLines={1}>
              {name}
            </Text>
            <Text variant="caption" color="secondary" numberOfLines={1}>
              {deal.package
                ? `${deal.package.title} · ${contentTypeLabel(deal.package.contentType)}`
                : contentTypeLabel(deal.contentType)}
              {deal.campaign ? ` · ${deal.campaign.name}` : ''}
            </Text>
          </View>
          <MoneyText amount={deal.offeredAmount} variant="h3" />
        </View>
        <View className="flex-row flex-wrap items-center gap-2">
          <StatusBadge label={hasCounter ? 'Counter-offer' : status.label} tone={hasCounter ? 'held' : status.tone} />
          {deadline && <CountdownChip until={deadline.at} label={deadline.label} />}
          <Text variant="caption" color="muted" className="ml-auto">
            {deal.dealNumber}
          </Text>
        </View>
      </Pressable>

      {quickActions && deal.status === 'request_sent' && !hasCounter && (
        <View className="flex-row gap-3 border-t border-border p-3">
          <Button variant="secondary" size="md" className="flex-1" disabled={quickActions.busy} onPress={quickActions.onDecline}>
            Decline
          </Button>
          <Button size="md" className="flex-1" disabled={quickActions.busy} onPress={quickActions.onAccept}>
            Accept
          </Button>
        </View>
      )}
    </View>
  );
}
