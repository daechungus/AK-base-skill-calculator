// src/lib/special_logic.ts

export interface SpecialLogicResult {
  efficiency: number; // The calculated bonus (e.g., 0.40 for 40%)
  note?: string;      // Explanation for the UI (e.g., "Scaled by Order Limit")
}

// A map of Operator ID -> Logic Function
// We hardcode the "Meta" logic here because parsing Lua is too heavy for a client-side app.
export const SPECIAL_LOGIC: Record<string, (context: any) => SpecialLogicResult> = {
  
  // --- TRADING POST META ---
  
  // Jaye (E1): -4% per order, but huge stats. 
  // *simplification*: With a maxed Trading Post (Order Limit ~10), he is roughly +40% net.
  // accurate_math: base +4% * (OrderLimit - 1). 
  'char_272_strong': () => ({
    efficiency: 0.25, // Conservative estimate. Jaye is complex.
    note: "Variable: Order Limit dependent"
  }),

  // Proviso (E2): +100% efficiency, but increases morale drain.
  // She is the highest efficiency operator in the game for Trading.
  'char_4025_aprot': () => ({
    efficiency: 1.00, // +100%
    note: "High Efficiency / High Drain"
  }),

  // Tequila (E2): Scales with order acquisition.
  // He is effectively a massive multiplier when paired with high-order ops.
  'char_485_pneuma': () => ({
    efficiency: 0.50, // Estimate. He turns "trash" orders into "gold".
    note: "High Value Orders"
  }),
  
  // Shamare (E2): +45% (cursed) or combined with Whisperain?
  // Usually creates a huge deficit but huge gain.
  'char_254_vodfox': () => ({
    efficiency: 0.45,
    note: "Cursed Doll Logic"
  }),

  // --- FACTORY META ---

  // Vermeil (E1): +2% per capacity.
  // Context: She usually pairs with Cuora (+40 cap) and Noir Corne (+10 cap).
  // Max Cap is usually ~60-80.
  'char_143_ghost': (context) => {
    // If context isn't provided, assume a "Good" setup (Capacity +60)
    const capacityBonus = context?.totalCapacity || 60; 
    return {
      efficiency: 0.02 * capacityBonus,
      note: `Scaled by Capacity (+${capacityBonus})`
    };
  },

  // Waai Fu (E2): +5% per 5% factory buff from others.
  // If paired with two +25% ops, she gives +40%.
  'char_243_waaifu': () => ({
    efficiency: 0.40, // Assumes average optimal partners
    note: "Scales with allies"
  }),

  // Rosmontis: Scales with Perception Info (Chain of Thought).
  // Usually ~20-55% depending on Dorm setup.
  'char_391_rosmon': () => ({
    efficiency: 0.20, // Baseline. Needs "Whisperain" to hit 55%.
    note: "Needs Sensory Info (Dorms)"
  })
};

// Helper to check if an operator needs special handling
export function getSpecialEfficiency(operatorId: string, context?: any): number {
  const logic = SPECIAL_LOGIC[operatorId];
  if (logic) {
    return logic(context).efficiency;
  }
  return 0; // Return 0 if no special logic exists (fall back to basic DB)
}