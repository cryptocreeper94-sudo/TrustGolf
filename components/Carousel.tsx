import React, { useRef, useState, useCallback } from "react";
import { View, FlatList, StyleSheet, useWindowDimensions, ViewStyle, NativeSyntheticEvent, NativeScrollEvent, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";

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
  const flatListRef = useRef<FlatList>(null);
  const { width: windowWidth } = useWindowDimensions();
  const calculatedWidth = itemWidth || windowWidth - 48;

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = event.nativeEvent.contentOffset.x;
    const index = Math.round(offset / (calculatedWidth + gap));
    setActiveIndex(index);
  }, [calculatedWidth, gap]);

  const scrollTo = useCallback((direction: "prev" | "next") => {
    const newIndex = direction === "next"
      ? Math.min(activeIndex + 1, data.length - 1)
      : Math.max(activeIndex - 1, 0);
    flatListRef.current?.scrollToOffset({
      offset: newIndex * (calculatedWidth + gap),
      animated: true,
    });
    setActiveIndex(newIndex);
  }, [activeIndex, data.length, calculatedWidth, gap]);

  return (
    <View style={style}>
      <FlatList
        ref={flatListRef}
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
        <View style={styles.controls}>
          <Pressable
            onPress={() => scrollTo("prev")}
            style={[styles.arrowBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, opacity: activeIndex === 0 ? 0.35 : 1 }]}
            disabled={activeIndex === 0}
          >
            <Ionicons name="chevron-back" size={16} color={colors.text} />
          </Pressable>
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
          <Pressable
            onPress={() => scrollTo("next")}
            style={[styles.arrowBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, opacity: activeIndex >= data.length - 1 ? 0.35 : 1 }]}
            disabled={activeIndex >= data.length - 1}
          >
            <Ionicons name="chevron-forward" size={16} color={colors.text} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    gap: 12,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  arrowBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});
