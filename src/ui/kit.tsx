import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type TextStyle, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStore } from '@/state/store';
import { FONT } from './theme';

type W = keyof typeof FONT;

export function Txt({ children, w = 'medium', size = 15, color, style, numberOfLines }: {
  children?: ReactNode; w?: W; size?: number; color?: string; style?: StyleProp<TextStyle>; numberOfLines?: number;
}) {
  const { colors } = useStore();
  return (
    <Text numberOfLines={numberOfLines} style={[{ fontFamily: FONT[w], fontSize: size, color: color ?? colors.fg, fontVariant: ['tabular-nums'] }, style]}>
      {children}
    </Text>
  );
}

export const Label = ({ children }: { children: ReactNode }) => {
  const { colors } = useStore();
  return <Txt w="bold" size={11} color={colors.muted} style={{ textTransform: 'uppercase', letterSpacing: 0.9 }}>{children}</Txt>;
};

export function Screen({ children, scroll = true, bottomPad = 110 }: { children: ReactNode; scroll?: boolean; bottomPad?: number }) {
  const { colors } = useStore();
  const ins = useSafeAreaInsets();
  const inner = <View style={{ width: '100%', maxWidth: 560, alignSelf: 'center', gap: 14 }}>{children}</View>;
  if (!scroll) return <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: ins.top + 12, paddingHorizontal: 16 }}>{inner}</View>;
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: ins.top + 12, paddingBottom: bottomPad + ins.bottom, paddingHorizontal: 16 }}
      keyboardShouldPersistTaps="handled">
      {inner}
    </ScrollView>
  );
}

export function Card({ children, style, highlight }: { children: ReactNode; style?: StyleProp<ViewStyle>; highlight?: boolean }) {
  const { colors } = useStore();
  return (
    <View style={[{ backgroundColor: colors.surface, borderColor: highlight ? colors.accent : colors.line, borderWidth: highlight ? 1.5 : 1, borderRadius: 20, padding: 16, gap: 10 }, style]}>
      {children}
    </View>
  );
}

export function Bar({ pct, color, thin }: { pct: number; color: string; thin?: boolean }) {
  const { colors } = useStore();
  return (
    <View style={{ height: thin ? 6 : 10, borderRadius: 99, backgroundColor: colors.surface2, overflow: 'hidden', borderWidth: 1, borderColor: colors.line }}>
      <View style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: '100%', borderRadius: 99, backgroundColor: color }} />
    </View>
  );
}

export function Chip({ label, on, onPress }: { label: string; on?: boolean; onPress: () => void }) {
  const { colors } = useStore();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!on }}
      onPress={onPress}
      style={({ pressed }) => ({
        borderWidth: 1, borderColor: on ? colors.accent : colors.line, backgroundColor: on ? colors.accent : colors.surface2,
        borderRadius: 99, paddingVertical: 7, paddingHorizontal: 13, opacity: pressed ? 0.7 : 1,
      })}>
      <Txt w="semibold" size={14} color={on ? colors.accentInk : colors.fg}>{label}</Txt>
    </Pressable>
  );
}

export const Chips = ({ children }: { children: ReactNode }) => <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{children}</View>;

export function Btn({ label, onPress, kind = 'primary', disabled, icon, style }: {
  label: string; onPress: () => void; kind?: 'primary' | 'secondary' | 'ghost' | 'danger'; disabled?: boolean; icon?: ReactNode; style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useStore();
  const bg = kind === 'primary' ? colors.accent : kind === 'secondary' ? colors.surface2 : 'transparent';
  const fg = kind === 'primary' ? colors.accentInk : kind === 'danger' ? colors.over : kind === 'ghost' ? colors.accent : colors.fg;
  const border = kind === 'secondary' ? colors.line : kind === 'ghost' ? colors.line : kind === 'danger' ? colors.over : 'transparent';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [{
        backgroundColor: bg, borderColor: border, borderWidth: kind === 'primary' ? 0 : 1, borderRadius: 14,
        paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8,
        opacity: disabled ? 0.4 : pressed ? 0.75 : 1, borderStyle: kind === 'ghost' ? 'dashed' : 'solid',
      }, style]}>
      {icon}
      <Txt w={kind === 'primary' ? 'extrabold' : 'bold'} size={15} color={fg}>{label}</Txt>
    </Pressable>
  );
}

export function Field({ label, style, ...props }: TextInputProps & { label?: string; style?: StyleProp<ViewStyle> }) {
  const { colors } = useStore();
  return (
    <View style={[{ gap: 4, flex: 1, minWidth: 0 }, style]}>
      {label ? <Txt size={12} w="semibold" color={colors.muted}>{label}</Txt> : null}
      <TextInput
        placeholderTextColor={colors.muted}
        {...props}
        style={{ fontFamily: FONT.medium, fontSize: 16, color: colors.fg, backgroundColor: colors.surface2, borderColor: colors.line, borderWidth: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12 }}
      />
    </View>
  );
}

export const Row = ({ children, gap = 10, style }: { children: ReactNode; gap?: number; style?: StyleProp<ViewStyle> }) => (
  <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>
);

export const Between = ({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) => (
  <View style={[{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }, style]}>{children}</View>
);

export function Empty({ text }: { text: string }) {
  const { colors } = useStore();
  return (
    <View style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: colors.line, borderRadius: 14, padding: 16 }}>
      <Txt color={colors.muted} style={{ textAlign: 'center' }}>{text}</Txt>
    </View>
  );
}

export function Note({ text, error }: { text: string; error?: boolean }) {
  const { colors } = useStore();
  return (
    <View style={{ borderRadius: 12, padding: 12, backgroundColor: error ? colors.surface : colors.accentSoft, borderWidth: error ? 1 : 0, borderColor: colors.over }}>
      <Txt size={14}>{text}</Txt>
    </View>
  );
}

export const grid = StyleSheet.create({
  two: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  half: { flexBasis: '47%', flexGrow: 1 },
  quarter: { flexBasis: '22%', flexGrow: 1, minWidth: 70 },
});
