import { Tabs } from 'expo-router';
import { Compass, Handshake, House, Megaphone, MessageCircle, type LucideIcon } from 'lucide-react-native';

import { useAppTheme } from '@/hooks/use-app-theme';

const TABS: { name: string; title: string; icon: LucideIcon }[] = [
  { name: 'home', title: 'Home', icon: House },
  { name: 'discover', title: 'Discover', icon: Compass },
  { name: 'collabs', title: 'Collabs', icon: Handshake },
  { name: 'campaigns', title: 'Campaigns', icon: Megaphone },
  { name: 'inbox', title: 'Inbox', icon: MessageCircle },
];

/** Brand tab bar (prompt.md §4). Same styling as the creator's; Campaigns replaces Wallet. */
export default function BrandTabsLayout() {
  const { colors } = useAppTheme();

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
            tabBarIcon: ({ color, focused }) => (
              <tab.icon size={22} strokeWidth={focused ? 2 : 1.5} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
