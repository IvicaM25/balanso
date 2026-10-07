import type { Goals, MealWindow, MicroKey, Profile } from './types';

export const DEF_GOALS: Goals = { k: 2200, p: 150, f: 70, c: 230, s: 90, sa: 6, fi: 30 };

export const DEF_WINDOWS: MealWindow[] = [
  { id: 'b', nk: 'w_b', from: '06:00', to: '10:00' },
  { id: 's', nk: 'w_s', from: '10:00', to: '12:00' },
  { id: 'l', nk: 'w_l', from: '12:00', to: '15:00' },
  { id: 's2', nk: 'w_s', from: '15:00', to: '18:00' },
  { id: 'd', nk: 'w_d', from: '18:00', to: '23:00' },
];

/** Balance limits from the owner's experience: ±300 maintain, −500 men / −300 women when losing. */
export const DEF_PROFILE: Profile = { sex: 'm', goal: 'maintain', tm: 300, tlm: 500, tlf: 300, teven: 150, tgain: 300 };

/** [group, key, label (string key or vitamin letter), unit, EU NRV (Reg. 1169/2011)] */
export const MICRO: [ 'v' | 'm', MicroKey, string | { vit: string }, string, number][] = [
  ['v', 'va', { vit: 'A' }, 'µg', 800], ['v', 'vd', { vit: 'D' }, 'µg', 5], ['v', 've', { vit: 'E' }, 'mg', 12],
  ['v', 'vk', { vit: 'K' }, 'µg', 75], ['v', 'vc', { vit: 'C' }, 'mg', 80], ['v', 'b1', 'mi_b1', 'mg', 1.1],
  ['v', 'b2', 'mi_b2', 'mg', 1.4], ['v', 'b3', 'mi_b3', 'mg', 16], ['v', 'b5', 'mi_b5', 'mg', 6],
  ['v', 'b6', { vit: 'B6' }, 'mg', 1.4], ['v', 'fol', 'mi_fol', 'µg', 200], ['v', 'b12', { vit: 'B12' }, 'µg', 2.5],
  ['m', 'ka', 'mi_ka', 'mg', 2000], ['m', 'ca', 'mi_ca', 'mg', 800], ['m', 'ph', 'mi_ph', 'mg', 700],
  ['m', 'mg', 'mi_mg', 'mg', 375], ['m', 'fe', 'mi_fe', 'mg', 14], ['m', 'zn', 'mi_zn', 'mg', 10],
  ['m', 'cu', 'mi_cu', 'mg', 1], ['m', 'mn', 'mi_mn', 'mg', 2], ['m', 'se', 'mi_se', 'µg', 55],
];

export const VIT_WORD: Record<string, string> = { sr: 'Vitamin', hr: 'Vitamin', bs: 'Vitamin', de: 'Vitamin', en: 'Vitamin', es: 'Vitamina', ru: 'Витамин' };
