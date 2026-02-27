export interface EquipmentDef {
  id: string;
  name: string;
  type: "driver" | "ball";
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  description: string;
  speedBonus: number;
  accuracyBonus: number;
  distanceBonus: number;
  rollBonus: number;
  dupesToUpgrade: number;
}

export const DRIVERS: EquipmentDef[] = [
  { id: "standard", name: "Standard Driver", type: "driver", rarity: "common", description: "Reliable all-around driver. Nothing fancy, gets the job done.", speedBonus: 0, accuracyBonus: 0, distanceBonus: 0, rollBonus: 0, dupesToUpgrade: 3 },
  { id: "power_driver", name: "Power Driver", type: "driver", rarity: "uncommon", description: "Built for raw speed off the tee. Sacrifices some accuracy for explosive distance.", speedBonus: 5, accuracyBonus: -3, distanceBonus: 3, rollBonus: 1, dupesToUpgrade: 4 },
  { id: "precision_driver", name: "Precision Pro", type: "driver", rarity: "rare", description: "Tour-level accuracy. Keeps the ball in the grid when others can't.", speedBonus: -2, accuracyBonus: 8, distanceBonus: 1, rollBonus: 0, dupesToUpgrade: 5 },
  { id: "titan_driver", name: "The Titan", type: "driver", rarity: "epic", description: "Engineered for competitors. High ball speed with surprising control.", speedBonus: 8, accuracyBonus: 2, distanceBonus: 5, rollBonus: 2, dupesToUpgrade: 6 },
  { id: "legend_driver", name: "Legend's Edge", type: "driver", rarity: "legendary", description: "The weapon of champions. Maximum everything. Earned, never given.", speedBonus: 12, accuracyBonus: 5, distanceBonus: 8, rollBonus: 3, dupesToUpgrade: 8 },
];

export const BALLS: EquipmentDef[] = [
  { id: "standard", name: "Standard Ball", type: "ball", rarity: "common", description: "Basic ball. Does what it's told.", speedBonus: 0, accuracyBonus: 0, distanceBonus: 0, rollBonus: 0, dupesToUpgrade: 3 },
  { id: "distance_ball", name: "Distance Pro", type: "ball", rarity: "uncommon", description: "Low spin core for maximum carry. Rolls hot on landing.", speedBonus: 0, accuracyBonus: 0, distanceBonus: 5, rollBonus: 4, dupesToUpgrade: 4 },
  { id: "control_ball", name: "Control Master", type: "ball", rarity: "rare", description: "High spin cover grips the grid. Less roll, more predictable.", speedBonus: 0, accuracyBonus: 3, distanceBonus: 2, rollBonus: -3, dupesToUpgrade: 5 },
  { id: "tour_ball", name: "Tour Elite", type: "ball", rarity: "epic", description: "Pro-level feel with tour-caliber distance. The ball the grid fears.", speedBonus: 0, accuracyBonus: 2, distanceBonus: 8, rollBonus: 2, dupesToUpgrade: 6 },
  { id: "phantom_ball", name: "Phantom", type: "ball", rarity: "legendary", description: "Disappears off the face and reappears 400 yards away. Pure mythology.", speedBonus: 2, accuracyBonus: 3, distanceBonus: 12, rollBonus: 4, dupesToUpgrade: 8 },
];

export const ALL_EQUIPMENT = [...DRIVERS, ...BALLS];

export function getEquipmentDef(id: string, type: "driver" | "ball"): EquipmentDef | undefined {
  const list = type === "driver" ? DRIVERS : BALLS;
  return list.find((e) => e.id === id);
}

export const RARITY_COLORS: Record<string, string> = {
  common: "#9E9E9E",
  uncommon: "#4CAF50",
  rare: "#2196F3",
  epic: "#9C27B0",
  legendary: "#FF9800",
};

export const RARITY_ORDER = ["common", "uncommon", "rare", "epic", "legendary"];

export interface DivisionDef {
  id: string;
  name: string;
  minXp: number;
  color: string;
  icon: string;
}

export const DIVISIONS: DivisionDef[] = [
  { id: "bronze", name: "Bronze", minXp: 0, color: "#CD7F32", icon: "shield-outline" },
  { id: "silver", name: "Silver", minXp: 500, color: "#C0C0C0", icon: "shield-half-outline" },
  { id: "gold", name: "Gold", minXp: 2000, color: "#FFD700", icon: "shield" },
  { id: "platinum", name: "Platinum", minXp: 5000, color: "#E5E4E2", icon: "diamond-outline" },
  { id: "diamond", name: "Diamond", minXp: 15000, color: "#B9F2FF", icon: "diamond" },
  { id: "legend", name: "Legend", minXp: 50000, color: "#FF4500", icon: "flame" },
];

export function getDivision(xp: number): DivisionDef {
  for (let i = DIVISIONS.length - 1; i >= 0; i--) {
    if (xp >= DIVISIONS[i].minXp) return DIVISIONS[i];
  }
  return DIVISIONS[0];
}

export function getXpForLevel(level: number): number {
  return Math.round(100 * level * 1.5);
}

export function getLevelFromXp(totalXp: number): { level: number; currentXp: number; nextLevelXp: number } {
  let level = 1;
  let xpUsed = 0;
  while (true) {
    const needed = getXpForLevel(level);
    if (xpUsed + needed > totalXp) {
      return { level, currentXp: totalXp - xpUsed, nextLevelXp: needed };
    }
    xpUsed += needed;
    level++;
  }
}

export interface ChestTypeDef {
  id: string;
  name: string;
  color: string;
  icon: string;
  coins: [number, number];
  xp: [number, number];
  equipmentChance: number;
  gemChance: number;
  gems: [number, number];
  rarityWeights: Record<string, number>;
}

export const CHEST_TYPES: Record<string, ChestTypeDef> = {
  bronze: {
    id: "bronze", name: "Bronze Chest", color: "#CD7F32", icon: "cube-outline",
    coins: [10, 25], xp: [5, 15], equipmentChance: 0.1, gemChance: 0, gems: [0, 0],
    rarityWeights: { common: 0.85, uncommon: 0.15 },
  },
  silver: {
    id: "silver", name: "Silver Chest", color: "#C0C0C0", icon: "cube",
    coins: [25, 60], xp: [15, 30], equipmentChance: 0.2, gemChance: 0.05, gems: [1, 3],
    rarityWeights: { common: 0.6, uncommon: 0.35, rare: 0.05 },
  },
  gold: {
    id: "gold", name: "Gold Chest", color: "#FFD700", icon: "gift-outline",
    coins: [60, 150], xp: [30, 60], equipmentChance: 0.4, gemChance: 0.15, gems: [2, 5],
    rarityWeights: { common: 0.3, uncommon: 0.4, rare: 0.25, epic: 0.05 },
  },
  diamond: {
    id: "diamond", name: "Diamond Chest", color: "#B9F2FF", icon: "gift",
    coins: [150, 300], xp: [50, 100], equipmentChance: 1.0, gemChance: 0.3, gems: [5, 15],
    rarityWeights: { uncommon: 0.2, rare: 0.4, epic: 0.3, legendary: 0.1 },
  },
  daily: {
    id: "daily", name: "Daily Chest", color: "#FF9800", icon: "sunny",
    coins: [15, 40], xp: [10, 25], equipmentChance: 0.15, gemChance: 0.05, gems: [1, 2],
    rarityWeights: { common: 0.7, uncommon: 0.25, rare: 0.05 },
  },
};

export function generateChestContents(chestType: string): { coins: number; xp: number; gems: number; equipment: { id: string; type: "driver" | "ball" } | null } {
  const chest = CHEST_TYPES[chestType] || CHEST_TYPES.bronze;

  const coins = Math.round(chest.coins[0] + Math.random() * (chest.coins[1] - chest.coins[0]));
  const xp = Math.round(chest.xp[0] + Math.random() * (chest.xp[1] - chest.xp[0]));
  const gems = Math.random() < chest.gemChance
    ? Math.round(chest.gems[0] + Math.random() * (chest.gems[1] - chest.gems[0]))
    : 0;

  let equipment: { id: string; type: "driver" | "ball" } | null = null;
  if (Math.random() < chest.equipmentChance) {
    const rand = Math.random();
    let cumulative = 0;
    let selectedRarity = "common";
    for (const [rarity, weight] of Object.entries(chest.rarityWeights)) {
      cumulative += weight;
      if (rand <= cumulative) { selectedRarity = rarity; break; }
    }

    const type: "driver" | "ball" = Math.random() < 0.5 ? "driver" : "ball";
    const pool = (type === "driver" ? DRIVERS : BALLS).filter((e) => e.rarity === selectedRarity);
    if (pool.length > 0) {
      equipment = { id: pool[Math.floor(Math.random() * pool.length)].id, type };
    }
  }

  return { coins, xp, gems, equipment };
}

export function getChestTypeForDistance(distance: number): string {
  if (distance >= 380) return "diamond";
  if (distance >= 330) return "gold";
  if (distance >= 280) return "silver";
  return "bronze";
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  targetDistance: number;
  condition: "any" | "night" | "headwind" | "crosswind";
  reward: { coins: number; xp: number; gems: number };
}

export const DAILY_CHALLENGE_TEMPLATES: Omit<DailyChallenge, "id">[] = [
  { title: "Day Bomber", description: "Hit 300+ yards in day mode", targetDistance: 300, condition: "any", reward: { coins: 50, xp: 30, gems: 0 } },
  { title: "Night Lights", description: "Hit 280+ yards at night", targetDistance: 280, condition: "night", reward: { coins: 60, xp: 35, gems: 1 } },
  { title: "Into the Wind", description: "Hit 270+ yards with headwind", targetDistance: 270, condition: "headwind", reward: { coins: 75, xp: 40, gems: 1 } },
  { title: "Power Shot", description: "Hit 330+ yards in any conditions", targetDistance: 330, condition: "any", reward: { coins: 80, xp: 50, gems: 2 } },
  { title: "Night Bomber", description: "Hit 320+ yards under the lights", targetDistance: 320, condition: "night", reward: { coins: 100, xp: 60, gems: 2 } },
  { title: "Monster Drive", description: "Hit 350+ yards to prove you belong", targetDistance: 350, condition: "any", reward: { coins: 120, xp: 75, gems: 3 } },
  { title: "Headwind Hero", description: "Hit 300+ in a headwind", targetDistance: 300, condition: "headwind", reward: { coins: 100, xp: 55, gems: 2 } },
  { title: "The 400 Club", description: "Join the elite. Hit 400+ yards.", targetDistance: 400, condition: "any", reward: { coins: 200, xp: 100, gems: 5 } },
  { title: "Crosswind King", description: "Hit 290+ in a crosswind", targetDistance: 290, condition: "crosswind", reward: { coins: 70, xp: 40, gems: 1 } },
  { title: "Night Precision", description: "Hit 310+ in the dark", targetDistance: 310, condition: "night", reward: { coins: 90, xp: 50, gems: 2 } },
];

export interface WeatherCondition {
  id: string;
  name: string;
  icon: string;
  windRange: [number, number];
  distanceModifier: number;
  rollModifier: number;
}

export const WEATHER_CONDITIONS: WeatherCondition[] = [
  { id: "clear", name: "Clear", icon: "sunny-outline", windRange: [-10, 10], distanceModifier: 1.0, rollModifier: 1.0 },
  { id: "windy", name: "Windy", icon: "thunderstorm-outline", windRange: [-25, 25], distanceModifier: 1.0, rollModifier: 1.0 },
  { id: "hot", name: "Hot", icon: "flame-outline", windRange: [-8, 8], distanceModifier: 1.03, rollModifier: 1.1 },
  { id: "cold", name: "Cold", icon: "snow-outline", windRange: [-12, 12], distanceModifier: 0.96, rollModifier: 0.85 },
  { id: "rainy", name: "Rainy", icon: "rainy-outline", windRange: [-15, 15], distanceModifier: 0.98, rollModifier: 0.5 },
];

export function getRandomWeather(): WeatherCondition {
  return WEATHER_CONDITIONS[Math.floor(Math.random() * WEATHER_CONDITIONS.length)];
}

export function generateWindForWeather(weather: WeatherCondition): number {
  const [min, max] = weather.windRange;
  return Math.round((min + Math.random() * (max - min)) * 10) / 10;
}

export interface AIOpponent {
  id: string;
  name: string;
  title: string;
  avgDistance: number;
  variance: number;
  obChance: number;
  avatar: string;
}

export const AI_OPPONENTS: AIOpponent[] = [
  { id: "rookie", name: "Jake", title: "The Rookie", avgDistance: 260, variance: 30, obChance: 0.25, avatar: "person-outline" },
  { id: "steady", name: "Marcus", title: "The Technician", avgDistance: 295, variance: 15, obChance: 0.08, avatar: "glasses-outline" },
  { id: "bomber", name: "Bryson", title: "The Bomber", avgDistance: 330, variance: 35, obChance: 0.2, avatar: "flash-outline" },
  { id: "pro", name: "Kyle", title: "The Pro", avgDistance: 350, variance: 25, obChance: 0.12, avatar: "star-outline" },
  { id: "legend", name: "Martin", title: "The Legend", avgDistance: 375, variance: 20, obChance: 0.1, avatar: "trophy-outline" },
];

export function simulateAIDrive(opponent: AIOpponent): { distance: number; inBounds: boolean } {
  const base = opponent.avgDistance + (Math.random() * 2 - 1) * opponent.variance;
  const distance = Math.round(Math.max(200, base));
  const inBounds = Math.random() > opponent.obChance;
  return { distance, inBounds };
}

export function getContestOpponent(round: "qualifying" | "bracket" | "finals"): AIOpponent {
  if (round === "qualifying") return AI_OPPONENTS[Math.floor(Math.random() * 2)];
  if (round === "bracket") return AI_OPPONENTS[1 + Math.floor(Math.random() * 2)];
  return AI_OPPONENTS[3 + Math.floor(Math.random() * 2)];
}

export interface VenueDef {
  venueId: string;
  name: string;
  holeName: string;
  holeNumber: number;
  courseName: string;
  description: string;
  elevation: number;
  baseWind: number;
  windVariance: number;
  altitudeBonus: number;
  unlockLevel: number;
  unlockCost: number;
  unlockCurrency: "coins" | "gems";
  tier: "free" | "standard" | "premium" | "legendary";
  skyTheme: { sky1: string; sky2: string };
  groundTheme: { ground: string; groundDark: string };
}

export const VENUE_DEFS: VenueDef[] = [
  {
    venueId: "driving_range", name: "The Grid", holeName: "Practice Range", holeNumber: 0,
    courseName: "Default", description: "Standard long drive grid. No surprises, no excuses.",
    elevation: 0, baseWind: 0, windVariance: 5, altitudeBonus: 0,
    unlockLevel: 1, unlockCost: 0, unlockCurrency: "coins", tier: "free",
    skyTheme: { sky1: "#87CEEB", sky2: "#4A90D9" }, groundTheme: { ground: "#2E7D32", groundDark: "#1B5E20" },
  },
  {
    venueId: "pebble_7", name: "Pebble Beach", holeName: "The Ocean Hole", holeNumber: 7,
    courseName: "Pebble Beach Golf Links", description: "107 yards of Pacific coastline. The most photographed hole in golf. Wind screams off Carmel Bay — your ball hangs in the salt air before plummeting toward the green perched on the cliff edge.",
    elevation: 80, baseWind: -8, windVariance: 12, altitudeBonus: 0.01,
    unlockLevel: 5, unlockCost: 500, unlockCurrency: "coins", tier: "standard",
    skyTheme: { sky1: "#5DADE2", sky2: "#2E86C1" }, groundTheme: { ground: "#1E8449", groundDark: "#145A32" },
  },
  {
    venueId: "augusta_12", name: "Augusta National", holeName: "Golden Bell", holeNumber: 12,
    courseName: "Augusta National Golf Club", description: "Amen Corner's centerpiece. The wind swirls through the Georgia pines — nobody knows which way it's blowing until the ball is in the air. Masters dreams die here.",
    elevation: 250, baseWind: 5, windVariance: 15, altitudeBonus: 0.02,
    unlockLevel: 10, unlockCost: 1500, unlockCurrency: "coins", tier: "premium",
    skyTheme: { sky1: "#82E0AA", sky2: "#27AE60" }, groundTheme: { ground: "#196F3D", groundDark: "#0E6251" },
  },
  {
    venueId: "sawgrass_17", name: "TPC Sawgrass", holeName: "Island Green", holeNumber: 17,
    courseName: "TPC Sawgrass", description: "The most famous par 3 in the world. 137 yards of pure pressure over water. There is no bailout. The ball is either on the island or in the lake.",
    elevation: 15, baseWind: 3, windVariance: 8, altitudeBonus: 0,
    unlockLevel: 8, unlockCost: 1000, unlockCurrency: "coins", tier: "standard",
    skyTheme: { sky1: "#85C1E9", sky2: "#3498DB" }, groundTheme: { ground: "#239B56", groundDark: "#186A3B" },
  },
  {
    venueId: "standrews_17", name: "St Andrews", holeName: "Road Hole", holeNumber: 17,
    courseName: "St Andrews Old Course", description: "The most difficult par 4 in Scotland. 495 yards of links golf with a blind tee shot over the Old Course Hotel. The Road Hole bunker has ended more careers than retirement.",
    elevation: 30, baseWind: -12, windVariance: 18, altitudeBonus: 0,
    unlockLevel: 12, unlockCost: 2000, unlockCurrency: "coins", tier: "premium",
    skyTheme: { sky1: "#ABB2B9", sky2: "#808B96" }, groundTheme: { ground: "#5D6D7E", groundDark: "#34495E" },
  },
  {
    venueId: "kiawah_17", name: "Kiawah Island", holeName: "The Ocean Course", holeNumber: 17,
    courseName: "Kiawah Island Ocean Course", description: "Pete Dye's masterpiece along the Atlantic. Wind is relentless — 20+ mph is the norm. The ocean roars behind every shot. This is where the 1991 Ryder Cup 'War by the Shore' was decided.",
    elevation: 10, baseWind: -15, windVariance: 20, altitudeBonus: 0,
    unlockLevel: 15, unlockCost: 50, unlockCurrency: "gems", tier: "premium",
    skyTheme: { sky1: "#AED6F1", sky2: "#5499C7" }, groundTheme: { ground: "#A9CCE3", groundDark: "#7FB3D8" },
  },
  {
    venueId: "pinehurst_2", name: "Pinehurst No. 2", holeName: "Turtleback Greens", holeNumber: 2,
    courseName: "Pinehurst No. 2", description: "Donald Ross's crown jewel. The sandy wastes of the Carolina Sandhills. Greens shaped like inverted saucers reject anything that isn't perfect. The US Open keeps coming back for a reason.",
    elevation: 540, baseWind: 2, windVariance: 7, altitudeBonus: 0.03,
    unlockLevel: 7, unlockCost: 800, unlockCurrency: "coins", tier: "standard",
    skyTheme: { sky1: "#F9E79F", sky2: "#F4D03F" }, groundTheme: { ground: "#D4AC0D", groundDark: "#B7950B" },
  },
  {
    venueId: "whistling_straits", name: "Whistling Straits", holeName: "Straits Course", holeNumber: 18,
    courseName: "Whistling Straits", description: "Wisconsin's answer to the links of Ireland. Built on a former military base along Lake Michigan. The wind comes off the water like a freight train. Bunkers everywhere — over 1,000 of them.",
    elevation: 620, baseWind: -10, windVariance: 16, altitudeBonus: 0.04,
    unlockLevel: 18, unlockCost: 3000, unlockCurrency: "coins", tier: "premium",
    skyTheme: { sky1: "#D5D8DC", sky2: "#BDC3C7" }, groundTheme: { ground: "#28B463", groundDark: "#1D8348" },
  },
  {
    venueId: "bethpage_black", name: "Bethpage Black", holeName: "The People's Course", holeNumber: 18,
    courseName: "Bethpage State Park Black Course", description: "The sign at the first tee reads: 'WARNING: The Black Course Is An Extremely Difficult Course Which We Recommend Only For Highly Skilled Golfers.' It's $65 and you walk. New York's finest.",
    elevation: 200, baseWind: -5, windVariance: 10, altitudeBonus: 0.01,
    unlockLevel: 14, unlockCost: 2500, unlockCurrency: "coins", tier: "premium",
    skyTheme: { sky1: "#7FB3D8", sky2: "#2874A6" }, groundTheme: { ground: "#1E8449", groundDark: "#0B5345" },
  },
  {
    venueId: "bandon_dunes", name: "Bandon Dunes", holeName: "Pacific Dunes", holeNumber: 13,
    courseName: "Bandon Dunes Golf Resort", description: "Oregon's remote coastal masterpiece. No carts allowed — you walk or you don't play. The Pacific wind sculpts your ball flight. Tom Doak built a links course that rivals anything in Scotland.",
    elevation: 120, baseWind: -18, windVariance: 22, altitudeBonus: 0.01,
    unlockLevel: 20, unlockCost: 100, unlockCurrency: "gems", tier: "legendary",
    skyTheme: { sky1: "#5DADE2", sky2: "#1A5276" }, groundTheme: { ground: "#196F3D", groundDark: "#0E6251" },
  },
  {
    venueId: "harbour_town", name: "Harbour Town", holeName: "Lighthouse Hole", holeNumber: 18,
    courseName: "Harbour Town Golf Links", description: "Pete Dye's iconic Lowcountry layout. The red-and-white striped lighthouse stands sentinel over Calibogue Sound. Tight fairways lined with live oaks draped in Spanish moss.",
    elevation: 10, baseWind: -6, windVariance: 9, altitudeBonus: 0,
    unlockLevel: 6, unlockCost: 600, unlockCurrency: "coins", tier: "standard",
    skyTheme: { sky1: "#A3E4D7", sky2: "#1ABC9C" }, groundTheme: { ground: "#27AE60", groundDark: "#1E8449" },
  },
  {
    venueId: "torrey_south", name: "Torrey Pines", holeName: "South Course", holeNumber: 12,
    courseName: "Torrey Pines South Course", description: "Perched 350 feet above the Pacific on the cliffs of La Jolla. Marine layer rolls in every morning, then burns off to reveal the blue Pacific. Tiger's playground.",
    elevation: 350, baseWind: -7, windVariance: 11, altitudeBonus: 0.02,
    unlockLevel: 9, unlockCost: 1200, unlockCurrency: "coins", tier: "standard",
    skyTheme: { sky1: "#85C1E9", sky2: "#2E86C1" }, groundTheme: { ground: "#2ECC71", groundDark: "#1ABC9C" },
  },
];

export function getVenueDef(venueId: string): VenueDef | undefined {
  return VENUE_DEFS.find((v) => v.venueId === venueId);
}

export function getVenueWeather(venue: VenueDef): { wind: number; weather: WeatherCondition } {
  const weather = getRandomWeather();
  const baseWind = venue.baseWind + (Math.random() * 2 - 1) * venue.windVariance;
  const weatherWind = generateWindForWeather(weather);
  const finalWind = Math.round((baseWind + weatherWind * 0.5) * 10) / 10;
  return { wind: finalWind, weather };
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: "distance" | "contest" | "streak" | "collection" | "venue" | "milestone";
  reward: { coins: number; xp: number; gems: number };
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first_drive", name: "First Swing", description: "Complete your first drive", icon: "golf-outline", color: "#4CAF50", category: "milestone", reward: { coins: 50, xp: 25, gems: 0 } },
  { id: "300_club", name: "300 Club", description: "Hit a 300+ yard drive", icon: "flash-outline", color: "#2196F3", category: "distance", reward: { coins: 100, xp: 50, gems: 1 } },
  { id: "350_club", name: "350 Club", description: "Hit a 350+ yard drive", icon: "flash", color: "#9C27B0", category: "distance", reward: { coins: 200, xp: 100, gems: 3 } },
  { id: "400_club", name: "The 400 Club", description: "Hit a 400+ yard bomb", icon: "rocket-outline", color: "#FF9800", category: "distance", reward: { coins: 500, xp: 200, gems: 10 } },
  { id: "450_myth", name: "Myth Status", description: "Hit 450+ yards. They'll talk about this one.", icon: "rocket", color: "#FF4500", category: "distance", reward: { coins: 1000, xp: 500, gems: 25 } },
  { id: "first_contest_win", name: "First Victory", description: "Win your first contest", icon: "trophy-outline", color: "#FFD700", category: "contest", reward: { coins: 150, xp: 75, gems: 2 } },
  { id: "10_contest_wins", name: "Bracket Bully", description: "Win 10 contests", icon: "trophy", color: "#FF9800", category: "contest", reward: { coins: 500, xp: 250, gems: 5 } },
  { id: "25_contest_wins", name: "Grid Dominator", description: "Win 25 contests", icon: "medal-outline", color: "#9C27B0", category: "contest", reward: { coins: 1000, xp: 500, gems: 15 } },
  { id: "streak_3", name: "On a Roll", description: "3-day login streak", icon: "flame-outline", color: "#FF9800", category: "streak", reward: { coins: 75, xp: 40, gems: 1 } },
  { id: "streak_7", name: "Dedicated", description: "7-day login streak", icon: "flame", color: "#FF5722", category: "streak", reward: { coins: 200, xp: 100, gems: 3 } },
  { id: "streak_30", name: "Obsessed", description: "30-day login streak", icon: "bonfire-outline", color: "#FF4500", category: "streak", reward: { coins: 750, xp: 300, gems: 10 } },
  { id: "100_drives", name: "Centurion", description: "Complete 100 drives", icon: "stats-chart-outline", color: "#2196F3", category: "milestone", reward: { coins: 300, xp: 150, gems: 3 } },
  { id: "500_drives", name: "Machine", description: "Complete 500 drives", icon: "stats-chart", color: "#9C27B0", category: "milestone", reward: { coins: 1000, xp: 500, gems: 10 } },
  { id: "night_bomber", name: "Night Bomber", description: "Hit 330+ at night", icon: "moon", color: "#1A237E", category: "distance", reward: { coins: 150, xp: 75, gems: 2 } },
  { id: "headwind_hero", name: "Headwind Hero", description: "Hit 300+ into a headwind", icon: "arrow-back", color: "#00BCD4", category: "distance", reward: { coins: 150, xp: 75, gems: 2 } },
  { id: "first_venue", name: "Tourist", description: "Unlock your first venue", icon: "map-outline", color: "#4CAF50", category: "venue", reward: { coins: 100, xp: 50, gems: 1 } },
  { id: "5_venues", name: "World Traveler", description: "Unlock 5 venues", icon: "globe-outline", color: "#2196F3", category: "venue", reward: { coins: 500, xp: 250, gems: 5 } },
  { id: "all_venues", name: "Grand Tour", description: "Unlock every venue", icon: "globe", color: "#FF4500", category: "venue", reward: { coins: 2000, xp: 1000, gems: 25 } },
  { id: "rare_equip", name: "Collector", description: "Own a Rare equipment card", icon: "construct-outline", color: "#2196F3", category: "collection", reward: { coins: 100, xp: 50, gems: 1 } },
  { id: "epic_equip", name: "Arsenal", description: "Own an Epic equipment card", icon: "construct", color: "#9C27B0", category: "collection", reward: { coins: 250, xp: 100, gems: 3 } },
  { id: "legendary_equip", name: "Mythic Bag", description: "Own a Legendary equipment card", icon: "star", color: "#FF9800", category: "collection", reward: { coins: 500, xp: 250, gems: 10 } },
  { id: "silver_div", name: "Silver League", description: "Reach Silver division", icon: "shield-half-outline", color: "#C0C0C0", category: "milestone", reward: { coins: 200, xp: 100, gems: 2 } },
  { id: "gold_div", name: "Gold League", description: "Reach Gold division", icon: "shield", color: "#FFD700", category: "milestone", reward: { coins: 500, xp: 250, gems: 5 } },
  { id: "diamond_div", name: "Diamond League", description: "Reach Diamond division", icon: "diamond", color: "#B9F2FF", category: "milestone", reward: { coins: 1000, xp: 500, gems: 15 } },
  { id: "legend_div", name: "Legend Status", description: "Reach Legend division", icon: "flame", color: "#FF4500", category: "milestone", reward: { coins: 2500, xp: 1000, gems: 50 } },
];

export function getAchievementDef(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

export function checkAchievements(profile: {
  totalDrives: number; bestDistance: number; currentStreak: number;
  xp: number; division: string;
}, unlockedIds: string[], extraContext?: {
  nightMode?: boolean; wind?: number; contestWins?: number;
  venueUnlocks?: number; totalVenues?: number;
  ownedRarities?: string[];
}): string[] {
  const newAchievements: string[] = [];
  const check = (id: string, condition: boolean) => {
    if (!unlockedIds.includes(id) && condition) newAchievements.push(id);
  };

  check("first_drive", profile.totalDrives >= 1);
  check("300_club", profile.bestDistance >= 300);
  check("350_club", profile.bestDistance >= 350);
  check("400_club", profile.bestDistance >= 400);
  check("450_myth", profile.bestDistance >= 450);
  check("streak_3", profile.currentStreak >= 3);
  check("streak_7", profile.currentStreak >= 7);
  check("streak_30", profile.currentStreak >= 30);
  check("100_drives", profile.totalDrives >= 100);
  check("500_drives", profile.totalDrives >= 500);
  check("silver_div", profile.xp >= 500);
  check("gold_div", profile.xp >= 2000);
  check("diamond_div", profile.xp >= 15000);
  check("legend_div", profile.xp >= 50000);

  if (extraContext) {
    if (extraContext.nightMode) check("night_bomber", profile.bestDistance >= 330);
    if (extraContext.wind !== undefined && extraContext.wind < -5) check("headwind_hero", profile.bestDistance >= 300);
    if (extraContext.contestWins !== undefined) {
      check("first_contest_win", extraContext.contestWins >= 1);
      check("10_contest_wins", extraContext.contestWins >= 10);
      check("25_contest_wins", extraContext.contestWins >= 25);
    }
    if (extraContext.venueUnlocks !== undefined) {
      check("first_venue", extraContext.venueUnlocks >= 1);
      check("5_venues", extraContext.venueUnlocks >= 5);
      if (extraContext.totalVenues !== undefined) check("all_venues", extraContext.venueUnlocks >= extraContext.totalVenues);
    }
    if (extraContext.ownedRarities) {
      check("rare_equip", extraContext.ownedRarities.includes("rare"));
      check("epic_equip", extraContext.ownedRarities.includes("epic"));
      check("legendary_equip", extraContext.ownedRarities.includes("legendary"));
    }
  }

  return newAchievements;
}
