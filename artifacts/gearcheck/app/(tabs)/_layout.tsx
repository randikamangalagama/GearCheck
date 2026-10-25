import React, { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';
import theme from '@/constants/colors';

const tabItems = {
  index: { label: 'Home', icon: 'home' },
  gear: { label: 'Gear', icon: 'package' },
  events: { label: 'Events', icon: 'calendar' },
  settings: { label: 'Settings', icon: 'settings' },
} as const;

function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const indicator = useSharedValue(state.index);
  const barWidth = Math.min(width - 36, 420);
  const itemWidth = (barWidth - 8) / state.routes.length;
  const tint = colors.background === '#000000' ? 'dark' : 'light';

  useEffect(() => {
    indicator.value = withSpring(state.index, { damping: 22, stiffness: 190 });
  }, [indicator, state.index]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicator.value * itemWidth }],
  }));

  return (
    <View pointerEvents="box-none" style={[styles.tabPosition, { bottom: Platform.OS === 'web' ? 16 : Math.max(insets.bottom, 8) + 10 }]}>
      <View style={[styles.tabShell, { width: barWidth, borderColor: colors.border }]}>
        <BlurView
          intensity={theme.blur.tabBar}
          tint={tint}
          blurMethod={Platform.OS === 'android' ? 'dimezisBlurViewSdk31Plus' : 'none'}
          style={StyleSheet.absoluteFill}
        />
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.glassFill }]} />
        <LinearGradient
          pointerEvents="none"
          colors={[colors.glassEdge, 'transparent', colors.border]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View style={[styles.indicatorTrack, { width: itemWidth }, indicatorStyle]}>
          <View style={[styles.indicator, { backgroundColor: colors.primary }]} />
        </Animated.View>
        <View style={styles.tabItems}>
          {state.routes.map((route: { key: string; name: string; params?: Record<string, unknown> }, index: number) => {
            const item = tabItems[route.name as keyof typeof tabItems];
            if (!item) return null;
            const focused = state.index === index;
            const color = focused ? colors.primaryForeground : colors.mutedForeground;
            const options = descriptors[route.key]?.options;
            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
            };
            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityLabel={options?.tabBarAccessibilityLabel ?? item.label}
                accessibilityState={focused ? { selected: true } : {}}
                testID={options?.tabBarButtonTestID}
                onPress={onPress}
                style={styles.tabItem}
              >
                <Feather name={item.icon as React.ComponentProps<typeof Feather>['name']} size={18} color={color} />
                <Text style={[styles.tabLabel, { color }]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' } }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="gear" options={{ title: 'Gear' }} />
      <Tabs.Screen name="events" options={{ title: 'Events' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabPosition: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  tabShell: {
    height: 68,
    borderWidth: 1,
    borderRadius: 36,
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 10,
  },
  indicatorTrack: { position: 'absolute', top: 4, bottom: 4, left: 4, padding: 0 },
  indicator: { flex: 1, borderRadius: 32 },
  tabItems: { flex: 1, flexDirection: 'row', paddingHorizontal: 4 },
  tabItem: { flex: 1, minHeight: 60, alignItems: 'center', justifyContent: 'center', gap: 3 },
  tabLabel: { fontSize: 9, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
});
