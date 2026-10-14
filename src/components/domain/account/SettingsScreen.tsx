import Constants from 'expo-constants';
import { useRouter, type Href } from 'expo-router';
import { BarChart3, Bell, Building2, KeyRound, Landmark, Mail, Receipt, UserRound } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Switch, View } from 'react-native';

import { AccountSection } from '@/components/domain/account/AccountSection';
import { ListGroup, ListRow } from '@/components/ui/ListGroup';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { AccountType } from '@/lib/auth/types';
import { useAuthStore } from '@/lib/auth/store';
import { getPushPreference, setPushPreference } from '@/lib/local-flags';

/**
 * Settings (prompt.md §6.3): account, payments, notifications, log out. Appearance is not offered
 * — the app is light-only by design (CLAUDE.md) — and Support/Legal wait for real URLs.
 */
export function SettingsScreen({ viewer }: { viewer: AccountType }) {
  const router = useRouter();
  const { colors } = useAppTheme();
  const email = useAuthStore((s) => s.user?.email);
  const [push, setPush] = useState(true);
  useEffect(() => {
    getPushPreference().then(setPush);
  }, []);

  const go = (href: string) => router.push(href as Href);

  return (
    <Screen scroll contentClassName="gap-8 pb-10 pt-2">
      <ScreenHeader title="Settings" />

      <ListGroup title="Account">
        <ListRow icon={Mail} title="Email" subtitle={email ?? '—'} />
        {viewer === 'creator' ? (
          <ListRow icon={UserRound} title="Profile" subtitle="The seven setup steps and your packages" onPress={() => go('/creator/profile')} />
        ) : (
          <ListRow icon={Building2} title="Company profile" onPress={() => go('/brand/profile')} />
        )}
        <ListRow icon={KeyRound} title="Change password" onPress={() => go(`/${viewer}/change-password`)} />
      </ListGroup>

      <ListGroup title="Payments">
        {viewer === 'creator' ? (
          <ListRow icon={Landmark} title="Payout accounts" onPress={() => go('/creator/payout-accounts')} />
        ) : (
          <>
            <ListRow icon={Receipt} title="Billing" onPress={() => go('/brand/billing')} />
            <ListRow icon={BarChart3} title="Analytics" onPress={() => go('/brand/analytics')} />
          </>
        )}
      </ListGroup>

      <ListGroup title="Notifications" footer="Push notifications arrive once the app is connected to the server; this saves your choice.">
        <ListRow
          icon={Bell}
          title="Push notifications"
          trailing={
            <Switch
              value={push}
              onValueChange={(v) => {
                setPush(v);
                setPushPreference(v);
              }}
              trackColor={{ true: colors.accent.primary }}
              accessibilityLabel="Push notifications"
            />
          }
        />
      </ListGroup>

      <AccountSection />

      <View className="items-center">
        <Text variant="caption" color="muted">
          FindCollab {Constants.expoConfig?.version ?? ''}
        </Text>
      </View>
    </Screen>
  );
}
