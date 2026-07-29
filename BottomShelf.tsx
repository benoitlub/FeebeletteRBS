import { SymIcon } from "@/components/SymIcon";
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  UIManager,
} from "react-native";
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { useSubscription } from "@/context/SubscriptionContext";
import { useLanguage } from "@/context/LanguageContext";
import { SESSIONS } from "@/data/sessions";
import { Session } from "@/types";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const WAVE_META: Record<string, { label: string; color: string; icon: string }> = {
  delta: { label: "DELTA", color: "#7c4dff", icon: "moon-outline" },
  theta: { label: "THÊTA", color: "#9c6dff", icon: "cellular-outline" },
  alpha: { label: "ALPHA", color: "#00e5ff", icon: "pulse-outline" },
};

const DETAIL_H = 92;

interface Props {
  onStartSession: (sessionId: string) => void;
}

function SessionRow({
  session,
  onStart,
}: {
  session: Session;
  onStart: () => void;
}) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const wave = WAVE_META[session.waveType] ?? WAVE_META.alpha!;
  const heightAnim = useSharedValue(0);
  const chevronAnim = useSharedValue(0);

  const toggle = useCallback(() => {
    const next = !open;
    setOpen(next);
    heightAnim.value = withTiming(next ? DETAIL_H : 0, {
      duration: 320,
      easing: Easing.out(Easing.cubic),
    });
    chevronAnim.value = withTiming(next ? 1 : 0, { duration: 250 });
  }, [open]);

  const detailStyle = useAnimatedStyle(() => ({
    height: heightAnim.value,
    overflow: "hidden",
    opacity: interpolate(heightAnim.value, [0, DETAIL_H * 0.4, DETAIL_H], [0, 0.7, 1]),
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(chevronAnim.value, [0, 1], [0, 180])}deg` }],
  }));

  return (
    <View style={[styles.rowWrapper, { borderColor: open ? wave.color + "40" : colors.border }]}>
      {/* Pill header */}
      <Pressable
        onPress={toggle}
        style={({ pressed }) => [
          styles.pill,
          { backgroundColor: colors.card },
          pressed && { opacity: 0.88 },
        ]}
      >
        <LinearGradient
          colors={open ? [wave.color + "12", "transparent"] : ["transparent", "transparent"]}
          style={[StyleSheet.absoluteFill, { borderRadius: 12 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
        <View style={[styles.waveDot, { backgroundColor: wave.color }]} />
        <View style={styles.pillCenter}>
          <Text style={[styles.pillName, { color: colors.foreground }]} numberOfLines={1}>
            {session.name}
          </Text>
          <Text style={[styles.pillTagline, { color: colors.mutedForeground }]} numberOfLines={1}>
            {session.tagline}
          </Text>
        </View>
        <View style={styles.pillRight}>
          <View style={[styles.durationBadge, { backgroundColor: wave.color + "18", borderColor: wave.color + "35" }]}>
            <Text style={[styles.durationText, { color: wave.color }]}>{session.durationLabel}</Text>
          </View>
          <Animated.View style={chevronStyle}>
            <SymIcon name="chevron-down" size={14} color={colors.mutedForeground} />
          </Animated.View>
        </View>
      </Pressable>

      {/* Expandable detail */}
      <Animated.View style={detailStyle}>
        <View style={[styles.detail, { backgroundColor: wave.color + "08" }]}>
          <Text style={[styles.detailDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
            {session.description}
          </Text>
          <View style={styles.detailMeta}>
            <View style={styles.metaGroup}>
              <View style={[styles.waveBadge, { backgroundColor: wave.color + "18", borderColor: wave.color + "35" }]}>
                <SymIcon name={wave.icon as any} size={9} color={wave.color} />
                <Text style={[styles.waveLabel, { color: wave.color }]}>{wave.label}</Text>
              </View>
              <Text style={[styles.metaHz, { color: colors.mutedForeground }]}>
                {session.carrierFreq} + {session.waveHz} Hz
              </Text>
              {session.flashEnabled && (
                <View style={[styles.flashBadge, { borderColor: colors.secondary + "40" }]}>
                  <SymIcon name="flashlight-outline" size={9} color={colors.secondary} />
                  <Text style={[styles.flashText, { color: colors.secondary }]}>{session.flashHz} Hz</Text>
                </View>
              )}
            </View>
            <Pressable
              onPress={onStart}
              style={[styles.startBtn, { backgroundColor: wave.color, borderColor: wave.color }]}
            >
              <SymIcon name="play" size={12} color="#000" />
              <Text style={styles.startBtnText}>GO</Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

export function SessionsGrid({ onStartSession }: Props) {
  const colors = useColors();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const heightAnim = useSharedValue(0);
  const chevronAnim = useSharedValue(0);

  const TOTAL_H = SESSIONS.length * (52 + 6 + DETAIL_H + 4) + 20;

  const toggle = useCallback(() => {
    const next = !open;
    setOpen(next);
    heightAnim.value = withTiming(next ? TOTAL_H : 0, {
      duration: 400,
      easing: Easing.out(Easing.cubic),
    });
    chevronAnim.value = withTiming(next ? 1 : 0, { duration: 280 });
  }, [open, TOTAL_H]);

  const containerStyle = useAnimatedStyle(() => ({
    height: heightAnim.value,
    overflow: "hidden",
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(chevronAnim.value, [0, 1], [0, 180])}deg` }],
  }));

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={toggle}
        style={({ pressed }) => [
          styles.header,
          {
            backgroundColor: colors.card,
            borderColor: open ? colors.primary + "40" : colors.border,
          },
          pressed && { opacity: 0.85 },
        ]}
      >
        <LinearGradient
          colors={open ? [colors.primary + "08", "transparent"] : ["transparent", "transparent"]}
          style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
        <View style={styles.headerLeft}>
          <View style={[styles.headerDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>{t.sessions}</Text>
          <View style={[styles.countBadge, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "30" }]}>
            <Text style={[styles.countText, { color: colors.primary }]}>{SESSIONS.length}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {open ? t.collapse : t.viewAll}
          </Text>
          <Animated.View style={chevronStyle}>
            <SymIcon name="chevron-down" size={15} color={colors.mutedForeground} />
          </Animated.View>
        </View>
      </Pressable>

      <Animated.View style={containerStyle}>
        <View style={styles.list}>
          {SESSIONS.map((session) => (
            <SessionRow
              key={session.id}
              session={session}
              onStart={() => onStartSession(session.id)}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: "100%", marginTop: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 7 },
  headerDot: { width: 5, height: 5, borderRadius: 2.5 },
  headerTitle: { fontSize: 11, fontWeight: "600", letterSpacing: 2 },
  countBadge: { borderRadius: 7, borderWidth: 1, paddingHorizontal: 5, paddingVertical: 1 },
  countText: { fontSize: 10, fontWeight: "700" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 5 },
  headerSub: { fontSize: 11, letterSpacing: 0.4 },
  list: { paddingTop: 8, gap: 6 },
  rowWrapper: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
    overflow: "hidden",
  },
  waveDot: { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  pillCenter: { flex: 1, gap: 1 },
  pillName: { fontSize: 13, fontWeight: "600", letterSpacing: 0.2 },
  pillTagline: { fontSize: 10, letterSpacing: 0.3 },
  pillRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  durationBadge: {
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 6, borderWidth: 1,
  },
  durationText: { fontSize: 9, fontWeight: "600", letterSpacing: 0.3 },
  detail: {
    paddingHorizontal: 12, paddingVertical: 10, gap: 8,
  },
  detailDesc: { fontSize: 11, lineHeight: 16, letterSpacing: 0.2 },
  detailMeta: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  metaGroup: { flexDirection: "row", alignItems: "center", gap: 6 },
  waveBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    paddingHorizontal: 5, paddingVertical: 2,
    borderRadius: 5, borderWidth: 1,
  },
  waveLabel: { fontSize: 8, fontWeight: "700", letterSpacing: 0.8 },
  metaHz: { fontSize: 9, letterSpacing: 0.3 },
  flashBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    paddingHorizontal: 4, paddingVertical: 2,
    borderRadius: 4, borderWidth: 1,
  },
  flashText: { fontSize: 8, fontWeight: "600" },
  startBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, borderWidth: 1,
  },
  startBtnText: { fontSize: 10, fontWeight: "800", color: "#000", letterSpacing: 1 },
});
