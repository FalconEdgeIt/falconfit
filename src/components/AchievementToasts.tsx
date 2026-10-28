"use client";

import { useEffect, useRef, useState } from "react";
import type { Achievement } from "../lib/achievements";
import { BOX_STYLES } from "./boxStyles";

const ACTIVITY_EVENT = "falconfit:activity";

// Call after the user logs something that could unlock a badge (a set, food, a weigh-in…)
export function notifyActivity() {
  window.dispatchEvent(new Event(ACTIVITY_EVENT));
}

function readSeen(key: string): Set<string> | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? new Set(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function writeSeen(key: string, ids: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    // storage unavailable — worst case the user sees a celebration twice
  }
}

// Pops a celebration for badges earned since this browser last checked. The first check on a
// browser just records what's already earned, so existing users aren't flooded on first visit.
export default function AchievementToasts({ userId }: { userId: string }) {
  const [toasts, setToasts] = useState<Achievement[]>([]);
  const checking = useRef(false);

  useEffect(() => {
    const key = `falconfit:seen-achievements:${userId}`;

    const check = async () => {
      if (checking.current) return;
      checking.current = true;
      try {
        const res = await fetch(`/api/achievements?tzOffset=${new Date().getTimezoneOffset()}`);
        if (!res.ok) return;
        const earned = ((await res.json()) as Achievement[]).filter((a) => a.earned);

        const seen = readSeen(key);
        writeSeen(key, earned.map((a) => a.id));
        if (!seen) return;

        const fresh = earned.filter((a) => !seen.has(a.id));
        if (fresh.length === 0) return;

        setToasts((prev) => [...prev, ...fresh]);
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => !fresh.some((f) => f.id === t.id)));
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

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto z-50 flex flex-col gap-3 sm:max-w-sm">
      {toasts.map((a) => (
        <div
          key={a.id}
          className={`relative bg-gray-950/95 border-2 ${BOX_STYLES[a.box].border} rounded-xl p-4 shadow-2xl font-mono animate-bounce-in`}
        >
          <button
            onClick={() => dismiss(a.id)}
            className="absolute top-2 right-3 text-gray-500 hover:text-white"
            aria-label="Dismiss"
          >
            ×
          </button>
          <a href="/achievements" className="block">
            <p className="text-xs uppercase tracking-widest text-red-400 mb-2">🔔 New Achievement!</p>
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
