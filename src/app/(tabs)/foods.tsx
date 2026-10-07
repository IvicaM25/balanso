import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import type { MyFood } from '@/lib/types';
import { norm, useStore } from '@/state/store';
import { Btn, Card, Empty, Field, Screen, Txt } from '@/ui/kit';
import { useToast } from '@/ui/toast';

export default function Foods() {
  const S = useStore();
  const { colors, t, num } = S;
  const toast = useToast();
  const [q, setQ] = useState('');
  const [confirm, setConfirm] = useState<string | null>(null);
  const items = S.myFoods;
  const list = items.filter((f) => !q.trim() || norm(f.n).includes(norm(q.trim())));

  const del = (n: string) => {
    S.setDoc('foods', { items: items.filter((x: MyFood) => x.n !== n) });
    setConfirm(null);
    toast(t('deleted_food', { n }));
  };

  return (
    <Screen>
      <Txt w="extrabold" size={26}>{t('foods_title')}</Txt>
      <Txt color={colors.muted}>{t('foods_intro')}</Txt>
      <Field value={q} onChangeText={setQ} placeholder={t('foods_search_ph')} autoCorrect={false} />
      {!items.length ? <Empty text={t('foods_empty')} /> : (
        <Card style={{ paddingVertical: 6, gap: 0 }}>
          {list.map((f, i) => (
            <View key={f.n} style={{ paddingVertical: 10, gap: 8, borderTopWidth: i ? 1 : 0, borderColor: colors.line }}>
              <Txt w="semibold">{f.n}</Txt>
              <Txt size={12} color={colors.muted}>
                {num(f.k)} kcal · {t('s_p')} {num(f.p, 1)} · {t('s_c')} {num(f.c, 1)} · {t('s_f')} {num(f.f, 1)}{f.s != null ? ` · ${t('s_s')} ${num(f.s, 1)}` : ''} {t('per100g')}{f.u ? ` · ${t('piece_g', { g: num(f.u[0][1]) })}` : ''}
              </Txt>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Btn kind="secondary" label={t('edit')} style={{ paddingVertical: 7 }} onPress={() => router.push({ pathname: '/add', params: { edit: f.n } })} />
                {confirm === f.n
                  ? <Btn kind="danger" label={t('confirm')} style={{ paddingVertical: 7 }} onPress={() => del(f.n)} />
                  : <Btn kind="secondary" label={t('del')} style={{ paddingVertical: 7 }} onPress={() => setConfirm(f.n)} />}
              </View>
            </View>
          ))}
        </Card>
      )}
    </Screen>
  );
}
