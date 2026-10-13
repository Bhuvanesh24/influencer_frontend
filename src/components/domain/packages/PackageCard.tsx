import {
  Camera,
  Check,
  CircleDashed,
  Film,
  Image as ImageIcon,
  MonitorPlay,
  Radio,
  Smartphone,
  Video,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, Switch, View } from 'react-native';

import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { MoneyText } from '@/components/ui/MoneyText';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { CreatorPackage } from '@/lib/api/creator';
import { cn } from '@/lib/cn';
import { contentTypeLabel, type ContentType } from '@/lib/constants';
import { formatMoney } from '@/lib/money';

const CONTENT_TYPE_ICON: Record<ContentType, LucideIcon> = {
  reel: Film,
  post: ImageIcon,
  story: CircleDashed,
  youtube_video: MonitorPlay,
  youtube_shorts: Smartphone,
  youtube_live: Radio,
  ugc_video: Video,
  ugc_photo: Camera,
};

type PackageCardProps = { pkg: CreatorPackage } & (
  | {
      /** The creator's own list: active switch + edit. */
      mode: 'manage';
      onEdit: () => void;
      onToggleActive: (next: boolean) => void;
    }
  | {
      /** A brand choosing a package: the whole card is a radio. */
      mode: 'pick';
      selected: boolean;
      onSelect: () => void;
    }
  | {
      /** Read-only (public profile), with an optional call to action. */
      mode: 'display';
      actionLabel?: string;
      onAction?: () => void;
    }
);

/**
 * The one package card (prompt.md §8): a package looks the same wherever it appears — the
 * creator's own list, a brand picking one for a request, a public profile. Only the footer and
 * the selection affordance change with `mode`.
 */
export function PackageCard(props: PackageCardProps) {
  const { pkg } = props;
  const { colors } = useAppTheme();
  const Icon = CONTENT_TYPE_ICON[pkg.contentType] ?? Film;
  const isPick = props.mode === 'pick';
  const isSelected = isPick && props.selected;
  const hasGuidance = pkg.recommendedMin !== null && pkg.recommendedMax !== null;

  const body = (
    <>
      <View className="flex-row items-start gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-md border border-border bg-base">
          <Icon size={20} strokeWidth={1.5} color={colors.text.primary} />
        </View>
        <View className="flex-1 gap-0.5">
          <Text variant="h3">{pkg.title}</Text>
          <Text variant="bodySm" color="secondary">
            {pkg.quantity} × {contentTypeLabel(pkg.contentType)}
          </Text>
        </View>
        {/* The amount never truncates — the title column yields instead. */}
        <MoneyText amount={pkg.price} variant="h3" />
        {isPick && (
          <View
            className={cn(
              'h-6 w-6 items-center justify-center rounded-full border',
              isSelected ? 'border-accent bg-accent' : 'border-border bg-surface',
            )}
          >
            {isSelected && <Check size={14} strokeWidth={3} color={colors.text.inverse} />}
          </View>
        )}
      </View>

      {pkg.description ? (
        <Text variant="bodySm" color="secondary" numberOfLines={props.mode === 'display' ? undefined : 3}>
          {pkg.description}
        </Text>
      ) : null}

      {props.mode === 'manage' && hasGuidance && (
        <Text variant="caption" color="muted">
          Similar creators charge {formatMoney(pkg.recommendedMin)}–{formatMoney(pkg.recommendedMax)} for this.
        </Text>
      )}

      {props.mode === 'manage' && (
        <View className="flex-row items-center gap-3 border-t border-border pt-3">
          <Switch
            value={pkg.isActive}
            onValueChange={props.onToggleActive}
            trackColor={{ true: colors.accent.primary }}
            accessibilityLabel={`${pkg.title} is ${pkg.isActive ? 'visible to brands' : 'hidden from brands'}`}
          />
          <View className="flex-1">
            {pkg.isActive ? (
              <Text variant="bodySm" color="secondary">
                Visible to brands
              </Text>
            ) : (
              <StatusBadge label="Hidden from brands" />
            )}
          </View>
          <Button variant="secondary" size="sm" fullWidth={false} onPress={props.onEdit} className="px-4">
            Edit
          </Button>
        </View>
      )}

      {props.mode === 'display' && props.actionLabel && props.onAction && (
        <Button variant="secondary" onPress={props.onAction}>
          {props.actionLabel}
        </Button>
      )}
    </>
  );

  if (isPick) {
    return (
      <Pressable
        onPress={props.onSelect}
        accessibilityRole="radio"
        accessibilityState={{ checked: isSelected }}
        className={cn(
          'gap-3 rounded-md border p-4',
          isSelected ? 'border-accent bg-selected' : 'border-border bg-surface active:bg-base',
        )}
      >
        {body}
      </Pressable>
    );
  }

  return <View className="gap-3 rounded-md border border-border bg-surface p-4">{body}</View>;
}
