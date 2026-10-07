import { View } from 'react-native';

import type { Zone } from '@/lib/nutrition';
import { useStore } from '@/state/store';
import { Txt } from './kit';

/** Horizontal scale: green band = the user's zone, dot = current balance, tick = zero. */
export function BalanceScale({ balance, zone }: { balance: number; zone: Zone }) {
  const { colors, num, signed, t } = useStore();
  const span = Math.max(800, Math.abs(balance) + 150, Math.abs(zone.lo) + 150, Math.abs(zone.hi) + 150);
  const pos = (x: number) => ((x + span) / (2 * span)) * 100;
  const clamped = Math.max(-span, Math.min(span, balance));
  return (
    <View style={{ gap: 4 }}>
      <View style={{ height: 14, borderRadius: 99, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line, marginTop: 4 }}>
        <View style={{ position: 'absolute', top: 0, bottom: 0, left: `${pos(zone.lo)}%`, width: `${((zone.hi - zone.lo) / (2 * span)) * 100}%`, backgroundColor: colors.accentSoft, borderLeftWidth: 2, borderRightWidth: 2, borderColor: colors.accent }} />
        <View style={{ position: 'absolute', top: -3, bottom: -3, width: 2, left: `${pos(0)}%`, backgroundColor: colors.muted, opacity: 0.6 }} />
        <View style={{ position: 'absolute', top: -3, width: 18, height: 18, marginLeft: -9, borderRadius: 9, left: `${pos(clamped)}%`, backgroundColor: zone.ok ? colors.accent : colors.over, borderWidth: 3, borderColor: colors.surface }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Txt size={11} w="bold" color={colors.muted}>−{num(span)}</Txt>
        <Txt size={11} w="bold" color={colors.muted}>{t('zone_range', { a: signed(zone.lo), b: signed(zone.hi) })}</Txt>
        <Txt size={11} w="bold" color={colors.muted}>+{num(span)}</Txt>
      </View>
    </View>
  );
}

export function ZonePill({ zone }: { zone: Zone }) {
  const { colors, t } = useStore();
  return (
    <View style={{ borderRadius: 99, paddingVertical: 4, paddingHorizontal: 10, backgroundColor: zone.ok ? colors.accentSoft : colors.surface2, borderWidth: zone.ok ? 0 : 1, borderColor: colors.over, flexShrink: 1 }}>
      <Txt size={12} w="extrabold" color={zone.ok ? colors.accent : colors.over} numberOfLines={2}>{t(zone.key)}</Txt>
    </View>
  );
}
