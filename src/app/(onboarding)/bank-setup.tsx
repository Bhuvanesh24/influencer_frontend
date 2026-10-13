import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import * as authApi from '@/lib/api/auth';
import { getApiErrorMessage } from '@/lib/api/client';
import { fetchBankNameForIfsc } from '@/lib/api/ifsc';
import { useAuthStore } from '@/lib/auth/store';
import { useOnboardingDraftStore } from '@/lib/auth/onboarding-draft-store';
import { applyServerFieldErrors } from '@/lib/form-errors';
import { toast } from '@/lib/toast';
import { bankSetupSchema, type BankSetupInput } from '@/lib/validation/onboarding';

const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export default function BankSetupScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const setSession = useAuthStore((s) => s.setSession);
  const draft = useOnboardingDraftStore();
  const lastAutofilledBankName = useRef('');

  useEffect(() => {
    // Draft is in-memory only (app-restart-safe by design, see onboarding-draft-store.ts) — if
    // it's missing, the user landed here without picking a role first. Checked once, on mount,
    // via getState() rather than the reactive `draft` value: onSuccess below calls draft.clear()
    // right before navigating away, and if this effect depended on `draft.accountType` it would
    // re-fire on that clear and immediately bounce the user back to Role Selection instead of
    // letting the how-it-works navigation win.
    if (!useOnboardingDraftStore.getState().accountType) {
      router.replace('/(onboarding)/role-selection');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<BankSetupInput>({
    resolver: zodResolver(bankSetupSchema),
    defaultValues: {
      accountHolderName: '',
      accountNumber: '',
      confirmAccountNumber: '',
      ifscCode: '',
      bankName: '',
      addUpi: false,
      upiId: '',
    },
  });

  const ifscCode = watch('ifscCode');
  const bankName = watch('bankName');

  useEffect(() => {
    if (!IFSC_REGEX.test(ifscCode)) return;

    const timeout = setTimeout(async () => {
      const result = await fetchBankNameForIfsc(ifscCode);
      if (!result) return;
      // Only overwrite if the field is still empty or still holds our own last autofill —
      // never clobber a value the user typed themselves.
      if (bankName === '' || bankName === lastAutofilledBankName.current) {
        lastAutofilledBankName.current = result;
        setValue('bankName', result);
      }
    }, 500);

    return () => clearTimeout(timeout);
    // `bankName` deliberately omitted: it's read via closure only to guard against clobbering a
    // manual edit, not to retrigger the lookup — including it would refire this effect on every
    // autofill (setValue → bankName changes → effect reruns) for no benefit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ifscCode, setValue]);

  const mutation = useMutation({
    mutationFn: (values: BankSetupInput) =>
      authApi.completeOnboarding(
        {
          accountType: draft.accountType!,
          displayName: draft.displayName,
          bankAccount: {
            accountHolderName: values.accountHolderName,
            accountNumber: values.accountNumber,
            ifscCode: values.ifscCode,
            bankName: values.bankName,
          },
          upiId: values.addUpi ? values.upiId : undefined,
        },
        { skipGlobalErrorToast: true },
      ),
    onSuccess: (session) => {
      setSession(session);
      draft.clear();
      router.replace('/(onboarding)/how-it-works');
    },
    onError: (error) => {
      const appliedFieldErrors = applyServerFieldErrors<BankSetupInput>(error, setError);
      if (!appliedFieldErrors) {
        toast.error('Could not save bank details', getApiErrorMessage(error));
      }
    },
  });

  if (!draft.accountType) {
    // Redirect is already in flight (effect above) — render nothing rather than a form that
    // has no role to submit against.
    return null;
  }

  return (
    <Screen scroll keyboardAvoiding contentClassName="gap-8 px-6 pt-2">
      <ScreenHeader />

      <View className="gap-2">
        <Text variant="h1">Bank details</Text>
        <Text variant="body" color="secondary">
          {draft.accountType === 'creator'
            ? 'This is the account your payouts are sent to.'
            : 'This is the account any refunds are returned to.'}
        </Text>
      </View>

      <View className="flex-row items-center gap-3 rounded-md bg-selected p-4">
        <ShieldCheck size={20} strokeWidth={1.5} color={colors.accent.strong} />
        <Text variant="bodySm" className="flex-1">
          Your details are used only to move money for your collaborations.
        </Text>
      </View>

      <View className="gap-4">
        <Controller
          control={control}
          name="accountHolderName"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Account holder name"
              placeholder="As per bank records"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.accountHolderName?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="accountNumber"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Account number"
              placeholder="1234567890"
              keyboardType="number-pad"
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
              placeholder="Re-enter to confirm"
              keyboardType="number-pad"
              contextMenuHidden
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
              placeholder="ABCD0123456"
              autoCapitalize="characters"
              maxLength={11}
              value={value}
              onChangeText={(t) => onChange(t.toUpperCase())}
              onBlur={onBlur}
              error={errors.ifscCode?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="bankName"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Bank name"
              placeholder="Auto-filled from IFSC, or enter manually"
              value={value}
              onChangeText={(t) => {
                lastAutofilledBankName.current = '';
                onChange(t);
              }}
              onBlur={onBlur}
              error={errors.bankName?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="addUpi"
          render={({ field: { onChange, value } }) =>
            value ? (
              <Controller
                control={control}
                name="upiId"
                render={({ field: upiField }) => (
                  <View className="gap-2">
                    <Input
                      label="UPI ID"
                      placeholder="name@bank"
                      autoCapitalize="none"
                      value={upiField.value}
                      onChangeText={upiField.onChange}
                      onBlur={upiField.onBlur}
                      error={errors.upiId?.message}
                    />
                    <Pressable
                      onPress={() => onChange(false)}
                      hitSlop={12}
                      accessibilityRole="button"
                      className="self-start py-1 active:opacity-60"
                    >
                      <Text variant="bodySm" weight="semibold" color="secondary">
                        Remove UPI ID
                      </Text>
                    </Pressable>
                  </View>
                )}
              />
            ) : (
              <Pressable
                onPress={() => onChange(true)}
                hitSlop={12}
                accessibilityRole="button"
                className="self-start py-1 active:opacity-60"
              >
                <Text variant="bodySm" weight="semibold" color="accent">
                  + Add UPI ID as well
                </Text>
              </Pressable>
            )
          }
        />
      </View>

      <Button
        size="lg"
        loading={mutation.isPending}
        onPress={handleSubmit((v) => mutation.mutate(v))}
      >
        Finish Setup
      </Button>
    </Screen>
  );
}
