import { DatabaseBackup, LogOut, RotateCcw } from 'lucide-react-native';
import { View } from 'react-native';

import { useConfirmSheet } from '@/components/ui/ConfirmSheet';
import { ListGroup, ListRow } from '@/components/ui/ListGroup';
import { useSignOut } from '@/hooks/use-sign-out';
import { resetMockDb } from '@/lib/api/mock/session';
import { IS_MOCK_API } from '@/lib/api/mock-mode';
import { resetWelcomeCarousel } from '@/lib/local-flags';
import { toast } from '@/lib/toast';

/** The bottom of both profile screens: Log out, plus mock/dev-only helpers for demoing. */
export function AccountSection() {
  const signOut = useSignOut();
  const { ask, sheet } = useConfirmSheet();

  return (
    <View>
      <ListGroup title="Account">
        <ListRow
          icon={LogOut}
          title="Log out"
          destructive
          onPress={() =>
            ask({
              title: 'Log out?',
              description: 'You will need your email and password to sign back in.',
              confirmLabel: 'Log out',
              destructive: true,
              onConfirm: () => signOut(),
            })
          }
        />
      </ListGroup>

      {(IS_MOCK_API || __DEV__) && (
        <View className="mt-6">
          <ListGroup title="Demo" footer="Only in demo builds. Resetting brings back the original demo data for every account.">
            {IS_MOCK_API && (
              <ListRow
                icon={DatabaseBackup}
                title="Reset demo data"
                onPress={() =>
                  ask({
                    title: 'Reset demo data?',
                    description: 'Every change made while demoing is discarded, for both demo accounts.',
                    confirmLabel: 'Reset',
                    destructive: true,
                    onConfirm: async () => {
                      await resetMockDb();
                      toast.success('Demo data reset');
                      signOut();
                    },
                  })
                }
              />
            )}
            {__DEV__ && (
              <ListRow
                icon={RotateCcw}
                title="Replay intro"
                onPress={async () => {
                  await resetWelcomeCarousel();
                  signOut('/welcome');
                }}
              />
            )}
          </ListGroup>
        </View>
      )}
      {sheet}
    </View>
  );
}
