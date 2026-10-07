import type { MealWindow } from './types';

const pad = (n: number) => String(n).padStart(2, '0');

/** Storage key of a day: "d-YYYY-MM-DD". */
export const keyOf = (d: Date) => `d-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const dateOf = (k: string) => {
  const [, y, m, d] = k.split('-');
  return new Date(+y, +m - 1, +d);
};
export const shiftDay = (k: string, n: number) => {
  const d = dateOf(k);
  d.setDate(d.getDate() + n);
  return keyOf(d);
};

/** "HH:MM" → minutes after midnight. */
export const mins = (t: string | undefined) => {
  const [a, b] = String(t || '00:00').split(':');
  return (+a || 0) * 60 + (+b || 0);
};

export const isTime = (t: string) => /^([01]?\d|2[0-3]):[0-5]\d$/.test(t.trim());
export const normTime = (t: string) => {
  const [a, b] = t.trim().split(':');
  return `${pad(+a)}:${pad(+b)}`;
};

/**
 * The "logical" day for a user whose day starts at `dayStart` (night shift).
 * With dayStart 14:00, 2026-10-08 03:00 still belongs to 2026-10-07.
 */
export const logicalDay = (now: Date, dayStart: string) => keyOf(new Date(now.getTime() - mins(dayStart) * 60000));

/** Whether a minute-of-day falls into a window; windows may cross midnight (23:00–01:00). */
export function inWindow(w: Pick<MealWindow, 'from' | 'to'>, m: number) {
  const a = mins(w.from), b = mins(w.to);
  return a <= b ? m >= a && m < b : m >= a || m < b;
}

export function currentWindowId(windows: MealWindow[], now: Date) {
  const m = now.getHours() * 60 + now.getMinutes();
  return (windows.find((w) => inWindow(w, m)) || windows[0]).id;
}

/** Current time; kept out of components so event handlers stay lint-clean. */
export const nowMs = () => Date.now();

export const hhmm = (ts: number) => {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
