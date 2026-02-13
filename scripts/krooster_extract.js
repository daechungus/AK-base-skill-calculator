// ============================================================
// Krooster Roster Extractor
// Paste this entire script into Chrome DevTools Console
// while on https://www.krooster.com/ (logged in)
// It will auto-download a roster.json file.
// ============================================================

(function () {
  "use strict";

  // Try multiple known storage keys
  const CANDIDATE_KEYS = ["operators", "persist:root", "persist:operators"];

  let rawData = null;
  let sourceKey = null;

  for (const key of CANDIDATE_KEYS) {
    const val = localStorage.getItem(key);
    if (val) {
      rawData = val;
      sourceKey = key;
      break;
    }
  }

  if (!rawData) {
    // Fallback: scan all localStorage keys for operator-like data
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const val = localStorage.getItem(key);
      try {
        const parsed = JSON.parse(val);
        if (
          typeof parsed === "object" &&
          parsed !== null &&
          (Array.isArray(parsed)
            ? parsed.some((e) => e && "elite" in e)
            : Object.values(parsed).some(
                (e) => typeof e === "object" && e !== null && "elite" in e
              ))
        ) {
          rawData = val;
          sourceKey = key;
          break;
        }
      } catch (_) {
        // not JSON, skip
      }
    }
  }

  if (!rawData) {
    console.error(
      "[Extractor] No operator data found in localStorage. Make sure you are logged into Krooster."
    );
    return;
  }

  console.log(`[Extractor] Found data under key: "${sourceKey}"`);

  let parsed;
  try {
    parsed = JSON.parse(rawData);
  } catch (e) {
    console.error("[Extractor] Failed to parse JSON:", e);
    return;
  }

  // Redux Persist wraps values as JSON strings inside the root object
  if (typeof parsed === "object" && !Array.isArray(parsed)) {
    // Check if it's a redux persist root with stringified sub-keys
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === "string") {
        try {
          parsed[k] = JSON.parse(v);
        } catch (_) {
          // leave as-is
        }
      }
    }
    // If there's a nested "operators" key, use that
    if (parsed.operators) {
      parsed = parsed.operators;
    }
  }

  // Normalize to array
  let operators;
  if (Array.isArray(parsed)) {
    operators = parsed;
  } else if (typeof parsed === "object") {
    operators = Object.values(parsed);
  } else {
    console.error("[Extractor] Unexpected data format:", typeof parsed);
    return;
  }

  // Extract clean roster
  const roster = operators
    .filter(
      (op) =>
        op &&
        typeof op === "object" &&
        (op.name || op.id || op.charId) &&
        "elite" in op
    )
    .map((op) => ({
      name: op.name || op.id || op.charId || "Unknown",
      elite: Number(op.elite) || 0,
      level: Number(op.level) || 1,
      potential: Number(op.potential) || 0,
    }));

  if (roster.length === 0) {
    console.error(
      "[Extractor] Parsed data but found 0 operators. Data shape may have changed."
    );
    console.log("[Extractor] Raw sample:", operators.slice(0, 3));
    return;
  }

  console.log(`[Extractor] Extracted ${roster.length} operators.`);

  // Auto-download
  const blob = new Blob([JSON.stringify(roster, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "roster.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log("[Extractor] roster.json downloaded!");
})();
