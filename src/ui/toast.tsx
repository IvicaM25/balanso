import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStore } from '@/state/store';
import { Txt } from './kit';

const Ctx = createContext<(msg: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { colors } = useStore();
  const ins = useSafeAreaInsets();
  const show = useCallback((m: string) => {
    setMsg(m);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 2800);
  }, []);
  return (
    <Ctx.Provider value={show}>
      {children}
      {msg ? (
        <View pointerEvents="none" style={{ position: 'absolute', left: 16, right: 16, bottom: ins.bottom + 90, alignItems: 'center' }}>
          <View accessibilityLiveRegion="polite" style={{ backgroundColor: colors.fg, borderRadius: 99, paddingVertical: 10, paddingHorizontal: 16, maxWidth: 520 }}>
            <Txt w="semibold" size={14} color={colors.bg}>{msg}</Txt>
          </View>
        </View>
      ) : null}
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
