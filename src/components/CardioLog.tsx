"use client";

import { useEffect, useState } from "react";
import { notifyActivity } from "./AchievementToasts";

const CARDIO_TYPES = [
  "Running",
  "Treadmill",
  "Walking",
  "Cycling",
  "Stationary Bike",
  "Rowing",
  "Elliptical",
  "Stair Climber",
  "Swimming",
  "Jump Rope",
  "HIIT",
  "Hiking",
  "Skating",
  "Other",
];

type CardioEntry = {
  id: string;
  date: string;
  type: string;
  minutes: number;
};

function todayLocal() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function formatMinutes(total: number) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

// Cardio sessions are tracked separately from workout days: just a type and time spent.
// viewingId is set when a Trainer is looking at one of their Members.
export default function CardioLog({ viewingId }: { viewingId: string }) {
  const [entries, setEntries] = useState<CardioEntry[]>([]);
  const [type, setType] = useState(CARDIO_TYPES[0]);
  const [minutes, setMinutes] = useState("");
  const [date, setDate] = useState(todayLocal);
  const [error, setError] = useState("");
  const [weekAgo] = useState(() => Date.now() - 7 * 24 * 60 * 60 * 1000);

  const withViewer = (path: string) => (viewingId ? `${path}?userId=${viewingId}` : path);

  useEffect(() => {
    fetch(withViewer("/api/cardio"))
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data: CardioEntry[]) => {
        setEntries(data);
        setError("");
      })
      .catch(() => setError("Couldn't load cardio sessions."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewingId]);

  const handleLog = async () => {
    const mins = Number(minutes);
    if (!mins || mins <= 0) return;

    try {
      const res = await fetch(withViewer("/api/cardio"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, minutes: mins, date }),
      });
      if (!res.ok) throw new Error();
      const entry: CardioEntry = await res.json();

      setEntries((prev) =>
        [entry, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      );
      setMinutes("");
      setError("");
      notifyActivity();
    } catch {
      setError("Couldn't log that session. Try again.");
    }
  };

  const handleDelete = async (entry: CardioEntry) => {
    if (!confirm(`Delete ${entry.minutes} min of ${entry.type}?`)) return;

    try {
      const res = await fetch(`/api/cardio/${entry.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    } catch {
      setError("Couldn't delete that session. Try again.");
    }
  };

  const weekMinutes = entries
    .filter((e) => new Date(e.date).getTime() >= weekAgo)
    .reduce((sum, e) => sum + e.minutes, 0);

  return (
    <div className="bg-gray-800 rounded-xl p-6 mt-8">
      <div className="flex items-baseline justify-between flex-wrap gap-2 mb-4">
        <h2 className="text-2xl font-bold">🏃 Cardio</h2>
        <p className="text-gray-400 text-sm">
          Last 7 days: <span className="text-white font-semibold">{formatMinutes(weekMinutes)}</span>
        </p>
      </div>

      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

      <div className="flex gap-3 mb-6 flex-wrap">
        <select value={type} onChange={(e) => setType(e.target.value)} className="bg-gray-700 p-2 rounded">
          {CARDIO_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="1"
          placeholder="Minutes"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLog()}
          className="bg-gray-700 p-2 rounded w-28"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-gray-700 p-2 rounded"
        />
        <button onClick={handleLog} className="bg-red-600 px-4 py-2 rounded">
          Log Cardio
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="text-gray-500">No cardio logged yet — pick a type, enter your minutes, and hit Log.</p>
      ) : (
        <ul className="divide-y divide-gray-700/60">
          {entries.slice(0, 10).map((e) => (
            <li key={e.id} className="flex items-center gap-4 py-2">
              <span className="text-gray-400 text-sm w-24 shrink-0">
                {new Date(e.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
              <span className="flex-1">{e.type}</span>
              <span className="font-semibold">{formatMinutes(e.minutes)}</span>
              <button
                onClick={() => handleDelete(e)}
                className="text-gray-500 hover:text-red-400"
                title="Delete session"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
