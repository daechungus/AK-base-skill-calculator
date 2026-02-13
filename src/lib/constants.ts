import { LayoutConfig, LayoutType } from "./types";

export const LAYOUT_CONFIGS: Record<LayoutType, LayoutConfig> = {
  "2-4-3": { trading: 2, factory: 4, power: 3 },
  "2-5-2": { trading: 2, factory: 5, power: 2 },
};

export const OPERATORS_PER_ROOM = 3;

// Production room types the solver cares about
export const PRODUCTION_ROOMS = ["Trading", "Factory", "Power"];

// Average sanity cost to promote an operator, by rarity and target elite
// These are rough community-consensus averages
export const PROMOTION_COSTS: Record<number, Record<number, number>> = {
  // rarity -> target elite -> sanity cost
  3: { 1: 200, 2: 0 }, // 3-star: E1 is cheap, no E2
  4: { 1: 300, 2: 1200 },
  5: { 1: 500, 2: 1800 },
  6: { 1: 600, 2: 2500 },
};

// Hard-coded meta combos: groups of operators that should be assigned together
// Each combo specifies a room type and the operators that synergize
export interface MetaCombo {
  name: string;
  room: string;
  operators: string[];
  minRequired: number; // minimum operators from this group needed to activate
}

export const META_COMBOS: MetaCombo[] = [
  {
    name: "Texas Trading",
    room: "Trading",
    operators: ["Exusiai", "Lappland", "Texas"],
    minRequired: 2,
  },
  {
    name: "Shamare Trading",
    room: "Trading",
    operators: ["Shamare", "Tequila", "Jaye"],
    minRequired: 2,
  },
  {
    name: "Perception Info",
    room: "Factory",
    operators: ["Rosmontis", "Whisperain", "Dusk"],
    minRequired: 2,
  },
  {
    name: "SilverAsh Trading",
    room: "Trading",
    operators: ["SilverAsh", "Gnosis", "Pramanix"],
    minRequired: 2,
  },
  {
    name: "Vulcan Factory",
    room: "Factory",
    operators: ["Vulcan", "Ceobe", "Vermeil"],
    minRequired: 2,
  },
];

// Base production rates per room (per hour, without any bonuses)
export const BASE_PRODUCTION = {
  Trading: {
    lmdPerOrder: 500, // LMD per order
    ordersPerHour: 0.3333, // base rate: ~1 order per 3 hours
  },
  Factory: {
    goldPerHour: 0.2857, // ~1 gold bar per 3.5 hours
    expPerHour: 0.2857, // ~1 record per 3.5 hours (same rate)
  },
};
