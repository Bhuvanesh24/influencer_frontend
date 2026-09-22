import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Lock, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { GoogleIcon } from '@/components/ui/GoogleIcon';
import { Input } from '@/components/ui/Input';
import { PasswordChecklist } from '@/components/ui/PasswordChecklist';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import * as authApi from '@/lib/api/auth';
import { getApiErrorMessage } from '@/lib/api/client';
import { useAuthStore } from '@/lib/auth/store';
import { toast } from '@/lib/toast';
import { loginSchema, type LoginInput } from '@/lib/validation/auth';

export default function LoginScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const setSession = useAuthStore((s) => s.setSession);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (session) => {
      setSession(session);
      routeAfterAuth(session.user.accountType);
    },
    onError: (error) => {
      toast.error('Could not sign in', getApiErrorMessage(error, 'Check your details and try again.'));
    },
  });

  function routeAfterAuth(accountType: string | null) {
    if (accountType === null) {
      // Role Selection ships in Sprint 1.2 — see SPRINTS.md.
      router.replace('/coming-soon');
    } else {
      // Role tab groups ship in Phase 2/3.
      router.replace('/coming-soon');
    }
  }

  async function handleGoogleLogin() {
    setIsGoogleLoading(true);
    try {
      const { url } = await authApi.getGoogleAuthUrl();
      const redirectUrl = Linking.createURL('google-callback');
      const result = await WebBrowser.openAuthSessionAsync(url, redirectUrl);

      if (result.type === 'success' && result.url) {
        const { queryParams } = Linking.parse(result.url);
        const code = queryParams?.code;
        if (typeof code === 'string') {
          const session = await authApi.googleCallback({ code });
          setSession(session);
          routeAfterAuth(session.user.accountType);
        }
      }
    } catch (error) {
      toast.error('Google sign-in failed', getApiErrorMessage(error));
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <Screen scroll keyboardAvoiding contentClassName="justify-center gap-6 pt-16">
      <View className="gap-1">
        <Text variant="display" weight="bold">
          Welcome
        </Text>
        <Text variant="body" color="secondary">
          Enter your email and password to continue.
        </Text>
      </View>

      <View className="gap-4">
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

        <View className="gap-2">
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Password"
                placeholder="••••••••"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
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

          <Pressable onPress={() => router.push('/forgot-password')} hitSlop={8} className="self-end">
            <Text variant="bodySm" weight="medium" color="brand">
              Forgot password?
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="gap-3">
        <Button size="lg" loading={loginMutation.isPending} onPress={handleSubmit((v) => loginMutation.mutate(v))}>
          Continue
        </Button>
        <Text variant="caption" color="muted" className="text-center">
          New here? Just enter your details — we&apos;ll set you up.
        </Text>
      </View>

      <View className="flex-row items-center gap-3">
        <View className="h-px flex-1 bg-border" />
        <Text variant="caption" color="muted">
          or
        </Text>
        <View className="h-px flex-1 bg-border" />
      </View>

      <Button
        variant="secondary"
        size="lg"
        loading={isGoogleLoading}
        onPress={handleGoogleLogin}
        leftIcon={<GoogleIcon />}
      >
        Continue with Google
      </Button>
    </Screen>
  );
}
