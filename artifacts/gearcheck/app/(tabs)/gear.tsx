import React, { useMemo, useRef, useState } from 'react';
import { Alert, Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Button, Card, EmptyState, IconButton, Input, PageContent, Screen, SectionTitle } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { useGearCheck } from '@/context/GearCheckContext';
import type { Category, GearItem } from '@/types';

function confirmDelete(name: string, onDelete: () => void) {
  Alert.alert('Delete gear?', `${name} will be removed from your inventory. Past event records will stay unchanged.`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: onDelete },
  ]);
}

export default function GearScreen() {
  const colors = useColors();
  const { data, deleteGear } = useGearCheck();
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectionMode = selectedIds.length > 0;
  const filteredGear = useMemo(
    () =>
      data.gear.filter((item) => {
        const category = data.categories.find((entry) => entry.id === item.categoryId);
        const term = search.trim().toLowerCase();
        return !term || item.name.toLowerCase().includes(term) || category?.name.toLowerCase().includes(term);
      }),
    [data.categories, data.gear, search],
  );
  const toggleSelected = (item: GearItem) => {
    setSelectedIds((current) =>
      current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id],
    );
  };
  const deleteSelected = () => {
    Alert.alert(
      'Delete selected gear?',
      `${selectedIds.length} ${selectedIds.length === 1 ? 'item' : 'items'} will be removed. Past event records will remain unchanged.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            selectedIds.forEach(deleteGear);
            setSelectedIds([]);
          },
        },
      ],
    );
  };

  return (
    <Screen
      title="Gear"
      subtitle={`${data.gear.length} ${data.gear.length === 1 ? 'item' : 'items'} in your inventory`}
      right={<IconButton icon="settings" label="Manage categories" onPress={() => router.push('/categories')} />}
    >
      <PageContent>
        <Button title="Add gear" icon="plus" onPress={() => router.push('/gear-form')} testID="add-gear-button" />
        {selectionMode ? (
          <Card style={styles.selectionBar}>
            <Text style={[styles.selectionText, { color: colors.foreground }]}>{selectedIds.length} selected</Text>
            <Pressable onPress={() => setSelectedIds([])} hitSlop={8}>
              <Text style={[styles.selectionAction, { color: colors.primary }]}>Clear</Text>
            </Pressable>
            <Button title="Delete" icon="trash-2" variant="danger" onPress={deleteSelected} style={{ minHeight: 40, paddingHorizontal: 12 }} />
          </Card>
        ) : null}
        <Input
          label="Search inventory"
          value={search}
          onChangeText={setSearch}
          placeholder="Find a camera, lens, cable..."
          autoCapitalize="none"
          returnKeyType="search"
        />
        {data.gear.length > 0 && !selectionMode ? (
          <Text style={[styles.gestureHint, { color: colors.mutedForeground }]}>Swipe an item left for actions, or long-press to select several.</Text>
        ) : null}
        {data.gear.length === 0 ? (
          <Card>
            <EmptyState
              icon="package"
              title="Start your gear inventory"
              body="Add the equipment your studio takes to events. You can organize it by category and track quantities."
              action={<Button title="Add your first item" icon="plus" onPress={() => router.push('/gear-form')} />}
            />
          </Card>
        ) : filteredGear.length === 0 ? (
          <Card><EmptyState icon="search" title="No matches" body="Try another name or category." /></Card>
        ) : (
          <View style={{ gap: 16 }}>
            {data.categories.map((category) => {
              const items = filteredGear.filter((item) => item.categoryId === category.id);
              if (items.length === 0) return null;
              return (
                <GearCategory
                  key={category.id}
                  category={category}
                  items={items}
                  onEdit={(item) => router.push({ pathname: '/gear-form', params: { id: item.id } })}
                  onDelete={(item) => confirmDelete(item.name, () => deleteGear(item.id))}
                  selectionMode={selectionMode}
                  selectedIds={selectedIds}
                  onSelect={toggleSelected}
                  swipeEnabled={!selectionMode}
                />
              );
            })}
            {filteredGear.some((item) => !data.categories.some((category) => category.id === item.categoryId)) ? (
              <GearCategory
                category={{ id: 'archived', name: 'Uncategorized', icon: 'box', isCustom: false }}
                items={filteredGear.filter((item) => !data.categories.some((category) => category.id === item.categoryId))}
                onEdit={(item) => router.push({ pathname: '/gear-form', params: { id: item.id } })}
                onDelete={(item) => confirmDelete(item.name, () => deleteGear(item.id))}
                selectionMode={selectionMode}
                selectedIds={selectedIds}
                onSelect={toggleSelected}
                swipeEnabled={!selectionMode}
              />
            ) : null}
          </View>
        )}
        <Pressable style={styles.categoryLink} onPress={() => router.push('/categories')}>
          <Feather name="layers" size={16} color={colors.primary} />
          <Text style={[styles.categoryLinkText, { color: colors.primary }]}>Manage categories</Text>
          <Feather name="chevron-right" size={16} color={colors.primary} />
        </Pressable>
      </PageContent>
    </Screen>
  );
}

function GearCategory({
  category,
  items,
  onEdit,
  onDelete,
  selectionMode,
  selectedIds,
  onSelect,
  swipeEnabled,
}: {
  category: Category;
  items: GearItem[];
  onEdit: (item: GearItem) => void;
  onDelete: (item: GearItem) => void;
  selectionMode: boolean;
  selectedIds: string[];
  onSelect: (item: GearItem) => void;
  swipeEnabled: boolean;
}) {
  const colors = useColors();
  return (
    <View style={{ gap: 8 }}>
      <SectionTitle
        title={category.name}
        action={<Text style={[styles.categoryCount, { color: colors.mutedForeground }]}>{items.length}</Text>}
      />
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {items.map((item, index) => (
          <View key={item.id}>
            {index > 0 ? <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 16 }} /> : null}
            <GearSwipeRow
              item={item}
              category={category}
              selectionMode={selectionMode}
              selected={selectedIds.includes(item.id)}
              swipeEnabled={swipeEnabled}
              onEdit={() => onEdit(item)}
              onDelete={() => onDelete(item)}
              onSelect={() => onSelect(item)}
            />
          </View>
        ))}
      </Card>
    </View>
  );
}

function GearSwipeRow({
  item,
  category,
  selectionMode,
  selected,
  swipeEnabled,
  onEdit,
  onDelete,
  onSelect,
}: {
  item: GearItem;
  category: Category;
  selectionMode: boolean;
  selected: boolean;
  swipeEnabled: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSelect: () => void;
}) {
  const colors = useColors();
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpen = useRef(false);
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          swipeEnabled && gesture.dx < -12 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.2,
        onPanResponderMove: (_, gesture) => {
          const start = isOpen.current ? -104 : 0;
          translateX.setValue(Math.max(-104, Math.min(0, start + gesture.dx)));
        },
        onPanResponderRelease: (_, gesture) => {
          isOpen.current = isOpen.current ? gesture.dx <= 38 : gesture.dx < -48;
          Animated.spring(translateX, {
            toValue: isOpen.current ? -104 : 0,
            useNativeDriver: true,
            stiffness: 230,
            damping: 24,
          }).start();
        },
        onPanResponderTerminate: () => {
          isOpen.current = false;
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        },
      }),
    [swipeEnabled, translateX],
  );

  const handlePress = () => {
    if (isOpen.current) {
      isOpen.current = false;
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
    } else if (selectionMode) {
      onSelect();
    } else {
      onEdit();
    }
  };

  return (
    <View style={styles.swipeFrame}>
      {swipeEnabled ? (
        <View style={[styles.swipeActions, { backgroundColor: colors.secondary }]}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${item.name}`} onPress={onEdit} style={styles.swipeAction}>
            <Feather name="edit-2" size={16} color={colors.foreground} />
            <Text style={[styles.swipeActionText, { color: colors.foreground }]}>Edit</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${item.name}`} onPress={onDelete} style={styles.swipeAction}>
            <Feather name="trash-2" size={16} color={colors.destructive} />
            <Text style={[styles.swipeActionText, { color: colors.destructive }]}>Delete</Text>
          </Pressable>
        </View>
      ) : null}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.gearRow,
          {
            backgroundColor: colors.card,
            transform: [{ translateX: swipeEnabled ? translateX : 0 }],
          },
        ]}
      >
        <Pressable
          accessibilityRole={selectionMode ? 'checkbox' : 'button'}
          accessibilityState={selectionMode ? { checked: selected } : undefined}
          onPress={handlePress}
          onLongPress={() => { if (!selectionMode) onSelect(); }}
          delayLongPress={380}
          style={({ pressed }) => [styles.gearBody, { opacity: pressed ? 0.72 : 1 }]}
        >
          <View style={[styles.gearIcon, { backgroundColor: colors.secondary }]}>
            <Feather name={(category.icon || 'package') as React.ComponentProps<typeof Feather>['name']} size={17} color={colors.mutedForeground} />
          </View>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={[styles.gearName, { color: colors.foreground }]}>{item.name}</Text>
            <Text style={[styles.gearMeta, { color: colors.mutedForeground }]}>
              {item.quantity > 1 ? `${item.quantity} units` : '1 unit'}
              {item.notes ? ` · ${item.notes}` : ''}
            </Text>
          </View>
          {selectionMode ? (
            <View style={[
              styles.selectionCheck,
              {
                borderColor: selected ? colors.primary : colors.border,
                backgroundColor: selected ? colors.primary : 'transparent',
              },
            ]}>
              {selected ? <Feather name="check" size={13} color={colors.primaryForeground} /> : null}
            </View>
          ) : (
            <Feather name="chevron-left" size={14} color={colors.mutedForeground} />
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  categoryCount: { fontSize: 12, fontWeight: '600' },
  gearRow: { minHeight: 69, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  gearBody: { flex: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8 },
  swipeFrame: { position: 'relative', overflow: 'hidden' },
  swipeActions: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 104, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  swipeAction: { minWidth: 50, height: 58, alignItems: 'center', justifyContent: 'center', gap: 4 },
  swipeActionText: { fontSize: 9, fontWeight: '600' },
  gearIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  gearName: { fontSize: 14, fontWeight: '600' },
  gearMeta: { marginTop: 4, fontSize: 11 },
  categoryLink: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 9 },
  categoryLinkText: { fontSize: 13, fontWeight: '600', flex: 1 },
  selectionBar: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 10 },
  selectionText: { flex: 1, fontSize: 13, fontWeight: '600' },
  selectionAction: { fontSize: 12, fontWeight: '600' },
  selectionCheck: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  gestureHint: { fontSize: 11, marginTop: -8 },
});
