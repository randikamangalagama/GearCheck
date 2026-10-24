export type ThemeMode = 'system' | 'light' | 'dark';
export type EventStatus =
  | 'upcoming'
  | 'packing'
  | 'out'
  | 'returning';
export type EventResult = 'complete' | 'missing' | null;

export interface Category {
  id: string;
  name: string;
  icon: string;
  isCustom: boolean;
}

export interface GearItem {
  id: string;
  name: string;
  categoryId: string;
  quantity: number;
  notes: string;
  createdAt: string;
}

export interface GearSelection {
  gearId: string;
  name: string;
  categoryId: string;
  categoryName: string;
  quantity: number;
  packedQuantity: number;
  returnedQuantity: number;
  notes: string;
}

export interface MissingGearItem {
  gearId: string;
  name: string;
  categoryName: string;
  quantity: number;
  returnedQuantity: number;
}

export interface GearEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  notes: string;
  status: EventStatus;
  gearSelections: GearSelection[];
  result: EventResult;
  missingItems: MissingGearItem[];
  createdAt: string;
  reminderIds: string[];
}

export interface EventTemplate {
  id: string;
  name: string;
  gearIds: string[];
  createdAt: string;
}

export interface AppSettings {
  themeMode: ThemeMode;
  remindersEnabled: boolean;
}

export interface AppData {
  categories: Category[];
  gear: GearItem[];
  events: GearEvent[];
  templates: EventTemplate[];
  settings: AppSettings;
}

export interface GearInput {
  name: string;
  categoryId: string;
  quantity: number;
  notes: string;
}

export interface EventDraft {
  title: string;
  date: string;
  time: string;
  venue: string;
  notes: string;
}
