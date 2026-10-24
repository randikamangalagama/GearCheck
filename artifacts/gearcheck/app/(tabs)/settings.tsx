import React, { useState } from 'react';
import {
  Alert,
  Platform,
  Share,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Button, Card, Chip, PageContent, Screen } from '@/components/ui';
import { useGearCheck } from '@/context/GearCheckContext';
import { useColors } from '@/hooks/useColors';
import type { ThemeMode } from '@/types';

export default function SettingsScreen() {
  const colors = useColors();
  const { data, setThemeMode, setRemindersEnabled, clearAllData, storageError } = useGearCheck();
  const [exporting, setExporting] = useState(false);
  const [reminderError, setReminderError] = useState('');

  const exportBackup = async () => {
    setExporting(true);
    try {
      const backup = JSON.stringify(
        { format: 'gearcheck-backup', version: 1, exportedAt: new Date().toISOString(), data },
        null,
        2,
      );
      if (Platform.OS === 'web') {
        await Share.share({ message: backup, title: 'GearCheck backup' });
        return;
      }
      const directory = FileSystem.cacheDirectory;
      if (!directory) throw new Error('Temporary file storage is unavailable.');
      const path = `${directory}gearcheck-backup-${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(path, backup, { encoding: FileSystem.EncodingType.UTF8 });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(path, {
          mimeType: 'application/json',
          dialogTitle: 'Export GearCheck backup',
          UTI: 'public.json',
        });
      } else {
        await Share.share({ message: backup, title: 'GearCheck backup' });
      }
    } catch (error) {
      Alert.alert('Backup could not be exported', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setExporting(false);
    }
  };

  const toggleReminders = async (enabled: boolean) => {
    setReminderError('');
    const updated = await setRemindersEnabled(enabled);
    if (!updated) {
      setReminderError(
        Platform.OS === 'web'
          ? 'Local notifications are available on Android and iOS.'
          : 'Notification permission was not granted. You can enable it in device settings.',
      );
    }
  };

  const confirmClear = () => {
    Alert.alert(
      'Clear all GearCheck data?',
      'This permanently deletes your inventory, events, templates, and saved preferences from this device. Export a backup first if you may need this data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear data',
          style: 'destructive',
          onPress: () => {
            void clearAllData().catch((error) =>
              Alert.alert('Data could not be cleared', error instanceof Error ? error.message : 'Try again.'),
            );
          },
        },
      ],
    );
  };

  const themeOptions: { label: string; value: ThemeMode; icon: React.ComponentProps<typeof Feather>['name'] }[] = [
    { label: 'System', value: 'system', icon: 'smartphone' },
    { label: 'Light', value: 'light', icon: 'sun' },
    { label: 'Dark', value: 'dark', icon: 'moon' },
  ];

  return (
    <Screen title="Settings" subtitle="Your app, your studio">
      <PageContent>
        <Text style={[styles.sectionHeading, { color: colors.foreground }]}>Appearance</Text>
        <Card style={styles.themeCard}>
          <Text style={[styles.cardHeading, { color: colors.foreground }]}>Theme</Text>
          <View style={styles.themeOptions}>
            {themeOptions.map((option) => (
              <Chip
                key={option.value}
                title={option.label}
                icon={option.icon}
                selected={data.settings.themeMode === option.value}
                onPress={() => setThemeMode(option.value)}
              />
            ))}
          </View>
          <Text style={[styles.helpText, { color: colors.mutedForeground }]}>
            System follows your device appearance. You can switch any time.
          </Text>
        </Card>

        <Text style={[styles.sectionHeading, { color: colors.foreground }]}>Reminders</Text>
        <Card style={styles.settingCard}>
          <View style={[styles.settingIcon, { backgroundColor: colors.accent }]}>
            <Feather name="bell" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardHeading, { color: colors.foreground }]}>Event reminders</Text>
            <Text style={[styles.helpText, { color: colors.mutedForeground }]}>
              Pack the evening before and check returns after an event.
            </Text>
          </View>
          <Switch
            accessibilityLabel="Enable event reminders"
            value={data.settings.remindersEnabled}
            onValueChange={toggleReminders}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.card}
          />
        </Card>
        {reminderError ? <Text style={[styles.inlineError, { color: colors.destructive }]}>{reminderError}</Text> : null}

        <Text style={[styles.sectionHeading, { color: colors.foreground }]}>Your data</Text>
        <Card style={styles.dataCard}>
          <View style={[styles.settingIcon, { backgroundColor: colors.secondary }]}>
            <Feather name="download" size={18} color={colors.foreground} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardHeading, { color: colors.foreground }]}>Export backup</Text>
            <Text style={[styles.helpText, { color: colors.mutedForeground }]}>
              Save a JSON copy of your inventory, events, templates, and preferences.
            </Text>
          </View>
        </Card>
        <Button title="Export JSON backup" icon="share" variant="outline" loading={exporting} onPress={exportBackup} />
        {storageError ? (
          <Card style={{ borderColor: colors.destructive }}>
            <Text style={[styles.helpText, { color: colors.destructive }]}>{storageError}</Text>
          </Card>
        ) : null}
        <Button title="Clear all data" icon="trash-2" variant="danger" onPress={confirmClear} />

        <View style={[styles.about, { borderTopColor: colors.border }]}>
          <View style={[styles.brandMark, { backgroundColor: colors.accent }]}>
            <Feather name="camera" size={18} color={colors.primary} />
          </View>
          <Text style={[styles.brandName, { color: colors.foreground }]}>GearCheck</Text>
          <Text style={[styles.helpText, { color: colors.mutedForeground }]}>
            Version {Constants.expoConfig?.version ?? '1.0.0'} · Offline-first studio gear tracking
          </Text>
        </View>
      </PageContent>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionHeading: { fontSize: 14, fontWeight: '700', marginTop: 5 },
  cardHeading: { fontSize: 14, fontWeight: '600' },
  helpText: { fontSize: 12, lineHeight: 18, marginTop: 4 },
  themeCard: { gap: 13 },
  themeOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  settingCard: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  dataCard: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  settingIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  inlineError: { fontSize: 12, lineHeight: 17 },
  about: { alignItems: 'center', paddingTop: 24, borderTopWidth: StyleSheet.hairlineWidth, gap: 7, marginTop: 6 },
  brandMark: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: 14, fontWeight: '700' },
});
