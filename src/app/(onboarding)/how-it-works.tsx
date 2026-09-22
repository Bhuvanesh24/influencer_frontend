import { useRouter } from 'expo-router';
import { MessageCircleHeart, Search, ShieldCheck, Sparkles, ThumbsUp } from 'lucide-react-native';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
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

  async function finish(destination: '/coming-soon') {
    await markHowItWorksSeen();
    router.replace(destination);
  }

  if (accountType === 'brand') {
    return (
      <Screen scroll contentClassName="justify-center gap-8 pt-16">
        <View className="gap-1">
          <Text variant="h1" weight="bold">
            How InfluenceHub works
          </Text>
        </View>

        <View className="gap-4">
          {BRAND_STEPS.map((step, i) => (
            <View key={step.title} className="flex-row items-start gap-4 rounded-md border border-border p-4">
              <View className="items-center justify-center rounded-full bg-brand/10" style={{ width: 40, height: 40 }}>
                <step.icon size={20} color={colors.brand.primary} />
              </View>
              <View className="flex-1 gap-0.5">
                <Text variant="caption" color="muted">
                  Step {i + 1}
                </Text>
                <Text variant="h3" weight="semibold">
                  {step.title}
                </Text>
                <Text variant="bodySm" color="secondary">
                  {step.subtitle}
                </Text>
              </View>
            </View>
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
    <Screen contentClassName="flex-1 items-center justify-center gap-4 px-8">
      <View className="rounded-full bg-brand/10 p-5">
        <Sparkles size={32} color={colors.brand.primary} />
      </View>
      <Text variant="h1" weight="bold" className="text-center">
        You&apos;re in!
      </Text>
      <Text variant="body" color="secondary" className="text-center">
        Let&apos;s get your profile ready so brands can find you.
      </Text>

      <View className="mt-4 w-full gap-3">
        {/* Profile Setup Wizard ships in Sprint 1.3 — see SPRINTS.md. */}
        <Button size="lg" onPress={() => finish('/coming-soon')} leftIcon={<MessageCircleHeart size={18} color="#FFFFFF" />}>
          Set Up My Profile
        </Button>
        <Button variant="ghost" onPress={() => finish('/coming-soon')}>
          Skip for now
        </Button>
      </View>
    </Screen>
  );
}
