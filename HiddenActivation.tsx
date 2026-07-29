import React, { useEffect } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  withTiming,
  withDelay,
  Easing,
  useAnimatedStyle,
  interpolate,
} from "react-native-reanimated";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColors } from "@/hooks/useColors";
import { SessionRecord } from "@/types";

const { width } = Dimensions.get("window");
const MAX_ITEMS = 10;

function RatingDot({ rating, index, color }: { rating: number; index: number; color: string }) {
  const scale = useSharedValue(0);
  useEffect(() => {
    scale.value = withDelay(
      index * 80,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.back(2)) })
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <Animated.View style={[styles.dot, { backgroundColor: color + (rating > 0 ? "ff" : "20") }, style]} />
  );
}

interface Props {
  records: SessionRecord[];
}

export function RatingChart({ records }: Props) {
  const colors = useColors();
  const recent = [...records].slice(0, MAX_ITEMS).reverse();
  const avgRating =
    recent.length > 0
      ? recent.reduce((a, r) => a + r.rating, 0) / recent.length
      : 0;

  const ratingColor = (r: number) =>
    r >= 4 ? colors.accent : r >= 3 ? colors.amber : colors.secondary;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Tendance qualité
          </Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            {recent.length} dernière{recent.length !== 1 ? "s" : ""} séance{recent.length !== 1 ? "s" : ""}
          </Text>
        </View>
        <View style={styles.avgBlock}>
          <Text style={[styles.avgNum, { color: colors.accent }]}>
            {avgRating > 0 ? avgRating.toFixed(1) : "—"}
          </Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Ionicons
                key={i}
                name={i <= Math.round(avgRating) ? "star" : "star-outline"}
                size={10}
                color={colors.amber}
              />
            ))}
          </View>
        </View>
      </View>

      {recent.length === 0 ? (
        <Text style={[styles.empty, { color: colors.mutedForeground }]}>
          Aucune séance enregistrée
        </Text>
      ) : (
        <View style={styles.timeline}>
          {recent.map((r, i) => {
            const dotColor = ratingColor(r.rating);
            const date = new Date(r.completedAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
            });
            return (
              <View key={r.id} style={styles.item}>
                <View style={styles.dotsCol}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <RatingDot
                      key={star}
                      rating={r.rating >= star ? 1 : 0}
                      index={i * 5 + star}
                      color={dotColor}
                    />
                  ))}
                </View>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={1}>
                    {r.sessionName}
                  </Text>
                  <Text style={[styles.itemDate, { color: colors.mutedForeground }]}>
                    {date}
                  </Text>
                </View>
                <View style={styles.durationBadge}>
                  <Text style={[styles.durationText, { color: colors.mutedForeground }]}>
                    {Math.floor(r.duration / 60)}m
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  sub: {
    fontSize: 11,
    letterSpacing: 0.3,
    marginTop: 2,
  },
  avgBlock: {
    alignItems: "center",
    gap: 2,
  },
  avgNum: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  starsRow: {
    flexDirection: "row",
    gap: 1,
  },
  empty: {
    fontSize: 12,
    textAlign: "center",
    paddingVertical: 16,
    letterSpacing: 0.3,
  },
  timeline: {
    gap: 12,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dotsCol: {
    flexDirection: "row",
    gap: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  itemInfo: {
    flex: 1,
    gap: 1,
  },
  itemName: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  itemDate: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
  durationBadge: {
    minWidth: 32,
    alignItems: "flex-end",
  },
  durationText: {
    fontSize: 11,
    letterSpacing: 0.3,
  },
});
