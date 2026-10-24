import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useGearCheck } from '@/context/GearCheckContext';
import { Button, Card, EmptyState, Input, PageContent, Screen } from '@/components/ui';

export default function CategoriesScreen() {
  const colors = useColors();
  const { data, createCategory, deleteCategory } = useGearCheck();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const addCategory = () => {
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Enter a category name.');
      return;
    }
    if (!createCategory(cleanName)) {
      setError('A category with this name already exists.');
      return;
    }
    setName('');
    setError('');
  };

  const removeCategory = (id: string, categoryName: string) => {
    Alert.alert(
      'Delete category?',
      `Existing ${categoryName} gear will be moved to Other. Past event checklists will not change.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteCategory(id) },
      ],
    );
  };

  return (
    <Screen title="Categories" subtitle="Keep your inventory organized" back>
      <PageContent>
        <Card>
          <Text style={[styles.heading, { color: colors.foreground }]}>Create a category</Text>
          <Input
            label="Category name"
            value={name}
            onChangeText={(value) => { setName(value); setError(''); }}
            placeholder="e.g. Drone kit"
            maxLength={36}
            returnKeyType="done"
            onSubmitEditing={addCategory}
          />
          {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
          <Button title="Add category" icon="plus" onPress={addCategory} />
        </Card>
        <Text style={[styles.heading, { color: colors.foreground }]}>All categories</Text>
        {data.categories.length === 0 ? (
          <Card><EmptyState icon="layers" title="No categories" body="Add one above to start organizing gear." /></Card>
        ) : (
          <Card style={{ padding: 0, overflow: 'hidden', gap: 0 }}>
            {data.categories.map((category, index) => (
              <View key={category.id}>
                {index > 0 ? <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 16 }} /> : null}
                <View style={styles.row}>
                  <View style={[styles.iconBox, { backgroundColor: colors.secondary }]}>
                    <Feather name={category.icon as React.ComponentProps<typeof Feather>['name']} size={16} color={colors.mutedForeground} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.categoryName, { color: colors.foreground }]}>{category.name}</Text>
                    <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                      {data.gear.filter((item) => item.categoryId === category.id).length} gear items
                      {!category.isCustom ? ' · Default' : ''}
                    </Text>
                  </View>
                  {category.isCustom ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Delete ${category.name}`}
                      onPress={() => removeCategory(category.id, category.name)}
                      hitSlop={8}
                      style={{ padding: 8 }}
                    >
                      <Feather name="trash-2" size={17} color={colors.destructive} />
                    </Pressable>
                  ) : null}
                </View>
              </View>
            ))}
          </Card>
        )}
      </PageContent>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 15, fontWeight: '600' },
  error: { fontSize: 12 },
  row: { minHeight: 62, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  categoryName: { fontSize: 14, fontWeight: '600' },
  meta: { marginTop: 4, fontSize: 11 },
});
