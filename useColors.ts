import { Session } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// BIOADAPTIVE RELAXATION SYSTEM — 8 rituels bioadaptifs
// Techniques : luminothérapie, audiothérapie binaurale, hypnothérapie légère
// Durées adaptables : 3 min (éclair) · 5 min (standard) · 7 min (immersif)
// ─────────────────────────────────────────────────────────────────────────────

// Duration multipliers — applied when user overrides session duration
export const DURATION_OPTIONS = [
  { label: "3 min",  tag: "Éclair",   seconds: 180, icon: "⚡" },
  { label: "5 min",  tag: "Standard", seconds: 300, icon: "◎" },
  { label: "7 min",  tag: "Immersif", seconds: 420, icon: "◈" },
  { label: "Adaptatif", tag: "Système", seconds: -1, icon: "∞" },
] as const;

export const SESSIONS: Session[] = [
  {
    id: "respiration",
    name: "Respiration Belette",
    subtitle: "Calme le corps, ralentit le mental",
    duration: 240,
    durationLabel: "4 min",
    colors: ["#06052a", "#1a0070", "#0c0050", "#04041e"],
    hapticStyle: "wave",
    breathPattern: { inhale: 4, hold: 2, exhale: 6, label: "4-2-6 Belette" },
    waveType: "alpha",
    waveHz: 8,
    carrierFreq: 180,
    flashHz: 8,
    flashEnabled: true,
    lightMode: "breath-sync",
    lightLabel: "Respiro-lumineux",
    scienceHook: "Torche synchronisée sur ta respiration · Cohérence alpha 8 Hz",
    description:
      "Respiration douce · Cohérence alpha 8 Hz · Torche LED sur le souffle · " +
      "On ne force rien. On revient doucement.",
    tagline: "Calme le corps · Ralentit le mental",
  },
  {
    id: "reboot",
    name: "Reboot Doux",
    subtitle: "Revenir à zéro sans brutalité",
    duration: 300,
    durationLabel: "5 min",
    colors: ["#001828", "#003c58", "#002038", "#000c18"],
    hapticStyle: "pulse",
    breathPattern: { inhale: 5, hold: 0, exhale: 5, label: "5-5 Cohérence" },
    waveType: "alpha",
    waveHz: 9,
    carrierFreq: 200,
    flashHz: 4,
    flashEnabled: true,
    lightMode: "entrainment",
    lightLabel: "Entraînement alpha",
    scienceHook: "Torche LED à 4 Hz · Entraînement des ondes alpha · Reset cortical",
    description:
      "Pulsation lumineuse 4 Hz · Entraînement cérébral alpha · " +
      "Reboot en cours. Aucun drame détecté.",
    tagline: "Reboot en cours · Aucun drame détecté",
  },
  {
    id: "nid",
    name: "Nid de Calme",
    subtitle: "Relâcher la pression",
    duration: 420,
    durationLabel: "7 min",
    colors: ["#0a0030", "#200060", "#140048", "#050018"],
    hapticStyle: "deep",
    breathPattern: { inhale: 4, hold: 4, exhale: 8, label: "4-4-8 Nid" },
    waveType: "delta",
    waveHz: 2,
    carrierFreq: 120,
    flashHz: 1.5,
    flashEnabled: true,
    lightMode: "pulse",
    lightLabel: "Pulsation delta",
    scienceHook: "Ondes delta 2 Hz · Récupération profonde · Immobilité sensorielle",
    description:
      "Cocon lumineux · Pression relâchée · Respiration profonde · " +
      "Rien à faire. Juste être là.",
    tagline: "Cocon de silence · Pression à zéro",
  },
  {
    id: "etincelle",
    name: "Étincelle Feuchienne",
    subtitle: "Retrouver de l'élan sans se brusquer",
    duration: 180,
    durationLabel: "3 min",
    colors: ["#200800", "#5c2000", "#3c1200", "#100400"],
    hapticStyle: "burst",
    breathPattern: { inhale: 4, hold: 1, exhale: 4, label: "4-1-4 Étincelle" },
    waveType: "alpha",
    waveHz: 10,
    carrierFreq: 220,
    flashHz: 3,
    flashEnabled: true,
    lightMode: "theta-burst",
    lightLabel: "Rafales theta",
    scienceHook: "Rafales theta 3 Hz · Activation dopaminergique légère · TMS inspiré",
    description:
      "Rafales lumineuses theta · Impulsions LED brèves · Activation féerique légère · " +
      "Une petite étincelle suffit.",
    tagline: "Une petite étincelle suffit",
  },
  {
    id: "cristal",
    name: "Cristal Intérieur",
    subtitle: "Se recentrer",
    duration: 360,
    durationLabel: "6 min",
    colors: ["#0d0030", "#1a0060", "#100048", "#060020"],
    hapticStyle: "micro",
    breathPattern: { inhale: 5, hold: 3, exhale: 7, label: "5-3-7 Cristal" },
    waveType: "theta",
    waveHz: 6,
    carrierFreq: 160,
    flashHz: 7.83,
    flashEnabled: true,
    lightMode: "schumann",
    lightLabel: "Résonance Schumann",
    scienceHook: "7.83 Hz · Fréquence naturelle terrestre · Ancrage électromagnétique",
    description:
      "Résonance de Schumann 7.83 Hz · Fréquence naturelle de la Terre · " +
      "Tu es plus ancré que tu ne le crois.",
    tagline: "Cristal intérieur · Silence magique",
  },

  // ── AURORA — SMR / Clarté matinale ─────────────────────────────────────────
  {
    id: "aurora",
    name: "Aurora Belette",
    subtitle: "Clarté douce · Éveil progressif",
    duration: 300,
    durationLabel: "5 min",
    colors: ["#000e28", "#002460", "#001848", "#000818"],
    hapticStyle: "micro",
    breathPattern: { inhale: 4, hold: 2, exhale: 4, label: "4-2-4 Aurora" },
    waveType: "alpha",
    waveHz: 12,
    carrierFreq: 210,
    flashHz: 12,
    flashEnabled: true,
    lightMode: "entrainment",
    lightLabel: "Rythme SMR",
    scienceHook: "SMR 12 Hz · Clarté cognitive sans tension · Beta bas apaisé",
    description:
      "Onde SMR 12 Hz · Clarté sans excitation · Binaural aurora · " +
      "L'aube intérieure se lève, doucement.",
    tagline: "Clarté douce · L'aube intérieure",
  },

  // ── VAGUE — Relâchement thêta ──────────────────────────────────────────────
  {
    id: "vague",
    name: "Vague de Calme",
    subtitle: "Laisser partir la pression accumulée",
    duration: 360,
    durationLabel: "6 min",
    colors: ["#001820", "#004050", "#002838", "#000c18"],
    hapticStyle: "wave",
    breathPattern: { inhale: 5, hold: 2, exhale: 7, label: "5-2-7 Vague" },
    waveType: "theta",
    waveHz: 5,
    carrierFreq: 150,
    flashHz: 5,
    flashEnabled: true,
    lightMode: "pulse",
    lightLabel: "Vague thêta",
    scienceHook: "Thêta 5 Hz · Libération de la charge mentale · Océan intérieur",
    description:
      "Vague thêta 5 Hz · Pression qui part · Lumière douce comme des reflets · " +
      "Laisse la vague emporter ce qui est trop lourd.",
    tagline: "La vague emporte le trop-plein",
  },

  // ── RACINE — Ancrage profond ────────────────────────────────────────────────
  {
    id: "racine",
    name: "Racine Feuchienne",
    subtitle: "S'ancrer dans le présent",
    duration: 420,
    durationLabel: "7 min",
    colors: ["#160800", "#3c1800", "#280e00", "#0c0400"],
    hapticStyle: "deep",
    breathPattern: { inhale: 6, hold: 2, exhale: 8, label: "6-2-8 Racine" },
    waveType: "delta",
    waveHz: 3,
    carrierFreq: 100,
    flashHz: 7.83,
    flashEnabled: true,
    lightMode: "schumann",
    lightLabel: "Schumann + Racine",
    scienceHook: "Delta 3 Hz + 7.83 Hz · Ancrage électromagnétique profond",
    description:
      "Delta 3 Hz · Résonance Schumann · Pieds dans la Terre · " +
      "Tu es ici. Tu es ancré. Le Feuch peut se poser.",
    tagline: "Ancrage profond · Terre sous les pieds",
  },
];

export const getSession = (id: string): Session | undefined =>
  SESSIONS.find((s) => s.id === id);

// ─────────────────────────────────────────────────────────────────────────────
// États utilisateur → séance recommandée
// ─────────────────────────────────────────────────────────────────────────────

export interface UserState {
  id: string;
  label: string;
  sessionId: string;
  icon: string;
  color: string;
}

export const USER_STATES: UserState[] = [
  { id: "tendu",    label: "Je suis tendu",                  sessionId: "respiration", icon: "alert-circle-outline",  color: "#ff7070" },
  { id: "fatigue",  label: "Je suis fatigué",                sessionId: "nid",         icon: "moon-outline",          color: "#7ca8ff" },
  { id: "disperse", label: "Je suis dispersé",               sessionId: "cristal",     icon: "shuffle-outline",       color: "#b07cff" },
  { id: "bloque",   label: "Je suis bloqué",                 sessionId: "reboot",      icon: "pause-circle-outline",  color: "#ffb700" },
  { id: "agite",    label: "Je suis trop agité",             sessionId: "respiration", icon: "flash-outline",         color: "#ff9040" },
  { id: "reboot",   label: "J'ai besoin d'un petit reboot",  sessionId: "reboot",      icon: "refresh-outline",       color: "#00e5ff" },
  { id: "rallumer", label: "Je veux me rallumer doucement",  sessionId: "etincelle",   icon: "bulb-outline",          color: "#ffd166" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Murmures poétiques — chuchotements hypnotiques pendant la séance
// ─────────────────────────────────────────────────────────────────────────────
export const SESSION_WHISPERS: Record<string, string[]> = {
  respiration: [
    "Respire. Je suis là.",
    "Inspire. La lumière suit ton souffle.",
    "Expire. Tu n'as rien à prouver.",
    "On ne force rien. On revient doucement.",
    "Le Feuch s'agite ? On lui met une couverture.",
    "Chaque expiration efface un peu plus le bruit.",
  ],
  reboot: [
    "Reboot en cours. Aucun drame détecté.",
    "La lumière pulse. Ton cerveau s'aligne.",
    "Inspire. Le système se repose.",
    "Tu n'as rien à prouver. Rien du tout.",
    "4 Hz. Alpha. Remise à zéro en cours.",
    "Le reset prend du temps. C'est normal.",
  ],
  nid: [
    "Respire. Je suis là.",
    "Expire. Relâche la pression.",
    "Tu es en sécurité. Le nid t'accueille.",
    "Rien à faire. Juste être là.",
    "La fatigue fond doucement. C'est bien.",
    "Deux hertz. Le corps récupère.",
  ],
  etincelle: [
    "Une petite étincelle suffit.",
    "Inspire. Sens l'élan qui revient doucement.",
    "Pas besoin de tout. Juste un peu de lumière.",
    "Expire. Garde l'étincelle.",
    "Doucement. L'île te redonne de l'élan.",
    "Rafale theta. L'énergie remonte.",
  ],
  cristal: [
    "Le cristal intérieur se stabilise.",
    "7.83 Hz. La fréquence de la Terre.",
    "Expire. Laisse le bruit partir.",
    "Tu es plus ancré que tu ne le crois.",
    "Recentre. Doucement. Voilà.",
    "La Terre pulse avec toi.",
  ],
  aurora: [
    "L'aube intérieure se lève.",
    "SMR 12 Hz. La clarté arrive doucement.",
    "Inspire. Sens la luminosité croître.",
    "Ton esprit s'éveille. Pas de brusquerie.",
    "Aurora. Clarté sans tension.",
    "12 Hz. Le seuil entre calme et éveil.",
  ],
  vague: [
    "La vague arrive. Elle emporte le trop-plein.",
    "Thêta 5 Hz. L'océan intérieur.",
    "Expire. Laisse la vague partir.",
    "Rien à retenir. Tout peut partir.",
    "La pression se dissout dans l'eau.",
    "Vague après vague. Le calme revient.",
  ],
  racine: [
    "Tes pieds dans la Terre.",
    "Delta 3 Hz. Ton corps descend dans le sol.",
    "Schumann pulse. La Terre te tient.",
    "Ancré. Présent. Ici.",
    "Le Feuch peut poser son bagage.",
    "7.83 Hz. Tu es synchronisé avec la planète.",
  ],
};
