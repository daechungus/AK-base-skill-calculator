"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { RosterOperator, SkillsDB, LayoutType } from "@/lib/types";
import { solveBaseLayout } from "@/lib/solver";
import { calculateROI } from "@/lib/roi";
import ProductionSummary from "@/components/ProductionSummary";
import BaseGrid from "@/components/BaseGrid";
import UpgradeTable from "@/components/UpgradeTable";

export default function Dashboard() {
  const router = useRouter();
  const [roster, setRoster] = useState<RosterOperator[] | null>(null);
  const [skillsDB, setSkillsDB] = useState<SkillsDB | null>(null);
  const [layout, setLayout] = useState<LayoutType>("2-5-2");
  const [loading, setLoading] = useState(true);

  // Load roster from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem("roster");
    if (!stored) {
      router.push("/");
      return;
    }
    try {
      setRoster(JSON.parse(stored));
    } catch {
      router.push("/");
    }
  }, [router]);

  // Load skills DB
  useEffect(() => {
    fetch("/db/base_skills.json")
      .then((res) => res.json())
      .then((data) => {
        setSkillsDB(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const solverResult = useMemo(() => {
    if (!roster || !skillsDB) return null;
    return solveBaseLayout(roster, skillsDB, layout);
  }, [roster, skillsDB, layout]);

  const recommendations = useMemo(() => {
    if (!roster || !skillsDB) return [];
    return calculateROI(roster, skillsDB);
  }, [roster, skillsDB]);

  if (loading || !roster) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  if (!skillsDB) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <p className="text-red-400 mb-2">Failed to load skills database.</p>
          <p className="text-sm text-muted">
            Make sure <code>public/db/base_skills.json</code> exists.
            Run <code>python scripts/build_skills_db.py</code> to generate it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Base Layout</h2>
          <p className="text-sm text-muted">
            {roster.length} operators loaded
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Layout toggle */}
          <div className="flex rounded-lg border border-card-border overflow-hidden">
            {(["2-5-2", "2-4-3"] as LayoutType[]).map((l) => (
              <button
                key={l}
                onClick={() => setLayout(l)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  layout === l
                    ? "bg-accent text-white"
                    : "bg-card hover:bg-card-border"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              sessionStorage.removeItem("roster");
              router.push("/");
            }}
            className="px-3 py-2 text-sm text-muted border border-card-border rounded-lg hover:border-accent/50 transition-colors"
          >
            Change Roster
          </button>
        </div>
      </div>

      {/* Production Summary */}
      {solverResult && <ProductionSummary result={solverResult} />}

      {/* Base Grid */}
      {solverResult && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Assigned Operators</h3>
          <BaseGrid result={solverResult} />
        </div>
      )}

      {/* Upgrade Recommendations */}
      <div>
        <h3 className="text-lg font-semibold mb-3">
          Recommended Upgrades
          {recommendations.length > 0 && (
            <span className="text-sm font-normal text-muted ml-2">
              ({recommendations.length} found)
            </span>
          )}
        </h3>
        <UpgradeTable recommendations={recommendations} />
      </div>
    </div>
  );
}
