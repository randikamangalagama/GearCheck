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
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import theme from '@/constants/colors';

function AndroidBlur({ intensity = 70, tint }: { intensity?: number; tint: 'light' | 'dark' }) {
  return (
    <BlurView
      intensity={intensity}
      tint={tint}
      blurMethod={Platform.OS === 'android' ? 'dimezisBlurViewSdk31Plus' : 'none'}
      style={StyleSheet.absoluteFill}
    />
  );
}

function AmbientBackground() {
  const colors = useColors();
  const drift = useSharedValue(0);
  useEffect(() => {
    drift.value = withRepeat(
      withTiming(1, { duration: 26000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [drift]);
  const firstOrb = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(drift.value, [0, 1], [-24, 35]) },
      { translateY: interpolate(drift.value, [0, 1], [10, -18]) },
    ],
  }));
  const secondOrb = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(drift.value, [0, 1], [32, -26]) },
      { translateY: interpolate(drift.value, [0, 1], [-18, 28]) },
    ],
  }));
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View style={[styles.ambientOrb, styles.ambientOrbTop, { backgroundColor: colors.orb }, firstOrb]}>
        <LinearGradient
          colors={[colors.glassHighlight, 'transparent']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Animated.View style={[styles.ambientOrb, styles.ambientOrbBottom, { backgroundColor: colors.orb }, secondOrb]}>
        <LinearGradient
          colors={['transparent', colors.glassHighlight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

function GlassHeader({
  title,
  subtitle,
  back,
  right,
  top,
  maxWidth,
}: {
  title: string;
  subtitle?: string;
  back: boolean;
  right?: React.ReactNode;
  top: number;
  maxWidth: number;
}) {
  const colors = useColors();
  const tint = colors.background === '#000000' ? 'dark' : 'light';
  return (
    <View style={[styles.headerFrame, { marginTop: top, maxWidth, borderRadius: colors.radius, borderColor: colors.border }]}>
      <AndroidBlur intensity={theme.blur.header} tint={tint} />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.glassFill }]} />
      <LinearGradient
        pointerEvents="none"
        colors={[colors.glassEdge, 'transparent', colors.border]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.header}>
        {back ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={styles.headerBack}
            hitSlop={8}
          >
            <Feather name="arrow-left" size={20} color={colors.foreground} />
          </Pressable>
        ) : null}
        <View style={styles.headerText}>
          <Text style={[styles.screenTitle, { color: colors.foreground }]}>{title}</Text>
          {subtitle ? <Text style={[styles.screenSubtitle, { color: colors.mutedForeground }]}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
    </View>
  );
}

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
  const top = Platform.OS === 'web' ? 54 : insets.top + 4;
  const bottom = Platform.OS === 'web' ? 34 : insets.bottom;
  const maxWidth = Math.min(width - 24, 720);
  const header = <GlassHeader title={title} subtitle={subtitle} back={back} right={right} top={top} maxWidth={maxWidth} />;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AmbientBackground />
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottom + 116, width: '100%', alignSelf: 'center', maxWidth: 760 }}
        >
          {header}
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, width: '100%', alignSelf: 'center', maxWidth: 760 }}>
          {header}
          {children}
        </View>
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
          maxWidth: width >= 760 ? 720 : undefined,
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
  const flatStyle = StyleSheet.flatten(style) ?? {};
  const tint = colors.background === '#000000' ? 'dark' : 'light';
  const frameLayout = {
    flex: flatStyle.flex,
    flexGrow: flatStyle.flexGrow,
    flexShrink: flatStyle.flexShrink,
    flexBasis: flatStyle.flexBasis,
    width: flatStyle.width,
    minWidth: flatStyle.minWidth,
    maxWidth: flatStyle.maxWidth,
    minHeight: flatStyle.minHeight,
    maxHeight: flatStyle.maxHeight,
    alignSelf: flatStyle.alignSelf,
    margin: flatStyle.margin,
    marginTop: flatStyle.marginTop,
    marginBottom: flatStyle.marginBottom,
    marginHorizontal: flatStyle.marginHorizontal,
    marginVertical: flatStyle.marginVertical,
  };
  return (
    <View style={[styles.glassFrame, frameLayout, { borderRadius: colors.radius, borderColor: colors.border }]}>
      <LinearGradient
        pointerEvents="none"
        colors={[colors.glassEdge, colors.border, colors.glassHighlight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.glassInset, { borderRadius: colors.radius - 1 }]}>
        <AndroidBlur intensity={theme.blur.intensity} tint={tint} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glassFill }]} />
        <LinearGradient
          colors={[colors.glassHighlight, 'transparent']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 1, y: 0.7 }}
          style={[StyleSheet.absoluteFill, { height: 42, bottom: undefined }]}
        />
      </View>
      <View style={[styles.cardContent, style]}>{children}</View>
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
  const filled = variant === 'primary' || variant === 'danger';
  const backgroundColor = variant === 'primary'
    ? colors.primary
    : variant === 'danger'
      ? colors.destructive
      : variant === 'secondary'
        ? colors.glassFill
        : 'transparent';
  const foregroundColor = variant === 'primary'
    ? colors.primaryForeground
    : variant === 'danger'
      ? colors.destructiveForeground
      : colors.foreground;
  const tint = colors.background === '#000000' ? 'dark' : 'light';
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
          borderColor: filled ? 'transparent' : colors.border,
          opacity: disabled ? 0.46 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
        style,
      ]}
    >
      {!filled && variant !== 'ghost' ? <AndroidBlur intensity={theme.blur.intensity} tint={tint} /> : null}
      {variant === 'secondary' ? (
        <LinearGradient
          pointerEvents="none"
          colors={[colors.glassEdge, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {loading ? (
        <ActivityIndicator color={foregroundColor} />
      ) : (
        <>
          {icon ? <Feather name={icon} size={16} color={foregroundColor} /> : null}
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
      style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.55 : 1 }]}
    >
      <Feather name={icon} size={19} color={color ?? colors.foreground} />
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
      <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor={colors.mutedForeground}
        selectionColor={colors.primary}
        style={[
          styles.input,
          {
            color: colors.foreground,
            backgroundColor: colors.glassFill,
            borderColor: error ? colors.foreground : colors.border,
            minHeight: multiline ? 92 : 50,
            textAlignVertical: multiline ? 'top' : 'center',
          },
          style,
        ]}
      />
      {error ? <Text style={[styles.errorText, { color: colors.foreground }]}>{error}</Text> : null}
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
          backgroundColor: selected ? colors.primary : colors.glassFill,
          borderColor: selected ? colors.primary : colors.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      {icon ? <Feather name={icon} size={14} color={selected ? colors.primaryForeground : colors.mutedForeground} /> : null}
      <Text style={[styles.chipText, { color: selected ? colors.primaryForeground : colors.mutedForeground }]}>{title}</Text>
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
      <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
        <Feather name={icon} size={22} color={colors.foreground} />
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
    progress.value = withSpring(total > 0 ? value / total : 0, { damping: 18, stiffness: 150 });
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
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const toggle = async () => {
    scale.value = withSpring(0.82, { damping: 9 }, () => { scale.value = withSpring(1); });
    try {
      await Haptics.selectionAsync();
    } catch {
      // Haptics are not available in browser previews.
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
      style={styles.checkTouchTarget}
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
        {checked ? <Feather name="check" size={14} color={colors.primaryForeground} /> : null}
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
  return (
    <View style={[styles.badge, { backgroundColor: tone === 'neutral' ? colors.secondary : colors.glassFill, borderColor: colors.border }]}>
      <Text style={[styles.badgeText, { color: colors.mutedForeground }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, overflow: 'hidden' },
  ambientOrb: { position: 'absolute', width: 270, height: 270, borderRadius: 150, opacity: 0.38, overflow: 'hidden' },
  ambientOrbTop: { top: -130, right: -115 },
  ambientOrbBottom: { bottom: 40, left: -145, width: 320, height: 320 },
  headerFrame: {
    alignSelf: 'center',
    width: '94%',
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 3,
  },
  header: {
    paddingHorizontal: 18,
    paddingVertical: 15,
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerBack: { width: 42, height: 44, alignItems: 'flex-start', justifyContent: 'center' },
  headerText: { flex: 1 },
  screenTitle: { fontSize: 29, fontWeight: '700', letterSpacing: -1.2, fontFamily: 'Inter_700Bold' },
  screenSubtitle: { marginTop: 3, fontSize: 12, lineHeight: 17, fontFamily: 'Inter_400Regular' },
  pageContent: { paddingHorizontal: 20, gap: 15 },
  glassFrame: {
    position: 'relative',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.055,
    shadowRadius: 18,
    elevation: 2,
  },
  glassInset: { margin: 1, overflow: 'hidden' },
  cardContent: { padding: 17, gap: 12 },
  button: {
    position: 'relative',
    overflow: 'hidden',
    minHeight: 50,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  buttonText: { fontSize: 14, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  iconButton: { minWidth: 42, minHeight: 42, alignItems: 'center', justifyContent: 'center' },
  inputWrap: { gap: 7 },
  inputLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: 'Inter_600SemiBold' },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  errorText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    minHeight: 38,
  },
  chipText: { fontSize: 11, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  emptyState: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 18 },
  emptyIcon: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontSize: 16, fontWeight: '600', textAlign: 'center', fontFamily: 'Inter_600SemiBold' },
  emptyBody: { fontSize: 12, lineHeight: 18, textAlign: 'center', maxWidth: 290, marginTop: 7, fontFamily: 'Inter_400Regular' },
  progressTrack: { width: '100%', height: 5, borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: 5, borderRadius: 999 },
  checkTouchTarget: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  checkbox: { width: 24, height: 24, borderWidth: 1.5, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  sectionTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  sectionTitle: { fontSize: 17, fontWeight: '600', letterSpacing: -0.35, fontFamily: 'Inter_600SemiBold' },
  badge: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  badgeText: { fontSize: 9, fontWeight: '600', letterSpacing: 0.25, fontFamily: 'Inter_600SemiBold' },
});
