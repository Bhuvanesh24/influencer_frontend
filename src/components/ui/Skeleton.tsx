import { MotiView } from 'moti';
import { View } from 'react-native';

import { cn } from '@/lib/cn';

interface SkeletonBlockProps {
  className?: string;
  radius?: number;
}

/** A single pulsing placeholder block. Shown for first fetch only — never on refetch (prompt.md §3.4). */
export function SkeletonBlock({ className, radius = 8 }: SkeletonBlockProps) {
  return (
    <MotiView
      className={cn('bg-border', className)}
      style={{ borderRadius: radius }}
      from={{ opacity: 0.4 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 700, loop: true, repeatReverse: true }}
    />
  );
}

export function SkeletonListRow() {
  return (
    <View className="flex-row items-center gap-3 border-b border-border px-4 py-3">
      <SkeletonBlock className="h-11 w-11" radius={999} />
      <View className="flex-1 gap-2">
        <SkeletonBlock className="h-3.5 w-1/2" />
        <SkeletonBlock className="h-3 w-1/3" />
      </View>
      <SkeletonBlock className="h-5 w-14" />
    </View>
  );
}

export function SkeletonCardGrid({ count = 6 }: { count?: number }) {
  return (
    <View className="flex-row flex-wrap gap-3 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} className="w-[47%] gap-2 rounded-md border border-border p-3">
          <SkeletonBlock className="h-28 w-full" radius={12} />
          <SkeletonBlock className="h-3 w-3/4" />
          <SkeletonBlock className="h-3 w-1/2" />
        </View>
      ))}
    </View>
  );
}

export function SkeletonDetailPage() {
  return (
    <View className="gap-4 p-4">
      <SkeletonBlock className="h-40 w-full" radius={16} />
      <SkeletonBlock className="h-5 w-2/3" />
      <SkeletonBlock className="h-3 w-1/3" />
      <View className="gap-2">
        <SkeletonBlock className="h-3 w-full" />
        <SkeletonBlock className="h-3 w-full" />
        <SkeletonBlock className="h-3 w-2/3" />
      </View>
    </View>
  );
}
