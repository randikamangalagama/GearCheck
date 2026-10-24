import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Badge, Button, Card, Chip, EmptyState, PageContent, Screen } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { useGearCheck } from '@/context/GearCheckContext';
import { formatDate } from '@/utils/date';
import type { GearEvent } from '@/types';

type EventFilter = 'upcoming' | 'inProgress' | 'completed';

export default function EventsScreen() {
  const colors = useColors();
  const { data } = useGearCheck();
  const [filter, setFilter] = useState<EventFilter>('upcoming');
  const events = useMemo(() => {
    const visible = data.events.filter((event) => {
      if (filter === 'upcoming') return event.status === 'upcoming';
      if (filter === 'inProgress') return ['packing', 'out', 'returning'].includes(event.status);
      return event.status === 'completed';
    });
    return visible.sort((a, b) =>
      filter === 'completed' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date),
    );
  }, [data.events, filter]);

  return (
    <Screen
      title="Events"
      subtitle="Every assignment, packed and accounted for"
      right={<Pressable onPress={() => router.push('/templates')} hitSlop={8} style={{ padding: 8 }}><Feather name="copy" size={19} color={colors.foreground} /></Pressable>}
    >
      <PageContent>
        <View style={styles.filters}>
          <Chip title="Upcoming" selected={filter === 'upcoming'} onPress={() => setFilter('upcoming')} />
          <Chip title="In progress" selected={filter === 'inProgress'} onPress={() => setFilter('inProgress')} />
          <Chip title="Completed" selected={filter === 'completed'} onPress={() => setFilter('completed')} />
        </View>
        <Button title="New event" icon="plus" onPress={() => router.push('/create-event')} />
        {events.length === 0 ? (
          <Card>
            <EmptyState
              icon={filter === 'completed' ? 'archive' : 'calendar'}
              title={filter === 'completed' ? 'No event history yet' : 'Nothing scheduled here'}
              body={filter === 'completed' ? 'Completed events and return results will appear here.' : 'Create an event, choose its gear, and start the packing checklist.'}
              action={filter !== 'completed' ? <Button title="Create an event" icon="plus" onPress={() => router.push('/create-event')} /> : undefined}
            />
          </Card>
        ) : (
          <View style={{ gap: 10 }}>
            {events.map((event) => (
              <EventCard key={event.id} event={event} onPress={() => router.push({ pathname: '/event-details', params: { eventId: event.id } })} />
            ))}
          </View>
        )}
      </PageContent>
    </Screen>
  );
}

function EventCard({ event, onPress }: { event: GearEvent; onPress: () => void }) {
  const colors = useColors();
  const label =
    event.status === 'completed'
      ? event.result === 'missing' ? 'Items missing' : 'Complete'
      : event.status === 'packing'
        ? 'Packing'
        : event.status === 'returning'
          ? 'Return check'
          : event.status === 'out'
            ? 'Ready to go'
            : 'Upcoming';
  const tone = event.result === 'missing' ? 'warning' : event.result === 'complete' || event.status === 'out' ? 'success' : 'neutral';
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.eventCard}>
        <View style={[styles.eventIcon, { backgroundColor: colors.accent }]}>
          <Feather name={event.status === 'completed' ? 'check-circle' : 'calendar'} size={19} color={colors.primary} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text numberOfLines={1} style={[styles.eventTitle, { color: colors.foreground }]}>{event.title}</Text>
          <Text style={[styles.eventMeta, { color: colors.mutedForeground }]}>
            {formatDate(event.date, { month: 'short', day: 'numeric', year: 'numeric' })}
            {event.venue ? ` · ${event.venue}` : ''}
          </Text>
          <Text style={[styles.eventMeta, { color: colors.mutedForeground }]}>{event.gearSelections.length} gear items</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 8 }}>
          <Badge title={label} tone={tone} />
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  eventCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  eventIcon: { height: 42, width: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  eventTitle: { fontSize: 14, fontWeight: '600' },
  eventMeta: { fontSize: 11 },
});
