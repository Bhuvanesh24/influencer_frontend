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
  className,
  contentClassName,
  ...props
}: ScreenProps) {
  const content = scroll ? (
    <ScrollView
      className={cn('flex-1', className)}
      contentContainerClassName={cn('flex-grow px-4 pb-8', contentClassName)}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View className={cn('flex-1 px-4', className, contentClassName)} {...props}>
      {children}
    </View>
  );

  const body = keyboardAvoiding ? (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
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
