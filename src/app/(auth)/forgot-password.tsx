import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Mail, MailCheck } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { IconBadge } from '@/components/ui/IconBadge';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import * as authApi from '@/lib/api/auth';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validation/auth';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [isSent, setIsSent] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const mutation = useMutation({
    mutationFn: authApi.forgotPassword,
    // Same message whether or not the email exists — anti-enumeration (prompt.md §6.1).
    onSettled: () => setIsSent(true),
  });

  if (isSent) {
    return (
      <Screen contentClassName="justify-center gap-6 px-6">
        <IconBadge icon={MailCheck} tone="positive" />
        <View className="gap-2">
          <Text variant="h1">Check your email</Text>
          <Text variant="body" color="secondary">
            If that email is registered, a reset link is on its way.
          </Text>
        </View>
        <Button variant="secondary" size="lg" onPress={() => router.replace('/login')}>
          Back to sign in
        </Button>
      </Screen>
    );
  }

  return (
    <Screen scroll keyboardAvoiding contentClassName="gap-8 px-6 pt-2">
      <ScreenHeader />

      <View className="gap-2">
        <Text variant="h1">Forgot password?</Text>
        <Text variant="body" color="secondary">
          Enter the email on your account and we&apos;ll send a reset link.
        </Text>
      </View>

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Email"
            placeholder="you@example.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            leftIcon={<Mail size={18} color={colors.text.muted} />}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.email?.message}
          />
        )}
      />

      <Button size="lg" loading={mutation.isPending} onPress={handleSubmit((v) => mutation.mutate(v))}>
        Send Reset Link
      </Button>
    </Screen>
  );
}
