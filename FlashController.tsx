import { SymIcon } from "@/components/SymIcon";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  useAnimatedStyle,
  Easing,
  interpolate,
  withDelay,
  cancelAnimation,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColors } from "@/hooks/useColors";
import { useLanguage } from "@/context/LanguageContext";

const TAP_TARGET = 7;
const TAP_WINDOW_MS = 3000;

interface FeeBeletteProps {
  onInfoPress?: () => void;
}

export function FeeBeletteIcon({ onInfoPress }: FeeBeletteProps = {}) {
  const colors = useColors();
  const { t } = useLanguage();
  const taps = useRef<number[]>([]);
  const [showReset, setShowReset] = useState(false);
  const [rippleVisible, setRippleVisible] = useState(false);

  const rotate = useSharedValue(0);
  const wingL = useSharedValue(0);
  const wingR = useSharedValue(0);
  const glow = useSharedValue(0.4);
  const orbScale = useSharedValue(1);
  const ripple = useSharedValue(0);

  useEffect(() => {
    rotate.value = withRepeat(
      withTiming(360, { duration: 12000, easing: Easing.linear }),
      -1
    );
    wingL.value = withRepeat(
      withSequence(
        withTiming(-18, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        withTiming(-8, { duration: 1200, easing: Easing.inOut(Easing.sin) })
      ),
      -1
    );
    wingR.value = withRepeat(
      withSequence(
        withTiming(18, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        withTiming(8, { duration: 1200, easing: Easing.inOut(Easing.sin) })
      ),
      -1
    );
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.3, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1
    );
    orbScale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.96, { duration: 1800, easing: Easing.inOut(Easing.sin) })
      ),
      -1
    );
  }, []);

  const handleTap = useCallback(() => {
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < TAP_WINDOW_MS), now];

    ripple.value = 0;
    ripple.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    setRippleVisible(true);
    setTimeout(() => setRippleVisible(false), 620);

    if (taps.current.length >= TAP_TARGET) {
      taps.current = [];
      setTimeout(() => setShowReset(true), 150);
    }
  }, []);

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
  }));
  const wingLStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${wingL.value}deg` }],
  }));
  const wingRStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${wingR.value}deg` }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));
  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value }],
  }));
  const rippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(ripple.value, [0, 1], [0.3, 1.8]) }],
    opacity: interpolate(ripple.value, [0, 0.6, 1], [0.7, 0.3, 0]),
  }));

  return (
    <>
      <View style={styles.container}>
        <Pressable onPress={handleTap} style={styles.orbArea}>
          <Animated.View style={[styles.glowRing, glowStyle, { borderColor: colors.secondary + "60" }]} />
          <Animated.View style={[styles.glowRing2, glowStyle, { borderColor: colors.primary + "30" }]} />

          {rippleVisible && (
            <Animated.View
              style={[styles.ripple, rippleStyle, { borderColor: colors.secondary + "80" }]}
            />
          )}

          <Animated.View style={[styles.orbWrapper, orbStyle]}>
            <View style={[styles.orbBg, { backgroundColor: colors.muted, borderColor: colors.secondary + "50" }]}>
              <LinearGradient
                colors={[colors.secondary + "30", colors.primary + "15"]}
                style={[StyleSheet.absoluteFill, { borderRadius: 42 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />

              <Animated.View style={[styles.wingLeft, wingLStyle]}>
                <WingShape color={colors.secondary} flip={false} />
              </Animated.View>
              <Animated.View style={[styles.wingRight, wingRStyle]}>
                <WingShape color={colors.primary} flip />
              </Animated.View>

              <View style={styles.centerIcon}>
                <Animated.View style={rotateStyle}>
                  <View style={[styles.orbInner, { borderColor: colors.secondary + "80" }]}>
                    <LinearGradient
                      colors={[colors.secondary + "50", colors.primary + "30"]}
                      style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                  </View>
                </Animated.View>
                <View style={styles.eyeOverlay}>
                  <SymIcon name="eye-outline" size={14} color={colors.primary} />
                </View>
              </View>

              <View style={styles.sparkles}>
                <SparkDot color={colors.secondary} x={-16} y={-10} delay={0} />
                <SparkDot color={colors.primary} x={16} y={-12} delay={400} />
                <SparkDot color={colors.amber} x={-20} y={8} delay={800} />
                <SparkDot color={colors.secondary} x={20} y={6} delay={1200} />
              </View>
            </View>
          </Animated.View>
        </Pressable>

        <Pressable
          onPress={onInfoPress}
          disabled={!onInfoPress}
          style={({ pressed }) => [styles.labelArea, onInfoPress && pressed && { opacity: 0.7 }]}
        >
          <View style={styles.labelRow}>
            <Text style={[styles.labelTop, { color: colors.secondary }]}>✦ FÉE BELETTE ✦</Text>
          </View>
          <View style={styles.labelSubRow}>
            <Text style={[styles.labelSub, { color: colors.mutedForeground }]}>
              Reboot System · by Blacklace Island
            </Text>
            {onInfoPress && (
              <View style={[styles.infoHint, { borderColor: colors.border }]}>
                <SymIcon name="information-circle-outline" size={11} color={colors.mutedForeground} />
              </View>
            )}
          </View>
        </Pressable>
      </View>

      <RebootModal
        visible={showReset}
        onClose={() => setShowReset(false)}
      />
    </>
  );
}

function WingShape({ color, flip }: { color: string; flip: boolean }) {
  return (
    <View
      style={[
        styles.wing,
        {
          borderTopColor: color + "70",
          borderLeftColor: flip ? "transparent" : color + "40",
          borderRightColor: flip ? color + "40" : "transparent",
          transform: [{ scaleX: flip ? -1 : 1 }],
        },
      ]}
    />
  );
}

function SparkDot({ color, x, y, delay }: { color: string; x: number; y: number; delay: number }) {
  const opacity = useSharedValue(0);
  const s = useSharedValue(0.5);

  useEffect(() => {
    const startAnim = () => {
      opacity.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 600 }),
            withTiming(0, { duration: 600 })
          ),
          -1
        )
      );
      s.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1.3, { duration: 600 }),
            withTiming(0.6, { duration: 600 })
          ),
          -1
        )
      );
    };
    startAnim();
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: s.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.sparkDot,
        { backgroundColor: color, position: "absolute", left: 26 + x, top: 26 + y },
        style,
      ]}
    />
  );
}

function RebootModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const { t } = useLanguage();
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");

  const spin = useSharedValue(0);
  const dnaPhase = useSharedValue(0);

  useEffect(() => {
    if (phase === "running") {
      spin.value = withRepeat(withTiming(360, { duration: 1200, easing: Easing.linear }), -1);
      dnaPhase.value = withRepeat(withTiming(1, { duration: 800, easing: Easing.inOut(Easing.sin) }), -1, true);
    } else {
      cancelAnimation(spin);
      cancelAnimation(dnaPhase);
      spin.value = 0;
    }
  }, [phase]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }],
  }));

  const handleReset = async () => {
    setPhase("running");
    try {
      const keys = await AsyncStorage.getAllKeys();
      await AsyncStorage.multiRemove(keys);
      await new Promise((r) => setTimeout(r, 2000));
      setPhase("done");
      setTimeout(() => {
        setPhase("idle");
        onClose();
      }, 1500);
    } catch {
      setPhase("idle");
    }
  };

  const handleClose = () => {
    if (phase === "running") return;
    setPhase("idle");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <Pressable style={styles.backdrop} onPress={phase === "idle" ? handleClose : undefined}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View style={[styles.resetCard, { backgroundColor: colors.card, borderColor: colors.destructive + "50" }]}>
            <LinearGradient
              colors={[colors.destructive + "12", colors.secondary + "08", "transparent"]}
              style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />

            <View style={styles.resetIconRow}>
              {phase === "running" ? (
                <Animated.View style={spinStyle}>
                  <DnaHelix color={colors.destructive} />
                </Animated.View>
              ) : phase === "done" ? (
                <View style={[styles.doneCircle, { borderColor: colors.accent + "60", backgroundColor: colors.accent + "15" }]}>
                  <SymIcon name="checkmark" size={28} color={colors.accent} />
                </View>
              ) : (
                <DnaHelix color={colors.destructive} />
              )}
            </View>

            <Text style={[styles.resetTitle, { color: colors.destructive }]}>
              {t.rebootTitle}
            </Text>
            <Text style={[styles.resetSub, { color: colors.secondary }]}>
              {t.rebootSub}
            </Text>

            {phase === "idle" && (
              <View style={[styles.warningBox, { backgroundColor: colors.destructive + "10", borderColor: colors.destructive + "30" }]}>
                <SymIcon name="warning-outline" size={14} color={colors.destructive} />
                <Text style={[styles.warningText, { color: colors.destructive + "cc" }]}>
                  {t.rebootWarning}
                </Text>
              </View>
            )}

            {phase === "running" && (
              <View style={[styles.progressRow, { borderColor: colors.border }]}>
                <Text style={[styles.progressText, { color: colors.mutedForeground }]}>
                  {t.rebootProgress}
                </Text>
                <ProgressDots color={colors.destructive} />
              </View>
            )}

            {phase === "done" && (
              <Text style={[styles.doneText, { color: colors.accent }]}>
                ✓ {t.rebootDone}
              </Text>
            )}

            {phase === "idle" && (
              <View style={styles.resetBtns}>
                <Pressable
                  onPress={handleClose}
                  style={[styles.cancelBtn, { borderColor: colors.border }]}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>
                    {t.rebootCancel}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleReset}
                  style={[styles.confirmBtn, { backgroundColor: colors.destructive + "18", borderColor: colors.destructive + "50" }]}
                >
                  <SymIcon name="refresh-circle-outline" size={16} color={colors.destructive} />
                  <Text style={[styles.confirmBtnText, { color: colors.destructive }]}>
                    {t.rebootConfirm}
                  </Text>
                </Pressable>
              </View>
            )}

            <View style={[styles.resetFooter, { borderColor: colors.border }]}>
              <Text style={[styles.resetFooterText, { color: colors.mutedForeground }]}>
                Fée Belette Reboot System · v1.0 · Blacklace Island
              </Text>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function DnaHelix({ color }: { color: string }) {
  return (
    <View style={[styles.dnaContainer, { borderColor: color + "50", backgroundColor: color + "10" }]}>
      <LinearGradient
        colors={[color + "30", color + "10"]}
        style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
      />
      <Text style={[styles.dnaText, { color }]}>⌬</Text>
      <View style={[styles.dnaOrbit, { borderColor: color + "40" }]} />
      <View style={[styles.dnaOrbit2, { borderColor: color + "25" }]} />
    </View>
  );
}

function ProgressDots({ color }: { color: string }) {
  const d1 = useSharedValue(0.3);
  const d2 = useSharedValue(0.3);
  const d3 = useSharedValue(0.3);

  useEffect(() => {
    d1.value = withRepeat(withSequence(withTiming(1, { duration: 400 }), withTiming(0.3, { duration: 400 })), -1);
    d2.value = withDelay(200, withRepeat(withSequence(withTiming(1, { duration: 400 }), withTiming(0.3, { duration: 400 })), -1));
    d3.value = withDelay(400, withRepeat(withSequence(withTiming(1, { duration: 400 }), withTiming(0.3, { duration: 400 })), -1));
  }, []);

  const s1 = useAnimatedStyle(() => ({ opacity: d1.value }));
  const s2 = useAnimatedStyle(() => ({ opacity: d2.value }));
  const s3 = useAnimatedStyle(() => ({ opacity: d3.value }));

  return (
    <View style={styles.dots}>
      {[s1, s2, s3].map((style, i) => (
        <Animated.View key={i} style={[styles.dot, { backgroundColor: color }, style]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 8,
  },
  orbArea: {
    alignItems: "center",
    justifyContent: "center",
    width: 120,
    height: 120,
  },
  labelArea: {
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  labelSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  infoHint: {
    borderRadius: 6,
    borderWidth: 1,
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  glowRing: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
    top: 3,
  },
  glowRing2: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1,
    top: -7,
  },
  ripple: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    top: 3,
  },
  orbWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  orbBg: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  wingLeft: {
    position: "absolute",
    left: 2,
    top: 18,
  },
  wingRight: {
    position: "absolute",
    right: 2,
    top: 18,
  },
  wing: {
    width: 20,
    height: 18,
    borderTopWidth: 2,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderBottomColor: "transparent",
  },
  centerIcon: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  orbInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    overflow: "hidden",
  },
  eyeOverlay: {
    position: "absolute",
  },
  sparkles: {
    position: "absolute",
    width: 52,
    height: 52,
    top: 16,
    left: 16,
  },
  sparkDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  labelTop: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 3,
  },
  labelSub: {
    fontSize: 10,
    letterSpacing: 1.5,
    marginTop: -2,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "#000000a8",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  resetCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    gap: 12,
    width: "100%",
    maxWidth: 360,
    overflow: "hidden",
  },
  resetIconRow: {
    alignItems: "center",
    marginBottom: 4,
  },
  dnaContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  dnaOrbit: {
    position: "absolute",
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  dnaOrbit2: {
    position: "absolute",
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  dnaText: {
    fontSize: 22,
    fontWeight: "300",
  },
  doneCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  resetTitle: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 3,
    textAlign: "center",
  },
  resetSub: {
    fontSize: 12,
    textAlign: "center",
    letterSpacing: 0.5,
    lineHeight: 18,
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  warningText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 17,
    letterSpacing: 0.2,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  progressText: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
  dots: {
    flexDirection: "row",
    gap: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  doneText: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 1,
    textAlign: "center",
  },
  resetBtns: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: "500",
  },
  confirmBtn: {
    flex: 2,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  confirmBtnText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  resetFooter: {
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 4,
  },
  resetFooterText: {
    fontSize: 10,
    textAlign: "center",
    letterSpacing: 0.5,
  },
});
