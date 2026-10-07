import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Tabs } from 'expo-router';
import { Pressable, View, type ColorValue } from 'react-native';

import { useStore } from '@/state/store';
import { FONT } from '@/ui/theme';

export default function TabLayout() {
  const { colors, t } = useStore();
  const icon = (name: keyof typeof Ionicons.glyphMap) =>
    function TabIcon({ color }: { color: ColorValue }) {
      return <Ionicons name={name} size={22} color={color as string} />;
    };
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line },
        tabBarLabelStyle: { fontFamily: FONT.bold, fontSize: 11, lineHeight: 15 },
      }}>
      <Tabs.Screen name="index" options={{ title: t('nav_today'), tabBarIcon: icon('home-outline') }} />
      <Tabs.Screen name="analysis" options={{ title: t('nav_analysis'), tabBarIcon: icon('bar-chart-outline') }} />
      <Tabs.Screen
        name="plus"
        options={{
          title: '',
          tabBarButton: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('add_meal')}
              onPress={() => router.push('/add')}
              style={{ flex: 1, alignItems: 'center' }}>
              <View style={{ width: 54, height: 54, borderRadius: 27, marginTop: -18, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.bg }}>
                <Ionicons name="add" size={30} color={colors.accentInk} />
              </View>
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen name="foods" options={{ title: t('nav_foods'), tabBarIcon: icon('document-text-outline') }} />
      <Tabs.Screen name="settings" options={{ title: t('nav_settings'), tabBarIcon: icon('settings-outline') }} />
    </Tabs>
  );
}
