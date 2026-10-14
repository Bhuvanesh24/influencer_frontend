import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordChecklist } from '@/components/ui/PasswordChecklist';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Text } from '@/components/ui/Text';
import { changePassword } from '@/lib/api/auth';
import { getApiErrorMessage } from '@/lib/api/client';
import { toast } from '@/lib/toast';
import { changePasswordSchema, type ChangePasswordInput } from '@/lib/validation/auth';

/** Change Password (prompt.md §6.3): same live checklist as Reset Password. */
export function ChangePasswordScreen() {
  const router = useRouter();
  const [focused, setFocused] = useState(false);
  const {
    control,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const save = useMutation({
    mutationFn: (v: ChangePasswordInput) => changePassword({ currentPassword: v.currentPassword, newPassword: v.newPassword }),
    onSuccess: () => {
      toast.success('Password changed');
      router.back();
    },
    onError: (e) => {
      const message = getApiErrorMessage(e);
      if (/current password/i.test(message)) setError('currentPassword', { message });
      else toast.error('Could not change the password', message);
    },
  });

  return (
    <Screen scroll keyboardAvoiding contentClassName="gap-8 pb-10 pt-2">
      <ScreenHeader />
      <Text variant="h1">Change password</Text>
      <View className="gap-6">
        <Controller
          control={control}
          name="currentPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Current password" secureTextEntry autoCapitalize="none" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.currentPassword?.message} />
          )}
        />
        <View className="gap-2">
          <Controller
            control={control}
            name="newPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="New password"
                secureTextEntry
                autoCapitalize="none"
                value={value}
                onChangeText={onChange}
                onFocus={() => setFocused(true)}
                onBlur={() => {
                  setFocused(false);
                  onBlur();
                }}
                error={errors.newPassword?.message}
              />
            )}
          />
          {focused && <PasswordChecklist value={watch('newPassword')} />}
        </View>
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Confirm new password" secureTextEntry autoCapitalize="none" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.confirmPassword?.message} />
          )}
        />
      </View>
      <Button size="lg" loading={save.isPending} onPress={handleSubmit((v) => save.mutate(v))}>
        Change password
      </Button>
    </Screen>
  );
}
