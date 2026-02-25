import React from "react";
import { View, StyleSheet, Pressable, Platform, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { useTheme } from "@/contexts/ThemeContext";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  intensity?: number;
  noPadding?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function GlassCard({ children, style, onPress, intensity = 40, noPadding }: GlassCardProps) {
  const { colors, isDark } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const cardStyle: ViewStyle = {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.glassBorder,
    ...style,
  };

  const innerContent = (
    <View style={[styles.inner, !noPadding && styles.padded]}>
      {children}
    </View>
  );

  if (Platform.OS === "ios") {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[cardStyle, animatedStyle]}
        disabled={!onPress}
      >
        <BlurView intensity={intensity} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glassBg }]} />
        {innerContent}
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[cardStyle, { backgroundColor: colors.card }, animatedStyle]}
      disabled={!onPress}
    >
      {innerContent}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  inner: {
    flex: 1,
  },
  padded: {
    padding: 16,
  },
});
