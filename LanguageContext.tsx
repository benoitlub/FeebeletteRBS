import { SymIcon } from "@/components/SymIcon";
import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Session } from "@/types";

interface Props {
  session: Session;
  onPress: () => void;
  isRecommended?: boolean;
}

const WAVE_SYMBOL: Record<string, string> = {
  delta: "Δ",
  theta: "Θ",
  alpha: "α",
};

const WAVE_LABEL: Record<string, string> = {
  delta: "Delta",
  theta: "Theta",
  alpha: "Alpha",
};

export function SessionCard({ session, onPress, isRecommended }: Props) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.55, 0.85]),
  }));

  const sym   = WAVE_SYMBOL[session.waveType] ?? "○";
  const wlab  = WAVE_LABEL[session.waveType]  ?? "";
  const col0  = session.colors[1];  // saturated center color
  const dark  = session.colors[3] ?? session.colors[0];  // deepest dark

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      {/* ── Card shell — dark base ── */}
      <View style={[styles.card, { backgroundColor: dark }]}>

        {/* ── Color world: left-edge glow ── */}
        <Animated.View style={[StyleSheet.absoluteFill, glowStyle]} pointerEvents="none">
          <LinearGradient
            colors={[col0 + "ff", col0 + "88", "transparent"] as [string, string, string]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0.3 }}
            end={{ x: 0.75, y: 1 }}
          />
        </Animated.View>

        {/* ── Grain overlay for depth ── */}
        <LinearGradient
          colors={["#ffffff06", "transparent", "#00000030"] as [string, string, string]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          pointerEvents="none"
        />

        {/* ── Wave watermark — decorative background letter ── */}
        <Text style={[styles.watermark, { color: col0 + "14" }]} aria-hidden>
          {sym}
        </Text>

        {/* ── Content layer ── */}
        <View style={styles.content}>

          {/* Top row */}
          <View style={styles.topRow}>
            <View style={[styles.waveChip, { borderColor: col0 + "50" }]}>
              <Text style={[styles.waveChipSym, { color: col0 }]}>{sym}</Text>
              <Text style={[styles.waveChipLabel, { color: col0 + "cc" }]}>
                {wlab}  ·  {session.waveHz} Hz
              </Text>
            </View>

            <View style={styles.topRight}>
              <View style={[styles.durChip, { backgroundColor: "#ffffff10", borderColor: "#ffffff18" }]}>
                <Text style={styles.durText}>{session.durationLabel}</Text>
              </View>
              {isRecommended && (
                <View style={[styles.recChip, { backgroundColor: col0 + "22", borderColor: col0 + "50" }]}>
                  <Text style={[styles.recText, { color: col0 }]}>★</Text>
                </View>
              )}
            </View>
          </View>

          {/* Name + tagline */}
          <View style={styles.nameBlock}>
            <Text style={styles.name} numberOfLines={1}>
              {session.name}
            </Text>
            <Text style={[styles.tagline, { color: col0 + "99" }]} numberOfLines={2}>
              {session.tagline ?? session.subtitle}
            </Text>
          </View>

          {/* Flash badge if applicable */}
          {session.flashEnabled && (
            <View style={styles.flashRow}>
              <View style={[styles.flashDot, { backgroundColor: "#00e5ff" }]} />
              <Text style={styles.flashLabel}>Torche  {session.flashHz} Hz</Text>
            </View>
          )}
        </View>

        {/* ── Play button — right-edge ── */}
        <View style={styles.playSide}>
          <View style={[styles.playBtn, { borderColor: col0 + "55", backgroundColor: col0 + "18" }]}>
            <SymIcon name="play" size={16} color="#ffffff" />
          </View>
          <Text style={[styles.playLabel, { color: "#ffffff30" }]}>
            {session.breathPattern.label}
          </Text>
        </View>

      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 10,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  card: {
    borderRadius: 18,
    height: 152,
    flexDirection: "row",
    overflow: "hidden",
  },
  watermark: {
    position: "absolute",
    bottom: -12,
    right: 52,
    fontSize: 120,
    fontWeight: "900",
    lineHeight: 120,
  },

  content: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 16,
    justifyContent: "space-between",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  waveChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  waveChipSym:   { fontSize: 11, fontWeight: "800" },
  waveChipLabel: { fontSize: 9,  fontWeight: "600", letterSpacing: 0.5 },

  topRight:  { flexDirection: "row", alignItems: "center", gap: 5 },
  durChip: {
    borderWidth: 1, borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  durText: { fontSize: 9, color: "#ffffffaa", letterSpacing: 0.8, fontWeight: "600" },
  recChip: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 1, alignItems: "center", justifyContent: "center",
  },
  recText: { fontSize: 10, fontWeight: "700" },

  nameBlock: { gap: 3 },
  name: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.4,
    color: "#ffffffee",
  },
  tagline: {
    fontSize: 11,
    letterSpacing: 0.4,
    lineHeight: 16,
  },

  flashRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  flashDot:   { width: 4, height: 4, borderRadius: 2 },
  flashLabel: { fontSize: 9, color: "#00e5ff80", letterSpacing: 0.8 },

  playSide: {
    width: 60,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingRight: 14,
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  playLabel: {
    fontSize: 7,
    letterSpacing: 0.6,
    textAlign: "center",
    lineHeight: 10,
  },
});
