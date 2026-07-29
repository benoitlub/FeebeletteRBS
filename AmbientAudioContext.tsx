import { SymIcon } from "@/components/SymIcon";
import React, { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColors } from "@/hooks/useColors";
import { useSubscription } from "@/context/SubscriptionContext";
import { LinearGradient } from "expo-linear-gradient";

const TAP_TARGET = 7;
const TAP_WINDOW_MS = 2500;

interface Props {
  children:     React.ReactNode;
  onLongPress?: () => void;
}

export function HiddenActivationWrapper({ children, onLongPress }: Props) {
  const [show, setShow] = useState(false);
  const taps = useRef<number[]>([]);

  const handleTap = useCallback(() => {
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < TAP_WINDOW_MS), now];
    if (taps.current.length >= TAP_TARGET) {
      taps.current = [];
      setShow(true);
    }
  }, []);

  return (
    <>
      <Pressable onPress={handleTap} onLongPress={onLongPress} style={styles.wrapper}>
        {children}
      </Pressable>
      <DevMenu visible={show} onClose={() => setShow(false)} />
    </>
  );
}

function DevMenu({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const {
    setForceMode,
    resetFreeCounter,
    deactivatePremium,
    activatePremium,
    isPremium,
    freeSessionsLeft,
  } = useSubscription();
  const [status, setStatus] = useState<string | null>(null);

  const action = async (fn: () => Promise<void>, msg: string) => {
    await fn();
    setStatus(msg);
    setTimeout(() => setStatus(null), 2500);
  };

  const clearAllCache = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      await AsyncStorage.multiRemove(keys);
      setStatus("Cache réinitialisé — redémarrez l'app");
    } catch {
      setStatus("Erreur lors de la réinitialisation");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View style={[styles.menu, { backgroundColor: colors.card, borderColor: colors.secondary + "40" }]}>
            <LinearGradient
              colors={[colors.secondary + "15", "transparent"]}
              style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
            />
            <View style={styles.menuHeader}>
              <SymIcon name="terminal-outline" size={16} color={colors.secondary} />
              <Text style={[styles.menuTitle, { color: colors.secondary }]}>
                MODE DÉVELOPPEUR
              </Text>
            </View>

            <View style={[styles.infoBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                Mode: {isPremium ? "Premium ✓" : "Gratuit"} · {freeSessionsLeft} séances restantes
              </Text>
            </View>

            {status && (
              <View style={[styles.statusBox, { backgroundColor: colors.accent + "20" }]}>
                <Text style={[styles.statusText, { color: colors.accent }]}>{status}</Text>
              </View>
            )}

            {[
              {
                icon: "refresh-outline" as const,
                label: "Réinitialiser le cache complet",
                color: colors.destructive,
                fn: async () => clearAllCache(),
              },
              {
                icon: "close-circle-outline" as const,
                label: "Réinitialiser compteur gratuit",
                color: colors.amber,
                fn: async () =>
                  action(resetFreeCounter, "Compteur gratuit réinitialisé"),
              },
              {
                icon: "person-outline" as const,
                label: "Forcer mode gratuit (test)",
                color: colors.mutedForeground,
                fn: async () =>
                  action(() => setForceMode("free"), "Mode gratuit forcé"),
              },
              {
                icon: "diamond-outline" as const,
                label: "Forcer mode premium (test)",
                color: colors.primary,
                fn: async () =>
                  action(() => setForceMode("premium"), "Mode premium forcé"),
              },
              {
                icon: "flag-outline" as const,
                label: "Rétablir mode normal",
                color: colors.accent,
                fn: async () =>
                  action(() => setForceMode("normal"), "Mode normal rétabli"),
              },
            ].map((item) => (
              <Pressable
                key={item.label}
                onPress={item.fn}
                style={({ pressed }) => [
                  styles.menuItem,
                  { borderColor: colors.border },
                  pressed && { backgroundColor: item.color + "10" },
                ]}
              >
                <SymIcon name={item.icon} size={16} color={item.color} />
                <Text style={[styles.menuItemLabel, { color: item.color }]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}

            <View style={[styles.versionBox, { borderColor: colors.border }]}>
              <Text style={[styles.versionText, { color: colors.mutedForeground }]}>
                Fée Belette Reboot System · v1.0.0{"\n"}by Blacklace Island · Mode dev actif
              </Text>
            </View>

            <Pressable onPress={onClose} style={[styles.closeBtn, { borderColor: colors.border }]}>
              <Text style={[styles.closeBtnText, { color: colors.foreground }]}>Fermer</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: "flex-start",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "#00000088",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  menu: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 10,
    width: "100%",
    maxWidth: 380,
    overflow: "hidden",
  },
  menuHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  menuTitle: {
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: "600",
  },
  infoBox: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  infoText: {
    fontSize: 12,
    letterSpacing: 0.3,
  },
  statusBox: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  menuItemLabel: {
    fontSize: 13,
    flex: 1,
    letterSpacing: 0.3,
  },
  versionBox: {
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 2,
  },
  versionText: {
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
    letterSpacing: 0.3,
  },
  closeBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
