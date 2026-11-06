"use client";

import Link from "next/link";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { QUIET_AFTER_DAYS, WINDOW_DAYS, quietestFirst, type MemberCheckIn } from "../lib/checkIn";

type Member = { id: string; name: string };

function lastSeen({ daysQuiet }: MemberCheckIn) {
  if (daysQuiet === null) return "Hasn't logged anything yet";
  if (daysQuiet === 0) return "Active today";
  if (daysQuiet === 1) return "Active yesterday";
  return `Quiet for ${daysQuiet} days`;
}

function targetDays(label: string, days: number | null) {
  return days === null ? `${label}: no target` : `${label} ${days}/${WINDOW_DAYS}`;
}

export default function TrainerCheckIn({
  members,
  checkIn,
}: {
  members: Member[];
  checkIn: Record<string, MemberCheckIn>;
}) {
  const rows = members
    .filter((m) => checkIn[m.id])
    .map((m) => ({ ...m, status: checkIn[m.id] }))
    .sort((a, b) => quietestFirst(a.status, b.status) || a.name.localeCompare(b.name));

  if (rows.length === 0) return null;

  const attention = rows.filter((r) => r.status.needsAttention).length;

  return (
    <div className="bg-gray-800 rounded-xl p-6 mb-8">
      <div className="flex items-baseline justify-between flex-wrap gap-2 mb-4">
        <h2 className="text-2xl font-bold">Check-In</h2>
        <p className="text-gray-400 text-sm">
          Last {WINDOW_DAYS} days
          {attention > 0 && ` · ${attention} need${attention === 1 ? "s" : ""} attention`}
        </p>
      </div>

      <div className="space-y-2">
        {rows.map(({ id, name, status }) => (
          <Link
            key={id}
            href={`/progress?member=${id}`}
            className={`flex items-center gap-3 rounded-lg p-3 bg-gray-700/60 hover:bg-gray-700 ${
              status.needsAttention ? "ring-1 ring-red-600" : ""
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className="font-semibold truncate">{name}</p>
              <p className={`text-sm flex items-center gap-1.5 ${status.needsAttention ? "text-red-300" : "text-gray-400"}`}>
                {status.needsAttention && <AlertTriangle size={14} className="shrink-0" aria-hidden="true" />}
                {lastSeen(status)}
              </p>
              <p className="text-gray-300 text-sm mt-1">
                {status.workouts} workout{status.workouts === 1 ? "" : "s"} · {status.cardioMinutes} min cardio
              </p>
              <p className="text-gray-400 text-sm flex flex-wrap gap-x-3">
                {status.foodDays === 0 ? (
                  <span>No food logged</span>
                ) : (
                  <>
                    <span>{targetDays("Calories", status.calorieDays)}</span>
                    <span>{targetDays("Protein", status.proteinDays)}</span>
                  </>
                )}
                <span>
                  Water {status.waterDays}/{WINDOW_DAYS}
                </span>
              </p>
            </div>
            <ChevronRight size={18} className="shrink-0 text-gray-500" aria-hidden="true" />
          </Link>
        ))}
      </div>

      <p className="text-gray-500 text-xs mt-3">
        Flagged after {QUIET_AFTER_DAYS} days with nothing logged. Calories count within 10% of target. Tap a member to
        open their stats.
      </p>
    </div>
  );
}
