"use client";

import { useState, useEffect } from "react";
import Navigation from "../../components/Navigation";
import type { Achievement, AchievementCategory } from "../../lib/achievements";
import { BOX_STYLES, BOX_ORDER } from "../../components/boxStyles";

const CATEGORIES: AchievementCategory[] = ["Workouts", "Consistency", "Strength", "Body Weight", "Nutrition"];

type Me = {
  role: "ADMIN" | "TRAINER" | "MEMBER";
  members?: { id: string; name: string }[];
};

function formatDate(day: string) {
  return new Date(`${day}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [me, setMe] = useState<Me | null>(null);
  const [viewingId, setViewingId] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then(setMe)
      .catch(() => setMe(null));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams({ tzOffset: String(new Date().getTimezoneOffset()) });
    if (viewingId) params.set("userId", viewingId);

    fetch(`/api/achievements?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data: Achievement[]) => {
        setAchievements(data);
        setError("");
      })
      .catch(() => setError("Couldn't load achievements. Check your connection and try refreshing."))
      .finally(() => setLoaded(true));
  }, [viewingId]);

  const earnedCount = achievements.filter((a) => a.earned).length;
  const recent = achievements
    .filter((a) => a.earned)
    .sort((a, b) => (b.earnedAt ?? "").localeCompare(a.earnedAt ?? ""))
    .slice(0, 3);

  if (!loaded) {
    return (
      <main className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <Navigation />
          <p className="text-gray-400">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <Navigation />
        <h1 className="text-4xl font-bold mb-2">Achievements</h1>
        <p className="text-gray-400 font-mono text-sm mb-6">
          The System is watching. The System is keeping score. The System would like you to do one more set.
        </p>

        {me?.role === "TRAINER" && me.members && me.members.length > 0 && (
          <div className="flex items-center gap-3 mb-6">
            <label className="text-gray-400 text-sm">Viewing:</label>
            <select
              value={viewingId}
              onChange={(e) => setViewingId(e.target.value)}
              className="bg-gray-800 p-2 rounded"
            >
              <option value="">Me</option>
              {me.members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <div className="flex items-baseline justify-between flex-wrap gap-2 mb-3">
            <h2 className="text-2xl font-bold">
              {earnedCount} / {achievements.length} badges earned
            </h2>
            {recent.length > 0 && (
              <p className="text-gray-400 text-sm">
                Latest: {recent.map((a) => `${a.icon} ${a.name}`).join(" · ")}
              </p>
            )}
          </div>
          <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-600 transition-all"
              style={{ width: `${achievements.length ? (earnedCount / achievements.length) * 100 : 0}%` }}
            />
          </div>

          <div className="mt-5">
            <h3 className="text-sm uppercase tracking-widest text-gray-400 mb-2">🎁 Loot Inventory</h3>
            {earnedCount === 0 ? (
              <p className="text-gray-500 text-sm font-mono">
                Your inventory is empty. Tragic. Go log something, beast.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {BOX_ORDER.map((tier) => {
                  const count = achievements.filter((a) => a.earned && a.box === tier).length;
                  if (count === 0) return null;
                  return (
                    <span
                      key={tier}
                      className={`border ${BOX_STYLES[tier].border} ${BOX_STYLES[tier].text} rounded-full px-3 py-1 text-sm`}
                    >
                      {count} × {tier} Box
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          {CATEGORIES.map((category) => {
            const items = achievements.filter((a) => a.category === category);
            if (items.length === 0) return null;

            return (
              <section key={category}>
                <h2 className="text-2xl font-bold mb-4">{category}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {items.map((a) => (
                    <div
                      key={a.id}
                      className={`rounded-xl p-4 text-center border ${
                        a.earned ? `bg-gray-800 border-2 ${BOX_STYLES[a.box].border}` : "bg-gray-800/50 border-gray-700"
                      }`}
                      title={a.description}
                    >
                      <div className={`text-4xl mb-2 ${a.earned ? "" : "grayscale opacity-40"}`}>{a.icon}</div>
                      <p className={`font-semibold ${a.earned ? "" : "text-gray-400"}`}>{a.name}</p>
                      {a.earned ? (
                        <p className="text-gray-300 text-xs mt-1 font-mono italic">&ldquo;{a.quip}&rdquo;</p>
                      ) : (
                        <p className="text-gray-400 text-xs mt-1">{a.description}</p>
                      )}

                      {a.earned ? (
                        <p className={`text-xs mt-3 ${BOX_STYLES[a.box].text}`}>
                          {a.box} Box · {a.earnedAt && formatDate(a.earnedAt)}
                        </p>
                      ) : a.target > 1 ? (
                        <div className="mt-3">
                          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gray-500"
                              style={{ width: `${(a.progress / a.target) * 100}%` }}
                            />
                          </div>
                          <p className="text-gray-500 text-xs mt-1">
                            {a.progress.toLocaleString()} / {a.target.toLocaleString()}
                            {a.unit ? ` ${a.unit}` : ""}
                          </p>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-xs mt-3">🔒 Locked · {a.box} Box</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
