import React from "react";
import {
  View, StyleSheet, FlatList, Platform,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { GlassCard } from "@/components/GlassCard";
import { PremiumText } from "@/components/PremiumText";
import { CardSkeleton } from "@/components/SkeletonLoader";
import { getQueryFn } from "@/lib/query-client";

export default function DealsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const { data: deals, isLoading } = useQuery<any[]>({
    queryKey: ["/api/deals"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const renderDeal = ({ item }: { item: any }) => (
    <GlassCard noPadding style={styles.dealCard}>
      <Image source={{ uri: item.imageUrl }} style={styles.dealImage} contentFit="cover" />
      <View style={styles.dealInfo}>
        <View style={styles.dealHeader}>
          <View style={{ flex: 1 }}>
            <PremiumText variant="subtitle" numberOfLines={1}>{item.courseName}</PremiumText>
            <PremiumText variant="body" color={colors.primary} numberOfLines={1}>{item.title}</PremiumText>
          </View>
          {item.isHot && (
            <View style={[styles.hotBadge, { backgroundColor: colors.error }]}>
              <Ionicons name="flame" size={14} color="#fff" />
            </View>
          )}
        </View>
        <PremiumText variant="caption" color={colors.textSecondary} numberOfLines={2}>
          {item.description}
        </PremiumText>
        <View style={styles.priceRow}>
          <PremiumText variant="caption" color={colors.textMuted} style={{ textDecorationLine: "line-through" }}>
            ${item.originalPrice}
          </PremiumText>
          <PremiumText variant="title" style={{ color: colors.success }}>
            ${item.dealPrice}
          </PremiumText>
          <View style={[styles.discountBadge, { backgroundColor: colors.success + "20" }]}>
            <PremiumText variant="caption" style={{ color: colors.success }}>
              {item.discountPercent}% OFF
            </PremiumText>
          </View>
        </View>
      </View>
    </GlassCard>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + webTopInset + 10 }]}>
        <PremiumText variant="hero">Deals</PremiumText>
        <PremiumText variant="caption" color={colors.textMuted}>Exclusive savings</PremiumText>
      </View>

      {isLoading ? (
        <View style={{ padding: 16 }}>
          <CardSkeleton />
          <CardSkeleton />
        </View>
      ) : (
        <FlatList
          data={deals || []}
          renderItem={renderDeal}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          scrollEnabled={(deals || []).length > 0}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="pricetag-outline" size={48} color={colors.textMuted} />
              <PremiumText variant="body" color={colors.textMuted}>No deals available</PremiumText>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  list: { paddingHorizontal: 16, gap: 14, paddingBottom: 100 },
  dealCard: { overflow: "hidden" },
  dealImage: { width: "100%", height: 130, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  dealInfo: { padding: 14, gap: 8 },
  dealHeader: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  hotBadge: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  discountBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
});
