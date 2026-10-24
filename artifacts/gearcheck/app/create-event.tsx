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
  const params = useLocalSearchParams<{ sourceEventId?: string }>();
  const { data } = useGearCheck();
  const source = data.events.find((event) => event.id === params.sourceEventId);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(source?.date ?? todayAsDateInput());
  const [venue, setVenue] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const continueToGear = () => {
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
    const today = parseLocalDate(todayAsDateInput());
    if (today && parsedDate < today) {
      setError('Choose today or a future date.');
      return;
    }
    const draft: EventDraft = { title: cleanTitle, date, venue: venue.trim(), notes: notes.trim() };
    const initialGearIds = source?.gearSelections.map((item) => item.gearId).filter((id) => data.gear.some((gear) => gear.id === id)) ?? [];
    router.push({
      pathname: '/select-gear',
      params: {
        draft: JSON.stringify(draft),
        ...(initialGearIds.length > 0 ? { initialGearIds: initialGearIds.join(',') } : {}),
      },
    });
  };

  return (
    <Screen title="New event" subtitle="Add the details, then choose your gear" back scroll={false}>
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
            <Text style={[styles.dateHint, { color: colors.mutedForeground }]}>Use year-month-day, for example 2026-10-24.</Text>
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
            {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
          </Card>
          <Button title="Choose gear" icon="arrow-right" onPress={continueToGear} testID="continue-to-gear-button" />
        </PageContent>
      </KeyboardAwareScrollViewCompat>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sourceText: { fontSize: 12, lineHeight: 18 },
  dateHint: { fontSize: 11, marginTop: -6 },
  error: { fontSize: 12 },
});
