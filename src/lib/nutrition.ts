import type { AnyFood, Entry, Goal, Micro, Profile, QtyInfo, Totals } from './types';

export const sumTotals = (list: Entry[]): Totals => {
  const o: Totals = { k: 0, p: 0, f: 0, c: 0, s: 0, fi: 0, sa: 0 };
  for (const e of list) {
    o.k += e.k || 0; o.p += e.p || 0; o.f += e.f || 0; o.c += e.c || 0;
    o.s += e.s || 0; o.fi += e.fi || 0; o.sa += e.sa || 0;
  }
  return o;
};

/** Sum vitamins/minerals; `covered` = how many entries had data. */
export function sumMicro(list: Entry[]) {
  const o: Micro = {};
  let covered = 0;
  for (const e of list) {
    if (!e.mi) continue;
    covered++;
    for (const [k, v] of Object.entries(e.mi)) o[k as keyof Micro] = (o[k as keyof Micro] || 0) + (v || 0);
  }
  return { micro: o, covered, total: list.length };
}

export type AmountMode = 'g' | 'kom';

export interface AmountInput {
  amount: number; // grams on the scale, or number of pieces
  mode: AmountMode;
  sizeIndex: number;
  peel: boolean; // weighed with peel → deduct refuse share
  peelPct?: number | null; // override of the refuse %
}

export interface Portion extends Totals {
  g: number; // edible grams
  qinfo: QtyInfo;
  mi?: Micro;
  hasSugar: boolean;
}

/**
 * Turn a food (per 100 g edible) plus how the user entered the amount into eaten nutrients.
 * Pieces use the edible weight of one piece; peel mode deducts the average inedible share.
 */
export function computePortion(food: AnyFood, inp: AmountInput): Portion | null {
  if (!(inp.amount > 0)) return null;
  let g: number;
  let qinfo: QtyInfo;
  if (inp.mode === 'kom' && food.u?.length) {
    const [label, pieceG] = food.u[Math.min(inp.sizeIndex, food.u.length - 1)];
    g = inp.amount * pieceG;
    qinfo = { qk: 'kom', qa: inp.amount, qu: label, ...(food.u.length > 1 ? { qs: label } : {}) };
  } else if (inp.peel && food.r) {
    const pct = Math.min(95, Math.max(0, inp.peelPct ?? food.r));
    g = inp.amount * (1 - pct / 100);
    qinfo = { qk: 'peel', qa: inp.amount, qp: pct };
  } else {
    g = inp.amount;
    qinfo = { qk: 'g' };
  }
  const m = g / 100;
  const out: Portion = {
    g, qinfo,
    k: food.k * m, p: food.p * m, f: food.f * m, c: food.c * m,
    s: (food.s ?? 0) * m, fi: (food.fi ?? 0) * m, sa: (food.sa ?? 0) * m,
    hasSugar: food.s != null,
  };
  if (food.mi) {
    out.mi = {};
    for (const [k, v] of Object.entries(food.mi)) out.mi[k as keyof Micro] = Math.round((v || 0) * m * 1000) / 1000;
  }
  return out;
}

// ---------- energy balance ----------

export interface Zone { ok: boolean; key: string; lo: number; hi: number }

/** The green range for the user's goal. */
export function zoneRange(P: Profile): { lo: number; hi: number } {
  if (P.goal === 'lose') return { lo: -(P.sex === 'f' ? P.tlf : P.tlm), hi: P.teven };
  if (P.goal === 'gain') return { lo: 0, hi: P.tgain };
  return { lo: -P.tm, hi: P.tm };
}

/** Classify a balance (eaten − burned) and return the translation key of its label. */
export function zoneOf(balance: number, P: Profile): Zone {
  const { lo, hi } = zoneRange(P);
  const g: Goal = P.goal;
  if (balance < lo) return { ok: false, key: g === 'gain' ? 'z_gain_under' : 'z_def_over', lo, hi };
  if (balance > hi) return { ok: false, key: g === 'lose' ? 'z_lose_over' : 'z_surplus_over', lo, hi };
  const key = g === 'lose' ? (balance < 0 ? 'z_def_ok' : 'z_balanced') : g === 'gain' ? 'z_gain_ok' : 'z_in_bal';
  return { ok: true, key, lo, hi };
}
