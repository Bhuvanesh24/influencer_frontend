import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { OtpInput } from '@/components/ui/OtpInput';
import { Text } from '@/components/ui/Text';
import * as authApi from '@/lib/api/auth';
import { getApiErrorMessage } from '@/lib/api/client';
import { IS_MOCK_API, MOCK_OTP_CODE } from '@/lib/api/mock-mode';
import { useCreatorWizardStore } from '@/lib/auth/creator-wizard-store';
import { toast } from '@/lib/toast';
import { phoneStepSchema, type PhoneStepInput } from '@/lib/validation/creator-wizard';

const RESEND_COOLDOWN_SECONDS = 30;

export function Step6Phone({ onNext }: { onNext: () => void }) {
  const wizard = useCreatorWizardStore();
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState<string | undefined>();
  const [cooldown, setCooldown] = useState(0);

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<PhoneStepInput>({
    resolver: zodResolver(phoneStepSchema),
    defaultValues: { phone: wizard.data.phone },
  });

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendOtpMutation = useMutation({
    mutationFn: (values: PhoneStepInput) => authApi.sendPhoneOtp({ phone: `+91${values.phone}` }),
    onSuccess: (_data, values) => {
      wizard.update({ phone: values.phone });
      setOtpSent(true);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      toast.success('Code sent', `We sent a code to +91 ${values.phone}`);
    },
    onError: (error) => toast.error('Could not send code', getApiErrorMessage(error)),
  });

  const verifyOtpMutation = useMutation({
    mutationFn: () => authApi.verifyPhoneOtp({ phone: `+91${getValues('phone')}`, otp }),
    onSuccess: () => {
      wizard.update({ phoneVerified: true });
      onNext();
    },
    onError: (error) => setOtpError(getApiErrorMessage(error)),
  });

  if (!otpSent) {
    return (
      <View className="gap-5">
        <Text variant="h1" weight="bold">
          Verify your phone
        </Text>

        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Phone number"
              placeholder="98765 43210"
              keyboardType="number-pad"
              maxLength={10}
              leftIcon={<Text color="muted">+91</Text>}
              value={value}
              onChangeText={(t) => onChange(t.replace(/\D/g, ''))}
              onBlur={onBlur}
              error={errors.phone?.message}
            />
          )}
        />

        <Button
          size="lg"
          loading={sendOtpMutation.isPending}
          onPress={handleSubmit((v) => sendOtpMutation.mutate(v))}
        >
          Send OTP
        </Button>
      </View>
    );
  }

  return (
    <View className="gap-5">
      <Text variant="h1" weight="bold">
        Enter the code
      </Text>
      <Text variant="body" color="secondary">
        We sent a 6-digit code to +91 {getValues('phone')}.
      </Text>

      <OtpInput
        value={otp}
        onChange={(v) => {
          setOtp(v);
          setOtpError(undefined);
        }}
        error={!!otpError}
      />
      {otpError && (
        <Text variant="caption" color="danger">
          {otpError}
        </Text>
      )}
      {IS_MOCK_API && (
        <Text variant="caption" color="muted">
          Dev build: use {MOCK_OTP_CODE} to verify.
        </Text>
      )}

      <Pressable
        onPress={() => sendOtpMutation.mutate(getValues())}
        disabled={cooldown > 0}
        hitSlop={8}
        className="self-start"
      >
        <Text variant="bodySm" weight="medium" color={cooldown > 0 ? 'muted' : 'brand'}>
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
        </Text>
      </Pressable>

      <Button
        size="lg"
        loading={verifyOtpMutation.isPending}
        disabled={otp.length < 6}
        onPress={() => verifyOtpMutation.mutate()}
      >
        Verify
      </Button>
    </View>
  );
}
