import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { CheckCircle2, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
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
      <Screen contentClassName="flex-1 items-center justify-center gap-4 px-6">
        <View className="rounded-full bg-money-positive/10 p-4">
          <CheckCircle2 size={32} color={colors.money.positive} />
        </View>
        <Text variant="h2" weight="bold" className="text-center">
          Check your email
        </Text>
        <Text variant="body" color="secondary" className="text-center">
          If that email is registered, a reset link is on its way.
        </Text>
        <Button variant="secondary" onPress={() => router.replace('/login')} className="mt-4">
          Back to Login
        </Button>
      </Screen>
    );
  }

  return (
    <Screen scroll keyboardAvoiding contentClassName="justify-center gap-6 pt-16">
      <View className="gap-1">
        <Text variant="h1" weight="bold">
          Forgot password?
        </Text>
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
