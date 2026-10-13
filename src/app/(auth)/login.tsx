import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Image } from 'expo-image';
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
import { IS_MOCK_API } from '@/lib/api/mock-mode';
import { useAuthStore } from '@/lib/auth/store';
import { getPostAuthRoute } from '@/lib/auth/route-after-auth';
import { toast } from '@/lib/toast';
import { loginSchema, type LoginInput } from '@/lib/validation/auth';

/** One screen for both signing in and signing up — the backend decides which from the email. */
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
    onSuccess: async (session) => {
      setSession(session);
      router.replace(await getPostAuthRoute(session.user));
    },
    onError: (error) => {
      toast.error('Could not sign in', getApiErrorMessage(error, 'Check your details and try again.'));
    },
  });

  const submit = handleSubmit((v) => loginMutation.mutate(v));

  async function handleGoogleLogin() {
    setIsGoogleLoading(true);
    try {
      if (IS_MOCK_API) {
        // No real OAuth to redirect through yet — mock straight to a successful callback so the
        // button is still testable end to end. See lib/api/mock-mode.ts.
        const session = await authApi.googleCallback({ code: 'mock' });
        setSession(session);
        router.replace(await getPostAuthRoute(session.user));
        return;
      }

      const { url } = await authApi.getGoogleAuthUrl();
      const redirectUrl = Linking.createURL('google-callback');
      const result = await WebBrowser.openAuthSessionAsync(url, redirectUrl);

      if (result.type === 'success' && result.url) {
        const { queryParams } = Linking.parse(result.url);
        const code = queryParams?.code;
        if (typeof code === 'string') {
          const session = await authApi.googleCallback({ code });
          setSession(session);
          router.replace(await getPostAuthRoute(session.user));
        }
      }
    } catch (error) {
      toast.error('Google sign-in failed', getApiErrorMessage(error));
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <Screen scroll keyboardAvoiding contentClassName="justify-center gap-8 px-6 pt-10">
      <View className="gap-6">
        <Image
          source={require('../../../assets/images/splash-icon.png')}
          style={{ width: 48, height: 48 }}
          accessibilityLabel="FindCollab"
        />
        <View className="gap-2">
          <Text variant="display">Welcome to FindCollab</Text>
          <Text variant="body" color="secondary">
            Sign in, or enter your email to create an account.
          </Text>
        </View>
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
                returnKeyType="go"
                onSubmitEditing={() => submit()}
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

          <Pressable
            onPress={() => router.push('/forgot-password')}
            hitSlop={12}
            accessibilityRole="link"
            className="self-end py-1 active:opacity-60"
          >
            <Text variant="bodySm" weight="semibold" color="accent">
              Forgot password?
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="gap-4">
        <Button size="lg" loading={loginMutation.isPending} onPress={() => submit()}>
          Continue
        </Button>

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
      </View>
    </Screen>
  );
}
