import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { Button, Card, EmptyState, PageContent, Screen } from '@/components/ui';
import { useGearCheck } from '@/context/GearCheckContext';
import { useColors } from '@/hooks/useColors';

export default function ResultScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ eventId?: string }>();
  const { data, deleteEvent } = useGearCheck();
  const eventId = typeof params.eventId === 'string' ? params.eventId : undefined;
  const event = data.events.find((item) => item.id === eventId);
  const [finishing, setFinishing] = useState(false);

  if (!event) {
    return (
      <Screen title="Return result" subtitle="This event is no longer active" back>
        <PageContent>
          <Card>
            <EmptyState icon="check-circle" title="Event closed" body="Finished events are removed from GearCheck and are not archived." />
          </Card>
          <Button title="Back to events" icon="calendar" onPress={() => router.replace('/(tabs)/events')} />
        </PageContent>
      </Screen>
    );
  }

  const complete = event.result === 'complete';
  const missingUnits = event.missingItems.reduce(
    (sum, item) => sum + Math.max(0, item.quantity - item.returnedQuantity),
    0,
  );
  const finish = async () => {
    setFinishing(true);
    try {
      await deleteEvent(event.id);
      router.replace('/(tabs)/events');
    } finally {
      setFinishing(false);
    }
  };

  return (
    <Screen title="Return result" subtitle={event.title} back>
      <PageContent>
        <View style={styles.hero}>
          <View style={[
            styles.glow,
            { backgroundColor: complete ? colors.resultSuccessGlow : colors.resultMissingGlow },
          ]} />
          <Animated.View entering={ZoomIn.springify()} style={[
            styles.heroIcon,
            { backgroundColor: complete ? colors.resultSuccessGlow : colors.resultMissingGlow },
          ]}>
            <Feather name={complete ? 'check' : 'alert-triangle'} size={30} color={colors.foreground} />
          </Animated.View>
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
          <Card style={{ gap: 10 }}>
            <Text style={[styles.sectionHeading, { color: colors.foreground }]}>Check these items</Text>
            {event.missingItems.map((item) => {
              const missing = Math.max(0, item.quantity - item.returnedQuantity);
              if (missing === 0) return null;
              return (
                <View key={item.gearId} style={[styles.missingRow, { borderBottomColor: colors.border }]}>
                  <View style={[styles.itemMark, { backgroundColor: colors.secondary }]}>
                    <Feather name="alert-triangle" size={14} color={colors.foreground} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemName, { color: colors.foreground }]}>{item.name}</Text>
                    <Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>{item.categoryName}</Text>
                  </View>
                  <Text style={[styles.missingCount, { color: colors.foreground }]}>
                    {missing} missing
                  </Text>
                </View>
              );
            })}
          </Card>
        ) : null}

        <Button
          title="Done"
          icon="check"
          onPress={finish}
          loading={finishing}
          testID="finish-event-button"
        />
        <Text style={[styles.discardNote, { color: colors.mutedForeground }]}>
          Done removes this event permanently. Gear inventory is unchanged.
        </Text>
      </PageContent>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingVertical: 31, gap: 9, position: 'relative', overflow: 'hidden' },
  glow: { position: 'absolute', top: -40, width: 200, height: 200, borderRadius: 100 },
  heroIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 7 },
  heroTitle: { fontSize: 22, lineHeight: 28, fontWeight: '600', textAlign: 'center', letterSpacing: -0.6, fontFamily: 'Inter_600SemiBold' },
  heroBody: { fontSize: 12, lineHeight: 18, textAlign: 'center', fontFamily: 'Inter_400Regular' },
  sectionHeading: { fontSize: 13, fontWeight: '600', marginBottom: 2, fontFamily: 'Inter_600SemiBold' },
  missingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth },
  itemMark: { width: 31, height: 31, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  itemName: { fontSize: 12, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  itemMeta: { fontSize: 10, marginTop: 3, fontFamily: 'Inter_400Regular' },
  missingCount: { fontSize: 10, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  discardNote: { fontSize: 10, lineHeight: 15, textAlign: 'center', paddingHorizontal: 14, fontFamily: 'Inter_400Regular' },
});
