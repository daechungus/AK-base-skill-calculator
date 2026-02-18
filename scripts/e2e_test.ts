/**
 * End-to-end test: Loads the real DB, builds a realistic roster,
 * runs the solver + ROI calculator, and prints concrete results.
 *
 * Usage: npx tsx scripts/e2e_test.ts
 */

import { readFileSync } from "fs";
import { join } from "path";
import { solveBaseLayout } from "../src/lib/solver";
import { calculateROI } from "../src/lib/roi";
import { RosterOperator, SkillsDB } from "../src/lib/types";
import { LayoutType } from "../src/lib/types";

// ── Load the real DB ──────────────────────────────────────────────
const dbPath = join(__dirname, "..", "public", "db", "base_skills.json");
const skillsDB: SkillsDB = JSON.parse(readFileSync(dbPath, "utf-8"));

// ── Build a realistic mid-game roster ─────────────────────────────
// Mix of E0/E1/E2 operators — the kind of account that needs promotion advice.
const roster: RosterOperator[] = [
  // 6-star operators (some E2, some E1 — room to grow)
  { name: "Exusiai", elite: 2, level: 90, potential: 1 },
  { name: "SilverAsh", elite: 2, level: 90, potential: 1 },
  { name: "Eyjafjalla", elite: 1, level: 80, potential: 1 },   // NOT E2 yet
  { name: "Angelina", elite: 2, level: 80, potential: 1 },
  { name: "Ceobe", elite: 2, level: 70, potential: 1 },
  { name: "Ptilopsis", elite: 2, level: 70, potential: 1 },
  { name: "Hoederer", elite: 1, level: 70, potential: 1 },      // NOT E2 yet
  { name: "Croissant", elite: 1, level: 60, potential: 1 },     // NOT E2 yet (5★)

  // 5-star operators
  { name: "Lappland", elite: 2, level: 80, potential: 1 },
  { name: "Texas", elite: 2, level: 80, potential: 5 },
  { name: "Shamare", elite: 2, level: 70, potential: 1 },
  { name: "FEater", elite: 1, level: 60, potential: 1 },        // NOT E2 yet
  { name: "Ceylon", elite: 1, level: 55, potential: 1 },         // NOT E2 yet
  { name: "Bison", elite: 1, level: 55, potential: 1 },          // NOT E2 yet
  { name: "Heidi", elite: 1, level: 55, potential: 1 },          // NOT E2 yet
  { name: "Mayer", elite: 1, level: 50, potential: 1 },          // NOT E2 yet

  // 4-star operators (cheap E1/E2)
  { name: "Gravel", elite: 1, level: 60, potential: 6 },
  { name: "Vermeil", elite: 1, level: 55, potential: 4 },
  { name: "Frostleaf", elite: 1, level: 55, potential: 1 },
  { name: "Earthspirit", elite: 1, level: 50, potential: 1 },
  { name: "Gummy", elite: 1, level: 55, potential: 1 },
  { name: "Haze", elite: 1, level: 50, potential: 1 },
  { name: "Matoimaru", elite: 1, level: 50, potential: 1 },
  { name: "Chestnut", elite: 1, level: 50, potential: 1 },
  { name: "Conviction", elite: 1, level: 50, potential: 1 },

  // 3-star operators (E1 max)
  { name: "Spot", elite: 1, level: 55, potential: 6 },
  { name: "Fang", elite: 1, level: 55, potential: 6 },
  { name: "Kroos", elite: 1, level: 55, potential: 6 },
  { name: "Lava", elite: 1, level: 55, potential: 6 },
  { name: "Catapult", elite: 1, level: 55, potential: 6 },
  { name: "Midnight", elite: 1, level: 55, potential: 6 },
  { name: "Popukar", elite: 1, level: 55, potential: 6 },

  // 1-star robots
  { name: "Castle-3", elite: 0, level: 30, potential: 6 },
  { name: "Lancet-2", elite: 0, level: 30, potential: 6 },
  { name: "12F", elite: 0, level: 30, potential: 6 },
];

// ── Helper: format percentage ─────────────────────────────────────
function pct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

function pad(s: string, n: number): string {
  return s.padEnd(n);
}

// ── Run solver for both layouts ───────────────────────────────────
console.log("═".repeat(70));
console.log("  ARKNIGHTS BASE SKILL CALCULATOR — END-TO-END TEST");
console.log("═".repeat(70));
console.log(`\nRoster: ${roster.length} operators loaded`);
console.log(
  `DB: ${Object.keys(skillsDB).length} operators in base_skills.json\n`
);

for (const layout of ["2-5-2", "2-4-3"] as LayoutType[]) {
  console.log("─".repeat(70));
  console.log(`  LAYOUT: ${layout}`);
  console.log("─".repeat(70));

  const result = solveBaseLayout(roster, skillsDB, layout);

  // Print each room
  for (const room of result.rooms) {
    const ops = room.operators
      .map(
        (o) =>
          `${o.operator} (${o.skill.name} +${pct(o.skill.value)})`
      )
      .join(", ");
    console.log(
      `  ${pad(room.roomType + " #" + room.roomIndex, 14)} [${pct(
        room.totalEfficiency
      )} total]  ${ops || "(empty)"}`
    );
  }

  console.log(
    `\n  TOTALS: Trading ${pct(result.totalTradingEfficiency)} | Factory ${pct(
      result.totalFactoryEfficiency
    )} | Power ${pct(result.totalPowerEfficiency)}`
  );
  console.log(
    `  Unassigned (with skills): ${result.unassignedOperators.length} operators`
  );
  if (result.unassignedOperators.length > 0) {
    console.log(`    ${result.unassignedOperators.join(", ")}`);
  }
  console.log();
}

// ── Run ROI Calculator ────────────────────────────────────────────
console.log("─".repeat(70));
console.log("  UPGRADE RECOMMENDATIONS (Who to promote next?)");
console.log("─".repeat(70));

const recs = calculateROI(roster, skillsDB);

if (recs.length === 0) {
  console.log("  No upgrades found.");
} else {
  console.log(
    `  Found ${recs.length} possible upgrades. Top 15:\n`
  );
  console.log(
    `  ${pad("Operator", 16)} ${pad("Upgrade", 10)} ${pad(
      "New Skill",
      28
    )} ${pad("Gain", 8)} ${pad("Cost", 8)} ROI`
  );
  console.log("  " + "-".repeat(78));

  for (const rec of recs.slice(0, 15)) {
    const upgrade = `E${rec.currentElite}→E${rec.targetElite}`;
    const skill = `${rec.newSkill.name} (${rec.newSkill.room})`;
    const gain = `+${pct(rec.gain)}`;
    const cost = `${rec.sanityCost}`;
    const roi = (rec.roi * 10000).toFixed(2);
    console.log(
      `  ${pad(rec.operator, 16)} ${pad(upgrade, 10)} ${pad(
        skill,
        28
      )} ${pad(gain, 8)} ${pad(cost, 8)} ${roi}`
    );
  }
}

console.log("\n" + "═".repeat(70));
console.log("  TEST COMPLETE");
console.log("═".repeat(70));
