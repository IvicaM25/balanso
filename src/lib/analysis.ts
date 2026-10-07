import { shiftDay } from './dates';
import { sumTotals } from './nutrition';
import type { Burn, DayDoc, Entry, Totals } from './types';

export interface DayRow {
  k: string;
  items: Entry[];
  t: Totals; // totals for the analysed scope
  dayT: Totals; // totals for the whole day
  burn: Burn | null;
  bal: number | null; // whole-day intake − burn
}

export interface Analysis {
  days: DayRow[];
  logged: number;
  avg: Totals;
  tot: Totals;
  share: Record<keyof Totals, number | null>;
  top: { n: string; cnt: number; k: number; s: number; p: number }[];
  avgBurn: number | null;
  avgBal: number | null;
}

/**
 * Exact numbers for the analysis screen. `scope` is "day" or a meal window id.
 * Averages count only days that have entries in the scope.
 */
export function analyze(
  docs: Record<string, DayDoc | undefined>,
  endDay: string,
  nDays: number,
  scope: string,
  nameOf: (e: Entry) => string,
): Analysis {
  const keys = Array.from({ length: nDays }, (_, i) => shiftDay(endDay, i - (nDays - 1)));
  const days: DayRow[] = keys.map((k) => {
    const all = docs[k]?.entries ?? [];
    const items = scope === 'day' ? all : all.filter((e) => e.meal === scope);
    const dayT = sumTotals(all);
    const burn = docs[k]?.burn ?? null;
    return { k, items, t: sumTotals(items), dayT, burn, bal: burn ? dayT.k - burn.total : null };
  });
  const logged = days.filter((d) => d.items.length);
  const tot = sumTotals(logged.flatMap((d) => d.items));
  const dayTot = sumTotals(logged.flatMap((d) => docs[d.k]?.entries ?? []));
  const n = logged.length || 1;
  const avg = Object.fromEntries(Object.entries(tot).map(([k, v]) => [k, v / n])) as unknown as Totals;
  const share = Object.fromEntries(
    Object.entries(tot).map(([k, v]) => [k, dayTot[k as keyof Totals] ? (v / dayTot[k as keyof Totals]) * 100 : null]),
  ) as Record<keyof Totals, number | null>;
  const foods: Record<string, { n: string; cnt: number; k: number; s: number; p: number }> = {};
  for (const d of logged)
    for (const e of d.items) {
      const nm = nameOf(e);
      const f = (foods[nm] ??= { n: nm, cnt: 0, k: 0, s: 0, p: 0 });
      f.cnt++; f.k += e.k; f.s += e.s || 0; f.p += e.p;
    }
  const top = Object.values(foods).sort((a, b) => b.k - a.k).slice(0, 6);
  const withBurn = days.filter((d) => d.burn && d.items.length);
  const avgBurn = withBurn.length ? withBurn.reduce((a, d) => a + d.burn!.total, 0) / withBurn.length : null;
  const avgBal = withBurn.length ? withBurn.reduce((a, d) => a + (d.bal ?? 0), 0) / withBurn.length : null;
  return { days, logged: logged.length, avg, tot, share, top, avgBurn, avgBal };
}
