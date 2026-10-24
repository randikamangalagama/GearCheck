import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { Button, Card, Chip, Input, PageContent, Screen } from '@/components/ui';
import { useGearCheck } from '@/context/GearCheckContext';
import { useColors } from '@/hooks/useColors';
import type { GearInput } from '@/types';

export default function GearFormScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ id?: string }>();
  const { data, createGear, updateGear } = useGearCheck();
  const existing = data.gear.find((item) => item.id === params.id);
  const [name, setName] = useState(existing?.name ?? '');
  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? data.categories[0]?.id ?? 'other');
  const [quantity, setQuantity] = useState(String(existing?.quantity ?? 1));
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [error, setError] = useState('');
  const isEdit = Boolean(existing);

  const save = () => {
    const cleanName = name.trim();
    const parsedQuantity = Number(quantity);
    if (!cleanName) {
      setError('Enter a name for this gear item.');
      return;
    }
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1 || parsedQuantity > 999) {
      setError('Quantity must be a whole number from 1 to 999.');
      return;
    }
    const input: GearInput = {
      name: cleanName,
      categoryId,
      quantity: parsedQuantity,
      notes: notes.trim(),
    };
    if (isEdit && existing) updateGear(existing.id, input);
    else createGear(input);
    router.back();
  };

  return (
    <Screen title={isEdit ? 'Edit gear' : 'Add gear'} subtitle="Add an item to your studio inventory" back scroll={false}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={{ paddingBottom: 34 }}
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}
      >
        <PageContent>
          <Card style={{ gap: 15 }}>
            <Input
              label="Item name"
              value={name}
              onChangeText={(value) => { setName(value); setError(''); }}
              placeholder="e.g. Sony A7 IV"
              autoCapitalize="words"
              autoFocus={!isEdit}
              maxLength={80}
            />
            <View style={{ gap: 9 }}>
              <Text style={[styles.label, { color: colors.foreground }]}>Category</Text>
              <View style={styles.categoryList}>
                {data.categories.map((category) => (
                  <Chip
                    key={category.id}
                    title={category.name}
                    selected={categoryId === category.id}
                    onPress={() => setCategoryId(category.id)}
                  />
                ))}
                <Chip title="Add category" icon="plus" onPress={() => router.push('/categories')} />
              </View>
            </View>
            <Input
              label="Quantity"
              value={quantity}
              onChangeText={(value) => { setQuantity(value.replace(/[^0-9]/g, '')); setError(''); }}
              keyboardType="number-pad"
              placeholder="1"
              maxLength={3}
              accessibilityLabel="Quantity"
            />
            <Input
              label="Notes (optional)"
              value={notes}
              onChangeText={setNotes}
              placeholder="Serial, condition, or storage location"
              multiline
              maxLength={240}
            />
            {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
          </Card>
          <Button title={isEdit ? 'Save changes' : 'Add to inventory'} icon={isEdit ? 'check' : 'plus'} onPress={save} testID="save-gear-button" />
          {isEdit ? (
            <View style={styles.editNote}>
              <Feather name="info" size={14} color={colors.mutedForeground} />
              <Text style={[styles.note, { color: colors.mutedForeground }]}>Past event checklists keep their original item details.</Text>
            </View>
          ) : null}
        </PageContent>
      </KeyboardAwareScrollViewCompat>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600' },
  categoryList: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  error: { fontSize: 12 },
  editNote: { flexDirection: 'row', gap: 7, alignItems: 'center', paddingHorizontal: 3 },
  note: { fontSize: 11, flex: 1 },
});
