import { Compass } from 'lucide-react-native';

import { NotBuiltYetTab } from '@/components/domain/NotBuiltYetTab';

/** Open Campaigns list — SPRINTS.md 7.4. */
export default function CreatorDiscoverTab() {
  return (
    <NotBuiltYetTab
      icon={Compass}
      title="Open campaigns"
      description="Campaigns you can apply to will appear here. This screen is not built yet."
    />
  );
}
