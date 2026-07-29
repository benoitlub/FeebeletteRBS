import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import { RelaxationProfile, SensoryPreferences, SessionRecord } from "@/types";

const STORAGE_KEYS = {
  RECORDS: "@blacklace_records",
  PROFILE: "@blacklace_profile",
  PREFS: "@blacklace_prefs",
};

const DEFAULT_PREFS: SensoryPreferences = {
  hapticIntensity: 0.7,
  lightIntensity: 0.8,
  breathingGuide: true,
  sanctuaryMode: false,
  binauralEnabled: true,
  flashEnabled: false,
};

const DEFAULT_PROFILE: RelaxationProfile = {
  totalVoyages: 0,
  totalMinutes: 0,
  favoriteSessionId: null,
  preferredTimeOfDay: null,
  currentStreak: 0,
  lastSessionDate: null,
};

interface AppContextValue {
  records: SessionRecord[];
  profile: RelaxationProfile;
  preferences: SensoryPreferences;
  addRecord: (record: SessionRecord) => Promise<void>;
  updatePreferences: (prefs: Partial<SensoryPreferences>) => Promise<void>;
  isReady: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

function getTimeOfDay(): SessionRecord["timeOfDay"] {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

function computeProfile(
  records: SessionRecord[],
  existing: RelaxationProfile
): RelaxationProfile {
  if (records.length === 0) return { ...DEFAULT_PROFILE };

  const totalVoyages = records.length;
  const totalMinutes = Math.floor(
    records.reduce((acc, r) => acc + r.duration, 0) / 60
  );

  const sessionCounts: Record<string, number> = {};
  records.forEach((r) => {
    sessionCounts[r.sessionId] = (sessionCounts[r.sessionId] ?? 0) + 1;
  });
  const favoriteSessionId =
    Object.entries(sessionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const timeCounts: Record<string, number> = {};
  records.forEach((r) => {
    timeCounts[r.timeOfDay] = (timeCounts[r.timeOfDay] ?? 0) + 1;
  });
  const preferredTimeOfDay = (
    Object.entries(timeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
  ) as RelaxationProfile["preferredTimeOfDay"];

  const sorted = [...records].sort((a, b) => b.completedAt - a.completedAt);
  const lastSessionDate = sorted[0]?.completedAt ?? null;

  let streak = 0;
  if (lastSessionDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let checkDate = new Date(today);
    for (let i = 0; i < 365; i++) {
      const dayStart = checkDate.getTime();
      const dayEnd = dayStart + 86400000;
      const hasSession = records.some(
        (r) => r.completedAt >= dayStart && r.completedAt < dayEnd
      );
      if (hasSession) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (i === 0) {
        break;
      } else {
        break;
      }
    }
  }

  return {
    totalVoyages,
    totalMinutes,
    favoriteSessionId,
    preferredTimeOfDay,
    currentStreak: streak,
    lastSessionDate,
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<SessionRecord[]>([]);
  const [profile, setProfile] = useState<RelaxationProfile>(DEFAULT_PROFILE);
  const [preferences, setPreferences] = useState<SensoryPreferences>(DEFAULT_PREFS);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [r, pref] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.RECORDS),
          AsyncStorage.getItem(STORAGE_KEYS.PREFS),
        ]);
        const loadedRecords: SessionRecord[] = r ? JSON.parse(r) : [];
        const loadedPrefs: SensoryPreferences = pref
          ? JSON.parse(pref)
          : DEFAULT_PREFS;
        setRecords(loadedRecords);
        setProfile(computeProfile(loadedRecords, DEFAULT_PROFILE));
        setPreferences(loadedPrefs);
      } catch (_) {}
      setIsReady(true);
    }
    load();
  }, []);

  const addRecord = useCallback(async (record: SessionRecord) => {
    setRecords((prev) => {
      const next = [record, ...prev];
      AsyncStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(next));
      setProfile(computeProfile(next, DEFAULT_PROFILE));
      return next;
    });
  }, []);

  const updatePreferences = useCallback(
    async (prefs: Partial<SensoryPreferences>) => {
      setPreferences((prev) => {
        const next = { ...prev, ...prefs };
        AsyncStorage.setItem(STORAGE_KEYS.PREFS, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  return (
    <AppContext.Provider
      value={{ records, profile, preferences, addRecord, updatePreferences, isReady }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

export function getTimeOfDayForRecord() {
  return getTimeOfDay();
}
