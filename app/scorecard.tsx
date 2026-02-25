import React, { useState, useEffect, useRef } from "react";
import {
  View, ScrollView, StyleSheet, Pressable, TextInput, Platform,
  KeyboardAvoidingView, Alert, Dimensions,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { PremiumText } from "@/components/PremiumText";
import { apiRequest, getQueryFn } from "@/lib/query-client";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CELL_SIZE = Math.max(36, Math.min(44, (SCREEN_WIDTH - 80) / 10));
const LABEL_WIDTH = 40;

type HoleInfo = { hole: number; par: number; yardage: number; handicap: number };
type HoleData = { tees: string; holes: HoleInfo[] };

function getScoreColor(score: number, par: number, colors: any): string {
  const diff = score - par;
  if (diff <= -2) return "#FFD700";
  if (diff === -1) return "#E53935";
  if (diff === 0) return colors.text;
  if (diff === 1) return "#1E88E5";
  return "#7B1FA2";
}

function getScoreBg(score: number, par: number): string {
  const diff = score - par;
  if (diff <= -2) return "rgba(255,215,0,0.15)";
  if (diff === -1) return "rgba(229,57,53,0.10)";
  if (diff === 0) return "transparent";
  if (diff === 1) return "rgba(30,136,229,0.10)";
  return "rgba(123,31,162,0.10)";
}

function getScoreLabel(score: number, par: number): string {
  const diff = score - par;
  if (diff <= -3) return "Albatross";
  if (diff === -2) return "Eagle";
  if (diff === -1) return "Birdie";
  if (diff === 0) return "Par";
  if (diff === 1) return "Bogey";
  if (diff === 2) return "Double";
  if (diff === 3) return "Triple";
  return `+${diff}`;
}

export default function ScorecardScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ courseId?: string; courseName?: string }>();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  const courseId = params.courseId ? parseInt(params.courseId) : undefined;

  const { data: course } = useQuery<any>({
    queryKey: ["/api/courses/" + courseId],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!courseId,
  });

  const holeData: HoleData | null = course?.holeData || null;
  const holes = holeData?.holes || [];
  const front9 = holes.slice(0, 9);
  const back9 = holes.slice(9, 18);

  const [scores, setScores] = useState<(number | null)[]>(Array(18).fill(null));
  const [putts, setPutts] = useState<(number | null)[]>(Array(18).fill(null));
  const [activeHole, setActiveHole] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [showStats, setShowStats] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const frontScore = scores.slice(0, 9).reduce((a, b) => (a || 0) + (b || 0), 0) || 0;
  const backScore = scores.slice(9, 18).reduce((a, b) => (a || 0) + (b || 0), 0) || 0;
  const totalScore = frontScore + backScore;
  const frontPar = front9.reduce((a, h) => a + h.par, 0);
  const backPar = back9.reduce((a, h) => a + h.par, 0);
  const totalPar = frontPar + backPar;
  const filledHoles = scores.filter((s) => s !== null).length;
  const totalPutts = putts.reduce((a, b) => (a || 0) + (b || 0), 0) || 0;

  const setScore = (index: number, val: string) => {
    const num = parseInt(val);
    const newScores = [...scores];
    newScores[index] = isNaN(num) ? null : Math.min(Math.max(num, 1), 15);
    setScores(newScores);
  };

  const setPuttForHole = (index: number, val: string) => {
    const num = parseInt(val);
    const newPutts = [...putts];
    newPutts[index] = isNaN(num) ? null : Math.min(Math.max(num, 0), 6);
    setPutts(newPutts);
  };

  const quickScore = (index: number, value: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newScores = [...scores];
    newScores[index] = value;
    setScores(newScores);
    if (index < 17) {
      setActiveHole(index + 1);
    } else {
      setActiveHole(null);
    }
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/rounds", {
        userId: user?.id,
        courseId: courseId,
        courseName: course?.name || params.courseName || "Unknown Course",
        totalScore,
        par: totalPar,
        holes: 18,
        scores: scores,
        putts: totalPutts || undefined,
        notes: notes.trim() || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rounds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    },
  });

  const canSave = filledHoles >= 9 && totalScore > 0;

  const cardBg = isDark ? "#141E14" : "#FFFFFF";
  const headerBg = isDark ? "#1B5E20" : "#1B5E20";
  const rowAltBg = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  const renderNineHoles = (nineHoles: HoleInfo[], startIndex: number, label: string, subtotalScore: number, subtotalPar: number) => (
    <View style={[styles.cardSection, { backgroundColor: cardBg, borderColor }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false}>
        <View>
          <View style={[styles.row, { backgroundColor: headerBg }]}>
            <View style={[styles.labelCell, { width: LABEL_WIDTH }]}>
              <PremiumText variant="caption" color="#fff" style={styles.cellText}>HOLE</PremiumText>
            </View>
            {nineHoles.map((h) => (
              <View key={h.hole} style={[styles.cell, { width: CELL_SIZE }]}>
                <PremiumText variant="caption" color="#fff" style={[styles.cellText, { fontWeight: "700" }]}>
                  {h.hole}
                </PremiumText>
              </View>
            ))}
            <View style={[styles.cell, { width: CELL_SIZE + 4, backgroundColor: "rgba(0,0,0,0.2)" }]}>
              <PremiumText variant="caption" color="#fff" style={[styles.cellText, { fontWeight: "800" }]}>
                {label}
              </PremiumText>
            </View>
          </View>

          <View style={[styles.row, { backgroundColor: isDark ? "rgba(197,165,90,0.12)" : "rgba(197,165,90,0.08)" }]}>
            <View style={[styles.labelCell, { width: LABEL_WIDTH, borderColor }]}>
              <PremiumText variant="caption" color={colors.accent} style={styles.cellText}>YDS</PremiumText>
            </View>
            {nineHoles.map((h) => (
              <View key={h.hole} style={[styles.cell, { width: CELL_SIZE, borderColor }]}>
                <PremiumText variant="caption" color={colors.textMuted} style={[styles.cellText, { fontSize: 10 }]}>
                  {h.yardage}
                </PremiumText>
              </View>
            ))}
            <View style={[styles.cell, { width: CELL_SIZE + 4, borderColor, backgroundColor: isDark ? "rgba(197,165,90,0.18)" : "rgba(197,165,90,0.12)" }]}>
              <PremiumText variant="caption" color={colors.accent} style={[styles.cellText, { fontSize: 10, fontWeight: "600" }]}>
                {nineHoles.reduce((a, h) => a + h.yardage, 0)}
              </PremiumText>
            </View>
          </View>

          <View style={[styles.row, { backgroundColor: isDark ? "rgba(27,94,32,0.12)" : "rgba(27,94,32,0.05)" }]}>
            <View style={[styles.labelCell, { width: LABEL_WIDTH, borderColor }]}>
              <PremiumText variant="caption" color={colors.primary} style={[styles.cellText, { fontWeight: "700" }]}>PAR</PremiumText>
            </View>
            {nineHoles.map((h) => (
              <View key={h.hole} style={[styles.cell, { width: CELL_SIZE, borderColor }]}>
                <PremiumText variant="caption" color={colors.primary} style={[styles.cellText, { fontWeight: "600" }]}>
                  {h.par}
                </PremiumText>
              </View>
            ))}
            <View style={[styles.cell, { width: CELL_SIZE + 4, borderColor, backgroundColor: isDark ? "rgba(27,94,32,0.20)" : "rgba(27,94,32,0.10)" }]}>
              <PremiumText variant="caption" color={colors.primary} style={[styles.cellText, { fontWeight: "800" }]}>
                {subtotalPar}
              </PremiumText>
            </View>
          </View>

          <View style={[styles.row, { backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)" }]}>
            <View style={[styles.labelCell, { width: LABEL_WIDTH, borderColor }]}>
              <PremiumText variant="caption" color={colors.textMuted} style={styles.cellText}>HCP</PremiumText>
            </View>
            {nineHoles.map((h) => (
              <View key={h.hole} style={[styles.cell, { width: CELL_SIZE, borderColor }]}>
                <PremiumText variant="caption" color={colors.textMuted} style={[styles.cellText, { fontSize: 9 }]}>
                  {h.handicap}
                </PremiumText>
              </View>
            ))}
            <View style={[styles.cell, { width: CELL_SIZE + 4, borderColor }]} />
          </View>

          <View style={[styles.row, { minHeight: CELL_SIZE + 6, backgroundColor: rowAltBg }]}>
            <View style={[styles.labelCell, { width: LABEL_WIDTH, borderColor }]}>
              <Ionicons name="person" size={12} color={colors.primary} />
            </View>
            {nineHoles.map((h, i) => {
              const idx = startIndex + i;
              const score = scores[idx];
              const isActive = activeHole === idx;
              return (
                <Pressable
                  key={h.hole}
                  onPress={() => { setActiveHole(idx); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  style={[
                    styles.cell,
                    {
                      width: CELL_SIZE,
                      borderColor,
                      backgroundColor: score != null ? getScoreBg(score, h.par) : "transparent",
                      borderWidth: isActive ? 2 : 0.5,
                      borderColor: isActive ? colors.primary : borderColor,
                    },
                  ]}
                >
                  {score != null ? (
                    <PremiumText
                      variant="caption"
                      color={getScoreColor(score, h.par, colors)}
                      style={[styles.cellText, { fontWeight: "800", fontSize: 15 }]}
                    >
                      {score}
                    </PremiumText>
                  ) : (
                    <PremiumText variant="caption" color={colors.textMuted} style={[styles.cellText, { fontSize: 10 }]}>
                      —
                    </PremiumText>
                  )}
                </Pressable>
              );
            })}
            <View style={[styles.cell, { width: CELL_SIZE + 4, borderColor, backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }]}>
              <PremiumText
                variant="caption"
                color={subtotalScore > subtotalPar ? "#1E88E5" : subtotalScore < subtotalPar ? "#E53935" : colors.text}
                style={[styles.cellText, { fontWeight: "800", fontSize: 15 }]}
              >
                {subtotalScore || "—"}
              </PremiumText>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.header, { paddingTop: insets.top + webTopInset + 8, backgroundColor: headerBg }]}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <PremiumText variant="subtitle" color="#fff" style={{ fontSize: 15 }} numberOfLines={1}>
            {course?.name || params.courseName || "Scorecard"}
          </PremiumText>
          {holeData && (
            <PremiumText variant="caption" color="rgba(255,255,255,0.7)" style={{ fontSize: 10 }}>
              {holeData.tees} Tees • Par {totalPar} • {holes.reduce((a, h) => a + h.yardage, 0)} yds
            </PremiumText>
          )}
        </View>
        <Pressable
          onPress={() => { if (canSave) mutation.mutate(); }}
          disabled={!canSave || mutation.isPending}
          style={[styles.headerBtn, { opacity: canSave ? 1 : 0.4 }]}
        >
          <PremiumText variant="caption" color="#fff" style={{ fontWeight: "700", fontSize: 13 }}>
            {mutation.isPending ? "..." : "SAVE"}
          </PremiumText>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 + webBottomInset }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {holeData ? (
          <>
            <View style={{ paddingHorizontal: 8, marginTop: 12 }}>
              {renderNineHoles(front9, 0, "OUT", frontScore, frontPar)}
            </View>
            <View style={{ paddingHorizontal: 8, marginTop: 10 }}>
              {renderNineHoles(back9, 9, "IN", backScore, backPar)}
            </View>

            <View style={[styles.totalBar, { backgroundColor: isDark ? "#1A2E1A" : "#E8F5E9", marginHorizontal: 8, borderColor }]}>
              <View style={styles.totalItem}>
                <PremiumText variant="caption" color={colors.textMuted} style={{ fontSize: 10 }}>FRONT</PremiumText>
                <PremiumText variant="title" color={frontScore > frontPar ? "#1E88E5" : frontScore < frontPar ? "#E53935" : colors.text}>
                  {frontScore || "—"}
                </PremiumText>
              </View>
              <View style={[styles.totalDivider, { backgroundColor: borderColor }]} />
              <View style={styles.totalItem}>
                <PremiumText variant="caption" color={colors.textMuted} style={{ fontSize: 10 }}>BACK</PremiumText>
                <PremiumText variant="title" color={backScore > backPar ? "#1E88E5" : backScore < backPar ? "#E53935" : colors.text}>
                  {backScore || "—"}
                </PremiumText>
              </View>
              <View style={[styles.totalDivider, { backgroundColor: borderColor }]} />
              <View style={styles.totalItem}>
                <PremiumText variant="caption" color={colors.textMuted} style={{ fontSize: 10 }}>TOTAL</PremiumText>
                <PremiumText variant="title" style={{ fontSize: 24 }} color={totalScore > totalPar ? "#1E88E5" : totalScore < totalPar ? "#E53935" : colors.text}>
                  {totalScore || "—"}
                </PremiumText>
              </View>
              <View style={[styles.totalDivider, { backgroundColor: borderColor }]} />
              <View style={styles.totalItem}>
                <PremiumText variant="caption" color={colors.textMuted} style={{ fontSize: 10 }}>+/-</PremiumText>
                <PremiumText variant="title" color={totalScore > totalPar ? "#1E88E5" : totalScore < totalPar ? "#E53935" : colors.text}>
                  {totalScore ? (totalScore - totalPar > 0 ? "+" : "") + (totalScore - totalPar) : "E"}
                </PremiumText>
              </View>
            </View>

            {activeHole !== null && holes[activeHole] && (
              <View style={[styles.quickEntry, { backgroundColor: cardBg, borderColor, marginHorizontal: 8 }]}>
                <View style={styles.quickHeader}>
                  <PremiumText variant="subtitle" color={colors.primary}>
                    Hole {holes[activeHole].hole}
                  </PremiumText>
                  <PremiumText variant="caption" color={colors.textMuted}>
                    Par {holes[activeHole].par} • {holes[activeHole].yardage} yds • Hcp {holes[activeHole].handicap}
                  </PremiumText>
                </View>

                <PremiumText variant="caption" color={colors.textMuted} style={{ marginBottom: 6, fontSize: 11 }}>SCORE</PremiumText>
                <View style={styles.quickButtons}>
                  {Array.from({ length: 8 }, (_, i) => {
                    const val = Math.max(1, holes[activeHole].par - 2) + i;
                    if (val > holes[activeHole].par + 4 || val < 1) return null;
                    const isSelected = scores[activeHole] === val;
                    return (
                      <Pressable
                        key={val}
                        onPress={() => quickScore(activeHole, val)}
                        style={[
                          styles.quickBtn,
                          {
                            backgroundColor: isSelected
                              ? getScoreColor(val, holes[activeHole].par, colors)
                              : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                            borderColor: isSelected ? getScoreColor(val, holes[activeHole].par, colors) : borderColor,
                          },
                        ]}
                      >
                        <PremiumText
                          variant="body"
                          color={isSelected ? "#fff" : colors.text}
                          style={{ fontWeight: "700", fontSize: 18 }}
                        >
                          {val}
                        </PremiumText>
                        <PremiumText
                          variant="caption"
                          color={isSelected ? "rgba(255,255,255,0.8)" : colors.textMuted}
                          style={{ fontSize: 8, marginTop: 1 }}
                        >
                          {getScoreLabel(val, holes[activeHole].par)}
                        </PremiumText>
                      </Pressable>
                    );
                  }).filter(Boolean)}
                </View>

                <PremiumText variant="caption" color={colors.textMuted} style={{ marginTop: 12, marginBottom: 6, fontSize: 11 }}>PUTTS</PremiumText>
                <View style={styles.quickButtons}>
                  {[0, 1, 2, 3, 4].map((val) => {
                    const isSelected = putts[activeHole] === val;
                    return (
                      <Pressable
                        key={val}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          const newPutts = [...putts];
                          newPutts[activeHole] = val;
                          setPutts(newPutts);
                        }}
                        style={[
                          styles.puttBtn,
                          {
                            backgroundColor: isSelected
                              ? colors.accent
                              : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                            borderColor: isSelected ? colors.accent : borderColor,
                          },
                        ]}
                      >
                        <PremiumText
                          variant="body"
                          color={isSelected ? "#fff" : colors.text}
                          style={{ fontWeight: "600", fontSize: 16 }}
                        >
                          {val}
                        </PremiumText>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={{ flexDirection: "row", gap: 12, marginTop: 14 }}>
                  {activeHole > 0 && (
                    <Pressable
                      onPress={() => { setActiveHole(activeHole - 1); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                      style={[styles.navBtn, { borderColor }]}
                    >
                      <Ionicons name="chevron-back" size={16} color={colors.textSecondary} />
                      <PremiumText variant="caption" color={colors.textSecondary}>Prev</PremiumText>
                    </Pressable>
                  )}
                  <View style={{ flex: 1 }} />
                  {activeHole < 17 && (
                    <Pressable
                      onPress={() => { setActiveHole(activeHole + 1); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                      style={[styles.navBtn, { borderColor }]}
                    >
                      <PremiumText variant="caption" color={colors.textSecondary}>Next</PremiumText>
                      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                    </Pressable>
                  )}
                </View>
              </View>
            )}

            {activeHole === null && filledHoles === 0 && (
              <View style={{ alignItems: "center", paddingVertical: 20 }}>
                <Ionicons name="golf-outline" size={32} color={colors.textMuted} />
                <PremiumText variant="body" color={colors.textMuted} style={{ marginTop: 8, textAlign: "center" }}>
                  Tap any hole on the scorecard to start entering scores
                </PremiumText>
              </View>
            )}

            <View style={{ paddingHorizontal: 8, marginTop: 10 }}>
              <View style={[styles.legendRow, { borderColor }]}>
                <View style={[styles.legendDot, { backgroundColor: "#FFD700" }]} />
                <PremiumText variant="caption" color={colors.textMuted} style={{ fontSize: 10 }}>Eagle</PremiumText>
                <View style={[styles.legendDot, { backgroundColor: "#E53935", marginLeft: 8 }]} />
                <PremiumText variant="caption" color={colors.textMuted} style={{ fontSize: 10 }}>Birdie</PremiumText>
                <View style={[styles.legendDot, { backgroundColor: colors.text, marginLeft: 8 }]} />
                <PremiumText variant="caption" color={colors.textMuted} style={{ fontSize: 10 }}>Par</PremiumText>
                <View style={[styles.legendDot, { backgroundColor: "#1E88E5", marginLeft: 8 }]} />
                <PremiumText variant="caption" color={colors.textMuted} style={{ fontSize: 10 }}>Bogey</PremiumText>
                <View style={[styles.legendDot, { backgroundColor: "#7B1FA2", marginLeft: 8 }]} />
                <PremiumText variant="caption" color={colors.textMuted} style={{ fontSize: 10 }}>Dbl+</PremiumText>
              </View>
            </View>

            <View style={{ paddingHorizontal: 8, marginTop: 10 }}>
              <View style={[styles.notesCard, { backgroundColor: cardBg, borderColor }]}>
                <PremiumText variant="caption" color={colors.textMuted} style={{ marginBottom: 4, fontSize: 11 }}>ROUND NOTES</PremiumText>
                <TextInput
                  style={[styles.notesInput, { color: colors.text, backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)", borderColor }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="How did the round go?"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={2}
                />
              </View>
            </View>

            {canSave && (
              <View style={{ paddingHorizontal: 8, marginTop: 14 }}>
                <Pressable
                  onPress={() => mutation.mutate()}
                  disabled={mutation.isPending}
                  style={[styles.saveButton, { backgroundColor: colors.primary }]}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <PremiumText variant="body" color="#fff" style={{ fontWeight: "700" }}>
                    {mutation.isPending ? "Saving Round..." : "Save Round"}
                  </PremiumText>
                </Pressable>
              </View>
            )}
          </>
        ) : (
          <View style={{ padding: 20, alignItems: "center" }}>
            <Ionicons name="golf-outline" size={48} color={colors.textMuted} />
            <PremiumText variant="body" color={colors.textMuted} style={{ marginTop: 12, textAlign: "center" }}>
              Scorecard data not available for this course yet
            </PremiumText>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 10,
    gap: 4,
  },
  headerBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  cardSection: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  labelCell: {
    height: CELL_SIZE - 2,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
  },
  cell: {
    height: CELL_SIZE - 2,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 0.5,
  },
  cellText: {
    fontSize: 11,
    textAlign: "center",
  },
  totalBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
  },
  totalItem: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  totalDivider: {
    width: 1,
    height: 30,
  },
  quickEntry: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  quickHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  quickButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickBtn: {
    width: (SCREEN_WIDTH - 80) / 5,
    minWidth: 52,
    height: 56,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  puttBtn: {
    width: (SCREEN_WIDTH - 80) / 6,
    minWidth: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  navBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notesCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    minHeight: 50,
    textAlignVertical: "top",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
});
