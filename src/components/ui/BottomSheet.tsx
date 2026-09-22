import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { forwardRef, useCallback, useMemo, type ReactNode } from 'react';

import { useAppTheme } from '@/hooks/use-app-theme';

export interface AppBottomSheetProps {
  children: ReactNode;
  snapPoints?: (string | number)[];
  onDismiss?: () => void;
  enableDynamicSizing?: boolean;
}

export type AppBottomSheetRef = BottomSheetModal;

/**
 * Shared bottom-sheet shell — FilterSheet, ActionSheet, ConfirmSheet, and every create/edit
 * sheet in the spec should wrap this rather than configuring @gorhom/bottom-sheet directly.
 * Must render under a single app-wide `<BottomSheetModalProvider>` (see app/_layout.tsx).
 */
export const AppBottomSheet = forwardRef<AppBottomSheetRef, AppBottomSheetProps>(function AppBottomSheet(
  { children, snapPoints, onDismiss, enableDynamicSizing = snapPoints === undefined },
  ref,
) {
  const { colors, colorScheme } = useAppTheme();
  const points = useMemo(() => snapPoints, [snapPoints]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={points}
      enableDynamicSizing={enableDynamicSizing}
      onDismiss={onDismiss}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.bg.surfaceRaised }}
      handleIndicatorStyle={{ backgroundColor: colors.border.subtle, width: 40 }}
      key={colorScheme}
    >
      <BottomSheetView style={{ paddingBottom: 24 }}>{children}</BottomSheetView>
    </BottomSheetModal>
  );
});
