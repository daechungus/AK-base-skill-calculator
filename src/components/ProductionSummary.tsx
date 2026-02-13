"use client";

import { SolverResult } from "@/lib/types";
import { BASE_PRODUCTION, LAYOUT_CONFIGS } from "@/lib/constants";

interface ProductionSummaryProps {
  result: SolverResult;
}

export default function ProductionSummary({ result }: ProductionSummaryProps) {
  const config = LAYOUT_CONFIGS[result.layout];

  // LMD from trading: base orders/hour * (1 + bonus) * LMD per order * rooms * 24
  const tradingBonus = 1 + result.totalTradingEfficiency;
  const lmdPerDay =
    BASE_PRODUCTION.Trading.ordersPerHour *
    tradingBonus *
    BASE_PRODUCTION.Trading.lmdPerOrder *
    config.trading *
    24;

  // EXP/Gold from factories: base items/hour * (1 + bonus) * rooms * 24
  const factoryBonus = 1 + result.totalFactoryEfficiency;
  const goldBarsPerDay =
    BASE_PRODUCTION.Factory.goldPerHour * factoryBonus * config.factory * 24;

  const cards = [
    {
      label: "LMD / Day",
      value: Math.round(lmdPerDay).toLocaleString(),
      sub: `${config.trading} Trading Posts | +${(result.totalTradingEfficiency * 100).toFixed(0)}% bonus`,
      color: "text-yellow-400",
    },
    {
      label: "Gold Bars / Day",
      value: goldBarsPerDay.toFixed(1),
      sub: `${config.factory} Factories | +${(result.totalFactoryEfficiency * 100).toFixed(0)}% bonus`,
      color: "text-amber-400",
    },
    {
      label: "Power Bonus",
      value: `+${(result.totalPowerEfficiency * 100).toFixed(0)}%`,
      sub: `${config.power} Power Plants`,
      color: "text-green-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-card border border-card-border rounded-lg p-4"
        >
          <p className="text-sm text-muted mb-1">{card.label}</p>
          <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
          <p className="text-xs text-muted mt-1">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
