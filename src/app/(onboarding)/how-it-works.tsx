import { useRouter, type Href } from 'expo-router';
import { MessageCircleHeart, Search, ShieldCheck, Sparkles, ThumbsUp } from 'lucide-react-native';
import { MotiView } from 'moti';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { HeroOrb } from '@/components/ui/HeroOrb';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useAuthStore } from '@/lib/auth/store';
import { markHowItWorksSeen } from '@/lib/local-flags';

const BRAND_STEPS = [
  { icon: Search, title: 'Find & brief', subtitle: 'Discover creators or launch a campaign, then send a clear brief.' },
  { icon: ShieldCheck, title: 'Chat & escrow', subtitle: 'Payment locks safely in escrow before any work starts.' },
  { icon: ThumbsUp, title: 'Review & release', subtitle: 'Approve the delivered post and payment releases automatically.' },
];

export default function HowItWorksScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const accountType = useAuthStore((s) => s.user?.accountType);

  async function finish(destination: Href) {
    await markHowItWorksSeen();
    router.replace(destination);
  }

  if (accountType === 'brand') {
    return (
      <Screen scroll backdrop={<HeroOrb />} contentClassName="justify-center gap-8 pt-10">
        <View className="gap-1">
          <Text variant="h1" weight="bold">
            How FindCollab works
          </Text>
        </View>

        <View className="gap-4">
          {BRAND_STEPS.map((step, i) => (
            <MotiView
              key={step.title}
              from={{ opacity: 0, translateX: 16 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'timing', duration: 300, delay: i * 110 }}
              className="flex-row items-start gap-4 rounded-xl border border-border bg-surface p-4"
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-brand">
                <Text weight="bold" color="inverse">
                  {i + 1}
                </Text>
              </View>
              <View className="flex-1 gap-0.5">
                <View className="flex-row items-center gap-2">
                  <step.icon size={16} color={colors.brand.primary} />
                  <Text variant="h3" weight="semibold">
                    {step.title}
                  </Text>
                </View>
                <Text variant="bodySm" color="secondary">
                  {step.subtitle}
                </Text>
              </View>
            </MotiView>
          ))}
        </View>

        {/* Brand Discover tab ships in Phase 3 — see SPRINTS.md 3.1. */}
        <Button size="lg" onPress={() => finish('/coming-soon')}>
          Start Discovering
        </Button>
      </Screen>
    );
  }

  return (
    <Screen backdrop={<HeroOrb variant="centered" />} contentClassName="flex-1 items-center justify-center gap-4 px-8">
      <MotiView
        from={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 13, mass: 0.7 }}
        className="h-24 w-24 items-center justify-center rounded-[28px] bg-brand"
        style={{
          shadowColor: colors.brand.primary,
          shadowOpacity: 0.35,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 10 },
          elevation: 8,
        }}
      >
        <Sparkles size={38} color="#FFFFFF" />
      </MotiView>
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 320, delay: 100 }}
        className="items-center gap-2"
      >
        <Text variant="h1" weight="bold" className="text-center">
          You&apos;re in!
        </Text>
        <Text variant="body" color="secondary" className="text-center">
          Let&apos;s get your profile ready so brands can find you.
        </Text>
      </MotiView>

      <View className="mt-4 w-full gap-3">
        <Button
          size="lg"
          onPress={() => finish('/(onboarding)/creator-wizard')}
          leftIcon={<MessageCircleHeart size={18} color="#FFFFFF" />}
        >
          Set Up My Profile
        </Button>
        {/* Creator Home ships in Phase 2 — see SPRINTS.md. */}
        <Button variant="ghost" onPress={() => finish('/coming-soon')}>
          Skip for now
        </Button>
      </View>
    </Screen>
  );
}
