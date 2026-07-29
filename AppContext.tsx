import { SymIcon } from "@/components/SymIcon";
import React, { useEffect } from "react";
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from "react-native";
import Animated, {
  useSharedValue, withRepeat, withTiming, withSequence, withDelay,
  Easing, useAnimatedStyle, interpolate,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { SESSIONS } from "@/data/sessions";

interface BubbleConfig {
  sessionId: string;
  accent:    string;
  icon:      string;
  shortName: string;
  phase:     number; // stagger phase 0-1
}

const BUBBLES: BubbleConfig[] = [
  { sessionId: "respiration", accent: "#7ca8ff", icon: "leaf-outline",       shortName: "Respire",   phase: 0 },
  { sessionId: "reboot",      accent: "#00e5ff", icon: "refresh-outline",     shortName: "Reboot",    phase: 0.2 },
  { sessionId: "nid",         accent: "#b07cff", icon: "moon-outline",        shortName: "Nid",       phase: 0.4 },
  { sessionId: "etincelle",   accent: "#ffa040", icon: "bulb-outline",        shortName: "Étincelle", phase: 0.6 },
  { sessionId: "cristal",     accent: "#cc88ff", icon: "diamond-outline",     shortName: "Cristal",   phase: 0.8 },
];

const BUBBLE_D  = 66;   // orb diameter
const RING_D    = 82;   // outer ring diameter

interface Props {
  onStart: (id: string) => void;
}

function Bubble({ cfg, onStart }: { cfg: BubbleConfig; onStart: (id: string) => void }) {
  const float = useSharedValue(0);
  const glow  = useSharedValue(0);

  useEffect(() => {
    const delay = cfg.phase * 1800;
    float.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
      ), -1
    ));
    glow.value = withDelay(delay + 200, withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      ), -1
    ));
  }, []);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(float.value, [0, 1], [0, -7]) }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.25, 0.65]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [0.9, 1.15]) }],
  }));

  const session = SESSIONS.find(s => s.id === cfg.sessionId);
  const dur = session?.durationLabel ?? "—";

  return (
    <Animated.View style={[styles.bubbleWrap, floatStyle]}>
      <Pressable
        onPress={() => onStart(cfg.sessionId)}
        style={styles.pressable}
      >
        {/* Outer glow ring */}
        <Animated.View style={[styles.glowRing, {
          width: RING_D, height: RING_D, borderRadius: RING_D / 2,
          borderColor: cfg.accent,
          backgroundColor: cfg.accent,
        }, glowStyle]} />

        {/* Main orb */}
        <View style={[styles.orb, { width: BUBBLE_D, height: BUBBLE_D, borderRadius: BUBBLE_D / 2 }]}>
          <LinearGradient
            colors={[cfg.accent + "44", cfg.accent + "22", "#07071a"]}
            style={[StyleSheet.absoluteFill, { borderRadius: BUBBLE_D / 2 }]}
          />
          <View style={[styles.orbBorder, {
            borderRadius: BUBBLE_D / 2,
            borderColor: cfg.accent + "99",
          }]} />
          <SymIcon
            name={cfg.icon as any}
            size={22}
            color={cfg.accent}
          />
        </View>

        {/* Label */}
        <Text style={[styles.bubbleName, { color: cfg.accent }]}>{cfg.shortName}</Text>
        <Text style={styles.bubbleDur}>{dur}</Text>
      </Pressable>
    </Animated.View>
  );
}

export function SessionBubbles({ onStart }: Props) {
  const { width } = useWindowDimensions();

  return (
    <View style={[styles.container, { width }]}>
      {/* Row 1 — 3 bubbles */}
      <View style={styles.row}>
        {BUBBLES.slice(0, 3).map((cfg) => (
          <Bubble key={cfg.sessionId} cfg={cfg} onStart={onStart} />
        ))}
      </View>
      {/* Row 2 — 2 bubbles */}
      <View style={styles.row}>
        {BUBBLES.slice(3).map((cfg) => (
          <Bubble key={cfg.sessionId} cfg={cfg} onStart={onStart} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: 10, paddingHorizontal: 8 },
  row:       { flexDirection: "row", justifyContent: "center", gap: 14 },

  bubbleWrap: { alignItems: "center" },
  pressable:  { alignItems: "center", gap: 6 },

  glowRing: {
    position: "absolute",
    top: -(RING_D - BUBBLE_D) / 2,
    opacity: 0.35,
  },

  orb: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#07071a",
  },
  orbBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1.5,
  },

  bubbleName: {
    fontSize: 11, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase",
  },
  bubbleDur: {
    fontSize: 9, color: "#ffffff44", letterSpacing: 0.5,
  },
});
