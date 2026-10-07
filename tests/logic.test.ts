import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computePortion, zoneOf, sumTotals } from '../src/lib/nutrition';
import { logicalDay, inWindow, keyOf } from '../src/lib/dates';
import { fmtNum, fmtSigned } from '../src/lib/format';
import { analyze } from '../src/lib/analysis';
import FOODS from '../src/data/foods.json';

const P = { sex: 'm', goal: 'maintain', tm: 300, tlm: 500, tlf: 300, teven: 150, tgain: 300 } as const;
const byId = (id: string) => (FOODS as any[]).find((f) => f.id === id);

test('balance zones follow the owner rules', () => {
  assert.equal(zoneOf(300, P).ok, true);
  assert.equal(zoneOf(301, P).key, 'z_surplus_over');
  assert.equal(zoneOf(-350, P).key, 'z_def_over');
  assert.equal(zoneOf(-500, { ...P, goal: 'lose' }).key, 'z_def_ok');
  assert.equal(zoneOf(-350, { ...P, goal: 'lose', sex: 'f' }).key, 'z_def_over');
  assert.equal(zoneOf(150, { ...P, goal: 'lose' }).key, 'z_balanced');
  assert.equal(zoneOf(200, { ...P, goal: 'lose' }).key, 'z_lose_over');
  assert.equal(zoneOf(400, { ...P, goal: 'gain' }).key, 'z_surplus_over');
});

test('3 eggs size M', () => {
  const egg = byId('01123');
  const p = computePortion(egg, { amount: 3, mode: 'kom', sizeIndex: 1, peel: false })!;
  assert.equal(p.g, 153);
  assert.equal(Math.round(p.k), 219); // 1.53 × 143
});

test('banana 200 g with peel deducts 36%', () => {
  const b = byId('09040');
  const p = computePortion(b, { amount: 200, mode: 'g', sizeIndex: 0, peel: true })!;
  assert.equal(p.g, 128);
  assert.equal(Math.round(p.k), 114);
});

test('night shift day and windows over midnight', () => {
  assert.equal(logicalDay(new Date(2026, 9, 8, 3, 0), '14:00'), 'd-2026-10-07');
  assert.equal(logicalDay(new Date(2026, 9, 8, 15, 0), '14:00'), 'd-2026-10-08');
  assert.equal(inWindow({ from: '23:00', to: '01:00' }, 30), true);
  assert.equal(inWindow({ from: '23:00', to: '01:00' }, 120), false);
});

test('number formatting per language', () => {
  assert.equal(fmtNum('sr', 2200), '2.200');
  assert.equal(fmtNum('en', 2200), '2,200');
  assert.equal(fmtNum('de', 12.5, 1), '12,5');
  assert.equal(fmtSigned('sr', -320), '−320');
});

test('analysis averages only logged days', () => {
  const e = (meal: string, k: number) => ({ id: 'x', meal, n: 'x', g: 100, k, p: 0, f: 0, c: 0, t: 0 });
  const docs = { 'd-2026-10-07': { entries: [e('s', 300), e('l', 700)], burn: { total: 900, at: 0 } }, 'd-2026-10-05': { entries: [e('s', 100)] } };
  const A = analyze(docs as any, 'd-2026-10-07', 7, 's', () => 'x');
  assert.equal(A.logged, 2);
  assert.equal(A.avg.k, 200);
  assert.equal(Math.round(A.share.k!), Math.round(400 / 1100 * 100));
  assert.equal(A.days.at(-1)!.bal, 100);
  assert.equal(sumTotals(docs['d-2026-10-07'].entries as any).k, 1000);
});
