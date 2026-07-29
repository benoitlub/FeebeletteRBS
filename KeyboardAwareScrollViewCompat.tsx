import { SymIcon } from "@/components/SymIcon";
import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { getSession } from "@/data/sessions";
import { useLanguage } from "@/context/LanguageContext";

// ── Brand assets ───────────────────────────────────────────────────────────────
const FAIRY_IMG = require("../assets/images/fairy.png");
const BUBBLE_IMGS: Record<string, number> = {
  respiration: require("../assets/images/bubble_lotus.png") as number,
  nid:         require("../assets/images/bubble_moon.png") as number,
  cristal:     require("../assets/images/bubble_star.png") as number,
  reboot:      require("../assets/images/bubble_wave.png") as number,
  etincelle:   require("../assets/images/bubble_feather.png") as number,
};

export default function JournalScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { id, elapsed } = useLocalSearchParams<{ id: string; elapsed?: string }>();
  const { addRecord } = useApp();

  const session = getSession(id ?? "ancrage");

  const [rating, setRating] = useState(0);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const handleRate = (val: number) => {
    setRating(val);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSave = async () => {
    if (!session) { router.replace("/"); return; }
    const hour = new Date().getHours();
    const timeOfDay =
      hour >= 5 && hour < 12 ? "morning"
      : hour >= 12 && hour < 17 ? "afternoon"
      : hour >= 17 && hour < 21 ? "evening"
      : "night";

    const actualDuration = elapsed ? Math.max(10, parseInt(elapsed)) : session.duration;
    await addRecord({
      id: `${Date.now().toString()}-${Math.random().toString(36).substr(2, 9)}`,
      sessionId: session.id,
      sessionName: session.name,
      completedAt: Date.now(),
      duration: actualDuration,
      rating,
      note,
      timeOfDay,
      intensity: 0.7,
    });

    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaved(true);
    setTimeout(() => router.replace("/"), 1200);
  };

  const waveColor =
    session?.waveType === "delta" ? colors.secondary
    : session?.waveType === "theta" ? "#9c6dff"
    : colors.primary;

  const ratingLabels = [t.ratingHard, t.ratingOk, t.ratingGood, t.ratingVeryGood, t.ratingExcellent];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[session?.colors[0] + "40" ?? "#08001e40", colors.background] as [string, string]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.6 }}
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topPadding + 20, paddingBottom: bottomPadding + 40 }]}
        keyboardShouldPersistTaps="handled"
        style={{ backgroundColor: "transparent" }}
      >
        {/* ── En-tête fée + bulle de séance ── */}
        <View style={styles.heroHeader}>
          {/* Fée belette silhouette */}
          <Image
            source={FAIRY_IMG}
            style={styles.headerFairy}
            resizeMode="contain"
          />
          {/* Bulle de séance en médaillon */}
          {session && BUBBLE_IMGS[session.id] && (
            <View style={[styles.bubbleMedallion, { borderColor: waveColor + "40", backgroundColor: waveColor + "10" }]}>
              <Image
                source={BUBBLE_IMGS[session.id]}
                style={styles.bubbleMedallionImg}
                resizeMode="contain"
              />
            </View>
          )}
          <View style={styles.headerText}>
            {/* Symbole felbeletien */}
            <Text style={[styles.felbeletienMark, { color: waveColor + "70" }]}>
              {t.journalBrand}
            </Text>
            <Text style={[styles.completedLabel, { color: colors.mutedForeground }]}>
              {t.journalSessionDone}{session?.name ?? "—"}
            </Text>
            <Text style={[styles.sessionNameText, { color: colors.foreground }]}>
              {t.howDoYouFeel}
            </Text>
            <Text style={[styles.fairyClose, { color: waveColor + "aa" }]}>
              "{t.journalTagline}"
            </Text>
            {/* Symbole feuchien — état apaisé */}
            <Text style={[styles.feuchienMark, { color: waveColor + "45" }]}>
              {t.journalFeuchien}
            </Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>{t.howDoYouFeel}</Text>
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((val) => (
              <Pressable key={val} onPress={() => handleRate(val)} style={styles.starBtn}>
                <SymIcon
                  name={rating >= val ? "star" : "star-outline"}
                  size={32}
                  color={rating >= val ? waveColor : colors.mutedForeground}
                />
              </Pressable>
            ))}
          </View>
          {rating > 0 && (
            <Text style={[styles.ratingLabel, { color: colors.mutedForeground }]}>
              {ratingLabels[rating - 1]}
            </Text>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>{t.reflection}</Text>
          <TextInput
            style={[styles.noteInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted }]}
            placeholder={t.notesPlaceholder}
            placeholderTextColor={colors.mutedForeground}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
        >
          <LinearGradient
            colors={[waveColor, colors.secondary] as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveBtnGradient}
          >
            {saved ? (
              <SymIcon name="checkmark" size={22} color={colors.background} />
            ) : (
              <>
                <SymIcon name="sparkles" size={18} color={colors.background} />
                <Text style={[styles.saveBtnText, { color: colors.background }]}>{t.journalReturnBtn}</Text>
              </>
            )}
          </LinearGradient>
        </Pressable>

        <Pressable onPress={() => router.replace("/")} style={styles.skipBtn}>
          <Text style={[styles.skipText, { color: colors.mutedForeground }]}>{t.skip}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 24, gap: 16 },

  /* ── Completion hero ── */
  heroHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: 8,
  },
  headerFairy: {
    width: 70,
    height: 95,
    opacity: 0.85,
    flexShrink: 0,
  },
  bubbleMedallion: {
    position: "absolute",
    left: 44,
    top: 52,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  bubbleMedallionImg: { width: 28, height: 28 },
  headerText: { flex: 1, gap: 3 },
  felbeletienMark: {
    fontSize: 8, fontWeight: "800", letterSpacing: 3,
    textTransform: "uppercase", marginBottom: 2,
  },
  feuchienMark: {
    fontSize: 8, fontWeight: "600", letterSpacing: 3,
    textTransform: "uppercase", marginTop: 6,
  },
  completedLabel: { fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase" },
  sessionNameText: { fontSize: 20, fontWeight: "700", marginTop: 2, marginBottom: 4 },
  fairyClose: { fontSize: 12, fontStyle: "italic", letterSpacing: 0.2, lineHeight: 18 },
  card: { borderRadius: 20, borderWidth: 1, padding: 20, gap: 16 },
  cardTitle: { fontSize: 16, fontWeight: "500", letterSpacing: 0.3 },
  ratingRow: { flexDirection: "row", gap: 8 },
  starBtn: { padding: 4 },
  ratingLabel: { fontSize: 13, letterSpacing: 1, textTransform: "uppercase" },
  noteInput: {
    borderRadius: 12, borderWidth: 1, padding: 14,
    fontSize: 14, lineHeight: 22, minHeight: 100,
  },
  saveBtn: { borderRadius: 18, overflow: "hidden", marginTop: 8 },
  saveBtnGradient: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 18, gap: 10,
  },
  saveBtnText: { fontSize: 17, fontWeight: "600", letterSpacing: 0.5 },
  skipBtn: { alignItems: "center", padding: 12 },
  skipText: { fontSize: 13, letterSpacing: 0.5 },
});
