import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type ReactNode } from 'react';
import { BackHandler, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/hooks/use-app-theme';

export interface AppBottomSheetProps {
  children: ReactNode;
  snapPoints?: (string | number)[];
  onDismiss?: () => void;
  enableDynamicSizing?: boolean;
  /**
   * Set when the children include a `BottomSheetFlatList`/`BottomSheetScrollView`. Those must not
   * sit inside a `BottomSheetView` (the list can't scroll there), so this lays the children out
   * in a plain flex column instead. Requires `snapPoints`.
   */
  scrollable?: boolean;
}

export type AppBottomSheetRef = Pick<BottomSheetModal, 'present' | 'dismiss'>;

/**
 * Shared bottom-sheet shell — FilterSheet, ActionSheet, ConfirmSheet, and every create/edit
 * sheet in the spec should wrap this rather than configuring @gorhom/bottom-sheet directly.
 * Must render under a single app-wide `<BottomSheetModalProvider>` (see app/_layout.tsx).
 *
 * Handles for every sheet: home-indicator clearance, and Android's hardware back closing the
 * sheet instead of popping the screen underneath it.
 */
export const AppBottomSheet = forwardRef<AppBottomSheetRef, AppBottomSheetProps>(function AppBottomSheet(
  { children, snapPoints, onDismiss, enableDynamicSizing = snapPoints === undefined, scrollable = false },
  ref,
) {
  const { colors, colorScheme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const points = useMemo(() => snapPoints, [snapPoints]);
  const modalRef = useRef<BottomSheetModal>(null);
  const [isOpen, setIsOpen] = useState(false);
  const bottomPadding = Math.max(insets.bottom, 12) + 12;

  // Forwarded per call rather than handing out the instance: `key={colorScheme}` below remounts
  // the modal on a theme change, which would leave a captured instance stale.
  useImperativeHandle(
    ref,
    () => ({
      present: (data) => modalRef.current?.present(data),
      dismiss: (animationConfigs) => modalRef.current?.dismiss(animationConfigs),
    }),
    [],
  );

  useEffect(() => {
    if (!isOpen) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      modalRef.current?.dismiss();
      return true;
    });
    return () => subscription.remove();
  }, [isOpen]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={modalRef}
      snapPoints={points}
      enableDynamicSizing={enableDynamicSizing}
      onChange={(index) => setIsOpen(index >= 0)}
      onDismiss={() => {
        setIsOpen(false);
        onDismiss?.();
      }}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.bg.surfaceRaised }}
      handleIndicatorStyle={{ backgroundColor: colors.border.subtle, width: 40 }}
      key={colorScheme}
    >
      {scrollable ? (
        <View style={{ flex: 1, paddingBottom: bottomPadding }}>{children}</View>
      ) : (
        <BottomSheetView style={{ paddingBottom: bottomPadding }}>{children}</BottomSheetView>
      )}
    </BottomSheetModal>
  );
});
