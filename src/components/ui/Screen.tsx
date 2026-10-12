import { MotiView } from 'moti';
import type { ReactNode } from 'react';
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
  /** Subtle fade + rise on mount. On by default — set false for screens that re-mount often
   * (e.g. swapped mid-flow) where a repeated animation would feel like flicker. */
  animated?: boolean;
  /** Decorative backdrop (e.g. `<HeroOrb />`) rendered fixed behind all content, outside the
   * scroll view so it never scrolls away with the content. */
  backdrop?: ReactNode;
}

/**
 * Base screen wrapper: safe-area insets + `bg-base` background + consistent side gutters.
 * Every screen should render inside this instead of a bare `View` (prompt.md's fintech-clean
 * tone assumes generous, consistent whitespace).
 */
export function Screen({
  children,
  scroll = false,
  edges = ['top', 'bottom'],
  keyboardAvoiding = false,
  animated = true,
  backdrop,
  className,
  contentClassName,
  ...props
}: ScreenProps) {
  // iOS: ScrollView's own keyboard-inset handling (not KeyboardAvoidingView) — KeyboardAvoidingView
  // measures its ancestor's position in the window to compute padding, and that measurement can
  // come back stale while it's nested inside Screen's entrance-animation MotiView (which moves via
  // a transform on mount), under-reserving space and leaving content unreachable by scroll. The
  // ScrollView-native inset approach doesn't depend on ancestor measurement, so it isn't affected.
  // Android already resizes the window natively on keyboard open, so it needs no extra handling.
  const content = scroll ? (
    <ScrollView
      className={cn('flex-1', className)}
      contentContainerClassName={cn('flex-grow px-4 pb-8', contentClassName)}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
      automaticallyAdjustKeyboardInsets={keyboardAvoiding}
      contentInsetAdjustmentBehavior={keyboardAvoiding ? 'automatic' : undefined}
    >
      {children}
    </ScrollView>
  ) : (
    <View className={cn('flex-1 px-4', className, contentClassName)} {...props}>
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
      {backdrop}
      {animated ? (
        <MotiView
          style={{ flex: 1 }}
          from={{ opacity: 0, translateY: 6 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 240 }}
        >
          {body}
        </MotiView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}
