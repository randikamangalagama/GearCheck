import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useGearCheck } from '@/context/GearCheckContext';
import { formatDate } from '@/utils/date';
import { Badge, Button, Card, EmptyState, PageContent, Screen, SectionTitle } from '@/components/ui';
import type { GearEvent } from '@/types';

function openEvent(event: GearEvent) {
  if (event.result) {
    router.push({ pathname: '/result', params: { eventId: event.id } });
  } else if (event.status === 'out' || event.status === 'returning') {
    router.push({ pathname: '/return-checklist', params: { eventId: event.id } });
  } else {
    router.push({ pathname: '/pack-checklist', params: { eventId: event.id } });
  }
}

export default function HomeScreen() {
  const colors = useColors();
  const { data, isHydrated } = useGearCheck();
  const totalUnits = data.gear.reduce((sum, item) => sum + item.quantity, 0);
  const upcomingCount = data.events.filter((event) => event.status === 'upcoming').length;
  const nextEvents = [...data.events]
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))
    .slice(0, 3);

  if (!isHydrated) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.foreground} />
      </View>
    );
  }

  return (
    <Screen title="GearCheck" subtitle="Your studio kit, always accounted for">
      <PageContent>
        <Card style={styles.hero}>
          <View style={styles.heroCopy}>
            <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>STUDIO KIT</Text>
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>Ready for the next shoot.</Text>
            <Text style={[styles.heroBody, { color: colors.mutedForeground }]}>
              Plan the pack. Check every item on the way back.
            </Text>
          </View>
          <View style={[styles.cameraMark, { borderColor: colors.border }]}>
            <Feather name="camera" size={23} color={colors.foreground} />
          </View>
        </Card>

        <Button
          title="New event"
          icon="plus"
          onPress={() => router.push('/create-event')}
          testID="new-event-button"
          style={{ minHeight: 56 }}
        />

        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.secondary }]}>
              <Feather name="package" size={17} color={colors.foreground} />
            </View>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{totalUnits}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>gear units</Text>
          </Card>
          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.secondary }]}>
              <Feather name="calendar" size={17} color={colors.foreground} />
            </View>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{upcomingCount}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>upcoming events</Text>
          </Card>
        </View>

        <SectionTitle
          title="Next events"
          action={
            <Pressable onPress={() => router.push('/(tabs)/events')} hitSlop={8}>
              <Text style={[styles.link, { color: colors.mutedForeground }]}>See all</Text>
            </Pressable>
          }
        />
        {nextEvents.length === 0 ? (
          <Card>
            <EmptyState
              icon="calendar"
              title="Nothing scheduled"
              body="Create an event to build a packing list from your studio inventory."
              action={<Button title="Create event" icon="plus" onPress={() => router.push('/create-event')} />}
            />
          </Card>
        ) : (
          <View style={{ gap: 9 }}>
            {nextEvents.map((event) => (
              <Pressable key={event.id} onPress={() => openEvent(event)}>
                <Card style={styles.eventCard}>
                  <View style={[styles.eventGlyph, { backgroundColor: colors.secondary }]}>
                    <Feather name="briefcase" size={17} color={colors.foreground} />
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text numberOfLines={1} style={[styles.eventTitle, { color: colors.foreground }]}>{event.title}</Text>
                    <Text style={[styles.eventMeta, { color: colors.mutedForeground }]}>
                      {formatDate(event.date, { month: 'short', day: 'numeric' })} · {event.time}
                      {event.venue ? ` · ${event.venue}` : ''}
                    </Text>
                  </View>
                  <Badge title={
                    event.result ? 'Review'
                      : event.status === 'packing' ? 'Packing'
                        : event.status === 'returning' ? 'Return'
                          : event.status === 'out' ? 'Ready'
                            : 'Upcoming'
                  } />
                  <Feather name="chevron-right" size={15} color={colors.mutedForeground} />
                </Card>
              </Pressable>
            ))}
          </View>
        )}
        <Text style={[styles.footerNote, { color: colors.mutedForeground }]}>Stored on this device · works offline</Text>
      </PageContent>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { minHeight: 166, padding: 21, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroCopy: { flex: 1, gap: 8, maxWidth: 280 },
  eyebrow: { fontSize: 9, letterSpacing: 1.3, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  heroTitle: { fontSize: 27, lineHeight: 31, fontWeight: '600', letterSpacing: -1.1, fontFamily: 'Inter_600SemiBold' },
  heroBody: { fontSize: 12, lineHeight: 18, fontFamily: 'Inter_400Regular' },
  cameraMark: { width: 50, height: 50, borderWidth: 1, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  statsGrid: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, minHeight: 122, justifyContent: 'space-between', padding: 15 },
  statIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 28, fontWeight: '600', letterSpacing: -1, fontFamily: 'Inter_600SemiBold' },
  statLabel: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  link: { fontSize: 11, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  eventCard: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 9 },
  eventGlyph: { height: 38, width: 38, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  eventTitle: { fontSize: 12, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  eventMeta: { fontSize: 9, fontFamily: 'Inter_400Regular' },
  footerNote: { fontSize: 10, textAlign: 'center', marginTop: 3, fontFamily: 'Inter_400Regular' },
});
