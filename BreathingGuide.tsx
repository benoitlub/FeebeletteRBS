/**
 * FractalHero — slim 52px topbar animation strip.
 * FractalOrb   — compact 64×64 animated orb for the BottomShelf.
 */
import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  useAnimatedStyle,
  interpolate,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

const { width: W } = Dimensions.get("window");

export const FRACTAL_HERO_H = 52;

// ── Fibonacci dots for the slim hero ─────────────────────────────────────────
const PHI = Math.PI * 2 * (2 - 1.6180339887);
const HERO_DOTS = Array.from({ length: 8 }, (_, i) => ({
  x: W / 2 + Math.cos(i * PHI) * (Math.sqrt(i + 1) * 10),
  y: FRACTAL_HERO_H / 2 + Math.sin(i * PHI) * (Math.sqrt(i + 1) * 4.5),
  s: 2,
  i,
}));

// ── Slim hero topbar ──────────────────────────────────────────────────────────
interface HeroProps {
  primaryColor: string;
  secondaryColor: string;
  isDark: boolean;
}

export function FractalHero({ primaryColor: pc, secondaryColor: sc, isDark }: HeroProps) {
  const gold = "#ffb700";
  const scanX = useSharedValue(-40);
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.sin) }), -1, true);
    scanX.value = withRepeat(
      withSequence(
        withTiming(W + 40, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
        withTiming(-40, { duration: 0 }),
        withTiming(-40, { duration: 1800 }),
      ),
      -1, false,
    );
  }, []);

  const scanStyle = useAnimatedStyle(() => ({ transform: [{ translateX: scanX.value }] }));
  const dotStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.15, 0.55]),
  }));

  const bg: [string, string] = isDark
    ? ["#070720", "#07071a"]
    : ["#e8e8f4", "#eeeef8"];

  return (
    <View style={styles.hero}>
      <LinearGradient colors={bg} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />

      {/* Color tint strip */}
      <LinearGradient
        colors={[pc + "18", "transparent", gold + "0c"] as [string, string, string]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />

      {/* Fibonacci dots */}
      <Animated.View style={[StyleSheet.absoluteFill, dotStyle]} pointerEvents="none">
        {HERO_DOTS.map(({ x, y, s, i }) => (
          <View
            key={i}
            style={{
              position: "absolute", width: s, height: s, borderRadius: s / 2,
              backgroundColor: i % 3 === 0 ? gold : i % 3 === 1 ? pc : sc,
              left: x - s / 2, top: y - s / 2,
              opacity: 0.3 + i * 0.08,
            }}
          />
        ))}
      </Animated.View>

      {/* Yugop scan line — horizontal neon beam */}
      <Animated.View
        style={[{ position: "absolute", top: 0, bottom: 0, left: 0, width: 36 }, scanStyle]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={["transparent", pc + "60", pc + "c0", pc + "60", "transparent"] as [string, string, string, string, string]}
          style={{ flex: 1 }}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </Animated.View>

      {/* Bottom border line */}
      <View style={[styles.borderLine, { backgroundColor: pc + "30" }]} />
    </View>
  );
}

// ── FractalOrb — compact 64×64 orb for BottomShelf ────────────────────────────
interface OrbProps {
  size?: number;
  primaryColor: string;
  secondaryColor: string;
}

export function FractalOrb({ size = 64, primaryColor: pc, secondaryColor: sc }: OrbProps) {
  const gold = "#ffb700";
  const C = size / 2;
  const pulse = useSharedValue(0);
  const rot1  = useSharedValue(0);
  const rot2  = useSharedValue(0);
  const exp   = useSharedValue(0);
  const aura  = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }), -1, true);
    rot1.value  = withRepeat(withTiming(360,  { duration: 14000, easing: Easing.linear }), -1, false);
    rot2.value  = withRepeat(withTiming(-360, { duration: 22000, easing: Easing.linear }), -1, false);
    aura.value  = withRepeat(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }), -1, true);
    exp.value   = withRepeat(
      withSequence(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 0 })),
      -1, false,
    );
  }, []);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.82, 1.22]) }],
    opacity:    interpolate(pulse.value, [0, 1], [0.70, 1.00]),
  }));
  const r1Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot1.value}deg` }],
    opacity: interpolate(pulse.value, [0, 1], [0.18, 0.55]),
  }));
  const r2Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot2.value}deg` }],
    opacity: interpolate(pulse.value, [0, 1], [0.12, 0.32]),
  }));
  const expStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(exp.value, [0, 1], [0.1, 2.0]) }],
    opacity:   interpolate(exp.value, [0, 0.15, 1], [0.80, 0.50, 0]),
  }));
  const aura1Style = useAnimatedStyle(() => ({
    opacity: interpolate(aura.value, [0, 1], [0.30, 0.90]),
    transform: [{ scaleX: interpolate(aura.value, [0, 1], [0.90, 1.10]) }],
  }));

  const ORB  = size * 0.21;
  const R1   = size * 0.33;
  const R2   = size * 0.43;

  return (
    <View style={{ width: size, height: size }}>
      {/* 3D ring 1 */}
      <Animated.View
        style={[{
          position: "absolute", left: C - R1, top: C - R1 * 0.28,
          width: R1 * 2, height: R1 * 0.56, borderRadius: R1,
          borderWidth: 0.8, borderColor: pc + "55",
          transform: [{ perspective: 280 }, { rotateX: "72deg" }],
        }, r1Style]}
      />
      {/* 3D ring 2 */}
      <Animated.View
        style={[{
          position: "absolute", left: C - R2, top: C - R2 * 0.25,
          width: R2 * 2, height: R2 * 0.50, borderRadius: R2,
          borderWidth: 0.6, borderColor: gold + "40",
          transform: [{ perspective: 280 }, { rotateX: "72deg" }],
        }, r2Style]}
      />

      {/* Expand pulse ring */}
      <Animated.View
        style={[{
          position: "absolute", left: C - ORB * 1.5, top: C - ORB * 1.5,
          width: ORB * 3, height: ORB * 3, borderRadius: ORB * 1.5,
          borderWidth: 1, borderColor: pc + "80",
        }, expStyle]}
      />

      {/* Holo aura base */}
      <Animated.View
        style={[{
          position: "absolute",
          left: C - size * 0.30, top: C + size * 0.12,
          width: size * 0.60, height: size * 0.12, borderRadius: size * 0.30,
          borderWidth: 1, borderColor: pc + "cc",
          backgroundColor: pc + "18",
        }, aura1Style]}
      />

      {/* Static ambient ring */}
      <View
        style={{
          position: "absolute", left: C - R1 * 1.1, top: C - R1 * 1.1,
          width: R1 * 2.2, height: R1 * 2.2, borderRadius: R1 * 1.1,
          borderWidth: 0.5, borderColor: pc + "20",
        }}
      />

      {/* Central orb */}
      <Animated.View
        style={[{
          position: "absolute", left: C - ORB, top: C - ORB,
          width: ORB * 2, height: ORB * 2, borderRadius: ORB,
        }, orbStyle]}
      >
        <LinearGradient
          colors={[pc, gold] as [string, string]}
          style={[StyleSheet.absoluteFill, { borderRadius: ORB }]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { width: "100%", height: FRACTAL_HERO_H, overflow: "hidden" },
  borderLine: { position: "absolute", bottom: 0, left: 0, right: 0, height: 1 },
});
