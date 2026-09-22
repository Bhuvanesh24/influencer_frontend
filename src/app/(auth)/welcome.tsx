import { useRouter } from 'expo-router';
import { Handshake, Search, ShieldCheck } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Dimensions, Pressable, ScrollView, View, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { cn } from '@/lib/cn';
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
    setIndex(next);
  }

  return (
    <View className="flex-1 bg-base">
      <View className="flex-row justify-end px-4 pt-14">
        <Pressable onPress={finish} hitSlop={8} accessibilityRole="button" accessibilityLabel="Skip introduction">
          <Text variant="bodySm" weight="medium" color="secondary">
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
          <View key={i} style={{ width: SCREEN_WIDTH }} className="flex-1 items-center justify-center gap-6 px-10">
            <View className="rounded-full bg-brand/10 p-6">
              <slide.icon size={40} color={colors.brand.primary} />
            </View>
            <Text variant="h1" weight="bold" className="text-center">
              {slide.title}
            </Text>
            <Text variant="body" color="secondary" className="text-center">
              {slide.subtitle}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View className="gap-6 px-8 pb-10">
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
    </View>
  );
}
