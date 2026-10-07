import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Switch, View } from 'react-native';

import { currentWindowId, nowMs } from '@/lib/dates';
import { parseNum, r1, r2 } from '@/lib/format';
import { computePortion, sumTotals, zoneOf } from '@/lib/nutrition';
import type { AnyFood, BaseFood, Entry, MyFood } from '@/lib/types';
import { BASE, BASE_BY_ID, newId, norm, useStore } from '@/state/store';
import { Between, Btn, Chip, Chips, Field, Label, Note, Row, Screen, Txt, grid } from '@/ui/kit';
import { useToast } from '@/ui/toast';

type Form = { n: string; k: string; p: string; f: string; c: string; s: string; fi: string; sa: string; piece: string };
const EMPTY: Form = { n: '', k: '', p: '', f: '', c: '', s: '', fi: '', sa: '', piece: '' };

export default function AddSheet() {
  const S = useStore();
  const { colors, t, num, signed, windows } = S;
  const toast = useToast();
  const params = useLocalSearchParams<{ win?: string; day?: string; edit?: string }>();
  const day = params.day || S.today;
  const editing = params.edit != null ? S.myFoods.find((f) => f.n === params.edit) : undefined;

  const [win, setWin] = useState(params.win || (day === S.today ? currentWindowId(windows, new Date()) : windows[0].id));
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<AnyFood | null>(null);
  const [mode, setMode] = useState<'new' | 'edit' | null>(editing ? 'edit' : null);
  const [form, setForm] = useState<Form>(editing ? toForm(editing) : EMPTY);
  const [saveMine, setSaveMine] = useState(true);
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState<'g' | 'kom'>('g');
  const [size, setSize] = useState(0);
  const [peel, setPeel] = useState(false);
  const [peelPct, setPeelPct] = useState('');
  const [scanMsg, setScanMsg] = useState(false);

  const setF = (k: keyof Form) => (v: string) => setForm((x) => ({ ...x, [k]: v }));

  // the food the amount applies to
  const food: AnyFood | null = useMemo(() => {
    if (sel) return sel;
    if (mode) {
      const k = parseNum(form.k);
      if (!form.n.trim() || k == null || k < 0) return null;
      const pc = parseNum(form.piece);
      return {
        mine: true, n: form.n.trim(), g: pc && pc > 0 ? pc : 100, k,
        p: parseNum(form.p) ?? 0, f: parseNum(form.f) ?? 0, c: parseNum(form.c) ?? 0,
        s: parseNum(form.s), fi: parseNum(form.fi), sa: parseNum(form.sa),
        ...(pc && pc > 0 ? { u: [['kom', pc]] } : {}),
      } as AnyFood;
    }
    return null;
  }, [sel, mode, form]);

  const effUnit = unit === 'kom' && food?.u?.length ? 'kom' : 'g';
  const portion = food ? computePortion(food, { amount: parseNum(amount) ?? 0, mode: effUnit, sizeIndex: size, peel, peelPct: parseNum(peelPct) }) : null;

  const burn = S.day(day).burn;
  const afterBal = portion && burn ? sumTotals(S.day(day).entries).k + portion.k - burn.total : null;

  // ----- search -----
  const all: AnyFood[] = useMemo(() => {
    const mine = S.myFoods.map((f) => ({ ...f, mine: true }) as AnyFood);
    const names = new Set(mine.map((f) => norm(f.n)));
    return [...mine, ...BASE.filter((f) => !names.has(norm(S.foodName(f)))).map((f) => ({ ...f, mine: false }) as AnyFood)];
  }, [S]);
  const qn = norm(q.trim());
  const hits = qn
    ? all
        .filter((f) => (f.nm ? Object.values(f.nm).some((x) => norm(x).includes(qn)) : norm(f.n).includes(qn)))
        .sort((a, b) => Number(!!b.mine) - Number(!!a.mine) || norm(S.foodName(a)).indexOf(qn) - norm(S.foodName(b)).indexOf(qn))
        .slice(0, 8)
    : [];
  const recent: AnyFood[] = useMemo(() => {
    const seen = new Map<string, AnyFood>();
    for (const k of Object.keys(S.dayDocs).sort().reverse())
      for (const e of [...(S.dayDocs[k]?.entries ?? [])].reverse()) {
        const f = e.fid ? BASE_BY_ID[e.fid] : S.myFoods.find((m) => norm(m.n) === norm(e.n));
        if (!f) continue;
        const key = (f as BaseFood).id || norm(f.n);
        if (!seen.has(key)) seen.set(key, (f as BaseFood).id ? ({ ...f, mine: false } as AnyFood) : ({ ...f, mine: true } as AnyFood));
      }
    return [...seen.values()].slice(0, 8);
  }, [S.dayDocs, S.myFoods]);
  const quick = recent.length ? recent : ['01123', '08120', '09040', '05064', '20045', '01256'].map((id) => ({ ...BASE_BY_ID[id], mine: false }) as AnyFood);

  const pick = (f: AnyFood) => {
    setSel(f); setMode(null); setQ('');
    if (f.u?.length) { setUnit('kom'); setSize(f.du ?? 0); setAmount('1'); } else { setUnit('g'); setAmount(String(f.g || 100)); }
    if (f.r) { setPeel(!!f.rd); setPeelPct(String(f.r)); } else { setPeel(false); setPeelPct(''); }
  };
  const openNew = (name: string) => { setSel(null); setMode('new'); setForm({ ...EMPTY, n: name }); setAmount('100'); setUnit('g'); setPeel(false); };
  const reset = () => { setSel(null); setMode(null); setForm(EMPTY); setAmount(''); setQ(''); setScanMsg(false); };

  const saveFood = (f: MyFood, replaceName?: string) => {
    const items = (S.docs.foods as { items: MyFood[] } | undefined)?.items ?? [];
    const clean: MyFood = { n: f.n, k: f.k, p: f.p, f: f.f, c: f.c, g: f.u ? f.u[0][1] : 100 };
    if (f.s != null) clean.s = f.s; if (f.fi != null) clean.fi = f.fi; if (f.sa != null) clean.sa = f.sa; if (f.u) clean.u = f.u;
    S.setDoc('foods', { items: [clean, ...items.filter((x) => norm(x.n) !== norm(f.n) && (!replaceName || norm(x.n) !== norm(replaceName)))] });
  };

  const add = () => {
    if (!food || !portion) return;
    const doc = S.day(day);
    const e: Entry = {
      id: newId(), meal: win, n: food.nm ? food.nm.sr : food.n, g: r1(portion.g),
      k: r1(portion.k), p: r1(portion.p), f: r1(portion.f), c: r1(portion.c), t: nowMs(), ...portion.qinfo,
    };
    if (food.id) e.fid = food.id;
    if (e.qa != null) e.qa = r1(e.qa);
    if (e.qp != null) e.qp = r1(e.qp);
    if (portion.hasSugar) e.s = r1(portion.s);
    if (food.fi != null) e.fi = r1(portion.fi);
    if (food.sa != null) e.sa = r2(portion.sa);
    if (portion.mi) e.mi = portion.mi;
    S.setDoc(day, { ...doc, entries: [...doc.entries, e] });
    if (mode === 'new' && saveMine) saveFood(food as MyFood);
    toast(t('added', { w: S.winLabel(windows.find((w) => w.id === win) ?? windows[0]), n: S.foodName(food), k: num(portion.k) }));
    router.back();
  };

  const winName = S.winLabel(windows.find((w) => w.id === win) ?? windows[0]);
  const showAmount = !!sel || mode === 'new';

  return (
    <Screen bottomPad={40}>
      <Between>
        <Txt w="extrabold" size={26}>{t(mode === 'edit' ? 'edit_title' : 'add_title')}</Txt>
        <Pressable accessibilityRole="button" accessibilityLabel={t('close')} onPress={() => router.back()}
          style={{ width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="close" size={20} color={colors.fg} />
        </Pressable>
      </Between>

      {mode !== 'edit' ? (
        <View style={{ gap: 8 }}>
          <Label>{t('meal')}</Label>
          <Chips>{windows.map((w) => <Chip key={w.id} label={S.winLabel(w)} on={win === w.id} onPress={() => setWin(w.id)} />)}</Chips>
        </View>
      ) : null}

      {!sel && !mode ? (
        <View style={{ gap: 10 }}>
          <Btn label={t('scan_big')} onPress={() => setScanMsg(true)} icon={<Ionicons name="scan-outline" size={20} color={colors.accentInk} />} />
          {scanMsg ? <Note text={t('soon_scan')} /> : null}
          <Label>{t('or_search')}</Label>
          <Field value={q} onChangeText={setQ} placeholder={t('search_ph')} autoCorrect={false} returnKeyType="search" onSubmitEditing={() => hits[0] ? pick(hits[0]) : q.trim() && openNew(q.trim())} />
          {qn ? (
            <View style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 14, overflow: 'hidden', backgroundColor: colors.surface }}>
              {hits.map((f, i) => (
                <Pressable key={(f.id || 'm-') + f.n} onPress={() => pick(f)} style={({ pressed }) => ({ flexDirection: 'row', justifyContent: 'space-between', gap: 10, padding: 12, borderTopWidth: i ? 1 : 0, borderColor: colors.line, backgroundColor: pressed ? colors.surface2 : 'transparent' })}>
                  <Txt w="semibold" style={{ flex: 1 }}>{S.foodName(f)}{f.mine ? <Txt w="extrabold" size={10} color={colors.accent}>{'  '}{t('mine_tag').toUpperCase()}</Txt> : null}</Txt>
                  <Txt size={13} color={colors.muted}>{t('kcal100', { k: num(f.k) })}</Txt>
                </Pressable>
              ))}
              <Pressable onPress={() => openNew(q.trim())} style={({ pressed }) => ({ flexDirection: 'row', justifyContent: 'space-between', gap: 10, padding: 12, borderTopWidth: hits.length ? 1 : 0, borderColor: colors.line, backgroundColor: pressed ? colors.surface2 : 'transparent' })}>
                <Txt w="semibold" color={colors.accent} style={{ flex: 1 }}>{t(hits.length ? 'new_named' : 'not_listed', { q: q.trim() })}</Txt>
                <Txt size={13} color={colors.muted}>{t('manual_or_photo')}</Txt>
              </Pressable>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              <Label>{t(recent.length ? 'recent' : 'quick')}</Label>
              <Chips>{quick.map((f) => <Chip key={(f.id || 'm-') + f.n} label={S.foodName(f)} onPress={() => pick(f)} />)}</Chips>
            </View>
          )}
          <Pressable onPress={() => openNew(q.trim())}><Txt w="bold" color={colors.accent}>{t('to_manual')}</Txt></Pressable>
        </View>
      ) : null}

      {sel ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 12 }}>
          <Txt w="extrabold" style={{ flex: 1 }}>{S.foodName(sel)}</Txt>
          <Pressable onPress={reset}><Txt w="bold" color={colors.accent}>{t('change')}</Txt></Pressable>
        </View>
      ) : null}

      {mode ? (
        <View style={{ gap: 10 }}>
          <Between>
            <Label>{mode === 'edit' ? t('editing', { n: params.edit ?? '' }) : t('new_food')}</Label>
            <Pressable onPress={() => setScanMsg(true)}><Row gap={6}><Ionicons name="scan-outline" size={16} color={colors.accent} /><Txt w="bold" size={13} color={colors.accent}>{t('scan_short')}</Txt></Row></Pressable>
          </Between>
          {scanMsg ? <Note text={t('soon_scan')} /> : null}
          <Field label={t('name_label')} value={form.n} onChangeText={setF('n')} placeholder={t('name_ph')} />
          <Label>{t('per100')}</Label>
          <View style={grid.two}>
            {(['k', 'p', 'f', 'c', 's', 'fi', 'sa', 'piece'] as (keyof Form)[]).map((key) => (
              <Field key={key} style={grid.quarter} label={t({ k: 'f_kcal', p: 'f_prot', f: 'f_fat', c: 'f_carb', s: 'f_sugar', fi: 'f_fiber', sa: 'f_salt', piece: 'f_piece', n: '' }[key])}
                value={form[key]} onChangeText={setF(key)} keyboardType="decimal-pad" placeholder={key === 'piece' ? t('optional') : ''} />
            ))}
          </View>
          {mode === 'new' ? (
            <Row><Switch value={saveMine} onValueChange={setSaveMine} trackColor={{ true: colors.accent }} /><Txt w="semibold" style={{ flex: 1 }}>{t('save_mine')}</Txt></Row>
          ) : (
            <Row>
              <Btn label={t('save_changes')} style={{ flex: 1 }} onPress={() => {
                if (!food) { toast(t('need_name')); return; }
                saveFood(food as MyFood, params.edit); toast(t('changes_saved')); router.back();
              }} />
              <Btn kind="secondary" label={t('cancel')} onPress={() => router.back()} />
            </Row>
          )}
        </View>
      ) : null}

      {showAmount ? (
        <View style={{ gap: 10 }}>
          {food?.u?.length ? (
            <Row gap={0} style={{ alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.line, borderRadius: 12, overflow: 'hidden' }}>
              {(['kom', 'g'] as const).map((u) => (
                <Pressable key={u} accessibilityRole="button" accessibilityState={{ selected: effUnit === u }}
                  onPress={() => { if (u !== effUnit) { setUnit(u); setAmount(u === 'kom' ? '1' : String(food.g || 100)); } }}
                  style={{ paddingVertical: 8, paddingHorizontal: 14, backgroundColor: effUnit === u ? colors.accent : colors.surface2 }}>
                  <Txt w="bold" size={14} color={effUnit === u ? colors.accentInk : colors.fg}>
                    {u === 'g' ? t('grams') : t(food.u!.length === 1 && food.u![0][0] === 'kriška' ? 'slices' : 'pieces')}
                  </Txt>
                </Pressable>
              ))}
            </Row>
          ) : null}
          {effUnit === 'kom' && food?.u && food.u.length > 1 ? (
            <View style={{ gap: 6 }}>
              <Label>{t('size_eu')}</Label>
              <Chips>{food.u.map(([l, g], i) => <Chip key={l} label={`${l} · ${g} g`} on={size === i} onPress={() => setSize(i)} />)}</Chips>
            </View>
          ) : null}
          <Field label={t(effUnit === 'kom' ? 'amt_pcs' : peel && food?.r ? 'amt_scale' : 'amt_g')} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" selectTextOnFocus />
          {food?.r && effUnit === 'g' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 10 }}>
              <Switch value={peel} onValueChange={setPeel} trackColor={{ true: colors.accent }} />
              <Txt w="semibold" style={{ flex: 1, minWidth: 150 }}>{t('peel')}</Txt>
              <Row gap={6}>
                <Txt size={13} color={colors.muted}>{t('deduct')}</Txt>
                <Field value={peelPct} onChangeText={setPeelPct} keyboardType="decimal-pad" editable={peel} style={{ width: 70, flex: 0 }} />
                <Txt size={13} color={colors.muted}>%</Txt>
              </Row>
            </View>
          ) : null}

          <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 12, gap: 4 }}>
            <Label>{t('total')}</Label>
            {portion ? (
              <>
                <Txt size={15} color={colors.muted}>
                  <Txt w="extrabold" size={22}>{num(portion.k)}</Txt> kcal   {t('s_p')} <Txt w="extrabold">{num(portion.p, 1)}</Txt>   {t('s_c')} <Txt w="extrabold">{num(portion.c, 1)}</Txt>   {t('s_f')} <Txt w="extrabold">{num(portion.f, 1)}</Txt>{portion.hasSugar ? <>   {t('s_s')} <Txt w="extrabold">{num(portion.s, 1)}</Txt></> : null}
                </Txt>
                {portion.qinfo.qk !== 'g' ? <Txt size={13} color={colors.muted}>{t('edible', { g: num(portion.g) })}</Txt> : null}
                {afterBal != null ? (() => {
                  const z = zoneOf(afterBal, S.profile);
                  return <Txt w="bold" size={14} color={z.ok ? colors.accent : colors.over}>{t('bal_after', { b: signed(afterBal), z: t(z.key) })}</Txt>;
                })() : null}
              </>
            ) : <Txt color={colors.muted}>—</Txt>}
          </View>

          <Btn label={t('add_to', { w: winName })} onPress={add} disabled={!portion} />
          {mode === 'new' ? (
            <Btn kind="secondary" label={t('save_only')} disabled={!food} onPress={() => { if (!food) return; saveFood(food as MyFood); toast(t('saved_mine', { n: food.n })); router.back(); }} />
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}

function toForm(f: MyFood): Form {
  const s = (v: number | null | undefined) => (v == null ? '' : String(r2(v)));
  return { n: f.n, k: s(f.k), p: s(f.p), f: s(f.f), c: s(f.c), s: s(f.s), fi: s(f.fi), sa: s(f.sa), piece: f.u ? String(f.u[0][1]) : '' };
}
