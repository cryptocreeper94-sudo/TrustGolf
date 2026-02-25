import React from "react";
import { View, StyleSheet, ViewStyle, ScrollView, Platform } from "react-native";

interface BentoGridProps {
  children: React.ReactNode;
  columns?: number;
  gap?: number;
  style?: ViewStyle;
}

export function BentoGrid({ children, columns = 3, gap = 12, style }: BentoGridProps) {
  const childArray = React.Children.toArray(children);

  return (
    <View style={[styles.grid, { gap }, style]}>
      {childArray.map((child, index) => (
        <View key={index} style={{ flex: 1, minWidth: `${Math.floor(100 / columns) - 2}%` as any }}>
          {child}
        </View>
      ))}
    </View>
  );
}

interface BentoRowProps {
  children: React.ReactNode;
  gap?: number;
  style?: ViewStyle;
}

export function BentoRow({ children, gap = 12, style }: BentoRowProps) {
  return (
    <View style={[styles.row, { gap }, style]}>
      {children}
    </View>
  );
}

interface BentoCellProps {
  children: React.ReactNode;
  flex?: number;
  style?: ViewStyle;
}

export function BentoCell({ children, flex = 1, style }: BentoCellProps) {
  return (
    <View style={[{ flex }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  row: {
    flexDirection: "row",
  },
});
