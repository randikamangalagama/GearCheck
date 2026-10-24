import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Badge, Button, Card, EmptyState, PageContent, Screen, SectionTitle } from '@/components/ui';
import { useGearCheck } from '@/context/GearCheckContext';
import { useColors } from '@/hooks/useColors';
import { formatDate } from '@/utils/date';
import type { GearEvent } from '@/types';

export default function EventDetailsScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ eventId?: string }>();
  const { data, startReturn } = useGearCheck();
  const event = data.events.find((item) => item.id === params.eventId);

  if (!event) {
    return (
      <Screen title="Event details" subtitle="Event not found" back>
        <PageContent><Card><EmptyState icon="calendar" title="This event is unavailable" body="It may have been removed from this device." /></Card></PageContent>
      </Screen>
    );
  }

  const duplicate = () => router.push({ pathname: '/create-event', params: { sourceEventId: event.id } });
  const openPacking = () => router.push({ pathname: '/pack-checklist', params: { eventId: event.id } });
  const openReturn = () => {
    startReturn(event.id);
    router.push({ pathname: '/return-checklist', params: { eventId: event.id } });
  };
  const completed = event.status === 'completed';
  const statusLabel = getStatusLabel(event);

  return (
    <Screen
      title="Event details"
      subtitle={event.title}
      back
      right={<Pressable onPress={duplicate} hitSlop={8} style={{ padding: 8 }}><Feather name="copy" size={19} color={colors.foreground} /></Pressable>}
    >
      <PageContent>
        <Card style={{ gap: 14 }}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.eventTitle, { color: colors.foreground }]}>{event.title}</Text>
              <Text style={[styles.eventDate, { color: colors.mutedForeground }]}>{formatDate(event.date)}</Text>
            </View>
            <Badge
              title={statusLabel}
              tone={event.result === 'missing' ? 'warning' : event.status === 'out' || event.result === 'complete' ? 'success' : 'neutral'}
            />
          </View>
          {event.venue ? <InfoRow icon="map-pin" label="Venue" value={event.venue} /> : null}
          {event.notes ? <InfoRow icon="file-text" label="Notes" value={event.notes} /> : null}
          <InfoRow icon="package" label="Gear selected" value={`${event.gearSelections.length} items · ${event.gearSelections.reduce((sum, item) => sum + item.quantity, 0)} units`} />
        </Card>

        <SectionTitle title="Gear list" />
        <Card style={{ padding: 0, overflow: 'hidden', gap: 0 }}>
          {event.gearSelections.length === 0 ? (
            <EmptyState icon="package" title="No gear selected" body="Duplicate this event to choose a gear list for a new assignment." />
          ) : (
            event.gearSelections.map((item, index) => (
              <View key={`${item.gearId}-${index}`}>
                {index > 0 ? <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 15 }} /> : null}
                <View style={styles.gearRow}>
                  <View style={[styles.itemGlyph, { backgroundColor: colors.secondary }]}>
                    <Feather name="package" size={15} color={colors.mutedForeground} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemName, { color: colors.foreground }]}>{item.name}</Text>
                    <Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>{item.categoryName} · {item.quantity} {item.quantity === 1 ? 'unit' : 'units'}</Text>
                  </View>
                  {completed ? (
                    <Text style={[styles.itemMeta, { color: event.result === 'missing' && item.returnedQuantity < item.quantity ? colors.warning : colors.success }]}>
                      {item.returnedQuantity}/{item.quantity} returned
                    </Text>
                  ) : event.status !== 'upcoming' ? (
                    <Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>
                      {item.packedQuantity}/{item.quantity} packed
                    </Text>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </Card>

        {event.status === 'packing' || event.status === 'upcoming' ? (
          <Button title="Continue packing" icon="check-square" onPress={openPacking} />
        ) : event.status === 'out' ? (
          <Button title="Start return check" icon="corner-down-left" onPress={openReturn} />
        ) : event.status === 'returning' ? (
          <Button title="Continue return check" icon="corner-down-left" onPress={() => router.push({ pathname: '/return-checklist', params: { eventId: event.id } })} />
        ) : (
          <Button
            title={event.result === 'missing' ? 'Review missing items' : 'View final result'}
            icon={event.result === 'missing' ? 'alert-triangle' : 'check-circle'}
            onPress={() => router.push({ pathname: '/result', params: { eventId: event.id } })}
          />
        )}
        <Button title="Reuse this gear list" icon="copy" variant="outline" onPress={duplicate} />
      </PageContent>
    </Screen>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ComponentProps<typeof Feather>['name']; label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={styles.infoRow}>
      <Feather name={icon} size={15} color={colors.mutedForeground} />
      <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

function getStatusLabel(event: GearEvent) {
  if (event.status === 'completed') return event.result === 'missing' ? 'Items missing' : 'Complete';
  if (event.status === 'packing') return 'Packing';
  if (event.status === 'out') return 'Ready to go';
  if (event.status === 'returning') return 'Return check';
  return 'Upcoming';
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  eventTitle: { fontSize: 19, fontWeight: '700', letterSpacing: -0.4 },
  eventDate: { fontSize: 12, marginTop: 5 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  infoLabel: { width: 92, fontSize: 11 },
  infoValue: { flex: 1, fontSize: 12, fontWeight: '500' },
  gearRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10 },
  itemGlyph: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  itemName: { fontSize: 13, fontWeight: '600' },
  itemMeta: { fontSize: 10, marginTop: 4 },
});
