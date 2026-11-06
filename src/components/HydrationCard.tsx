"use client";

import { useEffect, useState } from "react";
import { Droplets, Undo2 } from "lucide-react";
import { notifyActivity } from "./AchievementToasts";
import { WATER_SERVINGS } from "../lib/hydration";
import { toLocalDay } from "../lib/hud";

type WaterEntry = { id: string; date: string; amount: number };

const liters = (ml: number) => `${Math.round(ml / 10) / 100} L`;

export default function HydrationCard({ day, today, target }: { day: string; today: string; target: number }) {
  const [entries, setEntries] = useState<WaterEntry[]>([]);
  const [custom, setCustom] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/water")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setEntries)
      .catch(() => setError("Couldn't load your water log."));
  }, []);

  const dayEntries = entries.filter((e) => toLocalDay(new Date(e.date)) === day);
  const total = dayEntries.reduce((sum, e) => sum + e.amount, 0);
  const percent = Math.min(100, (total / target) * 100);
  const remaining = target - total;

  const add = async (amount: number) => {
    setError("");
    try {
      const res = await fetch("/api/water", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          // Past days log at midday, well clear of the day's edges
          ...(day !== today && { date: new Date(`${day}T12:00:00`).toISOString() }),
        }),
      });
      if (!res.ok) throw new Error();
      const entry: WaterEntry = await res.json();
      setEntries((prev) => [entry, ...prev]);
      notifyActivity();
      return true;
    } catch {
      setError("Couldn't log that water. Try again.");
      return false;
    }
  };

  const undo = async () => {
    const last = dayEntries[0];
    if (!last) return;
    setError("");
    try {
      const res = await fetch(`/api/water/${last.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setEntries((prev) => prev.filter((e) => e.id !== last.id));
      notifyActivity();
    } catch {
      setError("Couldn't undo that. Try again.");
    }
  };

  const customAmount = Number(custom);

  return (
    <section className="bg-gray-800 rounded-2xl border border-gray-700/70 p-5 lg:p-6 mb-4">
      <div className="flex items-center justify-between gap-3">
        <h2>Hydration</h2>
        <Droplets size={20} className="text-blue-400" />
      </div>

      <p className="mt-3 font-display font-extrabold text-4xl leading-none tabular-nums">
        {liters(total)}
        <span className="text-xl text-gray-400 font-bold ml-1.5">of {liters(target)}</span>
      </p>
      <div
        role="progressbar"
        aria-label="Water toward daily target"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
        className="h-2.5 bg-gray-700 rounded-full overflow-hidden mt-3"
      >
        <div className="h-full rounded-full bg-blue-500 transition-all duration-700" style={{ width: `${percent}%` }} />
      </div>
      <p className="text-gray-400 text-sm mt-2">{remaining > 0 ? `${liters(remaining)} to go` : "Target hit."}</p>

      {error && <p className="text-red-300 text-sm mt-2">{error}</p>}

      <div className="grid grid-cols-3 gap-2 mt-4">
        {WATER_SERVINGS.map(({ label, amount }) => (
          <button
            key={label}
            onClick={() => add(amount)}
            className="bg-gray-700/60 hover:bg-gray-700 rounded-lg py-2.5"
          >
            <span className="block font-semibold">{label}</span>
            <span className="block text-gray-400 text-xs tabular-nums">{amount} ml</span>
          </button>
        ))}
      </div>

      <form
        className="flex gap-2 mt-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (customAmount > 0 && (await add(customAmount))) setCustom("");
        }}
      >
        <input
          type="number"
          inputMode="numeric"
          min="1"
          max="5000"
          placeholder="Other amount (ml)"
          aria-label="Other water amount in ml"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          className="bg-gray-700 p-2.5 rounded flex-1 min-w-0 text-base"
        />
        <button type="submit" disabled={!(customAmount > 0)} className="bg-red-600 disabled:opacity-40 px-4 rounded font-semibold">
          Add
        </button>
        <button
          type="button"
          onClick={undo}
          disabled={dayEntries.length === 0}
          aria-label="Undo last water entry"
          className="px-2.5 rounded bg-gray-700/60 text-gray-300 disabled:opacity-30"
        >
          <Undo2 size={18} />
        </button>
      </form>
    </section>
  );
}
