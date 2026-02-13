import {
  RosterOperator,
  SkillsDB,
  UpgradeRecommendation,
  BaseSkill,
} from "./types";
import { PROMOTION_COSTS } from "./constants";

/**
 * Calculate upgrade recommendations for operators who would gain
 * better base skills at a higher elite level.
 */
export function calculateROI(
  roster: RosterOperator[],
  skillsDB: SkillsDB
): UpgradeRecommendation[] {
  const recommendations: UpgradeRecommendation[] = [];

  for (const op of roster) {
    const opData = skillsDB[op.name];
    if (!opData) continue;

    // Already at max elite
    if (op.elite >= 2) continue;

    // Check each higher elite level
    for (let targetElite = op.elite + 1; targetElite <= 2; targetElite++) {
      const targetKey = `E${targetElite}` as keyof typeof opData.skills;
      const targetSkills = opData.skills[targetKey];
      if (!targetSkills || targetSkills.length === 0) continue;

      // Find the best new skill at the target elite
      const bestNewSkill = targetSkills.reduce<BaseSkill | null>(
        (best, skill) => {
          if (!best || skill.value > best.value) return skill;
          return best;
        },
        null
      );

      if (!bestNewSkill || bestNewSkill.value <= 0) continue;

      // Find the current best skill for the same room type
      let currentBest: BaseSkill | null = null;
      for (let e = 0; e <= op.elite; e++) {
        const currentKey = `E${e}` as keyof typeof opData.skills;
        const currentSkills = opData.skills[currentKey];
        if (!currentSkills) continue;

        for (const skill of currentSkills) {
          if (
            skill.room === bestNewSkill.room &&
            (!currentBest || skill.value > currentBest.value)
          ) {
            currentBest = skill;
          }
        }
      }

      const currentValue = currentBest?.value ?? 0;
      const gain = bestNewSkill.value - currentValue;

      if (gain <= 0) continue;

      // Look up sanity cost
      const rarityCosts = PROMOTION_COSTS[opData.rarity];
      const sanityCost = rarityCosts?.[targetElite] ?? 1500; // fallback

      if (sanityCost <= 0) continue;

      recommendations.push({
        operator: op.name,
        rarity: opData.rarity,
        currentElite: op.elite,
        targetElite,
        currentSkill: currentBest,
        newSkill: bestNewSkill,
        gain,
        sanityCost,
        roi: gain / sanityCost,
      });
    }
  }

  // Sort by ROI descending (best value upgrades first)
  recommendations.sort((a, b) => b.roi - a.roi);

  return recommendations;
}
