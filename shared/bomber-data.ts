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
