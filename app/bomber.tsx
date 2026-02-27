import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View, StyleSheet, Pressable, Platform, useWindowDimensions,
} from "react-native";
import Svg, {
  Rect, Circle, Line, Text as SvgText, Defs, LinearGradient as SvgLinearGradient,
  Stop, Polyline, G, Ellipse,
} from "react-native-svg";
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
  FadeIn, FadeInUp, ZoomIn,
} from "react-native-reanimated";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { PremiumText } from "@/components/PremiumText";

type GameState = "idle" | "powering" | "aiming" | "flying" | "landed";

interface DriveResult {
  carry: number;
  roll: number;
  total: number;
  ballSpeed: number;
  launchAngle: number;
  wind: number;
  power: number;
  accuracy: number;
  inBounds: boolean;
  nightMode: boolean;
}

const GRID_START_YARD = 150;
const GRID_END_YARD = 475;
const GRID_WIDTH_YARDS = 50;
const MARKER_INTERVAL = 25;
const GRAVITY = 9.81;
const DRAG = 0.9965;
const MPH_TO_MS = 0.44704;
const YARD_TO_M = 0.9144;
const PHYSICS_DT = 0.016;

function generateWind(): number {
  return Math.round((Math.random() * 40 - 20) * 10) / 10;
}

function generateStars(count: number, w: number, h: number) {
  const stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h * 0.55,
      r: Math.random() * 1.2 + 0.3,
      opacity: Math.random() * 0.6 + 0.3,
    });
  }
  return stars;
}

function simulateDrive(power: number, accuracyPct: number, wind: number) {
  const ballSpeedMph = power * 1.9;
  const ballSpeedMs = ballSpeedMph * MPH_TO_MS;

  const angleDev = (accuracyPct - 50) / 50 * 3;
  const launchAngleDeg = 12 + angleDev;
  const launchAngleRad = (launchAngleDeg * Math.PI) / 180;

  let vx = ballSpeedMs * Math.cos(launchAngleRad);
  let vy = ballSpeedMs * Math.sin(launchAngleRad);
  let x = 0;
  let y = 0;

  const windMs = wind * MPH_TO_MS * 0.3;
  const points: { x: number; y: number }[] = [{ x: 0, y: 0 }];
  let maxSteps = 2000;
  let landed = false;

  while (maxSteps-- > 0) {
    vx = (vx + windMs * PHYSICS_DT) * DRAG;
    vy = (vy - GRAVITY * PHYSICS_DT) * DRAG;
    x += vx * PHYSICS_DT;
    y += vy * PHYSICS_DT;

    if (y < 0 && points.length > 5) {
      y = 0;
      landed = true;
      points.push({ x, y });
      break;
    }
    points.push({ x, y });
  }

  if (!landed) {
    points.push({ x, y: 0 });
  }

  const carryYards = Math.max(0, x / YARD_TO_M);
  const rollFactor = 0.08 + Math.random() * 0.07;
  const angleFactor = Math.max(0, 1 - Math.abs(launchAngleDeg - 12) * 0.05);
  const rollYards = carryYards * rollFactor * angleFactor;
  const totalYards = carryYards + rollYards;

  const lateralCenter = Math.abs(accuracyPct - 50);
  const inBounds = lateralCenter < 30;

  return {
    carry: Math.round(carryYards),
    roll: Math.round(rollYards),
    total: Math.round(totalYards),
    ballSpeed: Math.round(ballSpeedMph),
    launchAngle: Math.round(launchAngleDeg * 10) / 10,
    inBounds,
    points,
  };
}

export default function BomberGame() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const webTopInset = Platform.OS === "web" ? 20 : 0;

  const [gameState, setGameState] = useState<GameState>("idle");
  const [nightMode, setNightMode] = useState(false);
  const [wind, setWind] = useState(() => generateWind());
  const [power, setPower] = useState(0);
  const [accuracy, setAccuracy] = useState(50);
  const [personalBest, setPersonalBest] = useState(0);
  const [driveHistory, setDriveHistory] = useState<DriveResult[]>([]);
  const [currentResult, setCurrentResult] = useState<DriveResult | null>(null);
  const [trajectoryPoints, setTrajectoryPoints] = useState<string>("");
  const [ballPos, setBallPos] = useState({ x: 0, y: 0 });
  const [showBall, setShowBall] = useState(false);
  const [animatingTracer, setAnimatingTracer] = useState(false);
  const [tracerEndIndex, setTracerEndIndex] = useState(0);
  const [stars] = useState(() => generateStars(40, screenWidth, screenHeight));

  const powerRef = useRef(0);
  const accuracyRef = useRef(50);
  const powerDirRef = useRef(1);
  const accuracyDirRef = useRef(1);
  const powerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const accuracyIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flightPointsRef = useRef<{ x: number; y: number }[]>([]);

  const resultScale = useSharedValue(0);

  const resultStyle = useAnimatedStyle(() => ({
    transform: [{ scale: resultScale.value }],
    opacity: resultScale.value,
  }));

  useEffect(() => {
    AsyncStorage.getItem("bomber_personal_best").then((val) => {
      if (val) setPersonalBest(parseInt(val));
    });
  }, []);

  const svgWidth = screenWidth;
  const svgHeight = screenHeight;
  const groundY = svgHeight * 0.7;
  const teeX = svgWidth * 0.08;
  const landingAreaWidth = svgWidth * 0.85;

  const yardToScreenX = (yard: number) => {
    const fraction = (yard - GRID_START_YARD) / (GRID_END_YARD - GRID_START_YARD);
    return teeX + fraction * landingAreaWidth;
  };

  const heightToScreenY = (heightM: number, maxHeight: number) => {
    const maxVisualHeight = groundY * 0.7;
    const fraction = heightM / Math.max(maxHeight, 1);
    return groundY - fraction * maxVisualHeight;
  };

  const startPowerMeter = useCallback(() => {
    setGameState("powering");
    powerRef.current = 0;
    powerDirRef.current = 1;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const speed = 1.8;
    powerIntervalRef.current = setInterval(() => {
      powerRef.current += powerDirRef.current * speed;
      if (powerRef.current >= 100) { powerRef.current = 100; powerDirRef.current = -1; }
      if (powerRef.current <= 0) { powerRef.current = 0; powerDirRef.current = 1; }
      setPower(Math.round(powerRef.current));
    }, 16);
  }, []);

  const lockPower = useCallback(() => {
    if (powerIntervalRef.current) clearInterval(powerIntervalRef.current);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    setGameState("aiming");
    accuracyRef.current = 0;
    accuracyDirRef.current = 1;

    const speed = 2.2;
    accuracyIntervalRef.current = setInterval(() => {
      accuracyRef.current += accuracyDirRef.current * speed;
      if (accuracyRef.current >= 100) { accuracyRef.current = 100; accuracyDirRef.current = -1; }
      if (accuracyRef.current <= 0) { accuracyRef.current = 0; accuracyDirRef.current = 1; }
      setAccuracy(Math.round(accuracyRef.current));
    }, 16);
  }, []);

  const lockAccuracyAndFire = useCallback(() => {
    if (accuracyIntervalRef.current) clearInterval(accuracyIntervalRef.current);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const p = powerRef.current;
    const a = accuracyRef.current;
    const result = simulateDrive(p, a, wind);

    flightPointsRef.current = result.points;
    setGameState("flying");
    setShowBall(true);
    setAnimatingTracer(true);
    setTracerEndIndex(0);

    const maxH = Math.max(...result.points.map((pt) => pt.y), 1);
    const maxX = Math.max(...result.points.map((pt) => pt.x), 1);
    const totalYards = result.total;

    let frameIndex = 0;
    const totalFrames = result.points.length;
    const frameSkip = Math.max(1, Math.floor(totalFrames / 120));

    const animInterval = setInterval(() => {
      frameIndex += frameSkip;
      if (frameIndex >= totalFrames) {
        frameIndex = totalFrames - 1;
        clearInterval(animInterval);

        const driveResult: DriveResult = {
          carry: result.carry,
          roll: result.roll,
          total: result.total,
          ballSpeed: result.ballSpeed,
          launchAngle: result.launchAngle,
          wind,
          power: Math.round(p),
          accuracy: Math.round(a),
          inBounds: result.inBounds,
          nightMode,
        };

        setCurrentResult(driveResult);
        setGameState("landed");
        setShowBall(false);
        setAnimatingTracer(false);

        if (result.inBounds && result.total > personalBest) {
          setPersonalBest(result.total);
          AsyncStorage.setItem("bomber_personal_best", String(result.total));
        }

        setDriveHistory((prev) => [driveResult, ...prev].slice(0, 10));

        resultScale.value = 0;
        resultScale.value = withSpring(1, { damping: 12, stiffness: 200 });
        Haptics.notificationAsync(
          result.inBounds ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error
        );
      }

      const pt = result.points[frameIndex];
      const sx = yardToScreenX(pt.x / YARD_TO_M);
      const sy = heightToScreenY(pt.y, maxH);
      setBallPos({ x: sx, y: sy });
      setTracerEndIndex(frameIndex);

      const tracerPts = result.points.slice(0, frameIndex + 1);
      const polyStr = tracerPts
        .map((p) => `${yardToScreenX(p.x / YARD_TO_M)},${heightToScreenY(p.y, maxH)}`)
        .join(" ");
      setTrajectoryPoints(polyStr);
    }, 14);
  }, [wind, nightMode, personalBest, groundY, teeX, landingAreaWidth]);

  const resetDrive = useCallback(() => {
    setGameState("idle");
    setPower(0);
    setAccuracy(50);
    setWind(generateWind());
    setCurrentResult(null);
    setTrajectoryPoints("");
    setBallPos({ x: 0, y: 0 });
    setShowBall(false);
    setAnimatingTracer(false);
    setTracerEndIndex(0);
    resultScale.value = 0;
  }, []);

  const handleTap = useCallback(() => {
    if (gameState === "idle") startPowerMeter();
    else if (gameState === "powering") lockPower();
    else if (gameState === "aiming") lockAccuracyAndFire();
  }, [gameState, startPowerMeter, lockPower, lockAccuracyAndFire]);

  const dayBg = { sky1: "#87CEEB", sky2: "#4A90D9", ground: "#2E7D32", groundDark: "#1B5E20", gridLine: "rgba(255,255,255,0.5)", text: "rgba(255,255,255,0.7)", tracer: "#FFD700", tracerGlow: "rgba(255,215,0,0.3)", ball: "#fff" };
  const nightBg = { sky1: "#0a0a2e", sky2: "#050518", ground: "#1a3a1a", groundDark: "#0d260d", gridLine: "rgba(255,255,255,0.25)", text: "rgba(255,255,255,0.45)", tracer: "#00FF88", tracerGlow: "rgba(0,255,136,0.25)", ball: "#00FF88" };
  const theme = nightMode ? nightBg : dayBg;

  const gridMarkers = [];
  for (let y = GRID_START_YARD + MARKER_INTERVAL; y <= GRID_END_YARD; y += MARKER_INTERVAL) {
    gridMarkers.push(y);
  }

  const stadiumLights = [
    { x: svgWidth * 0.15, y: 20 },
    { x: svgWidth * 0.35, y: 15 },
    { x: svgWidth * 0.55, y: 15 },
    { x: svgWidth * 0.75, y: 20 },
    { x: svgWidth * 0.9, y: 18 },
  ];

  const windLabel = wind > 0 ? `${Math.abs(wind)} mph tailwind` : wind < 0 ? `${Math.abs(wind)} mph headwind` : "No wind";
  const windIcon = wind > 0 ? "arrow-forward" : wind < 0 ? "arrow-back" : "remove";

  return (
    <View style={[styles.screen, { backgroundColor: nightMode ? "#050518" : "#4A90D9" }]}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={gameState === "idle" || gameState === "powering" || gameState === "aiming" ? handleTap : undefined}
        disabled={gameState === "flying" || gameState === "landed"}
      >
        <Svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
          <Defs>
            <SvgLinearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={theme.sky1} />
              <Stop offset="1" stopColor={theme.sky2} />
            </SvgLinearGradient>
            <SvgLinearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={theme.ground} />
              <Stop offset="1" stopColor={theme.groundDark} />
            </SvgLinearGradient>
          </Defs>

          <Rect x="0" y="0" width={svgWidth} height={groundY} fill="url(#skyGrad)" />
          <Rect x="0" y={groundY} width={svgWidth} height={svgHeight - groundY} fill="url(#groundGrad)" />

          {nightMode && stars.map((s, i) => (
            <Circle key={i} cx={s.x} cy={s.y} r={s.r} fill="white" opacity={s.opacity} />
          ))}

          {!nightMode && (
            <>
              <Circle cx={svgWidth * 0.88} cy={svgHeight * 0.08} r={28} fill="#FFF176" opacity={0.9} />
              <Circle cx={svgWidth * 0.88} cy={svgHeight * 0.08} r={40} fill="#FFF176" opacity={0.15} />
            </>
          )}

          {nightMode && stadiumLights.map((l, i) => (
            <G key={i}>
              <Ellipse cx={l.x} cy={l.y + 8} rx={30} ry={6} fill="rgba(255,255,200,0.05)" />
              <Circle cx={l.x} cy={l.y} r={8} fill="#FFF9C4" opacity={0.9} />
              <Circle cx={l.x} cy={l.y} r={20} fill="#FFF9C4" opacity={0.12} />
              <Circle cx={l.x} cy={l.y} r={40} fill="#FFF9C4" opacity={0.04} />
              <Line x1={l.x} y1={l.y + 8} x2={l.x - 25} y2={groundY} stroke="rgba(255,255,200,0.03)" strokeWidth="50" />
              <Line x1={l.x} y1={l.y + 8} x2={l.x + 25} y2={groundY} stroke="rgba(255,255,200,0.03)" strokeWidth="50" />
            </G>
          ))}

          <Line x1={teeX} y1={groundY} x2={teeX + landingAreaWidth} y2={groundY} stroke={theme.gridLine} strokeWidth={1} />

          {gridMarkers.map((yard) => {
            const x = yardToScreenX(yard);
            return (
              <G key={yard}>
                <Line x1={x} y1={groundY - 8} x2={x} y2={groundY + 8} stroke={theme.gridLine} strokeWidth={1} />
                {yard % 50 === 0 && (
                  <>
                    <Line x1={x} y1={groundY - 14} x2={x} y2={groundY + 14} stroke={theme.gridLine} strokeWidth={1.5} />
                    <SvgText
                      x={x}
                      y={groundY + 28}
                      textAnchor="middle"
                      fill={theme.text}
                      fontSize={11}
                      fontWeight="600"
                    >
                      {yard}
                    </SvgText>
                  </>
                )}
              </G>
            );
          })}

          <Rect x={teeX - 6} y={groundY - 4} width={12} height={8} rx={2} fill={nightMode ? "#4CAF50" : "#fff"} opacity={0.7} />

          {trajectoryPoints.length > 0 && (
            <>
              <Polyline
                points={trajectoryPoints}
                fill="none"
                stroke={theme.tracerGlow}
                strokeWidth={nightMode ? 8 : 5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Polyline
                points={trajectoryPoints}
                fill="none"
                stroke={theme.tracer}
                strokeWidth={nightMode ? 3 : 2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {showBall && (
            <>
              {nightMode && <Circle cx={ballPos.x} cy={ballPos.y} r={8} fill={theme.ball} opacity={0.15} />}
              <Circle cx={ballPos.x} cy={ballPos.y} r={4} fill={theme.ball} />
            </>
          )}

          {gameState === "landed" && currentResult && (
            <G>
              <Circle
                cx={yardToScreenX(currentResult.carry + currentResult.roll)}
                cy={groundY}
                r={6}
                fill={currentResult.inBounds ? theme.tracer : "#FF5252"}
                opacity={0.8}
              />
              {currentResult.inBounds && (
                <Circle
                  cx={yardToScreenX(currentResult.carry + currentResult.roll)}
                  cy={groundY}
                  r={14}
                  fill={theme.tracer}
                  opacity={0.15}
                />
              )}
            </G>
          )}
        </Svg>
      </Pressable>

      <View style={[styles.topBar, { paddingTop: insets.top + webTopInset }]} pointerEvents="box-none">
        <Pressable onPress={() => router.back()} style={styles.topBtn}>
          <Ionicons name="close" size={22} color="#fff" />
        </Pressable>

        <View style={styles.titleArea}>
          <PremiumText variant="label" color="#fff" style={{ fontSize: 13, letterSpacing: 3 }}>BOMBER</PremiumText>
          <View style={styles.windRow}>
            <Ionicons name={windIcon as any} size={14} color="rgba(255,255,255,0.8)" />
            <PremiumText variant="caption" color="rgba(255,255,255,0.8)" style={{ fontSize: 11 }}>{windLabel}</PremiumText>
          </View>
        </View>

        <Pressable
          onPress={() => { setNightMode(!nightMode); Haptics.selectionAsync(); }}
          style={styles.topBtn}
        >
          <Ionicons name={nightMode ? "sunny" : "moon"} size={20} color="#fff" />
        </Pressable>
      </View>

      {personalBest > 0 && gameState !== "landed" && (
        <View style={[styles.bestBadge, { top: insets.top + webTopInset + 52 }]}>
          <Ionicons name="trophy" size={12} color="#FFD700" />
          <PremiumText variant="caption" color="#FFD700" style={{ fontSize: 11, fontWeight: "700" }}>{personalBest} YDS</PremiumText>
        </View>
      )}

      {(gameState === "powering" || gameState === "aiming") && (
        <View style={[styles.powerMeterContainer, { top: svgHeight * 0.2, left: 16 }]} pointerEvents="none">
          <View style={[styles.powerMeterTrack, { height: svgHeight * 0.4, borderColor: "rgba(255,255,255,0.3)" }]}>
            <View
              style={[
                styles.powerMeterFill,
                {
                  height: `${power}%`,
                  backgroundColor:
                    power < 40 ? "#4CAF50" : power < 70 ? "#FFC107" : power < 90 ? "#FF9800" : "#F44336",
                },
              ]}
            />
            {gameState === "powering" && (
              <View style={[styles.powerMeterIndicator, { bottom: `${power}%` }]}>
                <View style={styles.powerMeterArrow} />
              </View>
            )}
          </View>
          <PremiumText variant="caption" color="#fff" style={{ fontSize: 12, marginTop: 6, fontWeight: "700" }}>
            {power}%
          </PremiumText>
          {gameState === "powering" && (
            <PremiumText variant="caption" color="rgba(255,255,255,0.6)" style={{ fontSize: 9, marginTop: 2 }}>
              TAP
            </PremiumText>
          )}
        </View>
      )}

      {gameState === "aiming" && (
        <View style={[styles.accuracyMeterContainer, { bottom: svgHeight * 0.12 }]} pointerEvents="none">
          <View style={[styles.accuracyMeterTrack, { width: svgWidth * 0.6, borderColor: "rgba(255,255,255,0.3)" }]}>
            <View style={[styles.accuracyCenterLine]} />
            <View
              style={[
                styles.accuracyIndicator,
                { left: `${accuracy}%`, backgroundColor: Math.abs(accuracy - 50) < 15 ? "#4CAF50" : Math.abs(accuracy - 50) < 30 ? "#FFC107" : "#F44336" },
              ]}
            />
          </View>
          <View style={styles.accuracyLabels}>
            <PremiumText variant="caption" color="rgba(255,255,255,0.5)" style={{ fontSize: 9 }}>HOOK</PremiumText>
            <PremiumText variant="caption" color="#fff" style={{ fontSize: 10, fontWeight: "700" }}>ACCURACY</PremiumText>
            <PremiumText variant="caption" color="rgba(255,255,255,0.5)" style={{ fontSize: 9 }}>SLICE</PremiumText>
          </View>
          <PremiumText variant="caption" color="rgba(255,255,255,0.6)" style={{ fontSize: 9, marginTop: 4 }}>
            TAP TO LOCK
          </PremiumText>
        </View>
      )}

      {gameState === "idle" && (
        <Animated.View entering={FadeIn.duration(400)} style={styles.startPrompt}>
          <Pressable
            onPress={handleTap}
            style={[styles.driveButton, { backgroundColor: nightMode ? "#00FF88" : "#FFD700" }]}
          >
            <Ionicons name="flash" size={24} color={nightMode ? "#0a0a2e" : "#1B5E20"} />
            <PremiumText variant="subtitle" color={nightMode ? "#0a0a2e" : "#1B5E20"} style={{ fontSize: 18 }}>
              DRIVE
            </PremiumText>
          </Pressable>
          <PremiumText variant="caption" color="rgba(255,255,255,0.5)" style={{ fontSize: 10, marginTop: 8 }}>
            Tap to start swing
          </PremiumText>
        </Animated.View>
      )}

      {gameState === "landed" && currentResult && (
        <Animated.View style={[styles.resultsOverlay, resultStyle]}>
          <View style={[styles.resultsPanel, { backgroundColor: nightMode ? "rgba(10,10,46,0.92)" : "rgba(0,0,0,0.85)", borderColor: currentResult.inBounds ? (nightMode ? "rgba(0,255,136,0.3)" : "rgba(255,215,0,0.3)") : "rgba(255,82,82,0.3)" }]}>
            {!currentResult.inBounds ? (
              <Animated.View entering={ZoomIn.duration(300)}>
                <PremiumText variant="hero" color="#FF5252" style={{ textAlign: "center", fontSize: 28 }}>
                  OUT OF BOUNDS
                </PremiumText>
                <PremiumText variant="title" color="rgba(255,82,82,0.5)" style={{ textAlign: "center", fontSize: 22, marginTop: 4 }}>
                  {currentResult.total} yds
                </PremiumText>
              </Animated.View>
            ) : (
              <Animated.View entering={ZoomIn.duration(400)}>
                {currentResult.total > personalBest - 1 && currentResult.total >= personalBest && (
                  <Animated.View entering={FadeInUp.duration(500).delay(300)} style={styles.newBestBadge}>
                    <Ionicons name="trophy" size={14} color="#FFD700" />
                    <PremiumText variant="caption" color="#FFD700" style={{ fontWeight: "800", fontSize: 12 }}>NEW BEST!</PremiumText>
                  </Animated.View>
                )}
                <PremiumText
                  variant="hero"
                  color={nightMode ? "#00FF88" : "#FFD700"}
                  style={{ textAlign: "center", fontSize: 52, fontWeight: "900" }}
                >
                  {currentResult.total}
                </PremiumText>
                <PremiumText variant="caption" color="rgba(255,255,255,0.5)" style={{ textAlign: "center", fontSize: 13, letterSpacing: 2 }}>
                  TOTAL YARDS
                </PremiumText>
                <View style={styles.carryRollRow}>
                  <View style={styles.statBox}>
                    <PremiumText variant="caption" color="rgba(255,255,255,0.4)" style={{ fontSize: 9 }}>CARRY</PremiumText>
                    <PremiumText variant="title" color="#fff" style={{ fontSize: 20 }}>{currentResult.carry}</PremiumText>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: "rgba(255,255,255,0.15)" }]} />
                  <View style={styles.statBox}>
                    <PremiumText variant="caption" color="rgba(255,255,255,0.4)" style={{ fontSize: 9 }}>ROLL</PremiumText>
                    <PremiumText variant="title" color="#fff" style={{ fontSize: 20 }}>{currentResult.roll}</PremiumText>
                  </View>
                </View>
              </Animated.View>
            )}

            <View style={styles.statsRow}>
              <View style={styles.miniStat}>
                <PremiumText variant="caption" color="rgba(255,255,255,0.4)" style={{ fontSize: 8 }}>BALL SPEED</PremiumText>
                <PremiumText variant="caption" color="#fff" style={{ fontSize: 13, fontWeight: "700" }}>{currentResult.ballSpeed} mph</PremiumText>
              </View>
              <View style={styles.miniStat}>
                <PremiumText variant="caption" color="rgba(255,255,255,0.4)" style={{ fontSize: 8 }}>LAUNCH</PremiumText>
                <PremiumText variant="caption" color="#fff" style={{ fontSize: 13, fontWeight: "700" }}>{currentResult.launchAngle}°</PremiumText>
              </View>
              <View style={styles.miniStat}>
                <PremiumText variant="caption" color="rgba(255,255,255,0.4)" style={{ fontSize: 8 }}>POWER</PremiumText>
                <PremiumText variant="caption" color="#fff" style={{ fontSize: 13, fontWeight: "700" }}>{currentResult.power}%</PremiumText>
              </View>
              <View style={styles.miniStat}>
                <PremiumText variant="caption" color="rgba(255,255,255,0.4)" style={{ fontSize: 8 }}>WIND</PremiumText>
                <PremiumText variant="caption" color="#fff" style={{ fontSize: 13, fontWeight: "700" }}>{currentResult.wind > 0 ? "+" : ""}{currentResult.wind}</PremiumText>
              </View>
            </View>

            <Pressable
              onPress={resetDrive}
              style={[styles.driveAgainBtn, { backgroundColor: nightMode ? "#00FF88" : "#FFD700" }]}
            >
              <Ionicons name="refresh" size={18} color={nightMode ? "#0a0a2e" : "#1B5E20"} />
              <PremiumText variant="body" color={nightMode ? "#0a0a2e" : "#1B5E20"} style={{ fontWeight: "800", fontSize: 15 }}>
                DRIVE AGAIN
              </PremiumText>
            </Pressable>

            {driveHistory.length > 1 && (
              <View style={styles.historySection}>
                <PremiumText variant="caption" color="rgba(255,255,255,0.3)" style={{ fontSize: 9, marginBottom: 6 }}>RECENT DRIVES</PremiumText>
                {driveHistory.slice(1, 6).map((d, i) => (
                  <View key={i} style={styles.historyRow}>
                    <PremiumText variant="caption" color={d.inBounds ? "rgba(255,255,255,0.6)" : "rgba(255,82,82,0.6)"} style={{ fontSize: 11 }}>
                      {d.inBounds ? `${d.total} yds` : `OB (${d.total})`}
                    </PremiumText>
                    <PremiumText variant="caption" color="rgba(255,255,255,0.3)" style={{ fontSize: 10 }}>
                      {d.ballSpeed}mph • {d.wind > 0 ? "+" : ""}{d.wind}w
                    </PremiumText>
                  </View>
                ))}
              </View>
            )}
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    zIndex: 10,
  },
  topBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  titleArea: {
    alignItems: "center",
    gap: 2,
  },
  windRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  bestBadge: {
    position: "absolute",
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    zIndex: 10,
  },
  powerMeterContainer: {
    position: "absolute",
    alignItems: "center",
    zIndex: 5,
  },
  powerMeterTrack: {
    width: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    overflow: "hidden",
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  powerMeterFill: {
    width: "100%",
    borderRadius: 12,
  },
  powerMeterIndicator: {
    position: "absolute",
    left: -8,
    width: 44,
    height: 3,
    alignItems: "flex-end",
  },
  powerMeterArrow: {
    width: 0,
    height: 0,
    borderTopWidth: 5,
    borderBottomWidth: 5,
    borderRightWidth: 8,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderRightColor: "#fff",
  },
  accuracyMeterContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 5,
  },
  accuracyMeterTrack: {
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    backgroundColor: "rgba(0,0,0,0.3)",
    position: "relative",
  },
  accuracyCenterLine: {
    position: "absolute",
    left: "50%",
    top: 2,
    bottom: 2,
    width: 2,
    backgroundColor: "rgba(255,255,255,0.4)",
    marginLeft: -1,
  },
  accuracyIndicator: {
    position: "absolute",
    top: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: -8,
  },
  accuracyLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "60%",
    marginTop: 4,
  },
  startPrompt: {
    position: "absolute",
    bottom: "15%",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  driveButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 36,
    paddingVertical: 16,
    borderRadius: 30,
  },
  resultsOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
    paddingHorizontal: 20,
  },
  resultsPanel: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
  },
  newBestBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,215,0,0.15)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
    alignSelf: "center",
  },
  carryRollRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    marginTop: 16,
  },
  statBox: {
    alignItems: "center",
    gap: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  miniStat: {
    alignItems: "center",
    gap: 2,
  },
  driveAgainBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
    marginTop: 20,
    width: "100%",
  },
  historySection: {
    marginTop: 16,
    width: "100%",
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
});
