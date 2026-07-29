import { SymIcon } from "@/components/SymIcon";
import React, { useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { USER_STATES, UserState } from "@/data/sessions";

interface Props {
  selectedId: string | null;
  onSelect: (state: UserState) => void;
}

function StateButton({
  state,
  selected,
  onPress,
  index,
}: {
  state: UserState;
  selected: boolean;
  onPress: () => void;
  index: number;
}) {
  const appear = useSharedValue(0);
  const glow   = useSharedValue(0);

  useEffect(() => {
    appear.value = withDelay(index * 55, withTiming(1, { duration: 360, easing: Easing.out(Easing.quad) }));
  }, []);

  useEffect(() => {
    if (selected) {
      glow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 700, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.45, { duration: 700, easing: Easing.inOut(Easing.sin) })
        ),
        -1
      );
    } else {
      glow.value = withTiming(0, { duration: 220 });
    }
  }, [selected]);

  const appearStyle = useAnimatedStyle(() => ({
    opacity: appear.value,
    transform: [{ translateY: interpolate(appear.value, [0, 1], [12, 0]) }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  return (
    <Animated.View style={[styles.btnWrap, appearStyle]}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.btn,
          {
            borderColor: selected ? state.color + "90" : state.color + "28",
            backgroundColor: selected ? state.color + "14" : "transparent",
          },
          pressed && { opacity: 0.78, transform: [{ scale: 0.97 }] },
        ]}
      >
        {selected && (
          <>
            <Animated.View
              style={[StyleSheet.absoluteFill, styles.glowRing, { borderColor: state.color }, glowStyle]}
            />
            <LinearGradient
              colors={[state.color + "10", "transparent"] as [string, string]}
              style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </>
        )}

        <View style={[styles.iconCircle, {
          backgroundColor: state.color + (selected ? "20" : "12"),
          borderColor: state.color + (selected ? "60" : "30"),
        }]}>
          <SymIcon name={state.icon as any} size={14} color={state.color} />
        </View>

        <Text style={[styles.btnLabel, {
          color: selected ? state.color : state.color + "cc",
          fontWeight: selected ? "700" : "500",
        }]}>
          {state.label}
        </Text>

        {selected && (
          <View style={[styles.checkDot, { backgroundColor: state.color }]} />
        )}
      </Pressable>
    </Animated.View>
  );
}

export function StateSelector({ selectedId, onSelect }: Props) {
  return (
    <View style={styles.grid}>
      {USER_STATES.map((state, i) => (
        <StateButton
          key={state.id}
          state={state}
          selected={selectedId === state.id}
          onPress={() => onSelect(state)}
          index={i}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 20,
  },
  btnWrap: {
    width: "47.5%",
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 11,
    paddingHorizontal: 10,
    overflow: "hidden",
    position: "relative",
  },
  glowRing: {
    borderRadius: 14,
    borderWidth: 1,
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  btnLabel: {
    fontSize: 12,
    letterSpacing: 0.2,
    lineHeight: 16,
    flex: 1,
  },
  checkDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    flexShrink: 0,
  },
});
