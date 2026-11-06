"use client";

import { useEffect, useState } from "react";
import { BookmarkPlus, ChevronLeft, ChevronRight } from "lucide-react";
import Navigation from "../../components/Navigation";
import FoodFinder from "../../components/FoodFinder";
import HydrationCard from "../../components/HydrationCard";
import { useFoodLog, type FoodEntry, type Macros, type NewFood } from "../../components/useFoodLog";
import { DEFAULT_WATER_TARGET_ML } from "../../lib/hydration";
import { toLocalDay } from "../../lib/hud";
import { MEALS, isMeal, mealForTime } from "../../lib/meals";

type Profile = {
  calorieTarget: number | null;
  proteinTarget: number | null;
  carbTarget: number | null;
  fatTarget: number | null;
  waterTarget: number | null;
};

const round1 = (n: number) => Math.round(n * 10) / 10;

function sumMacros(entries: FoodEntry[]): Macros {
  return entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

function shiftDay(day: string, days: number) {
  const date = new Date(`${day}T12:00:00`);
  date.setDate(date.getDate() + days);
  return toLocalDay(date);
}

function dayLabel(day: string, today: string) {
  if (day === today) return "Today";
  if (day === shiftDay(today, -1)) return "Yesterday";
  return new Date(`${day}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function Ring({
  current,
  target,
  className,
  children,
}: {
  current: number;
  target: number | null;
  className: string;
  children: React.ReactNode;
}) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const filled = target ? circumference * Math.min(1, current / target) : 0;

  return (
    <div className={`relative shrink-0 ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="9" className="stroke-gray-700" />
        {filled > 0 && (
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference}`}
            className="stroke-red-600 transition-all duration-700"
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

function MacroRing({ label, current, target }: { label: string; current: number; target: number | null }) {
  return (
    <div className="flex flex-col items-center text-center min-w-0">
      <Ring current={current} target={target} className="w-20 h-20 sm:w-24 sm:h-24">
        <span className="font-display font-extrabold text-2xl leading-none tabular-nums">{Math.round(current)}g</span>
      </Ring>
      <p className="text-sm text-gray-300 mt-2">{label}</p>
      <p className="text-xs text-gray-500 tabular-nums">{target ? `of ${Math.round(target)}g` : "no target"}</p>
    </div>
  );
}

function CalorieRing({ current, target }: { current: number; target: number | null }) {
  const left = target ? Math.round(target - current) : null;

  return (
    <div className="flex items-center gap-5">
      <Ring current={current} target={target} className="w-32 h-32 sm:w-36 sm:h-36">
        <span className="font-display font-extrabold text-4xl leading-none tabular-nums">{Math.round(current)}</span>
        <span className="text-[10px] tracking-[0.2em] text-gray-400 mt-1">CALORIES</span>
      </Ring>
      {target && left !== null && (
        <div>
          <p className="font-display font-extrabold text-4xl leading-none tabular-nums">{Math.abs(left)}</p>
          <p className="text-gray-300 text-sm mt-1">{left >= 0 ? "left" : "over"}</p>
          <p className="text-gray-500 text-xs tabular-nums">of {Math.round(target)} cal</p>
        </div>
      )}
    </div>
  );
}

export default function NutritionPage() {
  const { entries, savedMeals, loaded, error, logFood, deleteEntry, saveMeal, deleteSavedMeal } = useFoodLog();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [today] = useState(() => toLocalDay(new Date()));
  const [day, setDay] = useState(today);
  const [savingMeal, setSavingMeal] = useState<string | null>(null);
  const [savedName, setSavedName] = useState("");
  const [savedNotice, setSavedNotice] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then(setProfile)
      .catch(() => {});
  }, []);

  // Past days log at midday, well clear of the day's edges
  const handleLog = (food: NewFood) =>
    logFood(day === today ? food : { ...food, date: new Date(`${day}T12:00:00`).toISOString() });

  const dayEntries = entries.filter((e) => toLocalDay(new Date(e.date)) === day);
  const totals = sumMacros(dayEntries);
  const mealGroups = MEALS.map((meal) => ({
    meal,
    items: dayEntries.filter((e) => (isMeal(e.meal) ? e.meal : mealForTime(new Date(e.date))) === meal),
  })).filter((group) => group.items.length > 0);

  const handleSave = async (items: FoodEntry[]) => {
    const name = savedName.trim();
    if (!name) return;
    const sum = sumMacros(items);
    const saved = await saveMeal({
      name,
      calories: Math.round(sum.calories),
      protein: round1(sum.protein),
      carbs: round1(sum.carbs),
      fat: round1(sum.fat),
    });
    if (!saved) return;
    setSavingMeal(null);
    setSavedNotice(`Saved ${name}. It's now at the top of Log Food.`);
  };

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

  const dayName = dayLabel(day, today);
  const hasTargets =
    profile?.calorieTarget || profile?.proteinTarget || profile?.carbTarget || profile?.fatTarget;

  return (
    <main className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <Navigation />

        <div className="flex items-center justify-between gap-3 mb-6">
          <h1 className="text-4xl font-bold">Nutrition</h1>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setDay(shiftDay(day, -1))}
              aria-label="Previous day"
              className="p-2 rounded-lg bg-gray-800 text-gray-300 hover:text-white"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="w-24 text-center text-sm font-semibold" aria-live="polite">
              {dayName}
            </span>
            <button
              onClick={() => setDay(shiftDay(day, 1))}
              disabled={day === today}
              aria-label="Next day"
              className="p-2 rounded-lg bg-gray-800 text-gray-300 hover:text-white disabled:opacity-30"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        <section className="hud-rise bg-gray-800 rounded-2xl border border-gray-700/70 p-5 lg:p-6 mb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <CalorieRing current={totals.calories} target={profile?.calorieTarget ?? null} />
            <div className="grid grid-cols-3 gap-2 lg:gap-8">
              <MacroRing label="Protein" current={totals.protein} target={profile?.proteinTarget ?? null} />
              <MacroRing label="Carbs" current={totals.carbs} target={profile?.carbTarget ?? null} />
              <MacroRing label="Fat" current={totals.fat} target={profile?.fatTarget ?? null} />
            </div>
          </div>
          {!hasTargets && (
            <p className="text-gray-500 text-sm mt-4">
              <a href="/settings" className="text-red-400">
                Set daily targets
              </a>{" "}
              to fill these rings.
            </p>
          )}
        </section>

        <HydrationCard day={day} today={today} target={profile?.waterTarget ?? DEFAULT_WATER_TARGET_ML} />

        <section className="bg-gray-800 rounded-2xl border border-gray-700/70 p-5 lg:p-6 mb-4">
          <h2 className="mb-4">{day === today ? "Log Food" : `Log Food · ${dayName}`}</h2>
          <FoodFinder
            key={day}
            recentEntries={entries}
            savedMeals={savedMeals}
            onLog={handleLog}
            onDeleteSaved={deleteSavedMeal}
          />
        </section>

        <section className="bg-gray-800 rounded-2xl border border-gray-700/70 p-5 lg:p-6">
          <h2 className="mb-4">{day === today ? "Today's Food" : `Food · ${dayName}`}</h2>

          {savedNotice && <p className="text-gray-300 text-sm mb-3">{savedNotice}</p>}

          {mealGroups.length === 0 ? (
            <p className="text-gray-500">Nothing logged {day === today ? "yet today" : "this day"}.</p>
          ) : (
            <div className="space-y-5">
              {mealGroups.map(({ meal, items }) => {
                const subtotal = sumMacros(items);
                return (
                  <div key={meal}>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <p className="font-display font-bold text-xl uppercase tracking-wide">{meal}</p>
                      <p className="text-gray-400 text-sm tabular-nums">
                        {Math.round(subtotal.calories)} cal · {Math.round(subtotal.protein)}g protein
                      </p>
                    </div>

                    <div className="space-y-2">
                      {items.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex justify-between items-center gap-2 bg-gray-700/60 rounded-lg p-3"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold">{entry.name}</p>
                            <p className="text-gray-400 text-sm">
                              {entry.calories} cal · {entry.protein}g protein · {entry.carbs}g carbs · {entry.fat}g fat
                            </p>
                          </div>
                          <button
                            onClick={() => deleteEntry(entry.id)}
                            className="text-gray-400 hover:text-red-400 px-2"
                            title="Delete"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>

                    {savingMeal === meal ? (
                      <form
                        className="flex gap-2 mt-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSave(items);
                        }}
                      >
                        <input
                          autoFocus
                          aria-label="Go-to meal name"
                          value={savedName}
                          onChange={(e) => setSavedName(e.target.value)}
                          className="bg-gray-700 p-2 rounded flex-1 min-w-0 text-base"
                        />
                        <button type="submit" className="bg-red-600 px-3 rounded text-sm font-semibold">
                          Save
                        </button>
                        <button type="button" onClick={() => setSavingMeal(null)} className="px-2 text-sm text-gray-400">
                          Cancel
                        </button>
                      </form>
                    ) : (
                      <button
                        onClick={() => {
                          setSavingMeal(meal);
                          setSavedName(items.length === 1 ? items[0].name : meal);
                          setSavedNotice("");
                        }}
                        className="flex items-center gap-1.5 mt-2 text-sm text-gray-400 hover:text-white"
                      >
                        <BookmarkPlus size={16} />
                        Save as go-to meal
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
