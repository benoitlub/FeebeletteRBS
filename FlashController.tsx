import { SymIcon } from "@/components/SymIcon";
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
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
import { useLanguage } from "@/context/LanguageContext";

interface AccordionItem {
  icon: string;
  color: string;
  title: string;
  content: React.ReactNode;
}

function AccordionCard({ item }: { item: AccordionItem }) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const height = useSharedValue(0);
  const chevron = useSharedValue(0);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    height.value = withTiming(next ? 1 : 0, { duration: 350, easing: Easing.out(Easing.cubic) });
    chevron.value = withTiming(next ? 1 : 0, { duration: 280 });
  };

  const bodyStyle = useAnimatedStyle(() => ({
    maxHeight: interpolate(height.value, [0, 1], [0, 600]),
    opacity: height.value,
    overflow: "hidden",
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(chevron.value, [0, 1], [0, 180])}deg` }],
  }));

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: open ? item.color + "40" : colors.border }]}>
      {open && (
        <LinearGradient
          colors={[item.color + "08", "transparent"]}
          style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}
      <Pressable
        onPress={toggle}
        style={({ pressed }) => [styles.cardHeader, pressed && { opacity: 0.85 }]}
      >
        <View style={[styles.cardIconBox, { backgroundColor: item.color + "15", borderColor: item.color + "30" }]}>
          <SymIcon name={item.icon as any} size={16} color={item.color} />
        </View>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.title}</Text>
        <Animated.View style={chevronStyle}>
          <SymIcon name="chevron-down" size={14} color={colors.mutedForeground} />
        </Animated.View>
      </Pressable>
      <Animated.View style={bodyStyle}>
        <View style={styles.cardBody}>{item.content}</View>
      </Animated.View>
    </View>
  );
}

function BodyText({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  return (
    <Text style={[styles.bodyText, { color: colors.mutedForeground }]}>{children}</Text>
  );
}

function BodyHighlight({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <Text style={[styles.bodyHighlight, { color }]}>{children}</Text>
  );
}

function BulletRow({ icon, text, color }: { icon: string; text: string; color: string }) {
  const colors = useColors();
  return (
    <View style={styles.bulletRow}>
      <SymIcon name={icon as any} size={13} color={color} />
      <Text style={[styles.bulletText, { color: colors.mutedForeground }]}>{text}</Text>
    </View>
  );
}

function StatRow({ label, value, color }: { label: string; value: string; color: string }) {
  const colors = useColors();
  return (
    <View style={styles.statRow}>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

export function InfoSection() {
  const colors = useColors();
  const { t } = useLanguage();

  const items: AccordionItem[] = [
    {
      icon: "pulse-outline",
      color: "#00e5ff",
      title: "Comment ça fonctionne",
      content: (
        <View style={styles.bodyContent}>
          <BodyText>
            Le cerveau humain produit des ondes électriques à des fréquences mesurables. Fée Belette guide ces ondes vers des états précis grâce à{" "}
            <BodyHighlight color="#00e5ff">l'entraînement neuronal binaural</BodyHighlight>.
          </BodyText>
          <View style={styles.waveTable}>
            {[
              { wave: "DELTA", hz: "0.5–4 Hz", state: "Sommeil profond · Régénération", color: "#7c4dff" },
              { wave: "THÊTA", hz: "4–8 Hz", state: "Créativité · Hypnagogie", color: "#9c6dff" },
              { wave: "ALPHA", hz: "8–14 Hz", state: "Relaxation active · Focus", color: "#00e5ff" },
            ].map((row) => (
              <View key={row.wave} style={[styles.waveRow, { borderColor: row.color + "25" }]}>
                <View style={[styles.waveDot, { backgroundColor: row.color }]} />
                <Text style={[styles.waveName, { color: row.color }]}>{row.wave}</Text>
                <Text style={[styles.waveHz, { color: colors.mutedForeground }]}>{row.hz}</Text>
                <Text style={[styles.waveState, { color: colors.mutedForeground }]}>{row.state}</Text>
              </View>
            ))}
          </View>
          <BodyText>
            Deux fréquences légèrement différentes sont jouées dans chaque oreille. Le cerveau perçoit la différence comme une troisième fréquence — et se synchronise dessus. C'est mesurable, reproductible, et utilisé en recherche clinique depuis les années 70.
          </BodyText>
        </View>
      ),
    },
    {
      icon: "flame-outline",
      color: "#ff6b35",
      title: "Pourquoi tu reviendras",
      content: (
        <View style={styles.bodyContent}>
          <BodyText>
            Fée Belette est conçu pour créer une{" "}
            <BodyHighlight color="#ff6b35">boucle de gratification neurologique</BodyHighlight>
            {" "}— pas une dépendance artificielle, mais un vrai retour physique mesurable.
          </BodyText>
          <BulletRow icon="trophy-outline" color="#ffaa00" text="Série quotidienne — perdre sa série fait plus mal que de la maintenir (loss aversion cognitive)" />
          <BulletRow icon="stats-chart-outline" color="#00e5ff" text="Progression visible — ton score neurologique s'améliore à chaque voyage" />
          <BulletRow icon="people-outline" color="#7c4dff" text="Défi social — compare tes séries avec tes contacts, défie tes amis à tenir 7 jours" />
          <BulletRow icon="lock-closed-outline" color="#00c896" text="Sessions exclusives débloquées après n jours consécutifs (accès limité)" />
          <BulletRow icon="time-outline" color="#ff6b35" text="20 minutes seulement — assez court pour ne pas avoir d'excuse, assez long pour ressentir l'effet" />
        </View>
      ),
    },
    {
      icon: "moon-outline",
      color: "#9c6dff",
      title: "Quand l'utiliser",
      content: (
        <View style={styles.bodyContent}>
          <BodyText>Il n'existe pas de mauvais moment pour un reboot. Il en existe de meilleurs :</BodyText>
          {[
            { icon: "bed-outline", color: "#7c4dff", moment: "30 min avant de dormir", why: "Programme Vague Nocturne — induit le sommeil Delta, remplace les somnifères" },
            { icon: "sunny-outline", color: "#ffaa00", moment: "Réveil difficile", why: "Micro-Pause Alpha — activation douce en 8 minutes, sans café nécessaire" },
            { icon: "briefcase-outline", color: "#00e5ff", moment: "Pause déjeuner", why: "Ancrage Rapide — reset mental en 12 minutes, retour focus immédiat" },
            { icon: "alert-circle-outline", color: "#ff6b35", moment: "Crise d'anxiété", why: "Immersion Profonde — régulation du système nerveux autonome" },
            { icon: "school-outline", color: "#00c896", moment: "Avant un examen/entretien", why: "Alpha Focus — état de cohérence cognitive optimale" },
          ].map((item) => (
            <View key={item.moment} style={[styles.useCaseRow, { borderColor: item.color + "25" }]}>
              <SymIcon name={item.icon as any} size={16} color={item.color} style={{ marginTop: 2 }} />
              <View style={styles.useCaseText}>
                <Text style={[styles.useCaseMoment, { color: item.color }]}>{item.moment}</Text>
                <Text style={[styles.useCaseWhy, { color: colors.mutedForeground }]}>{item.why}</Text>
              </View>
            </View>
          ))}
        </View>
      ),
    },
    {
      icon: "people-outline",
      color: "#00c896",
      title: "C'est fait pour qui",
      content: (
        <View style={styles.bodyContent}>
          <BodyText>
            Quatre profils types ont été identifiés lors du développement. Tu en es un.
          </BodyText>
          {[
            { emoji: "🌙", type: "Le Dormeur Brisé", desc: "Insomniaque chronique ou perturbé par les écrans. Le programme Delta est fait pour toi.", color: "#7c4dff" },
            { emoji: "⚡", type: "L'Hyperstimulé", desc: "Anxieux, TDAH non diagnostiqué, incapable de s'arrêter. Alpha + Haptique.", color: "#00e5ff" },
            { emoji: "🎨", type: "Le Créatif Bloqué", desc: "Tu cherches l'état de flow. Thêta + Respiration guidée.", color: "#9c6dff" },
            { emoji: "🏆", type: "L'Optimiseur", desc: "Biohacker, performeur, curieux de neurosciences. Tout le catalogue.", color: "#00c896" },
          ].map((profile) => (
            <View key={profile.type} style={[styles.profileCard, { borderColor: profile.color + "30", backgroundColor: profile.color + "08" }]}>
              <Text style={styles.profileEmoji}>{profile.emoji}</Text>
              <View style={styles.profileText}>
                <Text style={[styles.profileType, { color: profile.color }]}>{profile.type}</Text>
                <Text style={[styles.profileDesc, { color: colors.mutedForeground }]}>{profile.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      ),
    },
    {
      icon: "shield-checkmark-outline",
      color: "#ffaa00",
      title: "Sécurité & science",
      content: (
        <View style={styles.bodyContent}>
          <View style={[styles.safeBox, { borderColor: "#ffaa0040", backgroundColor: "#ffaa0010" }]}>
            <SymIcon name="warning-outline" size={14} color="#ffaa00" />
            <Text style={[styles.safeWarning, { color: "#ffaa00" }]}>
              Non recommandé si tu souffres d'épilepsie photosensible. Désactive le flash LED dans les paramètres de séance.
            </Text>
          </View>
          <BodyText>
            Les fréquences binaurales sont utilisées dans des protocoles de recherche clinique (NIH, université de Cambridge) pour la gestion du stress, de l'insomnie et de la douleur chronique. Elles ne sont pas un traitement médical.
          </BodyText>
          <BulletRow icon="checkmark-circle-outline" color="#00c896" text="Aucun médicament, aucun produit ingéré" />
          <BulletRow icon="checkmark-circle-outline" color="#00c896" text="Arrêt possible à tout moment" />
          <BulletRow icon="checkmark-circle-outline" color="#00c896" text="Aucune donnée biométrique transmise" />
          <BulletRow icon="checkmark-circle-outline" color="#00c896" text="Fonctionne hors ligne — AsyncStorage local uniquement" />
        </View>
      ),
    },
  ];

  return (
    <View style={styles.wrapper}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionDot, { backgroundColor: colors.amber }]} />
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>TOUT SAVOIR</Text>
      </View>
      {items.map((item) => (
        <AccordionCard key={item.title} item={item} />
      ))}
      <View style={[styles.footer, { borderColor: colors.border }]}>
        <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
          Fée Belette Reboot System · v1.0{"\n"}
          by Blacklace Island · PRO.HIBITED
        </Text>
        <Text style={[styles.footerSub, { color: colors.mutedForeground + "80" }]}>
          "Pas de méditation. De l'ingénierie."
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    gap: 8,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  sectionDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 10,
    letterSpacing: 2.5,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
  },
  cardIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  cardBody: {
    paddingHorizontal: 14,
    paddingBottom: 16,
    paddingTop: 4,
  },
  bodyContent: {
    gap: 10,
  },
  bodyText: {
    fontSize: 13,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  bodyHighlight: {
    fontWeight: "700",
  },
  bulletRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  bulletText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  waveTable: {
    gap: 6,
  },
  waveRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 8,
  },
  waveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  waveName: {
    width: 46,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  waveHz: {
    width: 60,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  waveState: {
    flex: 1,
    fontSize: 10,
    letterSpacing: 0.3,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
  },
  statValue: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  useCaseRow: {
    flexDirection: "row",
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    alignItems: "flex-start",
  },
  useCaseText: {
    flex: 1,
    gap: 3,
  },
  useCaseMoment: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  useCaseWhy: {
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  profileCard: {
    flexDirection: "row",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "flex-start",
  },
  profileEmoji: {
    fontSize: 24,
    lineHeight: 28,
  },
  profileText: {
    flex: 1,
    gap: 3,
  },
  profileType: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  profileDesc: {
    fontSize: 12,
    lineHeight: 17,
    letterSpacing: 0.2,
  },
  safeBox: {
    flexDirection: "row",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    alignItems: "flex-start",
  },
  safeWarning: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500",
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: 16,
    marginTop: 8,
    alignItems: "center",
    gap: 6,
  },
  footerText: {
    fontSize: 11,
    textAlign: "center",
    letterSpacing: 1,
    lineHeight: 17,
  },
  footerSub: {
    fontSize: 11,
    fontStyle: "italic",
    letterSpacing: 0.5,
  },
});
