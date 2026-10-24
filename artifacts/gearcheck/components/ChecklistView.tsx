import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AnimatedCheckbox, Badge, Button, Card, EmptyState, PageContent, ProgressBar, Screen } from '@/components/ui';
import { useGearCheck } from '@/context/GearCheckContext';
import { useColors } from '@/hooks/useColors';
import type { GearSelection } from '@/types';

export function ChecklistView({ eventId, stage }: { eventId: string; stage: 'pack' | 'return' }) {
  const colors = useColors();
  const {
    data,
    setPackedQuantity,
    setReturnedQuantity,
    completeReturn,
  } = useGearCheck();
  const event = data.events.find((item) => item.id === eventId);
  const total = event?.gearSelections.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const counted = event?.gearSelections.reduce(
    (sum, item) => sum + (stage === 'pack' ? item.packedQuantity : item.returnedQuantity),
    0,
  ) ?? 0;
  const complete = total > 0 && counted === total;
  const percentage = total > 0 ? Math.round((counted / total) * 100) : 0;

  const returnResult = () => {
    completeReturn(eventId);
    router.replace({ pathname: '/result', params: { eventId } });
  };

  if (!event) {
    return (
      <Screen title="Checklist" subtitle="Event not found" back>
        <PageContent>
          <Card><EmptyState icon="alert-circle" title="This event is unavailable" body="It may have been removed from this device." /></Card>
        </PageContent>
      </Screen>
    );
  }

  return (
    <Screen
      title={stage === 'pack' ? 'Pack checklist' : 'Return checklist'}
      subtitle={event.title}
      back
    >
      <PageContent>
        <Card style={styles.progressCard}>
          <View style={styles.progressTop}>
            <View>
              <Text style={[styles.progressCount, { color: colors.foreground }]}>{counted} of {total}</Text>
              <Text style={[styles.progressCaption, { color: colors.mutedForeground }]}>
                {stage === 'pack' ? 'gear units packed' : 'gear units returned'}
              </Text>
            </View>
            <Text style={[styles.percent, { color: colors.primary }]}>{percentage}%</Text>
          </View>
          <ProgressBar value={counted} total={total} />
        </Card>

        {stage === 'pack' && complete ? (
          <Card style={[styles.notice, { backgroundColor: colors.accent, borderColor: colors.accent }]}>
            <View style={[styles.noticeIcon, { backgroundColor: colors.primary }]}>
              <Feather name="check" size={18} color={colors.primaryForeground} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.noticeTitle, { color: colors.foreground }]}>Ready to go</Text>
              <Text style={[styles.noticeBody, { color: colors.mutedForeground }]}>Every selected item is packed for {event.title}.</Text>
            </View>
          </Card>
        ) : null}

        {stage === 'return' && complete ? (
          <Card style={[styles.notice, { backgroundColor: `${colors.success}14`, borderColor: `${colors.success}30` }]}>
            <View style={[styles.noticeIcon, { backgroundColor: colors.success }]}>
              <Feather name="check" size={18} color={colors.primaryForeground} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.noticeTitle, { color: colors.foreground }]}>All items checked in</Text>
              <Text style={[styles.noticeBody, { color: colors.mutedForeground }]}>Finish the check to close out this event.</Text>
            </View>
          </Card>
        ) : null}

        <View style={{ gap: 9 }}>
          {event.gearSelections.map((item) => (
            <ChecklistRow
              key={item.gearId}
              item={item}
              stage={stage}
              onSetCount={(nextCount) =>
                stage === 'pack'
                  ? setPackedQuantity(event.id, item.gearId, nextCount)
                  : setReturnedQuantity(event.id, item.gearId, nextCount)
              }
            />
          ))}
        </View>

        <Button
          title={stage === 'pack' ? (complete ? 'Packing complete' : 'Save packing progress') : 'Finish return check'}
          icon={stage === 'return' ? 'check' : complete ? 'check-circle' : 'save'}
          variant={stage === 'return' && !complete ? 'outline' : 'primary'}
          onPress={() => {
            if (stage === 'return') returnResult();
            else router.replace({ pathname: '/event-details', params: { eventId: event.id } });
          }}
          testID={stage === 'pack' ? 'finish-packing-button' : 'finish-return-button'}
        />
        {stage === 'return' && !complete ? (
          <Text style={[styles.warningHint, { color: colors.mutedForeground }]}>
            Unchecked units will be listed as missing on the final result.
          </Text>
        ) : null}
      </PageContent>
    </Screen>
  );
}

function ChecklistRow({
  item,
  stage,
  onSetCount,
}: {
  item: GearSelection;
  stage: 'pack' | 'return';
  onSetCount: (count: number) => void;
}) {
  const colors = useColors();
  const count = stage === 'pack' ? item.packedQuantity : item.returnedQuantity;
  const isChecked = count === item.quantity;
  const actionLabel = stage === 'pack' ? 'packed' : 'returned';

  const toggleWholeItem = () => onSetCount(isChecked ? 0 : item.quantity);

  return (
    <Card style={styles.gearCard}>
      <AnimatedCheckbox
        checked={isChecked}
        label={`${isChecked ? 'Unmark' : 'Mark'} ${item.name} ${actionLabel}`}
        onPress={toggleWholeItem}
      />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[styles.gearName, { color: colors.foreground }]}>{item.name}</Text>
        <View style={styles.gearSubline}>
          <Text style={[styles.gearMeta, { color: colors.mutedForeground }]}>{item.categoryName}</Text>
          <Badge title={`${count}/${item.quantity}`} tone={isChecked ? 'success' : 'neutral'} />
        </View>
        {item.notes ? <Text style={[styles.gearMeta, { color: colors.mutedForeground }]} numberOfLines={2}>{item.notes}</Text> : null}
        {item.quantity > 1 ? (
          <View style={styles.quantityActions}>
            <CountButton
              icon="minus"
              label={`Remove one ${actionLabel} ${item.name}`}
              disabled={count <= 0}
              onPress={() => onSetCount(count - 1)}
            />
            <Text style={[styles.quantityText, { color: colors.foreground }]}>{count} / {item.quantity} units</Text>
            <CountButton
              icon="plus"
              label={`Add one ${actionLabel} ${item.name}`}
              disabled={count >= item.quantity}
              onPress={() => onSetCount(count + 1)}
            />
          </View>
        ) : null}
      </View>
    </Card>
  );
}

function CountButton({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: 'minus' | 'plus';
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={5}
      style={({ pressed }) => [
        styles.countButton,
        { backgroundColor: colors.secondary, opacity: disabled ? 0.4 : pressed ? 0.65 : 1 },
      ]}
    >
      <Feather name={icon} size={14} color={colors.foreground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  progressCard: { gap: 13 },
  progressTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressCount: { fontSize: 20, fontWeight: '700' },
  progressCaption: { fontSize: 11, marginTop: 3 },
  percent: { fontSize: 17, fontWeight: '700' },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  noticeIcon: { width: 36, height: 36, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  noticeTitle: { fontSize: 14, fontWeight: '700' },
  noticeBody: { marginTop: 4, fontSize: 11, lineHeight: 17 },
  gearCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, paddingVertical: 11, paddingHorizontal: 10 },
  gearName: { fontSize: 14, fontWeight: '600', paddingTop: 5 },
  gearSubline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  gearMeta: { fontSize: 11, lineHeight: 16 },
  quantityActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 5 },
  countButton: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  quantityText: { fontSize: 11, fontWeight: '600', flex: 1, textAlign: 'center' },
  warningHint: { fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: -6 },
});
