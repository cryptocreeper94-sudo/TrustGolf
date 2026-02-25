import React, { useEffect } from "react";
import { View, ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, interpolate } from "react-native-reanimated";
import { useTheme } from "@/contexts/ThemeContext";

interface SkeletonLoaderProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonLoader({ width, height, borderRadius = 12, style }: SkeletonLoaderProps) {
  const { colors } = useTheme();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 1200 }), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.4, 0.8]),
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.skeleton,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function CardSkeleton() {
  return (
    <View style={{ gap: 8, padding: 16 }}>
      <SkeletonLoader width="100%" height={120} borderRadius={16} />
      <SkeletonLoader width="70%" height={18} />
      <SkeletonLoader width="40%" height={14} />
    </View>
  );
}
