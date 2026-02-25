import React, { useRef, useState, useCallback } from "react";
import { View, FlatList, StyleSheet, Dimensions, ViewStyle, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface CarouselProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemWidth?: number;
  gap?: number;
  style?: ViewStyle;
  showDots?: boolean;
}

export function Carousel<T>({ data, renderItem, itemWidth, gap = 12, style, showDots = true }: CarouselProps<T>) {
  const { colors } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const calculatedWidth = itemWidth || SCREEN_WIDTH - 48;

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = event.nativeEvent.contentOffset.x;
    const index = Math.round(offset / (calculatedWidth + gap));
    setActiveIndex(index);
  }, [calculatedWidth, gap]);

  return (
    <View style={style}>
      <FlatList
        data={data}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={calculatedWidth + gap}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 4, gap }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        scrollEnabled={data.length > 0}
        renderItem={({ item, index }) => (
          <View style={{ width: calculatedWidth }}>
            {renderItem(item, index)}
          </View>
        )}
        keyExtractor={(_, index) => String(index)}
      />
      {showDots && data.length > 1 && (
        <View style={styles.dots}>
          {data.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: index === activeIndex ? colors.primary : colors.textMuted,
                  opacity: index === activeIndex ? 1 : 0.3,
                  width: index === activeIndex ? 20 : 6,
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    gap: 4,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
