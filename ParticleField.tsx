import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions, Platform } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

const { width: W, height: H } = Dimensions.get("window");

interface Props {
  colors: string[];
  intensity: number;
  breathDuration: number;
}

function vivify(hex: string): string {
  if (!hex || hex.length < 7) return hex;
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const mx = Math.max(r, g, b);
    if (mx < 180) {
      const s = Math.max(3.5, 200 / Math.max(mx, 1));
      return `#${Math.min(255, Math.round(r * s + 18)).toString(16).padStart(2, "0")}${Math.min(255, Math.round(g * s + 12)).toString(16).padStart(2, "0")}${Math.min(255, Math.round(b * s + 28)).toString(16).padStart(2, "0")}`;
    }
  } catch (_) {}
  return hex;
}

// ── Floating orb ──────────────────────────────────────────────────────────────
function FloatingOrb({ x, y, size, color, speed, delay }: {
  x: number; y: number; size: number; color: string; speed: number; delay: number;
}) {
  const a = useSharedValue(0);
  useEffect(() => {
    const t = setTimeout(() => {
      a.value = withRepeat(withTiming(1, { duration: speed, easing: Easing.inOut(Easing.sin) }), -1, true);
    }, delay);
    return () => clearTimeout(t);
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(a.value, [0, 0.5, 1], [0.50, 0.82, 0.50]),
    transform: [
      { translateX: interpolate(a.value, [0, 1], [-26, 26]) },
      { translateY: interpolate(a.value, [0, 1], [-40, 40]) },
      { scale:      interpolate(a.value, [0, 0.5, 1], [0.80, 1.20, 0.80]) },
    ],
  }));
  return (
    <Animated.View
      style={[
        { position: "absolute", left: x, top: y, width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        style,
      ]}
    />
  );
}

// ── 3D Vortex Tunnel ─────────────────────────────────────────────────────────
const CX = W / 2;
const CY = H * 0.42;
const VORTEX_RINGS = Array.from({ length: 11 }, (_, i) => ({
  r: 20 + i * 20,
  alpha: Math.max(14, 68 - i * 5),
  lw: i === 0 ? 1.2 : 0.7,
}));

function VortexTunnel({ color }: { color: string }) {
  const rot  = useSharedValue(0);
  const rot2 = useSharedValue(0);
  const px   = useSharedValue(0);
  const py   = useSharedValue(0);

  useEffect(() => {
    rot.value  = withRepeat(withTiming(360,  { duration: 9000,  easing: Easing.linear }), -1, false);
    rot2.value = withRepeat(withTiming(-360, { duration: 14000, easing: Easing.linear }), -1, false);
  }, []);

  useEffect(() => {
    if (Platform.OS === "web") {
      if (typeof window === "undefined") return;
      const onM = (e: any) => {
        const ax = e.accelerationIncludingGravity?.x ?? 0;
        const ay = e.accelerationIncludingGravity?.y ?? 0;
        px.value = withTiming((ax / 9.81) * 12, { duration: 200 });
        py.value = withTiming((-ay / 9.81) * 12, { duration: 200 });
      };
      window.addEventListener("devicemotion", onM);
      return () => window.removeEventListener("devicemotion", onM);
    }
    let sub: { remove: () => void } | null = null;
    import("expo-sensors").then(({ Accelerometer }) => {
      Accelerometer.setUpdateInterval(80);
      sub = Accelerometer.addListener(({ x, y }) => {
        px.value = withTiming(x * -12, { duration: 200 });
        py.value = withTiming(y * 12, { duration: 200 });
      });
    }).catch(() => {});
    return () => sub?.remove();
  }, []);

  const disc1 = useAnimatedStyle(() => ({
    transform: [
      { translateX: px.value * 0.5 }, { translateY: py.value * 0.5 },
      { perspective: 360 }, { rotateX: "68deg" },
      { rotate: `${rot.value}deg` },
    ],
  }));
  const disc2 = useAnimatedStyle(() => ({
    transform: [
      { translateX: px.value * 0.85 }, { translateY: py.value * 0.85 },
      { perspective: 360 }, { rotateX: "68deg" },
      { rotate: `${rot2.value}deg` },
    ],
  }));

  return (
    <>
      <Animated.View style={[{ position: "absolute", left: CX, top: CY, width: 0, height: 0 }, disc1]}>
        {VORTEX_RINGS.map(({ r, alpha, lw }, i) => (
          <View key={i} style={{
            position: "absolute", width: r * 2, height: r * 2, borderRadius: r,
            borderWidth: lw,
            borderColor: color + alpha.toString(16).padStart(2, "0"),
            left: -r, top: -r,
          }} />
        ))}
      </Animated.View>
      <Animated.View style={[{ position: "absolute", left: CX, top: CY, width: 0, height: 0 }, disc2]}>
        {VORTEX_RINGS.filter((_, i) => i % 2 === 0).map(({ r, lw }, i) => (
          <View key={i} style={{
            position: "absolute", width: r * 2, height: r * 2, borderRadius: r,
            borderWidth: lw * 0.55, borderColor: "#ffb70020",
            left: -r, top: -r,
          }} />
        ))}
      </Animated.View>
    </>
  );
}

// ── Holographic vertical scan sweep ───────────────────────────────────────────
function HolographicScan({ color }: { color: string }) {
  const x = useSharedValue(-50);
  useEffect(() => {
    x.value = withRepeat(
      withSequence(
        withTiming(W + 50, { duration: 3200, easing: Easing.inOut(Easing.quad) }),
        withTiming(-50, { duration: 0 }),
        withTiming(-50, { duration: 2200 }), // pause
      ),
      -1, false,
    );
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <Animated.View
      style={[{ position: "absolute", top: 0, bottom: 0, left: 0, width: 50 }, style]}
      pointerEvents="none"
    >
      <LinearGradient
        colors={["transparent", color + "40", color + "15", "transparent"] as [string, string, string, string]}
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />
    </Animated.View>
  );
}

// ── Holographic projection base (aura at bottom) ──────────────────────────────
function ProjectionBase({ color }: { color: string }) {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, []);
  const s1 = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.20, 0.55]),
    transform: [{ scaleX: interpolate(pulse.value, [0, 1], [0.90, 1.10]) }],
  }));
  const s2 = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.10, 0.30]),
    transform: [{ scaleX: interpolate(pulse.value, [0, 1], [0.85, 1.15]) }],
  }));
  const CY_BASE = H * 0.78;
  return (
    <>
      <Animated.View style={[{
        position: "absolute", left: CX - 80, top: CY_BASE,
        width: 160, height: 20, borderRadius: 80,
        borderWidth: 1.2, borderColor: color + "cc",
        backgroundColor: color + "15",
      }, s1]} pointerEvents="none" />
      <Animated.View style={[{
        position: "absolute", left: CX - 110, top: CY_BASE + 6,
        width: 220, height: 28, borderRadius: 110,
        borderWidth: 0.6, borderColor: color + "60",
      }, s2]} pointerEvents="none" />
    </>
  );
}

// ── Mandala ───────────────────────────────────────────────────────────────────
const R1 = Math.min(W, H) * 0.37;
const R2 = R1 * 0.63;
const R3 = R2 * 0.55;

const RING1 = Array.from({ length: 12 }, (_, i) => ({ a: (i * 30) * Math.PI / 180 }));
const RING2 = Array.from({ length: 8 },  (_, i) => ({ a: (i * 45) * Math.PI / 180 }));
const RING3 = Array.from({ length: 6 },  (_, i) => ({ a: (i * 60) * Math.PI / 180 }));

function MandalaLayer({ color, intensity }: { color: string; intensity: number }) {
  const r1 = useSharedValue(0);
  const r2 = useSharedValue(0);
  const r3 = useSharedValue(0);
  const pl = useSharedValue(0);

  useEffect(() => {
    r1.value = withRepeat(withTiming(360,  { duration: 80000, easing: Easing.linear }), -1, false);
    r2.value = withRepeat(withTiming(-360, { duration: 52000, easing: Easing.linear }), -1, false);
    r3.value = withRepeat(withTiming(360,  { duration: 30000, easing: Easing.linear }), -1, false);
    pl.value = withRepeat(withTiming(1,    { duration: 4200,  easing: Easing.inOut(Easing.sin) }), -1, true);
  }, []);

  const s1 = useAnimatedStyle(() => ({
    transform: [{ rotate: `${r1.value}deg` }],
    opacity: interpolate(pl.value, [0, 1], [0.20, 0.48]) * Math.min(1, intensity * 1.4),
  }));
  const s2 = useAnimatedStyle(() => ({
    transform: [{ rotate: `${r2.value}deg` }],
    opacity: interpolate(pl.value, [0, 1], [0.16, 0.40]) * Math.min(1, intensity * 1.4),
  }));
  const s3 = useAnimatedStyle(() => ({
    transform: [{ rotate: `${r3.value}deg` }],
    opacity: interpolate(pl.value, [0, 1], [0.25, 0.55]) * Math.min(1, intensity * 1.4),
  }));
  const pulseS = useAnimatedStyle(() => ({
    opacity: interpolate(pl.value, [0, 1], [0.05, 0.20]),
    transform: [{ scale: interpolate(pl.value, [0, 1], [0.92, 1.08]) }],
  }));

  const dot = (a: number, r: number, sz: number) => ({
    left: Math.cos(a) * r - sz / 2,
    top:  Math.sin(a) * r - sz / 2,
    width: sz, height: sz, borderRadius: sz / 2,
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {[R1, R2, R3].map((r, i) => (
        <Animated.View
          key={i}
          style={[{ position: "absolute", left: CX - r, top: CY - r, width: r * 2, height: r * 2, borderRadius: r, borderWidth: 0.7, borderColor: color + "50" }, pulseS]}
        />
      ))}
      <Animated.View style={[{ position: "absolute", left: CX, top: CY, width: 0, height: 0 }, s1]}>
        {RING1.map(({ a }, i) => (
          <View key={i} style={[{ position: "absolute", backgroundColor: color + "88" }, dot(a, R1, i % 3 === 0 ? 5 : 3)]} />
        ))}
        {RING1.map(({ a }, i) => (
          <View key={`t${i}`} style={{
            position: "absolute", width: 1, height: 12, backgroundColor: color + "30",
            left: Math.cos(a) * (R1 - 9) - 0.5, top: Math.sin(a) * (R1 - 9) - 6,
            transform: [{ rotate: `${(a * 180 / Math.PI) + 90}deg` }],
          }} />
        ))}
      </Animated.View>
      <Animated.View style={[{ position: "absolute", left: CX, top: CY, width: 0, height: 0 }, s2]}>
        {RING2.map(({ a }, i) => (
          <View key={i} style={{
            position: "absolute", width: 7, height: 22, borderRadius: 3.5, backgroundColor: color + "55",
            left: Math.cos(a) * R2 - 3.5, top: Math.sin(a) * R2 - 11,
            transform: [{ rotate: `${(a * 180 / Math.PI) - 90}deg` }],
          }} />
        ))}
      </Animated.View>
      <Animated.View style={[{ position: "absolute", left: CX, top: CY, width: 0, height: 0 }, s3]}>
        {RING3.map(({ a }, i) => (
          <View key={i} style={{
            position: "absolute", width: 4, height: 18, borderRadius: 2, backgroundColor: color + "80",
            left: Math.cos(a) * R3 - 2, top: Math.sin(a) * R3 - 9,
            transform: [{ rotate: `${(a * 180 / Math.PI) - 90}deg` }],
          }} />
        ))}
        {[0, 60, 120].map((d) => (
          <View key={d} style={{
            position: "absolute", width: R3 * 1.6, height: 0.8, backgroundColor: color + "25",
            left: -R3 * 0.8, top: -0.4, transform: [{ rotate: `${d}deg` }],
          }} />
        ))}
      </Animated.View>
    </View>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
export function ChromaticDisplay({ colors: sessionColors, intensity, breathDuration }: Props) {
  const breathAnim = useSharedValue(0);
  const ringAnim   = useSharedValue(0);

  const safe = sessionColors.length >= 4 ? sessionColors : ["#080020", "#160048", "#0a0038", "#080020"];
  const c0 = vivify(safe[0]!);
  const c1 = vivify(safe[1]!);
  const c2 = vivify(safe[2]!);
  const c3 = vivify(safe[3]!);

  useEffect(() => {
    breathAnim.value = withRepeat(withTiming(1, { duration: breathDuration * 1000, easing: Easing.inOut(Easing.sin) }), -1, true);
    ringAnim.value   = withRepeat(withTiming(1, { duration: 4400, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [breathDuration]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(breathAnim.value, [0, 1], [0.58, Math.min(0.95, 0.82 * intensity)]),
  }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity:    interpolate(ringAnim.value, [0, 1], [0.14, 0.46]),
    transform: [{ scale: interpolate(ringAnim.value, [0, 1], [0.86, 1.14]) }],
  }));

  const orbs = [
    { x: -80,       y: H * 0.03, size: 330, color: c1, speed: 5400, delay: 0 },
    { x: W - 190,   y: H * 0.20, size: 275, color: c0, speed: 6800, delay: 700 },
    { x: W * 0.17,  y: H * 0.50, size: 305, color: c2, speed: 5800, delay: 1400 },
    { x: -40,       y: H * 0.63, size: 225, color: c3, speed: 8200, delay: 350 },
    { x: W * 0.52,  y: H * 0.07, size: 190, color: c1, speed: 4600, delay: 1900 },
  ];

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Base gradient */}
      <LinearGradient
        colors={["#07052e", c1, "#070710"] as [string, string, string]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      {orbs.map((o, i) => <FloatingOrb key={i} {...o} />)}

      {/* Breath-synced color wash */}
      <Animated.View style={[StyleSheet.absoluteFill, overlayStyle]}>
        <LinearGradient
          colors={[c1 + "a8", "transparent", c0 + "88"] as [string, string, string]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Breathing ring */}
      <Animated.View style={[{
        position: "absolute",
        borderColor: c0 + "88",
        left: W * 0.5 - H * 0.27, top: H * 0.5 - H * 0.27,
        width: H * 0.54, height: H * 0.54, borderRadius: H * 0.27,
        borderWidth: 1,
      }, ringStyle]} />

      {/* 3D Vortex Tunnel */}
      <VortexTunnel color={c1} />

      {/* Holographic vertical scan sweep */}
      <HolographicScan color={c1} />

      {/* Projection base (holographic aura at bottom) */}
      <ProjectionBase color={c1} />

      {/* Mandala sacred geometry */}
      <MandalaLayer color={c1} intensity={intensity} />
    </View>
  );
}

const styles = StyleSheet.create({});
