import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { useFonts } from "expo-font";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Canonical v15 font loading — spread .font from each icon set.
// createIconSet() builds { [fontName]: <TTF asset> } with the exact family name
// ('ionicons', 'feather', 'material') so React Native finds the glyph correctly.
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider } from "@/context/AppContext";
import { SubscriptionProvider } from "@/context/SubscriptionContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { AmbientAudioProvider } from "@/context/AmbientAudioContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isDark } = useTheme();
  const bg = isDark ? "#07071a" : "#eeeef8";
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        contentStyle: { backgroundColor: bg },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false, contentStyle: { backgroundColor: bg } }} />
      <Stack.Screen name="sessions" options={{ headerShown: false, animation: "slide_from_bottom", contentStyle: { backgroundColor: bg } }} />
      <Stack.Screen name="active"   options={{ headerShown: false, animation: "fade",              contentStyle: { backgroundColor: bg } }} />
      <Stack.Screen name="journal"  options={{ headerShown: false, animation: "slide_from_bottom", contentStyle: { backgroundColor: bg } }} />
      <Stack.Screen name="profile"  options={{ headerShown: false, animation: "slide_from_right",  contentStyle: { backgroundColor: bg } }} />
      <Stack.Screen name="paywall"  options={{ headerShown: false, animation: "slide_from_bottom", contentStyle: { backgroundColor: bg }, presentation: "modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    // Canonical v15: spread the .font object from each icon set component.
    // This guarantees the key matches the fontFamily used internally by createIconSet.
    ...Ionicons.font,      // { ionicons: <TTF asset> }
    ...Feather.font,       // { feather: <TTF asset> }
    ...MaterialIcons.font, // { material: <TTF asset> }
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <LanguageProvider>
              <AppProvider>
                <SubscriptionProvider>
                  <AmbientAudioProvider>
                    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#07071a" }}>
                      <KeyboardProvider>
                        <RootLayoutNav />
                      </KeyboardProvider>
                    </GestureHandlerRootView>
                  </AmbientAudioProvider>
                </SubscriptionProvider>
              </AppProvider>
            </LanguageProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
