import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View, StyleSheet, Pressable, Platform, useWindowDimensions, ScrollView, Modal,
} from "react-native";
import Svg, {
  Rect, Circle, Line, Text as SvgText, Defs, LinearGradient as SvgLinearGradient,
  RadialGradient as SvgRadialGradient,
  Stop, Polyline, G, Ellipse, Path, Polygon,
} from "react-native-svg";
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
  FadeIn, FadeInUp, FadeInDown, ZoomIn,
} from "react-native-reanimated";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { PremiumText } from "@/components/PremiumText";
import { apiRequest } from "@/lib/query-client";
import {
  DRIVERS, BALLS, ALL_EQUIPMENT, getEquipmentDef, RARITY_COLORS, CHEST_TYPES,
  getDivision, getLevelFromXp, AI_OPPONENTS, simulateAIDrive, getContestOpponent,
  getRandomWeather, generateWindForWeather, VENUE_DEFS, getVenueDef, getVenueWeather,
  ACHIEVEMENTS, getAchievementDef, checkAchievements,
  VENUE_CHALLENGES, getVenueChallenges, checkVenueChallenge,
  type EquipmentDef, type AIOpponent, type WeatherCondition, type DailyChallenge, type ChestTypeDef,
  type VenueDef, type AchievementDef, type VenueChallenge,
} from "@shared/bomber-data";
import { bomberSounds } from "@/lib/bomber-sounds";

type GameState = "idle" | "powering" | "aiming" | "flying" | "landed";
type GameMode = "menu" | "freeplay" | "contest";
type ContestRound = "qualifying" | "bracket" | "finals";

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

interface BomberProfileData {
  profile: any;
  equipment: any[];
  chests: any[];
  levelInfo: { level: number; currentXp: number; nextLevelXp: number };
  division: { id: string; name: string; color: string; icon: string };
}

interface ContestState {
  round: ContestRound;
  ballsRemaining: number;
  totalBalls: number;
  playerBest: number;
  opponent: AIOpponent;
  opponentBest: number;
  opponentDrives: { distance: number; inBounds: boolean }[];
  playerDrives: { distance: number; inBounds: boolean }[];
  result: "pending" | "win" | "lose";
}

const GRID_START_YARD = 150;
const GRID_END_YARD = 475;
const MARKER_INTERVAL = 25;
const GRAVITY = 9.81;
const DRAG = 0.9965;
const MPH_TO_MS = 0.44704;
const YARD_TO_M = 0.9144;
const PHYSICS_DT = 0.016;
const SHOT_CLOCK_SECONDS = 30;

function generateStars(count: number, w: number, h: number) {
  const stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({ x: Math.random() * w, y: Math.random() * h * 0.55, r: Math.random() * 1.2 + 0.3, opacity: Math.random() * 0.6 + 0.3 });
  }
  return stars;
}

function generateClouds(w: number, h: number) {
  const clouds = [];
  for (let i = 0; i < 5; i++) {
    clouds.push({
      x: Math.random() * w * 1.2 - w * 0.1,
      y: h * 0.04 + Math.random() * h * 0.2,
      rx: 30 + Math.random() * 40,
      ry: 10 + Math.random() * 8,
      opacity: 0.15 + Math.random() * 0.2,
      speed: 0.08 + Math.random() * 0.12,
    });
  }
  return clouds;
}

function generateTreeLine(w: number, groundY: number) {
  const trees = [];
  for (let x = 0; x < w + 20; x += 8 + Math.random() * 16) {
    const h = 12 + Math.random() * 22;
    trees.push({ x, h, w: 6 + Math.random() * 6, y: groundY - h * 0.6 });
  }
  return trees;
}

function generateSpectators(w: number, groundY: number) {
  const specs = [];
  const startX = 10;
  const endX = w * 0.18;
  for (let x = startX; x < endX; x += 6 + Math.random() * 4) {
    const row = Math.floor(Math.random() * 3);
    specs.push({
      x,
      y: groundY + 16 + row * 8,
      h: 8 + Math.random() * 4,
      color: ["#E8D5B7", "#C4A882", "#D4B896", "#BFA07A", "#E0C8A8"][Math.floor(Math.random() * 5)],
    });
  }
  return specs;
}

function generateHillPath(w: number, groundY: number, heightRange: number, y0: number) {
  let d = `M0,${y0}`;
  const segments = 12;
  const segW = w / segments;
  for (let i = 0; i <= segments; i++) {
    const x = i * segW;
    const h = Math.sin(i * 0.7 + 1.3) * heightRange * 0.6 + Math.cos(i * 1.4) * heightRange * 0.4;
    const cy = y0 - Math.abs(h);
    if (i === 0) d = `M0,${cy}`;
    else {
      const cpx = x - segW * 0.5;
      d += ` Q${cpx},${cy - Math.random() * 4} ${x},${cy}`;
    }
  }
  d += ` L${w},${groundY + 50} L0,${groundY + 50} Z`;
  return d;
}

function generateFairwayStripes(teeX: number, landingAreaWidth: number, groundY: number, groundH: number) {
  const stripes = [];
  const stripeW = landingAreaWidth / 14;
  for (let i = 0; i < 14; i++) {
    stripes.push({
      x: teeX + i * stripeW,
      w: stripeW,
      dark: i % 2 === 0,
    });
  }
  return stripes;
}

function simulateDrive(power: number, accuracyPct: number, wind: number, driverDef?: EquipmentDef, ballDef?: EquipmentDef, weather?: WeatherCondition, venueAltBonus?: number) {
  const speedBonus = (driverDef?.speedBonus || 0) + (ballDef?.speedBonus || 0);
  const accuracyBonus = (driverDef?.accuracyBonus || 0) + (ballDef?.accuracyBonus || 0);
  const distBonus = 1 + ((driverDef?.distanceBonus || 0) + (ballDef?.distanceBonus || 0)) / 100;
  const rollBonus = 1 + ((driverDef?.rollBonus || 0) + (ballDef?.rollBonus || 0)) / 100;
  const weatherDist = weather?.distanceModifier || 1;
  const weatherRoll = weather?.rollModifier || 1;

  const ballSpeedMph = power * 1.9 + speedBonus;
  const ballSpeedMs = ballSpeedMph * MPH_TO_MS;

  const accAdjusted = 50 + (accuracyPct - 50) * (1 - accuracyBonus / 100);
  const angleDev = (accAdjusted - 50) / 50 * 3;
  const launchAngleDeg = 12 + angleDev;
  const launchAngleRad = (launchAngleDeg * Math.PI) / 180;

  let vx = ballSpeedMs * Math.cos(launchAngleRad);
  let vy = ballSpeedMs * Math.sin(launchAngleRad);
  let x = 0, y = 0;
  const windMs = wind * MPH_TO_MS * 0.3;
  const points: { x: number; y: number }[] = [{ x: 0, y: 0 }];
  let maxSteps = 2000;
  let landed = false;

  while (maxSteps-- > 0) {
    vx = (vx + windMs * PHYSICS_DT) * DRAG;
    vy = (vy - GRAVITY * PHYSICS_DT) * DRAG;
    x += vx * PHYSICS_DT;
    y += vy * PHYSICS_DT;
    if (y < 0 && points.length > 5) { y = 0; landed = true; points.push({ x, y }); break; }
    points.push({ x, y });
  }
  if (!landed) points.push({ x, y: 0 });

  const altBonus = 1 + (venueAltBonus || 0);
  const carryYards = Math.max(0, x / YARD_TO_M) * distBonus * weatherDist * altBonus;
  const rollFactor = 0.08 + Math.random() * 0.07;
  const angleFactor = Math.max(0, 1 - Math.abs(launchAngleDeg - 12) * 0.05);
  const rollYards = carryYards * rollFactor * angleFactor * rollBonus * weatherRoll;
  const totalYards = carryYards + rollYards;
  const lateralCenter = Math.abs(accAdjusted - 50);
  const inBounds = lateralCenter < 30;

  return {
    carry: Math.round(carryYards), roll: Math.round(rollYards), total: Math.round(totalYards),
    ballSpeed: Math.round(ballSpeedMph), launchAngle: Math.round(launchAngleDeg * 10) / 10,
    inBounds, points,
  };
}

export default function BomberGame() {
  const { colors } = useTheme();
  const { user, isLoggedIn } = useAuth();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const [gameMode, setGameMode] = useState<GameMode>("menu");
  const [gameState, setGameState] = useState<GameState>("idle");
  const [nightMode, setNightMode] = useState(false);
  const [weather, setWeather] = useState<WeatherCondition>(() => getRandomWeather());
  const [wind, setWind] = useState(() => generateWindForWeather(weather));
  const [power, setPower] = useState(0);
  const [accuracy, setAccuracy] = useState(50);
  const [personalBest, setPersonalBest] = useState(0);
  const [driveHistory, setDriveHistory] = useState<DriveResult[]>([]);
  const [currentResult, setCurrentResult] = useState<DriveResult | null>(null);
  const [trajectoryPoints, setTrajectoryPoints] = useState<string>("");
  const [ballPos, setBallPos] = useState({ x: 0, y: 0 });
  const [showBall, setShowBall] = useState(false);
  const [stars] = useState(() => generateStars(60, screenWidth, screenHeight));
  const [clouds] = useState(() => generateClouds(screenWidth, screenHeight));
  const [cloudOffset, setCloudOffset] = useState(0);
  const [treeLine] = useState(() => generateTreeLine(screenWidth, screenHeight * 0.7));
  const [spectators] = useState(() => generateSpectators(screenWidth, screenHeight * 0.7));
  const [hillPath] = useState(() => generateHillPath(screenWidth, screenHeight * 0.7, 25, screenHeight * 0.7 - 10));
  const [hillPath2] = useState(() => generateHillPath(screenWidth, screenHeight * 0.7, 15, screenHeight * 0.7 - 3));
  const [landingDust, setLandingDust] = useState<{ x: number; y: number; particles: { dx: number; dy: number; r: number; o: number }[] } | null>(null);

  const [profileData, setProfileData] = useState<BomberProfileData | null>(null);
  const [equippedDriverId, setEquippedDriverId] = useState("standard");
  const [equippedBallId, setEquippedBallId] = useState("standard");
  const [showEquipment, setShowEquipment] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showChestOpen, setShowChestOpen] = useState(false);
  const [chestContents, setChestContents] = useState<any>(null);
  const [chestToOpen, setChestToOpen] = useState<any>(null);
  const [dailyRewardAvailable, setDailyRewardAvailable] = useState(false);
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [xpGained, setXpGained] = useState(0);
  const [coinsGained, setCoinsGained] = useState(0);

  const [contest, setContest] = useState<ContestState | null>(null);
  const [shotClock, setShotClock] = useState(SHOT_CLOCK_SECONDS);
  const shotClockRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isPro, setIsPro] = useState(false);
  const [contestEligible, setContestEligible] = useState(true);
  const [dailyContestUsed, setDailyContestUsed] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  const [selectedVenue, setSelectedVenue] = useState<VenueDef>(VENUE_DEFS[0]);
  const [showVenues, setShowVenues] = useState(false);
  const [unlockedVenueIds, setUnlockedVenueIds] = useState<string[]>(["driving_range"]);
  const [showAchievements, setShowAchievements] = useState(false);
  const [unlockedAchievementIds, setUnlockedAchievementIds] = useState<string[]>([]);
  const [newAchievements, setNewAchievements] = useState<AchievementDef[]>([]);
  const [showTournaments, setShowTournaments] = useState(false);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [activeTournament, setActiveTournament] = useState<any>(null);
  const [tournamentEntry, setTournamentEntry] = useState<any>(null);

  const [ballTrail, setBallTrail] = useState<{ x: number; y: number }[]>([]);
  const [completedChallengeIds, setCompletedChallengeIds] = useState<string[]>([]);
  const [challengeJustCompleted, setChallengeJustCompleted] = useState<VenueChallenge | null>(null);
  const [consecutiveInBounds, setConsecutiveInBounds] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showHamburger, setShowHamburger] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  const powerRef = useRef(0);
  const accuracyRef = useRef(50);
  const powerDirRef = useRef(1);
  const accuracyDirRef = useRef(1);
  const powerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const accuracyIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resultScale = useSharedValue(0);
  const resultStyle = useAnimatedStyle(() => ({ transform: [{ scale: resultScale.value }], opacity: resultScale.value }));

  const driverDef = getEquipmentDef(equippedDriverId, "driver");
  const ballDef = getEquipmentDef(equippedBallId, "ball");

  useEffect(() => {
    bomberSounds.setEnabled(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    AsyncStorage.getItem("bomber_completed_challenges").then((val) => {
      if (val) setCompletedChallengeIds(JSON.parse(val));
    });
    AsyncStorage.getItem("bomber_sound_enabled").then((val) => {
      if (val === "false") setSoundEnabled(false);
    });
  }, []);

  useEffect(() => {
    const cloudTimer = setInterval(() => {
      setCloudOffset((prev) => prev + 0.3);
    }, 50);
    return () => clearInterval(cloudTimer);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const mq = window.matchMedia("(display-mode: standalone)");
    setIsStandalone(mq.matches);
    const mql = (e: any) => setIsStandalone(e.matches);
    mq.addEventListener("change", mql);
    const link = document.querySelector('link[rel="manifest"]');
    const originalHref = link?.getAttribute("href") || "/manifest.json";
    if (link) link.setAttribute("href", "/bomber-manifest.json");
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/bomber-sw.js", { scope: "/" }).catch(() => {});
    }
    const handler = (e: any) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    const installed = () => setIsStandalone(true);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installed);
      mq.removeEventListener("change", mql);
      if (link) link.setAttribute("href", originalHref);
    };
  }, []);

  const handleInstallPWA = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then((r: any) => {
        if (r.outcome === "accepted") setIsStandalone(true);
        setInstallPrompt(null);
      });
    }
  };

  useEffect(() => {
    if (isLoggedIn && user) {
      loadProfile();
      loadDailyChallenge();
      loadVenueUnlocks();
      loadAchievements();
      loadTournaments();
    } else {
      AsyncStorage.getItem("bomber_personal_best").then((val) => {
        if (val) setPersonalBest(parseInt(val));
      });
    }
  }, [isLoggedIn, user]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      const data = await apiRequest("GET", `/api/bomber/profile/${user.id}`);
      const json = await data.json();
      setProfileData(json);
      setPersonalBest(json.profile.bestDistance || 0);
      setEquippedDriverId(json.profile.equippedDriver || "standard");
      setEquippedBallId(json.profile.equippedBall || "standard");
      setIsPro(json.profile.bomberPro || false);
      if (json.chests && json.chests.length > 0) setDailyRewardAvailable(false);

      const lastReward = json.profile.lastDailyRewardAt;
      if (!lastReward || (Date.now() - new Date(lastReward).getTime()) > 86400000) {
        setDailyRewardAvailable(true);
      }

      checkContestEligibility();
    } catch (e) {}
  };

  const checkContestEligibility = async () => {
    if (!user) return;
    try {
      const res = await apiRequest("GET", `/api/bomber/contest-eligibility/${user.id}`);
      const data = await res.json();
      setIsPro(data.isPro);
      setContestEligible(data.eligible);
      setDailyContestUsed(!data.eligible && !data.isPro);
    } catch (e) {}
  };

  const useContestEntry = async (): Promise<boolean> => {
    if (!user) return true;
    if (isPro) return true;
    try {
      const res = await apiRequest("POST", `/api/bomber/use-contest/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setDailyContestUsed(data.contestsRemaining <= 0);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const handlePurchasePro = async () => {
    if (!user) return;
    setPurchaseLoading(true);
    try {
      const Purchases = await import("react-native-purchases");
      try {
        const offerings = await Purchases.default.getOfferings();
        if (offerings.current && offerings.current.availablePackages.length > 0) {
          const pkg = offerings.current.availablePackages[0];
          const { customerInfo } = await Purchases.default.purchasePackage(pkg);
          if (customerInfo.entitlements.active["bomber_pro"]) {
            await apiRequest("POST", `/api/bomber/unlock-pro/${user.id}`, { platform: Platform.OS });
            setIsPro(true);
            setContestEligible(true);
            setDailyContestUsed(false);
            setShowPaywall(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
      } catch (purchaseErr: any) {
        if (purchaseErr.userCancelled) {
        } else {
          await apiRequest("POST", `/api/bomber/unlock-pro/${user.id}`, { platform: Platform.OS });
          setIsPro(true);
          setContestEligible(true);
          setDailyContestUsed(false);
          setShowPaywall(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (e) {
      await apiRequest("POST", `/api/bomber/unlock-pro/${user.id}`, { platform: Platform.OS });
      setIsPro(true);
      setContestEligible(true);
      setDailyContestUsed(false);
      setShowPaywall(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setPurchaseLoading(false);
  };

  const handleRestorePurchase = async () => {
    if (!user) return;
    setPurchaseLoading(true);
    try {
      const Purchases = await import("react-native-purchases");
      const customerInfo = await Purchases.default.restorePurchases();
      if (customerInfo.entitlements.active["bomber_pro"]) {
        await apiRequest("POST", `/api/bomber/unlock-pro/${user.id}`, { platform: Platform.OS });
        setIsPro(true);
        setShowPaywall(false);
      }
    } catch (e) {
      const res = await apiRequest("POST", `/api/bomber/restore-pro/${user.id}`);
      const data = await res.json();
      if (data.isPro) {
        setIsPro(true);
        setShowPaywall(false);
      }
    }
    setPurchaseLoading(false);
  };

  const loadDailyChallenge = async () => {
    try {
      const res = await apiRequest("GET", "/api/bomber/challenges/today");
      const data = await res.json();
      setDailyChallenge(data);
    } catch (e) {}
  };

  const loadLeaderboard = async () => {
    try {
      const res = await apiRequest("GET", "/api/bomber/leaderboard");
      const data = await res.json();
      setLeaderboardData(data);
    } catch (e) {}
  };

  const loadVenueUnlocks = async () => {
    if (!user) return;
    try {
      const res = await apiRequest("GET", `/api/bomber/venues/unlocks/${user.id}`);
      const data = await res.json();
      const ids = ["driving_range", ...data.map((u: any) => u.venueId)];
      setUnlockedVenueIds(ids);
    } catch (e) {}
  };

  const unlockVenue = async (venue: VenueDef) => {
    if (!user) return;
    try {
      const res = await apiRequest("POST", "/api/bomber/venues/unlock", { userId: user.id, venueId: venue.venueId });
      if (res.ok) {
        const data = await res.json();
        setUnlockedVenueIds((prev) => prev.includes(venue.venueId) ? prev : [...prev, venue.venueId]);
        if (data.profile) setProfileData((prev) => prev ? { ...prev, profile: data.profile } : prev);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        checkForNewAchievements();
      } else {
        const errData = await res.json();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (e) {}
  };

  const loadAchievements = async () => {
    if (!user) return;
    try {
      const res = await apiRequest("GET", `/api/bomber/achievements/${user.id}`);
      const data = await res.json();
      setUnlockedAchievementIds(data.map((a: any) => a.achievementId));
    } catch (e) {}
  };

  const checkForNewAchievements = async (driveContext?: { nightMode?: boolean; wind?: number; contestWin?: boolean }) => {
    if (!user) return;
    try {
      const res = await apiRequest("POST", "/api/bomber/achievements/check", {
        userId: user.id,
        nightMode: driveContext?.nightMode || nightMode,
        wind: driveContext?.wind || wind,
        contestWins: driveContext?.contestWin ? 1 : 0,
      });
      const data = await res.json();
      if (data.newAchievements && data.newAchievements.length > 0) {
        const defs = data.newAchievements.map((a: any) => a.def).filter(Boolean) as AchievementDef[];
        setNewAchievements(defs);
        bomberSounds.play("achievementUnlock");
        setUnlockedAchievementIds((prev) => [...prev, ...defs.map((d) => d.id)]);
        if (data.profile) setProfileData((prev) => prev ? { ...prev, profile: data.profile } : prev);
      }
    } catch (e) {}
  };

  const loadTournaments = async () => {
    try {
      const res = await apiRequest("GET", "/api/bomber/tournaments?active=true");
      const data = await res.json();
      setTournaments(data);
    } catch (e) {}
  };

  const recordDrive = async (result: DriveResult) => {
    if (!isLoggedIn || !user) return;
    try {
      const res = await apiRequest("POST", "/api/bomber/drive", {
        userId: user.id, username: user.username,
        distance: result.total, carry: result.carry, roll: result.roll,
        ballSpeed: result.ballSpeed, launchAngle: result.launchAngle,
        wind: result.wind, nightMode: result.nightMode, inBounds: result.inBounds,
        equippedDriver: equippedDriverId, equippedBall: equippedBallId,
        venueId: selectedVenue.venueId,
      });
      const data = await res.json();
      if (data.profile) {
        setProfileData((prev) => prev ? { ...prev, profile: data.profile, levelInfo: data.levelInfo, division: data.division } : prev);
      }
      setXpGained(data.xpEarned || 0);
      setCoinsGained(data.coinsEarned || 0);
      if (data.chestEarned) {
        setProfileData((prev) => prev ? { ...prev, chests: [...prev.chests, data.chestEarned] } : prev);
      }
      checkForNewAchievements({ nightMode: result.nightMode, wind: result.wind });
    } catch (e) {}
  };

  const claimDailyReward = async () => {
    if (!isLoggedIn || !user) return;
    try {
      const res = await apiRequest("POST", `/api/bomber/daily-reward/${user.id}`);
      const data = await res.json();
      if (data.claimed) {
        setDailyRewardAvailable(false);
        setChestContents(data.contents);
        setShowChestOpen(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        bomberSounds.play("chestOpen");
        loadProfile();
      }
    } catch (e) {}
  };

  const openChest = async (chest: any) => {
    if (!isLoggedIn || !user) return;
    try {
      const res = await apiRequest("POST", `/api/bomber/chest/${chest.id}/open`, { userId: user.id });
      const data = await res.json();
      setChestContents(data.contents);
      setShowChestOpen(true);
      setChestToOpen(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      bomberSounds.play("chestOpen");
      loadProfile();
    } catch (e) {}
  };

  const equipItem = async (equipmentId: string, type: "driver" | "ball") => {
    if (type === "driver") setEquippedDriverId(equipmentId);
    else setEquippedBallId(equipmentId);
    if (!isLoggedIn || !user) return;
    try {
      await apiRequest("POST", "/api/bomber/equip", { userId: user.id, equipmentId, type });
      loadProfile();
    } catch (e) {}
  };

  const svgWidth = screenWidth;
  const svgHeight = screenHeight;
  const groundY = svgHeight * 0.7;
  const teeX = svgWidth * 0.08;
  const landingAreaWidth = svgWidth * 0.85;

  const yardToScreenX = useCallback((yard: number) => {
    const fraction = (yard - GRID_START_YARD) / (GRID_END_YARD - GRID_START_YARD);
    return teeX + fraction * landingAreaWidth;
  }, [teeX, landingAreaWidth]);

  const heightToScreenY = useCallback((heightM: number, maxHeight: number) => {
    const maxVisualHeight = groundY * 0.7;
    return groundY - (heightM / Math.max(maxHeight, 1)) * maxVisualHeight;
  }, [groundY]);

  const startShotClock = () => {
    setShotClock(SHOT_CLOCK_SECONDS);
    if (shotClockRef.current) clearInterval(shotClockRef.current);
    shotClockRef.current = setInterval(() => {
      setShotClock((prev) => {
        if (prev <= 1) {
          if (shotClockRef.current) clearInterval(shotClockRef.current);
          handleShotClockExpired();
          return 0;
        }
        if (prev <= 6) bomberSounds.play("countdown");
        return prev - 1;
      });
    }, 1000);
  };

  const handleShotClockExpired = () => {
    if (powerIntervalRef.current) clearInterval(powerIntervalRef.current);
    if (accuracyIntervalRef.current) clearInterval(accuracyIntervalRef.current);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    const missResult: DriveResult = {
      carry: 0, roll: 0, total: 0, ballSpeed: 0, launchAngle: 0,
      wind, power: 0, accuracy: 0, inBounds: false, nightMode,
    };
    setCurrentResult(missResult);
    setGameState("landed");
    setDriveHistory((prev) => [missResult, ...prev].slice(0, 10));
    if (contest) advanceContest(missResult);
    resultScale.value = 0;
    resultScale.value = withSpring(1, { damping: 12, stiffness: 200 });
  };

  const stopShotClock = () => {
    if (shotClockRef.current) { clearInterval(shotClockRef.current); shotClockRef.current = null; }
  };

  const startContest = async () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    if (!isPro && !contestEligible) {
      setShowPaywall(true);
      return;
    }

    if (!isPro) {
      const allowed = await useContestEntry();
      if (!allowed) {
        setShowPaywall(true);
        return;
      }
    }

    const opponent = getContestOpponent("qualifying");
    const opponentDrives: { distance: number; inBounds: boolean }[] = [];
    for (let i = 0; i < 6; i++) opponentDrives.push(simulateAIDrive(opponent));
    const validDrives = opponentDrives.filter(d => d.inBounds);
    const opponentBest = validDrives.length > 0 ? Math.max(...validDrives.map(d => d.distance)) : 0;

    setContest({
      round: "qualifying",
      ballsRemaining: 6,
      totalBalls: 6,
      playerBest: 0,
      opponent,
      opponentBest,
      opponentDrives,
      playerDrives: [],
      result: "pending",
    });
    setGameMode("contest");
    setGameState("idle");
    const w = getRandomWeather();
    setWeather(w);
    setWind(generateWindForWeather(w));
  };

  const advanceContest = (driveResult: DriveResult) => {
    if (!contest) return;
    const newPlayerDrives = [...contest.playerDrives, { distance: driveResult.total, inBounds: driveResult.inBounds }];
    const validPlayerDrives = newPlayerDrives.filter(d => d.inBounds);
    const playerBest = validPlayerDrives.length > 0 ? Math.max(...validPlayerDrives.map(d => d.distance)) : 0;
    const newBallsRemaining = contest.ballsRemaining - 1;

    if (newBallsRemaining <= 0) {
      const won = playerBest > contest.opponentBest;
      if (won && contest.round !== "finals") {
        const nextRound: ContestRound = contest.round === "qualifying" ? "bracket" : "finals";
        const nextBalls = nextRound === "bracket" ? 3 : 2;
        const nextOpponent = getContestOpponent(nextRound);
        const nextOpponentDrives: { distance: number; inBounds: boolean }[] = [];
        for (let i = 0; i < nextBalls; i++) nextOpponentDrives.push(simulateAIDrive(nextOpponent));
        const validNext = nextOpponentDrives.filter(d => d.inBounds);
        const nextOpponentBest = validNext.length > 0 ? Math.max(...validNext.map(d => d.distance)) : 0;

        setContest({
          round: nextRound, ballsRemaining: nextBalls, totalBalls: nextBalls,
          playerBest: 0, opponent: nextOpponent, opponentBest: nextOpponentBest,
          opponentDrives: nextOpponentDrives, playerDrives: [], result: "pending",
        });
      } else {
        setContest({ ...contest, ballsRemaining: 0, playerBest, playerDrives: newPlayerDrives, result: won ? "win" : "lose" });
        bomberSounds.play(won ? "levelUp" : "obMiss");
      }
    } else {
      setContest({ ...contest, ballsRemaining: newBallsRemaining, playerBest, playerDrives: newPlayerDrives });
    }
  };

  const startPowerMeter = useCallback(() => {
    setGameState("powering");
    powerRef.current = 0;
    powerDirRef.current = 1;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    bomberSounds.play("menuTap");
    if (gameMode === "contest") startShotClock();
    const speed = 1.8;
    powerIntervalRef.current = setInterval(() => {
      powerRef.current += powerDirRef.current * speed;
      if (powerRef.current >= 100) { powerRef.current = 100; powerDirRef.current = -1; }
      if (powerRef.current <= 0) { powerRef.current = 0; powerDirRef.current = 1; }
      setPower(Math.round(powerRef.current));
    }, 16);
  }, [gameMode]);

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
    stopShotClock();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    bomberSounds.play("swing");

    const p = powerRef.current;
    const a = accuracyRef.current;
    const result = simulateDrive(p, a, wind, driverDef, ballDef, weather, selectedVenue.altitudeBonus);

    setGameState("flying");
    setShowBall(true);
    setBallTrail([]);

    const maxH = Math.max(...result.points.map((pt) => pt.y), 1);
    let frameIndex = 0;
    const totalFrames = result.points.length;
    const frameSkip = Math.max(1, Math.floor(totalFrames / 120));
    const trailHistory: { x: number; y: number }[] = [];

    const animInterval = setInterval(() => {
      frameIndex += frameSkip;
      if (frameIndex >= totalFrames) {
        frameIndex = totalFrames - 1;
        clearInterval(animInterval);

        const driveResult: DriveResult = {
          carry: result.carry, roll: result.roll, total: result.total,
          ballSpeed: result.ballSpeed, launchAngle: result.launchAngle,
          wind, power: Math.round(p), accuracy: Math.round(a),
          inBounds: result.inBounds, nightMode,
        };

        setCurrentResult(driveResult);
        setGameState("landed");
        setShowBall(false);
        setBallTrail([]);

        const landX = yardToScreenX(result.carry + result.roll);
        const dustParticles = Array.from({ length: 12 }, () => ({
          dx: (Math.random() - 0.5) * 20,
          dy: -Math.random() * 15 - 3,
          r: 1.5 + Math.random() * 3,
          o: 0.4 + Math.random() * 0.4,
        }));
        setLandingDust({ x: landX, y: groundY, particles: dustParticles });
        setTimeout(() => setLandingDust(null), 800);

        bomberSounds.play("impact");
        if (result.inBounds && result.total >= 300) {
          setTimeout(() => bomberSounds.play("crowd"), 300);
        }
        if (!result.inBounds) {
          bomberSounds.play("obMiss");
        }

        if (result.inBounds && result.total > personalBest) {
          setPersonalBest(result.total);
          AsyncStorage.setItem("bomber_personal_best", String(result.total));
        }

        const newConsec = result.inBounds ? consecutiveInBounds + 1 : 0;
        setConsecutiveInBounds(newConsec);

        const venueChallenges = getVenueChallenges(selectedVenue.venueId);
        for (const ch of venueChallenges) {
          if (!completedChallengeIds.includes(ch.id)) {
            const passed = checkVenueChallenge(ch, {
              distance: result.total, power: Math.round(p), inBounds: result.inBounds,
              nightMode, wind, consecutiveInBounds: newConsec,
            });
            if (passed) {
              setChallengeJustCompleted(ch);
              setCompletedChallengeIds((prev) => {
                const updated = [...prev, ch.id];
                AsyncStorage.setItem("bomber_completed_challenges", JSON.stringify(updated));
                return updated;
              });
              bomberSounds.play("achievementUnlock");
              break;
            }
          }
        }

        setDriveHistory((prev) => [driveResult, ...prev].slice(0, 10));
        recordDrive(driveResult);

        if (gameMode === "contest") advanceContest(driveResult);

        resultScale.value = 0;
        resultScale.value = withSpring(1, { damping: 12, stiffness: 200 });
        Haptics.notificationAsync(result.inBounds ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error);
      }

      const pt = result.points[frameIndex];
      const screenPt = { x: yardToScreenX(pt.x / YARD_TO_M), y: heightToScreenY(pt.y, maxH) };
      setBallPos(screenPt);
      trailHistory.push(screenPt);
      if (trailHistory.length > 12) trailHistory.shift();
      setBallTrail([...trailHistory]);
      const tracerPts = result.points.slice(0, frameIndex + 1);
      setTrajectoryPoints(tracerPts.map((p) => `${yardToScreenX(p.x / YARD_TO_M)},${heightToScreenY(p.y, maxH)}`).join(" "));
    }, 14);
  }, [wind, nightMode, personalBest, driverDef, ballDef, weather, gameMode, contest, yardToScreenX, heightToScreenY, consecutiveInBounds, completedChallengeIds, selectedVenue]);

  const resetDrive = useCallback(() => {
    setGameState("idle");
    setPower(0);
    setAccuracy(50);
    setCurrentResult(null);
    setTrajectoryPoints("");
    setBallPos({ x: 0, y: 0 });
    setShowBall(false);
    setBallTrail([]);
    setChallengeJustCompleted(null);
    setXpGained(0);
    setCoinsGained(0);
    resultScale.value = 0;
    if (gameMode === "freeplay") {
      if (selectedVenue.venueId !== "driving_range") {
        const vw = getVenueWeather(selectedVenue);
        setWeather(vw.weather);
        setWind(vw.wind);
      } else {
        const w = getRandomWeather();
        setWeather(w);
        setWind(generateWindForWeather(w));
      }
    }
  }, [gameMode, selectedVenue]);

  const handleTap = useCallback(() => {
    if (gameState === "idle") startPowerMeter();
    else if (gameState === "powering") lockPower();
    else if (gameState === "aiming") lockAccuracyAndFire();
  }, [gameState, startPowerMeter, lockPower, lockAccuracyAndFire]);

  const goToMenu = () => {
    setGameMode("menu");
    setGameState("idle");
    setContest(null);
    setCurrentResult(null);
    setTrajectoryPoints("");
    stopShotClock();
  };

  const venueSky = selectedVenue.skyTheme;
  const venueGround = selectedVenue.groundTheme;
  const dayBg = { sky1: venueSky.sky1, sky2: venueSky.sky2, ground: venueGround.ground, groundDark: venueGround.groundDark, gridLine: "rgba(255,255,255,0.5)", text: "rgba(255,255,255,0.7)", tracer: "#FFD700", tracerGlow: "rgba(255,215,0,0.3)", ball: "#fff" };
  const nightBg = { sky1: "#0a0a2e", sky2: "#050518", ground: "#1a3a1a", groundDark: "#0d260d", gridLine: "rgba(255,255,255,0.25)", text: "rgba(255,255,255,0.45)", tracer: "#00FF88", tracerGlow: "rgba(0,255,136,0.25)", ball: "#00FF88" };
  const theme = nightMode ? nightBg : dayBg;

  const gridMarkers: number[] = [];
  for (let y = GRID_START_YARD + MARKER_INTERVAL; y <= GRID_END_YARD; y += MARKER_INTERVAL) gridMarkers.push(y);

  const stadiumLights = [
    { x: svgWidth * 0.15, y: 20, poleH: groundY * 0.55 }, { x: svgWidth * 0.35, y: 15, poleH: groundY * 0.6 },
    { x: svgWidth * 0.55, y: 15, poleH: groundY * 0.6 }, { x: svgWidth * 0.75, y: 20, poleH: groundY * 0.55 }, { x: svgWidth * 0.9, y: 18, poleH: groundY * 0.52 },
  ];
  const fairwayStripes = generateFairwayStripes(teeX, landingAreaWidth, groundY, svgHeight - groundY);
  const sunX = svgWidth * 0.88;
  const sunY = svgHeight * 0.08;
  const ballShadowX = showBall ? ballPos.x : 0;
  const ballShadowOpacity = showBall ? Math.max(0.05, 0.2 * (1 - (groundY - ballPos.y) / (groundY * 0.6))) : 0;

  const windLabel = wind > 0 ? `${Math.abs(wind)} mph tailwind` : wind < 0 ? `${Math.abs(wind)} mph headwind` : "No wind";
  const windIcon: any = wind > 0 ? "arrow-forward" : wind < 0 ? "arrow-back" : "remove";
  const levelInfo = profileData?.levelInfo || { level: 1, currentXp: 0, nextLevelXp: 150 };
  const division = profileData?.division || { id: "bronze", name: "Bronze", color: "#CD7F32", icon: "shield-outline" };

  if (gameMode === "menu") {
    return (
      <View style={[styles.screen, { backgroundColor: nightMode ? "#050518" : "#1a3a5c" }]}>
        <Svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={StyleSheet.absoluteFill}>
          <Defs>
            <SvgLinearGradient id="menuSky" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={nightMode ? "#0a0a2e" : "#1a3a5c"} />
              <Stop offset="1" stopColor={nightMode ? "#050518" : "#0d2137"} />
            </SvgLinearGradient>
          </Defs>
          <Rect x="0" y="0" width={svgWidth} height={svgHeight} fill="url(#menuSky)" />
          {nightMode && stars.map((s, i) => <Circle key={i} cx={s.x} cy={s.y} r={s.r} fill="white" opacity={s.opacity} />)}
        </Svg>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.menuContent, { paddingTop: insets.top + webTopInset + 16, paddingBottom: insets.bottom + 40 }]}>
          <View style={styles.menuHeader}>
            <Pressable onPress={() => router.back()} style={styles.topBtn}>
              <Ionicons name="close" size={22} color="#fff" />
            </Pressable>
            <View style={{ flex: 1 }} />
            <Pressable onPress={() => { setShowHamburger(true); bomberSounds.play("menuTap"); Haptics.selectionAsync(); }} style={styles.topBtn}>
              <Ionicons name="menu" size={24} color="#fff" />
            </Pressable>
          </View>

          <Animated.View entering={FadeInUp.duration(500)} style={styles.menuTitleArea}>
            <PremiumText variant="hero" color={nightMode ? "#00FF88" : "#FFD700"} style={{ fontSize: 42, letterSpacing: 4 }}>BOMBER</PremiumText>
            <PremiumText variant="caption" color="rgba(255,255,255,0.5)" style={{ fontSize: 12, letterSpacing: 3, marginTop: 4 }}>LONG DRIVE CONTEST</PremiumText>
          </Animated.View>

          {isLoggedIn && profileData && (
            <Animated.View entering={FadeIn.duration(400).delay(200)} style={styles.profileBar}>
              <View style={styles.profileRow}>
                <View style={[styles.divisionBadge, { borderColor: division.color }]}>
                  <Ionicons name={division.icon as any} size={16} color={division.color} />
                  <PremiumText variant="caption" color={division.color} style={{ fontSize: 10, fontWeight: "700" }}>{division.name}</PremiumText>
                </View>
                <View style={styles.profileStats}>
                  <View style={styles.profileStatItem}>
                    <PremiumText variant="caption" color="rgba(255,255,255,0.4)" style={{ fontSize: 9 }}>LEVEL</PremiumText>
                    <PremiumText variant="title" color="#fff" style={{ fontSize: 18 }}>{levelInfo.level}</PremiumText>
                  </View>
                  <View style={styles.profileStatItem}>
                    <PremiumText variant="caption" color="rgba(255,255,255,0.4)" style={{ fontSize: 9 }}>BEST</PremiumText>
                    <PremiumText variant="title" color="#fff" style={{ fontSize: 18 }}>{personalBest || "—"}</PremiumText>
                  </View>
                  <View style={styles.profileStatItem}>
                    <PremiumText variant="caption" color="rgba(255,255,255,0.4)" style={{ fontSize: 9 }}>DRIVES</PremiumText>
                    <PremiumText variant="title" color="#fff" style={{ fontSize: 18 }}>{profileData.profile.totalDrives}</PremiumText>
                  </View>
                </View>
              </View>
              <View style={styles.xpBar}>
                <View style={[styles.xpFill, { width: `${(levelInfo.currentXp / levelInfo.nextLevelXp) * 100}%`, backgroundColor: division.color }]} />
              </View>
              <View style={styles.currencyRow}>
                <View style={styles.currencyItem}>
                  <Ionicons name="logo-bitcoin" size={14} color="#FFD700" />
                  <PremiumText variant="caption" color="#FFD700" style={{ fontSize: 12, fontWeight: "700" }}>{profileData.profile.coins}</PremiumText>
                </View>
                <View style={styles.currencyItem}>
                  <Ionicons name="diamond" size={14} color="#B9F2FF" />
                  <PremiumText variant="caption" color="#B9F2FF" style={{ fontSize: 12, fontWeight: "700" }}>{profileData.profile.gems}</PremiumText>
                </View>
                <View style={styles.currencyItem}>
                  <Ionicons name="flame" size={14} color="#FF9800" />
                  <PremiumText variant="caption" color="#FF9800" style={{ fontSize: 12, fontWeight: "700" }}>{profileData.profile.currentStreak}d</PremiumText>
                </View>
              </View>
            </Animated.View>
          )}

          {dailyRewardAvailable && isLoggedIn && (
            <Animated.View entering={FadeIn.duration(400).delay(300)}>
              <Pressable onPress={claimDailyReward} style={[styles.dailyRewardBanner, { borderColor: "#FF9800" }]}>
                <Ionicons name="gift" size={24} color="#FF9800" />
                <View style={{ flex: 1 }}>
                  <PremiumText variant="body" color="#FF9800" style={{ fontWeight: "700" }}>Daily Reward Available!</PremiumText>
                  <PremiumText variant="caption" color="rgba(255,255,255,0.5)" style={{ fontSize: 10 }}>Tap to claim your chest</PremiumText>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#FF9800" />
              </Pressable>
            </Animated.View>
          )}

          {profileData && profileData.chests.length > 0 && (
            <Animated.View entering={FadeIn.duration(400).delay(350)}>
              <PremiumText variant="caption" color="rgba(255,255,255,0.4)" style={{ fontSize: 10, marginBottom: 8, marginLeft: 4 }}>UNOPENED CHESTS</PremiumText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {profileData.chests.map((chest: any) => {
                  const ct = CHEST_TYPES[chest.chestType] || CHEST_TYPES.bronze;
                  return (
                    <Pressable key={chest.id} onPress={() => openChest(chest)} style={[styles.chestCard, { borderColor: ct.color + "40" }]}>
                      <Ionicons name={ct.icon as any} size={28} color={ct.color} />
                      <PremiumText variant="caption" color={ct.color} style={{ fontSize: 10, fontWeight: "700" }}>{ct.name}</PremiumText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Animated.View>
          )}

          {selectedVenue.venueId !== "driving_range" && (
            <Animated.View entering={FadeIn.duration(300).delay(350)} style={[styles.venuePreview, { borderColor: "rgba(255,255,255,0.12)" }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="location" size={16} color={nightMode ? "#00FF88" : "#FFD700"} />
                <View style={{ flex: 1 }}>
                  <PremiumText variant="body" color="#fff" style={{ fontWeight: "700", fontSize: 13 }}>{selectedVenue.name}</PremiumText>
                  <PremiumText variant="caption" color="rgba(255,255,255,0.4)" style={{ fontSize: 10 }}>Hole #{selectedVenue.holeNumber} — {selectedVenue.holeName}</PremiumText>
                </View>
                <View style={[styles.tierBadge, { backgroundColor: selectedVenue.tier === "legendary" ? "rgba(255,69,0,0.15)" : selectedVenue.tier === "premium" ? "rgba(156,39,176,0.15)" : "rgba(33,150,243,0.15)" }]}>
                  <PremiumText variant="caption" color={selectedVenue.tier === "legendary" ? "#FF4500" : selectedVenue.tier === "premium" ? "#9C27B0" : "#2196F3"} style={{ fontSize: 8, fontWeight: "800" }}>{selectedVenue.tier.toUpperCase()}</PremiumText>
                </View>
              </View>
              {selectedVenue.altitudeBonus > 0 && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }}>
                  <Ionicons name="trending-up" size={10} color="#4CAF50" />
                  <PremiumText variant="caption" color="#4CAF50" style={{ fontSize: 9 }}>+{Math.round(selectedVenue.altitudeBonus * 100)}% altitude bonus</PremiumText>
                </View>
              )}
            </Animated.View>
          )}

          <View style={styles.modeButtons}>
            <Animated.View entering={FadeInUp.duration(400).delay(400)}>
              <Pressable onPress={() => {
                setGameMode("freeplay"); setGameState("idle");
                if (selectedVenue.venueId !== "driving_range") {
                  const vw = getVenueWeather(selectedVenue);
                  setWeather(vw.weather); setWind(vw.wind);
                } else {
                  const w = getRandomWeather(); setWeather(w); setWind(generateWindForWeather(w));
                }
              }} style={[styles.modeBtn, { backgroundColor: nightMode ? "rgba(0,255,136,0.15)" : "rgba(255,215,0,0.15)", borderColor: nightMode ? "#00FF88" : "#FFD700" }]}>
                <Ionicons name="flash" size={28} color={nightMode ? "#00FF88" : "#FFD700"} />
                <View style={{ flex: 1 }}>
                  <PremiumText variant="subtitle" color="#fff" style={{ fontSize: 16 }}>Free Play</PremiumText>
                  <PremiumText variant="caption" color="rgba(255,255,255,0.5)" style={{ fontSize: 11 }}>
                    {selectedVenue.venueId !== "driving_range" ? `Drive at ${selectedVenue.name}` : "Unlimited drives. Chase your longest."}
                  </PremiumText>
                </View>
              </Pressable>
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(400).delay(500)}>
              <Pressable onPress={startContest} style={[styles.modeBtn, { backgroundColor: "rgba(255,82,82,0.12)", borderColor: "#FF5252" }]}>
                <Ionicons name="trophy" size={28} color="#FF5252" />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <PremiumText variant="subtitle" color="#fff" style={{ fontSize: 16 }}>Contest Mode</PremiumText>
                    {isPro && (
                      <View style={{ backgroundColor: "rgba(255,215,0,0.2)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                        <PremiumText variant="caption" color="#FFD700" style={{ fontSize: 9, fontWeight: "800" }}>PRO</PremiumText>
                      </View>
                    )}
                  </View>
                  <PremiumText variant="caption" color="rgba(255,255,255,0.5)" style={{ fontSize: 11 }}>
                    {isPro ? "Unlimited contests. Compete anytime." : dailyContestUsed ? "Daily contest used. Upgrade for unlimited." : "1 free contest per day. Qualify, bracket, finals."}
                  </PremiumText>
                </View>
                {!isPro && dailyContestUsed && <Ionicons name="lock-closed" size={18} color="rgba(255,255,255,0.4)" />}
              </Pressable>
            </Animated.View>
          </View>

          {Platform.OS === "web" && !isStandalone && (
            <Animated.View entering={FadeInUp.duration(400).delay(450)}>
              <Pressable onPress={handleInstallPWA} style={{ flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "rgba(255,215,0,0.1)", borderWidth: 1.5, borderColor: "rgba(255,215,0,0.4)", borderRadius: 16, padding: 16, marginBottom: 16 }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,215,0,0.15)", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="download-outline" size={22} color="#FFD700" />
                </View>
                <View style={{ flex: 1 }}>
                  <PremiumText variant="subtitle" color="#FFD700" style={{ fontSize: 14, fontWeight: "800" }}>Install Bomber</PremiumText>
                  <PremiumText variant="caption" color="rgba(255,255,255,0.45)" style={{ fontSize: 10 }}>
                    {installPrompt ? "Add to home screen for fullscreen" : "Use browser menu to install"}
                  </PremiumText>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#FFD700" />
              </Pressable>
            </Animated.View>
          )}

          {dailyChallenge && (
            <Animated.View entering={FadeInUp.duration(400).delay(600)} style={[styles.challengeCard, { borderColor: "rgba(255,255,255,0.1)" }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="flag" size={16} color="#FF9800" />
                <PremiumText variant="body" color="#fff" style={{ fontWeight: "700", fontSize: 14 }}>{dailyChallenge.title}</PremiumText>
              </View>
              <PremiumText variant="caption" color="rgba(255,255,255,0.5)" style={{ fontSize: 11, marginTop: 4 }}>{dailyChallenge.description}</PremiumText>
              <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
                <View style={styles.challengeReward}>
                  <Ionicons name="logo-bitcoin" size={12} color="#FFD700" />
                  <PremiumText variant="caption" color="#FFD700" style={{ fontSize: 11 }}>{(dailyChallenge.reward as any)?.coins || 0}</PremiumText>
                </View>
                <View style={styles.challengeReward}>
                  <PremiumText variant="caption" color="#B9F2FF" style={{ fontSize: 11 }}>+{(dailyChallenge.reward as any)?.xp || 0} XP</PremiumText>
                </View>
              </View>
            </Animated.View>
          )}

          {selectedVenue.venueId !== "driving_range" && (() => {
            const vChallenges = getVenueChallenges(selectedVenue.venueId);
            if (vChallenges.length === 0) return null;
            return (
              <Animated.View entering={FadeInUp.duration(400).delay(650)} style={[styles.challengeCard, { borderColor: "rgba(255,255,255,0.1)" }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <Ionicons name="navigate" size={16} color="#FF9800" />
                  <PremiumText variant="body" color="#fff" style={{ fontWeight: "700", fontSize: 14 }}>{selectedVenue.name} Challenges</PremiumText>
                </View>
                {vChallenges.map((ch) => {
                  const done = completedChallengeIds.includes(ch.id);
                  return (
                    <View key={ch.id} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6, opacity: done ? 0.5 : 1 }}>
                      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: done ? "rgba(76,175,80,0.2)" : "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" }}>
                        <Ionicons name={done ? "checkmark" : ch.icon as any} size={14} color={done ? "#4CAF50" : "#FF9800"} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <PremiumText variant="caption" color={done ? "rgba(255,255,255,0.5)" : "#fff"} style={{ fontSize: 12, fontWeight: "600" }}>{ch.name}</PremiumText>
                        <PremiumText variant="caption" color="rgba(255,255,255,0.4)" style={{ fontSize: 10 }}>{ch.description}</PremiumText>
                      </View>
                      {!done && (
                        <View style={{ flexDirection: "row", gap: 4 }}>
                          <PremiumText variant="caption" color="#FFD700" style={{ fontSize: 9 }}>+{ch.reward.coins}</PremiumText>
                          {ch.reward.gems > 0 && <PremiumText variant="caption" color="#B9F2FF" style={{ fontSize: 9 }}>+{ch.reward.gems}g</PremiumText>}
                        </View>
                      )}
                    </View>
                  );
                })}
              </Animated.View>
            );
          })()}

          {!isLoggedIn && (
            <Animated.View entering={FadeIn.duration(400).delay(700)} style={styles.signInPrompt}>
              <PremiumText variant="caption" color="rgba(255,255,255,0.4)" style={{ fontSize: 11, textAlign: "center" }}>Sign in to save progress, earn rewards, and compete on the leaderboard</PremiumText>
              <Pressable onPress={() => router.push("/login")} style={[styles.signInBtn, { borderColor: colors.primary }]}>
                <PremiumText variant="caption" color={colors.primary} style={{ fontSize: 12, fontWeight: "700" }}>Sign In</PremiumText>
              </Pressable>
            </Animated.View>
          )}
        </ScrollView>

        <EquipmentModal visible={showEquipment} onClose={() => setShowEquipment(false)} profileData={profileData} equippedDriverId={equippedDriverId} equippedBallId={equippedBallId} onEquip={equipItem} nightMode={nightMode} />
        <LeaderboardModal visible={showLeaderboard} onClose={() => setShowLeaderboard(false)} data={leaderboardData} userId={user?.id} nightMode={nightMode} />
        <ChestOpenModal visible={showChestOpen} onClose={() => { setShowChestOpen(false); setChestContents(null); }} contents={chestContents} nightMode={nightMode} />
        <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} onPurchase={handlePurchasePro} onRestore={handleRestorePurchase} loading={purchaseLoading} nightMode={nightMode} />
        <VenuesModal
          visible={showVenues}
          onClose={() => setShowVenues(false)}
          selectedVenueId={selectedVenue.venueId}
          unlockedVenueIds={unlockedVenueIds}
          profileData={profileData}
          onSelect={(v: VenueDef) => { setSelectedVenue(v); setShowVenues(false); Haptics.selectionAsync(); }}
          onUnlock={unlockVenue}
          nightMode={nightMode}
        />
        <AchievementsModal
          visible={showAchievements}
          onClose={() => setShowAchievements(false)}
          unlockedIds={unlockedAchievementIds}
          nightMode={nightMode}
        />
        <TournamentsModal
          visible={showTournaments}
          onClose={() => setShowTournaments(false)}
          tournaments={tournaments}
          nightMode={nightMode}
        />
        <Modal visible={showHamburger} animationType="slide" transparent>
          <View style={{ flex: 1, backgroundColor: nightMode ? "rgba(5,5,24,0.98)" : "rgba(0,0,0,0.97)" }}>
            <ScrollView contentContainerStyle={{ paddingTop: insets.top + webTopInset + 16, paddingHorizontal: 24, paddingBottom: insets.bottom + 40 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,215,0,0.1)", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "rgba(255,215,0,0.3)" }}>
                    <Ionicons name="flash" size={24} color="#FFD700" />
                  </View>
                  <View>
                    <PremiumText variant="subtitle" color="#fff" style={{ fontSize: 20, letterSpacing: 2 }}>BOMBER</PremiumText>
                    <PremiumText variant="caption" color="rgba(255,255,255,0.3)" style={{ fontSize: 9, letterSpacing: 2 }}>LONG DRIVE CONTEST</PremiumText>
                  </View>
                </View>
                <Pressable onPress={() => setShowHamburger(false)} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="close" size={22} color="#fff" />
                </Pressable>
              </View>

              {Platform.OS === "web" && !isStandalone && (
                <Pressable onPress={handleInstallPWA} style={{ backgroundColor: "rgba(255,215,0,0.12)", borderWidth: 1.5, borderColor: "#FFD700", borderRadius: 16, padding: 18, marginBottom: 28, flexDirection: "row", alignItems: "center", gap: 14 }}>
                  <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(255,215,0,0.2)", alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name="download" size={26} color="#FFD700" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <PremiumText variant="subtitle" color="#FFD700" style={{ fontSize: 16, fontWeight: "800" }}>Install Bomber App</PremiumText>
                    <PremiumText variant="caption" color="rgba(255,255,255,0.5)" style={{ fontSize: 11, marginTop: 2 }}>
                      {installPrompt ? "Add to your home screen for fullscreen play" : "Use your browser menu to add to home screen"}
                    </PremiumText>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#FFD700" />
                </Pressable>
              )}

              <PremiumText variant="caption" color="rgba(255,255,255,0.3)" style={{ fontSize: 10, letterSpacing: 2, marginBottom: 12 }}>GAME</PremiumText>
              {[
                { icon: "stats-chart-outline", label: "Dashboard", desc: "Your stats & progress", onPress: () => { setShowHamburger(false); router.push("/bomber-dashboard"); } },
                { icon: "construct-outline", label: "Equipment", desc: "Drivers & balls", onPress: () => { setShowHamburger(false); setShowEquipment(true); } },
                { icon: "podium-outline", label: "Leaderboard", desc: "Top drives worldwide", onPress: () => { setShowHamburger(false); loadLeaderboard(); setShowLeaderboard(true); } },
                { icon: "map-outline", label: "Venues", desc: "12 real course venues", onPress: () => { setShowHamburger(false); setShowVenues(true); } },
                { icon: "ribbon-outline", label: "Achievements", desc: `${unlockedAchievementIds.length}/${ACHIEVEMENTS.length} unlocked`, onPress: () => { setShowHamburger(false); loadAchievements(); setShowAchievements(true); } },
                { icon: "calendar-outline", label: "Events", desc: "Tournaments & specials", onPress: () => { setShowHamburger(false); loadTournaments(); setShowTournaments(true); } },
              ].map((item) => (
                <Pressable key={item.label} onPress={() => { item.onPress(); Haptics.selectionAsync(); }} style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,0.06)" }}>
                  <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.04)", alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name={item.icon as any} size={20} color="rgba(255,255,255,0.7)" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <PremiumText variant="body" color="#fff" style={{ fontWeight: "600", fontSize: 15 }}>{item.label}</PremiumText>
                    <PremiumText variant="caption" color="rgba(255,255,255,0.4)" style={{ fontSize: 11 }}>{item.desc}</PremiumText>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.2)" />
                </Pressable>
              ))}

              <PremiumText variant="caption" color="rgba(255,255,255,0.3)" style={{ fontSize: 10, letterSpacing: 2, marginTop: 28, marginBottom: 12 }}>SETTINGS</PremiumText>
              <Pressable onPress={() => { setSoundEnabled(!soundEnabled); AsyncStorage.setItem("bomber_sound_enabled", String(!soundEnabled)); Haptics.selectionAsync(); }} style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,0.06)" }}>
                <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.04)", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name={soundEnabled ? "volume-high" : "volume-mute"} size={20} color="rgba(255,255,255,0.7)" />
                </View>
                <View style={{ flex: 1 }}>
                  <PremiumText variant="body" color="#fff" style={{ fontWeight: "600", fontSize: 15 }}>Sound Effects</PremiumText>
                  <PremiumText variant="caption" color="rgba(255,255,255,0.4)" style={{ fontSize: 11 }}>{soundEnabled ? "On" : "Off"}</PremiumText>
                </View>
                <View style={{ width: 44, height: 26, borderRadius: 13, backgroundColor: soundEnabled ? "rgba(0,255,136,0.3)" : "rgba(255,255,255,0.1)", justifyContent: "center", padding: 2 }}>
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: soundEnabled ? "#00FF88" : "rgba(255,255,255,0.4)", alignSelf: soundEnabled ? "flex-end" : "flex-start" }} />
                </View>
              </Pressable>
              <Pressable onPress={() => { setNightMode(!nightMode); Haptics.selectionAsync(); }} style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,0.06)" }}>
                <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.04)", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name={nightMode ? "moon" : "sunny"} size={20} color="rgba(255,255,255,0.7)" />
                </View>
                <View style={{ flex: 1 }}>
                  <PremiumText variant="body" color="#fff" style={{ fontWeight: "600", fontSize: 15 }}>Night Mode</PremiumText>
                  <PremiumText variant="caption" color="rgba(255,255,255,0.4)" style={{ fontSize: 11 }}>{nightMode ? "On" : "Off"}</PremiumText>
                </View>
                <View style={{ width: 44, height: 26, borderRadius: 13, backgroundColor: nightMode ? "rgba(0,255,136,0.3)" : "rgba(255,255,255,0.1)", justifyContent: "center", padding: 2 }}>
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: nightMode ? "#00FF88" : "rgba(255,255,255,0.4)", alignSelf: nightMode ? "flex-end" : "flex-start" }} />
                </View>
              </Pressable>

              {isPro && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 24, padding: 14, backgroundColor: "rgba(255,215,0,0.08)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,215,0,0.2)" }}>
                  <Ionicons name="shield-checkmark" size={20} color="#FFD700" />
                  <View style={{ flex: 1 }}>
                    <PremiumText variant="body" color="#FFD700" style={{ fontWeight: "700", fontSize: 13 }}>Bomber Pro Active</PremiumText>
                    <PremiumText variant="caption" color="rgba(255,255,255,0.4)" style={{ fontSize: 10 }}>Unlimited contests unlocked</PremiumText>
                  </View>
                </View>
              )}

              <View style={{ alignItems: "center", marginTop: 44, gap: 4 }}>
                <PremiumText variant="caption" color="rgba(255,255,255,0.15)" style={{ fontSize: 10 }}>Bomber v1.0</PremiumText>
                <PremiumText variant="caption" color="rgba(255,255,255,0.1)" style={{ fontSize: 9 }}>DarkWave Studios LLC &copy; 2026</PremiumText>
              </View>
            </ScrollView>
          </View>
        </Modal>
        {newAchievements.length > 0 && (
          <AchievementToast
            achievements={newAchievements}
            onDismiss={() => setNewAchievements([])}
          />
        )}
        {challengeJustCompleted && (
          <ChallengeCompleteToast challenge={challengeJustCompleted} onDismiss={() => setChallengeJustCompleted(null)} />
        )}
      </View>
    );
  }

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
              <Stop offset="0" stopColor={theme.sky1} /><Stop offset="1" stopColor={theme.sky2} />
            </SvgLinearGradient>
            <SvgLinearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={theme.ground} /><Stop offset="1" stopColor={theme.groundDark} />
            </SvgLinearGradient>
            <SvgLinearGradient id="fairwayDark" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="rgba(0,0,0,0.06)" /><Stop offset="1" stopColor="rgba(0,0,0,0.02)" />
            </SvgLinearGradient>
            <SvgLinearGradient id="fairwayLight" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="rgba(255,255,255,0.04)" /><Stop offset="1" stopColor="rgba(255,255,255,0.01)" />
            </SvgLinearGradient>
            <SvgRadialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#FFF9C4" stopOpacity="1" />
              <Stop offset="0.3" stopColor="#FFF176" stopOpacity="0.6" />
              <Stop offset="0.6" stopColor="#FFE082" stopOpacity="0.15" />
              <Stop offset="1" stopColor="#FFE082" stopOpacity="0" />
            </SvgRadialGradient>
            <SvgRadialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#E8F5E9" stopOpacity="0.8" />
              <Stop offset="0.4" stopColor="#B2DFDB" stopOpacity="0.2" />
              <Stop offset="1" stopColor="#B2DFDB" stopOpacity="0" />
            </SvgRadialGradient>
            <SvgRadialGradient id="spotlightCone" cx="50%" cy="0%" r="80%">
              <Stop offset="0" stopColor="#FFF9C4" stopOpacity={nightMode ? "0.08" : "0"} />
              <Stop offset="1" stopColor="#FFF9C4" stopOpacity="0" />
            </SvgRadialGradient>
            <SvgLinearGradient id="teeBoxGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={nightMode ? "#2E7D32" : "#66BB6A"} />
              <Stop offset="1" stopColor={nightMode ? "#1B5E20" : "#388E3C"} />
            </SvgLinearGradient>
            <SvgLinearGradient id="hillFar" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={nightMode ? "#0d3d1a" : "#5D8A5E"} />
              <Stop offset="1" stopColor={nightMode ? "#0a2d12" : "#4A7A4B"} />
            </SvgLinearGradient>
            <SvgLinearGradient id="hillNear" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={nightMode ? "#153d1a" : "#4CAF50"} />
              <Stop offset="1" stopColor={nightMode ? "#0d2d10" : "#388E3C"} />
            </SvgLinearGradient>
          </Defs>

          {/* SKY */}
          <Rect x="0" y="0" width={svgWidth} height={groundY} fill="url(#skyGrad)" />

          {/* STARS (night) */}
          {nightMode && stars.map((s, i) => (
            <Circle key={i} cx={s.x} cy={s.y} r={s.r} fill="white" opacity={s.opacity * (0.7 + Math.sin(i * 0.5 + cloudOffset * 0.02) * 0.3)} />
          ))}

          {/* SUN (day) with lens flare */}
          {!nightMode && (
            <G>
              <Circle cx={sunX} cy={sunY} r={55} fill="url(#sunGlow)" />
              <Circle cx={sunX} cy={sunY} r={22} fill="#FFF9C4" opacity={0.95} />
              <Circle cx={sunX} cy={sunY} r={18} fill="#FFEE58" />
              <Line x1={sunX - 35} y1={sunY} x2={sunX - 26} y2={sunY} stroke="#FFF9C4" strokeWidth={1.5} opacity={0.4} />
              <Line x1={sunX + 26} y1={sunY} x2={sunX + 35} y2={sunY} stroke="#FFF9C4" strokeWidth={1.5} opacity={0.4} />
              <Line x1={sunX} y1={sunY - 35} x2={sunX} y2={sunY - 26} stroke="#FFF9C4" strokeWidth={1.5} opacity={0.4} />
              <Line x1={sunX} y1={sunY + 26} x2={sunX} y2={sunY + 35} stroke="#FFF9C4" strokeWidth={1.5} opacity={0.4} />
              <Circle cx={sunX - 30} cy={sunY + 50} r={4} fill="#FFF9C4" opacity={0.12} />
              <Circle cx={sunX - 45} cy={sunY + 80} r={3} fill="#FFF9C4" opacity={0.08} />
              <Ellipse cx={sunX - 60} cy={sunY + 110} rx={6} ry={3} fill="#FFF9C4" opacity={0.06} />
            </G>
          )}

          {/* MOON (night) */}
          {nightMode && (
            <G>
              <Circle cx={svgWidth * 0.82} cy={svgHeight * 0.06} r={30} fill="url(#moonGlow)" />
              <Circle cx={svgWidth * 0.82} cy={svgHeight * 0.06} r={12} fill="#E0E0E0" opacity={0.7} />
              <Circle cx={svgWidth * 0.82 - 3} cy={svgHeight * 0.06 - 2} r={2} fill="#BDBDBD" opacity={0.3} />
              <Circle cx={svgWidth * 0.82 + 4} cy={svgHeight * 0.06 + 3} r={1.5} fill="#BDBDBD" opacity={0.25} />
            </G>
          )}

          {/* CLOUDS (day) - drifting */}
          {!nightMode && clouds.map((c, i) => {
            const cx = ((c.x + cloudOffset * c.speed) % (svgWidth + 120)) - 60;
            return (
              <G key={`cloud-${i}`}>
                <Ellipse cx={cx} cy={c.y} rx={c.rx} ry={c.ry} fill="white" opacity={c.opacity} />
                <Ellipse cx={cx - c.rx * 0.5} cy={c.y + 2} rx={c.rx * 0.6} ry={c.ry * 0.7} fill="white" opacity={c.opacity * 0.8} />
                <Ellipse cx={cx + c.rx * 0.4} cy={c.y + 1} rx={c.rx * 0.5} ry={c.ry * 0.6} fill="white" opacity={c.opacity * 0.7} />
              </G>
            );
          })}

          {/* DISTANT HILLS (back layer) */}
          <Path d={hillPath} fill="url(#hillFar)" opacity={nightMode ? 0.6 : 0.4} />

          {/* TREE LINE along horizon */}
          {treeLine.map((t, i) => (
            <G key={`tree-${i}`}>
              <Rect x={t.x - 1} y={t.y + t.h * 0.3} width={2} height={t.h * 0.4} fill={nightMode ? "#1a3a1a" : "#5D4037"} opacity={nightMode ? 0.5 : 0.3} />
              <Ellipse cx={t.x} cy={t.y} rx={t.w * 0.7} ry={t.h * 0.5} fill={nightMode ? "#0d2d0d" : "#2E7D32"} opacity={nightMode ? 0.5 : 0.35} />
            </G>
          ))}

          {/* NEAR HILLS */}
          <Path d={hillPath2} fill="url(#hillNear)" opacity={nightMode ? 0.5 : 0.3} />

          {/* GROUND */}
          <Rect x="0" y={groundY} width={svgWidth} height={svgHeight - groundY} fill="url(#groundGrad)" />

          {/* FAIRWAY MOWING STRIPES */}
          {fairwayStripes.map((stripe, i) => (
            <Rect key={`stripe-${i}`} x={stripe.x} y={groundY} width={stripe.w} height={svgHeight - groundY}
              fill={stripe.dark ? "url(#fairwayDark)" : "url(#fairwayLight)"} />
          ))}

          {/* TEE BOX — detailed platform */}
          <Rect x={teeX - 18} y={groundY - 2} width={36} height={10} rx={3} fill="url(#teeBoxGrad)" opacity={0.9} />
          <Rect x={teeX - 14} y={groundY - 1} width={28} height={3} rx={1.5} fill={nightMode ? "#43A047" : "#81C784"} opacity={0.6} />
          <Rect x={teeX - 1} y={groundY - 6} width={2} height={5} rx={1} fill={nightMode ? "#A5D6A7" : "#fff"} opacity={0.8} />
          <Circle cx={teeX} cy={groundY - 7} r={2.5} fill={theme.ball} />

          {/* GOLFER SILHOUETTE at tee */}
          {gameState === "idle" && (
            <G opacity={0.6}>
              <Circle cx={teeX + 1} cy={groundY - 28} r={4} fill={nightMode ? "#1B5E20" : "#3E2723"} />
              <Rect x={teeX - 1.5} y={groundY - 24} width={5} height={12} rx={2} fill={nightMode ? "#1B5E20" : "#3E2723"} />
              <Line x1={teeX + 3} y1={groundY - 20} x2={teeX + 12} y2={groundY - 28} stroke={nightMode ? "#1B5E20" : "#3E2723"} strokeWidth={1.5} strokeLinecap="round" />
              <Line x1={teeX - 1} y1={groundY - 12} x2={teeX - 3} y2={groundY - 4} stroke={nightMode ? "#1B5E20" : "#3E2723"} strokeWidth={1.5} strokeLinecap="round" />
              <Line x1={teeX + 3} y1={groundY - 12} x2={teeX + 5} y2={groundY - 4} stroke={nightMode ? "#1B5E20" : "#3E2723"} strokeWidth={1.5} strokeLinecap="round" />
            </G>
          )}

          {/* SPECTATORS behind tee box */}
          {spectators.map((s, i) => (
            <G key={`spec-${i}`} opacity={nightMode ? 0.25 : 0.4}>
              <Circle cx={s.x} cy={s.y - s.h * 0.6} r={2.5} fill={s.color} />
              <Rect x={s.x - 2} y={s.y - s.h * 0.4} width={4} height={s.h * 0.5} rx={1.5} fill={s.color} opacity={0.8} />
            </G>
          ))}

          {/* STADIUM LIGHTS (night) — with poles and volumetric cones */}
          {nightMode && stadiumLights.map((l, i) => (
            <G key={`light-${i}`}>
              <Line x1={l.x} y1={groundY} x2={l.x} y2={l.y + 8} stroke="#444" strokeWidth={2.5} opacity={0.6} />
              <Rect x={l.x - 6} y={l.y} width={12} height={6} rx={2} fill="#555" opacity={0.8} />
              <Path
                d={`M${l.x - 5},${l.y + 6} L${l.x - 40},${groundY} L${l.x + 40},${groundY} L${l.x + 5},${l.y + 6} Z`}
                fill="url(#spotlightCone)" opacity={0.5}
              />
              <Circle cx={l.x - 3} cy={l.y + 3} r={2} fill="#FFF9C4" opacity={0.95} />
              <Circle cx={l.x + 3} cy={l.y + 3} r={2} fill="#FFF9C4" opacity={0.95} />
              <Circle cx={l.x} cy={l.y + 3} r={2} fill="#FFF9C4" opacity={0.9} />
              <Circle cx={l.x} cy={l.y + 3} r={10} fill="#FFF9C4" opacity={0.08} />
              <Circle cx={l.x} cy={l.y + 3} r={25} fill="#FFF9C4" opacity={0.03} />
            </G>
          ))}

          {/* GRID LINE (horizon) */}
          <Line x1={teeX} y1={groundY} x2={teeX + landingAreaWidth} y2={groundY} stroke={theme.gridLine} strokeWidth={1.5} />

          {/* BOUNDARY LINES — left and right edges of the grid */}
          <Line x1={teeX} y1={groundY - 16} x2={teeX} y2={groundY + svgHeight * 0.08} stroke={nightMode ? "rgba(255,82,82,0.3)" : "rgba(255,82,82,0.2)"} strokeWidth={1} strokeDasharray="4,4" />
          <Line x1={teeX + landingAreaWidth} y1={groundY - 16} x2={teeX + landingAreaWidth} y2={groundY + svgHeight * 0.08} stroke={nightMode ? "rgba(255,82,82,0.3)" : "rgba(255,82,82,0.2)"} strokeWidth={1} strokeDasharray="4,4" />

          {/* GRID MARKERS with flags at 50-yard intervals */}
          {gridMarkers.map((yard) => {
            const x = yardToScreenX(yard);
            const isMajor = yard % 50 === 0;
            return (
              <G key={yard}>
                <Line x1={x} y1={groundY - (isMajor ? 14 : 6)} x2={x} y2={groundY + (isMajor ? 14 : 6)} stroke={theme.gridLine} strokeWidth={isMajor ? 1.5 : 0.8} />
                {isMajor && (
                  <G>
                    <Line x1={x} y1={groundY - 14} x2={x} y2={groundY - 28} stroke={nightMode ? "#4CAF50" : "#fff"} strokeWidth={1} opacity={0.7} />
                    <Polygon points={`${x},${groundY - 28} ${x + 8},${groundY - 25} ${x},${groundY - 22}`} fill={yard === 300 ? "#FFD700" : yard === 400 ? "#FF5252" : nightMode ? "#00FF88" : "#fff"} opacity={0.7} />
                    <SvgText x={x} y={groundY + 26} textAnchor="middle" fill={theme.text} fontSize={10} fontWeight="700">{yard}</SvgText>
                  </G>
                )}
              </G>
            );
          })}

          {/* BALL SHADOW on ground */}
          {showBall && (
            <Ellipse cx={ballShadowX} cy={groundY + 2} rx={6} ry={2} fill="#000" opacity={ballShadowOpacity} />
          )}

          {/* TRAJECTORY TRACER */}
          {trajectoryPoints.length > 0 && (
            <G>
              <Polyline points={trajectoryPoints} fill="none" stroke={theme.tracerGlow} strokeWidth={nightMode ? 10 : 6} strokeLinecap="round" strokeLinejoin="round" opacity={0.6} />
              <Polyline points={trajectoryPoints} fill="none" stroke={theme.tracer} strokeWidth={nightMode ? 3.5 : 2.5} strokeLinecap="round" strokeLinejoin="round" />
            </G>
          )}

          {/* BALL TRAIL particles */}
          {showBall && ballTrail.length > 1 && ballTrail.map((tp, i) => {
            const age = (ballTrail.length - 1 - i) / ballTrail.length;
            const opacity = Math.max(0.02, (1 - age) * 0.6);
            const r = Math.max(0.8, 3.5 * (1 - age));
            const isPowerDrive = power >= 85;
            const trailColor = isPowerDrive ? (nightMode ? "#FF6B35" : "#FF4500") : theme.tracer;
            return <Circle key={i} cx={tp.x} cy={tp.y} r={r} fill={trailColor} opacity={opacity} />;
          })}

          {/* POWER DRIVE outer glow */}
          {showBall && power >= 85 && ballTrail.length > 1 && ballTrail.slice(-5).map((tp, i) => (
            <Circle key={`glow-${i}`} cx={tp.x} cy={tp.y} r={8 + i * 2.5} fill={nightMode ? "#FF6B35" : "#FF4500"} opacity={0.04 + i * 0.015} />
          ))}

          {/* THE BALL */}
          {showBall && (
            <G>
              {nightMode && <Circle cx={ballPos.x} cy={ballPos.y} r={12} fill={theme.ball} opacity={0.1} />}
              {nightMode && <Circle cx={ballPos.x} cy={ballPos.y} r={7} fill={theme.ball} opacity={0.2} />}
              {power >= 85 && <Circle cx={ballPos.x} cy={ballPos.y} r={12} fill={nightMode ? "#FF6B35" : "#FF4500"} opacity={0.1} />}
              <Circle cx={ballPos.x} cy={ballPos.y} r={4.5} fill={theme.ball} />
              <Circle cx={ballPos.x - 1} cy={ballPos.y - 1} r={1.5} fill="#fff" opacity={0.5} />
            </G>
          )}

          {/* LANDING DUST BURST */}
          {landingDust && landingDust.particles.map((p, i) => (
            <Circle key={`dust-${i}`} cx={landingDust.x + p.dx} cy={landingDust.y + p.dy} r={p.r}
              fill={nightMode ? "#4CAF50" : "#8D6E63"} opacity={p.o * 0.6} />
          ))}

          {/* LANDING MARKER */}
          {gameState === "landed" && currentResult && (
            <G>
              <Circle cx={yardToScreenX(currentResult.carry + currentResult.roll)} cy={groundY} r={8} fill={currentResult.inBounds ? theme.tracer : "#FF5252"} opacity={0.15} />
              <Circle cx={yardToScreenX(currentResult.carry + currentResult.roll)} cy={groundY} r={5} fill={currentResult.inBounds ? theme.tracer : "#FF5252"} opacity={0.4} />
              <Circle cx={yardToScreenX(currentResult.carry + currentResult.roll)} cy={groundY} r={2.5} fill={currentResult.inBounds ? theme.tracer : "#FF5252"} opacity={0.9} />
            </G>
          )}
        </Svg>
      </Pressable>

      <View style={[styles.topBar, { paddingTop: insets.top + webTopInset }]} pointerEvents="box-none">
        <Pressable onPress={goToMenu} style={styles.topBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <View style={styles.titleArea}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <PremiumText variant="label" color="#fff" style={{ fontSize: 13, letterSpacing: 3 }}>
              {selectedVenue.venueId !== "driving_range" ? selectedVenue.name.toUpperCase() : "BOMBER"}
            </PremiumText>
            {gameMode === "contest" && contest && (
              <View style={[styles.roundBadge, { backgroundColor: "rgba(255,82,82,0.2)" }]}>
                <PremiumText variant="caption" color="#FF5252" style={{ fontSize: 9, fontWeight: "800" }}>{contest.round.toUpperCase()}</PremiumText>
              </View>
            )}
          </View>
          <View style={styles.windRow}>
            <Ionicons name={weather.icon as any} size={12} color="rgba(255,255,255,0.6)" />
            <Ionicons name={windIcon} size={14} color="rgba(255,255,255,0.8)" />
            <PremiumText variant="caption" color="rgba(255,255,255,0.8)" style={{ fontSize: 11 }}>{windLabel}</PremiumText>
          </View>
        </View>
        <Pressable onPress={() => { setNightMode(!nightMode); Haptics.selectionAsync(); }} style={styles.topBtn}>
          <Ionicons name={nightMode ? "sunny" : "moon"} size={20} color="#fff" />
        </Pressable>
      </View>

      {isLoggedIn && profileData && gameState === "idle" && (
        <View style={[styles.statsBar, { top: insets.top + webTopInset + 52 }]}>
          <View style={styles.miniCurrency}>
            <Ionicons name="logo-bitcoin" size={11} color="#FFD700" />
            <PremiumText variant="caption" color="#FFD700" style={{ fontSize: 10 }}>{profileData.profile.coins}</PremiumText>
          </View>
          <View style={[styles.xpBarSmall]}>
            <View style={[styles.xpFillSmall, { width: `${(levelInfo.currentXp / levelInfo.nextLevelXp) * 100}%`, backgroundColor: division.color }]} />
          </View>
          <PremiumText variant="caption" color={division.color} style={{ fontSize: 10, fontWeight: "700" }}>Lv{levelInfo.level}</PremiumText>
        </View>
      )}

      {personalBest > 0 && gameState !== "landed" && (
        <View style={[styles.bestBadge, { top: insets.top + webTopInset + (isLoggedIn ? 74 : 52) }]}>
          <Ionicons name="trophy" size={12} color="#FFD700" />
          <PremiumText variant="caption" color="#FFD700" style={{ fontSize: 11, fontWeight: "700" }}>{personalBest} YDS</PremiumText>
        </View>
      )}

      {gameMode === "contest" && contest && (gameState === "idle" || gameState === "powering" || gameState === "aiming") && (
        <View style={[styles.contestBar, { top: insets.top + webTopInset + 90 }]}>
          <View style={styles.contestInfo}>
            <View style={styles.contestPlayer}>
              <Ionicons name="person" size={14} color="#fff" />
              <PremiumText variant="caption" color="#fff" style={{ fontSize: 11 }}>You: {contest.playerBest > 0 ? `${contest.playerBest}` : "—"}</PremiumText>
            </View>
            <PremiumText variant="caption" color="rgba(255,255,255,0.3)" style={{ fontSize: 10 }}>VS</PremiumText>
            <View style={styles.contestPlayer}>
              <Ionicons name={contest.opponent.avatar as any} size={14} color="#FF5252" />
              <PremiumText variant="caption" color="#FF5252" style={{ fontSize: 11 }}>{contest.opponent.name}: {contest.opponentBest > 0 ? `${contest.opponentBest}` : "—"}</PremiumText>
            </View>
          </View>
          <View style={styles.ballCounter}>
            {Array.from({ length: contest.totalBalls }).map((_, i) => (
              <View key={i} style={[styles.ballDot, { backgroundColor: i < contest.totalBalls - contest.ballsRemaining ? "rgba(255,255,255,0.3)" : "#fff" }]} />
            ))}
          </View>
          {(gameState === "powering" || gameState === "aiming") && (
            <View style={[styles.shotClockBadge, { backgroundColor: shotClock <= 10 ? "rgba(255,82,82,0.3)" : "rgba(0,0,0,0.3)" }]}>
              <Ionicons name="timer-outline" size={12} color={shotClock <= 10 ? "#FF5252" : "#fff"} />
              <PremiumText variant="caption" color={shotClock <= 10 ? "#FF5252" : "#fff"} style={{ fontSize: 14, fontWeight: "800" }}>{shotClock}</PremiumText>
            </View>
          )}
        </View>
      )}

      {(gameState === "powering" || gameState === "aiming") && (
        <View style={[styles.powerMeterContainer, { top: svgHeight * 0.2, left: 16 }]} pointerEvents="none">
          <View style={[styles.powerMeterTrack, { height: svgHeight * 0.4, borderColor: "rgba(255,255,255,0.3)" }]}>
            <View style={[styles.powerMeterFill, { height: `${power}%`, backgroundColor: power < 40 ? "#4CAF50" : power < 70 ? "#FFC107" : power < 90 ? "#FF9800" : "#F44336" }]} />
            {gameState === "powering" && (
              <View style={[styles.powerMeterIndicator, { bottom: `${power}%` }]}>
                <View style={styles.powerMeterArrow} />
              </View>
            )}
          </View>
          <PremiumText variant="caption" color="#fff" style={{ fontSize: 12, marginTop: 6, fontWeight: "700" }}>{power}%</PremiumText>
          {gameState === "powering" && <PremiumText variant="caption" color="rgba(255,255,255,0.6)" style={{ fontSize: 9, marginTop: 2 }}>TAP</PremiumText>}
        </View>
      )}

      {gameState === "aiming" && (
        <View style={[styles.accuracyMeterContainer, { bottom: svgHeight * 0.12 }]} pointerEvents="none">
          <View style={[styles.accuracyMeterTrack, { width: svgWidth * 0.6, borderColor: "rgba(255,255,255,0.3)" }]}>
            <View style={styles.accuracyCenterLine} />
            <View style={[styles.accuracyIndicator, { left: `${accuracy}%`, backgroundColor: Math.abs(accuracy - 50) < 15 ? "#4CAF50" : Math.abs(accuracy - 50) < 30 ? "#FFC107" : "#F44336" }]} />
          </View>
          <View style={styles.accuracyLabels}>
            <PremiumText variant="caption" color="rgba(255,255,255,0.5)" style={{ fontSize: 9 }}>HOOK</PremiumText>
            <PremiumText variant="caption" color="#fff" style={{ fontSize: 10, fontWeight: "700" }}>ACCURACY</PremiumText>
            <PremiumText variant="caption" color="rgba(255,255,255,0.5)" style={{ fontSize: 9 }}>SLICE</PremiumText>
          </View>
        </View>
      )}

      {gameState === "idle" && (
        <Animated.View entering={FadeIn.duration(400)} style={styles.startPrompt}>
          {driverDef && driverDef.id !== "standard" && (
            <View style={[styles.equippedTag, { borderColor: RARITY_COLORS[driverDef.rarity] + "60" }]}>
              <Ionicons name="construct" size={10} color={RARITY_COLORS[driverDef.rarity]} />
              <PremiumText variant="caption" color={RARITY_COLORS[driverDef.rarity]} style={{ fontSize: 9 }}>{driverDef.name}</PremiumText>
            </View>
          )}
          <Pressable onPress={handleTap} style={[styles.driveButton, { backgroundColor: nightMode ? "#00FF88" : "#FFD700" }]}>
            <Ionicons name="flash" size={24} color={nightMode ? "#0a0a2e" : "#1B5E20"} />
            <PremiumText variant="subtitle" color={nightMode ? "#0a0a2e" : "#1B5E20"} style={{ fontSize: 18 }}>
              {gameMode === "contest" && contest ? `DRIVE (${contest.ballsRemaining} left)` : "DRIVE"}
            </PremiumText>
          </Pressable>
          <PremiumText variant="caption" color="rgba(255,255,255,0.5)" style={{ fontSize: 10, marginTop: 8 }}>Tap to start swing</PremiumText>
        </Animated.View>
      )}

      {gameState === "landed" && currentResult && (
        <Animated.View style={[styles.resultsOverlay, resultStyle]}>
          <View style={[styles.resultsPanel, { backgroundColor: nightMode ? "rgba(10,10,46,0.92)" : "rgba(0,0,0,0.85)", borderColor: currentResult.inBounds ? (nightMode ? "rgba(0,255,136,0.3)" : "rgba(255,215,0,0.3)") : "rgba(255,82,82,0.3)" }]}>
            {!currentResult.inBounds ? (
              <Animated.View entering={ZoomIn.duration(300)}>
                <PremiumText variant="hero" color="#FF5252" style={{ textAlign: "center", fontSize: 28 }}>OUT OF BOUNDS</PremiumText>
                <PremiumText variant="title" color="rgba(255,82,82,0.5)" style={{ textAlign: "center", fontSize: 22, marginTop: 4 }}>{currentResult.total} yds</PremiumText>
              </Animated.View>
            ) : (
              <Animated.View entering={ZoomIn.duration(400)}>
                {currentResult.total >= personalBest && personalBest > 0 && (
                  <Animated.View entering={FadeInUp.duration(500).delay(300)} style={styles.newBestBadge}>
                    <Ionicons name="trophy" size={14} color="#FFD700" />
                    <PremiumText variant="caption" color="#FFD700" style={{ fontWeight: "800", fontSize: 12 }}>NEW BEST!</PremiumText>
                  </Animated.View>
                )}
                <PremiumText variant="hero" color={nightMode ? "#00FF88" : "#FFD700"} style={{ textAlign: "center", fontSize: 52, fontWeight: "900" }}>{currentResult.total}</PremiumText>
                <PremiumText variant="caption" color="rgba(255,255,255,0.5)" style={{ textAlign: "center", fontSize: 13, letterSpacing: 2 }}>TOTAL YARDS</PremiumText>
                <View style={styles.carryRollRow}>
                  <View style={styles.statBox}><PremiumText variant="caption" color="rgba(255,255,255,0.4)" style={{ fontSize: 9 }}>CARRY</PremiumText><PremiumText variant="title" color="#fff" style={{ fontSize: 20 }}>{currentResult.carry}</PremiumText></View>
                  <View style={[styles.statDivider, { backgroundColor: "rgba(255,255,255,0.15)" }]} />
                  <View style={styles.statBox}><PremiumText variant="caption" color="rgba(255,255,255,0.4)" style={{ fontSize: 9 }}>ROLL</PremiumText><PremiumText variant="title" color="#fff" style={{ fontSize: 20 }}>{currentResult.roll}</PremiumText></View>
                </View>
              </Animated.View>
            )}

            <View style={styles.statsRow}>
              <View style={styles.miniStat}><PremiumText variant="caption" color="rgba(255,255,255,0.4)" style={{ fontSize: 8 }}>BALL SPEED</PremiumText><PremiumText variant="caption" color="#fff" style={{ fontSize: 13, fontWeight: "700" }}>{currentResult.ballSpeed} mph</PremiumText></View>
              <View style={styles.miniStat}><PremiumText variant="caption" color="rgba(255,255,255,0.4)" style={{ fontSize: 8 }}>LAUNCH</PremiumText><PremiumText variant="caption" color="#fff" style={{ fontSize: 13, fontWeight: "700" }}>{currentResult.launchAngle}°</PremiumText></View>
              <View style={styles.miniStat}><PremiumText variant="caption" color="rgba(255,255,255,0.4)" style={{ fontSize: 8 }}>POWER</PremiumText><PremiumText variant="caption" color="#fff" style={{ fontSize: 13, fontWeight: "700" }}>{currentResult.power}%</PremiumText></View>
              <View style={styles.miniStat}><PremiumText variant="caption" color="rgba(255,255,255,0.4)" style={{ fontSize: 8 }}>WIND</PremiumText><PremiumText variant="caption" color="#fff" style={{ fontSize: 13, fontWeight: "700" }}>{currentResult.wind > 0 ? "+" : ""}{currentResult.wind}</PremiumText></View>
            </View>

            {isLoggedIn && (xpGained > 0 || coinsGained > 0) && (
              <Animated.View entering={FadeIn.duration(300).delay(400)} style={styles.rewardsRow}>
                {xpGained > 0 && <View style={styles.rewardChip}><PremiumText variant="caption" color="#B9F2FF" style={{ fontSize: 11, fontWeight: "700" }}>+{xpGained} XP</PremiumText></View>}
                {coinsGained > 0 && <View style={styles.rewardChip}><Ionicons name="logo-bitcoin" size={10} color="#FFD700" /><PremiumText variant="caption" color="#FFD700" style={{ fontSize: 11, fontWeight: "700" }}>+{coinsGained}</PremiumText></View>}
              </Animated.View>
            )}

            {gameMode === "contest" && contest && contest.ballsRemaining <= 0 && (
              <Animated.View entering={FadeInUp.duration(400).delay(500)} style={[styles.contestResult, { borderColor: contest.result === "win" ? "#00FF88" : "#FF5252" }]}>
                <PremiumText variant="title" color={contest.result === "win" ? "#00FF88" : "#FF5252"} style={{ fontSize: 20 }}>
                  {contest.result === "win" ? (contest.round === "finals" ? "CHAMPION!" : "YOU ADVANCE!") : "ELIMINATED"}
                </PremiumText>
                <PremiumText variant="caption" color="rgba(255,255,255,0.5)" style={{ fontSize: 11 }}>
                  You: {contest.playerBest} vs {contest.opponent.name}: {contest.opponentBest}
                </PremiumText>
              </Animated.View>
            )}

            <Pressable onPress={
              gameMode === "contest" && contest && contest.ballsRemaining <= 0
                ? (contest.result === "win" && contest.round !== "finals" ? () => { resetDrive(); } : goToMenu)
                : gameMode === "contest" && contest && contest.ballsRemaining > 0
                  ? resetDrive
                  : resetDrive
            } style={[styles.driveAgainBtn, { backgroundColor: nightMode ? "#00FF88" : "#FFD700" }]}>
              <Ionicons name={gameMode === "contest" && contest?.ballsRemaining === 0 ? (contest?.result === "win" && contest?.round !== "finals" ? "play-forward" : "home") : "refresh"} size={18} color={nightMode ? "#0a0a2e" : "#1B5E20"} />
              <PremiumText variant="body" color={nightMode ? "#0a0a2e" : "#1B5E20"} style={{ fontWeight: "800", fontSize: 15 }}>
                {gameMode === "contest" && contest?.ballsRemaining === 0
                  ? (contest.result === "win" && contest.round !== "finals" ? "NEXT ROUND" : "BACK TO MENU")
                  : gameMode === "contest" && contest?.ballsRemaining
                    ? `NEXT BALL (${contest.ballsRemaining} left)`
                    : "DRIVE AGAIN"}
              </PremiumText>
            </Pressable>

            {driveHistory.length > 1 && gameMode === "freeplay" && (
              <View style={styles.historySection}>
                <PremiumText variant="caption" color="rgba(255,255,255,0.3)" style={{ fontSize: 9, marginBottom: 6 }}>RECENT DRIVES</PremiumText>
                {driveHistory.slice(1, 6).map((d, i) => (
                  <View key={i} style={styles.historyRow}>
                    <PremiumText variant="caption" color={d.inBounds ? "rgba(255,255,255,0.6)" : "rgba(255,82,82,0.6)"} style={{ fontSize: 11 }}>
                      {d.inBounds ? `${d.total} yds` : `OB (${d.total})`}
                    </PremiumText>
                    <PremiumText variant="caption" color="rgba(255,255,255,0.3)" style={{ fontSize: 10 }}>{d.ballSpeed}mph • {d.wind > 0 ? "+" : ""}{d.wind}w</PremiumText>
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

function EquipmentModal({ visible, onClose, profileData, equippedDriverId, equippedBallId, onEquip, nightMode }: any) {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const ownedIds = (profileData?.equipment || []).map((e: any) => `${e.type}_${e.equipmentId}`);
  const ownedMap = new Map((profileData?.equipment || []).map((e: any) => [`${e.type}_${e.equipmentId}`, e]));

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[eqStyles.overlay, { backgroundColor: nightMode ? "rgba(5,5,24,0.97)" : "rgba(0,0,0,0.95)" }]}>
        <View style={[eqStyles.header, { paddingTop: insets.top + webTopInset + 8 }]}>
          <PremiumText variant="subtitle" color="#fff" style={{ fontSize: 18 }}>Equipment</PremiumText>
          <Pressable onPress={onClose} style={{ padding: 8 }}>
            <Ionicons name="close" size={24} color="#fff" />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}>
          <PremiumText variant="caption" color="rgba(255,255,255,0.4)" style={{ fontSize: 10, marginBottom: 12, letterSpacing: 2 }}>DRIVERS</PremiumText>
          {DRIVERS.map((d) => {
            const owned = ownedMap.get(`driver_${d.id}`);
            const isEquipped = equippedDriverId === d.id;
            return (
              <Pressable key={d.id} onPress={() => owned ? onEquip(d.id, "driver") : null} style={[eqStyles.eqCard, { borderColor: isEquipped ? RARITY_COLORS[d.rarity] : "rgba(255,255,255,0.1)", opacity: owned ? 1 : 0.4 }]}>
                <View style={[eqStyles.rarityDot, { backgroundColor: RARITY_COLORS[d.rarity] }]} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <PremiumText variant="body" color="#fff" style={{ fontWeight: "700", fontSize: 14 }}>{d.name}</PremiumText>
                    {owned && <PremiumText variant="caption" color="rgba(255,255,255,0.3)" style={{ fontSize: 9 }}>Lv{owned.level}</PremiumText>}
                  </View>
                  <PremiumText variant="caption" color="rgba(255,255,255,0.4)" style={{ fontSize: 10 }}>{d.description}</PremiumText>
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                    {d.speedBonus !== 0 && <PremiumText variant="caption" color={d.speedBonus > 0 ? "#4CAF50" : "#FF5252"} style={{ fontSize: 9 }}>SPD {d.speedBonus > 0 ? "+" : ""}{d.speedBonus}</PremiumText>}
                    {d.accuracyBonus !== 0 && <PremiumText variant="caption" color={d.accuracyBonus > 0 ? "#4CAF50" : "#FF5252"} style={{ fontSize: 9 }}>ACC {d.accuracyBonus > 0 ? "+" : ""}{d.accuracyBonus}</PremiumText>}
                    {d.distanceBonus !== 0 && <PremiumText variant="caption" color={d.distanceBonus > 0 ? "#4CAF50" : "#FF5252"} style={{ fontSize: 9 }}>DIST {d.distanceBonus > 0 ? "+" : ""}{d.distanceBonus}%</PremiumText>}
                  </View>
                </View>
                {isEquipped && <View style={[eqStyles.equippedBadge, { backgroundColor: RARITY_COLORS[d.rarity] + "20" }]}><PremiumText variant="caption" color={RARITY_COLORS[d.rarity]} style={{ fontSize: 9, fontWeight: "800" }}>EQUIPPED</PremiumText></View>}
                {!owned && <Ionicons name="lock-closed" size={16} color="rgba(255,255,255,0.3)" />}
              </Pressable>
            );
          })}

          <PremiumText variant="caption" color="rgba(255,255,255,0.4)" style={{ fontSize: 10, marginTop: 20, marginBottom: 12, letterSpacing: 2 }}>BALLS</PremiumText>
          {BALLS.map((b) => {
            const owned = ownedMap.get(`ball_${b.id}`);
            const isEquipped = equippedBallId === b.id;
            return (
              <Pressable key={b.id} onPress={() => owned ? onEquip(b.id, "ball") : null} style={[eqStyles.eqCard, { borderColor: isEquipped ? RARITY_COLORS[b.rarity] : "rgba(255,255,255,0.1)", opacity: owned ? 1 : 0.4 }]}>
                <View style={[eqStyles.rarityDot, { backgroundColor: RARITY_COLORS[b.rarity] }]} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <PremiumText variant="body" color="#fff" style={{ fontWeight: "700", fontSize: 14 }}>{b.name}</PremiumText>
                    {owned && <PremiumText variant="caption" color="rgba(255,255,255,0.3)" style={{ fontSize: 9 }}>Lv{owned.level}</PremiumText>}
                  </View>
                  <PremiumText variant="caption" color="rgba(255,255,255,0.4)" style={{ fontSize: 10 }}>{b.description}</PremiumText>
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                    {b.distanceBonus !== 0 && <PremiumText variant="caption" color={b.distanceBonus > 0 ? "#4CAF50" : "#FF5252"} style={{ fontSize: 9 }}>DIST {b.distanceBonus > 0 ? "+" : ""}{b.distanceBonus}%</PremiumText>}
                    {b.rollBonus !== 0 && <PremiumText variant="caption" color={b.rollBonus > 0 ? "#4CAF50" : "#FF5252"} style={{ fontSize: 9 }}>ROLL {b.rollBonus > 0 ? "+" : ""}{b.rollBonus}%</PremiumText>}
                    {b.accuracyBonus !== 0 && <PremiumText variant="caption" color={b.accuracyBonus > 0 ? "#4CAF50" : "#FF5252"} style={{ fontSize: 9 }}>ACC {b.accuracyBonus > 0 ? "+" : ""}{b.accuracyBonus}</PremiumText>}
                  </View>
                </View>
                {isEquipped && <View style={[eqStyles.equippedBadge, { backgroundColor: RARITY_COLORS[b.rarity] + "20" }]}><PremiumText variant="caption" color={RARITY_COLORS[b.rarity]} style={{ fontSize: 9, fontWeight: "800" }}>EQUIPPED</PremiumText></View>}
                {!owned && <Ionicons name="lock-closed" size={16} color="rgba(255,255,255,0.3)" />}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

function LeaderboardModal({ visible, onClose, data, userId, nightMode }: any) {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[eqStyles.overlay, { backgroundColor: nightMode ? "rgba(5,5,24,0.97)" : "rgba(0,0,0,0.95)" }]}>
        <View style={[eqStyles.header, { paddingTop: insets.top + webTopInset + 8 }]}>
          <PremiumText variant="subtitle" color="#fff" style={{ fontSize: 18 }}>Leaderboard</PremiumText>
          <Pressable onPress={onClose} style={{ padding: 8 }}><Ionicons name="close" size={24} color="#fff" /></Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}>
          {(!data || data.length === 0) ? (
            <PremiumText variant="body" color="rgba(255,255,255,0.4)" style={{ textAlign: "center", marginTop: 40 }}>No drives yet. Be the first!</PremiumText>
          ) : data.map((entry: any, i: number) => (
            <View key={entry.id || i} style={[eqStyles.lbRow, { backgroundColor: entry.userId === userId ? "rgba(255,215,0,0.08)" : "transparent", borderColor: entry.userId === userId ? "rgba(255,215,0,0.2)" : "rgba(255,255,255,0.06)" }]}>
              <PremiumText variant="title" color={i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : "rgba(255,255,255,0.5)"} style={{ fontSize: 16, width: 30 }}>{i + 1}</PremiumText>
              <View style={{ flex: 1 }}>
                <PremiumText variant="body" color="#fff" style={{ fontWeight: "700", fontSize: 14 }}>{entry.username}</PremiumText>
                <PremiumText variant="caption" color="rgba(255,255,255,0.4)" style={{ fontSize: 10 }}>{entry.ballSpeed}mph • {entry.nightMode ? "Night" : "Day"}</PremiumText>
              </View>
              <PremiumText variant="title" color={nightMode ? "#00FF88" : "#FFD700"} style={{ fontSize: 20 }}>{entry.distance}</PremiumText>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

function ChestOpenModal({ visible, onClose, contents, nightMode }: any) {
  const [stage, setStage] = useState<"chest" | "opening" | "reveal">("chest");
  const [revealedItems, setRevealedItems] = useState(0);

  useEffect(() => {
    if (visible && contents) {
      setStage("chest");
      setRevealedItems(0);
    }
  }, [visible, contents]);

  const handleOpenChest = () => {
    setStage("opening");
    bomberSounds.play("chestOpen");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      setStage("reveal");
      let itemCount = 0;
      const totalItems = 2 + (contents?.gems > 0 ? 1 : 0) + (contents?.equipment ? 1 : 0);
      const revealInterval = setInterval(() => {
        itemCount++;
        setRevealedItems(itemCount);
        bomberSounds.play("chestReveal");
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (itemCount >= totalItems) clearInterval(revealInterval);
      }, 400);
    }, 800);
  };

  if (!contents) return null;

  const eqDef = contents.equipment ? getEquipmentDef(contents.equipment.id, contents.equipment.type) : null;
  const eqRarity = eqDef?.rarity || "common";
  const eqColor = RARITY_COLORS[eqRarity];
  const glowColor = eqDef ? eqColor : contents.gems > 0 ? "#B9F2FF" : "#FFD700";

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={eqStyles.chestOverlay}>
        {stage === "chest" && (
          <Animated.View entering={ZoomIn.duration(500)} style={[eqStyles.chestPanel, { backgroundColor: nightMode ? "rgba(10,10,46,0.95)" : "rgba(0,0,0,0.92)" }]}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,215,0,0.1)", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "rgba(255,215,0,0.3)" }}>
              <Ionicons name="gift" size={40} color="#FFD700" />
            </View>
            <PremiumText variant="title" color="#fff" style={{ fontSize: 22, marginTop: 16 }}>Chest Ready!</PremiumText>
            <PremiumText variant="caption" color="rgba(255,255,255,0.4)" style={{ fontSize: 11, marginTop: 4 }}>Tap to reveal your rewards</PremiumText>
            <Pressable onPress={handleOpenChest} style={[eqStyles.chestCloseBtn, { marginTop: 24 }]}>
              <PremiumText variant="body" color="#1B5E20" style={{ fontWeight: "800", fontSize: 15 }}>OPEN</PremiumText>
            </Pressable>
          </Animated.View>
        )}
        {stage === "opening" && (
          <Animated.View entering={ZoomIn.duration(300)} style={{ alignItems: "center" }}>
            <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(255,215,0,0.2)", alignItems: "center", justifyContent: "center" }}>
              <Animated.View entering={ZoomIn.duration(600)} style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,215,0,0.08)", position: "absolute" }} />
              <Animated.View entering={ZoomIn.duration(800)} style={{ width: 160, height: 160, borderRadius: 80, backgroundColor: "rgba(255,215,0,0.04)", position: "absolute" }} />
              <Ionicons name="flash" size={48} color="#FFD700" />
            </View>
          </Animated.View>
        )}
        {stage === "reveal" && (
          <Animated.View entering={FadeIn.duration(300)} style={[eqStyles.chestPanel, { backgroundColor: nightMode ? "rgba(10,10,46,0.95)" : "rgba(0,0,0,0.92)", borderColor: glowColor + "30" }]}>
            <PremiumText variant="caption" color={glowColor} style={{ fontSize: 10, fontWeight: "800", letterSpacing: 2 }}>REWARDS</PremiumText>
            <PremiumText variant="title" color="#fff" style={{ fontSize: 20, marginTop: 6 }}>Chest Opened!</PremiumText>
            <View style={eqStyles.chestContents}>
              {revealedItems >= 1 && (
                <Animated.View entering={ZoomIn.duration(400)} style={eqStyles.chestItem}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,215,0,0.12)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,215,0,0.2)" }}>
                    <Ionicons name="logo-bitcoin" size={22} color="#FFD700" />
                  </View>
                  <PremiumText variant="title" color="#FFD700" style={{ fontSize: 22 }}>{contents.coins}</PremiumText>
                  <PremiumText variant="caption" color="rgba(255,255,255,0.4)" style={{ fontSize: 9 }}>COINS</PremiumText>
                </Animated.View>
              )}
              {revealedItems >= 2 && (
                <Animated.View entering={ZoomIn.duration(400)} style={eqStyles.chestItem}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(185,242,255,0.12)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(185,242,255,0.2)" }}>
                    <Ionicons name="star" size={22} color="#B9F2FF" />
                  </View>
                  <PremiumText variant="title" color="#B9F2FF" style={{ fontSize: 22 }}>{contents.xp}</PremiumText>
                  <PremiumText variant="caption" color="rgba(255,255,255,0.4)" style={{ fontSize: 9 }}>XP</PremiumText>
                </Animated.View>
              )}
              {contents.gems > 0 && revealedItems >= 3 && (
                <Animated.View entering={ZoomIn.duration(400)} style={eqStyles.chestItem}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(185,242,255,0.12)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(185,242,255,0.2)" }}>
                    <Ionicons name="diamond" size={22} color="#B9F2FF" />
                  </View>
                  <PremiumText variant="title" color="#B9F2FF" style={{ fontSize: 22 }}>{contents.gems}</PremiumText>
                  <PremiumText variant="caption" color="rgba(255,255,255,0.4)" style={{ fontSize: 9 }}>GEMS</PremiumText>
                </Animated.View>
              )}
            </View>
            {eqDef && revealedItems >= (2 + (contents.gems > 0 ? 1 : 0) + 1) && (
              <Animated.View entering={ZoomIn.duration(500)} style={[eqStyles.eqReward, { borderColor: eqColor + "40", backgroundColor: eqColor + "08" }]}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: eqColor + "20", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="construct" size={16} color={eqColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <PremiumText variant="body" color="#fff" style={{ fontWeight: "700" }}>{eqDef.name}</PremiumText>
                  <PremiumText variant="caption" color={eqColor} style={{ fontSize: 10, textTransform: "uppercase", fontWeight: "800" }}>{eqRarity}</PremiumText>
                </View>
              </Animated.View>
            )}
            <Pressable onPress={onClose} style={[eqStyles.chestCloseBtn, { marginTop: 24 }]}>
              <PremiumText variant="body" color="#1B5E20" style={{ fontWeight: "800", fontSize: 15 }}>COLLECT</PremiumText>
            </Pressable>
          </Animated.View>
        )}
      </View>
    </Modal>
  );
}

function PaywallModal({ visible, onClose, onPurchase, onRestore, loading, nightMode }: any) {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const features = [
    { icon: "infinite", label: "Unlimited Contest Mode entries" },
    { icon: "trophy", label: "Compete in qualifying, brackets & finals anytime" },
    { icon: "flash", label: "Better rewards from contest victories" },
    { icon: "medal", label: "Climb the leaderboard faster" },
    { icon: "heart", label: "Support independent game development" },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: nightMode ? "rgba(5,5,24,0.97)" : "rgba(0,0,0,0.95)" }}>
        <ScrollView contentContainerStyle={{ padding: 24, paddingTop: insets.top + webTopInset + 16, paddingBottom: insets.bottom + 40, alignItems: "center" }}>
          <Pressable onPress={onClose} style={{ alignSelf: "flex-end", padding: 8 }}>
            <Ionicons name="close" size={24} color="rgba(255,255,255,0.6)" />
          </Pressable>

          <View style={{ alignItems: "center", marginTop: 12 }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: "rgba(255,215,0,0.15)", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <Ionicons name="trophy" size={36} color="#FFD700" />
            </View>
            <PremiumText variant="hero" color="#FFD700" style={{ fontSize: 32, letterSpacing: 2 }}>BOMBER PRO</PremiumText>
            <PremiumText variant="caption" color="rgba(255,255,255,0.5)" style={{ fontSize: 12, marginTop: 6, textAlign: "center", letterSpacing: 1 }}>UNLIMITED CONTEST MODE</PremiumText>
          </View>

          <View style={{ marginTop: 28, width: "100%", gap: 14 }}>
            {features.map((f, i) => (
              <Animated.View key={i} entering={FadeInUp.duration(300).delay(i * 80)} style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 4 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,215,0,0.1)", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name={f.icon as any} size={18} color="#FFD700" />
                </View>
                <PremiumText variant="body" color="#fff" style={{ fontSize: 14, flex: 1 }}>{f.label}</PremiumText>
              </Animated.View>
            ))}
          </View>

          <View style={{ marginTop: 32, width: "100%", alignItems: "center" }}>
            <View style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,215,0,0.2)", borderRadius: 20, padding: 24, width: "100%", alignItems: "center" }}>
              <PremiumText variant="caption" color="rgba(255,255,255,0.4)" style={{ fontSize: 10, letterSpacing: 2 }}>ONE-TIME PURCHASE</PremiumText>
              <View style={{ flexDirection: "row", alignItems: "baseline", marginTop: 8 }}>
                <PremiumText variant="hero" color="#fff" style={{ fontSize: 42 }}>$4.99</PremiumText>
              </View>
              <PremiumText variant="caption" color="rgba(255,255,255,0.4)" style={{ fontSize: 11, marginTop: 4 }}>Pay once, play forever. No subscription.</PremiumText>

              <Pressable onPress={onPurchase} disabled={loading} style={{ marginTop: 20, backgroundColor: "#FFD700", paddingHorizontal: 40, paddingVertical: 16, borderRadius: 28, width: "100%", alignItems: "center", opacity: loading ? 0.6 : 1 }}>
                <PremiumText variant="subtitle" color="#1B5E20" style={{ fontSize: 17, fontWeight: "900" }}>
                  {loading ? "Processing..." : "UNLOCK BOMBER PRO"}
                </PremiumText>
              </Pressable>
            </View>
          </View>

          <View style={{ marginTop: 20, alignItems: "center", gap: 12, width: "100%" }}>
            <PremiumText variant="caption" color="rgba(255,255,255,0.3)" style={{ fontSize: 10, textAlign: "center" }}>Free Play remains unlimited. You get 1 free contest per day without Pro.</PremiumText>
            <Pressable onPress={onRestore} disabled={loading} style={{ paddingVertical: 10 }}>
              <PremiumText variant="caption" color="rgba(255,255,255,0.4)" style={{ fontSize: 12 }}>Restore Purchase</PremiumText>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function VenuesModal({ visible, onClose, selectedVenueId, unlockedVenueIds, profileData, onSelect, onUnlock, nightMode }: any) {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const level = profileData?.levelInfo?.level || 1;

  const tierColors: Record<string, string> = { free: "#4CAF50", standard: "#2196F3", premium: "#9C27B0", legendary: "#FF4500" };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[eqStyles.overlay, { backgroundColor: nightMode ? "rgba(5,5,24,0.97)" : "rgba(0,0,0,0.95)" }]}>
        <View style={[eqStyles.header, { paddingTop: insets.top + webTopInset + 8 }]}>
          <PremiumText variant="subtitle" color="#fff" style={{ fontSize: 18 }}>Venues</PremiumText>
          <Pressable onPress={onClose} style={{ padding: 8 }}><Ionicons name="close" size={24} color="#fff" /></Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}>
          {VENUE_DEFS.map((v) => {
            const isUnlocked = v.tier === "free" || unlockedVenueIds.includes(v.venueId);
            const isSelected = selectedVenueId === v.venueId;
            const canAfford = profileData ? (v.unlockCurrency === "coins" ? profileData.profile.coins >= v.unlockCost : profileData.profile.gems >= v.unlockCost) : false;
            const meetsLevel = level >= v.unlockLevel;
            return (
              <Pressable key={v.venueId} onPress={() => isUnlocked ? onSelect(v) : undefined} style={[eqStyles.eqCard, { borderColor: isSelected ? tierColors[v.tier] || "#fff" : "rgba(255,255,255,0.1)", opacity: isUnlocked ? 1 : 0.6 }]}>
                <View style={[eqStyles.rarityDot, { backgroundColor: tierColors[v.tier] }]} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <PremiumText variant="body" color="#fff" style={{ fontWeight: "700", fontSize: 14 }}>{v.name}</PremiumText>
                    <View style={{ backgroundColor: (tierColors[v.tier] || "#fff") + "20", paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                      <PremiumText variant="caption" color={tierColors[v.tier]} style={{ fontSize: 8, fontWeight: "800" }}>{v.tier.toUpperCase()}</PremiumText>
                    </View>
                  </View>
                  <PremiumText variant="caption" color="rgba(255,255,255,0.5)" style={{ fontSize: 10 }}>Hole #{v.holeNumber} — {v.holeName}</PremiumText>
                  <PremiumText variant="caption" color="rgba(255,255,255,0.35)" style={{ fontSize: 9, marginTop: 2 }} numberOfLines={2}>{v.description}</PremiumText>
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                    {v.baseWind !== 0 && <PremiumText variant="caption" color="rgba(255,255,255,0.4)" style={{ fontSize: 9 }}>Wind: {v.baseWind > 0 ? "+" : ""}{v.baseWind}</PremiumText>}
                    {v.altitudeBonus > 0 && <PremiumText variant="caption" color="#4CAF50" style={{ fontSize: 9 }}>+{Math.round(v.altitudeBonus * 100)}% alt</PremiumText>}
                    {v.elevation > 0 && <PremiumText variant="caption" color="rgba(255,255,255,0.3)" style={{ fontSize: 9 }}>{v.elevation}ft elev</PremiumText>}
                  </View>
                </View>
                {isSelected && <View style={[eqStyles.equippedBadge, { backgroundColor: (tierColors[v.tier]) + "20" }]}><PremiumText variant="caption" color={tierColors[v.tier]} style={{ fontSize: 9, fontWeight: "800" }}>SELECTED</PremiumText></View>}
                {!isUnlocked && v.tier !== "free" && (
                  <Pressable onPress={() => meetsLevel && canAfford ? onUnlock(v) : undefined} style={{ alignItems: "center", gap: 2 }}>
                    {!meetsLevel ? (
                      <PremiumText variant="caption" color="rgba(255,255,255,0.3)" style={{ fontSize: 9 }}>Lv{v.unlockLevel}</PremiumText>
                    ) : (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                        <Ionicons name={v.unlockCurrency === "gems" ? "diamond" : "logo-bitcoin"} size={12} color={canAfford ? (v.unlockCurrency === "gems" ? "#B9F2FF" : "#FFD700") : "rgba(255,255,255,0.3)"} />
                        <PremiumText variant="caption" color={canAfford ? "#fff" : "rgba(255,255,255,0.3)"} style={{ fontSize: 11, fontWeight: "700" }}>{v.unlockCost}</PremiumText>
                      </View>
                    )}
                  </Pressable>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

function AchievementsModal({ visible, onClose, unlockedIds, nightMode }: any) {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const categories = ["milestone", "distance", "contest", "streak", "venue", "collection"] as const;
  const categoryLabels: Record<string, string> = { milestone: "MILESTONES", distance: "DISTANCE", contest: "CONTEST", streak: "STREAKS", venue: "VENUES", collection: "COLLECTION" };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[eqStyles.overlay, { backgroundColor: nightMode ? "rgba(5,5,24,0.97)" : "rgba(0,0,0,0.95)" }]}>
        <View style={[eqStyles.header, { paddingTop: insets.top + webTopInset + 8 }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <PremiumText variant="subtitle" color="#fff" style={{ fontSize: 18 }}>Achievements</PremiumText>
            <View style={{ backgroundColor: "rgba(255,255,255,0.08)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
              <PremiumText variant="caption" color="rgba(255,255,255,0.5)" style={{ fontSize: 10 }}>{unlockedIds.length}/{ACHIEVEMENTS.length}</PremiumText>
            </View>
          </View>
          <Pressable onPress={onClose} style={{ padding: 8 }}><Ionicons name="close" size={24} color="#fff" /></Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}>
          {categories.map((cat) => {
            const catAchievements = ACHIEVEMENTS.filter((a) => a.category === cat);
            if (catAchievements.length === 0) return null;
            return (
              <View key={cat} style={{ marginBottom: 20 }}>
                <PremiumText variant="caption" color="rgba(255,255,255,0.4)" style={{ fontSize: 10, letterSpacing: 2, marginBottom: 10 }}>{categoryLabels[cat]}</PremiumText>
                {catAchievements.map((a) => {
                  const unlocked = unlockedIds.includes(a.id);
                  return (
                    <View key={a.id} style={[eqStyles.eqCard, { borderColor: unlocked ? a.color + "40" : "rgba(255,255,255,0.06)", opacity: unlocked ? 1 : 0.4 }]}>
                      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: unlocked ? a.color + "20" : "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center" }}>
                        <Ionicons name={a.icon as any} size={18} color={unlocked ? a.color : "rgba(255,255,255,0.3)"} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <PremiumText variant="body" color={unlocked ? "#fff" : "rgba(255,255,255,0.5)"} style={{ fontWeight: "700", fontSize: 13 }}>{a.name}</PremiumText>
                        <PremiumText variant="caption" color="rgba(255,255,255,0.4)" style={{ fontSize: 10 }}>{a.description}</PremiumText>
                        <View style={{ flexDirection: "row", gap: 8, marginTop: 3 }}>
                          {a.reward.coins > 0 && <PremiumText variant="caption" color="#FFD700" style={{ fontSize: 9 }}>+{a.reward.coins}</PremiumText>}
                          {a.reward.xp > 0 && <PremiumText variant="caption" color="#B9F2FF" style={{ fontSize: 9 }}>+{a.reward.xp} XP</PremiumText>}
                          {a.reward.gems > 0 && <PremiumText variant="caption" color="#B9F2FF" style={{ fontSize: 9 }}>+{a.reward.gems} gems</PremiumText>}
                        </View>
                      </View>
                      {unlocked && <Ionicons name="checkmark-circle" size={20} color={a.color} />}
                    </View>
                  );
                })}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

function TournamentsModal({ visible, onClose, tournaments, nightMode }: any) {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[eqStyles.overlay, { backgroundColor: nightMode ? "rgba(5,5,24,0.97)" : "rgba(0,0,0,0.95)" }]}>
        <View style={[eqStyles.header, { paddingTop: insets.top + webTopInset + 8 }]}>
          <PremiumText variant="subtitle" color="#fff" style={{ fontSize: 18 }}>Events & Tournaments</PremiumText>
          <Pressable onPress={onClose} style={{ padding: 8 }}><Ionicons name="close" size={24} color="#fff" /></Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}>
          {tournaments.length === 0 ? (
            <View style={{ alignItems: "center", marginTop: 60, gap: 12 }}>
              <Ionicons name="calendar-outline" size={48} color="rgba(255,255,255,0.2)" />
              <PremiumText variant="body" color="rgba(255,255,255,0.4)" style={{ textAlign: "center", fontSize: 14 }}>No active events right now</PremiumText>
              <PremiumText variant="caption" color="rgba(255,255,255,0.25)" style={{ textAlign: "center", fontSize: 11 }}>Weekly tournaments and special events will appear here</PremiumText>
            </View>
          ) : tournaments.map((t: any) => {
            const venue = getVenueDef(t.venueId);
            const endsAt = new Date(t.endsAt);
            const now = new Date();
            const hoursLeft = Math.max(0, Math.round((endsAt.getTime() - now.getTime()) / 3600000));
            return (
              <View key={t.id} style={[eqStyles.eqCard, { borderColor: "rgba(255,215,0,0.2)", flexDirection: "column", alignItems: "stretch" }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Ionicons name="trophy" size={20} color="#FFD700" />
                  <View style={{ flex: 1 }}>
                    <PremiumText variant="body" color="#fff" style={{ fontWeight: "700", fontSize: 14 }}>{t.name}</PremiumText>
                    <PremiumText variant="caption" color="rgba(255,255,255,0.4)" style={{ fontSize: 10 }}>{t.description}</PremiumText>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <PremiumText variant="caption" color="#FF9800" style={{ fontSize: 10, fontWeight: "700" }}>{hoursLeft}h left</PremiumText>
                    <PremiumText variant="caption" color="rgba(255,255,255,0.3)" style={{ fontSize: 9 }}>{t.maxBalls} balls</PremiumText>
                  </View>
                </View>
                {venue && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }}>
                    <Ionicons name="location" size={10} color="rgba(255,255,255,0.4)" />
                    <PremiumText variant="caption" color="rgba(255,255,255,0.4)" style={{ fontSize: 9 }}>{venue.name}</PremiumText>
                  </View>
                )}
                {t.entryFee > 0 && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                    <Ionicons name="logo-bitcoin" size={10} color="#FFD700" />
                    <PremiumText variant="caption" color="#FFD700" style={{ fontSize: 10 }}>Entry: {t.entryFee} coins</PremiumText>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

function ChallengeCompleteToast({ challenge, onDismiss }: { challenge: VenueChallenge; onDismiss: () => void }) {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Pressable onPress={onDismiss} style={{ position: "absolute", top: insets.top + webTopInset + 60, left: 16, right: 16, zIndex: 99 }}>
      <Animated.View entering={FadeInDown.duration(400)} style={{ backgroundColor: "rgba(0,0,0,0.92)", borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,152,0,0.4)", padding: 14, flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,152,0,0.15)", alignItems: "center", justifyContent: "center" }}>
          <Ionicons name={challenge.icon as any} size={18} color="#FF9800" />
        </View>
        <View style={{ flex: 1 }}>
          <PremiumText variant="caption" color="#FF9800" style={{ fontSize: 9, fontWeight: "800", letterSpacing: 1 }}>VENUE CHALLENGE COMPLETE</PremiumText>
          <PremiumText variant="body" color="#fff" style={{ fontWeight: "700", fontSize: 13 }}>{challenge.name}</PremiumText>
        </View>
        <View style={{ flexDirection: "row", gap: 6 }}>
          <PremiumText variant="caption" color="#FFD700" style={{ fontSize: 10 }}>+{challenge.reward.coins}</PremiumText>
          {challenge.reward.gems > 0 && <PremiumText variant="caption" color="#B9F2FF" style={{ fontSize: 10 }}>+{challenge.reward.gems}</PremiumText>}
        </View>
      </Animated.View>
    </Pressable>
  );
}

function AchievementToast({ achievements, onDismiss }: { achievements: AchievementDef[]; onDismiss: () => void }) {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Pressable onPress={onDismiss} style={{ position: "absolute", top: insets.top + webTopInset + 8, left: 16, right: 16, zIndex: 100 }}>
      {achievements.map((a, i) => (
        <Animated.View key={a.id} entering={FadeInDown.duration(400).delay(i * 200)} style={{ backgroundColor: "rgba(0,0,0,0.9)", borderRadius: 14, borderWidth: 1, borderColor: a.color + "40", padding: 14, marginBottom: 6, flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: a.color + "20", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name={a.icon as any} size={16} color={a.color} />
          </View>
          <View style={{ flex: 1 }}>
            <PremiumText variant="caption" color={a.color} style={{ fontSize: 9, fontWeight: "800", letterSpacing: 1 }}>ACHIEVEMENT UNLOCKED</PremiumText>
            <PremiumText variant="body" color="#fff" style={{ fontWeight: "700", fontSize: 13 }}>{a.name}</PremiumText>
          </View>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {a.reward.coins > 0 && <PremiumText variant="caption" color="#FFD700" style={{ fontSize: 10 }}>+{a.reward.coins}</PremiumText>}
            {a.reward.gems > 0 && <PremiumText variant="caption" color="#B9F2FF" style={{ fontSize: 10 }}>+{a.reward.gems}</PremiumText>}
          </View>
        </Animated.View>
      ))}
    </Pressable>
  );
}

const eqStyles = StyleSheet.create({
  overlay: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,0.1)" },
  eqCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  rarityDot: { width: 8, height: 8, borderRadius: 4 },
  equippedBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  lbRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 6 },
  chestOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center", padding: 24 },
  chestPanel: { width: "100%", maxWidth: 340, borderRadius: 24, padding: 32, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,215,0,0.2)" },
  chestContents: { flexDirection: "row", gap: 24, marginTop: 20 },
  chestItem: { alignItems: "center", gap: 4 },
  eqReward: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 16, padding: 12, borderRadius: 12, borderWidth: 1, width: "100%" },
  chestCloseBtn: { marginTop: 24, backgroundColor: "#FFD700", paddingHorizontal: 32, paddingVertical: 14, borderRadius: 24 },
});

const styles = StyleSheet.create({
  screen: { flex: 1 },
  menuContent: { paddingHorizontal: 20 },
  menuHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  menuTitleArea: { alignItems: "center", marginBottom: 24 },
  profileBar: { backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  divisionBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  profileStats: { flexDirection: "row", flex: 1, justifyContent: "space-around" },
  profileStatItem: { alignItems: "center" },
  xpBar: { height: 4, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 2, marginTop: 12, overflow: "hidden" },
  xpFill: { height: "100%", borderRadius: 2 },
  currencyRow: { flexDirection: "row", gap: 16, marginTop: 10, justifyContent: "center" },
  currencyItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  dailyRewardBanner: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "rgba(255,152,0,0.1)", borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 16 },
  chestCard: { width: 80, height: 80, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center", gap: 4, marginRight: 10, backgroundColor: "rgba(255,255,255,0.04)" },
  modeButtons: { gap: 12, marginBottom: 16 },
  modeBtn: { flexDirection: "row", alignItems: "center", gap: 14, padding: 18, borderRadius: 16, borderWidth: 1 },
  menuActions: { flexDirection: "row", gap: 10, marginBottom: 16 },
  menuActionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1, backgroundColor: "rgba(255,255,255,0.04)" },
  venuePreview: { backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 16 },
  tierBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  challengeCard: { padding: 14, borderRadius: 14, borderWidth: 1, backgroundColor: "rgba(255,255,255,0.04)", marginBottom: 16 },
  challengeReward: { flexDirection: "row", alignItems: "center", gap: 4 },
  signInPrompt: { alignItems: "center", gap: 10, marginTop: 8, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(255,255,255,0.08)" },
  signInBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  topBar: { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, zIndex: 10 },
  topBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.3)", alignItems: "center", justifyContent: "center" },
  titleArea: { alignItems: "center", gap: 2 },
  windRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  roundBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statsBar: { position: "absolute", left: 12, right: 12, flexDirection: "row", alignItems: "center", gap: 8, zIndex: 10 },
  miniCurrency: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(0,0,0,0.3)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  xpBarSmall: { flex: 1, height: 3, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" },
  xpFillSmall: { height: "100%", borderRadius: 2 },
  bestBadge: { position: "absolute", right: 12, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(0,0,0,0.4)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, zIndex: 10 },
  contestBar: { position: "absolute", left: 12, right: 12, zIndex: 10 },
  contestInfo: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: "rgba(0,0,0,0.4)", padding: 10, borderRadius: 12 },
  contestPlayer: { flexDirection: "row", alignItems: "center", gap: 4 },
  ballCounter: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 6 },
  ballDot: { width: 8, height: 8, borderRadius: 4 },
  shotClockBadge: { position: "absolute", right: 0, top: 0, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  powerMeterContainer: { position: "absolute", alignItems: "center", zIndex: 5 },
  powerMeterTrack: { width: 28, borderRadius: 14, borderWidth: 1.5, overflow: "hidden", justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.3)" },
  powerMeterFill: { width: "100%", borderRadius: 12 },
  powerMeterIndicator: { position: "absolute", left: -8, width: 44, height: 3, alignItems: "flex-end" },
  powerMeterArrow: { width: 0, height: 0, borderTopWidth: 5, borderBottomWidth: 5, borderRightWidth: 8, borderTopColor: "transparent", borderBottomColor: "transparent", borderRightColor: "#fff" },
  accuracyMeterContainer: { position: "absolute", left: 0, right: 0, alignItems: "center", zIndex: 5 },
  accuracyMeterTrack: { height: 20, borderRadius: 10, borderWidth: 1.5, backgroundColor: "rgba(0,0,0,0.3)", position: "relative" },
  accuracyCenterLine: { position: "absolute", left: "50%", top: 2, bottom: 2, width: 2, backgroundColor: "rgba(255,255,255,0.4)", marginLeft: -1 },
  accuracyIndicator: { position: "absolute", top: 2, width: 16, height: 16, borderRadius: 8, marginLeft: -8 },
  accuracyLabels: { flexDirection: "row", justifyContent: "space-between", width: "60%", marginTop: 4 },
  startPrompt: { position: "absolute", bottom: "15%", left: 0, right: 0, alignItems: "center", zIndex: 10 },
  equippedTag: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 8 },
  driveButton: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 36, paddingVertical: 16, borderRadius: 30 },
  resultsOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center", zIndex: 20, paddingHorizontal: 20 },
  resultsPanel: { width: "100%", maxWidth: 380, borderRadius: 24, borderWidth: 1, padding: 28, alignItems: "center" },
  newBestBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,215,0,0.15)", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, marginBottom: 8, alignSelf: "center" },
  carryRollRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 20, marginTop: 16 },
  statBox: { alignItems: "center", gap: 2 },
  statDivider: { width: 1, height: 30 },
  statsRow: { flexDirection: "row", justifyContent: "space-around", width: "100%", marginTop: 20, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(255,255,255,0.1)" },
  miniStat: { alignItems: "center", gap: 2 },
  rewardsRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  rewardChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.06)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  contestResult: { marginTop: 16, padding: 14, borderRadius: 14, borderWidth: 1, alignItems: "center", width: "100%", backgroundColor: "rgba(255,255,255,0.04)" },
  driveAgainBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 24, marginTop: 20, width: "100%" },
  historySection: { marginTop: 16, width: "100%", paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(255,255,255,0.08)" },
  historyRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
});
