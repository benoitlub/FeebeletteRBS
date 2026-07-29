import { SymIcon } from "@/components/SymIcon";
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  withTiming,
  Easing,
  useAnimatedStyle,
  interpolate,
  withRepeat,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { useSensors } from "@/hooks/useSensors";
import { useBinauralAudio } from "@/hooks/useBinauralAudio";
import { useFlash } from "@/hooks/useFlash";
import { getSession } from "@/data/sessions";
import { getSessionWhispers } from "@/data/sessionWhispers";
import { ChromaticDisplay } from "@/components/ChromaticDisplay";
import { SessionBackground } from "@/components/SessionBackground";
import { BreathingGuide } from "@/components/BreathingGuide";
import { ProgressRing } from "@/components/ProgressRing";
import { FlashController } from "@/components/FlashController";
import { useLanguage } from "@/context/LanguageContext";

const { width } = Dimensions.get("window");

// ── Brand assets ───────────────────────────────────────────────────────────────
const FAIRY_IMG = require("../assets/images/fairy.png");
const BUBBLE_IMGS: Record<string, number> = {
  respiration: require("../assets/images/bubble_lotus.png") as number,
  nid:         require("../assets/images/bubble_moon.png") as number,
  cristal:     require("../assets/images/bubble_star.png") as number,
  reboot:      require("../assets/images/bubble_wave.png") as number,
  etincelle:   require("../assets/images/bubble_feather.png") as number,
};

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, "0")}`;
}

type SessionState = "countdown" | "running" | "paused" | "done";

const HAPTIC_INTERVALS: Record<string, number> = {
  wave: 2000, pulse: 1400, deep: 3200, micro: 1000, burst: 1600,
};

const WAVE_INFO: Record<string, { band: string; hz: string; color: string }> = {
  delta: { band: "DELTA", hz: "0.5–4 Hz", color: "#7c4dff" },
  theta: { band: "THÊTA", hz: "4–8 Hz",  color: "#9c6dff" },
  alpha: { band: "ALPHA", hz: "8–14 Hz", color: "#00e5ff" },
};

function getSessionName(id: string, t: Record<string, string>): string {
  const map: Record<string, string> = {
    respiration: t.adaptiveLabelRespiration,
    reboot:      t.adaptiveLabelReboot,
    nid:         t.adaptiveLabelNid,
    etincelle:   t.adaptiveLabelEtincelle,
    cristal:     t.adaptiveLabelCristal,
    aurora:      t.adaptiveLabelAurora,
    vague:       t.adaptiveLabelVague,
    racine:      t.adaptiveLabelRacine,
  };
  return map[id] ?? id;
}
function getSessionSubtitle(id: string, t: Record<string, string>): string {
  const map: Record<string, string> = {
    respiration: t.subtitleRespiration,
    reboot:      t.subtitleReboot,
    nid:         t.subtitleNid,
    etincelle:   t.subtitleEtincelle,
    cristal:     t.subtitleCristal,
    aurora:      t.subtitleAurora,
    vague:       t.subtitleVague,
    racine:      t.subtitleRacine,
  };
  return map[id] ?? "";
}

function fireHaptic(style: string, phase: number = 0) {
  const late = phase > 0.60;
  const peak = phase > 0.80;
  if (Platform.OS === "web") {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      const p: Record<string, number[]> = {
        wave:  peak  ? [120, 25, 120, 25, 160, 25, 120]
               : late ? [100, 28, 100, 28, 140]
               :        [80, 35, 80, 35, 120],
        pulse: peak  ? [90, 22, 90, 22, 70]
               : late ? [70, 28, 70, 28, 50]
               :        [55, 32, 55],
        deep:  peak  ? [200, 40, 180, 40, 220, 40, 180]
               : late ? [170, 42, 150, 42, 190]
               :        [150, 45, 150, 45, 200],
        micro: peak  ? [55, 15, 55, 15, 55, 15, 55, 15, 70]
               : late ? [40, 18, 40, 18, 40, 18, 50]
               :        [25, 18, 25, 18, 25, 18, 30],
        burst: peak  ? [80, 20, 80, 20, 90, 20, 80, 20, 90]
               : late ? [60, 22, 60, 22, 70, 22, 60]
               :        [45, 25, 45, 25, 55, 25, 45],
      };
      (navigator as any).vibrate(p[style] ?? [60]);
    }
    return;
  }
  type HitType = { delay: number; s: "light" | "medium" | "heavy" };
  const seqs: Record<string, HitType[]> = peak
    ? {
        wave:  [{ delay: 0, s: "heavy" }, { delay: 90,  s: "medium" }, { delay: 190, s: "heavy" }, { delay: 300, s: "medium" }, { delay: 420, s: "heavy" }],
        pulse: [{ delay: 0, s: "heavy" }, { delay: 100, s: "medium" }, { delay: 210, s: "heavy" }],
        deep:  [{ delay: 0, s: "heavy" }, { delay: 180, s: "heavy" }, { delay: 380, s: "heavy" }, { delay: 580, s: "medium" }],
        micro: [{ delay: 0, s: "medium" }, { delay: 60,  s: "medium" }, { delay: 120, s: "medium" }, { delay: 180, s: "medium" }, { delay: 260, s: "heavy" }],
        burst: [{ delay: 0, s: "heavy" }, { delay: 50,  s: "medium" }, { delay: 100, s: "heavy" }, { delay: 160, s: "medium" }, { delay: 230, s: "heavy" }, { delay: 300, s: "medium" }],
      }
    : late
    ? {
        wave:  [{ delay: 0, s: "heavy" }, { delay: 105, s: "medium" }, { delay: 230, s: "heavy" }, { delay: 360, s: "medium" }],
        pulse: [{ delay: 0, s: "medium" }, { delay: 115, s: "medium" }, { delay: 240, s: "light" }],
        deep:  [{ delay: 0, s: "heavy" }, { delay: 195, s: "heavy" }, { delay: 420, s: "heavy" }],
        micro: [{ delay: 0, s: "medium" }, { delay: 70,  s: "light" }, { delay: 140, s: "medium" }, { delay: 210, s: "light" }, { delay: 290, s: "medium" }],
        burst: [{ delay: 0, s: "heavy" }, { delay: 55,  s: "medium" }, { delay: 115, s: "heavy" }, { delay: 185, s: "medium" }, { delay: 260, s: "heavy" }],
      }
    : {
        wave:  [{ delay: 0, s: "medium" }, { delay: 105, s: "light" }, { delay: 225, s: "heavy" }, { delay: 365, s: "medium" }],
        pulse: [{ delay: 0, s: "medium" }, { delay: 115, s: "light" }, { delay: 250, s: "medium" }],
        deep:  [{ delay: 0, s: "heavy" }, { delay: 200, s: "medium" }, { delay: 450, s: "heavy" }],
        micro: [{ delay: 0, s: "medium" }, { delay: 72,  s: "light" }, { delay: 144, s: "medium" }, { delay: 218, s: "light" }, { delay: 300, s: "medium" }],
        burst: [{ delay: 0, s: "medium" }, { delay: 55,  s: "medium" }, { delay: 110, s: "heavy" }, { delay: 190, s: "medium" }, { delay: 265, s: "heavy" }],
      };
  const seq = seqs[style] ?? [{ delay: 0, s: "medium" as const }];
  for (const { delay, s } of seq) {
    setTimeout(() => {
      const hs = s === "heavy" ? Haptics.ImpactFeedbackStyle.Heavy
               : s === "light" ? Haptics.ImpactFeedbackStyle.Light
               : Haptics.ImpactFeedbackStyle.Medium;
      Haptics.impactAsync(hs);
    }, delay);
  }
}

export default function ActiveScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t, lang } = useLanguage();
  const { id, duration } = useLocalSearchParams<{ id: string; duration?: string }>();
  const { preferences } = useApp();

  const session = getSession(id ?? "ancrage");
  // duration param overrides the session default (set by DurationPickerSheet)
  const sessionDuration = duration
    ? Math.max(60, parseInt(duration, 10))
    : (session?.duration ?? 300);

  // Always show the real selected duration, not the hardcoded session default
  const actualDurationLabel =
    sessionDuration % 60 === 0
      ? `${sessionDuration / 60} min`
      : formatTime(sessionDuration);

  const [state, setState] = useState<SessionState>("countdown");
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [intensity, setIntensity] = useState(preferences.hapticIntensity);
  const [flashActive, setFlashActive] = useState(session?.flashEnabled === true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [strobeOn, setStrobeOn] = useState(false);
  const [whisperIdx, setWhisperIdx] = useState(0);
  const [breathPhaseLabel, setBreathPhaseLabel] = useState<"inhale" | "hold" | "exhale">("inhale");

  const timerRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const hapticRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const strobeRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const strobeOffRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted      = useRef(true);
  const phaseRef       = useRef(0);
  const milestoneRef   = useRef<Set<number>>(new Set());

  const progress     = useSharedValue(0);
  const controlsAnim = useSharedValue(0);
  const sensorPulse  = useSharedValue(0);

  const sensors = useSensors(state === "running");

  const audio = useBinauralAudio({
    carrierFreq: session?.carrierFreq ?? 200,
    beatFreq:    session?.waveHz ?? 8,
    volume:      intensity,
    enabled:     audioEnabled, // init immediately so WAV is ready when session starts
  });

  // Breath phase tracker — feeds breath-sync light mode
  useEffect(() => {
    if (state !== "running" || !session?.lightMode || session.lightMode !== "breath-sync") return;
    const bp = session.breathPattern;
    const cycle = bp.inhale + bp.hold + bp.exhale;
    if (cycle <= 0) return;
    const t = elapsed % cycle;
    if (t < bp.inhale) setBreathPhaseLabel("inhale");
    else if (t < bp.inhale + bp.hold) setBreathPhaseLabel("hold");
    else setBreathPhaseLabel("exhale");
  }, [elapsed, state, session?.lightMode, session?.breathPattern]);

  const flash = useFlash({
    hz:          session?.flashHz ?? 4,
    enabled:     flashActive && session?.flashEnabled === true && state === "running",
    intensity,
    mode:        session?.lightMode ?? "pulse",
    breathPhase: session?.lightMode === "breath-sync"
      ? { phase: breathPhaseLabel, progress: 0 }
      : undefined,
    dutyCycle:   session?.lightMode === "theta-burst" ? 0.2 : 0.40,
  });

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (timerRef.current)     clearInterval(timerRef.current);
      if (hapticRef.current)    clearInterval(hapticRef.current);
      if (strobeRef.current)    clearInterval(strobeRef.current);
      if (strobeOffRef.current) clearTimeout(strobeOffRef.current);
    };
  }, []);

  useEffect(() => {
    sensorPulse.value = withRepeat(withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, []);

  // Cycling poetic whispers every 14s during running
  useEffect(() => {
    if (state !== "running") return;
    const iv = setInterval(() => {
      if (!isMounted.current) return;
      setWhisperIdx((p) => {
        const whispers = getSessionWhispers(session?.id ?? "", lang);
        return whispers.length > 1 ? (p + 1) % whispers.length : p;
      });
    }, 14000);
    return () => clearInterval(iv);
  }, [state, session?.id]);

  // Countdown
  useEffect(() => {
    let c = 3;
    const iv = setInterval(() => {
      c--;
      if (!isMounted.current) { clearInterval(iv); return; }
      setCountdown(c);
      if (c <= 0) { clearInterval(iv); setState("running"); }
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  // Audio
  useEffect(() => {
    if (state === "running") { if (audio.isReady) audio.start(); }
    else audio.stop();
  }, [state, audio.isReady]);

  // Timer + haptic (phase-aware, milestone vibrations)
  useEffect(() => {
    if (state !== "running") {
      if (timerRef.current) clearInterval(timerRef.current);
      if (hapticRef.current) clearInterval(hapticRef.current);
      return;
    }
    milestoneRef.current.clear();
    timerRef.current = setInterval(() => {
      if (!isMounted.current) return;
      setElapsed((prev) => {
        const next = prev + 1;
        const phase = next / sessionDuration;
        phaseRef.current = phase;
        progress.value = withTiming(phase, { duration: 1000 });
        // Milestone haptics at 25 / 50 / 75 %
        const milestone = phase >= 0.75 ? 75 : phase >= 0.50 ? 50 : phase >= 0.25 ? 25 : 0;
        if (milestone > 0 && !milestoneRef.current.has(milestone)) {
          milestoneRef.current.add(milestone);
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(
              milestone === 75
                ? Haptics.NotificationFeedbackType.Warning
                : Haptics.NotificationFeedbackType.Success,
            );
          }
        }
        if (next >= sessionDuration) {
          clearInterval(timerRef.current!);
          setState("done");
          audio.stop();
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setTimeout(() => {
            if (isMounted.current)
              router.replace({ pathname: "/journal", params: { id: session?.id ?? "ancrage", elapsed: String(next) } });
          }, 1500);
        }
        return next;
      });
    }, 1000);
    const style = session?.hapticStyle ?? "pulse";
    const hi = HAPTIC_INTERVALS[style] ?? 1400;
    setTimeout(() => { if (isMounted.current) fireHaptic(style, phaseRef.current); }, 500);
    hapticRef.current = setInterval(() => {
      if (!isMounted.current) return;
      fireHaptic(style, phaseRef.current);
    }, hi);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (hapticRef.current) clearInterval(hapticRef.current);
    };
  }, [state]);

  // ── STATE-BASED STROBE — reliable on every platform ──────────────────────────
  useEffect(() => {
    if (strobeRef.current) clearInterval(strobeRef.current);
    if (strobeOffRef.current) clearTimeout(strobeOffRef.current);
    setStrobeOn(false);

    if (!flashActive || !session?.flashEnabled || state !== "running") return;

    const hz     = session.flashHz ?? 4;
    const period = 1000 / hz;
    const onDur  = Math.min(period * 0.35, 65); // max 65ms on-time

    strobeRef.current = setInterval(() => {
      if (!isMounted.current) return;
      setStrobeOn(true);
      strobeOffRef.current = setTimeout(() => {
        if (isMounted.current) setStrobeOn(false);
      }, onDur);
    }, period);

    return () => {
      if (strobeRef.current) clearInterval(strobeRef.current);
      if (strobeOffRef.current) clearTimeout(strobeOffRef.current);
    };
  }, [flashActive, state, session?.flashEnabled, session?.flashHz]);

  // Force torch: request permission as soon as the screen mounts for light-therapy sessions
  useEffect(() => {
    if (!session?.flashEnabled || Platform.OS === "web") return;
    if (flash.hasPermission === null || flash.hasPermission === false) {
      flash.requestPermission();
    }
  }, [session?.flashEnabled]);

  // Force torch: ensure flashActive = true every time session enters running state
  useEffect(() => {
    if (state === "running" && session?.flashEnabled) {
      setFlashActive(true);
      if (flash.hasPermission === null || flash.hasPermission === false) {
        flash.requestPermission();
      }
    }
  }, [state]);

  useEffect(() => { audio.setVolume(intensity); }, [intensity]);

  const togglePause = useCallback(() => {
    setState((s) => s === "running" ? "paused" : s === "paused" ? "running" : s);
  }, []);

  const handleTap = useCallback(() => {
    setShowControls((prev) => {
      const next = !prev;
      controlsAnim.value = withTiming(next ? 1 : 0, { duration: 280, easing: Easing.out(Easing.quad) });
      return next;
    });
  }, []);

  const handleStop = useCallback(() => {
    audio.stop();
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.replace({ pathname: "/journal", params: { id: session?.id ?? "ancrage", elapsed: String(elapsed) } });
  }, [session, elapsed]);

  const controlsStyle = useAnimatedStyle(() => ({
    opacity: controlsAnim.value,
    transform: [{ translateY: interpolate(controlsAnim.value, [0, 1], [24, 0]) }],
  }));
  const sensorDotStyle = useAnimatedStyle(() => ({
    opacity: interpolate(sensorPulse.value, [0, 1], [0.3, 1]),
  }));

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (!session) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>{t.sessionNotFound}</Text>
      </View>
    );
  }

  const waveInfo   = WAVE_INFO[session.waveType] ?? WAVE_INFO.alpha!;
  const primary    = waveInfo.color;
  const agitLabel  = sensors.agitationLevel === "calm" ? t.calmLevel : sensors.agitationLevel === "moderate" ? t.moderateLevel : t.agitatedLevel;
  const lightLabel = sensors.lightLevel === "dark" ? t.darkLight : sensors.lightLevel === "dim" ? t.dimLight : t.brightLight;

  return (
    <View style={styles.screen}>
      {/* ── HUD CORNER BRACKETS — always visible during session ── */}
      {state !== "done" && (
        <>
          <View pointerEvents="none" style={[styles.hudCorner, styles.hudTL, { top: topPad + 8, left: 14, borderColor: primary + "55" }]} />
          <View pointerEvents="none" style={[styles.hudCorner, styles.hudTR, { top: topPad + 8, right: 14, borderColor: primary + "55" }]} />
          <View pointerEvents="none" style={[styles.hudCorner, styles.hudBL, { bottom: botPad + 18, left: 14, borderColor: primary + "35" }]} />
          <View pointerEvents="none" style={[styles.hudCorner, styles.hudBR, { bottom: botPad + 18, right: 14, borderColor: primary + "35" }]} />
          {/* Lore ID — bottom left micro-text */}
          <Text
            pointerEvents="none"
            style={[styles.hudLore, { bottom: botPad + 8, left: 18, color: primary + "40" }]}
          >
            BLACKLACE ISLAND  //  LAB-07
          </Text>
          {/* Protocol ID — bottom right */}
          <Text
            pointerEvents="none"
            style={[styles.hudLore, { bottom: botPad + 8, right: 18, color: primary + "35", textAlign: "right" }]}
          >
            {session.id.toUpperCase()}
          </Text>
        </>
      )}

      <Pressable style={styles.pressable} onPress={handleTap}>
        <FlashController torchOn={flash.torchOn} hasPermission={flash.hasPermission} />

        {/* ── Background visuals ── */}
        <ChromaticDisplay
          colors={session.colors}
          intensity={intensity}
          breathDuration={session.breathPattern.inhale + (session.breathPattern.hold ?? 0) + session.breathPattern.exhale}
        />
        {/* ── Animated session background (fractal / particles / waves) ── */}
        {state === "running" && (
          <SessionBackground
            waveType={session.waveType}
            color={primary}
            progress={progress}
          />
        )}

        {/* ── STROBOSCOPE — state-based, always fires ── */}
        {strobeOn && (
          <View style={styles.strobe} pointerEvents="none" />
        )}

        {/* ── COUNTDOWN ── */}
        {state === "countdown" && (
          <View style={[StyleSheet.absoluteFill, styles.center]}>
            {/* Fairy silhouette — éthérée au-dessus du compte à rebours */}
            <Image
              source={FAIRY_IMG}
              style={styles.cdFairy}
              resizeMode="contain"
            />
            {/* Felbeletien mark */}
            <Text style={[styles.cdMark, { color: primary + "70" }]}>
              ✦  FÉE BELETTE REBOOT SYSTEM  ✦
            </Text>
            <Text style={[styles.cdSystemLine, { color: primary + "55" }]}>
              BIOADAPTIVE RELAXATION SYSTEM
            </Text>
            <Text style={[styles.cdSystemLine, { color: primary + "90" }]}>
              {t.sessionStarting}
            </Text>
            <View style={[styles.countdownRing, { borderColor: primary + "30" }]}>
              <View style={[styles.countdownRingInner, { borderColor: primary + "65" }]}>
                <View style={[styles.cdCorner, styles.cdCornerTL, { borderColor: primary }]} />
                <View style={[styles.cdCorner, styles.cdCornerTR, { borderColor: primary }]} />
                <View style={[styles.cdCorner, styles.cdCornerBL, { borderColor: primary }]} />
                <View style={[styles.cdCorner, styles.cdCornerBR, { borderColor: primary }]} />
                <View style={styles.cdBracketRow}>
                  <Text style={[styles.cdBracket, { color: primary + "80" }]}>[</Text>
                  <Text style={[styles.countdownNum, { color: primary }]}>
                    {countdown > 0 ? countdown : "▶"}
                  </Text>
                  <Text style={[styles.cdBracket, { color: primary + "80" }]}>]</Text>
                </View>
              </View>
            </View>
            <Text style={styles.countdownName}>{getSessionName(session.id, t as any)}</Text>
            <Text style={styles.countdownSub}>{getSessionSubtitle(session.id, t as any)}</Text>
            <View style={styles.cdBadges}>
              <View style={[styles.badge, { borderColor: primary + "50" }]}>
                <SymIcon name="headset-outline" size={12} color={primary} />
                <Text style={[styles.badgeText, { color: primary }]}>
                  {waveInfo.band} · {session.breathPattern.label}
                </Text>
              </View>
              <View style={[styles.badge, { borderColor: "#ffffff20" }]}>
                <SymIcon name="timer-outline" size={12} color="#ffffff70" />
                <Text style={[styles.badgeText, { color: "#ffffff70" }]}>
                  {actualDurationLabel}
                </Text>
              </View>
              {session.flashEnabled && Platform.OS !== "web" && (
                <View style={[styles.badge, { borderColor: "#00e5ff30" }]}>
                  <SymIcon name="flashlight-outline" size={12} color="#00e5ffaa" />
                  <Text style={[styles.badgeText, { color: "#00e5ffaa" }]}>
                    Torche {session.flashHz} Hz
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── RUNNING / PAUSED ── */}
        {(state === "running" || state === "paused") && (
          <>
            {/* Session bubble PNG — grand filigrane éthéré centré */}
            {BUBBLE_IMGS[session.id] && (
              <View style={styles.bubbleWatermark} pointerEvents="none">
                <Image
                  source={BUBBLE_IMGS[session.id]}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="contain"
                />
              </View>
            )}

            {/* Timer ring — top right */}
            <View style={[styles.timerWrap, { top: topPad + 4, right: 18 }]}>
              <ProgressRing progress={progress} size={64} strokeWidth={2.5} color={primary} />
              <Text style={[styles.timerText, { color: "#ffffff" }]}>
                {formatTime(sessionDuration - elapsed)}
              </Text>
            </View>

            {/* Wave info — top left */}
            <View style={[styles.topLeft, { top: topPad + 6, left: 18 }]}>
              <View style={styles.waveRow}>
                <Animated.View style={[styles.waveDot, { backgroundColor: primary }, sensorDotStyle]} />
                <Text style={[styles.waveLabel, { color: primary }]}>{waveInfo.band}</Text>
                <Text style={styles.waveHz}>{session.waveHz} Hz</Text>
              </View>
              {audio.isPlaying && (
                <View style={styles.infoRow}>
                  <SymIcon name="headset-outline" size={10} color={colors.accent} />
                  <Text style={[styles.infoText, { color: colors.accent }]}>{t.binauralActive}</Text>
                </View>
              )}
              {sensors.isAvailable && (
                <View style={styles.infoRow}>
                  <Animated.View style={[styles.sensorDot, {
                    backgroundColor: sensors.agitationLevel === "calm" ? "#00c896" : sensors.agitationLevel === "moderate" ? "#ffaa00" : "#ff4466",
                  }, sensorDotStyle]} />
                  <Text style={styles.infoText}>{agitLabel}{Platform.OS === "android" ? `  ·  ${lightLabel}` : ""}</Text>
                </View>
              )}
              {/* Flash active indicator with therapeutic mode */}
              {flash.isActive && (
                <View style={styles.infoRow}>
                  <Animated.View style={[{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: "#00e5ff" }, sensorDotStyle]} />
                  <Text style={[styles.infoText, { color: "#00e5ff80" }]}>
                    {session.lightLabel ?? "Torche"}
                    {session.lightMode !== "breath-sync" && session.lightMode !== "theta-burst"
                      ? `  ·  ${flash.currentHz.toFixed(2)} Hz` : ""}
                  </Text>
                </View>
              )}
            </View>

            {/* Breathing guide — center */}
            <View style={styles.centerContent}>
              {preferences.breathingGuide && (
                <BreathingGuide
                  pattern={session.breathPattern}
                  intensity={intensity}
                  sessionColor={primary}
                  enabled={state === "running"}
                />
              )}
            </View>

            {/* ── BOTTOM BAR ── session info + optional flash pill */}
            <View style={[styles.bottomBar, { paddingBottom: botPad + 20 }]}>
              <LinearGradient
                colors={["transparent", "#00000070", "#000000b8"] as [string, string, string]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              />

              {/* Session label row */}
              <View style={styles.bottomLabelRow}>
                <View style={[styles.bottomAccent, { backgroundColor: primary }]} />
                <Text style={[styles.bottomName, { color: "#ffffffcc" }]}>{getSessionName(session.id, t as any)}</Text>
              </View>

              {/* Whisper or paused text */}
              {state === "running" && (() => {
                const whispers = getSessionWhispers(session.id, lang);
                const w = whispers[whisperIdx % whispers.length];
                return w ? (
                  <Text style={[styles.bottomWhisper, { color: primary + "bb" }]}>
                    {w}
                  </Text>
                ) : null;
              })()}
              {state === "paused" && (
                <Text style={[styles.bottomWhisper, { color: primary + "bb" }]}>
                  {t.pausedWhisper}
                </Text>
              )}

              {/* Flash pill — forced on in light-therapy sessions; tap to request permission only */}
              {session.flashEnabled && Platform.OS !== "web" && (
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    if (flash.hasPermission === null || !flash.hasPermission) {
                      flash.requestPermission();
                    }
                    // torch is forced: no toggle-off available
                  }}
                  style={[styles.flashPill, {
                    borderColor: flash.isActive ? primary + "70" : "#ffffff18",
                    backgroundColor: flash.isActive ? primary + "18" : "#00000040",
                  }]}
                >
                  <View style={[styles.flashPillDot, {
                    backgroundColor: flash.isActive ? primary : "#ffffff35",
                  }]} />
                  <Text style={[styles.flashPillText, { color: flash.isActive ? primary : "#ffffff50" }]}>
                    {flash.hasPermission === null
                      ? t.torchAllow
                      : flash.hasPermission === false
                      ? t.torchDenied
                      : flash.isActive
                      ? (session.lightLabel ?? `${t.torchHz}  ${session.flashHz} Hz`)
                      : t.torchOff}
                  </Text>
                </Pressable>
              )}

              {/* Tap hint */}
              {state === "running" && (
                <Text style={styles.tapHint}>{t.tapForControls}</Text>
              )}
            </View>

            {/* Controls overlay */}
            <Animated.View
              style={[styles.controls, { paddingBottom: botPad + 24, paddingTop: topPad + 70 }, controlsStyle]}
              pointerEvents={showControls ? "box-none" : "none"}
            >
              <View style={styles.controlsRow}>
                <Pressable
                  onPress={(e) => { e.stopPropagation(); handleStop(); }}
                  style={[styles.ctrlBtn, { borderColor: colors.destructive + "60", backgroundColor: colors.destructive + "18" }]}
                >
                  <SymIcon name="stop" size={20} color={colors.destructive} />
                </Pressable>
                <Pressable
                  onPress={(e) => { e.stopPropagation(); togglePause(); }}
                  style={[styles.ctrlBtnMain, { borderColor: primary + "80", backgroundColor: primary + "22" }]}
                >
                  <SymIcon name={state === "running" ? "pause" : "play"} size={30} color={primary} />
                </Pressable>
                <Pressable
                  onPress={(e) => { e.stopPropagation(); setAudioEnabled((p) => !p); }}
                  style={[styles.ctrlBtn, {
                    borderColor: audioEnabled ? colors.accent + "60" : "#ffffff20",
                    backgroundColor: audioEnabled ? colors.accent + "18" : "#ffffff08",
                  }]}
                >
                  <SymIcon name={audioEnabled ? "headset-outline" : "headset-outline"} size={20} color={audioEnabled ? colors.accent : "#ffffff50"} />
                </Pressable>
              </View>

              <View style={styles.intensityRow}>
                <Text style={styles.intensityLabel}>{t.intensityLabel}</Text>
                <View style={styles.intensityBar}>
                  {[0.3, 0.5, 0.7, 0.9].map((val) => (
                    <Pressable
                      key={val}
                      onPress={(e) => { e.stopPropagation(); setIntensity(val); }}
                      style={[styles.intensityDot, {
                        backgroundColor: intensity >= val ? primary : "#ffffff22",
                        transform: [{ scale: intensity >= val ? 1.3 : 1 }],
                      }]}
                    />
                  ))}
                </View>
              </View>
            </Animated.View>
          </>
        )}

        {/* ── DONE ── */}
        {state === "done" && (
          <View style={[StyleSheet.absoluteFill, styles.center]}>
            {/* Fairy silhouette prominente */}
            <Image
              source={FAIRY_IMG}
              style={styles.doneFairy}
              resizeMode="contain"
            />
            {/* Session bubble en médaillon */}
            {BUBBLE_IMGS[session.id] && (
              <Image
                source={BUBBLE_IMGS[session.id]}
                style={styles.doneBubble}
                resizeMode="contain"
              />
            )}
            {/* Symbole felbeletien */}
            <Text style={[styles.doneMark, { color: primary + "88" }]}>
              ✦  SÉANCE TERMINÉE  ✦
            </Text>
            <Text style={[styles.doneText, { color: "#ffffff" }]}>Tu l'as fait.</Text>
            <Text style={[styles.donePoem, { color: primary + "cc" }]}>
              Tu peux revenir au monde,{"\n"}mais doucement.{"\n"}Il est encore bizarre.
            </Text>
            {/* Symbole feuchien — le Feuch a été apaisé */}
            <Text style={[styles.doneFeuch, { color: primary + "40" }]}>
              — FEUCHIEN APAISÉ —
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:    { flex: 1, backgroundColor: "#080810", overflow: "hidden" },
  pressable: { flex: 1 },
  center:    { alignItems: "center", justifyContent: "center", gap: 14 },

  // Strobe — pure white instant flash
  strobe: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#ffffff",
    opacity: 0.92,
  },

  // Countdown
  countdownRing: {
    width: 180, height: 180, borderRadius: 90, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  countdownRingInner: {
    width: 140, height: 140, borderRadius: 70, borderWidth: 1.5,
    alignItems: "center", justifyContent: "center",
  },
  countdownNum:  { fontSize: 88, fontWeight: "100", letterSpacing: -4, color: "#ffffff" },
  countdownName: { fontSize: 22, fontWeight: "300", letterSpacing: 4, color: "#ffffff", textTransform: "uppercase", textAlign: "center", paddingHorizontal: 20 },
  countdownSub:  { fontSize: 12, color: "#ffffff70", letterSpacing: 1.5, textAlign: "center" },
  cdBadges: {
    flexDirection: "row", flexWrap: "wrap",
    justifyContent: "center", gap: 8, marginTop: 6, paddingHorizontal: 24,
  },
  badge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: "#00000045",
  },
  badgeText: { fontSize: 11, letterSpacing: 0.8 },

  // Running UI
  timerWrap: { position: "absolute", alignItems: "center", justifyContent: "center" },
  timerText: { position: "absolute", fontSize: 11, fontWeight: "600", letterSpacing: 0.5 },
  topLeft:   { position: "absolute", gap: 5 },
  waveRow:   { flexDirection: "row", alignItems: "center", gap: 7 },
  waveDot:   { width: 6, height: 6, borderRadius: 3 },
  waveLabel: { fontSize: 12, fontWeight: "700", letterSpacing: 1.8 },
  waveHz:    { fontSize: 10, color: "#ffffff70", letterSpacing: 0.5 },
  infoRow:   { flexDirection: "row", alignItems: "center", gap: 5 },
  infoText:  { fontSize: 10, color: "#ffffff55", letterSpacing: 0.3 },
  sensorDot: { width: 4, height: 4, borderRadius: 2 },

  centerContent: { flex: 1, alignItems: "center", justifyContent: "center" },

  bottomBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingTop: 36, paddingHorizontal: 22, gap: 6,
  },
  bottomLabelRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
  },
  bottomAccent: {
    width: 3, height: 18, borderRadius: 2,
  },
  bottomName: {
    fontSize: 15, fontWeight: "600", letterSpacing: 3,
    textTransform: "uppercase",
  },
  bottomWhisper: {
    fontSize: 12, letterSpacing: 0.6,
    paddingLeft: 13, fontStyle: "italic",
  },
  flashPill: {
    flexDirection: "row", alignItems: "center", gap: 8,
    alignSelf: "flex-start", marginLeft: 13, marginTop: 4,
    borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  flashPillDot: { width: 6, height: 6, borderRadius: 3 },
  flashPillText: { fontSize: 11, letterSpacing: 0.8 },
  tapHint:     { fontSize: 10, color: "#ffffff28", letterSpacing: 1.5, paddingLeft: 13, marginTop: 2 },

  // Controls
  controls: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: "flex-end", gap: 14, paddingHorizontal: 36,
  },
  controlsRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 18,
  },
  ctrlBtn: {
    width: 54, height: 54, borderRadius: 27,
    borderWidth: 1, alignItems: "center", justifyContent: "center",
  },
  ctrlBtnMain: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 1.5, alignItems: "center", justifyContent: "center",
  },
  intensityRow: {
    flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 10,
  },
  intensityLabel: {
    fontSize: 10, letterSpacing: 2, color: "#ffffff55", textTransform: "uppercase",
  },
  intensityBar: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-around",
    paddingVertical: 14, borderRadius: 20, paddingHorizontal: 18,
    backgroundColor: "#ffffff08",
  },
  intensityDot: { width: 10, height: 10, borderRadius: 5 },

  // Countdown imagery
  cdFairy: {
    width: 110, height: 150, opacity: 0.55, marginBottom: 8,
  },
  cdMark: {
    fontSize: 8, fontWeight: "800", letterSpacing: 3, marginBottom: 4,
  },

  // Running — bubble watermark
  bubbleWatermark: {
    position: "absolute",
    width: 260, height: 260,
    alignSelf: "center",
    top: "50%",
    marginTop: -130,
    opacity: 0.07,
  },

  // Done imagery
  doneFairy: {
    width: 130, height: 175, opacity: 0.88,
  },
  doneBubble: {
    width: 56, height: 56, opacity: 0.55, marginTop: -20,
  },
  doneMark: {
    fontSize: 9, fontWeight: "700", letterSpacing: 3, marginTop: 10,
  },
  doneFeuch: {
    fontSize: 8, fontWeight: "700", letterSpacing: 4, marginTop: 18,
  },
  doneText: {
    fontSize: 20, fontWeight: "300", letterSpacing: 4, textTransform: "uppercase", marginTop: 8,
  },
  donePoem: {
    fontSize: 15, fontWeight: "400", letterSpacing: 0.5, textAlign: "center", lineHeight: 24, marginTop: 8,
  },

  // ── HUD corners ──────────────────────────────────────────────────────────────
  hudCorner: { position: "absolute", width: 20, height: 20, zIndex: 20 },
  hudTL: { borderTopWidth: 1.5, borderLeftWidth: 1.5 },
  hudTR: { borderTopWidth: 1.5, borderRightWidth: 1.5 },
  hudBL: { borderBottomWidth: 1.5, borderLeftWidth: 1.5 },
  hudBR: { borderBottomWidth: 1.5, borderRightWidth: 1.5 },
  hudLore: {
    position: "absolute", fontSize: 7, letterSpacing: 1.8, fontWeight: "600", zIndex: 20,
  },

  // ── Retro HUD countdown ───────────────────────────────────────────────────────
  cdSystemLine: {
    fontSize: 8, letterSpacing: 2.0, fontWeight: "700", marginBottom: 10,
  },
  cdBracketRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  cdBracket: { fontSize: 56, fontWeight: "100", lineHeight: 88 },
  cdCorner: { position: "absolute", width: 14, height: 14 },
  cdCornerTL: { top: 8, left: 8, borderTopWidth: 1.5, borderLeftWidth: 1.5 },
  cdCornerTR: { top: 8, right: 8, borderTopWidth: 1.5, borderRightWidth: 1.5 },
  cdCornerBL: { bottom: 8, left: 8, borderBottomWidth: 1.5, borderLeftWidth: 1.5 },
  cdCornerBR: { bottom: 8, right: 8, borderBottomWidth: 1.5, borderRightWidth: 1.5 },
});
