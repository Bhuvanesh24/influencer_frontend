import type { ReactNode } from 'react';
import { Pressable, View, type PressableProps, type ViewProps } from 'react-native';

import { cn } from '@/lib/cn';

const baseClasses = 'rounded-md border border-border bg-surface p-4';

interface CardProps extends ViewProps {
  children: ReactNode;
}

/** Static container — the shared visual base every domain card (Deal/Package/Creator/…) builds on. */
export function Card({ children, className, ...props }: CardProps) {
  return (
    <View className={cn(baseClasses, className)} {...props}>
      {children}
    </View>
  );
}

interface PressableCardProps extends PressableProps {
  children: ReactNode;
}

/** Same base, but tappable with a press-state feedback — for list rows that navigate on tap. */
export function PressableCard({ children, className, ...props }: PressableCardProps) {
  return (
    <Pressable
      className={cn(baseClasses, 'active:bg-base', className)}
      accessibilityRole="button"
      {...props}
    >
      {children}
    </Pressable>
  );
}
