import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { INTRO_VIGNETTES, type IntroVignetteKey } from '@/components/domain/intro/IntroVignettes';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/cn';
import { markWelcomeCarouselSeen } from '@/lib/local-flags';

const SLIDES: { vignette: IntroVignetteKey; eyebrow: string; title: string; body: string }[] = [
  {
    vignette: 'discover',
    eyebrow: 'Discover',
    title: 'Discover the right creators',
    body: 'Find creators who fit your brand by niche, language and audience size — no agencies in between.',
  },
  {
    vignette: 'partner',
    eyebrow: 'Partner',
    title: 'Build meaningful brand–creator partnerships',
    body: 'Agree on clear packages up front. Payment is held safely in escrow until the work is live.',
  },
  {
    vignette: 'grow',
    eyebrow: 'Grow',
    title: 'Grow through successful collaborations',
    body: 'Every completed collaboration builds your track record, and payment releases once the post is verified.',
  },
];

/**
 * First-run intro (prompt.md §6.1): three slides, shown before Login until the user finishes or
 * skips them. Reached only from the splash screen's routing — see `resolveInitialRoute`.
 */
export default function WelcomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const scrollRef = useRef<ScrollView>(null);
  const isFinishing = useRef(false);
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;

  function goTo(next: number) {
    scrollRef.current?.scrollTo({ x: next * width, animated: !reduceMotion });
    setIndex(next);
  }

  /** The only place the intro is marked complete — reached by Skip or Get Started, never by
   * simply opening or leaving the screen. */
  async function finish() {
    if (isFinishing.current) return;
    isFinishing.current = true;
    try {
      await markWelcomeCarouselSeen();
    } catch {
      // Storage failed: still let the user in. Worst case they see the intro once more.
    }
    router.replace('/login');
  }

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    if (next !== index && next >= 0 && next < SLIDES.length) setIndex(next);
  }

  // Android Back steps to the previous slide; on the first slide it falls through to the
  // system default (leaving the app), since nothing sits behind this screen.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (index === 0) return false;
      goTo(index - 1);
      return true;
    });
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, width, reduceMotion]);

  return (
    <Screen contentClassName="px-0">
      <View className="min-h-11 flex-row items-center justify-between px-6 pt-2">
        <View className="flex-row items-center gap-2">
          <Image
            source={require('../../../assets/images/splash-icon.png')}
            style={{ width: 28, height: 28 }}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <Text variant="h3">FindCollab</Text>
        </View>
        {/* Kept mounted (just hidden) on the last slide so the header never changes height. */}
        <Pressable
          onPress={finish}
          disabled={isLast}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Skip introduction"
          accessibilityElementsHidden={isLast}
          importantForAccessibility={isLast ? 'no-hide-descendants' : 'auto'}
          className={cn('px-1 py-2 active:opacity-60', isLast && 'opacity-0')}
        >
          <Text variant="body" weight="medium" color="secondary">
            Skip
          </Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={32}
        className="flex-1"
      >
        {SLIDES.map((slide, i) => {
          const Vignette = INTRO_VIGNETTES[slide.vignette];
          return (
            <View
              key={slide.eyebrow}
              style={{ width }}
              className="flex-1 px-6"
              accessible
              accessibilityLabel={`${slide.title}. ${slide.body}`}
              accessibilityElementsHidden={i !== index}
              importantForAccessibility={i === index ? 'yes' : 'no-hide-descendants'}
            >
              {/* The visual takes whatever height the copy leaves and clips rather than pushing
                  the headline off-screen on short devices or at large font sizes. */}
              <View className="flex-1 justify-center overflow-hidden py-6" pointerEvents="none">
                <Vignette />
              </View>
              <View className="gap-3 pb-8">
                <Text variant="caption" weight="semibold" color="accent" className="uppercase tracking-[1.2px]">
                  {`0${i + 1} · ${slide.eyebrow}`}
                </Text>
                <Text variant="display">{slide.title}</Text>
                <Text variant="body" color="secondary">
                  {slide.body}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View className="gap-6 px-6 pb-6">
        <View
          className="flex-row items-center gap-1.5"
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={`Slide ${index + 1} of ${SLIDES.length}`}
        >
          {SLIDES.map((slide, i) => (
            <View
              key={slide.eyebrow}
              className={cn('h-1.5 rounded-full', i === index ? 'w-6 bg-action' : 'w-1.5 bg-border')}
            />
          ))}
        </View>
        <Button size="lg" onPress={isLast ? finish : () => goTo(index + 1)}>
          {isLast ? 'Get Started' : 'Next'}
        </Button>
      </View>
    </Screen>
  );
}
