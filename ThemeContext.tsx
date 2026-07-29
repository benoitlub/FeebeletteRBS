import React, { createContext, useContext } from "react";
import { useAmbientAudio, AmbientAudioState } from "@/hooks/useAmbientAudio";

const AmbientAudioContext = createContext<AmbientAudioState | null>(null);

export function AmbientAudioProvider({ children }: { children: React.ReactNode }) {
  const ambient = useAmbientAudio(true);
  return (
    <AmbientAudioContext.Provider value={ambient}>
      {children}
    </AmbientAudioContext.Provider>
  );
}

export function useAmbient(): AmbientAudioState {
  const ctx = useContext(AmbientAudioContext);
  if (!ctx) throw new Error("useAmbient must be used within AmbientAudioProvider");
  return ctx;
}
