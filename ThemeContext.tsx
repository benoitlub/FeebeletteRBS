import { SymIcon } from "@/components/SymIcon";
import React, { useEffect } from "react";
import { ScrollView, View, Text, StyleSheet, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { SESSIONS } from "@/data/sessions";

const SESSION_ICONS: Record<string, string> = {
  respiration: "water-outline",
  reboot:      "refresh-circle-outline",
  nid:         "moon-outline",
  etincelle:   "bulb-outline",
  cristal:     "diamond-outline",
};

const SESSION_ACCENT: Record<string, string> = {
  respiration: "#7ca8ff",
  reboot:      "#00e5ff",
  nid:         "#b07cff",
  etincelle:   "#ffb066",
  cristal:     "#9c80ff",
};

function HoloShimmer({ color, delay }: { color: string; delay: number }) {
  const x = useSharedValue(-70);
  useEffect(() => {
    const t = setTimeout(() => {
      x.value = withRepeat(
        withSequence(
          withTiming(230, { duration: 900, easing: Easing.out(Easing.quad) }),
          withTiming(230, { duration: 4200 }),
          withTiming(-70, { duration: 0 }),
        ),
        -1, false,
      );
    }, delay);
    return () => clearTimeout(t);
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <LinearGradient
        colors={["transparent", color + "40", color + "15", "transparent"] as [string, string, string, string]}
        style={{ position: "absolute", width: 55, top: 0, bottom: 0, left: -27 }}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
      />
    </Animated.View>
  );
}

function FloatingCard({ index, style, children }: { index: number; style: object; children: React.ReactNode }) {
  const floatY = useSharedValue(index % 2 === 0 ? -2 : 2);
  useEffect(() => {
    const dur = 1800 + index * 290;
    const t = setTimeout(() => {
      floatY.value = withRepeat(
        withTiming(index % 2 === 0 ? 2 : -2, { duration: dur, easing: Easing.inOut(Easing.sin) }),
        -1, true,
      );
    }, index * 160);
    return () => clearTimeout(t);
  }, []);
  const floatStyle = useAnimatedStyle(() => ({ transform: [{ translateY: floatY.value }] }));
  return <Animated.View style={[style, floatStyle]}>{children}</Animated.View>;
}

function RecRing({ color }: { color: string }) {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, []);
  const s = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.4, 1]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.88, 1.12]) }],
  }));
  return <Animated.View style={[{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: color }, s]} />;
}

interface Props {
  recommendedId: string;
  onStart: (id: string) => void;
}

export function ModeCards({ recommendedId, onStart }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {SESSIONS.map((session, index) => {
        const isRec  = session.id === recommendedId;
        const accent = SESSION_ACCENT[session.id] ?? "#7ca8ff";
        const icon   = SESSION_ICONS[session.id]  ?? "sparkles-outline";
        const bg0    = session.colors[0] ?? "#080020";
        const bg1    = session.colors[1] ?? "#160048";

        return (
          <FloatingCard
            key={session.id}
            index={index}
            style={[styles.card, { borderColor: isRec ? accent + "80" : accent + "20" }]}
          >
            <Pressable
              onPress={() => onStart(session.id)}
              style={({ pressed }) => [StyleSheet.absoluteFill, pressed && { opacity: 0.80 }]}
            >
              <LinearGradient
                colors={[bg1 + "e8", bg0 + "f5"] as [string, string]}
                style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
              />

              <HoloShimmer color={accent} delay={index * 550} />

              {isRec && (
                <View style={[StyleSheet.absoluteFill, { borderRadius: 20, borderWidth: 1.5, borderColor: accent + "65" }]} />
              )}

              <View style={[styles.cornerDots]}>
                <View style={[styles.dot, { backgroundColor: accent + "70" }]} />
                <View style={[styles.dot, { backgroundColor: accent + "35" }]} />
              </View>

              <View style={styles.body}>
                <View style={styles.topRow}>
                  <View style={[styles.iconWrap, { backgroundColor: accent + "22", borderColor: accent + "50" }]}>
                    <SymIcon name={icon as any} size={14} color={accent} />
                  </View>
                  {isRec && (
                    <View style={styles.recRow}>
                      <RecRing color={accent} />
                    </View>
                  )}
                </View>

                <Text style={styles.name} numberOfLines={2}>{session.name}</Text>
                <Text style={styles.tagline} numberOfLines={2}>{session.tagline}</Text>

                <View style={styles.meta}>
                  <View style={[styles.durBadge, { borderColor: accent + "50" }]}>
                    <Text style={[styles.dur, { color: accent }]}>{session.durationLabel}</Text>
                  </View>
                  <Text style={styles.sub}>{session.subtitle.split(",")[0]}</Text>
                </View>
              </View>
            </Pressable>
          </FloatingCard>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingLeft: 20, paddingRight: 10, paddingVertical: 8, gap: 14 },
  card: { width: 170, height: 172, borderRadius: 20, borderWidth: 1, overflow: "hidden" },
  body: { flex: 1, padding: 12, justifyContent: "space-between" },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  recRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  iconWrap: { width: 28, height: 28, borderRadius: 9, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  cornerDots: { position: "absolute", top: 8, right: 8, gap: 2, alignItems: "flex-end" },
  dot: { width: 3, height: 3, borderRadius: 1.5 },
  name: { fontSize: 13, fontWeight: "700", color: "#fffffff0", letterSpacing: 0.3, lineHeight: 17, flex: 1, marginTop: 4 },
  tagline: { fontSize: 9, color: "#ffffff55", letterSpacing: 0.3, lineHeight: 13 },
  meta: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 6 },
  durBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  dur: { fontSize: 9, fontWeight: "700", letterSpacing: 0.5 },
  sub: { fontSize: 9, color: "#ffffff35", letterSpacing: 0.2 },
});
