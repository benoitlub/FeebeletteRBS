import { useEffect, useRef, useState, useCallback } from "react";
import { Platform } from "react-native";

const AMBIENT_VOLUME = 0.28;
const FADE_STEPS     = 20;
const FADE_INTERVAL  = 60; // ms per step → ~1.2s total fade

export interface AmbientAudioState {
  isReady:   boolean;
  isPlaying: boolean;
  isMuted:   boolean;
  toggle:    () => void;
  fadeIn:    () => void;
  fadeOut:   (cb?: () => void) => void;
}

export function useAmbientAudio(enabled = true): AmbientAudioState {
  const [isReady,   setIsReady]   = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted,   setIsMuted]   = useState(false);

  const soundRef    = useRef<any>(null);
  const isMutedRef  = useRef(false);   // toujours à jour, pas de stale closure
  const isMounted   = useRef(true);
  const fadeRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentVol  = useRef(0);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (fadeRef.current) clearInterval(fadeRef.current);
    };
  }, []);

  // ── Init ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;
    if (Platform.OS === "web") { initWeb(); return; }
    initNative();
    return () => { cleanup(); };
  }, [enabled]);

  async function initNative() {
    try {
      const { Audio } = await import("expo-av");
      // setAudioModeAsync can fail on some Android configs — non-fatal
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS:    true,
          staysActiveInBackground: false,
          shouldDuckAndroid:       true,
        });
      } catch (modeErr) {
        console.warn("[AmbientAudio] setAudioMode skipped:", modeErr);
      }

      // Resolve asset to a local file:// URI so Android ExoPlayer can decode it.
      // Passing a require() asset directly gives ExoPlayer a bundle URI it cannot extract.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const assetModule = require("../assets/audio/ambient.mp3");
      const { Asset } = await import("expo-asset");
      const asset = Asset.fromModule(assetModule);
      if (!asset.localUri) await asset.downloadAsync();
      const localUri: string = asset.localUri ?? asset.uri;

      const { sound } = await Audio.Sound.createAsync(
        { uri: localUri },
        { isLooping: true, volume: 0, shouldPlay: false }
      );
      soundRef.current = sound;
      if (isMounted.current) setIsReady(true);
    } catch (err) {
      console.warn("[AmbientAudio] init failed:", err);
    }
  }

  function initWeb() {
    // Web: use HTMLAudioElement for better loop support
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const src = require("../assets/audio/ambient.mp3");
      const audioEl = new (window as any).Audio(typeof src === "string" ? src : src.uri ?? src);
      audioEl.loop   = true;
      audioEl.volume = 0;
      soundRef.current = audioEl;
      if (isMounted.current) setIsReady(true);
    } catch (err) {
      console.warn("[AmbientAudio] web init failed:", err);
    }
  }

  function cleanup() {
    if (fadeRef.current) clearInterval(fadeRef.current);
    if (soundRef.current) {
      if (Platform.OS !== "web") {
        soundRef.current.unloadAsync?.().catch(() => {});
      } else {
        soundRef.current.pause?.();
      }
      soundRef.current = null;
    }
  }

  // ── Volume helpers ───────────────────────────────────────────────────────────
  function setVol(v: number) {
    currentVol.current = v;
    if (!soundRef.current) return;
    if (Platform.OS !== "web") {
      soundRef.current.setVolumeAsync?.(v).catch(() => {});
    } else {
      try { soundRef.current.volume = v; } catch (_) {}
    }
  }

  // fadeIn sans garde isMuted — le toggle gère ça via isMutedRef
  const fadeIn = useCallback(() => {
    if (!soundRef.current) return;
    if (fadeRef.current) clearInterval(fadeRef.current);

    if (Platform.OS !== "web") {
      soundRef.current.playAsync?.().catch(() => {});
    } else {
      soundRef.current.play?.().catch(() => {});
    }
    if (isMounted.current) setIsPlaying(true);

    const target = AMBIENT_VOLUME;
    const step   = target / FADE_STEPS;
    fadeRef.current = setInterval(() => {
      const next = Math.min(currentVol.current + step, target);
      setVol(next);
      if (next >= target) {
        clearInterval(fadeRef.current!);
        fadeRef.current = null;
      }
    }, FADE_INTERVAL);
  }, []);

  const fadeOut = useCallback((cb?: () => void) => {
    if (!soundRef.current) { cb?.(); return; }
    if (fadeRef.current) clearInterval(fadeRef.current);

    const start = currentVol.current;
    const step  = start / FADE_STEPS;
    fadeRef.current = setInterval(() => {
      const next = Math.max(currentVol.current - step, 0);
      setVol(next);
      if (next <= 0) {
        clearInterval(fadeRef.current!);
        fadeRef.current = null;
        if (Platform.OS !== "web") {
          soundRef.current?.pauseAsync?.().catch(() => {});
        } else {
          soundRef.current?.pause?.();
        }
        if (isMounted.current) setIsPlaying(false);
        cb?.();
      }
    }, FADE_INTERVAL);
  }, []);

  // Utilise isMutedRef pour éviter la stale closure dans le setState updater
  const toggle = useCallback(() => {
    const next = !isMutedRef.current;
    isMutedRef.current = next;
    setIsMuted(next);
    if (next) { fadeOut(); }
    else      { fadeIn(); }
  }, [fadeIn, fadeOut]);

  // Auto-start once ready
  useEffect(() => {
    if (isReady && !isMuted) fadeIn();
  }, [isReady]);

  return { isReady, isPlaying, isMuted, toggle, fadeIn, fadeOut };
}
