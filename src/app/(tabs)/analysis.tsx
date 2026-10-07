import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { analyze } from '@/lib/analysis';
import { zoneOf } from '@/lib/nutrition';
import { useStore } from '@/state/store';
import { Card, Chip, Chips, Empty, Label, Note, Screen, Txt } from '@/ui/kit';

const PERIODS = [3, 7, 14, 30];

export default function AnalysisScreen() {
  const S = useStore();
  const { colors, t, num, signed, windows, goals: G } = S;
  const params = useLocalSearchParams<{ scope?: string }>();
  // a meal's "Analysis" button passes ?scope=…; a chip tap overrides it until the param changes
  const [pickedScope, setPicked] = useState<{ from?: string; v: string }>({ from: params.scope, v: params.scope ?? 'day' });
  const scope = pickedScope.from === params.scope ? pickedScope.v : params.scope ?? 'day';
  const setScope = (v: string) => setPicked({ from: params.scope, v });
  const [period, setPeriod] = useState(7);

  const W = windows.find((w) => w.id === scope);
  const sc = W ? scope : 'day';
  const isWin = sc !== 'day';
  const sname = W ? `${S.winLabel(W)} (${W.from}–${W.to})` : t('whole_day_lc');
  const A = analyze(S.dayDocs, S.today, period, sc, S.entryName);
  const withBal = !isWin && A.days.some((d) => d.burn);

  const stat = (v: string, l: string) => (
    <View key={l} style={{ flexBasis: '30%', flexGrow: 1, minWidth: 100, backgroundColor: colors.surface2, borderRadius: 14, padding: 10 }}>
      <Txt w="extrabold" size={19}>{v}</Txt>
      <Txt w="bold" size={11} color={colors.muted}>{l}</Txt>
    </View>
  );
  const cols = [t('col_day'), 'kcal', t('s_p'), t('s_c'), t('s_f'), t('m_sugar'), t('m_salt'), ...(withBal ? [t('col_burn'), t('col_bal')] : [])];
  const cell = (key: string, txt: string, first: boolean, opts: { bold?: boolean; color?: string } = {}) => (
    <Txt key={key} w={opts.bold ? 'extrabold' : 'medium'} size={13} color={opts.color}
      style={{ width: first ? 92 : 64, textAlign: first ? 'left' : 'right', paddingVertical: 8, paddingHorizontal: 6 }}>{txt}</Txt>
  );

  return (
    <Screen>
      <Txt w="extrabold" size={26}>{t('an_title')}</Txt>
      <Card>
        <Label>{t('an_what')}</Label>
        <Chips>
          <Chip label={t('whole_day')} on={sc === 'day'} onPress={() => setScope('day')} />
          {windows.map((w) => <Chip key={w.id} label={`${S.winLabel(w)} ${w.from}`} on={sc === w.id} onPress={() => setScope(w.id)} />)}
        </Chips>
        <Label>{t('an_period')}</Label>
        <Chips>{PERIODS.map((n) => <Chip key={n} label={t('days_n', { n })} on={period === n} onPress={() => setPeriod(n)} />)}</Chips>
      </Card>

      {!A.logged ? <Empty text={t('an_none', { s: sname, n: period })} /> : (
        <>
          <Card>
            <Txt w="extrabold" size={17}>{t('an_avg', { s: sname })}</Txt>
            <Txt size={13} color={colors.muted}>{t('an_cov', { a: A.logged, b: period })}</Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {stat(`${num(A.avg.k)} kcal`, isWin ? t('pct_day_kcal', { p: num(A.share.k) }) : t('goal_x', { g: num(G.k) }))}
              {stat(`${num(A.avg.p, 1)} g`, t('m_prot'))}
              {stat(`${num(A.avg.c, 1)} g`, t('m_carb'))}
              {stat(`${num(A.avg.f, 1)} g`, t('m_fat'))}
              {stat(`${num(A.avg.s, 1)} g`, isWin ? t('sugar_share', { p: num(A.share.s) }) : t('sugar_goal', { g: num(G.s) }))}
              {stat(`${num(A.avg.sa, 2)} g`, isWin ? t('salt_share', { p: num(A.share.sa) }) : t('salt_goal', { g: num(G.sa, 1) }))}
            </View>
          </Card>

          <Card>
            <Txt w="extrabold" size={17}>{t('by_day')}</Txt>
            <ScrollView horizontal style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 14 }}>
              <View>
                <View style={{ flexDirection: 'row', backgroundColor: colors.surface2 }}>
                  {cols.map((c, i) => <Txt key={c + i} w="bold" size={10} color={colors.muted} style={{ width: i ? 64 : 92, textAlign: i ? 'right' : 'left', paddingVertical: 8, paddingHorizontal: 6, textTransform: 'uppercase' }}>{c}</Txt>)}
                </View>
                {[...A.days].reverse().map((d) => (
                  <View key={d.k} style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: colors.line }}>
                    {cell('d', S.dayLabel(d.k), true)}
                    {d.items.length
                      ? [num(d.t.k), num(d.t.p), num(d.t.c), num(d.t.f), num(d.t.s), num(d.t.sa, 1)].map((x, i) => cell('v' + i, x, false))
                      : <Txt size={13} color={colors.muted} style={{ width: 64 * 6, textAlign: 'center', paddingVertical: 8 }}>{t('no_entries')}</Txt>}
                    {withBal ? [cell('b', d.burn ? num(d.burn.total) : '–', false),
                      cell('bal', d.bal == null ? '–' : signed(d.bal), false, { color: d.bal == null ? undefined : zoneOf(d.bal, S.profile).ok ? colors.accent : colors.over })] : null}
                  </View>
                ))}
                <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: colors.line, backgroundColor: colors.surface2 }}>
                  {cell('d', t('average'), true, { bold: true })}
                  {[num(A.avg.k), num(A.avg.p), num(A.avg.c), num(A.avg.f), num(A.avg.s), num(A.avg.sa, 1)].map((x, i) => cell('v' + i, x, false, { bold: true }))}
                  {withBal ? [cell('b', A.avgBurn == null ? '–' : num(A.avgBurn), false, { bold: true }), cell('bal', A.avgBal == null ? '–' : signed(A.avgBal), false, { bold: true })] : null}
                </View>
              </View>
            </ScrollView>
          </Card>

          <Card>
            <Txt w="extrabold" size={17}>{t('top_t')}</Txt>
            {A.top.map((f, i) => (
              <View key={f.n} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 8, borderTopWidth: i ? 1 : 0, borderColor: colors.line }}>
                <View style={{ flex: 1 }}>
                  <Txt w="semibold">{f.n}</Txt>
                  <Txt size={12} color={colors.muted}>{t('top_line', { c: f.cnt, s: num(f.s, 1), p: num(f.p, 1) })}</Txt>
                </View>
                <Txt w="extrabold">{num(f.k)} kcal</Txt>
              </View>
            ))}
          </Card>

          <Card>
            <Txt w="extrabold" size={17}>{t('ai_t')}</Txt>
            <Txt size={13} color={colors.muted}>{t('ai_note')}</Txt>
            <Note text={t('soon_ai')} />
          </Card>
        </>
      )}
    </Screen>
  );
}
