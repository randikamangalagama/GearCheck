import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
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

const STORAGE_KEY = '@gearcheck/data-v1';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cameras', name: 'Cameras', icon: 'camera', isCustom: false },
  { id: 'lenses', name: 'Lenses', icon: 'circle', isCustom: false },
  { id: 'flashes-lights', name: 'Flashes & Lights', icon: 'zap', isCustom: false },
  { id: 'batteries-chargers', name: 'Batteries & Chargers', icon: 'battery-charging', isCustom: false },
  { id: 'memory-cards', name: 'Memory Cards', icon: 'credit-card', isCustom: false },
  { id: 'tripods-gimbals', name: 'Tripods & Gimbals', icon: 'sliders', isCustom: false },
  { id: 'audio', name: 'Audio', icon: 'mic', isCustom: false },
  { id: 'bags-cases', name: 'Bags & Cases', icon: 'briefcase', isCustom: false },
  { id: 'cables-accessories', name: 'Cables & Accessories', icon: 'link', isCustom: false },
  { id: 'other', name: 'Other', icon: 'box', isCustom: false },
];

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function freshData(): AppData {
  return {
    categories: DEFAULT_CATEGORIES,
    gear: [],
    events: [],
    templates: [],
    settings: { themeMode: 'system', remindersEnabled: false },
  };
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

function restoreData(raw: string | null): AppData {
  if (!raw) return freshData();
  const parsed = JSON.parse(raw) as Partial<AppData>;
  return {
    categories:
      Array.isArray(parsed.categories) && parsed.categories.length > 0
        ? parsed.categories
        : DEFAULT_CATEGORIES,
    gear: Array.isArray(parsed.gear) ? parsed.gear : [],
    events: Array.isArray(parsed.events) ? parsed.events : [],
    templates: Array.isArray(parsed.templates) ? parsed.templates : [],
    settings: {
      themeMode:
        parsed.settings?.themeMode === 'dark' ||
        parsed.settings?.themeMode === 'light' ||
        parsed.settings?.themeMode === 'system'
          ? parsed.settings.themeMode
          : 'system',
      remindersEnabled: parsed.settings?.remindersEnabled === true,
    },
  };
}

export function GearCheckProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(freshData);
  const [isHydrated, setIsHydrated] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const nativeScheme = useColorScheme();
  const systemScheme = nativeScheme === 'dark' ? 'dark' : 'light';

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (active) setData(restoreData(stored));
      })
      .catch(() => {
        if (active) setStorageError('Saved data could not be read from this device.');
      })
      .finally(() => {
        if (active) setIsHydrated(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {
      setStorageError('Changes could not be saved. Check device storage and try again.');
    });
  }, [data, isHydrated]);

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
          status: 'completed',
          result: missingItems.length > 0 ? 'missing' : 'complete',
          missingItems,
          completedAt: new Date().toISOString(),
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
        const upcomingEvents = data.events.filter((event) => event.status !== 'completed');
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
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reset));
    setStorageError(null);
  }, [data.events]);

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
