"use client";

import { useEffect, useRef, useState } from "react";
import type { Achievement } from "../lib/achievements";
import { BOX_STYLES } from "./boxStyles";

const ACTIVITY_EVENT = "falconfit:activity";

// Call after the user logs something that could unlock a badge (a set, food, a weigh-in…)
export function notifyActivity() {
  window.dispatchEvent(new Event(ACTIVITY_EVENT));
}

type SeenCounts = Record<string, number>;
type Toast = Achievement & { key: string; again: boolean };

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeSeen(key: string, counts: SeenCounts) {
  try {
    localStorage.setItem(key, JSON.stringify(counts));
  } catch {
    // storage unavailable — worst case the user sees a celebration twice
  }
}

// How many times each badge had been earned when this browser last checked. Browsers that
// only have the older list of seen ids are upgraded by assuming those counts are current.
function readSeen(userId: string, earned: Achievement[]): SeenCounts | null {
  const counts = readJson<SeenCounts>(`falconfit:seen-achievement-counts:${userId}`);
  if (counts) return counts;

  const legacyIds = readJson<string[]>(`falconfit:seen-achievements:${userId}`);
  if (!legacyIds) return null;
  return Object.fromEntries(
    earned.filter((a) => legacyIds.includes(a.id)).map((a) => [a.id, a.timesEarned])
  );
}

// Pops a celebration for badges earned since this browser last checked. The first check on a
// browser just records what's already earned, so existing users aren't flooded on first visit.
export default function AchievementToasts({ userId }: { userId: string }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const checking = useRef(false);

  useEffect(() => {
    const key = `falconfit:seen-achievement-counts:${userId}`;

    const check = async () => {
      if (checking.current) return;
      checking.current = true;
      try {
        const res = await fetch(`/api/achievements?tzOffset=${new Date().getTimezoneOffset()}`);
        if (!res.ok) return;
        const earned = ((await res.json()) as Achievement[]).filter((a) => a.earned);

        const seen = readSeen(userId, earned);
        writeSeen(key, Object.fromEntries(earned.map((a) => [a.id, a.timesEarned])));
        if (!seen) return;

        const fresh: Toast[] = earned
          .filter((a) => a.timesEarned > (seen[a.id] ?? 0))
          .map((a) => ({ ...a, key: `${a.id}:${a.timesEarned}`, again: (seen[a.id] ?? 0) > 0 }));
        if (fresh.length === 0) return;

        setToasts((prev) => [...prev, ...fresh]);
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => !fresh.some((f) => f.key === t.key)));
        }, 10000);
      } catch {
        // a missed celebration isn't worth surfacing an error for
      } finally {
        checking.current = false;
      }
    };

    check();
    window.addEventListener(ACTIVITY_EVENT, check);
    return () => window.removeEventListener(ACTIVITY_EVENT, check);
  }, [userId]);

  const dismiss = (key: string) => setToasts((prev) => prev.filter((t) => t.key !== key));

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto z-50 flex flex-col gap-3 sm:max-w-sm">
      {toasts.map((a) => (
        <div
          key={a.key}
          className={`relative bg-gray-950/95 border-2 ${BOX_STYLES[a.box].border} rounded-xl p-4 shadow-2xl font-mono animate-bounce-in`}
        >
          <button
            onClick={() => dismiss(a.key)}
            className="absolute top-2 right-3 text-gray-500 hover:text-white"
            aria-label="Dismiss"
          >
            ×
          </button>
          <a href="/achievements" className="block">
            <p className="text-xs uppercase tracking-widest text-red-400 mb-2">
              {a.again ? `🔁 Achievement earned again! ✓×${a.timesEarned}` : "🔔 New Achievement!"}
            </p>
            <div className="flex items-start gap-3">
              <span className="text-4xl leading-none">{a.icon}</span>
              <div>
                <p className="font-bold text-white">{a.name}</p>
                <p className="text-gray-300 text-sm mt-1">{a.quip}</p>
              </div>
            </div>
            <p className={`text-sm mt-3 ${BOX_STYLES[a.box].text}`}>
              🎁 Reward: You have received a {a.box} Fitness Box!
            </p>
          </a>
        </div>
      ))}
    </div>
  );
}
