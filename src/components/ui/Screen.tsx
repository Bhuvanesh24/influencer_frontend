import { useEffect, useRef, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View, type ViewProps } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { cn } from '@/lib/cn';

interface ScreenProps extends ViewProps {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  /** Wrap in KeyboardAvoidingView — turn on for any screen with a form near the bottom. */
  keyboardAvoiding?: boolean;
  contentClassName?: string;
  /** Scrolls back to the top whenever this value changes — for one screen that swaps its body
   * in place (a wizard's steps), so a new step never opens part-way down the previous one. */
  scrollResetKey?: string | number;
}

/**
 * Base screen wrapper: safe-area insets + `bg-base` background + consistent side gutters.
 * Every screen should render inside this instead of a bare `View`. The background is always
 * the flat `bg-base` — no decorative washes or orbs behind content. Content is never wrapped in
 * an entrance animation: it paints with the first frame, and the native stack transition is the
 * only motion between screens.
 */
export function Screen({
  children,
  scroll = false,
  edges = ['top', 'bottom'],
  keyboardAvoiding = false,
  scrollResetKey,
  className,
  contentClassName,
  ...props
}: ScreenProps) {
  // iOS: ScrollView's own keyboard-inset handling (not KeyboardAvoidingView) — KeyboardAvoidingView
  // measures its ancestor's position in the window to compute padding, and that measurement can
  // come back stale while the screen is mid-transition, under-reserving space and leaving content
  // unreachable by scroll. The ScrollView-native inset approach doesn't depend on ancestor
  // measurement, so it isn't affected.
  // Android already resizes the window natively on keyboard open, so it needs no extra handling.
  const scrollRef = useRef<ScrollView>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [scrollResetKey]);

  const content = scroll ? (
    <ScrollView
      ref={scrollRef}
      className={cn('flex-1', className)}
      contentContainerClassName={cn('flex-grow px-6 pb-8', contentClassName)}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
      automaticallyAdjustKeyboardInsets={keyboardAvoiding}
      contentInsetAdjustmentBehavior={keyboardAvoiding ? 'automatic' : undefined}
    >
      {children}
    </ScrollView>
  ) : (
    <View className={cn('flex-1 px-6', className, contentClassName)} {...props}>
      {children}
    </View>
  );

  const body =
    keyboardAvoiding && !scroll ? (
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {content}
      </KeyboardAvoidingView>
    ) : (
      content
    );

  return (
    <SafeAreaView edges={edges} className="flex-1 bg-base">
      {body}
    </SafeAreaView>
  );
}
