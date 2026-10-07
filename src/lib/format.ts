import type { Lang } from '@/i18n/strings';

const SEP: Record<Lang, { th: string; dec: string }> = {
  sr: { th: '.', dec: ',' }, hr: { th: '.', dec: ',' }, bs: { th: '.', dec: ',' },
  de: { th: '.', dec: ',' }, es: { th: '.', dec: ',' }, en: { th: ',', dec: '.' }, ru: { th: ' ', dec: ',' },
};

/** Format a number with fixed rounding and the language's separators (no Intl dependency). */
export function fmtNum(lang: Lang, x: number | null | undefined, decimals = 0): string {
  if (x == null || !isFinite(x)) return '–';
  const p = 10 ** decimals;
  const v = Math.round(x * p) / p;
  const neg = v < 0;
  const [int, frac] = Math.abs(v).toFixed(decimals).split('.');
  // Spanish does not group 4-digit numbers; others do.
  const grouped = lang === 'es' && int.length <= 4 ? int : int.replace(/\B(?=(\d{3})+(?!\d))/g, SEP[lang].th);
  let out = grouped;
  if (frac && /[1-9]/.test(frac)) out += SEP[lang].dec + frac.replace(/0+$/, '');
  return (neg ? '−' : '') + out;
}

/** Signed number for balances: +300 / −120 / 0. */
export function fmtSigned(lang: Lang, x: number): string {
  const r = Math.round(x);
  return (r > 0 ? '+' : r < 0 ? '−' : '') + fmtNum(lang, Math.abs(r));
}

/** Parse user input like "12,5" or "12.5". */
export function parseNum(s: string): number | null {
  const v = parseFloat(String(s).replace(',', '.').trim());
  return isFinite(v) ? v : null;
}

export const r1 = (x: number) => Math.round(x * 10) / 10;
export const r2 = (x: number) => Math.round(x * 100) / 100;
