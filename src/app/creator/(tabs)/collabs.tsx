import { Handshake } from 'lucide-react-native';

import { NotBuiltYetTab } from '@/components/domain/NotBuiltYetTab';

/** My Collabs (Requests / Active / Past) — SPRINTS.md 2.3 and 4.1. */
export default function CreatorCollabsTab() {
  return (
    <NotBuiltYetTab
      icon={Handshake}
      title="Your collabs"
      description="Requests and collaborations will appear here. This screen is not built yet."
    />
  );
}
