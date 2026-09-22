import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Lock } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordChecklist } from '@/components/ui/PasswordChecklist';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import * as authApi from '@/lib/api/auth';
import { getApiErrorMessage } from '@/lib/api/client';
import { toast } from '@/lib/toast';
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validation/auth';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const mutation = useMutation({
    mutationFn: (input: ResetPasswordInput) =>
      authApi.resetPassword({ token: token ?? '', password: input.password }),
    onSuccess: () => {
      toast.success('Password updated', 'Please log in with your new password.');
      router.replace('/login');
    },
    onError: (error) => {
      toast.error('Could not reset password', getApiErrorMessage(error));
    },
  });

  if (!token) {
    return (
      <Screen contentClassName="flex-1 items-center justify-center gap-3 px-6">
        <Text variant="h2" weight="bold" className="text-center">
          This link has expired
        </Text>
        <Text variant="body" color="secondary" className="text-center">
          Request a new password reset link to continue.
        </Text>
        <Button variant="secondary" onPress={() => router.replace('/forgot-password')} className="mt-2">
          Request New Link
        </Button>
      </Screen>
    );
  }

  return (
    <Screen scroll keyboardAvoiding contentClassName="justify-center gap-6 pt-16">
      <View className="gap-1">
        <Text variant="h1" weight="bold">
          Set a new password
        </Text>
        <Text variant="body" color="secondary">
          Choose a strong password you haven&apos;t used before.
        </Text>
      </View>

      <View className="gap-2">
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="New password"
              placeholder="••••••••"
              secureTextEntry
              autoCapitalize="none"
              leftIcon={<Lock size={18} color={colors.text.muted} />}
              value={value}
              onChangeText={onChange}
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => {
                setIsPasswordFocused(false);
                onBlur();
              }}
              error={errors.password?.message}
            />
          )}
        />
        {isPasswordFocused && <PasswordChecklist value={watch('password')} />}
      </View>

      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Confirm new password"
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
            leftIcon={<Lock size={18} color={colors.text.muted} />}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.confirmPassword?.message}
          />
        )}
      />

      <Button size="lg" loading={mutation.isPending} onPress={handleSubmit((v) => mutation.mutate(v))}>
        Reset Password
      </Button>
    </Screen>
  );
}
