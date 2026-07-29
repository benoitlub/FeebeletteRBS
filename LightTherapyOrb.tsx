import React, { useEffect } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  withTiming,
  Easing,
  useAnimatedStyle,
  interpolate,
} from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";
import { SessionRecord } from "@/types";

const { width } = Dimensions.get("window");
const DAYS = ["L", "M", "M", "J", "V", "S", "D"];

function getWeekDays(): Date[] {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

interface Props {
  records: SessionRecord[];
}

function Bar({ count, max, dayLabel, isToday, color }: {
  count: number;
  max: number;
  dayLabel: string;
  isToday: boolean;
  color: string;
}) {
  const heightAnim = useSharedValue(0);
  const targetHeight = max === 0 ? 0 : (count / max) * 72;

  useEffect(() => {
    heightAnim.value = withTiming(targetHeight, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [targetHeight]);

  const barStyle = useAnimatedStyle(() => ({
    height: heightAnim.value,
    opacity: interpolate(heightAnim.value, [0, targetHeight || 1], [0, 1]),
  }));

  return (
    <View style={styles.barWrapper}>
      <View style={styles.barTrack}>
        <Animated.View
          style={[
            styles.bar,
            { backgroundColor: count > 0 ? color : "transparent" },
            barStyle,
          ]}
        />
      </View>
      <Text style={[
        styles.barDay,
        { color: isToday ? color : "#ffffff40" },
        isToday && styles.barDayToday,
      ]}>
        {dayLabel}
      </Text>
      {count > 0 && (
        <Text style={[styles.barCount, { color: color + "cc" }]}>{count}</Text>
      )}
    </View>
  );
}

export function ActivityChart({ records }: Props) {
  const colors = useColors();
  const weekDays = getWeekDays();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const counts = weekDays.map((day) => {
    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);
    return records.filter(
      (r) => r.completedAt >= day.getTime() && r.completedAt < nextDay.getTime()
    ).length;
  });

  const maxCount = Math.max(...counts, 1);
  const totalThisWeek = counts.reduce((a, b) => a + b, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Activité hebdomadaire</Text>
        <Text style={[styles.subtitle, { color: colors.accent }]}>
          {totalThisWeek} séance{totalThisWeek !== 1 ? "s" : ""} cette semaine
        </Text>
      </View>
      <View style={styles.chart}>
        {counts.map((count, i) => {
          const isToday = weekDays[i]!.getTime() === today.getTime();
          return (
            <Bar
              key={i}
              count={count}
              max={maxCount}
              dayLabel={DAYS[i]!}
              isToday={isToday}
              color={colors.primary}
            />
          );
        })}
      </View>
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
  header: {
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    letterSpacing: 0.3,
  },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 100,
    gap: 6,
  },
  barWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
  },
  barTrack: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
    borderRadius: 4,
  },
  bar: {
    width: "100%",
    borderRadius: 5,
    minHeight: 3,
  },
  barDay: {
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  barDayToday: {
    fontWeight: "700",
  },
  barCount: {
    fontSize: 9,
    position: "absolute",
    top: -14,
  },
});
