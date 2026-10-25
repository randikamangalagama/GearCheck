import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { Button, Card, Input, PageContent, Screen } from '@/components/ui';
import { useGearCheck } from '@/context/GearCheckContext';
import { useColors } from '@/hooks/useColors';
import { parseLocalDate, todayAsDateInput } from '@/utils/date';
import type { EventDraft } from '@/types';

export default function CreateEventScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ sourceEventId?: string; id?: string; date?: string }>();
  const { data, updateEvent } = useGearCheck();
  const eventId = typeof params.id === 'string' ? params.id : undefined;
  const sourceId = typeof params.sourceEventId === 'string' ? params.sourceEventId : undefined;
  const calendarDate = typeof params.date === 'string' ? params.date : undefined;
  const eventToEdit = data.events.find((event) => event.id === eventId);
  const source = data.events.find((event) => event.id === sourceId);
  const [title, setTitle] = useState(eventToEdit?.title ?? '');
  const [date, setDate] = useState(eventToEdit?.date ?? calendarDate ?? source?.date ?? todayAsDateInput());
  const [time, setTime] = useState(eventToEdit?.time ?? source?.time ?? '17:00');
  const [venue, setVenue] = useState(eventToEdit?.venue ?? '');
  const [notes, setNotes] = useState(eventToEdit?.notes ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const saveOrContinue = async () => {
    const cleanTitle = title.trim();
    const parsedDate = parseLocalDate(date);
    if (!cleanTitle) {
      setError('Add a name for this event.');
      return;
    }
    if (!parsedDate) {
      setError('Enter a valid date in YYYY-MM-DD format.');
      return;
    }
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      setError('Enter a valid 24-hour time, such as 17:30.');
      return;
    }
    const today = parseLocalDate(todayAsDateInput());
    if (!eventToEdit && today && parsedDate < today) {
      setError('Choose today or a future date.');
      return;
    }

    const draft: EventDraft = { title: cleanTitle, date, time, venue: venue.trim(), notes: notes.trim() };
    if (eventToEdit) {
      setSaving(true);
      try {
        await updateEvent(eventToEdit.id, draft);
        router.replace('/(tabs)/events');
      } catch {
        setError('The event could not be updated. Please try again.');
      } finally {
        setSaving(false);
      }
      return;
    }

    const initialGearIds = source?.gearSelections
      .map((item) => item.gearId)
      .filter((id) => data.gear.some((gear) => gear.id === id)) ?? [];
    router.push({
      pathname: '/select-gear',
      params: {
        draft: JSON.stringify(draft),
        ...(initialGearIds.length > 0 ? { initialGearIds: initialGearIds.join(',') } : {}),
      },
    });
  };

  return (
    <Screen
      title={eventToEdit ? 'Edit event' : 'New event'}
      subtitle={eventToEdit ? 'Update the event details' : 'Add the details, then choose your gear'}
      back
      scroll={false}
    >
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={{ paddingBottom: 34 }}
        keyboardShouldPersistTaps="handled"
        bottomOffset={28}
      >
        <PageContent>
          {source ? (
            <Card>
              <Text style={[styles.sourceText, { color: colors.mutedForeground }]}>
                Gear from “{source.title}” will be preselected. You can change it before saving.
              </Text>
            </Card>
          ) : null}
          <Card>
            <Input
              label="Event name"
              value={title}
              onChangeText={(value) => { setTitle(value); setError(''); }}
              placeholder="e.g. Perera wedding"
              autoCapitalize="sentences"
              autoFocus
              maxLength={80}
            />
            <Input
              label="Date"
              value={date}
              onChangeText={(value) => { setDate(value); setError(''); }}
              placeholder="YYYY-MM-DD"
              keyboardType="numbers-and-punctuation"
              maxLength={10}
              accessibilityLabel="Event date in year month day format"
            />
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>Use year-month-day, for example 2026-10-24.</Text>
            <Input
              label="Event time"
              value={time}
              onChangeText={(value) => { setTime(value); setError(''); }}
              placeholder="17:30"
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              accessibilityLabel="Event time in 24-hour format"
            />
            <Input
              label="Venue (optional)"
              value={venue}
              onChangeText={setVenue}
              placeholder="Location or venue"
              maxLength={100}
            />
            <Input
              label="Notes (optional)"
              value={notes}
              onChangeText={setNotes}
              placeholder="Schedule, contact, or setup notes"
              multiline
              maxLength={500}
            />
            {error ? <Text style={[styles.error, { color: colors.foreground }]}>{error}</Text> : null}
          </Card>
          <Button
            title={eventToEdit ? 'Save changes' : 'Choose gear'}
            icon={eventToEdit ? 'check' : 'arrow-right'}
            onPress={saveOrContinue}
            loading={saving}
            testID="continue-to-gear-button"
          />
        </PageContent>
      </KeyboardAwareScrollViewCompat>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sourceText: { fontSize: 12, lineHeight: 18 },
  hint: { fontSize: 10, marginTop: -7 },
  error: { fontSize: 12 },
});
