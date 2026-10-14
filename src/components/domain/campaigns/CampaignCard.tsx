import { Send, Users } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { StatusBadge } from '@/components/ui/Badge';
import { CountdownChip } from '@/components/ui/CountdownChip';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { CampaignType } from '@/lib/api/campaigns';
import { contentTypeLabel, type ContentType } from '@/lib/constants';
import { campaignStatusMeta } from '@/lib/deal-status';
import { formatMoney } from '@/lib/money';

export const CAMPAIGN_TYPE_META: Record<CampaignType, { label: string; icon: typeof Send }> = {
  BrandInvite: { label: 'Brand invite', icon: Send },
  OpenApplication: { label: 'Open application', icon: Users },
};

interface CampaignCardProps {
  type: CampaignType;
  name: string;
  /** Brand name — shown on the creator side. */
  brandName?: string | null;
  contentType: ContentType;
  status?: string;
  /** e.g. "₹10,000 per creator" or "₹1,00,000 budget". */
  money: { amount: string | null; suffix: string };
  /** Filled vs total slots — a progress bar on the brand side, "8 of 15 left" on the creator side. */
  slots?: { filled: number; total: number; mode: 'progress' | 'remaining' };
  deadline?: { at: string; label: string } | null;
  onPress: () => void;
}

/**
 * Campaign card (prompt.md §8 CampaignCard). Brand-Invite and Open Application never look alike:
 * each has its own icon and type label in the top row.
 */
export function CampaignCard(p: CampaignCardProps) {
  const { colors } = useAppTheme();
  const type = CAMPAIGN_TYPE_META[p.type];
  const Icon = type.icon;
  const status = p.status ? campaignStatusMeta(p.status) : null;
  const pct = p.slots && p.slots.total > 0 ? Math.min(100, (p.slots.filled / p.slots.total) * 100) : 0;

  return (
    <Pressable
      onPress={p.onPress}
      accessibilityRole="button"
      accessibilityLabel={`${p.name}, ${type.label}${status ? `, ${status.label}` : ''}`}
      className="gap-3 rounded-md border border-border bg-surface p-4 active:bg-base"
    >
      <View className="flex-row items-center gap-2">
        <View className="flex-row items-center gap-1.5 rounded-full border border-border px-2.5 py-1">
          <Icon size={12} strokeWidth={2} color={colors.text.secondary} />
          <Text variant="caption" weight="semibold" color="secondary">
            {type.label}
          </Text>
        </View>
        {status && <StatusBadge label={status.label} tone={status.tone} />}
      </View>

      <View className="gap-0.5">
        {p.brandName !== undefined && (
          <Text variant="caption" color="secondary">
            {p.brandName ?? 'A brand'}
          </Text>
        )}
        <Text variant="h3" numberOfLines={2}>
          {p.name}
        </Text>
        <Text variant="bodySm" color="secondary">
          {contentTypeLabel(p.contentType)}
          {p.money.amount ? ` · ${formatMoney(p.money.amount)} ${p.money.suffix}` : ''}
        </Text>
      </View>

      {p.slots && p.slots.mode === 'progress' && (
        <View className="gap-1">
          <View className="h-1.5 overflow-hidden rounded-full bg-base">
            <View className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
          </View>
          <Text variant="caption" color="muted">
            {p.slots.filled} of {p.slots.total} creators
          </Text>
        </View>
      )}

      {(p.deadline || (p.slots && p.slots.mode === 'remaining')) && (
        <View className="flex-row flex-wrap items-center gap-2">
          {p.slots && p.slots.mode === 'remaining' && (
            <View className="rounded-full bg-selected px-2.5 py-1">
              <Text variant="caption" weight="semibold">
                {Math.max(0, p.slots.total - p.slots.filled)} of {p.slots.total} spots left
              </Text>
            </View>
          )}
          {p.deadline && <CountdownChip until={p.deadline.at} label={p.deadline.label} />}
        </View>
      )}
    </Pressable>
  );
}
