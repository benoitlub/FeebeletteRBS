import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fr, LangStrings } from "@/i18n/fr";
import { en } from "@/i18n/en";
import { es } from "@/i18n/es";

export type LangCode = "fr" | "en" | "es";

const LANG_MAP: Record<LangCode, LangStrings> = { fr, en, es };
const STORAGE_KEY = "fbrs_language";

interface LanguageCtx {
  lang: LangCode;
  t: LangStrings;
  setLang: (l: LangCode) => void;
  LANGS: { code: LangCode; flag: string; name: string }[];
}

const LanguageContext = createContext<LanguageCtx>({
  lang: "fr",
  t: fr,
  setLang: () => {},
  LANGS: [],
});

export const LANGS: { code: LangCode; flag: string; name: string }[] = [
  { code: "fr", flag: "🇫🇷", name: "Français" },
  { code: "en", flag: "🇬🇧", name: "English" },
  { code: "es", flag: "🇪🇸", name: "Español" },
];

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LangCode>("fr");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v && (v === "fr" || v === "en" || v === "es")) {
        setLangState(v as LangCode);
      }
    });
  }, []);

  const setLang = useCallback((l: LangCode) => {
    setLangState(l);
    AsyncStorage.setItem(STORAGE_KEY, l);
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, t: LANG_MAP[lang], setLang, LANGS }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
