import React, { useMemo, useState } from 'react';
import {
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown, ZoomIn, interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Badge, Button, Card, EmptyState, IconButton, PageContent, ProgressBar, Screen, SectionTitle } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { useGearCheck } from '@/context/GearCheckContext';
import { formatDate, todayAsDateInput } from '@/utils/date';
import type { GearEvent } from '@/types';

type ViewMode = 'list' | 'calendar';
const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function eventStart(event: GearEvent) {
  return `${event.date}T${event.time}`;
}

function formatTime(time: string) {
  const [hourText, minute] = time.split(':');
  const hour = Number(hourText);
  if (!Number.isInteger(hour)) return time;
  const suffix = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${minute} ${suffix}`;
}

function routeToEvent(event: GearEvent) {
  if (event.result) {
    router.push({ pathname: '/result', params: { eventId: event.id } });
  } else if (event.status === 'out' || event.status === 'returning') {
    router.push({ pathname: '/return-checklist', params: { eventId: event.id } });
  } else {
    router.push({ pathname: '/pack-checklist', params: { eventId: event.id } });
  }
}

export default function EventsScreen() {
  const colors = useColors();
  const { data } = useGearCheck();
  const { width } = useWindowDimensions();
  const [mode, setMode] = useState<ViewMode>('list');
  const segmentWidth = Math.min(width - 40, 360);
  const segmentStep = (segmentWidth - 8) / 2;
  const slider = useSharedValue(0);
  React.useEffect(() => {
    slider.value = withSpring(mode === 'calendar' ? 1 : 0, { damping: 23, stiffness: 190 });
  }, [mode, slider]);
  const sliderStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(slider.value, [0, 1], [0, segmentStep]) }],
  }));

  const events = useMemo(
    () => [...data.events].sort((a, b) => eventStart(a).localeCompare(eventStart(b))),
    [data.events],
  );
  const upcoming = events.filter((event) => event.status === 'upcoming');
  const inProgress = events.filter((event) => event.status !== 'upcoming');

  return (
    <Screen
      title="Events"
      subtitle="Upcoming assignments and active checklists"
      right={<IconButton icon="copy" label="Gear templates" onPress={() => router.push('/templates')} />}
    >
      <PageContent>
        <View style={[styles.segment, { width: segmentWidth, borderColor: colors.border, backgroundColor: colors.glassFill }]}>
          <Animated.View style={[styles.segmentThumbTrack, { width: segmentStep }, sliderStyle]}>
            <View style={[styles.segmentThumb, { backgroundColor: colors.primary }]} />
          </Animated.View>
          {(['list', 'calendar'] as const).map((item) => {
            const selected = mode === item;
            return (
              <Pressable
                key={item}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setMode(item)}
                style={styles.segmentOption}
              >
                <Feather
                  name={item === 'list' ? 'list' : 'calendar'}
                  size={15}
                  color={selected ? colors.primaryForeground : colors.mutedForeground}
                />
                <Text style={[styles.segmentText, { color: selected ? colors.primaryForeground : colors.mutedForeground }]}>
                  {item === 'list' ? 'List' : 'Calendar'}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Button
          title="New event"
          icon="plus"
          onPress={() => router.push('/create-event')}
          testID="new-event-button"
        />
        {mode === 'list' ? (
          <View style={{ gap: 19 }}>
            <EventSection title="Upcoming" events={upcoming} emptyText="No upcoming events." />
            <EventSection title="In Progress" events={inProgress} emptyText="No active packing or return checklists." />
          </View>
        ) : (
          <CalendarView events={events} />
        )}
      </PageContent>
    </Screen>
  );
}

function EventSection({ title, events, emptyText }: { title: string; events: GearEvent[]; emptyText: string }) {
  const colors = useColors();
  return (
    <View style={{ gap: 10 }}>
      <SectionTitle
        title={title}
        action={<Text style={[styles.count, { color: colors.mutedForeground }]}>{events.length}</Text>}
      />
      {events.length === 0 ? (
        <Card style={{ paddingVertical: 13 }}>
          <Text style={[styles.emptyLine, { color: colors.mutedForeground }]}>{emptyText}</Text>
        </Card>
      ) : (
        <View style={{ gap: 10 }}>
          {events.map((event) => <EventCard key={event.id} event={event} />)}
        </View>
      )}
    </View>
  );
}

function EventCard({ event }: { event: GearEvent }) {
  const colors = useColors();
  const packed = event.gearSelections.reduce((sum, item) => sum + item.packedQuantity, 0);
  const returned = event.gearSelections.reduce((sum, item) => sum + item.returnedQuantity, 0);
  const total = event.gearSelections.reduce((sum, item) => sum + item.quantity, 0);
  const checked = event.status === 'returning' ? returned : packed;
  const label = event.result
    ? event.result === 'missing' ? 'Review result' : 'Ready to close'
    : event.status === 'packing' ? 'Packing'
      : event.status === 'out' ? 'Ready to go'
        : event.status === 'returning' ? 'Return check'
          : 'Upcoming';
  const showProgress = event.status !== 'upcoming' && !event.result;

  return (
    <Card style={styles.eventCard}>
      <Pressable
        accessibilityRole="button"
        onPress={() => routeToEvent(event)}
        style={styles.eventTap}
      >
        <View style={[styles.eventDate, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
          <Text style={[styles.eventDay, { color: colors.foreground }]}>{formatDate(event.date, { day: 'numeric' })}</Text>
          <Text style={[styles.eventMonth, { color: colors.mutedForeground }]}>{formatDate(event.date, { month: 'short' })}</Text>
        </View>
        <View style={styles.eventCopy}>
          <Text numberOfLines={1} style={[styles.eventTitle, { color: colors.foreground }]}>{event.title}</Text>
          <Text numberOfLines={1} style={[styles.eventMeta, { color: colors.mutedForeground }]}>
            {formatTime(event.time)}{event.venue ? ` · ${event.venue}` : ''}
          </Text>
          <Text style={[styles.eventMeta, { color: colors.mutedForeground }]}>{event.gearSelections.length} gear items</Text>
          {showProgress ? (
            <View style={{ marginTop: 5, gap: 5 }}>
              <ProgressBar value={checked} total={total} />
              <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
                {checked}/{total} {event.status === 'returning' ? 'returned' : 'packed'}
              </Text>
            </View>
          ) : null}
        </View>
        <View style={styles.eventStatus}>
          <Badge title={label} />
          <Feather name="chevron-right" size={15} color={colors.mutedForeground} />
        </View>
      </Pressable>
      <View style={styles.eventActions}>
        <IconButton
          icon="copy"
          label={`Duplicate gear from ${event.title}`}
          onPress={() => router.push({ pathname: '/create-event', params: { sourceEventId: event.id } })}
        />
        {event.status === 'upcoming' ? (
          <IconButton
            icon="edit-2"
            label={`Edit ${event.title}`}
            onPress={() => router.push({ pathname: '/create-event', params: { id: event.id } })}
          />
        ) : null}
      </View>
    </Card>
  );
}

function CalendarView({ events }: { events: GearEvent[] }) {
  const colors = useColors();
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(todayAsDateInput());
  const changeMonth = (offset: number) => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() + offset, 1));
  const panResponder = useMemo(
    () => PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 26 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.25,
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > 55) changeMonth(-1);
        if (gesture.dx < -55) changeMonth(1);
      },
    }),
    [],
  );
  const days = useMemo(() => {
    const first = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const mondayOffset = (first.getDay() + 6) % 7;
    const start = new Date(first.getFullYear(), first.getMonth(), 1 - mondayOffset);
    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
      const iso = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
      return { day, iso, inMonth: day.getMonth() === visibleMonth.getMonth() };
    });
  }, [visibleMonth]);
  const byDate = useMemo(() => {
    const map = new Map<string, GearEvent[]>();
    for (const event of events) map.set(event.date, [...(map.get(event.date) ?? []), event]);
    return map;
  }, [events]);
  const dateEvents = [...(byDate.get(selectedDate) ?? [])].sort((a, b) => a.time.localeCompare(b.time));
  const monthLabel = visibleMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const today = todayAsDateInput();

  return (
    <View style={{ gap: 12 }}>
      <Card style={styles.calendarCard}>
        <View style={styles.monthHeader}>
          <View>
            <Text style={[styles.monthTitle, { color: colors.foreground }]}>{monthLabel}</Text>
            <Text style={[styles.monthHint, { color: colors.mutedForeground }]}>Swipe to change month</Text>
          </View>
          <View style={styles.monthActions}>
            <IconButton icon="chevron-left" label="Previous month" onPress={() => changeMonth(-1)} />
            <IconButton icon="chevron-right" label="Next month" onPress={() => changeMonth(1)} />
            <Pressable onPress={() => { const now = new Date(); setVisibleMonth(new Date(now.getFullYear(), now.getMonth(), 1)); setSelectedDate(today); }}>
              <Text style={[styles.todayLink, { color: colors.foreground }]}>Today</Text>
            </Pressable>
          </View>
        </View>
        <Animated.View key={monthLabel} entering={FadeIn.duration(150)} {...panResponder.panHandlers}>
          <View style={styles.weekdays}>
            {weekdays.map((day, index) => (
              <Text key={`${day}-${index}`} style={[styles.weekday, { color: colors.mutedForeground }]}>{day}</Text>
            ))}
          </View>
          <View style={styles.calendarGrid}>
            {days.map(({ day, iso, inMonth }) => {
              const selected = iso === selectedDate;
              const isToday = iso === today;
              const eventCount = byDate.get(iso)?.length ?? 0;
              return (
                <Pressable
                  key={iso}
                  accessibilityRole="button"
                  accessibilityLabel={`${formatDate(iso, { month: 'long', day: 'numeric', year: 'numeric' })}${eventCount ? `, ${eventCount} events` : ''}`}
                  accessibilityState={{ selected }}
                  onPress={() => setSelectedDate(iso)}
                  style={styles.dayCell}
                >
                  <View style={[
                    styles.dayCircle,
                    isToday && !selected && { borderWidth: 1, borderColor: colors.foreground },
                  ]}>
                    {selected ? (
                      <Animated.View
                        entering={ZoomIn.duration(150)}
                        style={[StyleSheet.absoluteFill, { backgroundColor: colors.primary, borderRadius: 17 }]}
                      />
                    ) : null}
                    <Text style={[
                      styles.dayNumber,
                      { color: selected ? colors.primaryForeground : inMonth ? colors.foreground : colors.mutedForeground, opacity: inMonth ? 1 : 0.38 },
                    ]}>{day.getDate()}</Text>
                  </View>
                  <View style={styles.dayDots}>
                    {Array.from({ length: Math.min(eventCount, 3) }, (_, index) => (
                      <View key={index} style={[styles.eventDot, { backgroundColor: selected ? colors.primaryForeground : colors.foreground }]} />
                    ))}
                    {eventCount > 3 ? <Text style={[styles.moreDot, { color: selected ? colors.primaryForeground : colors.foreground }]}>+</Text> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </Card>

      <Animated.View key={selectedDate} entering={FadeInDown.duration(180)}>
      <Card style={styles.agendaCard}>
        <SectionTitle
          title={formatDate(selectedDate, { weekday: 'long', month: 'long', day: 'numeric' })}
          action={<Text style={[styles.count, { color: colors.mutedForeground }]}>{dateEvents.length}</Text>}
        />
        {dateEvents.length > 0 ? (
          <View style={{ gap: 9 }}>
            {dateEvents.map((event) => (
              <View key={event.id} style={[styles.agendaItem, { borderColor: colors.border }]}>
                <Pressable accessibilityRole="button" onPress={() => routeToEvent(event)} style={styles.agendaOpen}>
                  <Text style={[styles.agendaTime, { color: colors.mutedForeground }]}>{formatTime(event.time)}</Text>
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={[styles.agendaName, { color: colors.foreground }]}>{event.title}</Text>
                    <Text numberOfLines={1} style={[styles.agendaVenue, { color: colors.mutedForeground }]}>{event.venue || 'No venue added'}</Text>
                  </View>
                  <Feather name="chevron-right" size={15} color={colors.mutedForeground} />
                </Pressable>
                {event.status === 'upcoming' ? (
                  <IconButton icon="edit-2" label={`Edit ${event.title}`} onPress={() => router.push({ pathname: '/create-event', params: { id: event.id } })} />
                ) : null}
              </View>
            ))}
          </View>
        ) : (
          <EmptyState
            icon="calendar"
            title="Nothing planned"
            body="Choose another date or add an event here."
            action={<Button title="Add event on this date" icon="plus" onPress={() => router.push({ pathname: '/create-event', params: { date: selectedDate } })} />}
          />
        )}
      </Card>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  segment: { alignSelf: 'center', height: 48, borderWidth: 1, borderRadius: 999, padding: 3, flexDirection: 'row', overflow: 'hidden' },
  segmentThumbTrack: { position: 'absolute', top: 3, bottom: 3, left: 3 },
  segmentThumb: { flex: 1, borderRadius: 999 },
  segmentOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  segmentText: { fontSize: 12, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  count: { fontSize: 11, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  emptyLine: { fontSize: 12, paddingVertical: 5, fontFamily: 'Inter_400Regular' },
  eventCard: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 8, paddingLeft: 12, paddingRight: 8 },
  eventTap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 62 },
  eventDate: { width: 48, height: 52, borderWidth: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  eventDay: { fontSize: 18, fontWeight: '600', lineHeight: 20, fontFamily: 'Inter_600SemiBold' },
  eventMonth: { fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.55, fontFamily: 'Inter_600SemiBold' },
  eventCopy: { flex: 1, gap: 3 },
  eventTitle: { fontSize: 13, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  eventMeta: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  eventStatus: { alignItems: 'flex-end', gap: 5 },
  eventActions: { flexDirection: 'row', alignItems: 'center' },
  progressLabel: { fontSize: 9, fontFamily: 'Inter_400Regular' },
  calendarCard: { padding: 14, gap: 12 },
  monthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  monthTitle: { fontSize: 17, fontWeight: '600', letterSpacing: -0.3, fontFamily: 'Inter_600SemiBold' },
  monthHint: { marginTop: 3, fontSize: 10, fontFamily: 'Inter_400Regular' },
  monthActions: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  todayLink: { paddingHorizontal: 8, fontSize: 11, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  weekdays: { flexDirection: 'row', marginBottom: 4 },
  weekday: { flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '600', paddingVertical: 7, fontFamily: 'Inter_600SemiBold' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: `${100 / 7}%`, minHeight: 49, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 2 },
  dayCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  dayNumber: { fontSize: 12, fontWeight: '500', fontFamily: 'Inter_500Medium' },
  dayDots: { height: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2 },
  eventDot: { width: 3.5, height: 3.5, borderRadius: 3 },
  moreDot: { fontSize: 8, lineHeight: 8, fontWeight: '700', marginLeft: 1 },
  agendaCard: { gap: 10, padding: 14 },
  agendaItem: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, paddingBottom: 7 },
  agendaOpen: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48 },
  agendaTime: { fontSize: 10, minWidth: 49, fontFamily: 'Inter_500Medium' },
  agendaName: { fontSize: 12, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  agendaVenue: { fontSize: 10, marginTop: 3, fontFamily: 'Inter_400Regular' },
});
