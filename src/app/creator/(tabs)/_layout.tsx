import { Tabs } from 'expo-router';
import { Compass, Handshake, House, MessageCircle, Wallet, type LucideIcon } from 'lucide-react-native';

import { useAppTheme } from '@/hooks/use-app-theme';
import { useUnreadCounts } from '@/hooks/use-inbox-badge';

const TABS: { name: string; title: string; icon: LucideIcon }[] = [
  { name: 'home', title: 'Home', icon: House },
  { name: 'discover', title: 'Discover', icon: Compass },
  { name: 'collabs', title: 'Collabs', icon: Handshake },
  { name: 'wallet', title: 'Wallet', icon: Wallet },
  { name: 'inbox', title: 'Inbox', icon: MessageCircle },
];

/** Creator tab bar (prompt.md §4). The role never changes, so neither does this set of tabs. */
export default function CreatorTabsLayout() {
  const { colors } = useAppTheme();
  const unread = useUnreadCounts();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text.primary,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarStyle: {
          backgroundColor: colors.bg.surface,
          borderTopColor: colors.border.subtle,
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: { fontFamily: 'Inter_500Medium', fontSize: 12 },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarBadge: tab.name === 'inbox' && unread.total > 0 ? unread.total : undefined,
            tabBarBadgeStyle: { backgroundColor: colors.action.primary, color: colors.text.inverse, fontSize: 11 },
            tabBarIcon: ({ color, focused }) => (
              <tab.icon size={22} strokeWidth={focused ? 2 : 1.5} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
