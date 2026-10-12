import Toast from 'react-native-toast-message';

import { haptics } from '@/lib/haptics';

export const toast = {
  success: (text1: string, text2?: string) => {
    haptics.success();
    Toast.show({ type: 'success', text1, text2 });
  },
  error: (text1: string, text2?: string, onRetry?: () => void) => {
    haptics.error();
    Toast.show({ type: 'error', text1, text2, props: { onRetry } });
  },
  info: (text1: string, text2?: string) => Toast.show({ type: 'info', text1, text2 }),
};
