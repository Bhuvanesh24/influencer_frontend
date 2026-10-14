import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';
import { getApiErrorMessage } from '@/lib/api/client';
import { fetchBankNameForIfsc } from '@/lib/api/ifsc';
import { addPayoutAccount } from '@/lib/api/wallet';
import { WALLET_QUERY_KEY } from '@/lib/query-keys';
import { toast } from '@/lib/toast';
import { bankAccountSchema, upiIdSchema, type BankAccountInput } from '@/lib/validation/onboarding';

/** Add Payout Account (prompt.md §6.4): UPI ID, or the same bank fields as onboarding. */
export default function AddPayoutAccountScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [type, setType] = useState<'bank_account' | 'upi'>('bank_account');
  const [upi, setUpi] = useState('');
  const [upiError, setUpiError] = useState<string>();

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<BankAccountInput>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: { accountHolderName: '', accountNumber: '', confirmAccountNumber: '', ifscCode: '', bankName: '' },
  });

  const save = useMutation({
    mutationFn: addPayoutAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEY });
      toast.success('Account added');
      router.back();
    },
    onError: (e) => toast.error('Could not add the account', getApiErrorMessage(e)),
  });

  function submitUpi() {
    const parsed = upiIdSchema.safeParse(upi);
    if (!parsed.success) {
      setUpiError(parsed.error.issues[0]?.message);
      return;
    }
    save.mutate({ accountType: 'upi', upiId: parsed.data });
  }

  return (
    <Screen scroll keyboardAvoiding contentClassName="gap-8 pb-10 pt-2">
      <ScreenHeader />
      <View className="gap-2">
        <Text variant="h1">Add payout account</Text>
        <Text variant="body" color="secondary">
          Where should we send your money?
        </Text>
      </View>
      <SegmentedControl
        options={[
          { value: 'bank_account', label: 'Bank account' },
          { value: 'upi', label: 'UPI' },
        ]}
        value={type}
        onChange={setType}
      />

      {type === 'upi' ? (
        <View className="gap-6">
          <Input
            label="UPI ID"
            placeholder="name@bank"
            autoCapitalize="none"
            autoCorrect={false}
            value={upi}
            onChangeText={(t) => {
              setUpi(t);
              setUpiError(undefined);
            }}
            error={upiError}
            helperText="UPI suits smaller payouts; amounts above the UPI limit go to a bank account."
          />
          <Button size="lg" loading={save.isPending} onPress={submitUpi}>
            Add UPI ID
          </Button>
        </View>
      ) : (
        <View className="gap-6">
          <Controller
            control={control}
            name="accountHolderName"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Account holder name" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.accountHolderName?.message} />
            )}
          />
          <Controller
            control={control}
            name="accountNumber"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Account number"
                keyboardType="number-pad"
                secureTextEntry
                value={value}
                onChangeText={(t) => onChange(t.replace(/\D/g, ''))}
                onBlur={onBlur}
                error={errors.accountNumber?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="confirmAccountNumber"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Confirm account number"
                keyboardType="number-pad"
                value={value}
                onChangeText={(t) => onChange(t.replace(/\D/g, ''))}
                onBlur={onBlur}
                error={errors.confirmAccountNumber?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="ifscCode"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="IFSC code"
                autoCapitalize="characters"
                maxLength={11}
                value={value}
                onChangeText={async (t) => {
                  const code = t.toUpperCase();
                  onChange(code);
                  if (/^[A-Z]{4}0[A-Z0-9]{6}$/.test(code)) {
                    const bank = await fetchBankNameForIfsc(code);
                    if (bank) setValue('bankName', bank, { shouldValidate: true });
                  }
                }}
                onBlur={onBlur}
                error={errors.ifscCode?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="bankName"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Bank name" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.bankName?.message} helperText="Filled in from the IFSC code when we can find it." />
            )}
          />
          <Button
            size="lg"
            loading={save.isPending}
            onPress={handleSubmit((v) =>
              save.mutate({
                accountType: 'bank_account',
                accountHolderName: v.accountHolderName,
                accountNumber: v.accountNumber,
                ifscCode: v.ifscCode,
                bankName: v.bankName,
              }),
            )}
          >
            Add bank account
          </Button>
        </View>
      )}
    </Screen>
  );
}
