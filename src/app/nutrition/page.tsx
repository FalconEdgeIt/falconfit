"use client";

import { useState, useEffect } from "react";
import Navigation from "../../components/Navigation";

type FoodEntry = {
  id: string;
  date: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type Profile = {
  calorieTarget: number | null;
  proteinTarget: number | null;
  carbTarget: number | null;
  fatTarget: number | null;
};

function isToday(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

function ProgressBar({
  label,
  current,
  target,
  unit,
}: {
  label: string;
  current: number;
  target: number | null;
  unit: string;
}) {
  const pct = target ? Math.min(100, (current / target) * 100) : 0;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-300">{label}</span>
        <span className="text-gray-400">
          {Math.round(current)}
          {unit} {target ? `/ ${Math.round(target)}${unit}` : ""}
        </span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className="bg-red-600 h-2 rounded-full transition-all"
          style={{ width: `${target ? pct : 0}%` }}
        />
      </div>
    </div>
  );
}

export default function NutritionPage() {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  const loadData = async () => {
    try {
      const [foodRes, profileRes] = await Promise.all([
        fetch("/api/food"),
        fetch("/api/profile"),
      ]);
      if (!foodRes.ok || !profileRes.ok) throw new Error();

      setEntries(await foodRes.json());
      setProfile(await profileRes.json());
    } catch {
      setError("Couldn't load your nutrition data. Check your connection and try refreshing.");
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = async () => {
    if (!name.trim() || !calories) return;

    try {
      const res = await fetch("/api/food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          calories: Number(calories),
          protein: Number(protein) || 0,
          carbs: Number(carbs) || 0,
          fat: Number(fat) || 0,
        }),
      });
      if (!res.ok) throw new Error();
      const newEntry: FoodEntry = await res.json();

      setEntries((prev) => [newEntry, ...prev]);
      setName("");
      setCalories("");
      setProtein("");
      setCarbs("");
      setFat("");
    } catch {
      setError("Couldn't add that food. Try again.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/food/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch {
      setError("Couldn't delete that entry. Try again.");
    }
  };

  const todayEntries = entries.filter((e) => isToday(e.date));

  const totals = todayEntries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

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
        <h1 className="text-4xl font-bold mb-6">Nutrition</h1>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Today's Totals</h2>

          {!profile?.calorieTarget &&
            !profile?.proteinTarget &&
            !profile?.carbTarget &&
            !profile?.fatTarget && (
              <p className="text-gray-500 text-sm mb-4">
                Set daily targets on the Settings page to see progress bars here.
              </p>
            )}

          <div className="space-y-4">
            <ProgressBar
              label="Calories"
              current={totals.calories}
              target={profile?.calorieTarget ?? null}
              unit=" cal"
            />
            <ProgressBar
              label="Protein"
              current={totals.protein}
              target={profile?.proteinTarget ?? null}
              unit="g"
            />
            <ProgressBar
              label="Carbs"
              current={totals.carbs}
              target={profile?.carbTarget ?? null}
              unit="g"
            />
            <ProgressBar
              label="Fat"
              current={totals.fat}
              target={profile?.fatTarget ?? null}
              unit="g"
            />
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Log Food</h2>

          <div className="flex gap-3 flex-wrap mb-2">
            <input
              type="text"
              placeholder="Food name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-gray-700 p-2 rounded flex-1 min-w-[160px]"
            />
            <input
              type="number"
              placeholder="Calories"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              className="bg-gray-700 p-2 rounded w-28"
            />
            <input
              type="number"
              placeholder="Protein (g)"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              className="bg-gray-700 p-2 rounded w-28"
            />
            <input
              type="number"
              placeholder="Carbs (g)"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
              className="bg-gray-700 p-2 rounded w-28"
            />
            <input
              type="number"
              placeholder="Fat (g)"
              value={fat}
              onChange={(e) => setFat(e.target.value)}
              className="bg-gray-700 p-2 rounded w-28"
            />
            <button onClick={handleAdd} className="bg-red-600 px-4 py-2 rounded">
              Add
            </button>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-4">Today's Food</h2>

          {todayEntries.length === 0 ? (
            <p className="text-gray-500">Nothing logged yet today.</p>
          ) : (
            <div className="space-y-3">
              {todayEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex justify-between items-center bg-gray-700 rounded-lg p-3"
                >
                  <div>
                    <p className="font-semibold">{entry.name}</p>
                    <p className="text-gray-400 text-sm">
                      {entry.calories} cal · {entry.protein}g protein · {entry.carbs}g carbs · {entry.fat}g fat
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="text-gray-400 hover:text-red-400 px-2"
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}