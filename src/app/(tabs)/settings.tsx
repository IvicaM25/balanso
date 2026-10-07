import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { LANGS } from '@/i18n/strings';
import { isTime, normTime } from '@/lib/dates';
import { DEF_GOALS, DEF_PROFILE, DEF_WINDOWS } from '@/lib/defaults';
import { parseNum, r1 } from '@/lib/format';
import type { Goal, Goals, MealWindow, Profile, Sex, ThemeChoice } from '@/lib/types';
import { newId, useStore } from '@/state/store';
import { Between, Btn, Card, Chip, Chips, Field, Label, Row, Screen, Txt, grid } from '@/ui/kit';
import { useToast } from '@/ui/toast';

const str = (o: Record<string, number>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, String(v)]));

export default function SettingsScreen() {
  const S = useStore();
  const { colors, t } = S;
  const toast = useToast();

  const [prof, setProf] = useState<Profile>(S.profile);
  const [limits, setLimits] = useState(str({ tm: S.profile.tm, teven: S.profile.teven, tlm: S.profile.tlm, tlf: S.profile.tlf, tgain: S.profile.tgain }));
  const [goals, setGoals] = useState(str(S.goals as unknown as Record<string, number>));
  const [dayStart, setDayStart] = useState(S.dayStart);
  const [wins, setWins] = useState<MealWindow[]>(() => S.windows.map((w) => ({ ...w, n: S.winLabel(w) })));

  const theme = S.settings.theme || 'auto';
  const langSel = S.settings.lang || 'auto';

  const saveProfile = () => {
    const out = { ...prof };
    for (const k of ['tm', 'teven', 'tlm', 'tlf', 'tgain'] as const) {
      const v = parseNum(limits[k]);
      out[k] = v == null || v < 0 ? DEF_PROFILE[k] : Math.round(v);
    }
    S.saveSettings({ profile: out });
    toast(t('profile_saved'));
  };
  const saveGoals = () => {
    const g = {} as Goals;
    for (const k of Object.keys(DEF_GOALS) as (keyof Goals)[]) {
      const v = parseNum(goals[k]);
      g[k] = v == null || v < 0 ? DEF_GOALS[k] : k === 'sa' ? r1(v) : Math.round(v);
    }
    if (!g.k) g.k = DEF_GOALS.k;
    S.saveSettings({ goals: g });
    toast(t('goals_saved'));
  };
  const saveDayStart = () => {
    if (!isTime(dayStart)) { toast(t('time_bad')); return; }
    const v = normTime(dayStart);
    S.saveSettings({ dayStart: v });
    toast(t('daystart_saved', { t: v }));
  };
  const saveWins = () => {
    if (wins.some((w) => !isTime(w.from) || !isTime(w.to))) { toast(t('time_bad')); return; }
    S.saveSettings({ windows: wins.map((w) => ({ id: w.id, n: (w.n || '').trim() || t('meal'), from: normTime(w.from), to: normTime(w.to) })) });
    toast(t('meals_saved'));
  };
  const patchWin = (i: number, p: Partial<MealWindow>) => setWins((ws) => ws.map((w, j) => (j === i ? { ...w, ...p } : w)));
  const move = (i: number, d: number) => setWins((ws) => { const a = [...ws]; [a[i], a[i + d]] = [a[i + d], a[i]]; return a; });

  return (
    <Screen>
      <Txt w="extrabold" size={26}>{t('set_title')}</Txt>

      <Card>
        <Txt w="extrabold" size={17}>{t('lang')}</Txt>
        <Chips>
          <Chip label={t('lang_auto_short')} on={langSel === 'auto'} onPress={() => S.saveSettings({ lang: 'auto' })} />
          {LANGS.map(([c, n]) => <Chip key={c} label={n} on={langSel === c} onPress={() => S.saveSettings({ lang: c })} />)}
        </Chips>
        <Txt w="extrabold" size={17} style={{ marginTop: 6 }}>{t('theme')}</Txt>
        <Chips>
          {([['auto', 'th_auto'], ['light', 'th_light'], ['dark', 'th_dark']] as [ThemeChoice, string][]).map(([v, k]) =>
            <Chip key={v} label={t(k)} on={theme === v} onPress={() => S.saveSettings({ theme: v })} />)}
        </Chips>
        <Txt size={13} color={colors.muted}>{t('theme_note')}</Txt>
      </Card>

      <Card>
        <Txt w="extrabold" size={17}>{t('profile')}</Txt>
        <Label>{t('sex')}</Label>
        <Chips>{([['m', 'male'], ['f', 'female']] as [Sex, string][]).map(([v, k]) => <Chip key={v} label={t(k)} on={prof.sex === v} onPress={() => setProf({ ...prof, sex: v })} />)}</Chips>
        <Label>{t('goal')}</Label>
        <Chips>{([['maintain', 'goal_maintain'], ['lose', 'goal_lose'], ['gain', 'goal_gain']] as [Goal, string][]).map(([v, k]) =>
          <Chip key={v} label={t(k)} on={prof.goal === v} onPress={() => setProf({ ...prof, goal: v })} />)}</Chips>
        <Label>{t('limits')}</Label>
        <View style={grid.two}>
          {(['tm', 'teven', 'tlm', 'tlf', 'tgain'] as const).map((k) => (
            <Field key={k} style={grid.half} label={t({ tm: 't_m', teven: 't_even', tlm: 't_lm', tlf: 't_lf', tgain: 't_gain' }[k])}
              value={limits[k]} onChangeText={(v) => setLimits({ ...limits, [k]: v })} keyboardType="number-pad" />
          ))}
        </View>
        <Btn label={t('save_profile')} onPress={saveProfile} />
      </Card>

      <Card>
        <Txt w="extrabold" size={17}>{t('goals_t')}</Txt>
        <View style={grid.two}>
          {(['k', 'p', 'f', 'c', 's', 'sa', 'fi'] as (keyof Goals)[]).map((k) => (
            <Field key={k} style={grid.quarter} label={k === 'k' ? 'kcal' : t({ p: 'f_prot', f: 'f_fat', c: 'f_carb', s: 'f_sugar', sa: 'f_salt', fi: 'f_fiber' }[k])}
              value={goals[k]} onChangeText={(v) => setGoals({ ...goals, [k]: v })} keyboardType="decimal-pad" />
          ))}
        </View>
        <Btn label={t('save_goals')} onPress={saveGoals} />
      </Card>

      <Card>
        <Txt w="extrabold" size={17}>{t('daystart_t')}</Txt>
        <Txt size={14} color={colors.muted}>{t('daystart_note')}</Txt>
        <Row>
          <Field value={dayStart} onChangeText={setDayStart} placeholder="00:00" keyboardType="numbers-and-punctuation" style={{ maxWidth: 120 }} />
          <Btn kind="secondary" label={t('save')} onPress={saveDayStart} />
        </Row>
      </Card>

      <Card>
        <Between>
          <Txt w="extrabold" size={17}>{t('meals_t')}</Txt>
          <Pressable onPress={() => { setWins(DEF_WINDOWS.map((w) => ({ ...w, n: t(w.nk!) }))); toast(t('reset_done')); }}>
            <Txt w="bold" size={14} color={colors.accent}>{t('reset_def')}</Txt>
          </Pressable>
        </Between>
        <Txt size={14} color={colors.muted}>{t('meals_note')}</Txt>
        {wins.map((w, i) => (
          <View key={w.id} style={{ gap: 8, paddingTop: 10, borderTopWidth: i ? 1 : 0, borderColor: colors.line }}>
            <Row>
              <Field value={w.n} onChangeText={(v) => patchWin(i, { n: v })} accessibilityLabel={t('meal_name')} />
              <IconBtn icon="arrow-up" label={t('up')} disabled={i === 0} onPress={() => move(i, -1)} />
              <IconBtn icon="arrow-down" label={t('down')} disabled={i === wins.length - 1} onPress={() => move(i, 1)} />
              <IconBtn icon="close" label={t('delete_x', { n: w.n || '' })} disabled={wins.length < 2} onPress={() => setWins(wins.filter((_, j) => j !== i))} />
            </Row>
            <Row>
              <Txt size={13} color={colors.muted}>{t('from')}</Txt>
              <Field value={w.from} onChangeText={(v) => patchWin(i, { from: v })} keyboardType="numbers-and-punctuation" style={{ maxWidth: 90 }} />
              <Txt size={13} color={colors.muted}>{t('to')}</Txt>
              <Field value={w.to} onChangeText={(v) => patchWin(i, { to: v })} keyboardType="numbers-and-punctuation" style={{ maxWidth: 90 }} />
            </Row>
          </View>
        ))}
        <Row>
          <Btn kind="secondary" label={t('add_meal_btn')} style={{ flex: 1 }} onPress={() => setWins([...wins, { id: 'w' + newId(), n: t('new_meal'), from: '12:00', to: '13:00' }])} />
          <Btn label={t('save_meals')} style={{ flex: 1 }} onPress={saveWins} />
        </Row>
      </Card>

      <Txt size={12} color={colors.muted} style={{ textAlign: 'center' }}>{t('foot_local')} {t('foot_src')}</Txt>
    </Screen>
  );
}

function IconBtn({ icon, label, onPress, disabled }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; disabled?: boolean }) {
  const { colors } = useStore();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress}
      style={{ width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.35 : 1 }}>
      <Ionicons name={icon} size={17} color={colors.fg} />
    </Pressable>
  );
}
