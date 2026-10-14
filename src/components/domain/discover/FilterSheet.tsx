import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { forwardRef, useState, type ReactNode } from 'react';
import { Switch, View } from 'react-native';

import { FollowerRangeLabels, type FollowerRange } from '@/components/ui/Badge';
import { AppBottomSheet, type AppBottomSheetRef } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { DEFAULT_FILTERS, type CreatorFilters, type DiscoverSort } from '@/lib/api/discovery';
import { CONTENT_TYPES, INDIAN_STATES, LANGUAGES, NICHES } from '@/lib/constants';
import { TrustScoreMeta, type TrustScore } from '@/lib/theme';

const SORTS: { value: DiscoverSort; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'engagement', label: 'Highest engagement' },
  { value: 'price_asc', label: 'Lowest price' },
  { value: 'collabs', label: 'Most collabs' },
  { value: 'best_value', label: 'Best value' },
];

/** Price presets stand in for the spec's dual slider (no slider dependency in the stack). */
const PRICES = [
  { label: 'Under ₹5k', min: undefined, max: 5000 },
  { label: '₹5k–15k', min: 5000, max: 15000 },
  { label: '₹15k–50k', min: 15000, max: 50000 },
  { label: '₹50k+', min: 50000, max: undefined },
] as const;

function toggle(list: string[] | undefined, value: string): string[] | undefined {
  const next = list?.includes(value) ? list.filter((v) => v !== value) : [...(list ?? []), value];
  return next.length ? next : undefined;
}

interface FilterSheetProps {
  value: CreatorFilters;
  onApply: (filters: CreatorFilters) => void;
}

/**
 * Discover's Filter Sheet (prompt.md §6.5): platform, content type, niche, language, state,
 * follower range, price, trust score, availability and sort. Edits a draft; nothing changes in
 * the grid until Apply.
 */
export const FilterSheet = forwardRef<AppBottomSheetRef, FilterSheetProps>(function FilterSheet({ value, onApply }, ref) {
  const { colors } = useAppTheme();
  const [draft, setDraft] = useState<CreatorFilters>(value);
  // Applied filters changed from outside (Apply, "Clear filters"): start the draft from them.
  const [applied, setApplied] = useState(value);
  if (applied !== value) {
    setApplied(value);
    setDraft(value);
  }

  const set = (patch: Partial<CreatorFilters>) => setDraft((d) => ({ ...d, ...patch }));

  return (
    <AppBottomSheet ref={ref} snapPoints={['88%']} scrollable onDismiss={() => setDraft(value)}>
      <View className="flex-row items-center justify-between px-5 pb-3">
        <Text variant="h3">Filters</Text>
      </View>
      <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 24 }}>
        <Group title="Sort by">
          {SORTS.map((s) => (
            <Chip key={s.value} label={s.label} selectable selected={draft.sort === s.value} onPress={() => set({ sort: s.value })} />
          ))}
        </Group>

        <View className="flex-row items-center justify-between">
          <Text variant="body" weight="medium">
            Available for collabs only
          </Text>
          <Switch
            value={draft.isAvailable === true}
            onValueChange={(v) => set({ isAvailable: v ? true : undefined })}
            trackColor={{ true: colors.accent.primary }}
            accessibilityLabel="Available for collabs only"
          />
        </View>

        <Group title="Platform">
          {(['instagram', 'youtube'] as const).map((p) => (
            <Chip
              key={p}
              label={p === 'instagram' ? 'Instagram' : 'YouTube'}
              selectable
              selected={draft.platform === p}
              onPress={() => set({ platform: draft.platform === p ? undefined : p })}
            />
          ))}
        </Group>

        <Group title="Content type">
          {CONTENT_TYPES.map((c) => (
            <Chip
              key={c.value}
              label={c.label}
              selectable
              selected={draft.contentType === c.value}
              onPress={() => set({ contentType: draft.contentType === c.value ? undefined : c.value })}
            />
          ))}
        </Group>

        <Group title="Niche">
          {NICHES.map((n) => (
            <Chip key={n} label={n} selectable selected={!!draft.niche?.includes(n)} onPress={() => set({ niche: toggle(draft.niche, n) })} />
          ))}
        </Group>

        <Group title="Audience size">
          {(Object.keys(FollowerRangeLabels) as FollowerRange[]).map((r) => (
            <Chip
              key={r}
              label={FollowerRangeLabels[r]}
              selectable
              selected={draft.followerRange === r}
              onPress={() => set({ followerRange: draft.followerRange === r ? undefined : r })}
            />
          ))}
        </Group>

        <Group title="Package price">
          {PRICES.map((p) => {
            const selected = draft.priceMin === p.min && draft.priceMax === p.max;
            return (
              <Chip
                key={p.label}
                label={p.label}
                selectable
                selected={selected}
                onPress={() => set(selected ? { priceMin: undefined, priceMax: undefined } : { priceMin: p.min, priceMax: p.max })}
              />
            );
          })}
        </Group>

        <Group title="Trust score">
          {(Object.keys(TrustScoreMeta) as TrustScore[]).map((t) => (
            <Chip
              key={t}
              label={TrustScoreMeta[t].label}
              selectable
              selected={draft.trustScore === t}
              onPress={() => set({ trustScore: draft.trustScore === t ? undefined : t })}
            />
          ))}
        </Group>

        <Group title="Language">
          {LANGUAGES.map((l) => (
            <Chip key={l} label={l} selectable selected={!!draft.language?.includes(l)} onPress={() => set({ language: toggle(draft.language, l) })} />
          ))}
        </Group>

        <Group title="State">
          {INDIAN_STATES.map((s) => (
            <Chip key={s} label={s} selectable selected={!!draft.state?.includes(s)} onPress={() => set({ state: toggle(draft.state, s) })} />
          ))}
        </Group>
      </BottomSheetScrollView>

      <View className="flex-row gap-3 border-t border-border px-5 pt-3">
        <Button variant="secondary" className="flex-1" onPress={() => setDraft(DEFAULT_FILTERS)}>
          Reset
        </Button>
        <Button className="flex-1" onPress={() => onApply(draft)}>
          Apply
        </Button>
      </View>
    </AppBottomSheet>
  );
});

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      <Text variant="bodySm" weight="semibold">
        {title}
      </Text>
      <View className="flex-row flex-wrap gap-2">{children}</View>
    </View>
  );
}
