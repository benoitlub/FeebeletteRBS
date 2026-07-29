/**
 * Mode Adaptatif — sélection intelligente de séance basée sur :
 *  - Capteurs temps réel (agitation, lumière)
 *  - Heure du jour
 *  - Historique de l'utilisateur (sessions passées, favoris, diversité)
 *  - Préférences horaires
 */
import type { SensorState } from "@/hooks/useSensors";
import type { SessionRecord, RelaxationProfile } from "@/types";
import type { LangStrings } from "@/i18n/fr";

type SessionId = "respiration" | "reboot" | "nid" | "etincelle" | "cristal" | "aurora" | "vague" | "racine";

const ALL_SESSIONS: SessionId[] = ["respiration", "reboot", "nid", "etincelle", "cristal", "aurora", "vague", "racine"];

export interface AdaptiveResult {
  sessionId: SessionId;
  reason: string;
  confidence: "high" | "medium" | "low";
  signals: string[];
}

export function computeAdaptiveSession(
  sensors:  SensorState,
  records:  SessionRecord[],
  profile:  RelaxationProfile,
  t?: Pick<LangStrings,
    | "signalAgitation" | "signalModerate" | "signalCalm"
    | "signalDark" | "signalBright"
    | "signalNight" | "signalMorning" | "signalMidMorning"
    | "signalAfternoon" | "signalEvening" | "signalLateEvening"
    | "signalUsualSlot" | "signalFavorite" | "balancedParams"
  >,
): AdaptiveResult {
  const hour = new Date().getHours();

  // ── Score board ────────────────────────────────────────────────────────────
  const scores: Record<SessionId, number> = {
    respiration: 0,
    reboot:      0,
    nid:         0,
    etincelle:   0,
    cristal:     0,
    aurora:      0,
    vague:       0,
    racine:      0,
  };
  const signals: string[] = [];

  // Fallback French strings (used if t is not provided)
  const s = {
    signalAgitation:   t?.signalAgitation   ?? "Agitation élevée détectée",
    signalModerate:    t?.signalModerate    ?? "Niveau modéré détecté",
    signalCalm:        t?.signalCalm        ?? "État calme détecté",
    signalDark:        t?.signalDark        ?? "Environnement sombre",
    signalBright:      t?.signalBright      ?? "Environnement lumineux",
    signalNight:       t?.signalNight       ?? "Heure : nuit",
    signalMorning:     t?.signalMorning     ?? "Heure : matin",
    signalMidMorning:  t?.signalMidMorning  ?? "Heure : matinée",
    signalAfternoon:   t?.signalAfternoon   ?? "Heure : après-midi",
    signalEvening:     t?.signalEvening     ?? "Heure : soirée",
    signalLateEvening: t?.signalLateEvening ?? "Heure : fin de soirée",
    signalUsualSlot:   t?.signalUsualSlot   ?? "Créneau habituel",
    signalFavorite:    t?.signalFavorite    ?? "Favori",
    balancedParams:    t?.balancedParams    ?? "Paramètres équilibrés",
  };

  // ── 1. Capteur d'agitation ─────────────────────────────────────────────────
  if (sensors.isAvailable) {
    if (sensors.agitationLevel === "agitated") {
      scores.respiration += 4;
      scores.nid         += 2;
      scores.vague       += 3;
      signals.push(s.signalAgitation);
    } else if (sensors.agitationLevel === "moderate") {
      scores.reboot  += 3;
      scores.cristal += 2;
      scores.vague   += 2;
      signals.push(s.signalModerate);
    } else {
      scores.cristal   += 2;
      scores.etincelle += 2;
      scores.aurora    += 3;
      signals.push(s.signalCalm);
    }

    // ── Capteur de lumière ───────────────────────────────────────────────────
    if (sensors.lightLevel === "dark") {
      scores.nid         += 2;
      scores.respiration += 1;
      scores.racine      += 2;
      signals.push(s.signalDark);
    } else if (sensors.lightLevel === "bright") {
      scores.etincelle += 2;
      scores.cristal   += 1;
      scores.aurora    += 2;
      signals.push(s.signalBright);
    }
  }

  // ── 2. Heure du jour ───────────────────────────────────────────────────────
  if (hour >= 22 || hour < 6) {
    scores.nid         += 4;
    scores.respiration += 2;
    scores.racine      += 3;
    signals.push(s.signalNight);
  } else if (hour >= 6 && hour < 9) {
    scores.etincelle += 4;
    scores.aurora    += 4;
    scores.reboot    += 1;
    signals.push(s.signalMorning);
  } else if (hour >= 9 && hour < 12) {
    scores.cristal += 3;
    scores.aurora  += 3;
    scores.reboot  += 2;
    signals.push(s.signalMidMorning);
  } else if (hour >= 12 && hour < 14) {
    scores.reboot      += 3;
    scores.vague       += 3;
    scores.respiration += 1;
    signals.push(s.signalAfternoon);
  } else if (hour >= 17 && hour < 20) {
    scores.respiration += 3;
    scores.vague       += 3;
    scores.cristal     += 2;
    signals.push(s.signalEvening);
  } else if (hour >= 20) {
    scores.nid         += 3;
    scores.racine      += 3;
    scores.respiration += 2;
    signals.push(s.signalLateEvening);
  }

  // ── 3. Historique — favoriser la diversité ─────────────────────────────────
  const recent = records.slice(0, 8);
  const recentCounts: Record<string, number> = {};
  recent.forEach((r) => {
    recentCounts[r.sessionId] = (recentCounts[r.sessionId] ?? 0) + 1;
  });

  ALL_SESSIONS.forEach((id) => {
    const n = recentCounts[id] ?? 0;
    if (n >= 3) {
      scores[id] = Math.max(0, scores[id] - 3);
    } else if (n >= 2) {
      scores[id] = Math.max(0, scores[id] - 1);
    }
  });

  if (profile.favoriteSessionId) {
    const id = profile.favoriteSessionId as SessionId;
    if (ALL_SESSIONS.includes(id) && (recentCounts[id] ?? 0) < 2) {
      scores[id] += 1;
      signals.push(`${s.signalFavorite} : ${id}`);
    }
  }

  // ── 4. Heure préférée de l'utilisateur ────────────────────────────────────
  if (profile.preferredTimeOfDay) {
    const currentSlot =
      hour >= 5 && hour < 12 ? "morning"
      : hour >= 12 && hour < 17 ? "afternoon"
      : hour >= 17 && hour < 21 ? "evening"
      : "night";

    if (profile.preferredTimeOfDay === currentSlot && records.length >= 5) {
      signals.push(s.signalUsualSlot);
    }
  }

  // ── Choisir le gagnant ─────────────────────────────────────────────────────
  const winner = ALL_SESSIONS.reduce((best, id) =>
    scores[id] > scores[best] ? id : best,
    ALL_SESSIONS[0] as SessionId,
  );

  const maxScore = scores[winner];
  const confidence: AdaptiveResult["confidence"] =
    maxScore >= 6 ? "high" : maxScore >= 3 ? "medium" : "low";

  const topSignals = signals.slice(0, 2);
  const reason = topSignals.join(" · ") || s.balancedParams;

  return { sessionId: winner, reason, confidence, signals };
}

export function getAdaptiveLabel(
  result: AdaptiveResult,
  t?: Pick<LangStrings,
    | "adaptiveLabelRespiration" | "adaptiveLabelReboot" | "adaptiveLabelNid"
    | "adaptiveLabelEtincelle"  | "adaptiveLabelCristal" | "adaptiveLabelAurora"
    | "adaptiveLabelVague"      | "adaptiveLabelRacine"
  >,
): string {
  const map: Record<SessionId, string> = {
    respiration: t?.adaptiveLabelRespiration ?? "Respiration Belette",
    reboot:      t?.adaptiveLabelReboot      ?? "Reboot Doux",
    nid:         t?.adaptiveLabelNid         ?? "Nid de Calme",
    etincelle:   t?.adaptiveLabelEtincelle   ?? "Étincelle Feuchienne",
    cristal:     t?.adaptiveLabelCristal     ?? "Cristal Intérieur",
    aurora:      t?.adaptiveLabelAurora      ?? "Aurora Belette",
    vague:       t?.adaptiveLabelVague       ?? "Vague de Calme",
    racine:      t?.adaptiveLabelRacine      ?? "Racine Feuchienne",
  };
  return map[result.sessionId] ?? result.sessionId;
}

// ─────────────────────────────────────────────────────────────────────────────
// Durée adaptative — recommande la durée selon état, historique et niveau
// ─────────────────────────────────────────────────────────────────────────────
export function computeAdaptiveDuration(
  sensors:  SensorState,
  records:  SessionRecord[],
  voyages:  number,
): number {
  const hour = new Date().getHours();

  // Base: 5 min (300s)
  let duration = 300;

  // Agitation élevée → séance courte (3 min)
  if (sensors.isAvailable && sensors.agitationLevel === "agitated") {
    duration = 180;
  }
  // Nuit → séance plus longue (7 min)
  else if (hour >= 21 || hour < 6) {
    duration = 420;
  }
  // Utilisateur expérimenté → préfère des séances plus longues
  else if (voyages >= 15) {
    duration = 420;
  }
  // Débutant → commencer court
  else if (voyages < 3) {
    duration = 180;
  }

  // Ajustement selon la durée moyenne des dernières séances
  const recent = records.slice(0, 5);
  if (recent.length >= 3) {
    const avgDuration = recent.reduce((sum, r) => sum + (r.duration ?? 300), 0) / recent.length;
    if (avgDuration > 350) duration = Math.max(duration, 420);
    if (avgDuration < 250) duration = Math.min(duration, 300);
  }

  return duration;
}

// ─────────────────────────────────────────────────────────────────────────────
// Système de progression — Niveaux d'apprentissage
// ─────────────────────────────────────────────────────────────────────────────

export type UserLevel = "neophyte" | "inite" | "pratiquant" | "maitre";

export interface LevelInfo {
  level:         UserLevel;
  label:         string;       // display name
  emoji:         string;
  description:   string;       // short poetic description
  voyages:       number;       // sessions done
  nextThreshold: number;       // sessions needed to reach next level
  progressRatio: number;       // 0–1 within current level
  perks:         string[];     // unlocked features at this level
}

const THRESHOLDS: Record<UserLevel, number> = {
  neophyte:   0,
  inite:      5,
  pratiquant: 15,
  maitre:     30,
};

export function computeUserLevel(
  voyages: number,
  t?: Pick<LangStrings, "levelNeophyte" | "levelInite" | "levelPratiquant" | "levelMaitre">,
): LevelInfo {
  let level: UserLevel = "neophyte";
  if (voyages >= THRESHOLDS.maitre)     level = "maitre";
  else if (voyages >= THRESHOLDS.pratiquant) level = "pratiquant";
  else if (voyages >= THRESHOLDS.inite)      level = "inite";

  const thresholds: UserLevel[] = ["neophyte", "inite", "pratiquant", "maitre"];
  const currentIdx = thresholds.indexOf(level);
  const nextLevel  = thresholds[currentIdx + 1] as UserLevel | undefined;

  const currentThreshold = THRESHOLDS[level];
  const nextThreshold    = nextLevel ? THRESHOLDS[nextLevel] : THRESHOLDS.maitre + 10;
  const progressRatio    = nextLevel
    ? Math.min((voyages - currentThreshold) / (nextThreshold - currentThreshold), 1)
    : 1;

  const INFO: Record<UserLevel, Omit<LevelInfo, "voyages" | "nextThreshold" | "progressRatio">> = {
    neophyte: {
      level:       "neophyte",
      label:       t?.levelNeophyte   ?? "Néophyte Belette",
      emoji:       "🌱",
      description: "Le voyage commence. Chaque séance trace un chemin.",
      perks:       ["Recommandation de base", "Capteurs actifs"],
    },
    inite: {
      level:       "inite",
      label:       t?.levelInite      ?? "Initié·e Belette",
      emoji:       "✦",
      description: "Le système commence à te connaître. Les séances s'affinent.",
      perks:       ["Recommandation par heure", "Diversité automatique", "Patterns détectés"],
    },
    pratiquant: {
      level:       "pratiquant",
      label:       t?.levelPratiquant ?? "Pratiquant·e Feuchien·ne",
      emoji:       "◈",
      description: "Tes rituels s'installent. Le mode s'adapte à ton rythme naturel.",
      perks:       ["Créneau habituel reconnu", "Séance favorite boostée", "Confiance haute"],
    },
    maitre: {
      level:       "maitre",
      label:       t?.levelMaitre     ?? "Maître·sse Belette",
      emoji:       "⬡",
      description: "Synchronisation complète. Le système anticipe avant que tu demandes.",
      perks:       ["Adaptation totale", "Séances illimitées", "Mode expert débloqué"],
    },
  };

  return {
    ...INFO[level],
    voyages,
    nextThreshold,
    progressRatio,
  };
}
