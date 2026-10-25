import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Card, Chip, EmptyState, IconButton, Input, PageContent, Screen } from '@/components/ui';
import { useGearCheck } from '@/context/GearCheckContext';
import { useColors } from '@/hooks/useColors';
import type { EventDraft, GearSelection } from '@/types';

export default function SelectGearScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ draft?: string; initialGearIds?: string }>();
  const { data, createEvent } = useGearCheck();
  const draft = useMemo<EventDraft>(() => {
    try {
      const value = params.draft;
      return typeof value === 'string' ? JSON.parse(value) as EventDraft : { title: '', date: '', time: '17:00', venue: '', notes: '' };
    } catch {
      return { title: '', date: '', time: '17:00', venue: '', notes: '' };
    }
  }, [params.draft]);
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    const initial = typeof params.initialGearIds === 'string' ? params.initialGearIds.split(',') : [];
    return initial.filter((id) => data.gear.some((item) => item.id === id));
  });
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [starting, setStarting] = useState(false);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return data.gear.filter((item) => {
      const category = data.categories.find((entry) => entry.id === item.categoryId);
      const matchesCategory = categoryFilter === 'all' || item.categoryId === categoryFilter;
      const matchesSearch = !term || item.name.toLowerCase().includes(term) || category?.name.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [categoryFilter, data.categories, data.gear, query]);
  const selectedUnits = data.gear
    .filter((item) => selectedIds.includes(item.id))
    .reduce((sum, item) => sum + item.quantity, 0);

  const toggleGear = (id: string) => {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };
  const toggleCategory = (categoryId: string) => {
    const ids = data.gear.filter((item) => item.categoryId === categoryId).map((item) => item.id);
    const allSelected = ids.length > 0 && ids.every((id) => selectedIds.includes(id));
    setSelectedIds((current) =>
      allSelected ? current.filter((id) => !ids.includes(id)) : [...new Set([...current, ...ids])],
    );
  };
  const startPacking = async () => {
    if (selectedIds.length === 0 || starting) return;
    const selections: GearSelection[] = data.gear
      .filter((gear) => selectedIds.includes(gear.id))
      .map((gear) => ({
        gearId: gear.id,
        name: gear.name,
        categoryId: gear.categoryId,
        categoryName: data.categories.find((category) => category.id === gear.categoryId)?.name ?? 'Other',
        quantity: gear.quantity,
        packedQuantity: 0,
        returnedQuantity: 0,
        notes: gear.notes,
      }));
    setStarting(true);
    try {
      const eventId = await createEvent(draft, selections);
      router.replace({ pathname: '/pack-checklist', params: { eventId } });
    } finally {
      setStarting(false);
    }
  };

  return (
    <Screen
      title="Select gear"
      subtitle={draft.title ? `For ${draft.title}` : 'Choose the equipment for this event'}
      back
      right={<IconButton icon="copy" label="Save selection as template" onPress={() => {
        if (selectedIds.length === 0) return;
        router.push({ pathname: '/save-template', params: { gearIds: selectedIds.join(',') } });
      }} />}
    >
      <PageContent>
        <Card style={styles.summary}>
          <View style={[styles.summaryIcon, { backgroundColor: colors.accent }]}>
            <Feather name="package" size={17} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.summaryTitle, { color: colors.foreground }]}>{selectedIds.length} selected</Text>
            <Text style={[styles.summaryBody, { color: colors.mutedForeground }]}>{selectedUnits} gear units for the checklist</Text>
          </View>
          <Pressable onPress={() => router.push('/templates')} hitSlop={8}>
            <Text style={[styles.templateLink, { color: colors.primary }]}>Templates</Text>
          </Pressable>
        </Card>
        {data.templates.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7 }}>
            {data.templates.map((template) => (
              <Chip
                key={template.id}
                title={template.name}
                icon="copy"
                onPress={() => setSelectedIds(template.gearIds.filter((id) => data.gear.some((item) => item.id === id)))}
              />
            ))}
          </ScrollView>
        ) : null}
        <Input
          label="Search gear"
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name or category"
          autoCapitalize="none"
          returnKeyType="search"
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7 }}>
          <Chip title="All" selected={categoryFilter === 'all'} onPress={() => setCategoryFilter('all')} />
          {data.categories.map((category) => (
            <Chip
              key={category.id}
              title={category.name}
              selected={categoryFilter === category.id}
              onPress={() => setCategoryFilter(category.id)}
            />
          ))}
        </ScrollView>
        {data.gear.length === 0 ? (
          <Card>
            <EmptyState
              icon="package"
              title="Add gear first"
              body="Your event checklist is built from the studio inventory."
              action={<Button title="Add gear" icon="plus" onPress={() => router.push('/gear-form')} />}
            />
          </Card>
        ) : filtered.length === 0 ? (
          <Card><EmptyState icon="search" title="No gear found" body="Try a different search or category." /></Card>
        ) : (
          <View style={{ gap: 14 }}>
            {data.categories.map((category) => {
              const items = filtered.filter((item) => item.categoryId === category.id);
              if (items.length === 0) return null;
              const categoryGearIds = data.gear.filter((item) => item.categoryId === category.id).map((item) => item.id);
              const allCategorySelected = categoryGearIds.length > 0 && categoryGearIds.every((id) => selectedIds.includes(id));
              return (
                <View key={category.id} style={{ gap: 7 }}>
                  <View style={styles.categoryHeader}>
                    <Text style={[styles.categoryTitle, { color: colors.foreground }]}>{category.name}</Text>
                    <Pressable onPress={() => toggleCategory(category.id)} hitSlop={8}>
                      <Text style={[styles.selectAll, { color: colors.primary }]}>
                        {allCategorySelected ? 'Deselect all' : 'Select all'}
                      </Text>
                    </Pressable>
                  </View>
                  <Card style={{ padding: 0, overflow: 'hidden', gap: 0 }}>
                    {items.map((item, index) => (
                      <View key={item.id}>
                        {index > 0 ? <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 14 }} /> : null}
                        <Pressable
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: selectedIds.includes(item.id) }}
                          onPress={() => toggleGear(item.id)}
                          style={({ pressed }) => [styles.gearRow, { opacity: pressed ? 0.7 : 1 }]}
                        >
                          <View style={[styles.gearGlyph, { backgroundColor: colors.secondary }]}>
                            <Feather name={category.icon as React.ComponentProps<typeof Feather>['name']} size={16} color={colors.mutedForeground} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.gearName, { color: colors.foreground }]}>{item.name}</Text>
                            <Text style={[styles.gearQuantity, { color: colors.mutedForeground }]}>
                              {item.quantity} {item.quantity === 1 ? 'unit' : 'units'}
                            </Text>
                          </View>
                          <View style={[styles.checkbox, {
                            borderColor: selectedIds.includes(item.id) ? colors.primary : colors.border,
                            backgroundColor: selectedIds.includes(item.id) ? colors.primary : 'transparent',
                          }]}>
                            {selectedIds.includes(item.id) ? <Feather name="check" size={14} color={colors.primaryForeground} /> : null}
                          </View>
                        </Pressable>
                      </View>
                    ))}
                  </Card>
                </View>
              );
            })}
          </View>
        )}
        <Button
          title={starting ? 'Creating checklist…' : `Start packing${selectedUnits > 0 ? ` · ${selectedUnits}` : ''}`}
          icon="arrow-right"
          loading={starting}
          disabled={selectedIds.length === 0 || !draft.title || !draft.date}
          onPress={() => void startPacking()}
          testID="start-packing-button"
        />
        {starting ? <ActivityIndicator color={colors.primary} /> : null}
      </PageContent>
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  summaryTitle: { fontSize: 14, fontWeight: '600' },
  summaryBody: { fontSize: 11, marginTop: 4 },
  templateLink: { fontSize: 12, fontWeight: '600' },
  categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 2 },
  categoryTitle: { fontSize: 13, fontWeight: '600' },
  selectAll: { fontSize: 11, fontWeight: '600' },
  gearRow: { minHeight: 62, paddingHorizontal: 12, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 10 },
  gearGlyph: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  gearName: { fontSize: 13, fontWeight: '600' },
  gearQuantity: { fontSize: 11, marginTop: 3 },
  checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
