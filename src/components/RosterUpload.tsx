"use client";

import { useState, useCallback, useRef } from "react";
import { RosterOperator } from "@/lib/types";

type IdMap = Record<string, string>; // char_id -> display name

// Singleton: fetch id_map.json once, share across all calls
let idMapCache: IdMap | null = null;
let idMapPromise: Promise<IdMap> | null = null;
function getIdMap(): Promise<IdMap> {
  if (idMapCache) return Promise.resolve(idMapCache);
  if (!idMapPromise) {
    idMapPromise = fetch("/db/id_map.json")
      .then((r) => r.json())
      .then((data: IdMap) => {
        idMapCache = data;
        return data;
      })
      .catch(() => {
        idMapCache = {};
        return {} as IdMap;
      });
  }
  return idMapPromise;
}

interface RosterUploadProps {
  onRosterLoaded: (roster: RosterOperator[]) => void;
}

/**
 * Normalize raw JSON from any supported source into our format.
 * Handles:
 *   - Our console script output (array):  { name, elite, level, potential }
 *   - Krooster V1/V2 export (array):      { name, promotion, level, potential, owned }
 *   - Krooster localStorage (object):     { [char_id]: { op_id, elite, level, potential } }
 *   - Raw game data fallback:             { name, evolvePhase, level, potentialRank }
 */
function normalizeRoster(
  data: unknown,
  idMap: IdMap
): Record<string, unknown>[] | null {
  // Convert object-keyed input (Krooster localStorage) to array
  let items: unknown[];
  if (Array.isArray(data)) {
    items = data;
  } else if (typeof data === "object" && data !== null) {
    items = Object.values(data);
  } else {
    return null;
  }

  if (items.length === 0) return null;

  const result: Record<string, unknown>[] = [];
  for (const item of items) {
    if (typeof item !== "object" || item === null) continue;
    const raw = item as Record<string, unknown>;

    // Krooster V2 exports include unowned operators — skip them
    if ("owned" in raw && raw.owned === false) continue;

    // Resolve name: direct name field, or op_id -> idMap lookup
    let name: string | undefined;
    if (typeof raw.name === "string" && raw.name) {
      name = raw.name;
    } else if (typeof raw.op_id === "string" && idMap[raw.op_id]) {
      name = idMap[raw.op_id];
    } else if (typeof raw.charId === "string" && idMap[raw.charId]) {
      name = idMap[raw.charId];
    }
    if (!name) continue;

    // Krooster V2 uses "promotion", localStorage uses "elite", game data uses "evolvePhase"
    const elite = raw.elite ?? raw.promotion ?? raw.evolvePhase ?? 0;
    const potential = raw.potential ?? raw.potentialRank ?? 0;
    const level = raw.level ?? 1;

    result.push({ name, elite, level, potential });
  }

  return result.length > 0 ? result : null;
}

function validateRoster(
  data: unknown,
  idMap: IdMap
): RosterOperator[] | null {
  const normalized = normalizeRoster(data, idMap);
  if (!normalized) return null;

  const roster: RosterOperator[] = [];
  for (const op of normalized) {
    if (typeof op.name !== "string" || !op.name) return null;

    const elite = Number(op.elite);
    if (isNaN(elite) || elite < 0 || elite > 2) return null;

    roster.push({
      name: op.name,
      elite,
      level: typeof op.level === "number" ? op.level : 1,
      potential: typeof op.potential === "number" ? Number(op.potential) : 0,
    });
  }

  return roster;
}

export default function RosterUpload({ onRosterLoaded }: RosterUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [pasteValue, setPasteValue] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const onRosterLoadedRef = useRef(onRosterLoaded);
  onRosterLoadedRef.current = onRosterLoaded;

  const processJson = useCallback(
    async (text: string) => {
      setError(null);
      setProcessing(true);
      try {
        const parsed = JSON.parse(text);
        const isArray = Array.isArray(parsed);
        const isObject = typeof parsed === "object" && parsed !== null;
        console.log("[RosterUpload] Parsed input:", { isArray, isObject, keyCount: isObject ? Object.keys(parsed).length : 0 });

        // Await id_map so op_id -> name resolution is guaranteed ready
        const map = await getIdMap();
        console.log("[RosterUpload] idMap loaded:", Object.keys(map).length, "entries");

        const roster = validateRoster(parsed, map);
        console.log("[RosterUpload] Validated roster:", roster ? roster.length + " operators" : "null");
        if (roster) {
          console.log("[RosterUpload] First 3:", roster.slice(0, 3).map(o => `${o.name} E${o.elite}`));
        }

        if (!roster) {
          setError(
            "Invalid format. Accepts: array of { name, elite }, Krooster export, or Krooster localStorage data."
          );
          return;
        }
        onRosterLoadedRef.current(roster);
      } catch (e) {
        console.error("[RosterUpload] Error:", e);
        setError("Invalid JSON. Please check the format and try again.");
      } finally {
        setProcessing(false);
      }
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => processJson(reader.result as string);
      reader.readAsText(file);
    },
    [processJson]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => processJson(reader.result as string);
      reader.readAsText(file);
    },
    [processJson]
  );

  const handlePaste = useCallback(() => {
    if (pasteValue.trim()) {
      processJson(pasteValue.trim());
    }
  }, [pasteValue, processJson]);

  const handleDemoRoster = useCallback(() => {
    const demo: RosterOperator[] = [
      { name: "SilverAsh", elite: 2, level: 90, potential: 1 },
      { name: "Exusiai", elite: 2, level: 90, potential: 1 },
      { name: "Texas", elite: 2, level: 80, potential: 5 },
      { name: "Lappland", elite: 2, level: 80, potential: 1 },
      { name: "Myrtle", elite: 2, level: 70, potential: 6 },
      { name: "Gravel", elite: 2, level: 60, potential: 6 },
      { name: "Vermeil", elite: 1, level: 55, potential: 4 },
      { name: "Spot", elite: 1, level: 55, potential: 6 },
      { name: "Fang", elite: 1, level: 55, potential: 6 },
      { name: "Kroos", elite: 1, level: 55, potential: 6 },
      { name: "Ceobe", elite: 2, level: 70, potential: 1 },
      { name: "Ptilopsis", elite: 2, level: 70, potential: 1 },
      { name: "Shamare", elite: 2, level: 70, potential: 1 },
      { name: "Jaye", elite: 1, level: 55, potential: 4 },
      { name: "Amiya", elite: 2, level: 80, potential: 5 },
      { name: "Lancet-2", elite: 0, level: 30, potential: 6 },
      { name: "Castle-3", elite: 0, level: 30, potential: 6 },
      { name: "12F", elite: 0, level: 30, potential: 6 },
      { name: "Durin", elite: 0, level: 30, potential: 6 },
      { name: "Noir Corne", elite: 0, level: 30, potential: 6 },
    ];
    onRosterLoaded(demo);
  }, [onRosterLoaded]);

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors cursor-pointer ${
          isDragging
            ? "border-accent bg-accent/10"
            : "border-card-border hover:border-accent/50"
        }`}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          className="hidden"
        />
        <p className="text-lg font-medium mb-2">
          Drop roster.json here or click to browse
        </p>
        <p className="text-sm text-muted">
          Supports Krooster export, localStorage paste, or console script output
        </p>
      </div>

      {/* Paste area */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Or paste JSON directly:
        </label>
        <textarea
          value={pasteValue}
          onChange={(e) => setPasteValue(e.target.value)}
          placeholder='[{ "name": "SilverAsh", "elite": 2, "level": 90, "potential": 1 }, ...]'
          rows={5}
          className="w-full rounded-lg bg-card border border-card-border p-3 text-sm font-mono focus:outline-none focus:border-accent resize-y"
        />
        <div className="flex gap-3 mt-2">
          <button
            onClick={handlePaste}
            disabled={!pasteValue.trim() || processing}
            className="px-4 py-2 bg-accent hover:bg-accent-hover disabled:opacity-40 rounded-lg text-sm font-medium transition-colors"
          >
            {processing ? "Loading..." : "Load Roster"}
          </button>
          <button
            onClick={handleDemoRoster}
            className="px-4 py-2 bg-card border border-card-border hover:border-accent/50 rounded-lg text-sm font-medium transition-colors"
          >
            Use Demo Roster
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 text-sm text-red-300">
          {error}
        </div>
      )}
    </div>
  );
}
