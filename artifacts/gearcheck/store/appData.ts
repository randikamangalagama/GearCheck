import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import type { AppData, Category } from '@/types';
import { cancelReminderIds } from '@/utils/notifications';

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

export function freshData(): AppData {
  return {
    categories: DEFAULT_CATEGORIES,
    gear: [],
    events: [],
    templates: [],
    settings: { themeMode: 'system', remindersEnabled: false },
  };
}

function normalizeData(raw: unknown): AppData {
  const parsed = raw && typeof raw === 'object' && 'data' in raw
    ? (raw as { data?: Partial<AppData> }).data
    : raw as Partial<AppData> | undefined;
  if (!parsed || typeof parsed !== 'object') return freshData();
  const legacyEvents = Array.isArray(parsed.events) ? parsed.events : [];
  const removedEvents = legacyEvents.filter((event) => event?.status === 'completed');
  if (removedEvents.length > 0) {
    void Promise.all(removedEvents.map((event) => cancelReminderIds(event.reminderIds ?? []))).catch(() => undefined);
  }

  return {
    categories:
      Array.isArray(parsed.categories) && parsed.categories.length > 0
        ? parsed.categories
        : DEFAULT_CATEGORIES,
    gear: Array.isArray(parsed.gear) ? parsed.gear : [],
    events: legacyEvents
      .filter((event) => event?.status !== 'completed')
      .map((event) => ({
        ...event,
        time: typeof event.time === 'string' ? event.time : '12:00',
        result: event.result ?? null,
        missingItems: Array.isArray(event.missingItems) ? event.missingItems : [],
        reminderIds: Array.isArray(event.reminderIds) ? event.reminderIds : [],
      })),
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

const legacyCompatibleStorage: StateStorage = {
  getItem: async (name) => {
    const raw = await AsyncStorage.getItem(name);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      if ('categories' in parsed && !('state' in parsed)) {
        return JSON.stringify({ state: parsed, version: 0 });
      }
    } catch {
      return raw;
    }
    return raw;
  },
  setItem: (name, value) => AsyncStorage.setItem(name, value),
  removeItem: (name) => AsyncStorage.removeItem(name),
};

interface AppDataStore {
  data: AppData;
  isHydrated: boolean;
  storageError: string | null;
  setData: (next: AppData | ((current: AppData) => AppData)) => void;
  setHydrated: (value: boolean) => void;
  setStorageError: (message: string | null) => void;
}

export const useAppDataStore = create<AppDataStore>()(
  persist(
    (set) => ({
      data: freshData(),
      isHydrated: false,
      storageError: null,
      setData: (next) =>
        set((state) => ({
          data: typeof next === 'function' ? next(state.data) : next,
        })),
      setHydrated: (value) => set({ isHydrated: value }),
      setStorageError: (message) => set({ storageError: message }),
    }),
    {
      name: '@gearcheck/data-v1',
      version: 2,
      storage: createJSONStorage(() => legacyCompatibleStorage),
      partialize: (state) => ({ data: state.data }),
      migrate: (persisted) => ({ data: normalizeData(persisted) } as AppDataStore),
      merge: (persisted, current) => ({
        ...current,
        data: normalizeData(persisted),
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) state?.setStorageError('Saved data could not be read from this device.');
        state?.setHydrated(true);
      },
    },
  ),
);
