"use client";

import { UpgradeRecommendation } from "@/lib/types";

interface UpgradeTableProps {
  recommendations: UpgradeRecommendation[];
}

const RARITY_COLORS: Record<number, string> = {
  3: "text-blue-300",
  4: "text-purple-300",
  5: "text-yellow-300",
  6: "text-orange-300",
};

export default function UpgradeTable({ recommendations }: UpgradeTableProps) {
  if (recommendations.length === 0) {
    return (
      <div className="bg-card border border-card-border rounded-lg p-6 text-center text-muted">
        <p>No upgrade recommendations found.</p>
        <p className="text-xs mt-1">
          All your operators are at their best base skill level, or no upgrades
          would improve your layout.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-card-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-card-border text-muted text-xs uppercase tracking-wider">
              <th className="text-left p-3">Operator</th>
              <th className="text-left p-3">Upgrade</th>
              <th className="text-left p-3">New Skill</th>
              <th className="text-right p-3">Gain</th>
              <th className="text-right p-3">Cost</th>
              <th className="text-right p-3">ROI</th>
            </tr>
          </thead>
          <tbody>
            {recommendations.slice(0, 20).map((rec, i) => (
              <tr
                key={`${rec.operator}-${rec.targetElite}`}
                className={`border-b border-card-border/50 ${
                  i < 3 ? "bg-accent/5" : ""
                }`}
              >
                <td className="p-3">
                  <span
                    className={`font-medium ${RARITY_COLORS[rec.rarity] || ""}`}
                  >
                    {rec.operator}
                  </span>
                  <span className="text-xs text-muted ml-1">
                    {rec.rarity}★
                  </span>
                </td>
                <td className="p-3 text-muted">
                  E{rec.currentElite} → E{rec.targetElite}
                </td>
                <td className="p-3">
                  <span className="text-xs">
                    {rec.newSkill.name}
                  </span>
                  <span className="text-xs text-muted ml-1">
                    ({rec.newSkill.room})
                  </span>
                </td>
                <td className="p-3 text-right text-success font-mono">
                  +{(rec.gain * 100).toFixed(0)}%
                </td>
                <td className="p-3 text-right text-muted font-mono">
                  {rec.sanityCost}
                </td>
                <td className="p-3 text-right font-mono">
                  <span
                    className={
                      rec.roi > 0.0001
                        ? "text-success"
                        : rec.roi > 0.00005
                          ? "text-warning"
                          : "text-muted"
                    }
                  >
                    {(rec.roi * 10000).toFixed(2)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-3 text-xs text-muted border-t border-card-border">
        ROI = (Efficiency Gain / Sanity Cost) × 10,000. Higher is better. Top 3
        highlighted.
      </div>
    </div>
  );
}
