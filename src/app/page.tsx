"use client";

import { useState, useEffect } from "react";
import Navigation from "../components/Navigation";

type WeightEntry = {
  id: string;
  date: string;
  weight: number;
};

export default function Home() {
  const [workoutCount, setWorkoutCount] = useState(0);
  const [currentWeight, setCurrentWeight] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [historyRes, weightRes] = await Promise.all([
          fetch("/api/history"),
          fetch("/api/weight"),
        ]);

        if (!historyRes.ok || !weightRes.ok) throw new Error();

        const history: { date: string }[] = await historyRes.json();
        const weightLog: WeightEntry[] = await weightRes.json();

        // Count unique calendar days that have at least one logged set
        const uniqueDays = new Set(
          history.map((entry) => new Date(entry.date).toISOString().slice(0, 10))
        );
        setWorkoutCount(uniqueDays.size);

        if (weightLog.length > 0) {
          const sorted = [...weightLog].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          setCurrentWeight(sorted[0].weight);
        }
      } catch {
        setError("Couldn't load your dashboard data.");
      } finally {
        setLoaded(true);
      }
    };

    loadData();
  }, []);

  return (
    <main className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <Navigation />
        <h1 className="text-4xl font-bold mb-6">FalconFit</h1>
        <p className="text-gray-300 mb-8">Your personal fitness tracking dashboard</p>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-semibold">Current Weight</h2>
            <p className="text-3xl mt-2">
              {!loaded ? "..." : currentWeight !== null ? `${currentWeight} lbs` : "No data yet"}
            </p>
          </div>
          <div className="bg-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-semibold">Goal Weight</h2>
            <p className="text-3xl mt-2">200 lbs</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-semibold">Workouts</h2>
            <p className="text-3xl mt-2">{!loaded ? "..." : workoutCount}</p>
          </div>
        </div>
        <div className="mt-8 bg-gray-800 rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="flex gap-4 flex-wrap">
            <button className="bg-blue-600 px-5 py-3 rounded-lg">Start Workout</button>
            <button className="bg-green-600 px-5 py-3 rounded-lg">Log Food</button>
            <button className="bg-purple-600 px-5 py-3 rounded-lg">Supplements</button>
          </div>
        </div>
      </div>
    </main>
  );
}