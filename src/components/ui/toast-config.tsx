import { AlertCircle, CheckCircle2, Info } from 'lucide-react-native';
import { View } from 'react-native';
import type { ToastConfig, ToastConfigParams } from 'react-native-toast-message';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';

interface ToastProps {
  text1?: string;
  text2?: string;
  onRetry?: () => void;
}

function ToastCard({
  variant,
  props,
}: {
  variant: 'success' | 'error' | 'info';
  props: ToastConfigParams<ToastProps>;
}) {
  const { colors } = useAppTheme();
  const { text1, text2 } = props;
  const onRetry = (props.props as ToastProps | undefined)?.onRetry;

  const Icon = variant === 'success' ? CheckCircle2 : variant === 'error' ? AlertCircle : Info;
  const iconColor =
    variant === 'success' ? colors.money.positive : variant === 'error' ? colors.status.danger : colors.status.info;

  return (
    <View className="mx-4 w-[92%] flex-row items-start gap-3 rounded-md border border-border bg-surface-raised p-4 shadow-sm">
      <Icon size={20} color={iconColor} style={{ marginTop: 1 }} />
      <View className="flex-1 gap-0.5">
        {text1 && (
          <Text variant="bodySm" weight="semibold">
            {text1}
          </Text>
        )}
        {text2 && (
          <Text variant="caption" color="secondary">
            {text2}
          </Text>
        )}
        {onRetry && (
          <Button variant="ghost" size="sm" fullWidth={false} onPress={onRetry} className="mt-1 self-start px-0">
            Retry
          </Button>
        )}
      </View>
    </View>
  );
}

export const toastConfig: ToastConfig = {
  success: (props) => <ToastCard variant="success" props={props} />,
  error: (props) => <ToastCard variant="error" props={props} />,
  info: (props) => <ToastCard variant="info" props={props} />,
};
