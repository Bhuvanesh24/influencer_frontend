import { useQuery } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react-native';
import { forwardRef } from 'react';
import { View } from 'react-native';

import { AppBottomSheet, type AppBottomSheetRef } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { MoneyText } from '@/components/ui/MoneyText';
import { SkeletonBlock } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { getFeeBreakdown } from '@/lib/api/collabs';
import { IS_MOCK_API } from '@/lib/api/mock-mode';
import { formatMoney } from '@/lib/money';
import { collabFeesKey } from '@/lib/query-keys';

interface PaySheetProps {
  dealId: string;
  creatorName: string;
  paying: boolean;
  onConfirm: () => void;
}

/**
 * Razorpay checkout step 1 (prompt.md §6.6): the brand sees the server's fee breakdown and the
 * total before anything is charged. In mock mode "Confirm & pay" settles a demo payment; the real
 * create-order → Razorpay → lock-escrow sequence arrives with SPRINTS.md 4.3.
 */
export const PaySheet = forwardRef<AppBottomSheetRef, PaySheetProps>(function PaySheet(
  { dealId, creatorName, paying, onConfirm },
  ref,
) {
  const { colors } = useAppTheme();
  const { data, isPending } = useQuery({ queryKey: collabFeesKey(dealId), queryFn: () => getFeeBreakdown(dealId) });

  return (
    <AppBottomSheet ref={ref}>
      <View className="gap-5 px-5 pt-2">
        <View className="gap-1">
          <Text variant="h3">Pay into escrow</Text>
          <Text variant="bodySm" color="secondary">
            The money is held safely and released to {creatorName} only after you verify the post.
          </Text>
        </View>

        {isPending || !data ? (
          <SkeletonBlock className="h-32 w-full" radius={12} />
        ) : (
          <View className="gap-3 rounded-md border border-border bg-base p-4">
            <Row label="Collab price" amount={data.offeredAmount} />
            <Row label={`Platform fee (${data.platformCommissionRate})`} amount={data.brandSideFee} />
            <View className="h-px bg-border" />
            <View className="flex-row items-baseline justify-between">
              <Text variant="body" weight="semibold">
                Total
              </Text>
              <MoneyText amount={data.brandTotalCost} variant="h2" />
            </View>
          </View>
        )}

        <View className="flex-row items-center gap-2">
          <ShieldCheck size={16} strokeWidth={1.75} color={colors.accent.primary} />
          <Text variant="caption" color="secondary" className="flex-1">
            Refunded to your account if the creator never posts or a dispute is decided in your favour.
          </Text>
        </View>

        <Button size="lg" loading={paying} disabled={!data} onPress={onConfirm}>
          {data ? `Confirm & pay ${formatMoney(data.brandTotalCost)}` : 'Confirm & pay'}
        </Button>
        {IS_MOCK_API && (
          <Text variant="caption" color="muted" className="text-center">
            Demo payment — no money moves in this build.
          </Text>
        )}
      </View>
    </AppBottomSheet>
  );
});

function Row({ label, amount }: { label: string; amount: string }) {
  return (
    <View className="flex-row items-baseline justify-between">
      <Text variant="bodySm" color="secondary">
        {label}
      </Text>
      <MoneyText amount={amount} variant="body" weight="medium" />
    </View>
  );
}

