/** Light = clean indigo by day, dark = mint on near-black by night (chosen by the owner). */
const light = {
  bg: '#F6F7F9', surface: '#FFFFFF', surface2: '#F1F3F6', line: '#E3E6EB',
  fg: '#111827', muted: '#6B7280', accent: '#4F46E5', accentInk: '#FFFFFF', accentSoft: '#EEEDFD',
  prot: '#3B82F6', fat: '#F59E0B', carb: '#10B981', sugar: '#EC4899', salt: '#8B5CF6', fiber: '#B45309', over: '#DC2626',
};
const dark: typeof light = {
  bg: '#0E1014', surface: '#171A20', surface2: '#1E222A', line: '#2A2F39',
  fg: '#F2F4F7', muted: '#8A93A3', accent: '#5BE3A7', accentInk: '#062A1C', accentSoft: '#143528',
  prot: '#7AA2FF', fat: '#FBBF5C', carb: '#A3E36B', sugar: '#FF7AA8', salt: '#B49CFF', fiber: '#D6B37A', over: '#FF6B6B',
};
export type Palette = typeof light;
export const palette = (isDark: boolean): Palette => (isDark ? dark : light);

export const FONT = {
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extrabold: 'Manrope_800ExtraBold',
} as const;
