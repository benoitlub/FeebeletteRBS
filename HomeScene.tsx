import { SymIcon } from "@/components/SymIcon";
import React, { useEffect } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";
import { SensorState } from "@/hooks/useSensors";

interface Props {
  sensors: SensorState;
  recommendedSession: string | null;
}

const agitationColors = {
  calm: "#00c896",
  moderate: "#ffaa00",
  agitated: "#ff4466",
};

const agitationLabels = {
  calm: "Calme",
  moderate: "Modéré",
  agitated: "Agité",
};

const lightLabels = {
  dark: "Sombre",
  dim: "Tamisé",
  bright: "Lumineux",
};

export function SensorBadge({ sensors }: Props) {
  const colors = useColors();
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, []);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.4, 1]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.8, 1.2]) }],
  }));

  // Loading state (before any sensor data arrives)
  if (!sensors.isAvailable) {
    return (
      <View style={[styles.container, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        <Animated.View style={[styles.dot, { backgroundColor: colors.mutedForeground }, dotStyle]} />
        <Text style={[styles.label, { color: colors.mutedForeground }]}>
          Capteurs · Initialisation…
        </Text>
      </View>
    );
  }

  const agitColor = agitationColors[sensors.agitationLevel];

  return (
    <View style={[styles.container, { backgroundColor: colors.muted, borderColor: colors.border }]}>
      <Animated.View style={[styles.dot, { backgroundColor: agitColor }, dotStyle]} />
      <View style={styles.data}>
        <Text style={[styles.chip, { color: agitColor }]}>
          {agitationLabels[sensors.agitationLevel]}
        </Text>
        {Platform.OS === "android" && (
          <Text style={[styles.chip, { color: colors.mutedForeground }]}>
            {lightLabels[sensors.lightLevel]}
          </Text>
        )}
        <Text style={[styles.chip, { color: colors.mutedForeground }]}>
          {sensors.motionHz > 0
            ? `${Math.round(sensors.motionHz * 10) / 10} Hz`
            : "Actifs"}
        </Text>
        {/* Source hint */}
        <Text style={[styles.source, { color: colors.mutedForeground }]}>
          {Platform.OS === "web" ? "· web" : "· natifs"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignSelf: "stretch",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  data: {
    flexDirection: "row",
    gap: 8,
    flex: 1,
    alignItems: "center",
  },
  chip: {
    fontSize: 11,
    letterSpacing: 0.4,
  },
  source: {
    fontSize: 9,
    letterSpacing: 0.3,
    marginLeft: "auto" as any,
  },
  label: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
});
