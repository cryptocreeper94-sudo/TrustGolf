import React, { useState, useEffect, useCallback } from "react";
import {
  View, StyleSheet, ScrollView, Pressable, Platform, useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { useAuth } from "@/contexts/AuthContext";
import { PremiumText } from "@/components/PremiumText";
import { apiRequest } from "@/lib/query-client";
import {
  getDivision, getLevelFromXp, ACHIEVEMENTS, VENUE_DEFS, DIVISIONS,
  RARITY_COLORS, ALL_EQUIPMENT, DRIVERS, BALLS,
  type AchievementDef,
} from "@shared/bomber-data";

interface ProfileData {
  profile: any;
  equipment: any[];
  chests: any[];
  levelInfo: { level: number; currentXp: number; nextLevelXp: number };
  division: { id: string; name: string; color: string; icon: string };
}

export default function BomberDashboard() {
  const { user, isLoggedIn } = useAuth();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [venueUnlocks, setVenueUnlocks] = useState<string[]>(["driving_range"]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [profileRes, lbRes, achRes, venueRes] = await Promise.all([
        apiRequest("GET", `/api/bomber/profile/${user.id}`),
        apiRequest("GET", "/api/bomber/leaderboard"),
        apiRequest("GET", `/api/bomber/achievements/${user.id}`),
        apiRequest("GET", `/api/bomber/venues/unlocks/${user.id}`),
      ]);
      const [profile, lb, ach, venues] = await Promise.all([
        profileRes.json(), lbRes.json(), achRes.json(), venueRes.json(),
      ]);
      setProfileData(profile);
      setLeaderboard(lb);
      setAchievements(ach.map((a: any) => a.achievementId));
      setVenueUnlocks(["driving_range", ...venues.map((v: any) => v.venueId)]);
    } catch (e) {}
    setLoading(false);
  }, [user]);

  useEffect(() => { if (isLoggedIn) loadAll(); }, [isLoggedIn, loadAll]);

  if (!isLoggedIn) {
    return (
      <View style={[s.screen, { paddingTop: insets.top + webTopInset }]}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <PremiumText variant="subtitle" color="#fff" style={{ fontSize: 18 }}>Dashboard</PremiumText>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 40 }}>
          <Ionicons name="lock-closed" size={48} color="rgba(255,255,255,0.2)" />
          <PremiumText variant="body" color="rgba(255,255,255,0.5)" style={{ textAlign: "center" }}>Sign in to view your Bomber dashboard</PremiumText>
          <Pressable onPress={() => router.push("/login")} style={{ backgroundColor: "#FFD700", paddingHorizontal: 32, paddingVertical: 14, borderRadius: 24 }}>
            <PremiumText variant="body" color="#1B5E20" style={{ fontWeight: "800" }}>Sign In</PremiumText>
          </Pressable>
        </View>
      </View>
    );
  }

  const p = profileData?.profile;
  const level = profileData?.levelInfo?.level || 1;
  const division = profileData?.division || getDivision(0);
  const levelInfo = profileData?.levelInfo || getLevelFromXp(0);
  const xpProgress = levelInfo.nextLevelXp > 0 ? (levelInfo.currentXp / levelInfo.nextLevelXp) * 100 : 0;
  const ownedEquipment = profileData?.equipment || [];
  const userRank = leaderboard.findIndex((e) => e.userId === user?.id) + 1;
  const userTopDrives = leaderboard.filter((e) => e.userId === user?.id).slice(0, 5);
  const nextDiv = DIVISIONS.find((d) => d.minXp > (p?.xp || 0));
  const totalEquipmentCount = DRIVERS.length + BALLS.length;
  const uniqueOwned = new Set(ownedEquipment.map((e: any) => `${e.type}_${e.equipmentId}`)).size;

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + webTopInset, paddingBottom: insets.bottom + 40 }}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <PremiumText variant="subtitle" color="#fff" style={{ fontSize: 18, letterSpacing: 1 }}>Dashboard</PremiumText>
          <View style={{ width: 40 }} />
        </View>

        <Animated.View entering={FadeIn.duration(400)} style={s.heroSection}>
          <View style={[s.divBadge, { borderColor: division.color }]}>
            <Ionicons name={division.icon as any} size={28} color={division.color} />
          </View>
          <PremiumText variant="hero" color="#fff" style={{ fontSize: 28, marginTop: 12 }}>{user?.username || "Player"}</PremiumText>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
            <PremiumText variant="caption" color={division.color} style={{ fontSize: 13, fontWeight: "700" }}>{division.name} Division</PremiumText>
            <PremiumText variant="caption" color="rgba(255,255,255,0.3)" style={{ fontSize: 12 }}>Level {level}</PremiumText>
          </View>
          <View style={s.xpBarWrap}>
            <View style={[s.xpBarFill, { width: `${xpProgress}%`, backgroundColor: division.color }]} />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", width: "100%", marginTop: 4 }}>
            <PremiumText variant="caption" color="rgba(255,255,255,0.3)" style={{ fontSize: 9 }}>{levelInfo.currentXp} XP</PremiumText>
            <PremiumText variant="caption" color="rgba(255,255,255,0.3)" style={{ fontSize: 9 }}>{levelInfo.nextLevelXp} XP</PremiumText>
          </View>
          {nextDiv && (
            <PremiumText variant="caption" color="rgba(255,255,255,0.25)" style={{ fontSize: 10, marginTop: 4 }}>
              {nextDiv.minXp - (p?.xp || 0)} XP to {nextDiv.name}
            </PremiumText>
          )}
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(100)} style={s.statsGrid}>
          {[
            { label: "TOTAL DRIVES", value: p?.totalDrives || 0, icon: "golf", color: "#4CAF50" },
            { label: "BEST DISTANCE", value: p?.bestDistance ? `${p.bestDistance}y` : "—", icon: "rocket", color: "#FF9800" },
            { label: "GLOBAL RANK", value: userRank > 0 ? `#${userRank}` : "—", icon: "podium", color: "#2196F3" },
            { label: "STREAK", value: `${p?.currentStreak || 0}d`, icon: "flame", color: "#FF5252" },
            { label: "COINS", value: p?.coins || 0, icon: "logo-bitcoin", color: "#FFD700" },
            { label: "GEMS", value: p?.gems || 0, icon: "diamond", color: "#B9F2FF" },
          ].map((stat, i) => (
            <View key={stat.label} style={s.statCard}>
              <View style={[s.statIcon, { backgroundColor: stat.color + "15" }]}>
                <Ionicons name={stat.icon as any} size={18} color={stat.color} />
              </View>
              <PremiumText variant="title" color="#fff" style={{ fontSize: 22, marginTop: 8 }}>{stat.value}</PremiumText>
              <PremiumText variant="caption" color="rgba(255,255,255,0.35)" style={{ fontSize: 9, letterSpacing: 1 }}>{stat.label}</PremiumText>
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(200)} style={s.section}>
          <PremiumText variant="caption" color="rgba(255,255,255,0.4)" style={{ fontSize: 10, letterSpacing: 2, marginBottom: 12 }}>TOP DRIVES</PremiumText>
          {userTopDrives.length === 0 ? (
            <View style={s.emptyState}>
              <Ionicons name="golf-outline" size={32} color="rgba(255,255,255,0.15)" />
              <PremiumText variant="caption" color="rgba(255,255,255,0.3)" style={{ fontSize: 12 }}>No drives recorded yet</PremiumText>
            </View>
          ) : (
            userTopDrives.map((drive: any, i: number) => (
              <View key={drive.id || i} style={s.driveRow}>
                <View style={[s.driveRank, { backgroundColor: i === 0 ? "rgba(255,215,0,0.15)" : "rgba(255,255,255,0.04)" }]}>
                  <PremiumText variant="title" color={i === 0 ? "#FFD700" : "rgba(255,255,255,0.5)"} style={{ fontSize: 14 }}>{i + 1}</PremiumText>
                </View>
                <View style={{ flex: 1 }}>
                  <PremiumText variant="body" color="#fff" style={{ fontWeight: "700", fontSize: 16 }}>{drive.distance} yds</PremiumText>
                  <PremiumText variant="caption" color="rgba(255,255,255,0.35)" style={{ fontSize: 10 }}>
                    {drive.ballSpeed}mph &middot; {drive.launchAngle}&deg; &middot; {drive.nightMode ? "Night" : "Day"}
                  </PremiumText>
                </View>
                {drive.venueId && drive.venueId !== "driving_range" && (
                  <View style={{ backgroundColor: "rgba(255,255,255,0.04)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                    <PremiumText variant="caption" color="rgba(255,255,255,0.4)" style={{ fontSize: 9 }}>
                      {VENUE_DEFS.find((v) => v.venueId === drive.venueId)?.name?.split(" ")[0] || drive.venueId}
                    </PremiumText>
                  </View>
                )}
              </View>
            ))
          )}
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(250)} style={s.section}>
          <PremiumText variant="caption" color="rgba(255,255,255,0.4)" style={{ fontSize: 10, letterSpacing: 2, marginBottom: 12 }}>DIVISION PROGRESS</PremiumText>
          <View style={s.divProgressWrap}>
            {DIVISIONS.map((d, i) => {
              const isActive = division.id === d.id;
              const isPast = (p?.xp || 0) >= d.minXp;
              return (
                <View key={d.id} style={{ flex: 1, alignItems: "center" }}>
                  <View style={[s.divDot, { backgroundColor: isPast ? d.color : "rgba(255,255,255,0.1)", borderWidth: isActive ? 2 : 0, borderColor: "#fff" }]}>
                    {isActive && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" }} />}
                  </View>
                  <PremiumText variant="caption" color={isPast ? d.color : "rgba(255,255,255,0.2)"} style={{ fontSize: 8, marginTop: 4, fontWeight: isActive ? "800" : "400" }}>{d.name}</PremiumText>
                </View>
              );
            })}
          </View>
          <View style={{ height: 3, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 2, marginTop: 8, marginHorizontal: 20 }}>
            <View style={{ height: "100%", borderRadius: 2, backgroundColor: division.color, width: `${Math.min(100, ((p?.xp || 0) / (DIVISIONS[DIVISIONS.length - 1].minXp || 50000)) * 100)}%` }} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(300)} style={s.section}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <PremiumText variant="caption" color="rgba(255,255,255,0.4)" style={{ fontSize: 10, letterSpacing: 2 }}>ACHIEVEMENTS</PremiumText>
            <PremiumText variant="caption" color="rgba(255,255,255,0.3)" style={{ fontSize: 11 }}>{achievements.length}/{ACHIEVEMENTS.length}</PremiumText>
          </View>
          <View style={{ height: 6, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 3, marginBottom: 12 }}>
            <View style={{ height: "100%", borderRadius: 3, backgroundColor: "#FF9800", width: `${(achievements.length / ACHIEVEMENTS.length) * 100}%` }} />
          </View>
          <View style={s.achGrid}>
            {ACHIEVEMENTS.slice(0, 12).map((a) => {
              const unlocked = achievements.includes(a.id);
              return (
                <View key={a.id} style={[s.achBadge, { opacity: unlocked ? 1 : 0.25 }]}>
                  <View style={[s.achIcon, { backgroundColor: unlocked ? a.color + "20" : "rgba(255,255,255,0.05)" }]}>
                    <Ionicons name={a.icon as any} size={16} color={unlocked ? a.color : "rgba(255,255,255,0.3)"} />
                  </View>
                  <PremiumText variant="caption" color={unlocked ? "#fff" : "rgba(255,255,255,0.3)"} style={{ fontSize: 8, textAlign: "center" }} numberOfLines={1}>{a.name}</PremiumText>
                </View>
              );
            })}
          </View>
          {ACHIEVEMENTS.length > 12 && (
            <PremiumText variant="caption" color="rgba(255,255,255,0.2)" style={{ fontSize: 10, textAlign: "center", marginTop: 8 }}>+{ACHIEVEMENTS.length - 12} more</PremiumText>
          )}
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(350)} style={s.section}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <PremiumText variant="caption" color="rgba(255,255,255,0.4)" style={{ fontSize: 10, letterSpacing: 2 }}>EQUIPMENT</PremiumText>
            <PremiumText variant="caption" color="rgba(255,255,255,0.3)" style={{ fontSize: 11 }}>{uniqueOwned}/{totalEquipmentCount}</PremiumText>
          </View>
          <View style={s.eqRow}>
            {ALL_EQUIPMENT.slice(0, 8).map((eq: any) => {
              const owned = ownedEquipment.some((o: any) => o.equipmentId === eq.id && o.type === eq.type);
              const color = RARITY_COLORS[eq.rarity];
              return (
                <View key={`${eq.type}_${eq.id}`} style={[s.eqItem, { borderColor: owned ? color + "40" : "rgba(255,255,255,0.06)", opacity: owned ? 1 : 0.3 }]}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, marginBottom: 4 }} />
                  <PremiumText variant="caption" color={owned ? "#fff" : "rgba(255,255,255,0.3)"} style={{ fontSize: 8, textAlign: "center" }} numberOfLines={1}>{eq.name}</PremiumText>
                  <PremiumText variant="caption" color={color} style={{ fontSize: 7, textTransform: "uppercase", fontWeight: "800" }}>{eq.rarity}</PremiumText>
                </View>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(400)} style={s.section}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <PremiumText variant="caption" color="rgba(255,255,255,0.4)" style={{ fontSize: 10, letterSpacing: 2 }}>VENUES</PremiumText>
            <PremiumText variant="caption" color="rgba(255,255,255,0.3)" style={{ fontSize: 11 }}>{venueUnlocks.length}/{VENUE_DEFS.length}</PremiumText>
          </View>
          <View style={{ gap: 6 }}>
            {VENUE_DEFS.slice(0, 6).map((v) => {
              const unlocked = venueUnlocks.includes(v.venueId);
              const tierColor = v.tier === "legendary" ? "#FF4500" : v.tier === "premium" ? "#9C27B0" : v.tier === "standard" ? "#2196F3" : "#4CAF50";
              return (
                <View key={v.venueId} style={[s.venueRow, { opacity: unlocked ? 1 : 0.4 }]}>
                  <View style={[s.venueDot, { backgroundColor: tierColor }]} />
                  <View style={{ flex: 1 }}>
                    <PremiumText variant="body" color="#fff" style={{ fontWeight: "600", fontSize: 13 }}>{v.name}</PremiumText>
                    <PremiumText variant="caption" color="rgba(255,255,255,0.35)" style={{ fontSize: 9 }}>Hole #{v.holeNumber}</PremiumText>
                  </View>
                  {unlocked ? (
                    <Ionicons name="checkmark-circle" size={18} color={tierColor} />
                  ) : (
                    <Ionicons name="lock-closed" size={14} color="rgba(255,255,255,0.2)" />
                  )}
                </View>
              );
            })}
            {VENUE_DEFS.length > 6 && (
              <PremiumText variant="caption" color="rgba(255,255,255,0.2)" style={{ fontSize: 10, textAlign: "center", marginTop: 4 }}>+{VENUE_DEFS.length - 6} more venues</PremiumText>
            )}
          </View>
        </Animated.View>

        <View style={{ alignItems: "center", marginTop: 24, paddingHorizontal: 24 }}>
          <Pressable onPress={() => router.push("/bomber")} style={s.playBtn}>
            <Ionicons name="flash" size={20} color="#1B5E20" />
            <PremiumText variant="body" color="#1B5E20" style={{ fontWeight: "800", fontSize: 15 }}>PLAY BOMBER</PremiumText>
          </Pressable>
        </View>

        <View style={{ alignItems: "center", marginTop: 32, gap: 4 }}>
          <PremiumText variant="caption" color="rgba(255,255,255,0.12)" style={{ fontSize: 9 }}>DarkWave Studios LLC &copy; 2026</PremiumText>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#050518" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" },
  heroSection: { alignItems: "center", paddingHorizontal: 24, paddingBottom: 24 },
  divBadge: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, backgroundColor: "rgba(255,255,255,0.04)", alignItems: "center", justifyContent: "center" },
  xpBarWrap: { width: "100%", height: 6, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 3, marginTop: 16, overflow: "hidden" },
  xpBarFill: { height: "100%", borderRadius: 3 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 10, marginBottom: 8 },
  statCard: { width: "31%", flexGrow: 1, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", padding: 14, alignItems: "center" },
  statIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  section: { marginHorizontal: 16, marginTop: 20, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", padding: 16 },
  emptyState: { alignItems: "center", gap: 8, paddingVertical: 24 },
  driveRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,0.06)" },
  driveRank: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  divProgressWrap: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 8 },
  divDot: { width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  achGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  achBadge: { width: "22%", flexGrow: 1, alignItems: "center", gap: 4, paddingVertical: 8 },
  achIcon: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  eqRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  eqItem: { width: "22%", flexGrow: 1, alignItems: "center", gap: 4, paddingVertical: 10, borderRadius: 10, borderWidth: 1, backgroundColor: "rgba(255,255,255,0.02)" },
  venueRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,0.04)" },
  venueDot: { width: 8, height: 8, borderRadius: 4 },
  playBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "#FFD700", paddingHorizontal: 40, paddingVertical: 16, borderRadius: 28, width: "100%" },
});
