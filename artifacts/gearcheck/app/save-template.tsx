import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { Button, Card, Input, PageContent, Screen } from '@/components/ui';
import { useGearCheck } from '@/context/GearCheckContext';
import { useColors } from '@/hooks/useColors';

export default function SaveTemplateScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ gearIds?: string }>();
  const { createTemplate } = useGearCheck();
  const gearIds = typeof params.gearIds === 'string' ? params.gearIds.split(',').filter(Boolean) : [];
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const save = () => {
    if (!name.trim()) {
      setError('Enter a name for this template.');
      return;
    }
    if (!createTemplate(name, gearIds)) {
      setError('Choose at least one gear item before saving.');
      return;
    }
    router.back();
  };

  return (
    <Screen title="Save template" subtitle={`${gearIds.length} selected gear items`} back scroll={false}>
      <KeyboardAwareScrollViewCompat contentContainerStyle={{ paddingBottom: 34 }} keyboardShouldPersistTaps="handled" bottomOffset={24}>
        <PageContent>
          <Card>
            <Input
              label="Template name"
              value={name}
              onChangeText={(value) => { setName(value); setError(''); }}
              placeholder="e.g. Wedding full set"
              autoCapitalize="words"
              autoFocus
              maxLength={60}
            />
            {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
            <Text style={[styles.note, { color: colors.mutedForeground }]}>
              Templates remember gear items, not event details or quantities. Current inventory quantities are used when you reuse one.
            </Text>
          </Card>
          <Button title="Save template" icon="check" onPress={save} />
        </PageContent>
      </KeyboardAwareScrollViewCompat>
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { fontSize: 12 },
  note: { fontSize: 11, lineHeight: 17 },
});
