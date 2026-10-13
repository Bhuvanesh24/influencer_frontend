import { Handshake } from 'lucide-react-native';

import { NotBuiltYetTab } from '@/components/domain/NotBuiltYetTab';

/** My Collabs (Direct / Campaigns) — SPRINTS.md 4.1. */
export default function BrandCollabsTab() {
  return (
    <NotBuiltYetTab
      icon={Handshake}
      title="Your collabs"
      description="Requests you send and collaborations in progress will appear here. This screen is not built yet."
    />
  );
}
