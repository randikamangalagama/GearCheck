import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ChecklistView } from '@/components/ChecklistView';

export default function ReturnChecklistScreen() {
  const params = useLocalSearchParams<{ eventId?: string }>();
  return <ChecklistView eventId={String(params.eventId ?? '')} stage="return" />;
}
