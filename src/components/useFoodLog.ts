"use client";

import { useEffect, useState } from "react";
import { notifyActivity } from "./AchievementToasts";

export type Macros = { calories: number; protein: number; carbs: number; fat: number };
export type NewFood = Macros & { name: string; meal: string; date?: string };
export type FoodEntry = Macros & { id: string; date: string; name: string; meal: string | null };
export type SavedMeal = Macros & { id: string; name: string };

const JSON_HEADERS = { "Content-Type": "application/json" };

// The food log and go-to meals, shared by the Fuel page and the dashboard's quick log
export function useFoodLog() {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([fetch("/api/food"), fetch("/api/saved-meals")])
      .then(async ([foodRes, savedRes]) => {
        if (!foodRes.ok || !savedRes.ok) throw new Error();
        setEntries(await foodRes.json());
        setSavedMeals(await savedRes.json());
      })
      .catch(() => setError("Couldn't load your nutrition data. Check your connection and try refreshing."))
      .finally(() => setLoaded(true));
  }, []);

  const logFood = async (food: NewFood) => {
    try {
      const res = await fetch("/api/food", { method: "POST", headers: JSON_HEADERS, body: JSON.stringify(food) });
      if (!res.ok) throw new Error();
      const entry: FoodEntry = await res.json();
      setEntries((prev) => [entry, ...prev]);
      notifyActivity();
      return true;
    } catch {
      setError("Couldn't add that food. Try again.");
      return false;
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      const res = await fetch(`/api/food/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch {
      setError("Couldn't delete that entry. Try again.");
    }
  };

  const saveMeal = async (meal: Macros & { name: string }) => {
    try {
      const res = await fetch("/api/saved-meals", { method: "POST", headers: JSON_HEADERS, body: JSON.stringify(meal) });
      if (!res.ok) throw new Error();
      const saved: SavedMeal = await res.json();
      setSavedMeals((prev) => [...prev, saved].sort((a, b) => a.name.localeCompare(b.name)));
      return true;
    } catch {
      setError("Couldn't save that meal. Try again.");
      return false;
    }
  };

  const deleteSavedMeal = async (id: string) => {
    try {
      const res = await fetch(`/api/saved-meals/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setSavedMeals((prev) => prev.filter((m) => m.id !== id));
    } catch {
      setError("Couldn't remove that meal. Try again.");
    }
  };

  return { entries, savedMeals, loaded, error, logFood, deleteEntry, saveMeal, deleteSavedMeal };
}
