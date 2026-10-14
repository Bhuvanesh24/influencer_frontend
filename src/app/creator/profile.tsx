import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useRouter } from 'expo-router';
import { BadgeCheck, Check, CircleAlert, Eye, Landmark, Package, Settings } from 'lucide-react-native';
import { View } from 'react-native';

import { AccountSection } from '@/components/domain/account/AccountSection';
import { Avatar } from '@/components/ui/Avatar';
import { TrustBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListGroup, ListRow } from '@/components/ui/ListGroup';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SkeletonBlock } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useRefetchOnFocus } from '@/hooks/use-refetch-on-focus';
import { getApiErrorMessage } from '@/lib/api/client';
import {
  getLatestStatsSubmission,
  getMyCreatorProfile,
  listMyPackages,
  type CreatorPackage,
  type CreatorProfile,
} from '@/lib/api/creator';
import { useCreatorWizardStore } from '@/lib/auth/creator-wizard-store';
import { CREATOR_PACKAGES_QUERY_KEY, CREATOR_PROFILE_QUERY_KEY, CREATOR_STATS_QUERY_KEY } from '@/lib/query-keys';
import { SETUP_STEPS, setupProgress, setupStepDone, type SetupStep } from '@/lib/profile-setup';

/**
 * The creator's own profile (reached by tapping the avatar on Home): who they are, how complete
 * the profile is, and the seven setup steps — each opens that step of the setup wizard,
 * pre-filled, to edit it. Packages and account actions live here too.
 */
export default function CreatorProfileScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();

  const profileQuery = useQuery({ queryKey: CREATOR_PROFILE_QUERY_KEY, queryFn: getMyCreatorProfile });
  const packagesQuery = useQuery({ queryKey: CREATOR_PACKAGES_QUERY_KEY, queryFn: listMyPackages });
  useRefetchOnFocus(profileQuery.refetch);
  useRefetchOnFocus(packagesQuery.refetch);
  const statsQuery = useQuery({ queryKey: CREATOR_STATS_QUERY_KEY, queryFn: getLatestStatsSubmission });
  useRefetchOnFocus(statsQuery.refetch);

  const profile = profileQuery.data;
  const packages = packagesQuery.data ?? [];
  const activeCount = packages.filter((p) => p.isActive).length;

  function openWizard(step: SetupStep, mode: 'edit' | 'resume', p: CreatorProfile, pkgs: CreatorPackage[]) {
    const wizard = useCreatorWizardStore.getState();
    wizard.hydrate(p, pkgs);
    wizard.setStep(step);
    router.push({ pathname: '/(onboarding)/creator-wizard', params: { mode } });
  }

  if (profileQuery.isPending || packagesQuery.isPending) {
    return (
      <Screen contentClassName="gap-6 pt-2">
        <ScreenHeader />
        <View className="flex-row items-center gap-4">
          <SkeletonBlock className="h-16 w-16" radius={32} />
          <View className="flex-1 gap-2">
            <SkeletonBlock className="h-6 w-2/3" />
            <SkeletonBlock className="h-4 w-1/2" />
          </View>
        </View>
        <SkeletonBlock className="h-28 w-full" radius={12} />
        <SkeletonBlock className="h-64 w-full" radius={12} />
      </Screen>
    );
  }

  if (profileQuery.isError || !profile) {
    return (
      <Screen contentClassName="gap-6 pt-2">
        <ScreenHeader />
        <EmptyState
          icon={CircleAlert}
          title="Couldn't load your profile"
          description={getApiErrorMessage(profileQuery.error, 'Check your connection and try again.')}
          actionLabel="Try again"
          onAction={() => profileQuery.refetch()}
        />
      </Screen>
    );
  }

  const progress = setupProgress(profile, activeCount);
  const name = profile.displayName?.trim() || 'Creator';
  const location = [profile.city, profile.state].filter(Boolean).join(', ');

  return (
    <Screen scroll contentClassName="gap-8 pb-10 pt-2">
      <ScreenHeader title="Your profile" />

      <View className="flex-row items-center gap-4">
        <Avatar name={name} uri={profile.profilePhotoUrl} size="lg" />
        <View className="flex-1 gap-1">
          <Text variant="h2" numberOfLines={1}>
            {name}
          </Text>
          <Text variant="bodySm" color="secondary" numberOfLines={1}>
            {[profile.creatorTitle, location].filter(Boolean).join(' · ') || 'No title or location yet'}
          </Text>
          <View className="flex-row">
            <TrustBadge score={profile.trustScore} size="sm" />
          </View>
        </View>
      </View>

      <View className="gap-3 rounded-md border border-border bg-surface p-4">
        <View className="flex-row items-baseline justify-between">
          <Text variant="body" weight="semibold">
            {progress.percent === 100 ? 'Profile complete' : `Profile ${progress.percent}% complete`}
          </Text>
          <Text variant="caption" color="secondary">
            {progress.doneCount} of {SETUP_STEPS.length} steps
          </Text>
        </View>
        <View className="h-2 overflow-hidden rounded-full bg-border">
          <View className="h-full rounded-full bg-accent" style={{ width: `${progress.percent}%` }} />
        </View>
        {progress.firstMissingStep !== null ? (
          <>
            <Text variant="bodySm" color="secondary">
              Brands see whatever you have filled in. Finish the rest to show up in more searches.
            </Text>
            <Button
              size="md"
              onPress={() => openWizard(progress.firstMissingStep!, 'resume', profile, packages)}
            >
              Continue setup
            </Button>
          </>
        ) : (
          <Text variant="bodySm" color="secondary">
            Brands see your full profile. Tap any step below to change it.
          </Text>
        )}
      </View>

      <ListGroup title="Profile setup">
        {SETUP_STEPS.map((s) => {
          const done = setupStepDone(s.step, profile, activeCount);
          return (
            <ListRow
              key={s.step}
              title={`${s.step}. ${s.title}`}
              subtitle={s.subtitle}
              accessibilityLabel={`${s.title}. ${done ? 'Done' : 'Not added yet'}`}
              trailing={
                done ? (
                  <Check size={18} strokeWidth={2.5} color={colors.accent.primary} />
                ) : (
                  <Text variant="caption" weight="semibold" color="accent">
                    Add
                  </Text>
                )
              }
              onPress={() =>
                s.step === 7 ? router.push('/creator/packages') : openWizard(s.step, 'edit', profile, packages)
              }
            />
          );
        })}
      </ListGroup>

      <ListGroup title="Packages">
        <ListRow
          icon={Package}
          title="Your packages"
          subtitle={
            packages.length === 0
              ? 'None yet — brands can’t book you until you add one'
              : `${activeCount} active${packages.length > activeCount ? `, ${packages.length - activeCount} hidden` : ''}`
          }
          onPress={() => router.push('/creator/packages')}
        />
      </ListGroup>

      <ListGroup title="Money">
        <ListRow icon={Landmark} title="Payout accounts" subtitle="Where your payments go" onPress={() => router.push('/creator/payout-accounts')} />
      </ListGroup>

      <ListGroup title="Public profile">
        <ListRow
          icon={Eye}
          title="Preview as brands see it"
          subtitle="Your profile, packages and reviews in Discover"
          onPress={() => router.push('/creator/preview')}
        />
      </ListGroup>

      <ListGroup title="Credibility">
        <ListRow
          icon={BadgeCheck}
          title="Boost your credibility"
          subtitle={
            statsQuery.data?.verificationStatus === 'verified'
              ? `Numbers verified ${dayjs(statsQuery.data.reviewedAt ?? statsQuery.data.submittedAt).format('D MMM YYYY')}`
              : statsQuery.data?.verificationStatus === 'pending'
                ? 'Your numbers are being checked'
                : 'Optional — get your audience numbers verified'
          }
          onPress={() => router.push('/creator/stats')}
        />
      </ListGroup>

      <ListGroup title="App">
        <ListRow icon={Settings} title="Settings" subtitle="Password, notifications and more" onPress={() => router.push('/creator/settings')} />
      </ListGroup>

      <AccountSection />
    </Screen>
  );
}
