import { MessageCircle } from 'lucide-react-native';

import { NotBuiltYetTab } from '@/components/domain/NotBuiltYetTab';

/** Conversations list — SPRINTS.md 5.1. */
export default function BrandInboxTab() {
  return (
    <NotBuiltYetTab
      icon={MessageCircle}
      title="Inbox"
      description="Messages with creators will appear here. This screen is not built yet."
    />
  );
}
