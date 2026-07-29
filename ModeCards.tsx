import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");
const ORB_SIZE = Math.min(width * 0.52, 210);

function useGyroParallax() {
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);

  useEffect(() => {
    if (Platform.OS === "web") {
      const handleOrientation = (e: DeviceOrientationEvent) => {
        const x = ((e.beta ?? 0) / 45) * 10;
        const y = ((e.gamma ?? 0) / 45) * 10;
        tiltX.value = withTiming(Math.max(-10, Math.min(10, x)), { duration: 200 });
        tiltY.value = withTiming(Math.max(-10, Math.min(10, y)), { duration: 200 });
      };
      window.addEventListener("deviceorientation", handleOrientation);
      return () => window.removeEventListener("deviceorientation", handleOrientation);
    } else {
      let sub: { remove: () => void } | null = null;
      import("expo-sensors")
        .then(({ Gyroscope }) => {
          Gyroscope.setUpdateInterval(60);
          sub = Gyroscope.addListener(({ x, y }) => {
            tiltX.value = withTiming(
              Math.max(-14, Math.min(14, tiltX.value + x * 2.5)),
              { duration: 120 }
            );
            tiltY.value = withTiming(
              Math.max(-14, Math.min(14, tiltY.value + y * 2.5)),
              { duration: 120 }
            );
          });
        })
        .catch(() => {});
      return () => sub?.remove();
    }
  }, []);

  return { tiltX, tiltY };
}

export function RadialOrb() {
  const colors = useColors();
  const pulse = useSharedValue(0);
  const rotate = useSharedValue(0);
  const innerPulse = useSharedValue(0);
  const { tiltX, tiltY } = useGyroParallax();

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    rotate.value = withRepeat(
      withTiming(360, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );
    innerPulse.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, []);

  const layer0Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: tiltY.value * -0.4 },
      { translateY: tiltX.value * 0.4 },
      { scale: interpolate(pulse.value, [0, 1], [0.95, 1.05]) },
    ],
    opacity: interpolate(pulse.value, [0, 1], [0.1, 0.2]),
  }));

  const layer1Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: tiltY.value * -1 },
      { translateY: tiltX.value * 1 },
      { scale: interpolate(pulse.value, [0, 1], [0.97, 1.03]) },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: interpolate(pulse.value, [0, 1], [0.35, 0.65]),
  }));

  const layer2Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: tiltY.value * -1.8 },
      { translateY: tiltX.value * 1.8 },
      { scale: interpolate(innerPulse.value, [0, 1], [0.9, 1.0]) },
    ],
    opacity: interpolate(innerPulse.value, [0, 1], [0.5, 0.85]),
  }));

  const coreStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tiltY.value * -2.5 },
      { translateY: tiltX.value * 2.5 },
    ],
    opacity: interpolate(innerPulse.value, [0, 1], [0.65, 1.0]),
  }));

  const dotsStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tiltY.value * -3 },
      { translateY: tiltX.value * 3 },
      { rotate: `${-rotate.value * 0.6}deg` },
    ],
  }));

  const dotPositions = [
    { angle: 0, dist: ORB_SIZE * 0.52 },
    { angle: 60, dist: ORB_SIZE * 0.48 },
    { angle: 120, dist: ORB_SIZE * 0.55 },
    { angle: 180, dist: ORB_SIZE * 0.50 },
    { angle: 240, dist: ORB_SIZE * 0.46 },
    { angle: 300, dist: ORB_SIZE * 0.53 },
  ];

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.layer,
          styles.outerRing,
          { borderColor: colors.primary + "18" },
          layer0Style,
        ]}
      />

      <Animated.View
        style={[
          styles.layer,
          styles.midRing,
          { borderColor: colors.primary + "40" },
          layer1Style,
        ]}
      >
        <View style={[styles.ringNotch, { backgroundColor: colors.primary + "80" }]} />
      </Animated.View>

      <Animated.View
        style={[
          styles.layer,
          styles.innerRing,
          { borderColor: colors.secondary + "50" },
          layer2Style,
        ]}
      />

      <Animated.View
        style={[
          styles.layer,
          styles.core,
          { backgroundColor: colors.primary + "14" },
          coreStyle,
        ]}
      >
        <View style={[styles.coreInner, { backgroundColor: colors.primary + "20" }]} />
      </Animated.View>

      <Animated.View style={[styles.layer, styles.dotsLayer, dotsStyle]}>
        {dotPositions.map((pos, i) => {
          const rad = (pos.angle * Math.PI) / 180;
          return (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i % 2 === 0 ? colors.primary : colors.accent,
                  left: ORB_SIZE / 2 + Math.cos(rad) * pos.dist - 2,
                  top: ORB_SIZE / 2 + Math.sin(rad) * pos.dist - 2,
                  opacity: 0.4 + (i % 3) * 0.2,
                  width: i % 2 === 0 ? 3 : 4,
                  height: i % 2 === 0 ? 3 : 4,
                  borderRadius: i % 2 === 0 ? 1.5 : 2,
                },
              ]}
            />
          );
        })}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  layer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  outerRing: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    borderWidth: 1,
  },
  midRing: {
    width: ORB_SIZE * 0.76,
    height: ORB_SIZE * 0.76,
    borderRadius: ORB_SIZE * 0.38,
    borderWidth: 1.5,
  },
  ringNotch: {
    position: "absolute",
    top: 0,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  innerRing: {
    width: ORB_SIZE * 0.52,
    height: ORB_SIZE * 0.52,
    borderRadius: ORB_SIZE * 0.26,
    borderWidth: 1,
  },
  core: {
    width: ORB_SIZE * 0.36,
    height: ORB_SIZE * 0.36,
    borderRadius: ORB_SIZE * 0.18,
  },
  coreInner: {
    width: ORB_SIZE * 0.18,
    height: ORB_SIZE * 0.18,
    borderRadius: ORB_SIZE * 0.09,
  },
  dotsLayer: {
    width: ORB_SIZE,
    height: ORB_SIZE,
  },
  dot: {
    position: "absolute",
  },
});
