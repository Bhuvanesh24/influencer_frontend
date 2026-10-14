import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { CircleAlert, Landmark, Plus, Smartphone } from 'lucide-react-native';
import { View } from 'react-native';

import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useConfirmSheet } from '@/components/ui/ConfirmSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SkeletonListRow } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useRefetchOnFocus } from '@/hooks/use-refetch-on-focus';
import { getApiErrorMessage } from '@/lib/api/client';
import { deletePayoutAccount, listPayoutAccounts, setPrimaryPayoutAccount } from '@/lib/api/wallet';
import { maskAccount } from '@/lib/payout-accounts';
import { WALLET_QUERY_KEY } from '@/lib/query-keys';
import { toast } from '@/lib/toast';

/** Payout Accounts (prompt.md §6.4): where payouts go. The primary account receives them. */
export default function PayoutAccountsScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();
  const { ask, sheet } = useConfirmSheet();
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: [...WALLET_QUERY_KEY, 'accounts'],
    queryFn: listPayoutAccounts,
  });
  useRefetchOnFocus(refetch);

  const refresh = () => queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEY });
  const makePrimary = useMutation({
    mutationFn: setPrimaryPayoutAccount,
    onSuccess: () => {
      toast.success('Primary account changed', 'New payouts go to this account.');
      refresh();
    },
    onError: (e) => toast.error('Could not change it', getApiErrorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: deletePayoutAccount,
    onSuccess: () => {
      toast.success('Account removed');
      refresh();
    },
    onError: (e) => toast.error('Could not remove the account', getApiErrorMessage(e)),
  });

  return (
    <Screen scroll contentClassName="gap-6 pb-10 pt-2">
      <ScreenHeader title="Payout accounts" />
      <Text variant="body" color="secondary">
        Payouts go to your primary account. UPI suits smaller amounts; large payouts need a bank account.
      </Text>

      {isPending ? (
        <View className="gap-3">
          <SkeletonListRow />
          <SkeletonListRow />
        </View>
      ) : isError ? (
        <EmptyState icon={CircleAlert} title="Couldn't load your accounts" description={getApiErrorMessage(error)} actionLabel="Try again" onAction={() => refetch()} />
      ) : (
        <View className="gap-3">
          {data.map((a) => {
            const Icon = a.accountType === 'upi' ? Smartphone : Landmark;
            return (
              <View key={a.id} className="gap-3 rounded-md border border-border bg-surface p-4">
                <View className="flex-row items-center gap-3">
                  <Icon size={20} strokeWidth={1.5} color={colors.text.primary} />
                  <View className="flex-1 gap-0.5">
                    <Text variant="body" weight="semibold">
                      {maskAccount(a)}
                    </Text>
                    <Text variant="caption" color="secondary">
                      {a.accountType === 'upi' ? 'UPI' : `${a.accountHolderName ?? ''} · ${a.ifscCode ?? ''}`}
                    </Text>
                  </View>
                  {a.isPrimary && <StatusBadge label="Primary" tone="accent" />}
                </View>
                {!a.isVerified && (
                  <Text variant="caption" color="muted">
                    Not verified yet.
                  </Text>
                )}
                <View className="flex-row gap-3">
                  {!a.isPrimary && (
                    <Button variant="secondary" size="sm" className="flex-1" loading={makePrimary.isPending && makePrimary.variables === a.id} onPress={() => makePrimary.mutate(a.id)}>
                      Make primary
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onPress={() =>
                      ask({
                        title: 'Remove this account?',
                        description: a.isPrimary
                          ? 'Your oldest other account becomes primary. Payouts already on their way are not affected.'
                          : 'You can add it again later.',
                        confirmLabel: 'Remove',
                        destructive: true,
                        onConfirm: () => remove.mutate(a.id),
                      })
                    }
                  >
                    Remove
                  </Button>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <Button variant="secondary" size="lg" leftIcon={<Plus size={18} color={colors.text.primary} />} onPress={() => router.push('/creator/payout-account-new')}>
        Add account
      </Button>
      {sheet}
    </Screen>
  );
}
