import type { Entry } from '@/lib/types';

type T = (k: string, v?: Record<string, string | number>) => string;
type N = (x: number | null | undefined, d?: number) => string;

const unitLabel = (t: T, u?: string) => (u === 'kom' ? t('unit_kom') : u === 'kriška' ? t('unit_slice') : u ?? '');

/** The quantity line under an entry, rebuilt in the current language from stored numbers. */
export function entryQty(e: Entry, t: T, num: N) {
  if (e.qk === 'kom') return `${num(e.qa, 1)} × ${e.qs ? t('label_vel', { s: e.qs }) : unitLabel(t, e.qu)} (${num(e.g)} g)`;
  if (e.qk === 'peel') return t('label_peel', { a: num(e.qa), p: num(e.qp), g: num(e.g) });
  return `${num(e.g)} g`;
}
