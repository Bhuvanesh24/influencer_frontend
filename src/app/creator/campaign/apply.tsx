import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Package } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { PackageCard } from '@/components/domain/packages/PackageCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Text } from '@/components/ui/Text';
import { useInvalidateDealData } from '@/hooks/use-deal-mutation';
import { applyToCampaign, getCampaign } from '@/lib/api/campaigns';
import { getApiErrorMessage } from '@/lib/api/client';
import { listMyPackages } from '@/lib/api/creator';
import { CAMPAIGNS_QUERY_KEY, CREATOR_PACKAGES_QUERY_KEY } from '@/lib/query-keys';
import { toast } from '@/lib/toast';

/** Apply to an open campaign (prompt.md §6.4): pick a package, add an optional pitch. */
export default function ApplyScreen() {
  const router = useRouter();
  const invalidate = useInvalidateDealData();
  const { id } = useLocalSearchParams<{ id: string }>();
  const campaign = useQuery({ queryKey: [...CAMPAIGNS_QUERY_KEY, 'detail', id], queryFn: () => getCampaign(id) });
  const packages = useQuery({ queryKey: CREATOR_PACKAGES_QUERY_KEY, queryFn: listMyPackages });
  const active = (packages.data ?? []).filter((p) => p.isActive);
  // Same content type first: that's what the brand is asking for.
  const sorted = [...active].sort(
    (a, b) => Number(b.contentType === campaign.data?.contentType) - Number(a.contentType === campaign.data?.contentType),
  );
  const [packageId, setPackageId] = useState<string | null>(null);
  const [pitch, setPitch] = useState('');
  const pitchError = pitch.trim().length > 0 && pitch.trim().length < 10 ? 'At least 10 characters, or leave it empty' : undefined;

  const apply = useMutation({
    mutationFn: () => applyToCampaign(id, { packageId: packageId!, pitchNote: pitch.trim() || undefined }),
    onSuccess: async (result) => {
      await invalidate();
      const approved = (result as { status?: string } | undefined)?.status === 'approved';
      toast.success(
        approved ? 'Approved straight away' : 'Application sent',
        approved ? 'Accept the collab request to get started.' : 'You’ll get a notification when the brand decides.',
      );
      router.dismiss();
    },
    onError: (e) => toast.error('Could not apply', getApiErrorMessage(e)),
  });

  return (
    <Screen scroll keyboardAvoiding contentClassName="gap-8 pb-10 pt-2">
      <ScreenHeader />
      <View className="gap-2">
        <Text variant="h1">Apply</Text>
        <Text variant="body" color="secondary">
          {campaign.data ? `Choose the package you'd deliver for ${campaign.data.name}.` : ' '}
        </Text>
      </View>

      {active.length === 0 && !packages.isPending ? (
        <EmptyState
          icon={Package}
          title="Add a package first"
          description="You apply with one of your packages, so brands know exactly what they get."
          actionLabel="Add a package"
          onAction={() => router.push('/creator/package-form')}
        />
      ) : (
        <View className="gap-3">
          {sorted.map((p) => (
            <PackageCard key={p.id} pkg={p} mode="pick" selected={packageId === p.id} onSelect={() => setPackageId(p.id)} />
          ))}
        </View>
      )}

      <Input
        label="Why you (optional)"
        multiline
        maxLength={2000}
        showCharCount
        placeholder="A line or two on your idea for this campaign."
        value={pitch}
        onChangeText={setPitch}
        error={pitchError}
      />

      <Button size="lg" disabled={!packageId || !!pitchError} loading={apply.isPending} onPress={() => apply.mutate()}>
        Send application
      </Button>
    </Screen>
  );
}
