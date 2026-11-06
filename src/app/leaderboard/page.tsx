"use client";

import { useEffect, useState } from "react";
import { Flame, Trophy } from "lucide-react";
import Navigation from "../../components/Navigation";
import { POINTS, type BoardRow } from "../../lib/leaderboard";

type Board = {
  groupName: string | null;
  weekStart?: string;
  viewerId?: string;
  rows?: BoardRow[];
  lastChamps?: string[];
};

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

function BoardEntry({ row, isViewer }: { row: BoardRow; isViewer: boolean }) {
  const stats = [
    ...(row.isTrainer ? ["Trainer"] : []),
    plural(row.workouts, "workout"),
    `${row.cardioMinutes} min cardio`,
    plural(row.hydrationDays, "water day"),
  ];

  return (
    <li
      className={`flex items-center gap-3 rounded-xl p-3.5 ${
        isViewer ? "bg-gray-700/70 ring-1 ring-red-600" : "bg-gray-700/40"
      }`}
    >
      <span
        className={`font-display font-extrabold text-3xl leading-none w-9 text-center tabular-nums shrink-0 ${
          row.rank === 1 && row.points > 0 ? "text-red-400" : "text-gray-400"
        }`}
      >
        {row.rank}
      </span>

      <div className="min-w-0 flex-1">
        <p className="font-semibold flex gap-1.5">
          <span className="truncate">{row.name}</span>
          {isViewer && <span className="text-gray-400 font-normal shrink-0">(you)</span>}
        </p>
        <p className="text-gray-400 text-sm">{stats.join(" · ")}</p>
      </div>

      <div className="text-right shrink-0">
        <p className="font-display font-extrabold text-3xl leading-none tabular-nums">{row.points}</p>
        <p className="text-gray-500 text-xs mt-0.5 flex items-center justify-end gap-0.5">
          {row.streak > 0 && (
            <>
              <Flame size={12} className="text-red-400" aria-hidden="true" />
              <span className="sr-only">Week streak:</span>
              <span className="tabular-nums mr-1">{row.streak}</span>
            </>
          )}
          pts
        </p>
      </div>
    </li>
  );
}

export default function LeaderboardPage() {
  const [board, setBoard] = useState<Board | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/leaderboard?tzOffset=${new Date().getTimezoneOffset()}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setBoard)
      .catch(() => setError("Couldn't load the leaderboard. Check your connection and try refreshing."));
  }, []);

  const weekLabel =
    board?.weekStart &&
    new Date(`${board.weekStart}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <main className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <Navigation />
        <h1 className="text-4xl font-bold">Leaderboard</h1>
        {board?.groupName && (
          <p className="text-gray-400 text-sm mt-2 mb-6">
            {board.groupName} · Week of {weekLabel} · Resets Monday
          </p>
        )}

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 rounded-lg p-3 my-4">{error}</div>
        )}

        {!board && !error && <p className="text-gray-400 mt-6">Loading...</p>}

        {board && !board.groupName && (
          <div className="bg-gray-800 rounded-2xl border border-gray-700/70 p-6 mt-6">
            <p className="text-gray-400">
              You&apos;re not in a group yet. Join a trainer&apos;s group to compete on the weekly board.
            </p>
          </div>
        )}

        {board?.rows && (
          <>
            {board.lastChamps && board.lastChamps.length > 0 && (
              <div className="flex items-center gap-3 bg-gray-800 rounded-2xl border border-gray-700/70 p-4 mb-4">
                <Trophy size={24} className="text-red-400 shrink-0" aria-hidden="true" />
                <p className="text-sm text-gray-300">
                  Last week&apos;s Champ:{" "}
                  <span className="font-semibold text-white">{board.lastChamps.join(" & ")}</span>
                </p>
              </div>
            )}

            <section className="bg-gray-800 rounded-2xl border border-gray-700/70 p-4 lg:p-6">
              <ol className="space-y-2">
                {board.rows.map((row) => (
                  <BoardEntry key={row.id} row={row} isViewer={row.id === board.viewerId} />
                ))}
              </ol>

              <details className="mt-4 text-sm text-gray-400">
                <summary className="cursor-pointer hover:text-white">How points work</summary>
                <ul className="mt-2 space-y-1">
                  <li>{POINTS.workoutDay} points for each day you lift</li>
                  <li>
                    1 point per {POINTS.cardioMinutesPerPoint} minutes of cardio, up to {POINTS.cardioDailyCap} a day
                  </li>
                  <li>{POINTS.hydrationDay} points for each day you hit your water target</li>
                  <li>
                    {POINTS.streakWeek} bonus point per week of your active streak, up to {POINTS.streakCap}
                  </li>
                </ul>
              </details>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
