import { useRouter, type Href } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { IconBadge } from '@/components/ui/IconBadge';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useAuthStore } from '@/lib/auth/store';
import { cn } from '@/lib/cn';
import { markHowItWorksSeen } from '@/lib/local-flags';

const BRAND_STEPS = [
  { title: 'Find & brief', subtitle: 'Discover creators or launch a campaign, then send a clear brief.' },
  { title: 'Chat & escrow', subtitle: 'Payment locks safely in escrow before any work starts.' },
  { title: 'Review & release', subtitle: 'Approve the delivered post and payment releases automatically.' },
];

export default function HowItWorksScreen() {
  const router = useRouter();
  const accountType = useAuthStore((s) => s.user?.accountType);

  async function finish(destination: Href) {
    await markHowItWorksSeen();
    router.replace(destination);
  }

  if (accountType === 'brand') {
    return (
      <Screen scroll contentClassName="justify-center gap-10 px-6 pt-10">
        <View className="gap-2">
          <Text variant="h1">How FindCollab works</Text>
          <Text variant="body" color="secondary">
            Three steps, with your money protected throughout.
          </Text>
        </View>

        <View>
          {BRAND_STEPS.map((step, i) => (
            <View key={step.title} className={cn('flex-row gap-4 py-5', i > 0 && 'border-t border-border')}>
              <Text variant="h3" color="accent" className="w-8">
                {`0${i + 1}`}
              </Text>
              <View className="flex-1 gap-1">
                <Text variant="h3">{step.title}</Text>
                <Text variant="body" color="secondary">
                  {step.subtitle}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <Button size="lg" onPress={() => finish('/brand/home')}>
          Go to Dashboard
        </Button>
      </Screen>
    );
  }

  return (
    <Screen contentClassName="justify-center gap-8 px-6">
      <IconBadge icon={Sparkles} />
      <View className="gap-2">
        <Text variant="display">You&apos;re in</Text>
        <Text variant="body" color="secondary">
          Let&apos;s get your profile ready so brands can find you.
        </Text>
      </View>

      <View className="gap-2">
        <Button size="lg" onPress={() => finish('/(onboarding)/creator-wizard')}>
          Set Up My Profile
        </Button>
        <Button variant="ghost" onPress={() => finish('/creator/home')}>
          Skip for now
        </Button>
      </View>
    </Screen>
  );
}
