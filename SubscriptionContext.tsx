/**
 * LightTherapyOrb — visual représentation of the torch light-therapy session.
 * Inspired by Lumenate: pulsing orb synced to the torch frequency,
 * Hz display, and inline permission request.
 */
import { SymIcon } from "@/components/SymIcon";
import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  useAnimatedStyle,
  Easing,
  interpolate,
} from "react-native-reanimated";

interface Props {
  hz:            number;
  torchOn:       boolean;
  isActive:      boolean;
  hasPermission: boolean | null;
  enabled:       boolean;
  onToggle:      () => void;
  onAskPermission: () => void;
  primaryColor:  string;
}

export function LightTherapyOrb({
  hz,
  torchOn,
  isActive,
  hasPermission,
  enabled,
  onToggle,
  onAskPermission,
  primaryColor,
}: Props) {
  // ── Orb glow: reacts to torchOn (native) or a slow pulse on web ───────────
  const glow     = useSharedValue(0);
  const ringPulse = useSharedValue(0);

  useEffect(() => {
    if (Platform.OS !== "web") {
      // Sync glow to actual torch state
      glow.value = withTiming(torchOn ? 1 : 0.08, {
        duration: torchOn ? 30 : 120,
        easing: Easing.out(Easing.quad),
      });
    } else {
      // On web: gentle idle animation
      glow.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.15, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      );
    }
  }, [torchOn]);

  // Ring pulse: independent slow breathe
  useEffect(() => {
    ringPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, []);

  const orbStyle = useAnimatedStyle(() => {
    const opacity = interpolate(glow.value, [0, 1], [0.08, 1]);
    const scale   = interpolate(glow.value, [0, 1], [0.82, 1]);
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  const ringStyle = useAnimatedStyle(() => ({
    opacity: interpolate(ringPulse.value, [0, 1], [0.12, 0.5]),
    transform: [{ scale: interpolate(ringPulse.value, [0, 1], [1, 1.28]) }],
  }));

  const LAMP_COLOR  = enabled && isActive ? "#00e5ff" : enabled ? "#7c4dff" : "#ffffff30";
  const LABEL_COLOR = enabled ? primaryColor : "#ffffff40";

  // ── No permission yet: show request card ──────────────────────────────────
  if (Platform.OS !== "web" && hasPermission === false) {
    return (
      <Pressable onPress={(e) => { e.stopPropagation(); onAskPermission(); }} style={styles.permCard}>
        <View style={[styles.permIconWrap, { borderColor: primaryColor + "40" }]}>
          <SymIcon name="flashlight-outline" size={22} color={primaryColor} />
        </View>
        <View style={styles.permText}>
          <Text style={[styles.permTitle, { color: "#ffffffd0" }]}>
            Luminothérapie par torche
          </Text>
          <Text style={[styles.permSub, { color: "#ffffff60" }]}>
            Appuie pour autoriser l'accès à la caméra
          </Text>
        </View>
        <SymIcon name="chevron-forward" size={16} color={primaryColor + "80"} />
      </Pressable>
    );
  }

  return (
    <Pressable onPress={(e) => { e.stopPropagation(); onToggle(); }} style={styles.container}>
      {/* Outer breathing ring */}
      <Animated.View style={[styles.ring, { borderColor: LAMP_COLOR }, ringStyle]} />

      {/* Inner glow orb */}
      <Animated.View style={[styles.orbWrap, orbStyle]}>
        <View style={[styles.orb, { backgroundColor: LAMP_COLOR + "22", borderColor: LAMP_COLOR + "55" }]}>
          <View style={[styles.orbInner, { backgroundColor: LAMP_COLOR + "33" }]}>
            <SymIcon
              name={enabled ? "flashlight" : "flashlight-outline"}
              size={26}
              color={LAMP_COLOR}
            />
          </View>
        </View>
      </Animated.View>

      {/* Labels */}
      <View style={styles.labels}>
        <Text style={[styles.hzText, { color: LABEL_COLOR }]}>
          {hz} Hz
        </Text>
        <Text style={[styles.modeText, { color: LABEL_COLOR + "bb" }]}>
          LUMINOTHÉRAPIE
        </Text>
        {isActive && (
          <View style={styles.activeRow}>
            <Animated.View style={[styles.activeDot, { backgroundColor: "#00e5ff" }, orbStyle]} />
            <Text style={[styles.activeLabel, { color: "#00e5ff99" }]}>torche active</Text>
          </View>
        )}
        {!enabled && (
          <Text style={styles.tapHint}>appuie pour activer</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 8,
  },

  ring: {
    position: "absolute",
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 1,
  },

  orbWrap: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  orb: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  orbInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  labels: {
    alignItems: "center",
    gap: 2,
    marginTop: 4,
  },
  hzText: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  modeText: {
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 2.5,
  },
  activeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 3,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  activeLabel: {
    fontSize: 9,
    letterSpacing: 1.2,
  },
  tapHint: {
    fontSize: 9,
    color: "#ffffff30",
    letterSpacing: 1,
    marginTop: 3,
  },

  // Permission card
  permCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#ffffff08",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ffffff15",
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginHorizontal: 4,
  },
  permIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff08",
  },
  permText: { flex: 1 },
  permTitle: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  permSub: {
    fontSize: 11,
    letterSpacing: 0.2,
    marginTop: 2,
  },
});
