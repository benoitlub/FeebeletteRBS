export type LightMode = "entrainment" | "breath-sync" | "theta-burst" | "schumann" | "pulse";

export interface Session {
  id: string;
  name: string;
  subtitle: string;
  duration: number;
  durationLabel: string;
  colors: string[];
  hapticStyle: "wave" | "pulse" | "micro" | "deep" | "burst";
  breathPattern: BreathPattern;
  waveType: "delta" | "theta" | "alpha";
  waveHz: number;
  carrierFreq: number;
  flashHz: number;
  flashEnabled: boolean;
  lightMode?: LightMode;
  lightLabel?: string;   // short human label shown in UI
  scienceHook?: string;  // one-liner science claim
  description: string;
  tagline: string;
}

export interface BreathPattern {
  inhale: number;
  hold: number;
  exhale: number;
  label: string;
}

export interface SessionRecord {
  id: string;
  sessionId: string;
  sessionName: string;
  completedAt: number;
  duration: number;
  rating: number;
  note: string;
  timeOfDay: "morning" | "afternoon" | "evening" | "night";
  intensity: number;
  agitationLevel?: "calm" | "moderate" | "agitated";
  lightLevel?: "dark" | "dim" | "bright";
}

export interface SensoryPreferences {
  hapticIntensity: number;
  lightIntensity: number;
  breathingGuide: boolean;
  sanctuaryMode: boolean;
  binauralEnabled: boolean;
  flashEnabled: boolean;
}

export interface RelaxationProfile {
  totalVoyages: number;
  totalMinutes: number;
  favoriteSessionId: string | null;
  preferredTimeOfDay: "morning" | "afternoon" | "evening" | "night" | null;
  currentStreak: number;
  lastSessionDate: number | null;
}

export interface SensorContext {
  agitationLevel: "calm" | "moderate" | "agitated";
  lightLevel: "dark" | "dim" | "bright";
  motionHz: number;
  timestamp: number;
}
