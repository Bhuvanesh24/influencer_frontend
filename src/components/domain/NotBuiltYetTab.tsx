import type { LucideIcon } from 'lucide-react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';

/**
 * Stand-in body for a tab whose screen ships in a later sprint (see SPRINTS.md). It says so
 * plainly and shows no sample content. Each tab file replaces this with its real screen.
 */
export function NotBuiltYetTab({ icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <Screen edges={['top']}>
      <EmptyState icon={icon} title={title} description={description} />
    </Screen>
  );
}
