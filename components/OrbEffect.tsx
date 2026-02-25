import React, { useEffect } from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, interpolate } from "react-native-reanimated";
import { useTheme } from "@/contexts/ThemeContext";

interface OrbEffectProps {
  style?: ViewStyle;
  color?: string;
  size?: number;
}

export function OrbEffect({ style, color, size = 200 }: OrbEffectProps) {
  const { colors } = useTheme();
  const progress = useSharedValue(0);
  const orbColor = color || colors.primary;

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 4000 }), -1, true);
  }, []);

  const orbStyle1 = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [-20, 20]) },
      { translateY: interpolate(progress.value, [0, 1], [-10, 15]) },
      { scale: interpolate(progress.value, [0, 0.5, 1], [1, 1.15, 1]) },
    ],
    opacity: interpolate(progress.value, [0, 0.5, 1], [0.3, 0.5, 0.3]),
  }));

  const orbStyle2 = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [15, -25]) },
      { translateY: interpolate(progress.value, [0, 1], [10, -20]) },
      { scale: interpolate(progress.value, [0, 0.5, 1], [1.1, 0.9, 1.1]) },
    ],
    opacity: interpolate(progress.value, [0, 0.5, 1], [0.2, 0.4, 0.2]),
  }));

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      <Animated.View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: orbColor,
          },
          styles.orb,
          orbStyle1,
        ]}
      />
      <Animated.View
        style={[
          {
            width: size * 0.7,
            height: size * 0.7,
            borderRadius: size * 0.35,
            backgroundColor: orbColor,
          },
          styles.orb,
          styles.orbOffset,
          orbStyle2,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  orb: {
    position: "absolute",
  },
  orbOffset: {
    right: -20,
    bottom: -20,
  },
});
