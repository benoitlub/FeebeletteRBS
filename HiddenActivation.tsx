import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  withTiming,
  Easing,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";
import { SessionRecord } from "@/types";
import { SESSIONS } from "@/data/sessions";

const WAVE_META = {
  delta: { label: "Delta", sub: "0.5–4 Hz · Sommeil profond", color: "#7c4dff" },
  theta: { label: "Thêta", sub: "4–8 Hz · Méditation", color: "#9c6dff" },
  alpha: { label: "Alpha", sub: "8–14 Hz · Relaxation", color: "#00e5ff" },
};

function AnimatedBar({ pct, color }: { pct: number; color: string }) {
  const width = useSharedValue(0);
  useEffect(() => {
    width.value = withTiming(pct, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [pct]);
  const style = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));
  return (
    <View style={[styles.barTrack]}>
      <Animated.View style={[styles.bar, { backgroundColor: color }, style]} />
    </View>
  );
}

interface Props {
  records: SessionRecord[];
}

export function WaveChart({ records }: Props) {
  const colors = useColors();

  const counts: Record<string, number> = { delta: 0, theta: 0, alpha: 0 };
  records.forEach((r) => {
    const session = SESSIONS.find((s) => s.id === r.sessionId);
    if (session) {
      counts[session.waveType] = (counts[session.waveType] ?? 0) + 1;
    }
  });

  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.foreground }]}>
        Distribution des ondes
      </Text>
      <Text style={[styles.sub, { color: colors.mutedForeground }]}>
        {total} séance{total !== 1 ? "s" : ""} analysée{total !== 1 ? "s" : ""}
      </Text>

      {Object.entries(WAVE_META).map(([key, meta]) => {
        const count = counts[key] ?? 0;
        const pct = Math.round((count / total) * 100);
        return (
          <View key={key} style={styles.row}>
            <View style={styles.rowHeader}>
              <View style={[styles.dot, { backgroundColor: meta.color }]} />
              <View style={styles.rowLabels}>
                <Text style={[styles.waveLabel, { color: colors.foreground }]}>
                  {meta.label}
                </Text>
                <Text style={[styles.waveSub, { color: colors.mutedForeground }]}>
                  {meta.sub}
                </Text>
              </View>
              <Text style={[styles.pct, { color: meta.color }]}>{pct}%</Text>
            </View>
            <AnimatedBar pct={pct} color={meta.color} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  sub: {
    fontSize: 11,
    letterSpacing: 0.3,
    marginTop: -10,
  },
  row: {
    gap: 8,
  },
  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  rowLabels: {
    flex: 1,
    gap: 1,
  },
  waveLabel: {
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  waveSub: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
  pct: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
    minWidth: 36,
    textAlign: "right",
  },
  barTrack: {
    height: 6,
    backgroundColor: "#ffffff10",
    borderRadius: 3,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    borderRadius: 3,
  },
});
