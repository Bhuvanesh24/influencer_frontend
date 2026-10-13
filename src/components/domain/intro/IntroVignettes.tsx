import { Check, Lock, Search, User } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { StatusBadge, TrustBadge } from '@/components/ui/Badge';
import { Chip } from '@/components/ui/Chip';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { cn } from '@/lib/cn';

/**
 * The visual on each intro slide: a small still of the product, composed from the app's own
 * primitives so it looks like what the user is about to use. They are illustrations of the
 * *mechanism* (search and filter, escrow, track record) — deliberately no creator names, follower
 * counts, ratings or prices, since none of those would be real.
 */

function VignetteCard({ children, className }: { children: ReactNode; className?: string }) {
  return <View className={cn('rounded-md border border-border bg-surface', className)}>{children}</View>;
}

function StepRow({
  label,
  icon = 'check',
  right,
  isFirst = false,
}: {
  label: string;
  icon?: 'check' | 'lock';
  right?: ReactNode;
  isFirst?: boolean;
}) {
  const { colors } = useAppTheme();
  const Icon = icon === 'lock' ? Lock : Check;

  return (
    <View className={cn('flex-row items-center gap-3 px-4 py-3', !isFirst && 'border-t border-border')}>
      <View className="h-7 w-7 items-center justify-center rounded-full bg-selected">
        <Icon size={14} strokeWidth={2.25} color={colors.accent.strong} />
      </View>
      <Text variant="bodySm" weight="medium" className="flex-1">
        {label}
      </Text>
      {right}
    </View>
  );
}

/** A creator result with its details left as placeholder bars — a shape, not a made-up person. */
function CreatorPlaceholderRow({ isFirst = false, nameWidth }: { isFirst?: boolean; nameWidth: number }) {
  const { colors } = useAppTheme();

  return (
    <View className={cn('flex-row items-center gap-3 px-4 py-3', !isFirst && 'border-t border-border')}>
      <View className="h-10 w-10 items-center justify-center rounded-full bg-selected">
        <User size={18} strokeWidth={1.5} color={colors.accent.strong} />
      </View>
      <View className="flex-1 gap-2">
        <View className="h-2.5 rounded-full bg-border" style={{ width: nameWidth }} />
        <View className="h-2 w-16 rounded-full bg-border/60" />
      </View>
      <View className="h-7 w-14 rounded-sm border border-border" />
    </View>
  );
}

function DiscoverVignette() {
  const { colors } = useAppTheme();

  return (
    <View className="gap-3">
      <VignetteCard className="min-h-12 flex-row items-center gap-2.5 px-4">
        <Search size={18} strokeWidth={1.75} color={colors.text.muted} />
        <Text variant="bodySm" color="muted">
          Search creators
        </Text>
      </VignetteCard>
      <View className="flex-row flex-wrap gap-2">
        <Chip label="Fashion" selected />
        <Chip label="Food" />
        <Chip label="Tech" />
        <Chip label="Travel" />
      </View>
      <VignetteCard>
        <CreatorPlaceholderRow isFirst nameWidth={112} />
        <CreatorPlaceholderRow nameWidth={88} />
      </VignetteCard>
    </View>
  );
}

function PartnerVignette() {
  return (
    <VignetteCard>
      <StepRow isFirst label="Brand sends a request" />
      <StepRow label="Creator accepts the package" />
      <StepRow icon="lock" label="Payment held in escrow" right={<StatusBadge label="Held" tone="held" />} />
    </VignetteCard>
  );
}

function GrowVignette() {
  return (
    <View className="gap-3">
      <VignetteCard>
        <StepRow isFirst label="Post verified" />
        <StepRow label="Payment released" right={<StatusBadge label="Released" tone="positive" />} />
      </VignetteCard>
      <VignetteCard className="px-4 py-3">
        <TrustBadge score="high" />
      </VignetteCard>
    </View>
  );
}

export const INTRO_VIGNETTES = {
  discover: DiscoverVignette,
  partner: PartnerVignette,
  grow: GrowVignette,
} as const;

export type IntroVignetteKey = keyof typeof INTRO_VIGNETTES;
