import {
  RosterOperator,
  SkillsDB,
  LayoutType,
  AvailableSkill,
  RoomAssignment,
  SolverResult,
} from "./types";
import {
  LAYOUT_CONFIGS,
  OPERATORS_PER_ROOM,
  META_COMBOS,
} from "./constants";

/**
 * Get all available base skills for a user's roster, filtered by their elite level.
 * Returns the best skill each operator has unlocked for each room type.
 */
function getAvailableSkills(
  roster: RosterOperator[],
  skillsDB: SkillsDB
): AvailableSkill[] {
  const available: AvailableSkill[] = [];

  for (const op of roster) {
    const opData = skillsDB[op.name];
    if (!opData) continue;

    // Collect all skills this operator has unlocked up to their current elite
    const unlockedSkills: AvailableSkill[] = [];
    for (let e = 0; e <= op.elite; e++) {
      const eliteKey = `E${e}` as keyof typeof opData.skills;
      const skills = opData.skills[eliteKey];
      if (!skills) continue;

      for (const skill of skills) {
        if (skill.value > 0) {
          unlockedSkills.push({ operator: op.name, skill, elite: e });
        }
      }
    }

    // For each room type, keep only the best skill
    const bestByRoom = new Map<string, AvailableSkill>();
    for (const as of unlockedSkills) {
      const existing = bestByRoom.get(as.skill.room);
      if (!existing || as.skill.value > existing.skill.value) {
        bestByRoom.set(as.skill.room, as);
      }
    }

    available.push(...bestByRoom.values());
  }

  return available;
}

/**
 * Check if a meta combo can be activated given the available operators.
 * Returns the combo operators that are available, or null if not enough.
 */
function tryMetaCombo(
  combo: (typeof META_COMBOS)[0],
  availableByRoom: AvailableSkill[],
  assignedOperators: Set<string>
): AvailableSkill[] | null {
  const comboMembers = availableByRoom.filter(
    (s) =>
      combo.operators.includes(s.operator) &&
      !assignedOperators.has(s.operator)
  );

  if (comboMembers.length >= combo.minRequired) {
    return comboMembers.slice(0, OPERATORS_PER_ROOM);
  }
  return null;
}

/**
 * Main solver: assigns operators to base rooms using a greedy algorithm.
 */
export function solveBaseLayout(
  roster: RosterOperator[],
  skillsDB: SkillsDB,
  layout: LayoutType
): SolverResult {
  const config = LAYOUT_CONFIGS[layout];
  const allAvailable = getAvailableSkills(roster, skillsDB);
  const assignedOperators = new Set<string>();
  const rooms: RoomAssignment[] = [];

  // Build room list
  const roomSlots: { roomType: string; roomIndex: number }[] = [];
  for (let i = 0; i < config.trading; i++) {
    roomSlots.push({ roomType: "Trading", roomIndex: i + 1 });
  }
  for (let i = 0; i < config.factory; i++) {
    roomSlots.push({ roomType: "Factory", roomIndex: i + 1 });
  }
  for (let i = 0; i < config.power; i++) {
    roomSlots.push({ roomType: "Power", roomIndex: i + 1 });
  }

  // Phase 1: Try meta combos first
  for (const slot of roomSlots) {
    const relevantCombos = META_COMBOS.filter(
      (c) => c.room === slot.roomType
    );

    let filled = false;
    for (const combo of relevantCombos) {
      const roomSkills = allAvailable.filter(
        (s) => s.skill.room === slot.roomType
      );
      const comboResult = tryMetaCombo(combo, roomSkills, assignedOperators);

      if (comboResult) {
        // Assign combo operators to this room
        for (const cs of comboResult) {
          assignedOperators.add(cs.operator);
        }

        // Fill remaining slots with highest-value operators
        const remaining = OPERATORS_PER_ROOM - comboResult.length;
        if (remaining > 0) {
          const fillers = allAvailable
            .filter(
              (s) =>
                s.skill.room === slot.roomType &&
                !assignedOperators.has(s.operator)
            )
            .sort((a, b) => b.skill.value - a.skill.value)
            .slice(0, remaining);

          for (const f of fillers) {
            assignedOperators.add(f.operator);
            comboResult.push(f);
          }
        }

        const totalEfficiency = comboResult.reduce(
          (sum, s) => sum + s.skill.value,
          0
        );

        rooms.push({
          roomType: slot.roomType,
          roomIndex: slot.roomIndex,
          operators: comboResult,
          totalEfficiency,
        });

        filled = true;
        break;
      }
    }

    if (!filled) {
      // Will be filled in phase 2
      rooms.push({
        roomType: slot.roomType,
        roomIndex: slot.roomIndex,
        operators: [],
        totalEfficiency: 0,
      });
    }
  }

  // Phase 2: Greedy fill for rooms that weren't filled by combos
  for (const room of rooms) {
    if (room.operators.length >= OPERATORS_PER_ROOM) continue;

    const slotsLeft = OPERATORS_PER_ROOM - room.operators.length;
    const candidates = allAvailable
      .filter(
        (s) =>
          s.skill.room === room.roomType &&
          !assignedOperators.has(s.operator)
      )
      .sort((a, b) => b.skill.value - a.skill.value)
      .slice(0, slotsLeft);

    for (const c of candidates) {
      assignedOperators.add(c.operator);
      room.operators.push(c);
    }

    room.totalEfficiency = room.operators.reduce(
      (sum, s) => sum + s.skill.value,
      0
    );
  }

  // Calculate totals
  const totalTradingEfficiency = rooms
    .filter((r) => r.roomType === "Trading")
    .reduce((sum, r) => sum + r.totalEfficiency, 0);

  const totalFactoryEfficiency = rooms
    .filter((r) => r.roomType === "Factory")
    .reduce((sum, r) => sum + r.totalEfficiency, 0);

  const totalPowerEfficiency = rooms
    .filter((r) => r.roomType === "Power")
    .reduce((sum, r) => sum + r.totalEfficiency, 0);

  // Find unassigned operators that have base skills
  const rosterNames = new Set(roster.map((r) => r.name));
  const unassignedOperators = [...rosterNames].filter(
    (name) => !assignedOperators.has(name) && skillsDB[name]
  );

  return {
    layout,
    rooms,
    totalTradingEfficiency,
    totalFactoryEfficiency,
    totalPowerEfficiency,
    unassignedOperators,
  };
}
