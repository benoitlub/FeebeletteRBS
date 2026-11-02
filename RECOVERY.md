# État des sources et récupération

Inspection du 2 novembre 2026. Les fichiers originaux sont conservés.

Ce dépôt ne fournit pas actuellement une application reconstructible : package.json
est absent et des fichiers de configuration contiennent du TypeScript ou du HTML
sans rapport avec leur nom. Plusieurs composants sont vides. La page index.html
pointait vers les assets d'une autre application, Blacklace Dice.

## Correspondances établies par le contenu

Ces correspondances servent à récupérer les fichiers ; elles ne constituent pas
un projet complet ou une validation de fonctionnement.

| Fichier actuel | Emplacement probable | Déclaration repérée |
|---|---|---|
| `build.js` | `i18n/fr.ts` | `export const fr` |
| `serve.js` | `i18n/en.ts` | `export const en` |
| `index.ts` | `i18n/es.ts` | `export const es` |
| `index.tsx` | `babel.config.js` | `module.exports` |
| `profile.tsx` | `metro.config.js` | `getDefaultConfig` |
| `journal.tsx` | `tsconfig.json` | `extends expo/tsconfig.base` |
| `useAmbientAudio.ts` | `hooks/useSensors.ts` | `export function useSensors` |
| `fr.ts` | `hooks/useAmbientAudio.ts` | `export function useAmbientAudio` |
| `en.ts` | `hooks/useBinauralAudio.ts` | `export function useBinauralAudio` |
| `useBinauralAudio.ts` | `hooks/useFlash.ts` | `export function useFlash` |
| `useFlash.ts` | `hooks/useColors.ts` | `export function useColors` |
| `sessions.ts` | `lib/adaptiveSession.ts` | `computeAdaptiveSession` |
| `sessionWhispers.ts` | `data/sessions.ts` | `SESSIONS` |
| `useSensors.ts` | `data/sessionWhispers.ts` | `SESSION_WHISPERS_I18N` |
| `sessions.tsx` | `types/index.ts` | `interface Session` |
| `adaptiveSession.ts` | `context/ThemeContext.tsx` | `ThemeProvider` |
| `SensorBadge.tsx` | `components/ErrorBoundary.tsx` | `class ErrorBoundary` |
| `FairyTutorialOverlay.tsx` | `components/ErrorFallback.tsx` | `function ErrorFallback` |
| `DurationPickerSheet.tsx` | `components/SensorBadge.tsx` | `function SensorBadge` |
| `SessionQCM.tsx` | `components/KeyboardAwareScrollViewCompat.tsx` | `KeyboardAwareScrollViewCompat` |

## Éléments indispensables non retrouvés

- Manifeste de dépendances package.json et versions du projet Expo.
- Point d'entrée Expo Router et organisation d'origine des routes.
- Implémentations cohérentes de plusieurs contextes et du composant SymIcon.
- Composants dont les fichiers portent le nom mais restent vides ou contiennent
  un autre composant.

Il faut récupérer un export complet du projet d'origine ou une révision Git
contenant ces éléments. Ne pas inventer des implémentations ou masquer des erreurs
de types pour déclarer une reconstruction réussie.

Les formulations scientifiques des textes conservés n'ont pas été validées par
cet inventaire. Le prototype ne doit pas être présenté comme une méthode
thérapeutique démontrée.
