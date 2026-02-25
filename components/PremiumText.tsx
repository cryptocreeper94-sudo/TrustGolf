import React from "react";
import { Text, TextStyle, Platform } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";

interface PremiumTextProps {
  children: React.ReactNode;
  variant?: "hero" | "title" | "subtitle" | "body" | "caption" | "label";
  color?: string;
  style?: TextStyle;
  shadow?: boolean;
  accent?: boolean;
  numberOfLines?: number;
}

export function PremiumText({ children, variant = "body", color, style, shadow, accent, numberOfLines }: PremiumTextProps) {
  const { colors } = useTheme();

  const variantStyles: Record<string, TextStyle> = {
    hero: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
    title: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
    subtitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
    body: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
    caption: { fontSize: 12, fontFamily: "Inter_400Regular" },
    label: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, textTransform: "uppercase" },
  };

  const shadowStyle: TextStyle = shadow ? {
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  } : {};

  const textColor = accent ? colors.accent : (color || colors.text);

  return (
    <Text
      style={[variantStyles[variant], { color: textColor }, shadowStyle, style]}
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
}
