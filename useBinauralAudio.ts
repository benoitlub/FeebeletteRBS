/**
 * useFlash — Luminothérapie thérapeutique avancée via torche LED.
 *
 * Modes scientifiques :
 *  "entrainment"  — Entraînement cérébral par fréquence (delta/theta/alpha/beta)
 *  "breath-sync"  — Torche synchronisée sur le cycle respiratoire
 *  "theta-burst"  — Rafales theta brèves (inspiré de la stimulation TMS)
 *  "schumann"     — Résonance de Schumann 7.83 Hz (ancrage terrestre)
 *  "pulse"        — Pulsation simple à fréquence fixe (mode par défaut)
 *
 * Compatible expo-camera v17.x / SDK 54.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

export type LightMode =
  | "entrainment"
  | "breath-sync"
  | "theta-burst"
  | "schumann"
  | "pulse";

export interface BreathPhase {
  phase: "inhale" | "hold" | "exhale";
  progress: number; // 0–1 within current phase
}

interface FlashConfig {
  hz:          number;
  enabled:     boolean;
  intensity:   number;   // 0–1
  mode?:       LightMode;
  breathPhase?: BreathPhase;  // used by breath-sync mode
  dutyCycle?:  number;   // 0–1, default 0.40
}

interface FlashControl {
  torchOn:           boolean;
  hasPermission:     boolean | null;
  isActive:          boolean;
  requestPermission: () => Promise<void>;
  currentHz:         number;  // actual Hz being used (may differ from config.hz)
}

// Schumann resonance — frequency of Earth's electromagnetic field
const SCHUMANN_HZ = 7.83;

// Theta burst: 5 pulses at 50 Hz, then 200ms silence, repeat
function useThetaBurst(
  enabled: boolean,
  hasPermission: boolean | null,
  setTorchOn: (v: boolean) => void,
  mounted: React.MutableRefObject<boolean>
) {
  const ref = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clear() {
    if (ref.current) clearTimeout(ref.current);
    ref.current = null;
  }

  useEffect(() => {
    clear();
    if (!enabled || !hasPermission || Platform.OS === "web") {
      setTorchOn(false);
      return;
    }

    // 3 pulses at 50Hz within a burst, 800ms silence between bursts
    const PULSE_ON  = 10;  // ms
    const PULSE_OFF = 10;  // ms
    const PULSES    = 3;
    const BURST_GAP = 800; // ms between burst starts

    function runBurst(n: number) {
      if (!mounted.current || !enabled) { setTorchOn(false); return; }
      if (n >= PULSES) {
        setTorchOn(false);
        ref.current = setTimeout(() => runBurst(0), BURST_GAP);
        return;
      }
      setTorchOn(true);
      ref.current = setTimeout(() => {
        if (mounted.current) setTorchOn(false);
        ref.current = setTimeout(() => runBurst(n + 1), PULSE_OFF);
      }, PULSE_ON);
    }

    runBurst(0);
    return clear;
  }, [enabled, hasPermission]);
}

export function useFlash(config: FlashConfig): FlashControl {
  const [torchOn,       setTorchOn]       = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const intervalRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const offTimerRef    = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const mounted        = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; clearStrobe(); };
  }, []);

  // ── Permission ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (Platform.OS === "web") { setHasPermission(false); return; }
    checkPermission();
  }, []);

  async function checkPermission(): Promise<boolean> {
    try {
      const cam = await import("expo-camera");
      let granted = false;
      if (typeof (cam as any).Camera?.getCameraPermissionsAsync === "function") {
        const res = await (cam as any).Camera.getCameraPermissionsAsync();
        granted = res.granted;
      } else if (typeof (cam as any).getCameraPermissionsAsync === "function") {
        const res = await (cam as any).getCameraPermissionsAsync();
        granted = res.granted;
      }
      if (mounted.current) setHasPermission(granted);
      return granted;
    } catch {
      if (mounted.current) setHasPermission(false);
      return false;
    }
  }

  const requestPermission = useCallback(async () => {
    if (Platform.OS === "web") return;
    try {
      const cam = await import("expo-camera");
      let granted = false;
      if (typeof (cam as any).Camera?.requestCameraPermissionsAsync === "function") {
        const res = await (cam as any).Camera.requestCameraPermissionsAsync();
        granted = res.granted;
      } else if (typeof (cam as any).requestCameraPermissionsAsync === "function") {
        const res = await (cam as any).requestCameraPermissionsAsync();
        granted = res.granted;
      }
      if (mounted.current) setHasPermission(granted);
    } catch {
      if (mounted.current) setHasPermission(false);
    }
  }, []);

  useEffect(() => {
    if (!config.enabled || Platform.OS === "web") return;
    if (hasPermission !== false) return;
    requestPermission();
  }, [config.enabled, hasPermission]);

  // ── Theta-burst mode ──────────────────────────────────────────────────────
  const isThetaBurst = config.mode === "theta-burst";
  useThetaBurst(
    config.enabled && isThetaBurst,
    hasPermission,
    setTorchOn,
    mounted
  );

  // ── Pulse / entrainment / schumann modes ──────────────────────────────────
  function clearStrobe() {
    if (intervalRef.current)  clearInterval(intervalRef.current);
    if (offTimerRef.current)  clearTimeout(offTimerRef.current);
    intervalRef.current = null;
    offTimerRef.current = null;
  }

  const activeHz = config.mode === "schumann" ? SCHUMANN_HZ : config.hz;
  const dutyCycle = config.dutyCycle ?? 0.40;

  useEffect(() => {
    if (isThetaBurst) return;                   // handled by useThetaBurst
    if (config.mode === "breath-sync") return;  // handled by breath-sync effect below
    clearStrobe();
    if (mounted.current) setTorchOn(false);

    if (!config.enabled || !hasPermission || activeHz <= 0 || Platform.OS === "web") return;

    const periodMs = 1000 / activeHz;
    const onDurMs  = Math.round(periodMs * dutyCycle);

    const fire = () => {
      if (!mounted.current) return;
      setTorchOn(true);
      offTimerRef.current = setTimeout(() => {
        if (mounted.current) setTorchOn(false);
      }, onDurMs);
    };

    fire();
    intervalRef.current = setInterval(fire, periodMs);

    return clearStrobe;
  }, [config.enabled, activeHz, hasPermission, dutyCycle, isThetaBurst, config.mode]);

  // ── Breath-sync mode override ─────────────────────────────────────────────
  // In breath-sync, torch is ON during inhale, OFF during hold+exhale.
  // Also handles the shutdown path: when enabled becomes false, force torch off.
  useEffect(() => {
    if (config.mode !== "breath-sync") return;
    if (Platform.OS === "web") return;
    if (!config.enabled || !hasPermission) {
      setTorchOn(false);
      return;
    }
    const shouldOn = config.breathPhase?.phase === "inhale";
    setTorchOn(shouldOn);
  }, [config.mode, config.breathPhase?.phase, config.enabled, hasPermission]);

  const isActive = config.enabled && hasPermission === true && Platform.OS !== "web";

  return { torchOn, hasPermission, isActive, requestPermission, currentHz: activeHz };
}
