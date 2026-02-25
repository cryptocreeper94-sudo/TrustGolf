import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppSplash } from "@/components/AppSplash";
import { queryClient, apiRequest } from "@/lib/query-client";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false, headerBackTitle: "Back" }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ presentation: "modal" }} />
      <Stack.Screen name="developer" options={{ headerShown: false }} />
      <Stack.Screen name="course/[id]" options={{ presentation: "modal" }} />
      <Stack.Screen name="new-round" options={{ presentation: "modal" }} />
      <Stack.Screen name="swing-analyzer" options={{ presentation: "modal" }} />
      <Stack.Screen name="swing-video" options={{ presentation: "modal" }} />
      <Stack.Screen name="swing-result" options={{ presentation: "modal" }} />
      <Stack.Screen name="scorecard" options={{ presentation: "modal" }} />
      <Stack.Screen name="about" options={{ presentation: "modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
      apiRequest("POST", "/api/seed", {}).catch(() => {});
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const handler = (e: any) => {
      e.preventDefault();
      (window as any).__pwaInstallPrompt = e;
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!fontsLoaded) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <KeyboardProvider>
            <ThemeProvider>
              <AuthProvider>
                <RootLayoutNav />
                {showSplash && <AppSplash onFinish={() => setShowSplash(false)} />}
              </AuthProvider>
            </ThemeProvider>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
