import React, { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { DEFAULT_CATEGORIES, freshData, useAppDataStore } from '@/store/appData';
import {
  cancelReminderIds,
  requestReminderPermission,
  scheduleEventReminders,
} from '@/utils/notifications';
import type {
  AppData,
  Category,
  EventDraft,
  GearEvent,
  GearInput,
  GearItem,
  GearSelection,
  MissingGearItem,
  ThemeMode,
} from '@/types';

export { DEFAULT_CATEGORIES };

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface GearCheckContextValue {
  data: AppData;
  isHydrated: boolean;
  storageError: string | null;
  systemScheme: 'light' | 'dark';
  createGear: (input: GearInput) => void;
  updateGear: (id: string, input: GearInput) => void;
  deleteGear: (id: string) => void;
  createCategory: (name: string) => boolean;
  deleteCategory: (id: string) => void;
  createEvent: (draft: EventDraft, selections: GearSelection[]) => Promise<string>;
  updateEvent: (id: string, draft: EventDraft) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  setPackedQuantity: (eventId: string, gearId: string, quantity: number) => void;
  setReturnedQuantity: (eventId: string, gearId: string, quantity: number) => void;
  startReturn: (eventId: string) => void;
  completeReturn: (eventId: string) => MissingGearItem[];
  createTemplate: (name: string, gearIds: string[]) => boolean;
  deleteTemplate: (id: string) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setRemindersEnabled: (enabled: boolean) => Promise<boolean>;
  clearAllData: () => Promise<void>;
}

const GearCheckContext = createContext<GearCheckContextValue | null>(null);

export function GearCheckProvider({ children }: { children: ReactNode }) {
  const data = useAppDataStore((state) => state.data);
  const setData = useAppDataStore((state) => state.setData);
  const isHydrated = useAppDataStore((state) => state.isHydrated);
  const storageError = useAppDataStore((state) => state.storageError);
  const setStorageError = useAppDataStore((state) => state.setStorageError);
  const nativeScheme = useColorScheme();
  const systemScheme = nativeScheme === 'dark' ? 'dark' : 'light';

  const createGear = useCallback((input: GearInput) => {
    const item: GearItem = {
      ...input,
      id: createId('gear'),
      createdAt: new Date().toISOString(),
    };
    setData((current) => ({ ...current, gear: [...current.gear, item] }));
  }, []);

  const updateGear = useCallback((id: string, input: GearInput) => {
    setData((current) => ({
      ...current,
      gear: current.gear.map((item) => (item.id === id ? { ...item, ...input } : item)),
    }));
  }, []);

  const deleteGear = useCallback((id: string) => {
    setData((current) => ({
      ...current,
      gear: current.gear.filter((item) => item.id !== id),
      templates: current.templates.map((template) => ({
        ...template,
        gearIds: template.gearIds.filter((gearId) => gearId !== id),
      })),
    }));
  }, []);

  const createCategory = useCallback((rawName: string) => {
    const name = rawName.trim();
    if (!name) return false;
    if (data.categories.some((category) => category.name.toLowerCase() === name.toLowerCase())) {
      return false;
    }
    setData((current) => ({
      ...current,
      categories: [
        ...current.categories,
        { id: createId('category'), name, icon: 'package', isCustom: true },
      ],
    }));
    return true;
  }, [data.categories]);

  const deleteCategory = useCallback((id: string) => {
    if (DEFAULT_CATEGORIES.some((category) => category.id === id)) return;
    setData((current) => ({
      ...current,
      categories: current.categories.filter((category) => category.id !== id),
      gear: current.gear.map((item) =>
        item.categoryId === id ? { ...item, categoryId: 'other' } : item,
      ),
    }));
  }, []);

  const createEvent = useCallback(async (draft: EventDraft, selections: GearSelection[]) => {
    const event: GearEvent = {
      ...draft,
      id: createId('event'),
      status: 'upcoming',
      gearSelections: selections,
      result: null,
      missingItems: [],
      createdAt: new Date().toISOString(),
      reminderIds: [],
    };
    setData((current) => ({ ...current, events: [event, ...current.events] }));

    if (data.settings.remindersEnabled) {
      const reminderIds = await scheduleEventReminders(event);
      if (reminderIds.length > 0) {
        setData((current) => ({
          ...current,
          events: current.events.map((item) =>
            item.id === event.id ? { ...item, reminderIds } : item,
          ),
        }));
      }
    }
    return event.id;
  }, [data.settings.remindersEnabled]);

  const updateEvent = useCallback(async (id: string, draft: EventDraft) => {
    const existing = data.events.find((event) => event.id === id);
    if (!existing) return;
    await cancelReminderIds(existing.reminderIds);
    const updated = { ...existing, ...draft, reminderIds: [] };
    setData((current) => ({
      ...current,
      events: current.events.map((event) => event.id === id ? updated : event),
    }));
    if (data.settings.remindersEnabled) {
      const reminderIds = await scheduleEventReminders(updated);
      if (reminderIds.length > 0) {
        setData((current) => ({
          ...current,
          events: current.events.map((event) => event.id === id ? { ...event, reminderIds } : event),
        }));
      }
    }
  }, [data.events, data.settings.remindersEnabled, setData]);

  const deleteEvent = useCallback(async (id: string) => {
    const event = data.events.find((item) => item.id === id);
    if (event) await cancelReminderIds(event.reminderIds);
    setData((current) => ({
      ...current,
      events: current.events.filter((item) => item.id !== id),
    }));
  }, [data.events, setData]);

  const setPackedQuantity = useCallback((eventId: string, gearId: string, quantity: number) => {
    setData((current) => ({
      ...current,
      events: current.events.map((event) => {
        if (event.id !== eventId) return event;
        const gearSelections = event.gearSelections.map((item) =>
          item.gearId === gearId
            ? { ...item, packedQuantity: Math.max(0, Math.min(item.quantity, quantity)) }
            : item,
        );
        const fullyPacked = gearSelections.every((item) => item.packedQuantity >= item.quantity);
        return { ...event, gearSelections, status: fullyPacked ? 'out' : 'packing' };
      }),
    }));
  }, []);

  const setReturnedQuantity = useCallback((eventId: string, gearId: string, quantity: number) => {
    setData((current) => ({
      ...current,
      events: current.events.map((event) =>
        event.id !== eventId
          ? event
          : {
              ...event,
              status: 'returning',
              gearSelections: event.gearSelections.map((item) =>
                item.gearId === gearId
                  ? { ...item, returnedQuantity: Math.max(0, Math.min(item.quantity, quantity)) }
                  : item,
              ),
            },
      ),
    }));
  }, []);

  const startReturn = useCallback((eventId: string) => {
    setData((current) => ({
      ...current,
      events: current.events.map((event) =>
        event.id === eventId ? { ...event, status: 'returning' } : event,
      ),
    }));
  }, []);

  const completeReturn = useCallback((eventId: string) => {
    const eventToComplete = data.events.find((event) => event.id === eventId);
    const missingItems = eventToComplete
      ? eventToComplete.gearSelections
          .filter((item) => item.returnedQuantity < item.quantity)
          .map((item) => ({
            gearId: item.gearId,
            name: item.name,
            categoryName: item.categoryName,
            quantity: item.quantity,
            returnedQuantity: item.returnedQuantity,
          }))
      : [];
    setData((current) => ({
      ...current,
      events: current.events.map((event) => {
        if (event.id !== eventId) return event;
        return {
          ...event,
          status: 'returning',
          result: missingItems.length > 0 ? 'missing' : 'complete',
          missingItems,
        };
      }),
    }));
    return missingItems;
  }, [data.events]);

  const createTemplate = useCallback((rawName: string, gearIds: string[]) => {
    const name = rawName.trim();
    if (!name || gearIds.length === 0) return false;
    setData((current) => ({
      ...current,
      templates: [
        {
          id: createId('template'),
          name,
          gearIds: [...new Set(gearIds)],
          createdAt: new Date().toISOString(),
        },
        ...current.templates,
      ],
    }));
    return true;
  }, []);

  const deleteTemplate = useCallback((id: string) => {
    setData((current) => ({
      ...current,
      templates: current.templates.filter((template) => template.id !== id),
    }));
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setData((current) => ({
      ...current,
      settings: { ...current.settings, themeMode: mode },
    }));
  }, []);

  const setRemindersEnabled = useCallback(async (enabled: boolean) => {
    if (enabled) {
      try {
        const granted = await requestReminderPermission();
        if (!granted) return false;
        const upcomingEvents = data.events.filter((event) => event.result === null);
        const scheduled = await Promise.all(
          upcomingEvents.map(async (event) => ({
            eventId: event.id,
            reminderIds: await scheduleEventReminders(event),
          })),
        );
        setData((current) => ({
          ...current,
          settings: { ...current.settings, remindersEnabled: true },
          events: current.events.map((event) => ({
            ...event,
            reminderIds: scheduled.find((item) => item.eventId === event.id)?.reminderIds ?? event.reminderIds,
          })),
        }));
        return true;
      } catch {
        return false;
      }
    }

    try {
      await Promise.all(data.events.map((event) => cancelReminderIds(event.reminderIds)));
    } finally {
      setData((current) => ({
        ...current,
        settings: { ...current.settings, remindersEnabled: false },
        events: current.events.map((event) => ({ ...event, reminderIds: [] })),
      }));
    }
    return true;
  }, [data.events]);

  const clearAllData = useCallback(async () => {
    await Promise.all(data.events.map((event) => cancelReminderIds(event.reminderIds)));
    const reset = freshData();
    setData(reset);
    setStorageError(null);
  }, [data.events, setData, setStorageError]);

  const value = useMemo<GearCheckContextValue>(
    () => ({
      data,
      isHydrated,
      storageError,
      systemScheme,
      createGear,
      updateGear,
      deleteGear,
      createCategory,
      deleteCategory,
      createEvent,
      updateEvent,
      deleteEvent,
      setPackedQuantity,
      setReturnedQuantity,
      startReturn,
      completeReturn,
      createTemplate,
      deleteTemplate,
      setThemeMode,
      setRemindersEnabled,
      clearAllData,
    }),
    [
      data,
      isHydrated,
      storageError,
      systemScheme,
      createGear,
      updateGear,
      deleteGear,
      createCategory,
      deleteCategory,
      createEvent,
      updateEvent,
      deleteEvent,
      setPackedQuantity,
      setReturnedQuantity,
      startReturn,
      completeReturn,
      createTemplate,
      deleteTemplate,
      setThemeMode,
      setRemindersEnabled,
      clearAllData,
    ],
  );

  return <GearCheckContext.Provider value={value}>{children}</GearCheckContext.Provider>;
}

export function useGearCheck() {
  const context = useContext(GearCheckContext);
  if (!context) throw new Error('useGearCheck must be used inside GearCheckProvider');
  return context;
}
