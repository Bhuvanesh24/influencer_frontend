import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Text } from '@/components/ui/Text';
import { useDealMutation } from '@/hooks/use-deal-mutation';
import { counterOffer, getDeal } from '@/lib/api/collabs';
import { counterpartName } from '@/lib/collab-view';
import { formatMoney } from '@/lib/money';
import { collabDetailKey } from '@/lib/query-keys';

const MAX_ROUNDS = 2;

/** Counter-offer (prompt.md §6.4): a different price for the same package, max 2 rounds. */
export default function CounterOfferScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: deal } = useQuery({ queryKey: collabDetailKey(id), queryFn: () => getDeal(id) });
  // Starts at the brand's offer (prompt.md §6.4); null until the creator edits it.
  const [edited, setEdited] = useState<string | null>(null);
  const amount = edited ?? (deal ? String(Math.round(Number(deal.offeredAmount))) : '');
  const [touched, setTouched] = useState(false);

  const value = Number(amount);
  const error =
    touched && !(value > 0)
      ? 'Enter an amount'
      : touched && deal && value === Number(deal.offeredAmount)
        ? 'That is the amount already offered'
        : undefined;

  const send = useDealMutation(() => counterOffer(id, value), {
    success: 'Counter-offer sent',
    successBody: deal ? `${counterpartName(deal, 'creator')} can accept or decline it.` : undefined,
    onSuccess: () => router.back(),
  });

  const roundsLeft = deal ? MAX_ROUNDS - deal.counterOfferRounds : MAX_ROUNDS;

  return (
    <Screen scroll keyboardAvoiding contentClassName="gap-8 pt-2">
      <ScreenHeader />
      <View className="gap-2">
        <Text variant="h1">Propose a different price</Text>
        <Text variant="body" color="secondary">
          {deal
            ? `${counterpartName(deal, 'creator')} offered ${formatMoney(deal.offeredAmount)} for ${deal.package?.title ?? 'this collab'}.`
            : ' '}
        </Text>
      </View>

      <Input
        label="Your price"
        keyboardType="number-pad"
        leftIcon={<Text color="muted">₹</Text>}
        placeholder={deal ? String(Math.round(Number(deal.offeredAmount))) : ''}
        value={amount}
        onChangeText={(t) => setEdited(t.replace(/\D/g, ''))}
        onBlur={() => setTouched(true)}
        error={error}
        helperText={`Max ${MAX_ROUNDS} rounds of negotiation — ${roundsLeft} left. The brand can accept or decline; the request stays open meanwhile.`}
      />

      <Button
        size="lg"
        disabled={!deal || roundsLeft <= 0}
        loading={send.isPending}
        onPress={() => {
          setTouched(true);
          if (value > 0 && deal && value !== Number(deal.offeredAmount)) send.mutate();
        }}
      >
        {value > 0 ? `Send ${formatMoney(value)}` : 'Send counter-offer'}
      </Button>
    </Screen>
  );
}
