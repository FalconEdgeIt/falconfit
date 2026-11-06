"use client";

import FoodFinder from "./FoodFinder";
import { useFoodLog, type NewFood } from "./useFoodLog";

// The dashboard's food logger. It mounts when opened, so the food log only loads if it's used.
export default function QuickFoodLog({ onLogged }: { onLogged: () => void }) {
  const { entries, savedMeals, loaded, error, logFood, deleteSavedMeal } = useFoodLog();

  const handleLog = async (food: NewFood) => {
    const logged = await logFood(food);
    if (logged) onLogged();
    return logged;
  };

  return (
    <div className="mt-6 border border-gray-700 rounded-lg p-4 sm:p-5">
      {error && <p className="text-red-300 text-sm mb-3">{error}</p>}
      {!loaded ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <FoodFinder recentEntries={entries} savedMeals={savedMeals} onLog={handleLog} onDeleteSaved={deleteSavedMeal} />
      )}
      <a href="/nutrition" className="inline-block mt-4 text-sm text-gray-400 hover:text-red-400">
        View full Nutrition page →
      </a>
    </div>
  );
}
