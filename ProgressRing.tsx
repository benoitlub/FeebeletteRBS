import { SymIcon } from "@/components/SymIcon";
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Linking,
  Platform,
  Dimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  withTiming,
  withRepeat,
  Easing,
  useAnimatedStyle,
  interpolate,
} from "react-native-reanimated";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { useSubscription, MAX_FREE } from "@/context/SubscriptionContext";
import { useLanguage } from "@/context/LanguageContext";

const { width } = Dimensions.get("window");

const FAIRY_IMG = require("../assets/images/fairy.png");
const FAIRY_SIZE = Math.round(width * 0.52);

const PAYPAL_URL = "https://www.paypal.com/billing/subscriptions/create?plan_id=BLACKLACE_FBRS_690";

export default function PaywallScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { freeSessionsLeft, activatePremium, isPremium } = useSubscription();
  const [loading, setLoading] = useState(false);

  const FEATURES = [
    { icon: "infinite-outline", label: t.paywallUnlimited, premium: true },
    { icon: "headset-outline", label: t.paywallAllWaves, premium: true },
    { icon: "analytics-outline", label: t.paywallHistory, premium: true },
    { icon: "hardware-chip-outline", label: t.paywallSensors, premium: true },
    { icon: "flashlight-outline", label: t.paywallFlash, premium: true },
    { icon: "leaf-outline", label: t.paywallFreeLabel, premium: false },
  ];
  const glow = useSharedValue(0);
  const shimmer = useSharedValue(0);
  const float = useSharedValue(0);

  useEffect(() => {
    glow.value = withRepeat(
      withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.linear }),
      -1,
      false
    );
    float.value = withRepeat(
      withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.3, 0.8]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [0.95, 1.05]) }],
  }));

  const fairyFloatStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(float.value, [0, 1], [-6, 6]) },
    ],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shimmer.value, [0, 1], [-width, width]) }],
  }));

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const handlePayPal = async () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLoading(true);
    try {
      const can = await Linking.canOpenURL(PAYPAL_URL);
      if (can) {
        await Linking.openURL(PAYPAL_URL);
      }
    } catch (_) {}
    setLoading(false);
  };

  const handleFreeContinue = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["#120030", "#080010", colors.background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.6 }}
      />

      <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
        {/* Top row: close button + label */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={styles.closeBtn}
          >
            <SymIcon name="close" size={22} color={colors.mutedForeground} />
          </Pressable>
          <Text style={[styles.headerLabel, { color: colors.mutedForeground }]}>
            {t.paywallSub}
          </Text>
        </View>

        {/* Fairy centered in header */}
        <View style={styles.fairyContainer}>
          <Animated.View style={[styles.fairyGlow, glowStyle]}>
            <LinearGradient
              colors={["#7c4dff60", "#00e5ff30"]}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          <Animated.Image
            source={FAIRY_IMG}
            style={[styles.fairyImg, fairyFloatStyle]}
            resizeMode="contain"
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottomPadding + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleBlock}>
          <Text style={[styles.eyebrow, { color: colors.secondary }]}>
            FÉE BELETTE PREMIUM
          </Text>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {t.paywallTitle}
          </Text>
          <Text style={[styles.sessionCounter, { color: colors.mutedForeground }]}>
            {freeSessionsLeft} {t.paywallFree}
          </Text>
        </View>

        <View style={styles.freeBar}>
          {[...Array(MAX_FREE)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.freeBarDot,
                {
                  backgroundColor:
                    i < MAX_FREE - freeSessionsLeft
                      ? colors.secondary + "60"
                      : colors.secondary,
                },
              ]}
            />
          ))}
          <Text style={[styles.freeBarLabel, { color: colors.mutedForeground }]}>
            {MAX_FREE - freeSessionsLeft} / {MAX_FREE}
          </Text>
        </View>

        <View style={[styles.priceCard, { borderColor: colors.secondary + "50" }]}>
          <LinearGradient
            colors={["#7c4dff15", "#00e5ff08"]}
            style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
          />
          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: colors.foreground }]}>6,90€</Text>
            <View>
              <Text style={[styles.pricePeriod, { color: colors.mutedForeground }]}>/ mois</Text>
              <Text style={[styles.priceSub, { color: colors.mutedForeground }]}>
                Sans engagement
              </Text>
            </View>
          </View>

          {FEATURES.map((f) => (
            <View key={f.label} style={styles.featureRow}>
              <View
                style={[
                  styles.featureIcon,
                  {
                    backgroundColor: f.premium
                      ? colors.secondary + "15"
                      : colors.muted,
                  },
                ]}
              >
                <SymIcon
                  name={f.icon as any}
                  size={14}
                  color={f.premium ? colors.secondary : colors.mutedForeground}
                />
              </View>
              <Text
                style={[
                  styles.featureLabel,
                  { color: f.premium ? colors.foreground : colors.mutedForeground },
                ]}
              >
                {f.label}
              </Text>
              {f.premium && (
                <SymIcon name="checkmark" size={14} color={colors.accent} />
              )}
            </View>
          ))}
        </View>

        <Pressable
          onPress={handlePayPal}
          disabled={loading}
          style={({ pressed }) => [
            styles.paypalBtn,
            pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
          ]}
        >
          <View style={styles.paypalInner}>
            <View style={styles.shimmerContainer}>
              <Animated.View style={[styles.shimmer, shimmerStyle]}>
                <LinearGradient
                  colors={["transparent", "#ffffff20", "transparent"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            </View>
            <Text style={styles.paypalLogo}>
              Pay<Text style={{ fontStyle: "italic", color: "#009cde" }}>Pal</Text>
            </Text>
            <Text style={styles.paypalLabel}>
              {loading ? "…" : t.paywallCta}
            </Text>
          </View>
        </Pressable>

        <Text style={[styles.legal, { color: colors.mutedForeground }]}>
          {t.paywallLegal}
        </Text>

        {freeSessionsLeft > 0 && (
          <Pressable onPress={handleFreeContinue} style={styles.freeBtn}>
            <Text style={[styles.freeBtnText, { color: colors.mutedForeground }]}>
              {freeSessionsLeft} {t.paywallFree}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: "column",
    alignItems: "stretch",
    paddingHorizontal: 20,
    paddingBottom: 0,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 4,
  },
  closeBtn: {
    padding: 6,
    marginRight: 12,
  },
  headerLabel: {
    fontSize: 13,
    letterSpacing: 1,
  },
  fairyContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: FAIRY_SIZE * 0.75,
    marginTop: -8,
  },
  fairyGlow: {
    position: "absolute",
    width: FAIRY_SIZE * 0.8,
    height: FAIRY_SIZE * 0.8,
    borderRadius: FAIRY_SIZE * 0.4,
    overflow: "hidden",
  },
  fairyImg: {
    width: FAIRY_SIZE,
    height: FAIRY_SIZE,
  },
  content: {
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 20,
  },
  titleBlock: {
    alignItems: "center",
    gap: 8,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: 1,
    textAlign: "center",
    lineHeight: 40,
  },
  sessionCounter: {
    fontSize: 13,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  freeBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  freeBarDot: {
    width: 28,
    height: 8,
    borderRadius: 4,
  },
  freeBarLabel: {
    fontSize: 11,
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  priceCard: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 24,
    padding: 24,
    gap: 16,
    overflow: "hidden",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 12,
    marginBottom: 8,
  },
  price: {
    fontSize: 48,
    fontWeight: "700",
    letterSpacing: -1,
  },
  pricePeriod: {
    fontSize: 16,
    letterSpacing: 0.3,
  },
  priceSub: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  featureLabel: {
    flex: 1,
    fontSize: 13,
    letterSpacing: 0.3,
  },
  paypalBtn: {
    width: "100%",
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#0070ba",
  },
  paypalInner: {
    paddingVertical: 18,
    alignItems: "center",
    gap: 4,
    overflow: "hidden",
  },
  shimmerContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
  },
  paypalLogo: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.5,
  },
  paypalLabel: {
    fontSize: 13,
    color: "#ffffffcc",
    letterSpacing: 0.5,
  },
  legal: {
    fontSize: 11,
    textAlign: "center",
    letterSpacing: 0.3,
    lineHeight: 16,
  },
  freeBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  freeBtnText: {
    fontSize: 13,
    letterSpacing: 0.5,
  },
});
