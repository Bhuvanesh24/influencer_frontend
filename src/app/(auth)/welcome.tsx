import { useRouter } from 'expo-router';
import { Handshake, Search, ShieldCheck } from 'lucide-react-native';
import { MotiView } from 'moti';
import { useRef, useState } from 'react';
import { Dimensions, Pressable, ScrollView, View, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';

import { Button } from '@/components/ui/Button';
import { HeroOrb } from '@/components/ui/HeroOrb';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { cn } from '@/lib/cn';
import { haptics } from '@/lib/haptics';
import { markWelcomeCarouselSeen } from '@/lib/local-flags';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  {
    icon: Search,
    title: 'Find real Indian creators — or brands',
    subtitle: 'No agencies, no endless WhatsApp threads. Just direct, verified connections.',
  },
  {
    icon: ShieldCheck,
    title: 'Money held safe in escrow',
    subtitle: 'Payment locks in before work starts, and stays protected until the post is live.',
  },
  {
    icon: Handshake,
    title: 'Get paid automatically once verified',
    subtitle: 'No chasing invoices — release is automatic the moment a post is confirmed.',
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;

  async function finish() {
    await markWelcomeCarouselSeen();
    router.replace('/login');
  }

  function onMomentumScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (next !== index) haptics.selection();
    setIndex(next);
  }

  return (
    <Screen backdrop={<HeroOrb />} contentClassName="px-0">
      <View className="flex-row justify-end px-5 pt-2">
        <Pressable
          onPress={finish}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Skip introduction"
          className="rounded-full bg-surface px-3.5 py-2"
        >
          <Text variant="bodySm" weight="semibold" color="secondary">
            Skip
          </Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        className="flex-1"
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={{ width: SCREEN_WIDTH }} className="flex-1 items-center justify-center gap-7 px-10">
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
              <slide.icon size={38} color="#FFFFFF" />
            </MotiView>
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 320, delay: 90 }}
              className="gap-3"
            >
              <Text variant="h1" weight="bold" className="text-center">
                {slide.title}
              </Text>
              <Text variant="body" color="secondary" className="text-center">
                {slide.subtitle}
              </Text>
            </MotiView>
          </View>
        ))}
      </ScrollView>

      <View className="gap-6 px-8 pb-6 pt-4">
        {isLast ? (
          <Button size="lg" onPress={finish}>
            Get Started
          </Button>
        ) : (
          <View className="flex-row justify-center gap-2">
            {SLIDES.map((_, i) => (
              <View
                key={i}
                className={cn('h-2 rounded-full', i === index ? 'w-6 bg-brand' : 'w-2 bg-border')}
              />
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}
