import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Button, Card, EmptyState, PageContent, Screen } from '@/components/ui';
import { useGearCheck } from '@/context/GearCheckContext';
import { useColors } from '@/hooks/useColors';

export default function TemplatesScreen() {
  const colors = useColors();
  const { data, deleteTemplate } = useGearCheck();

  const confirmDelete = (id: string, name: string) => {
    Alert.alert('Delete template?', `“${name}” will be removed. Existing events will not change.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTemplate(id) },
    ]);
  };

  return (
    <Screen title="Event templates" subtitle="Reuse a gear list for common assignments" back>
      <PageContent>
        {data.templates.length === 0 ? (
          <Card>
            <EmptyState
              icon="copy"
              title="No templates saved"
              body="Save a gear selection as a template while creating an event, then reuse it here."
              action={<Button title="Create an event" icon="plus" onPress={() => router.push('/create-event')} />}
            />
          </Card>
        ) : (
          <Card style={{ padding: 0, overflow: 'hidden', gap: 0 }}>
            {data.templates.map((template, index) => {
              const validGear = template.gearIds.filter((id) => data.gear.some((item) => item.id === id));
              return (
                <View key={template.id}>
                  {index > 0 ? <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 15 }} /> : null}
                  <View style={styles.row}>
                    <View style={[styles.icon, { backgroundColor: colors.accent }]}>
                      <Feather name="copy" size={17} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.name, { color: colors.foreground }]}>{template.name}</Text>
                      <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                        {validGear.length} gear {validGear.length === 1 ? 'item' : 'items'}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Delete ${template.name}`}
                      onPress={() => confirmDelete(template.id, template.name)}
                      hitSlop={8}
                      style={{ padding: 8 }}
                    >
                      <Feather name="trash-2" size={17} color={colors.destructive} />
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </Card>
        )}
        <Button title="Start a new event" icon="plus" variant="outline" onPress={() => router.push('/create-event')} />
      </PageContent>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 67, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  icon: { height: 36, width: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 14, fontWeight: '600' },
  meta: { fontSize: 11, marginTop: 4 },
});
