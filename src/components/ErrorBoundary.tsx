import { Component, type ReactNode } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Top-level catch-all so a render crash never shows a blank/frozen screen (prompt.md §5).
 * Screen-level errors (failed fetches, etc.) should still be handled locally — this is the
 * last-resort net for genuine bugs.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    if (__DEV__) {
      console.error('Unhandled render error:', error, info.componentStack);
    }
  }

  render() {
    if (this.state.error) {
      return (
        <View className="flex-1 items-center justify-center gap-3 bg-base px-8">
          <Text variant="h2" weight="bold" className="text-center">
            Something went wrong
          </Text>
          <Text variant="body" color="secondary" className="text-center">
            Please restart the app. If this keeps happening, contact support from Settings.
          </Text>
          <Button variant="secondary" onPress={() => this.setState({ error: null })} className="mt-2">
            Try Again
          </Button>
        </View>
      );
    }

    return this.props.children;
  }
}
