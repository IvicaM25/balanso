import type { Lang } from '@/i18n/strings';

/** Vitamins and minerals per 100 g (USDA SR28 units). */
export type Micro = Partial<Record<MicroKey, number>>;
export type MicroKey =
  | 'va' | 'vd' | 've' | 'vk' | 'vc' | 'b1' | 'b2' | 'b3' | 'b5' | 'b6' | 'fol' | 'b12'
  | 'ka' | 'ca' | 'ph' | 'mg' | 'fe' | 'zn' | 'cu' | 'mn' | 'se';

/** [label, edible grams of one piece]; label is a size (S/M/L/XL), "kom" or "kriška". */
export type PieceUnit = [string, number];

/** A built-in food. All nutrient values are per 100 g of the edible part. */
export interface BaseFood {
  id: string;
  n: string; // Serbian name (reference)
  nm: Record<Lang, string>;
  g: number; // typical portion in grams
  k: number; p: number; f: number; c: number;
  s?: number; fi?: number; sa?: number; sat?: number; chol?: number;
  mi?: Micro;
  u?: PieceUnit[];
  du?: number; // default size index
  r?: number; // inedible share (%) as bought, e.g. banana peel 36
  rd?: boolean; // peel deduction on by default
}

/** A food the user saved (photographed or entered manually). Per 100 g. */
export interface MyFood {
  n: string;
  g: number;
  k: number; p: number; f: number; c: number;
  s?: number | null; fi?: number | null; sa?: number | null;
  u?: PieceUnit[];
}

export type AnyFood = (BaseFood & { mine?: false }) | (MyFood & { mine: true; id?: undefined; nm?: undefined; r?: undefined; rd?: undefined; mi?: undefined; du?: undefined });

/** How the amount was entered, so the line can be re-rendered in any language. */
export type QtyInfo =
  | { qk: 'g' }
  | { qk: 'kom'; qa: number; qu: string; qs?: string }
  | { qk: 'peel'; qa: number; qp: number };

export interface Entry {
  id: string;
  meal: string; // meal window id
  n: string; // name (Serbian for built-in foods)
  fid?: string; // built-in food id
  g: number; // edible grams eaten
  k: number; p: number; f: number; c: number;
  s?: number; fi?: number; sa?: number;
  mi?: Micro;
  t: number; // timestamp
  qk?: QtyInfo['qk']; qa?: number; qu?: string; qs?: string; qp?: number;
}

export interface Burn { total: number; at: number }

export interface DayDoc { entries: Entry[]; burn?: Burn }

export interface MealWindow { id: string; n?: string; nk?: string; from: string; to: string }

export type Sex = 'm' | 'f';
export type Goal = 'maintain' | 'lose' | 'gain';

export interface Profile {
  sex: Sex; goal: Goal;
  tm: number; // maintain ±
  tlm: number; // lose: deficit men
  tlf: number; // lose: deficit women
  teven: number; // lose: evening max surplus
  tgain: number; // gain: max surplus
}

export interface Goals { k: number; p: number; f: number; c: number; s: number; sa: number; fi: number }

export type ThemeChoice = 'auto' | 'light' | 'dark';

export interface Settings {
  lang?: Lang | 'auto';
  theme?: ThemeChoice;
  goals?: Partial<Goals>;
  profile?: Partial<Profile>;
  dayStart?: string; // "HH:MM"
  windows?: MealWindow[];
}

export interface Totals { k: number; p: number; f: number; c: number; s: number; fi: number; sa: number }
