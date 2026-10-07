import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { currentWindowId, hhmm, nowMs, shiftDay } from '@/lib/dates';
import { MICRO, VIT_WORD } from '@/lib/defaults';
import { parseNum } from '@/lib/format';
import { sumMicro, sumTotals, zoneOf } from '@/lib/nutrition';
import type { Entry, Totals } from '@/lib/types';
import { useStore } from '@/state/store';
import { BalanceScale, ZonePill } from '@/ui/balance';
import { entryQty } from '@/ui/helpers';
import { Bar, Between, Btn, Card, Empty, Field, Row, Screen, Txt } from '@/ui/kit';
import { useToast } from '@/ui/toast';

export default function Today() {
  const S = useStore();
  const { colors, t, num, signed, today, goals: G, profile: P, windows } = S;
  const toast = useToast();
  const [back, setBack] = useState(0); // days back from today
  const [microOpen, setMicroOpen] = useState(false);
  const [burnOpen, setBurnOpen] = useState(false);
  const [burnText, setBurnText] = useState('');

  const k = shiftDay(today, -back);
  const doc = S.day(k);
  const list = doc.entries;
  const T = sumTotals(list);
  const left = G.k - T.k;
  const burn = doc.burn;
  const burnFrom = S.dayStart === '00:00' ? t('from_midnight') : t('from_t', { t: S.dayStart });
  const goalTxt = t(P.goal === 'lose' ? 'goal_lose' : P.goal === 'gain' ? 'goal_gain' : 'goal_maintain');

  const removeEntry = (id: string) => {
    S.setDoc(k, { ...doc, entries: list.filter((e) => e.id !== id) });
    toast(t('deleted'));
  };
  const openBurn = () => { setBurnText(burn ? String(burn.total) : ''); setBurnOpen(true); };
  const saveBurn = () => {
    const v = parseNum(burnText);
    if (!(v && v > 0)) { toast(t('burn_need')); return; }
    S.setDoc(k, { ...doc, burn: { total: Math.round(v), at: nowMs() } });
    setBurnOpen(false);
    toast(t('burn_saved'));
  };

  const nowId = back === 0 ? currentWindowId(windows, new Date()) : null;
  const known = new Set(windows.map((w) => w.id));
  const blocks = windows.map((w) => ({ w, items: list.filter((e) => e.meal === w.id) }));
  const other = list.filter((e) => !known.has(e.meal));

  const tiles: [keyof Totals, string, string, number][] = [
    ['p', 'm_prot', colors.prot, 0], ['c', 'm_carb', colors.carb, 0], ['f', 'm_fat', colors.fat, 0],
    ['s', 'm_sugar', colors.sugar, 0], ['sa', 'm_salt', colors.salt, 1], ['fi', 'm_fiber', colors.fiber, 0],
  ];
  const M = sumMicro(list);

  return (
    <Screen>
      <Row gap={8}>
        <View style={{ width: 22, height: 22, borderRadius: 7, backgroundColor: colors.accent, justifyContent: 'center', paddingHorizontal: 5, gap: 4 }}>
          <View style={{ height: 2.5, borderRadius: 2, backgroundColor: colors.accentInk }} />
          <View style={{ height: 2.5, borderRadius: 2, backgroundColor: colors.accentInk }} />
        </View>
        <Txt w="extrabold" size={18}>Balanso</Txt>
      </Row>

      <Between>
        <Row gap={4}>
          <RoundBtn icon="chevron-back" label={t('prev_day')} onPress={() => setBack(back + 1)} />
          <Txt w="bold" style={{ minWidth: 110, textAlign: 'center' }}>{S.dayLabel(k)}</Txt>
          <RoundBtn icon="chevron-forward" label={t('next_day')} disabled={back === 0} onPress={() => setBack(Math.max(0, back - 1))} />
        </Row>
        {S.dayStart !== '00:00' ? <Txt size={12} color={colors.muted}>{t('day_range', { a: S.dayStart })}</Txt> : null}
      </Between>

      {/* calories */}
      <Card>
        <Between style={{ alignItems: 'flex-end' }}>
          <Txt>
            <Txt w="extrabold" size={48} style={{ letterSpacing: -1.5 }}>{num(T.k)}</Txt>
            <Txt w="bold" size={16} color={colors.muted}>{'  '}{t('kcal_of', { g: num(G.k) })}</Txt>
          </Txt>
          <Txt w="bold" color={left >= 0 ? colors.accent : colors.over}>{left >= 0 ? t('left', { n: num(left) }) : t('over', { n: num(-left) })}</Txt>
        </Between>
        <Bar pct={(T.k / (G.k || 1)) * 100} color={left >= 0 ? colors.accent : colors.over} />
      </Card>

      {/* balance */}
      <Card>
        <Between>
          <Txt w="extrabold" size={17} style={{ flexShrink: 1 }}>{t('bal_title')}</Txt>
          {burn ? <ZonePill zone={zoneOf(T.k - burn.total, P)} /> : null}
        </Between>
        {burn ? (() => {
          const b = T.k - burn.total, z = zoneOf(b, P);
          return (
            <>
              <Txt w="extrabold" size={40} color={z.ok ? colors.accent : colors.over} style={{ letterSpacing: -1 }}>{signed(b)} kcal</Txt>
              <BalanceScale balance={b} zone={z} />
              <Txt size={14} color={colors.muted} w="semibold">
                {t('bal_in')} <Txt w="extrabold" size={14}>{num(T.k)}</Txt>  −  {t('bal_out')} <Txt w="extrabold" size={14}>{num(burn.total)}</Txt> {t('bal_when', { from: burnFrom, at: hhmm(burn.at) })}
              </Txt>
              <Txt size={13} color={colors.muted}>{t('bal_note', { goal: goalTxt, sex: P.goal === 'lose' ? t(P.sex === 'f' ? 'sex_f_short' : 'sex_m_short') : '' })}</Txt>
            </>
          );
        })() : <Txt size={14} color={colors.muted}>{t('bal_none', { goal: goalTxt })}</Txt>}
        {burnOpen ? (
          <View style={{ gap: 10 }}>
            <Txt size={13} color={colors.muted}>{t('burn_note')}</Txt>
            <Field label={t('burn_label', { from: burnFrom })} value={burnText} onChangeText={setBurnText} keyboardType="number-pad" placeholder="1450" onSubmitEditing={saveBurn} autoFocus />
            <Row><Btn label={t('save_burn')} onPress={saveBurn} style={{ flex: 1 }} /><Btn kind="secondary" label={t('cancel')} onPress={() => setBurnOpen(false)} /></Row>
          </View>
        ) : (
          <Btn kind="secondary" label={t(burn ? 'sync_again' : 'sync')} onPress={openBurn} icon={<Ionicons name="watch-outline" size={18} color={colors.fg} />} />
        )}
      </Card>

      {/* macro tiles */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {tiles.map(([key, name, col, d]) => {
          const over = (key === 's' || key === 'sa') && T[key] > G[key];
          return (
            <View key={key} style={{ flexBasis: '30%', flexGrow: 1, minWidth: 100, backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: 16, padding: 12, gap: 6 }}>
              <Row gap={6}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: col }} /><Txt w="bold" size={12}>{t(name)}</Txt></Row>
              <Txt w="extrabold" size={22} style={{ letterSpacing: -0.5 }}>{num(T[key], d)}<Txt w="bold" size={12} color={colors.muted}> / {num(G[key], d)} g</Txt></Txt>
              <Bar thin pct={(T[key] / (G[key] || 1)) * 100} color={over ? colors.over : col} />
            </View>
          );
        })}
      </View>

      {/* vitamins & minerals */}
      <Card>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: microOpen }} onPress={() => setMicroOpen(!microOpen)}>
          <Between>
            <Txt w="extrabold" size={17}>{t('micro_title')}</Txt>
            <Row gap={8}>
              {list.length ? <Txt size={12} color={colors.muted}>{t('micro_cover', { a: M.covered, b: M.total })}</Txt> : null}
              <Ionicons name={microOpen ? 'remove' : 'add'} size={20} color={colors.muted} />
            </Row>
          </Between>
        </Pressable>
        {microOpen ? (
          !list.length ? <Empty text={t('micro_empty')} /> : (
            <View>
              {MICRO.map(([g, key, lbl, unit, nrv], i) => {
                const v = M.micro[key] || 0, pct = (v / nrv) * 100;
                const header = i === 0 || MICRO[i - 1][0] !== g;
                return (
                  <View key={key}>
                    {header ? <Txt w="bold" size={11} color={colors.muted} style={{ textTransform: 'uppercase', letterSpacing: 0.9, marginTop: 10, marginBottom: 2 }}>{t(g === 'v' ? 'vitamins' : 'minerals')}</Txt> : null}
                    <View style={{ paddingVertical: 6, gap: 4, borderTopWidth: header ? 0 : 1, borderColor: colors.line }}>
                      <Between>
                        <Txt w="semibold" size={14}>{typeof lbl === 'string' ? t(lbl) : `${VIT_WORD[S.lang]} ${lbl.vit}`}</Txt>
                        <Txt size={13} color={colors.muted}>{num(v, v < 10 ? 1 : 0)} {unit} · <Txt w="extrabold" size={13}>{num(pct)}%</Txt></Txt>
                      </Between>
                      <Bar thin pct={pct} color={pct >= 100 ? colors.carb : colors.accent} />
                    </View>
                  </View>
                );
              })}
              <Txt size={12} color={colors.muted} style={{ marginTop: 10 }}>{t('micro_note')}</Txt>
            </View>
          )
        ) : null}
      </Card>

      {/* meal windows */}
      {blocks.map(({ w, items }) => (
        <MealCard key={w.id} title={S.winLabel(w)} time={`${w.from}–${w.to}`} now={w.id === nowId} items={items} onRemove={removeEntry}
          onAdd={() => router.push({ pathname: '/add', params: { win: w.id, day: k } })}
          onAnalysis={() => router.push({ pathname: '/analysis', params: { scope: w.id } })} />
      ))}
      {other.length ? <MealCard title={t('other')} items={other} onRemove={removeEntry} /> : null}
    </Screen>
  );
}

function RoundBtn({ icon, label, onPress, disabled }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; disabled?: boolean }) {
  const { colors } = useStore();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress}
      style={{ width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.35 : 1 }}>
      <Ionicons name={icon} size={18} color={colors.fg} />
    </Pressable>
  );
}

function MealCard({ title, time, now, items, onRemove, onAdd, onAnalysis }: {
  title: string; time?: string; now?: boolean; items: Entry[]; onRemove: (id: string) => void; onAdd?: () => void; onAnalysis?: () => void;
}) {
  const S = useStore();
  const { colors, t, num } = S;
  const s = sumTotals(items);
  return (
    <Card highlight={now}>
      <Between style={{ alignItems: 'flex-start' }}>
        <View style={{ flexShrink: 1 }}>
          <Row gap={6}>
            <Txt w="extrabold" size={17}>{title}</Txt>
            {now ? <Txt w="extrabold" size={10} color={colors.accent} style={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>{t('win_now')}</Txt> : null}
          </Row>
          {time ? <Txt size={12} color={colors.muted} w="semibold">{time}</Txt> : null}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Txt w="extrabold" size={20}>{num(s.k)}<Txt w="bold" size={12} color={colors.muted}> kcal</Txt></Txt>
          {items.length ? <Txt size={12} w="semibold" color={colors.muted}>{t('s_p')} {num(s.p)} · {t('s_c')} {num(s.c)} · {t('s_f')} {num(s.f)} · {t('s_s')} {num(s.s)}</Txt> : null}
        </View>
      </Between>
      {items.map((e) => (
        <View key={e.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 8, borderTopWidth: 1, borderColor: colors.line }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt w="semibold" size={15}>{S.entryName(e)}</Txt>
            <Txt size={12} color={colors.muted}>{entryQty(e, t, num)}</Txt>
          </View>
          <Txt w="extrabold">{num(e.k)}</Txt>
          <Pressable accessibilityRole="button" accessibilityLabel={t('delete_x', { n: S.entryName(e) })} onPress={() => onRemove(e.id)} hitSlop={8}
            style={{ width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="close" size={18} color={colors.muted} />
          </Pressable>
        </View>
      ))}
      {onAdd ? (
        <Row gap={8}>
          <Btn kind="ghost" label={t('btn_add')} onPress={onAdd} style={{ flex: 1, paddingVertical: 9 }} />
          {onAnalysis ? <Btn kind="secondary" label={t('btn_analysis')} onPress={onAnalysis} style={{ flex: 1, paddingVertical: 9 }} /> : null}
        </Row>
      ) : null}
    </Card>
  );
}
