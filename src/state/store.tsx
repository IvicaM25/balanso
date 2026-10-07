import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import FOODS from '@/data/foods.json';
import { DATE_NAMES, STR, type Lang, type StrKey } from '@/i18n/strings';
import { dateOf, logicalDay, shiftDay } from '@/lib/dates';
import { DEF_GOALS, DEF_PROFILE, DEF_WINDOWS } from '@/lib/defaults';
import { fmtNum, fmtSigned } from '@/lib/format';
import type { BaseFood, DayDoc, Entry, Goals, MealWindow, MyFood, Profile, Settings } from '@/lib/types';
import { palette, type Palette } from '@/ui/theme';

export const BASE = FOODS as unknown as BaseFood[];
export const BASE_BY_ID: Record<string, BaseFood> = Object.fromEntries(BASE.map((f) => [f.id, f]));

const PREFIX = 'balanso:';
const SUPPORTED: Lang[] = ['sr', 'hr', 'bs', 'de', 'en', 'es', 'ru'];

/** Phone language → app language. Russian is opt-in only, so a Russian phone gets English. */
export function detectLang(): Lang {
  for (const l of getLocales()) {
    const c = (l.languageCode || '').toLowerCase();
    if (c === 'ru') return 'en';
    if ((SUPPORTED as string[]).includes(c)) return c as Lang;
  }
  return 'en';
}

export const norm = (s: string) =>
  String(s).toLowerCase().replace(/đ/g, 'dj').normalize('NFD').replace(/[̀-ͯ]/g, '');
const SR_INDEX: Record<string, BaseFood> = Object.fromEntries(BASE.map((f) => [norm(f.nm.sr), f]));

type Docs = {
  settings?: Settings;
  foods?: { items: MyFood[] };
  [day: string]: unknown;
};

interface Store {
  ready: boolean;
  docs: Docs;
  setDoc: (key: string, value: unknown) => void;
  // derived
  settings: Settings;
  goals: Goals;
  profile: Profile;
  windows: MealWindow[];
  dayStart: string;
  myFoods: MyFood[];
  today: string;
  day: (k: string) => DayDoc;
  dayDocs: Record<string, DayDoc | undefined>;
  saveSettings: (patch: Partial<Settings>) => void;
  // language
  lang: Lang;
  t: (k: StrKey | string, v?: Record<string, string | number>) => string;
  num: (x: number | null | undefined, d?: number) => string;
  signed: (x: number) => string;
  dayLabel: (k: string) => string;
  foodName: (f: { nm?: Record<Lang, string>; n: string }) => string;
  entryName: (e: Entry) => string;
  winLabel: (w: MealWindow) => string;
  // theme
  colors: Palette;
  dark: boolean;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [docs, setDocs] = useState<Docs>({});
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const scheme = useColorScheme();
  const writeQueue = useRef(Promise.resolve());

  useEffect(() => {
    (async () => {
      try {
        const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(PREFIX));
        const pairs = await AsyncStorage.multiGet(keys);
        const d: Docs = {};
        for (const [k, v] of pairs) if (v) d[k.slice(PREFIX.length)] = JSON.parse(v);
        setDocs(d);
      } catch {
        // start empty if storage can't be read
      }
      setReady(true);
    })();
    // keep "today" and the current meal window fresh
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const setDoc = useCallback((key: string, value: unknown) => {
    setDocs((prev) => ({ ...prev, [key]: value }));
    writeQueue.current = writeQueue.current
      .then(() => AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)))
      .catch(() => {});
  }, []);

  const value = useMemo<Store>(() => {
    const settings = (docs.settings as Settings) || {};
    const lang: Lang = settings.lang && settings.lang !== 'auto' ? settings.lang : detectLang();
    const S = STR[lang];
    const t = (k: string, v?: Record<string, string | number>) => {
      let s: string = (S as Record<string, string>)[k] ?? (STR.en as Record<string, string>)[k] ?? k;
      if (v) s = s.replace(/\{(\w+)\}/g, (m, x) => (v[x] != null ? String(v[x]) : m));
      return s;
    };
    const dayStart = settings.dayStart || '00:00';
    const today = logicalDay(now, dayStart);
    const myFoods = (docs.foods as { items: MyFood[] } | undefined)?.items ?? [];
    const foodName = (f: { nm?: Record<Lang, string>; n: string }) => (f.nm ? f.nm[lang] || f.nm.en : f.n);
    const winLabel = (w: MealWindow) => w.n || t(w.nk || 'other');
    const dark = settings.theme === 'dark' || (settings.theme !== 'light' && scheme === 'dark');
    const dayDocs: Record<string, DayDoc | undefined> = {};
    for (const [k, v] of Object.entries(docs)) if (k.startsWith('d-')) dayDocs[k] = v as DayDoc;
    return {
      ready, docs, setDoc, settings,
      goals: { ...DEF_GOALS, ...(settings.goals || {}) },
      profile: { ...DEF_PROFILE, ...(settings.profile || {}) },
      windows: settings.windows?.length ? settings.windows : DEF_WINDOWS,
      dayStart, myFoods, today, dayDocs,
      day: (k) => dayDocs[k] ?? { entries: [] },
      saveSettings: (patch) => setDoc('settings', { ...settings, ...patch }),
      lang, t,
      num: (x, d = 0) => fmtNum(lang, x, d),
      signed: (x) => fmtSigned(lang, x),
      dayLabel: (k) => {
        if (k === today) return t('today');
        if (k === shiftDay(today, -1)) return t('yesterday');
        const d = dateOf(k), N = DATE_NAMES[lang];
        return `${N.days[d.getDay()]}, ${d.getDate()}. ${N.months[d.getMonth()]}`;
      },
      foodName,
      entryName: (e) => {
        const f = e.fid ? BASE_BY_ID[e.fid] : SR_INDEX[norm(e.n)];
        return f ? foodName(f) : e.n;
      },
      winLabel,
      colors: palette(dark),
      dark,
    };
  }, [docs, ready, now, scheme, setDoc]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}

export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
