import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { parseLocalDate } from '@/utils/date';
import type { GearEvent } from '@/types';

export async function requestReminderPermission() {
  if (Platform.OS === 'web') return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('gear-reminders', {
      name: 'Gear reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 180, 120, 180],
    });
  }

  const current = await Notifications.getPermissionsAsync();
  const permission = current.granted
    ? current
    : await Notifications.requestPermissionsAsync();
  return permission.granted;
}

export async function scheduleEventReminders(event: GearEvent) {
  if (Platform.OS === 'web') return [];
  const eventDate = parseLocalDate(event.date);
  if (!eventDate) return [];

  const reminders = [
    {
      date: new Date(
        eventDate.getFullYear(),
        eventDate.getMonth(),
        eventDate.getDate() - 1,
        18,
        0,
      ),
      title: 'Pack for tomorrow',
      body: `Get your gear ready for ${event.title}.`,
    },
    {
      date: new Date(
        eventDate.getFullYear(),
        eventDate.getMonth(),
        eventDate.getDate(),
        20,
        0,
      ),
      title: 'Return check',
      body: `Remember to check in your gear after ${event.title}.`,
    },
  ].filter((reminder) => reminder.date.getTime() > Date.now());

  const ids: string[] = [];
  for (const reminder of reminders) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: reminder.title,
        body: reminder.body,
        sound: 'default',
        data: { eventId: event.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminder.date,
        ...(Platform.OS === 'android' ? { channelId: 'gear-reminders' } : {}),
      },
    });
    ids.push(id);
  }
  return ids;
}

export async function cancelReminderIds(ids: string[]) {
  if (Platform.OS === 'web') return;
  await Promise.all(
    ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)),
  );
}
