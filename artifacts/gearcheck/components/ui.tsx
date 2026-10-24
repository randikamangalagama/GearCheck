import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type TextInputProps,
  type ViewProps,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';

export function Screen({
  title,
  subtitle,
  back = false,
  right,
  children,
  scroll = true,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: React.ReactNode;
  children: React.ReactNode;
  scroll?: boolean;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const top = Platform.OS === 'web' ? 67 : insets.top;
  const bottom = Platform.OS === 'web' ? 34 : insets.bottom;
  const horizontalPadding = width >= 760 ? 30 : 20;
  const content = (
    <>
      <View style={[styles.header, { paddingTop: top + 8, paddingHorizontal: horizontalPadding, alignSelf: 'center', width: '100%', maxWidth: 820 }]}>
        {back ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={styles.headerBack}
            hitSlop={8}
          >
            <Feather name="arrow-left" size={21} color={colors.foreground} />
          </Pressable>
        ) : null}
        <View style={styles.headerText}>
          <Text style={[styles.screenTitle, { color: colors.foreground }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.screenSubtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
          ) : null}
        </View>
        {right}
      </View>
      {children}
    </>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottom + 112, width: '100%', alignSelf: 'center', maxWidth: 820 }}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </View>
  );
}

export function PageContent({ children, style }: ViewProps) {
  const { width } = useWindowDimensions();
  return (
    <View
      style={[
        styles.pageContent,
        {
          width: '100%',
          maxWidth: width >= 760 ? 820 : undefined,
          alignSelf: 'center',
          paddingHorizontal: width >= 760 ? 30 : 20,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Card({ children, style }: ViewProps) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Button({
  title,
  onPress,
  icon,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  testID,
}: {
  title: string;
  onPress: () => void;
  icon?: React.ComponentProps<typeof Feather>['name'];
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewProps['style'];
  testID?: string;
}) {
  const colors = useColors();
  const backgroundColor =
    variant === 'primary'
      ? colors.primary
      : variant === 'danger'
        ? colors.destructive
        : variant === 'secondary'
          ? colors.secondary
          : 'transparent';
  const foregroundColor =
    variant === 'primary'
      ? colors.primaryForeground
      : variant === 'danger'
        ? colors.destructiveForeground
        : colors.foreground;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor,
          borderColor: variant === 'outline' ? colors.border : 'transparent',
          opacity: disabled ? 0.48 : pressed ? 0.86 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foregroundColor} />
      ) : (
        <>
          {icon ? <Feather name={icon} size={17} color={foregroundColor} /> : null}
          <Text style={[styles.buttonText, { color: foregroundColor }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  label,
  color,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  onPress: () => void;
  label: string;
  color?: string;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => ({ padding: 9, opacity: pressed ? 0.6 : 1 })}
    >
      <Feather name={icon} size={20} color={color ?? colors.foreground} />
    </Pressable>
  );
}

export function Input({
  label,
  error,
  multiline,
  style,
  ...props
}: TextInputProps & { label: string; error?: string }) {
  const colors = useColors();
  return (
    <View style={styles.inputWrap}>
      <Text style={[styles.inputLabel, { color: colors.foreground }]}>{label}</Text>
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor={colors.mutedForeground}
        selectionColor={colors.primary}
        style={[
          styles.input,
          {
            color: colors.foreground,
            backgroundColor: colors.card,
            borderColor: error ? colors.destructive : colors.border,
            minHeight: multiline ? 92 : 50,
            textAlignVertical: multiline ? 'top' : 'center',
          },
          style,
        ]}
      />
      {error ? <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text> : null}
    </View>
  );
}

export function Chip({
  title,
  selected,
  onPress,
  icon,
}: {
  title: string;
  selected?: boolean;
  onPress: () => void;
  icon?: React.ComponentProps<typeof Feather>['name'];
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? colors.accent : colors.card,
          borderColor: selected ? colors.primary : colors.border,
          opacity: pressed ? 0.78 : 1,
        },
      ]}
    >
      {icon ? <Feather name={icon} size={14} color={selected ? colors.accentForeground : colors.mutedForeground} /> : null}
      <Text style={[styles.chipText, { color: selected ? colors.accentForeground : colors.mutedForeground }]}>{title}</Text>
    </Pressable>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.accent }]}>
        <Feather name={icon} size={23} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>{body}</Text>
      {action ? <View style={{ marginTop: 18 }}>{action}</View> : null}
    </View>
  );
}

export function ProgressBar({ value, total }: { value: number; total: number }) {
  const colors = useColors();
  const progress = useSharedValue(total > 0 ? value / total : 0);
  useEffect(() => {
    progress.value = withSpring(total > 0 ? value / total : 0, {
      damping: 18,
      stiffness: 150,
    });
  }, [progress, total, value]);
  const animatedStyle = useAnimatedStyle(() => ({
    width: `${Math.max(0, Math.min(1, progress.value)) * 100}%`,
  }));
  return (
    <View style={[styles.progressTrack, { backgroundColor: colors.secondary }]}>
      <Animated.View style={[styles.progressFill, { backgroundColor: colors.primary }, animatedStyle]} />
    </View>
  );
}

export function AnimatedCheckbox({
  checked,
  onPress,
  label,
}: {
  checked: boolean;
  onPress: () => void;
  label: string;
}) {
  const colors = useColors();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const toggle = async () => {
    scale.value = withSpring(0.84, { damping: 10 }, () => {
      scale.value = withSpring(1);
    });
    try {
      await Haptics.selectionAsync();
    } catch {
      // Haptics are optional on web and unsupported devices.
    }
    onPress();
  };
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
      onPress={toggle}
      hitSlop={8}
      style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View
        style={[
          styles.checkbox,
          {
            borderColor: checked ? colors.primary : colors.border,
            backgroundColor: checked ? colors.primary : 'transparent',
          },
          animatedStyle,
        ]}
      >
        {checked ? <Feather name="check" size={15} color={colors.primaryForeground} /> : null}
      </Animated.View>
    </Pressable>
  );
}

export function SectionTitle({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      {action}
    </View>
  );
}

export function Divider() {
  const colors = useColors();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />;
}

export function Badge({ title, tone = 'neutral' }: { title: string; tone?: 'neutral' | 'success' | 'warning' }) {
  const colors = useColors();
  const color = tone === 'success' ? colors.success : tone === 'warning' ? colors.warning : colors.mutedForeground;
  const backgroundColor = tone === 'warning' ? colors.warningSurface : tone === 'success' ? `${colors.success}18` : colors.secondary;
  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={[styles.badgeText, { color }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  headerBack: { minWidth: 40, minHeight: 42, justifyContent: 'center' },
  headerText: { flex: 1 },
  screenTitle: { fontSize: 27, fontWeight: '700', letterSpacing: -0.8 },
  screenSubtitle: { marginTop: 3, fontSize: 13, lineHeight: 18 },
  pageContent: { paddingHorizontal: 20, gap: 16 },
  card: { borderWidth: StyleSheet.hairlineWidth, padding: 16, gap: 12 },
  button: {
    minHeight: 50,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  buttonText: { fontSize: 15, fontWeight: '600' },
  inputWrap: { gap: 7 },
  inputLabel: { fontSize: 13, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  errorText: { fontSize: 12 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 13,
    minHeight: 38,
  },
  chipText: { fontSize: 12, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 18 },
  emptyIcon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  emptyTitle: { fontSize: 17, fontWeight: '600', textAlign: 'center' },
  emptyBody: { fontSize: 13, lineHeight: 19, textAlign: 'center', maxWidth: 290, marginTop: 7 },
  progressTrack: { width: '100%', height: 8, borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 999 },
  checkbox: { width: 24, height: 24, borderWidth: 1.5, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sectionTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 7 },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  badge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  badgeText: { fontSize: 11, fontWeight: '600' },
});
