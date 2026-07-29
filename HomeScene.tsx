import { SymIcon } from "@/components/SymIcon";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { SESSIONS } from "@/data/sessions";

const { height: SH } = Dimensions.get("window");

const QUESTIONS = [
  {
    key: "state",
    question: "Comment tu te sens\nen ce moment ?",
    sub: "Étape 1 / 3",
    options: [
      { id: "agite",  label: "Agité·e",  icon: "thunderstorm-outline" as const, col: "#ff4466" },
      { id: "neutre", label: "Neutre",   icon: "ellipse-outline" as const,       col: "#00e5ff" },
      { id: "epuise", label: "Épuisé·e", icon: "moon-outline" as const,          col: "#7c4dff" },
    ],
  },
  {
    key: "goal",
    question: "Quel est ton objectif ?",
    sub: "Étape 2 / 3",
    options: [
      { id: "sommeil", label: "Sommeil",   icon: "bed-outline" as const,         col: "#7c4dff" },
      { id: "calme",   label: "Calmer",    icon: "water-outline" as const,       col: "#00e5ff" },
      { id: "transe",  label: "Transe",    icon: "infinite-outline" as const,    col: "#9c6dff" },
      { id: "reset",   label: "Reset",     icon: "flash-outline" as const,       col: "#00c896" },
    ],
  },
  {
    key: "time",
    question: "Combien de temps\ntu as ?",
    sub: "Étape 3 / 3",
    options: [
      { id: "30s", label: "30 sec",  icon: "timer-outline" as const,     col: "#00c896" },
      { id: "1m",  label: "1 min",   icon: "time-outline" as const,      col: "#00e5ff" },
      { id: "5m",  label: "5 min +", icon: "hourglass-outline" as const, col: "#7c4dff" },
    ],
  },
];

function resolveSession(ans: Record<string, string>): string {
  const { state, goal, time } = ans;
  if (time === "30s") return "micro";
  if (time === "1m" && (state === "agite" || goal === "calme")) return "ancrage";
  if (goal === "sommeil" || state === "epuise") return "nocturne";
  if (goal === "transe") return "immersion";
  if (goal === "reset") return "micro";
  if (goal === "calme" || state === "agite") return "ancrage";
  if (time === "5m") return "immersion";
  return "insulaire";
}

interface Props {
  visible: boolean;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function SessionQCM({ visible, onSelect, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<string | null>(null);
  const slideY = useSharedValue(SH * 0.95);

  useEffect(() => {
    if (visible) {
      setStep(0);
      setAnswers({});
      setResult(null);
      slideY.value = withSpring(0, { damping: 24, stiffness: 200 });
    } else {
      slideY.value = withTiming(SH * 0.95, { duration: 260, easing: Easing.in(Easing.quad) });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value }],
  }));

  const handleOption = (optId: string) => {
    const q = QUESTIONS[step]!;
    const next = { ...answers, [q.key]: optId };
    setAnswers(next);
    if (step < QUESTIONS.length - 1) {
      setStep((s) => s + 1);
    } else {
      setResult(resolveSession(next));
    }
  };

  const resolvedSession = result ? SESSIONS.find((s) => s.id === result) ?? null : null;
  const c0 = resolvedSession?.colors[0] ?? "#080020";
  const c1 = resolvedSession?.colors[1] ?? "#160048";

  if (!visible) return null;

  return (
    <View style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

      <Animated.View style={[styles.sheet, sheetStyle]}>
        <LinearGradient
          colors={["#0e0e28", "#080818"] as [string, string]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.handle} />

        {result && resolvedSession ? (
          <View style={styles.resultWrap}>
            <Text style={styles.resultMicro}>SÉANCE RECOMMANDÉE POUR TOI</Text>

            <LinearGradient
              colors={[c1 + "cc", c0 + "ee"] as [string, string]}
              style={styles.resultCard}
              start={{ x: 0.3, y: 0 }}
              end={{ x: 0.7, y: 1 }}
            >
              <Text style={styles.resultName}>{resolvedSession.name}</Text>
              <Text style={styles.resultSub}>{resolvedSession.subtitle}</Text>
              <Text style={styles.resultDesc} numberOfLines={3}>
                {resolvedSession.description}
              </Text>
              <View style={styles.resultBadgeRow}>
                <View style={styles.resBadge}>
                  <SymIcon name="time-outline" size={11} color="#ffffff70" />
                  <Text style={styles.resBadgeText}>{resolvedSession.durationLabel}</Text>
                </View>
                {resolvedSession.flashEnabled && (
                  <View style={[styles.resBadge, { borderColor: "#9c6dff50" }]}>
                    <SymIcon name="flashlight-outline" size={11} color="#9c6dff" />
                    <Text style={[styles.resBadgeText, { color: "#9c6dff" }]}>Flash LED</Text>
                  </View>
                )}
                <View style={styles.resBadge}>
                  <SymIcon name="pulse-outline" size={11} color="#00e5ff" />
                  <Text style={[styles.resBadgeText, { color: "#00e5ff" }]}>
                    {resolvedSession.waveHz} Hz
                  </Text>
                </View>
              </View>
            </LinearGradient>

            <Pressable
              onPress={() => onSelect(result)}
              style={({ pressed }) => [styles.goBtn, pressed && { opacity: 0.86 }]}
            >
              <LinearGradient
                colors={["#00e5ff", "#7c4dff"] as [string, string]}
                style={styles.goBtnGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <SymIcon name="play" size={18} color="#080810" />
                <Text style={styles.goBtnText}>LANCER MAINTENANT</Text>
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={() => { setResult(null); setStep(0); setAnswers({}); }}
              style={styles.retryBtn}
            >
              <Text style={styles.retryText}>↩ Recommencer</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.qWrap}>
            <View style={styles.progressRow}>
              {QUESTIONS.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.progDot,
                    i < step && styles.progDone,
                    i === step && styles.progActive,
                  ]}
                />
              ))}
            </View>
            <Text style={styles.stepSub}>{QUESTIONS[step]?.sub}</Text>
            <Text style={styles.qText}>{QUESTIONS[step]?.question}</Text>

            <View style={styles.optGrid}>
              {QUESTIONS[step]?.options.map((opt) => (
                <Pressable
                  key={opt.id}
                  onPress={() => handleOption(opt.id)}
                  style={({ pressed }) => [
                    styles.optBtn,
                    { borderColor: opt.col + "55" },
                    pressed && { opacity: 0.75, transform: [{ scale: 0.95 }] },
                  ]}
                >
                  <LinearGradient
                    colors={[opt.col + "25", opt.col + "08"] as [string, string]}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  <SymIcon name={opt.icon} size={26} color={opt.col} />
                  <Text style={styles.optLabel}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#00000078",
    justifyContent: "flex-end",
    zIndex: 120,
  },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: "hidden",
    paddingBottom: 44,
  },
  handle: {
    width: 38, height: 4, borderRadius: 2,
    backgroundColor: "#ffffff25",
    alignSelf: "center",
    marginTop: 14, marginBottom: 6,
  },
  progressRow: {
    flexDirection: "row", gap: 7, alignSelf: "center", marginBottom: 6,
  },
  progDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: "#ffffff18",
  },
  progDone: { backgroundColor: "#00e5ff60" },
  progActive: { width: 24, backgroundColor: "#00e5ff" },
  stepSub: {
    textAlign: "center", color: "#ffffff40",
    fontSize: 10, letterSpacing: 2, marginBottom: 6,
  },
  qWrap: { paddingHorizontal: 22, paddingTop: 8 },
  qText: {
    fontSize: 24, fontWeight: "700", color: "#ffffff",
    textAlign: "center", lineHeight: 32, letterSpacing: 0.2,
    marginBottom: 22,
  },
  optGrid: {
    flexDirection: "row", flexWrap: "wrap",
    justifyContent: "center", gap: 10,
  },
  optBtn: {
    width: "44%", minHeight: 84, borderRadius: 18, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
    gap: 8, overflow: "hidden", paddingVertical: 14,
  },
  optLabel: {
    fontSize: 14, fontWeight: "600", color: "#ffffff", letterSpacing: 0.3,
  },
  resultWrap: { paddingHorizontal: 18, paddingTop: 6, gap: 14 },
  resultMicro: {
    fontSize: 9, letterSpacing: 3, color: "#00e5ff80",
    textAlign: "center", fontWeight: "700",
  },
  resultCard: {
    borderRadius: 22, padding: 18, gap: 6,
  },
  resultName: {
    fontSize: 24, fontWeight: "700", color: "#ffffff", letterSpacing: 0.4,
  },
  resultSub: {
    fontSize: 12, color: "#ffffffaa", letterSpacing: 0.5,
  },
  resultDesc: {
    fontSize: 12, color: "#ffffff70", lineHeight: 18, marginTop: 4,
  },
  resultBadgeRow: {
    flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap",
  },
  resBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderRadius: 8, borderWidth: 1, borderColor: "#ffffff20",
    paddingHorizontal: 8, paddingVertical: 4,
    backgroundColor: "#ffffff08",
  },
  resBadgeText: { fontSize: 11, color: "#ffffff70" },
  goBtn: { borderRadius: 16, overflow: "hidden" },
  goBtnGrad: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 17, gap: 10,
  },
  goBtnText: {
    fontSize: 14, fontWeight: "700", color: "#080810", letterSpacing: 1.5,
  },
  retryBtn: { alignItems: "center", paddingVertical: 2 },
  retryText: { fontSize: 13, color: "#ffffff35", letterSpacing: 0.5 },
});
