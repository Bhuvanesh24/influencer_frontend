import { Megaphone } from 'lucide-react-native';

import { NotBuiltYetTab } from '@/components/domain/NotBuiltYetTab';

/** Campaign list and Create Campaign — SPRINTS.md 7.1. */
export default function BrandCampaignsTab() {
  return (
    <NotBuiltYetTab
      icon={Megaphone}
      title="Campaigns"
      description="Create and track campaigns here. This screen is not built yet."
    />
  );
}
