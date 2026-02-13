// --- User Roster Types ---

export interface RosterOperator {
  name: string;
  elite: number; // 0, 1, or 2
  level: number;
  potential: number;
}

// --- Skills Database Types ---

export interface BaseSkill {
  skillId: string;
  name: string;
  room: string; // "Factory", "Trading", "Power", etc.
  description: string;
  value: number; // efficiency value (0.2 = 20%)
}

export interface OperatorSkillData {
  rarity: number; // 1-6
  skills: {
    E0: BaseSkill[];
    E1: BaseSkill[];
    E2: BaseSkill[];
  };
}

export type SkillsDB = Record<string, OperatorSkillData>;

// --- Solver Types ---

export type LayoutType = "2-4-3" | "2-5-2";

export interface LayoutConfig {
  trading: number;
  factory: number;
  power: number;
}

export interface AvailableSkill {
  operator: string;
  skill: BaseSkill;
  elite: number;
}

export interface RoomAssignment {
  roomType: string;
  roomIndex: number;
  operators: AvailableSkill[];
  totalEfficiency: number;
}

export interface SolverResult {
  layout: LayoutType;
  rooms: RoomAssignment[];
  totalTradingEfficiency: number;
  totalFactoryEfficiency: number;
  totalPowerEfficiency: number;
  unassignedOperators: string[];
}

// --- ROI Types ---

export interface UpgradeRecommendation {
  operator: string;
  rarity: number;
  currentElite: number;
  targetElite: number;
  currentSkill: BaseSkill | null;
  newSkill: BaseSkill;
  gain: number; // marginal efficiency gain
  sanityCost: number;
  roi: number; // gain / cost
}
