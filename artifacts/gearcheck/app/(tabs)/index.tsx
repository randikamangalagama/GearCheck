import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useGearCheck } from '@/context/GearCheckContext';
import { formatDate, isCurrentMonth } from '@/utils/date';
import { Badge, Button, Card, EmptyState, PageContent, Screen, SectionTitle } from '@/components/ui';

export default function HomeScreen() {
  const colors = useColors();
  const { data, isHydrated } = useGearCheck();
  const totalUnits = data.gear.reduce((sum, item) => sum + item.quantity, 0);
  const eventsThisMonth = data.events.filter((event) => isCurrentMonth(event.createdAt)).length;
  const missingUnits = data.events.reduce(
    (sum, event) =>
      sum +
      event.missingItems.reduce(
        (eventSum, item) => eventSum + Math.max(0, item.quantity - item.returnedQuantity),
        0,
      ),
    0,
  );
  const activeEvents = data.events
    .filter((event) => event.status !== 'completed')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  if (!isHydrated) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <Screen title="GearCheck" subtitle="Your kit, ready for every story">
      <PageContent>
        <View style={[styles.welcomePanel, { backgroundColor: colors.primary }]}>
          <View style={styles.welcomeText}>
            <Text style={[styles.eyebrow, { color: colors.primaryForeground, opacity: 0.78 }]}>STUDIO OVERVIEW</Text>
            <Text style={[styles.welcomeTitle, { color: colors.primaryForeground }]}>Ready when you are.</Text>
            <Text style={[styles.welcomeBody, { color: colors.primaryForeground, opacity: 0.83 }]}>
              Keep every piece accounted for, from first pack to final return.
            </Text>
          </View>
          <View style={styles.cameraMark}>
            <Feather name="camera" size={25} color={colors.primaryForeground} />
          </View>
        </View>

        <Button
          title="New event"
          icon="plus"
          onPress={() => router.push('/create-event')}
          testID="new-event-button"
          style={{ minHeight: 56 }}
        />

        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.accent }]}>
              <Feather name="package" size={17} color={colors.primary} />
            </View>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{totalUnits}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>gear units</Text>
          </Card>
          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.secondary }]}>
              <Feather name="calendar" size={17} color={colors.foreground} />
            </View>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{eventsThisMonth}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>events this month</Text>
          </Card>
          <Card style={[styles.statCard, styles.statCardWide]}>
            <View style={[styles.statIcon, { backgroundColor: missingUnits ? colors.warningSurface : colors.secondary }]}>
              <Feather
                name={missingUnits ? 'alert-triangle' : 'check-circle'}
                size={17}
                color={missingUnits ? colors.warning : colors.success}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{missingUnits}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>missing gear units</Text>
            </View>
            {missingUnits > 0 ? <Badge title="Review" tone="warning" /> : null}
          </Card>
        </View>

        <SectionTitle
          title="Upcoming & active"
          action={
            <Pressable onPress={() => router.push('/(tabs)/events')} hitSlop={8}>
              <Text style={[styles.link, { color: colors.primary }]}>See all</Text>
            </Pressable>
          }
        />
        {activeEvents.length === 0 ? (
          <Card>
            <EmptyState
              icon="calendar"
              title="No events on the board"
              body="Create an event to build a packing list from your studio inventory."
              action={<Button title="Create an event" icon="plus" onPress={() => router.push('/create-event')} />}
            />
          </Card>
        ) : (
          <View style={{ gap: 10 }}>
            {activeEvents.map((event) => (
              <Pressable key={event.id} onPress={() => router.push({ pathname: '/event-details', params: { eventId: event.id } })}>
                <Card style={styles.eventCard}>
                  <View style={[styles.eventGlyph, { backgroundColor: colors.accent }]}>
                    <Feather name="briefcase" size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text numberOfLines={1} style={[styles.eventTitle, { color: colors.foreground }]}>{event.title}</Text>
                    <Text style={[styles.eventMeta, { color: colors.mutedForeground }]}>
                      {formatDate(event.date, { month: 'short', day: 'numeric' })}
                      {event.venue ? ` · ${event.venue}` : ''}
                    </Text>
                  </View>
                  <Badge
                    title={event.status === 'packing' ? 'Packing' : event.status === 'returning' ? 'Return' : event.status === 'out' ? 'Ready' : 'Upcoming'}
                    tone={event.status === 'returning' ? 'warning' : event.status === 'out' ? 'success' : 'neutral'}
                  />
                  <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                </Card>
              </Pressable>
            ))}
          </View>
        )}
        <Text style={[styles.footerNote, { color: colors.mutedForeground }]}>Stored on this device. Works offline.</Text>
      </PageContent>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  welcomePanel: {
    minHeight: 184,
    padding: 22,
    borderRadius: 22,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeText: { flex: 1, gap: 9, maxWidth: 260 },
  eyebrow: { fontSize: 10, letterSpacing: 1.2, fontWeight: '700' },
  welcomeTitle: { fontSize: 25, fontWeight: '700', letterSpacing: -0.7 },
  welcomeBody: { fontSize: 13, lineHeight: 19 },
  cameraMark: {
    width: 56,
    height: 56,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { flex: 1, minWidth: '42%', minHeight: 128, justifyContent: 'space-between' },
  statCardWide: { flexBasis: '100%', minHeight: 84, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' },
  statIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 27, fontWeight: '700', letterSpacing: -0.6 },
  statLabel: { fontSize: 12 },
  link: { fontSize: 13, fontWeight: '600' },
  eventCard: { flexDirection: 'row', alignItems: 'center', padding: 13, gap: 10 },
  eventGlyph: { height: 40, width: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  eventTitle: { fontSize: 14, fontWeight: '600' },
  eventMeta: { fontSize: 11 },
  footerNote: { fontSize: 11, textAlign: 'center', marginTop: 2 },
});
