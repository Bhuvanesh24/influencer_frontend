import { CollabsList } from '@/components/domain/collab/CollabsList';

/** My Collabs — Requests / Active / Past (prompt.md §6.3). */
export default function CreatorCollabsTab() {
  return <CollabsList viewer="creator" />;
}
