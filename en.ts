/**
 * useBinauralAudio — cross-platform binaural beat audio.
 * Web:    Web Audio API (no deps)
 * Native: expo-av with inline data URI (no expo-file-system dependency)
 */
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

interface BinauralConfig {
  carrierFreq: number;
  beatFreq:    number;
  volume:      number;
  enabled:     boolean;
}

interface BinauralAudio {
  isReady:   boolean;
  isPlaying: boolean;
  start:     () => void;
  stop:      () => void;
  setVolume: (v: number) => void;
}

// ── Web Audio types ──────────────────────────────────────────────────────────
type WACtx = {
  createGain: () => any;
  createOscillator: () => any;
  createStereoPanner: () => any;
  destination: any;
  currentTime: number;
  state: string;
  resume: () => Promise<void>;
  close: () => Promise<void>;
};

export function useBinauralAudio(config: BinauralConfig): BinauralAudio {
  const [isReady,   setIsReady]   = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const ctxRef   = useRef<WACtx | null>(null);
  const gainRef  = useRef<any>(null);
  const soundRef = useRef<any>(null);
  const mounted  = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  // ── (Re)initialise whenever carrier/beat/enabled changes ──────────────────
  useEffect(() => {
    if (!config.enabled) return;
    if (Platform.OS === "web") {
      initWeb();
    } else {
      initNative();
    }
    return cleanup;
  }, [config.carrierFreq, config.beatFreq, config.enabled]);

  // ── Web: Web Audio API ─────────────────────────────────────────────────────
  function initWeb() {
    try {
      const g: any = window;
      const Cls = g.AudioContext || g.webkitAudioContext;
      if (!Cls) return;

      const ctx: WACtx = new Cls();
      ctxRef.current = ctx;

      const gain = ctx.createGain();
      gain.gain.value = 0;
      gainRef.current = gain;
      gain.connect(ctx.destination);

      const panL = ctx.createStereoPanner(); panL.pan.value = -1;
      const oscL = ctx.createOscillator();
      oscL.type = "sine";
      oscL.frequency.value = config.carrierFreq;
      oscL.connect(panL); panL.connect(gain); oscL.start();

      const panR = ctx.createStereoPanner(); panR.pan.value = 1;
      const oscR = ctx.createOscillator();
      oscR.type = "sine";
      oscR.frequency.value = config.carrierFreq + config.beatFreq;
      oscR.connect(panR); panR.connect(gain); oscR.start();

      if (mounted.current) setIsReady(true);
    } catch {
      if (mounted.current) setIsReady(false);
    }
  }

  // ── Native: expo-av + expo-file-system (writes WAV to cache, avoids data URI) ─
  async function initNative() {
    try {
      const { Audio } = await import("expo-av");
      // expo-file-system v55 moved legacy helpers to the /legacy sub-path
      const { writeAsStringAsync, cacheDirectory } = await import("expo-file-system/legacy") as any;
      const { generateBinauralWAVBase64 } = await import("@/utils/wavGenerator");

      // setAudioModeAsync can fail on some Android configs — non-fatal
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS:    true,
          staysActiveInBackground: true,
          shouldDuckAndroid:       false,
        });
      } catch (modeErr) {
        console.warn("[BinauralAudio] setAudioMode skipped:", modeErr);
      }

      const base64 = generateBinauralWAVBase64(
        config.carrierFreq,
        config.carrierFreq + config.beatFreq,
      );

      // Write to cache file — Android ExoPlayer handles file:// URIs reliably
      // Use string literal "base64" — EncodingType enum may be undefined after dynamic import
      const cacheDir: string = (cacheDirectory as string | null) ?? "";
      const fileUri = `${cacheDir}binaural_${config.carrierFreq}_${config.beatFreq}.wav`;
      await (writeAsStringAsync as Function)(fileUri, base64, { encoding: "base64" });

      const { sound } = await Audio.Sound.createAsync(
        { uri: fileUri },
        { isLooping: true, volume: config.volume, shouldPlay: false },
      );
      soundRef.current = sound;
      if (mounted.current) setIsReady(true);
    } catch (err) {
      console.warn("[BinauralAudio] init failed:", err);
      if (mounted.current) setIsReady(false);
    }
  }

  // ── Cleanup ────────────────────────────────────────────────────────────────
  function cleanup() {
    if (Platform.OS === "web") {
      try { ctxRef.current?.close(); } catch {}
      ctxRef.current = null;
      gainRef.current = null;
    } else {
      soundRef.current?.unloadAsync?.().catch(() => {});
      soundRef.current = null;
    }
    if (mounted.current) { setIsReady(false); setIsPlaying(false); }
  }

  // ── Controls ───────────────────────────────────────────────────────────────
  function start() {
    if (!isReady) return;
    if (Platform.OS === "web") {
      const gain = gainRef.current;
      const ctx  = ctxRef.current;
      if (!gain || !ctx) return;
      const doRamp = () => {
        gain.gain.setTargetAtTime(config.volume * 0.5, ctx.currentTime, 1.5);
      };
      if (ctx.state === "suspended") {
        ctx.resume().then(doRamp).catch(() => {});
      } else {
        doRamp();
      }
    } else {
      soundRef.current?.playAsync?.().catch(() => {});
    }
    if (mounted.current) setIsPlaying(true);
  }

  function stop() {
    if (Platform.OS === "web") {
      const gain = gainRef.current;
      const ctx  = ctxRef.current;
      if (!gain || !ctx) return;
      // Instant cut to silence, then suspend the context so CPU stops
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      ctx.suspend?.().catch?.(() => {});
    } else {
      soundRef.current?.stopAsync?.().catch(() => {});
    }
    if (mounted.current) setIsPlaying(false);
  }

  function setVolume(v: number) {
    if (Platform.OS === "web") {
      const gain = gainRef.current;
      const ctx  = ctxRef.current;
      if (!gain || !ctx) return;
      gain.gain.setTargetAtTime(v * 0.5, ctx.currentTime, 0.3);
    } else {
      soundRef.current?.setVolumeAsync?.(v).catch(() => {});
    }
  }

  return { isReady, isPlaying, start, stop, setVolume };
}
