import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Card, EmptyState, PageContent, Screen } from '@/components/ui';
import { useGearCheck } from '@/context/GearCheckContext';
import { useColors } from '@/hooks/useColors';

export default function ResultScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ eventId?: string }>();
  const { data } = useGearCheck();
  const event = data.events.find((item) => item.id === params.eventId);

  if (!event) {
    return (
      <Screen title="Event result" subtitle="Event not found" back>
        <PageContent><Card><EmptyState icon="alert-circle" title="Result unavailable" body="This event could not be found on this device." /></Card></PageContent>
      </Screen>
    );
  }

  const complete = event.result === 'complete';
  const missingUnits = event.missingItems.reduce(
    (sum, item) => sum + Math.max(0, item.quantity - item.returnedQuantity),
    0,
  );

  return (
    <Screen title="Return result" subtitle={event.title} back>
      <PageContent>
        <View style={styles.hero}>
          <View style={[
            styles.heroIcon,
            { backgroundColor: complete ? `${colors.success}18` : colors.warningSurface },
          ]}>
            <Feather
              name={complete ? 'check' : 'alert-triangle'}
              size={33}
              color={complete ? colors.success : colors.warning}
            />
          </View>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>
            {complete ? 'All gear returned safely' : 'Missing items'}
          </Text>
          <Text style={[styles.heroBody, { color: colors.mutedForeground }]}>
            {complete
              ? 'The full event kit is back in your studio inventory.'
              : `${missingUnits} ${missingUnits === 1 ? 'unit needs' : 'units need'} a follow-up.`}
          </Text>
        </View>

        {!complete ? (
          <Card style={{ gap: 11 }}>
            <Text style={[styles.sectionHeading, { color: colors.foreground }]}>Check these items</Text>
            {event.missingItems.map((item, index) => {
              const missing = Math.max(0, item.quantity - item.returnedQuantity);
              if (missing === 0) return null;
              return (
                <View key={`${item.gearId}-${index}`} style={[styles.missingRow, { borderBottomColor: colors.border }]}>
                  <View style={[styles.warningIcon, { backgroundColor: colors.warningSurface }]}>
                    <Feather name="alert-triangle" size={15} color={colors.warning} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemName, { color: colors.foreground }]}>{item.name}</Text>
                    <Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>{item.categoryName}</Text>
                  </View>
                  <Text style={[styles.missingCount, { color: colors.warning }]}>
                    {missing} missing
                  </Text>
                </View>
              );
            })}
          </Card>
        ) : (
          <Card>
            <EmptyState icon="shield" title="Event closed out" body="Your return checklist is complete. This event has been added to history." />
          </Card>
        )}

        <Button
          title="Event details"
          icon="file-text"
          variant="outline"
          onPress={() => router.replace({ pathname: '/event-details', params: { eventId: event.id } })}
        />
        <Button title="Back to events" icon="calendar" onPress={() => router.replace('/(tabs)/events')} />
      </PageContent>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingVertical: 22, gap: 9 },
  heroIcon: { width: 72, height: 72, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
  heroTitle: { fontSize: 22, lineHeight: 28, fontWeight: '700', textAlign: 'center', letterSpacing: -0.5 },
  heroBody: { fontSize: 13, lineHeight: 19, textAlign: 'center' },
  sectionHeading: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  missingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth },
  warningIcon: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  itemName: { fontSize: 13, fontWeight: '600' },
  itemMeta: { fontSize: 11, marginTop: 3 },
  missingCount: { fontSize: 11, fontWeight: '700' },
});
