"use client";

import { useState, useCallback } from "react";
import { RosterOperator } from "@/lib/types";

interface RosterUploadProps {
  onRosterLoaded: (roster: RosterOperator[]) => void;
}

function validateRoster(data: unknown): RosterOperator[] | null {
  if (!Array.isArray(data)) return null;
  if (data.length === 0) return null;

  const roster: RosterOperator[] = [];
  for (const item of data) {
    if (typeof item !== "object" || item === null) return null;
    const op = item as Record<string, unknown>;

    if (typeof op.name !== "string" || !op.name) return null;
    if (typeof op.elite !== "number" || op.elite < 0 || op.elite > 2) return null;

    roster.push({
      name: op.name,
      elite: op.elite,
      level: typeof op.level === "number" ? op.level : 1,
      potential: typeof op.potential === "number" ? op.potential : 0,
    });
  }

  return roster;
}

export default function RosterUpload({ onRosterLoaded }: RosterUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [pasteValue, setPasteValue] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const processJson = useCallback(
    (text: string) => {
      setError(null);
      try {
        const parsed = JSON.parse(text);
        const roster = validateRoster(parsed);
        if (!roster) {
          setError(
            "Invalid format. Expected an array of { name, elite, level, potential }."
          );
          return;
        }
        onRosterLoaded(roster);
      } catch {
        setError("Invalid JSON. Please check the format and try again.");
      }
    },
    [onRosterLoaded]
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
          Export from Krooster using the console script, then upload the file
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
            disabled={!pasteValue.trim()}
            className="px-4 py-2 bg-accent hover:bg-accent-hover disabled:opacity-40 rounded-lg text-sm font-medium transition-colors"
          >
            Load Roster
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
