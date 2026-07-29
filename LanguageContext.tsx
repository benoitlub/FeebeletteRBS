import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const KEY_SUBSCRIPTION = "@fbrs_subscription";
const MAX_FREE_WEEKLY = 3;

interface SubscriptionState {
  isPremium: boolean;
  premiumExpiresAt: number | null;
  freeSessionsThisWeek: number;
  freeResetDate: number;
  forceMode: "free" | "premium" | "normal";
}

interface SubscriptionContextValue {
  isPremium: boolean;
  freeSessionsLeft: number;
  canStartSession: () => boolean;
  recordSessionStart: () => Promise<void>;
  activatePremium: () => Promise<void>;
  deactivatePremium: () => Promise<void>;
  resetFreeCounter: () => Promise<void>;
  setForceMode: (mode: "free" | "premium" | "normal") => Promise<void>;
  isReady: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

function getMonday(date: Date): number {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SubscriptionState>({
    isPremium: false,
    premiumExpiresAt: null,
    freeSessionsThisWeek: 0,
    freeResetDate: getMonday(new Date()),
    forceMode: "normal",
  });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const raw = await AsyncStorage.getItem(KEY_SUBSCRIPTION);
        if (raw) {
          const loaded: SubscriptionState = JSON.parse(raw);
          const currentMonday = getMonday(new Date());
          if (loaded.freeResetDate < currentMonday) {
            loaded.freeSessionsThisWeek = 0;
            loaded.freeResetDate = currentMonday;
          }
          setState(loaded);
        }
      } catch (_) {}
      setIsReady(true);
    }
    load();
  }, []);

  const save = useCallback(async (next: SubscriptionState) => {
    setState(next);
    await AsyncStorage.setItem(KEY_SUBSCRIPTION, JSON.stringify(next));
  }, []);

  const effectivelyPremium =
    state.forceMode === "premium" ||
    (state.forceMode === "normal" &&
      state.isPremium &&
      (state.premiumExpiresAt === null || Date.now() < state.premiumExpiresAt));

  const effectivelyFree = state.forceMode === "free";

  const computedFreeLeft = effectivelyFree || !effectivelyPremium
    ? Math.max(0, MAX_FREE_WEEKLY - state.freeSessionsThisWeek)
    : Infinity;

  const canStartSession = useCallback(() => {
    if (effectivelyPremium) return true;
    return state.freeSessionsThisWeek < MAX_FREE_WEEKLY;
  }, [state.freeSessionsThisWeek, effectivelyPremium]);

  const recordSessionStart = useCallback(async () => {
    if (effectivelyPremium) return;
    const next = {
      ...state,
      freeSessionsThisWeek: state.freeSessionsThisWeek + 1,
    };
    await save(next);
  }, [state, save, effectivelyPremium]);

  const activatePremium = useCallback(async () => {
    const next: SubscriptionState = {
      ...state,
      isPremium: true,
      premiumExpiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      forceMode: "normal",
    };
    await save(next);
  }, [state, save]);

  const deactivatePremium = useCallback(async () => {
    const next: SubscriptionState = { ...state, isPremium: false, premiumExpiresAt: null };
    await save(next);
  }, [state, save]);

  const resetFreeCounter = useCallback(async () => {
    const next: SubscriptionState = {
      ...state,
      freeSessionsThisWeek: 0,
      freeResetDate: getMonday(new Date()),
    };
    await save(next);
  }, [state, save]);

  const setForceMode = useCallback(
    async (mode: "free" | "premium" | "normal") => {
      const next: SubscriptionState = { ...state, forceMode: mode };
      await save(next);
    },
    [state, save]
  );

  return (
    <SubscriptionContext.Provider
      value={{
        isPremium: effectivelyPremium,
        freeSessionsLeft: computedFreeLeft === Infinity ? MAX_FREE_WEEKLY : computedFreeLeft,
        canStartSession,
        recordSessionStart,
        activatePremium,
        deactivatePremium,
        resetFreeCounter,
        setForceMode,
        isReady,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription must be used inside SubscriptionProvider");
  return ctx;
}

export const MAX_FREE = MAX_FREE_WEEKLY;
