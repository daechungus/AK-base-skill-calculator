"use client";

import { SolverResult } from "@/lib/types";

interface BaseGridProps {
  result: SolverResult;
}

const ROOM_COLORS: Record<string, string> = {
  Trading: "border-yellow-500/50 bg-yellow-500/5",
  Factory: "border-amber-500/50 bg-amber-500/5",
  Power: "border-green-500/50 bg-green-500/5",
};

const ROOM_LABELS: Record<string, string> = {
  Trading: "TP",
  Factory: "FAC",
  Power: "PWR",
};

export default function BaseGrid({ result }: BaseGridProps) {
  // Group rooms by type
  const roomsByType: Record<string, typeof result.rooms> = {};
  for (const room of result.rooms) {
    if (!roomsByType[room.roomType]) roomsByType[room.roomType] = [];
    roomsByType[room.roomType].push(room);
  }

  return (
    <div className="space-y-4">
      {Object.entries(roomsByType).map(([roomType, rooms]) => (
        <div key={roomType}>
          <h3 className="text-sm font-semibold text-muted mb-2 uppercase tracking-wider">
            {roomType} ({rooms.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {rooms.map((room) => (
              <div
                key={`${room.roomType}-${room.roomIndex}`}
                className={`border rounded-lg p-3 ${ROOM_COLORS[room.roomType] || "border-card-border"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold opacity-60">
                    {ROOM_LABELS[room.roomType] || room.roomType} #{room.roomIndex}
                  </span>
                  <span className="text-xs font-mono text-accent">
                    +{(room.totalEfficiency * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="space-y-1">
                  {room.operators.length > 0 ? (
                    room.operators.map((op, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="truncate mr-2">
                          {op.operator}
                          <span className="text-muted text-xs ml-1">E{op.elite}</span>
                        </span>
                        <span className="text-xs font-mono text-muted whitespace-nowrap">
                          {op.skill.name} (+{(op.skill.value * 100).toFixed(0)}%)
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted italic">No operators assigned</p>
                  )}
                  {room.operators.length < 3 && room.operators.length > 0 && (
                    <p className="text-xs text-muted italic">
                      {3 - room.operators.length} empty slot{3 - room.operators.length > 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
