import { Wallet } from 'lucide-react-native';

import { NotBuiltYetTab } from '@/components/domain/NotBuiltYetTab';

/** Earnings and payout history — SPRINTS.md 6.1. */
export default function CreatorWalletTab() {
  return (
    <NotBuiltYetTab
      icon={Wallet}
      title="Wallet"
      description="Your earnings and payouts will appear here. This screen is not built yet."
    />
  );
}
