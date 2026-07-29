import { SymIcon } from "@/components/SymIcon";
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { useLanguage, LANGS, LangCode } from "@/context/LanguageContext";
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  Easing,
} from "react-native-reanimated";

export function LanguagePicker() {
  const colors = useColors();
  const { lang, setLang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const scale = useSharedValue(1);
  const current = LANGS.find((l) => l.code === lang)!;

  const pressIn = () => { scale.value = withTiming(0.93, { duration: 80 }); };
  const pressOut = () => { scale.value = withTiming(1, { duration: 120 }); };

  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleSelect = (code: LangCode) => {
    setLang(code);
    setOpen(false);
  };

  return (
    <>
      <Animated.View style={btnStyle}>
        <Pressable
          onPress={() => setOpen(true)}
          onPressIn={pressIn}
          onPressOut={pressOut}
          style={[styles.pill, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={styles.flag}>{current.flag}</Text>
          <Text style={[styles.code, { color: colors.mutedForeground }]}>
            {current.code.toUpperCase()}
          </Text>
          <SymIcon name="chevron-down" size={9} color={colors.mutedForeground} />
        </Pressable>
      </Animated.View>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.secondary + "35" }]}>
              <LinearGradient
                colors={[colors.secondary + "12", "transparent"]}
                style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
              />

              <View style={styles.sheetHeader}>
                <Text style={styles.globe}>🌐</Text>
                <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
                  {t.chooseLang}
                </Text>
              </View>

              {LANGS.map((item) => {
                const isActive = item.code === lang;
                return (
                  <Pressable
                    key={item.code}
                    onPress={() => handleSelect(item.code)}
                    style={({ pressed }) => [
                      styles.langRow,
                      {
                        borderColor: isActive ? colors.primary + "50" : colors.border,
                        backgroundColor: isActive
                          ? colors.primary + "10"
                          : pressed
                          ? colors.muted
                          : "transparent",
                      },
                    ]}
                  >
                    <Text style={styles.langFlag}>{item.flag}</Text>
                    <Text style={[styles.langName, { color: isActive ? colors.primary : colors.foreground }]}>
                      {item.name}
                    </Text>
                    {isActive && (
                      <SymIcon name="checkmark-circle" size={16} color={colors.primary} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  flag: {
    fontSize: 13,
    lineHeight: 15,
  },
  code: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.8,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "#00000090",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  sheet: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 10,
    width: 280,
    overflow: "hidden",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  globe: {
    fontSize: 18,
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  langRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  langFlag: {
    fontSize: 20,
  },
  langName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
});
