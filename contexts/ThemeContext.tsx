import React, { createContext, useContext, useState, useMemo, ReactNode, useCallback } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "@/constants/colors";

type ThemeMode = "light" | "dark" | "system";

interface ThemeContextValue {
  isDark: boolean;
  themeMode: ThemeMode;
  colors: typeof Colors.light;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("light");

  const isDark = themeMode === "system" ? systemScheme === "dark" : themeMode === "dark";
  const colors = isDark ? Colors.dark : Colors.light;

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem("golfpro_theme", mode);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeMode(isDark ? "light" : "dark");
  }, [isDark, setThemeMode]);

  React.useEffect(() => {
    AsyncStorage.getItem("golfpro_theme").then((saved) => {
      if (saved === "light" || saved === "dark" || saved === "system") {
        setThemeModeState(saved);
      }
    });
  }, []);

  const value = useMemo(() => ({
    isDark,
    themeMode,
    colors,
    setThemeMode,
    toggleTheme,
  }), [isDark, themeMode, colors, setThemeMode, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
