import React, { useEffect } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import Animated, {
  useSharedValue, withRepeat, withTiming, withSequence, withDelay,
  Easing, useAnimatedProps, useAnimatedStyle, interpolate,
} from "react-native-reanimated";
import Svg, {
  Path, Ellipse, Circle, G, Defs, RadialGradient, Stop, Line,
} from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedPath    = Animated.createAnimatedComponent(Path);

// ─── Scene geometry ───────────────────────────────────────────────────────────
const VW   = 300;
const VH   = 280;
const CX   = 150;
const APEX_Y  = 88;
const RIM_Y   = 194;
const RIM_RX  = 90;
const RIM_RY  = 13;
const STEM_W  = 11;
const HALO_Y  = 230;

// Longitude lines: from apex to 7 points on the rim
const LONG_PTS: [number, number][] = [
  [CX - RIM_RX,          RIM_Y],
  [CX - RIM_RX * 0.74,   RIM_Y + 4],
  [CX - RIM_RX * 0.42,   RIM_Y + 7],
  [CX,                   RIM_Y + RIM_RY],
  [CX + RIM_RX * 0.42,   RIM_Y + 7],
  [CX + RIM_RX * 0.74,   RIM_Y + 4],
  [CX + RIM_RX,          RIM_Y],
];

// Latitude arcs (front-visible wireframe rings)
const LAT_ARCS: [number,number,number,number,number,number][] = [
  [CX - 28, 103, CX, 98,  CX + 28, 103],
  [CX - 55, 124, CX, 118, CX + 55, 124],
  [CX - 76, 149, CX, 143, CX + 76, 149],
  [CX - 88, 174, CX, 168, CX + 88, 174],
];

// Dome outline (cubic bezier, control pts high to make a full dome)
const DOME = `M ${CX - RIM_RX} ${RIM_Y} C ${CX - RIM_RX} ${APEX_Y - 50} ${CX + RIM_RX} ${APEX_Y - 50} ${CX + RIM_RX} ${RIM_Y}`;

// Fairy visual sits ABOVE the SVG, in absolute React Native space
// We calculate where (in pixel space) the fairy lives:
//   fairy center = roughly at VH * 0.24 from top of SVG (scaled)

interface Props { primaryColor: string; isDark: boolean }

export function FairyScene({ primaryColor, isDark }: Props) {
  const { width } = useWindowDimensions();
  const svgScale  = Math.min(width / VW, 1.22);
  const svgW      = VW * svgScale;
  const svgH      = VH * svgScale;

  // ── Mushroom animations ──────────────────────────────────────────────────
  const shimmer  = useSharedValue(0);
  const haloR    = useSharedValue(0);

  // ── Fairy animations ─────────────────────────────────────────────────────
  const float    = useSharedValue(0);
  const pulse    = useSharedValue(0);
  const wing     = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(withSequence(
      withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      withTiming(0.3, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
    ), -1);

    haloR.value = withRepeat(withSequence(
      withTiming(1, { duration: 1900, easing: Easing.inOut(Easing.sin) }),
      withTiming(0,  { duration: 1900, easing: Easing.inOut(Easing.sin) }),
    ), -1);

    float.value = withRepeat(withSequence(
      withTiming(1, { duration: 2700, easing: Easing.inOut(Easing.sin) }),
      withTiming(0, { duration: 2700, easing: Easing.inOut(Easing.sin) }),
    ), -1);

    pulse.value = withRepeat(withSequence(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
      withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
    ), -1);

    wing.value = withRepeat(withSequence(
      withTiming(1, { duration: 1700, easing: Easing.inOut(Easing.sin) }),
      withTiming(0, { duration: 1700, easing: Easing.inOut(Easing.sin) }),
    ), -1);
  }, []);

  // Animated SVG props — mushroom shimmer
  const shimProps = useAnimatedProps(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.25, 0.65]),
  }));
  const haloProps = useAnimatedProps(() => ({
    rx: interpolate(haloR.value, [0, 1], [46, 64]),
    ry: interpolate(haloR.value, [0, 1], [8,  12]),
    opacity: interpolate(haloR.value, [0, 1], [0.85, 0.2]),
  }));

  // Fairy float
  const fairyStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(float.value, [0, 1], [0, -10]) }],
  }));
  const coreStyle = useAnimatedStyle(() => ({
    width:  interpolate(pulse.value, [0, 1], [22, 30]),
    height: interpolate(pulse.value, [0, 1], [22, 30]),
    borderRadius: interpolate(pulse.value, [0, 1], [11, 15]),
    opacity: interpolate(pulse.value, [0, 1], [0.95, 0.7]),
  }));
  const aura1Style = useAnimatedStyle(() => ({
    width:  interpolate(pulse.value, [0, 1], [44, 58]),
    height: interpolate(pulse.value, [0, 1], [44, 58]),
    borderRadius: interpolate(pulse.value, [0, 1], [22, 29]),
    opacity: interpolate(pulse.value, [0, 1], [0.35, 0.12]),
  }));
  const aura2Style = useAnimatedStyle(() => ({
    width:  interpolate(pulse.value, [0, 1], [68, 84]),
    height: interpolate(pulse.value, [0, 1], [68, 84]),
    borderRadius: interpolate(pulse.value, [0, 1], [34, 42]),
    opacity: interpolate(pulse.value, [0, 1], [0.14, 0.04]),
  }));
  const wingLStyle = useAnimatedStyle(() => ({
    opacity: interpolate(wing.value, [0, 1], [0.25, 0.65]),
    transform: [
      { translateX: interpolate(wing.value, [0, 1], [-26, -33]) },
      { scaleX: interpolate(wing.value, [0, 1], [1, 1.12]) },
    ],
  }));
  const wingRStyle = useAnimatedStyle(() => ({
    opacity: interpolate(wing.value, [0, 1], [0.25, 0.65]),
    transform: [
      { translateX: interpolate(wing.value, [0, 1], [26, 33]) },
      { scaleX: interpolate(wing.value, [0, 1], [1, 1.12]) },
    ],
  }));

  const cyan = primaryColor || "#00e5ff";
  const viol = "#b07cff";

  // Pixel position of the fairy center above the SVG
  const fairyCenterY = (APEX_Y - 44) * svgScale;  // above dome apex
  const fairyCenterX = svgW / 2;

  return (
    <View style={{ width: svgW, height: svgH, alignSelf: "center" }}>

      {/* ── Mushroom SVG layer ── */}
      <Svg width={svgW} height={svgH} viewBox={`0 0 ${VW} ${VH}`}>
        <Defs>
          <RadialGradient id="mBase" cx="50%" cy="40%" r="60%">
            <Stop offset="0%"   stopColor={cyan} stopOpacity={0.28} />
            <Stop offset="100%" stopColor={cyan} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="halo" cx="50%" cy="50%" r="50%">
            <Stop offset="0%"   stopColor={cyan} stopOpacity={0.95} />
            <Stop offset="50%"  stopColor={cyan} stopOpacity={0.35} />
            <Stop offset="100%" stopColor={cyan} stopOpacity={0} />
          </RadialGradient>
        </Defs>

        {/* Ambient glow behind mushroom */}
        <Ellipse cx={CX} cy={RIM_Y + 20} rx={110} ry={60} fill="url(#mBase)" />

        {/* Stem */}
        <Path
          d={`M ${CX - STEM_W} ${RIM_Y + 3} L ${CX - STEM_W + 3} ${HALO_Y - 2} L ${CX + STEM_W - 3} ${HALO_Y - 2} L ${CX + STEM_W} ${RIM_Y + 3} Z`}
          fill="none" stroke={cyan} strokeWidth={1.2} opacity={0.5}
        />
        <Line x1={CX} y1={RIM_Y + 3} x2={CX} y2={HALO_Y - 2}
          stroke={cyan} strokeWidth={0.5} opacity={0.4} />

        {/* Halo ring (animated pulse) */}
        <AnimatedEllipse cx={CX} cy={HALO_Y} animatedProps={haloProps} fill="url(#halo)" />
        <Ellipse cx={CX} cy={HALO_Y} rx={46} ry={8}
          fill="none" stroke={cyan} strokeWidth={1.6} opacity={0.9} />

        {/* Rim ellipse */}
        <Ellipse cx={CX} cy={RIM_Y} rx={RIM_RX} ry={RIM_RY}
          fill="none" stroke={cyan} strokeWidth={1.2} opacity={0.75} />

        {/* Dome outline (animated shimmer) */}
        <AnimatedPath d={DOME} fill="none" stroke={cyan} strokeWidth={1.5}
          animatedProps={shimProps} />

        {/* Latitude rings */}
        {LAT_ARCS.map(([x1, y1, cpX, cpY, x2, y2], i) => (
          <AnimatedPath
            key={i}
            d={`M ${x1} ${y1} Q ${cpX} ${cpY} ${x2} ${y2}`}
            fill="none" stroke={cyan} strokeWidth={0.8}
            animatedProps={shimProps}
          />
        ))}

        {/* Longitude lines */}
        {LONG_PTS.map(([tx, ty], i) => (
          <AnimatedPath
            key={i}
            d={`M ${CX} ${APEX_Y} L ${tx} ${ty}`}
            fill="none" stroke={cyan} strokeWidth={0.7}
            animatedProps={shimProps}
          />
        ))}
      </Svg>

      {/* ── Fairy layer (absolute, over SVG) ── */}
      <Animated.View
        style={[
          styles.fairyAnchor,
          { top: fairyCenterY, left: fairyCenterX },
          fairyStyle,
        ]}
      >
        {/* Outer aura */}
        <Animated.View style={[styles.fairyAura, { backgroundColor: viol }, aura2Style]} />
        {/* Inner aura */}
        <Animated.View style={[styles.fairyAura, { backgroundColor: viol + "cc" }, aura1Style]} />

        {/* Wings */}
        <Animated.View style={[styles.wing, styles.wingLeft, { backgroundColor: viol }, wingLStyle]} />
        <Animated.View style={[styles.wing, styles.wingRight, { backgroundColor: viol }, wingRStyle]} />

        {/* Core glow */}
        <Animated.View style={[styles.fairyCore, coreStyle]}>
          <LinearGradient
            colors={["#f0d8ff", viol, "#8040cc"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
          />
        </Animated.View>

        {/* Highlight */}
        <View style={styles.fairyHighlight} />

        {/* Sparkle dots */}
        {SPARKS.map(([dx, dy], i) => (
          <View
            key={i}
            style={[styles.spark, { left: dx, top: dy, opacity: 0.4 + (i % 3) * 0.18 }]}
          />
        ))}
      </Animated.View>
    </View>
  );
}

const SPARKS: [number, number][] = [
  [-26, -12], [24, -8], [-16, 18], [22, 16], [2, -24], [-8, 26],
];

const styles = StyleSheet.create({
  fairyAnchor: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateX: -42 }, { translateY: -42 }],
    width: 84,
    height: 84,
  },
  fairyAura: {
    position: "absolute",
    alignSelf: "center",
  },
  fairyCore: {
    position: "absolute",
    overflow: "hidden",
  },
  fairyHighlight: {
    position: "absolute",
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#ffffff",
    opacity: 0.7,
    top: 10,
    left: 14,
  },
  wing: {
    position: "absolute",
    width: 30,
    height: 22,
    borderRadius: 14,
    top: 24,
  },
  wingLeft:  { borderTopRightRadius: 3, borderBottomRightRadius: 3 },
  wingRight: { borderTopLeftRadius: 3,  borderBottomLeftRadius: 3 },
  spark: {
    position: "absolute",
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#e0c0ff",
  },
});
